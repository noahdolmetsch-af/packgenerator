<script>
  /**
   * «Brunnen und Velo-Werkstätten an der Strecke» (Noah 19.10.2026, built without mockups): inside the
   * route card on the pack page. Nothing loads by itself: a tap on «Search fountains and workshops»
   * asks OpenStreetMap (Overpass, free, no key) once; the answer stays on the device and is there
   * offline. Chips filter by kind; each row «km 23 · Brunnen · name» opens the place on
   * openstreetmap.org. Names from OSM are shown as they are (never through t()).
   *
   * Props: trip (with route.line), fetcher (for tests).
   */
  import { db } from '../db.js';
  import { loadPois, readPois, fitsRoute, countKinds, osmUrl, AROUND_M, MAX_POIS } from './pois.js';
  import ChipChoice from '../ui/ChipChoice.svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { Droplet, Wrench, MapPin, RefreshCw, ExternalLink } from '@lucide/svelte';

  let { trip, fetcher = undefined } = $props();

  const FIRST = 20;
  let cache = $state(null);
  let busy = $state(false);
  let failed = $state(false);
  let all = $state(false);
  let kinds = $state(['water', 'shop', 'repair']);
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  const hid = `rp-${Math.random().toString(36).slice(2, 8)}`;

  // read what is stored for this trip (no network)
  $effect(() => {
    const id = trip?.id;
    cache = null;
    failed = false;
    all = false;
    if (!id) return;
    readPois(db, id).then((c) => {
      if (trip?.id === id) cache = c;
    });
  });

  const fits = $derived(fitsRoute(cache, trip));
  const items = $derived(fits ? cache.items : null);
  const count = $derived(countKinds(items));
  const shown = $derived((items ?? []).filter((p) => kinds.includes(p.kind)));
  const visible = $derived(all ? shown : shown.slice(0, FIRST));
  const options = $derived([
    { value: 'water', label: `${t('Water|poi')} ${num(count.water)}` },
    { value: 'shop', label: `${t('Workshop|poi')} ${num(count.shop)}` },
    { value: 'repair', label: `${t('Pump|poi')} ${num(count.repair)}` },
  ]);
  const KIND = { water: () => t('Fountain|poi'), shop: () => t('Bike shop|poi'), repair: () => t('Pump or repair stand|poi') };
  const ICON = { water: Droplet, shop: Wrench, repair: MapPin };
  const when = (iso) => new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  const kmOf = (km) => num(km < 10 ? Math.round(km * 10) / 10 : Math.round(km));

  async function search(force = false) {
    if (busy || !trip?.id) return;
    online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    busy = true;
    failed = false;
    try {
      const r = await loadPois(db, $state.snapshot(trip), { ...(fetcher ? { fetcher } : {}), force });
      failed = !!r?.error;
      if (r?.items) cache = { hash: r.hash, fetchedAt: r.fetchedAt, items: r.items, cut: r.cut };
    } finally {
      busy = false;
    }
  }
</script>

<div class="rp" aria-labelledby={hid} role="region" data-route-pois>
  <div class="rp-head">
    <h3 id={hid} class="rp-title">{t('Water and bike workshops on the way')}</h3>
    {#if items}
      <button class="rp-re" type="button" onclick={() => search(true)} disabled={busy} aria-label={t('Load again')} title={t('Load again')}>
        <RefreshCw size={16} aria-hidden="true" class={busy ? 'rp-spin' : ''} />
      </button>
    {/if}
  </div>

  {#if !items}
    <p class="rp-quiet">{t('Searches OpenStreetMap for drinking fountains, bike shops and pumps up to {m} m beside your route. Afterwards the list is there offline too.', { m: AROUND_M })}</p>
    {#if cache && !fits}<p class="rp-quiet">{t('The route has changed since the last search.')}</p>{/if}
    <button class="rp-go" type="button" onclick={() => search(!!cache)} disabled={busy}>
      {busy ? t('Searching along the route …') : t('Search fountains and workshops')}
    </button>
    {#if failed}
      <p class="rp-warn" role="alert">
        {online ? t('The map service did not answer right now. It is often busy; try again in a minute.') : t('Offline. The search needs the internet once; afterwards the list stays on this device.')}
      </p>
    {/if}
  {:else}
    <p class="rp-count num" aria-live="polite">
      {items.length ? tn(items.length, '{n} place within {m} m of the route', '{n} places within {m} m of the route', { m: AROUND_M }) : t('Nothing found within {m} m of the route.', { m: AROUND_M })}
      {#if cache.cut}<span> · {t('the first {n} shown', { n: MAX_POIS })}</span>{/if}
    </p>
    {#if items.length}
      <ChipChoice multiple options={options} bind:value={kinds} aria-label={t('Kinds of places|poi')} />
      {#if !shown.length}
        <p class="rp-quiet">{t('Choose at least one kind above.')}</p>
      {:else}
        <ul class="rp-list">
          {#each visible as p (p.id)}
            {@const Icon = ICON[p.kind]}
            <li>
              <a class="rp-row" href={osmUrl(p.id)} target="_blank" rel="noopener noreferrer" data-kind={p.kind}>
                <span class="rp-ic {p.kind}" aria-hidden="true"><Icon size={16} /></span>
                <span class="rp-txt">
                  <span class="rp-main"><b class="num">km {kmOf(p.km)}</b>{' · '}{KIND[p.kind]()}{#if p.name}{' · '}<span class="rp-name">{p.name}</span>{/if}</span>
                  {#if p.off >= 50 || p.open}
                    <span class="rp-meta">{[p.off >= 50 ? t('{m} m beside the route', { m: num(Math.round(p.off / 10) * 10) }) : '', p.open].filter(Boolean).join(' · ')}</span>
                  {/if}
                </span>
                <ExternalLink size={14} aria-hidden="true" class="rp-ext" />
              </a>
            </li>
          {/each}
        </ul>
        {#if shown.length > FIRST}
          <button class="rp-more" type="button" onclick={() => (all = !all)} aria-expanded={all}>
            {all ? t('Show fewer') : t('Show all {n}', { n: num(shown.length) })}
          </button>
        {/if}
      {/if}
    {/if}
    {#if failed}
      <p class="rp-warn" role="alert">{online ? t('Could not refresh; the list is from {when}.', { when: when(cache.fetchedAt) }) : t('Offline: the list is from {when}.', { when: when(cache.fetchedAt) })}</p>
    {/if}
    <p class="rp-src">{t('Data: OpenStreetMap, as of {when}. Opening hours and water can change; check on the spot.', { when: when(cache.fetchedAt) })}</p>
  {/if}
</div>

<style>
  .rp {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .rp-head {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
  }
  .rp-title {
    flex: 1;
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .rp-re {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    border-radius: var(--r-ctl);
    cursor: pointer;
  }
  .rp-re:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .rp-re:focus-visible,
  .rp-go:focus-visible,
  .rp-more:focus-visible,
  .rp-row:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .rp-re :global(.rp-spin) {
    animation: rp-spin 1s linear infinite;
  }
  @keyframes rp-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .rp-re :global(.rp-spin) {
      animation: none;
    }
  }
  .rp-go,
  .rp-more {
    justify-self: start;
    min-height: 44px;
    max-width: 100%;
    padding: 0 var(--sp-4);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .rp-go:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .rp-more {
    border-style: dashed;
  }
  .rp-quiet,
  .rp-count {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rp-warn {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .rp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .rp-list li + li {
    border-top: 1px solid var(--line);
  }
  .rp-row {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: var(--sp-1) 0;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .rp-ic {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rp-ic.water {
    background: var(--info-soft);
  }
  .rp-ic.shop {
    background: var(--ok-soft);
  }
  .rp-txt {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .rp-main,
  .rp-meta {
    overflow-wrap: break-word;
  }
  .rp-name {
    color: var(--ink-2);
  }
  .rp-meta {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .rp-row :global(.rp-ext) {
    flex: none;
    color: var(--ink-3);
  }
  .rp-src {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
