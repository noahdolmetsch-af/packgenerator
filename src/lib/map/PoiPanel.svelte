<script>
  /**
   * «Orte auf der Karte» (Noah 19.10.2026): switch kinds of places on with chips (water, shopping,
   * food, petrol, bike, repair, hotel, camping, shelter, WC, pharmacy, hospital, ATM, station, laundry,
   * viewpoint) and see them on the map and in a «Places» list, nearest first.
   *
   * Where: «Around me» (2 / 5 / 10 / 20 km), «Here» (the visible map, «Search here» like Google Maps)
   * or «Along the route» (when there is a line; what was kept with the offline strip works offline).
   * One query per tap (debounced), answers kept on this device (poisearch.js loadPlaces). The chips,
   * the mode and the radius are remembered (settings 'poi-search').
   *
   * Props: center ({ lat, lon } | null: where you are), bounds ({ s, w, n, e } | null: the visible
   * map), line ([[lat, lon]] | null: the route), profile ([[km, m]] | null: for the detour climb),
   * onpoints (places → void: the places of the switched-on kinds, each with d = distanceOf, for the
   * map symbols), tripId (the route's cache), fetcher (tests only).
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { RefreshCw, Search, Navigation, Share2, StarOff, ChevronDown } from '@lucide/svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import { navLinks } from '../live/live-lib.js';
  import { db } from '../db.js';
  import { OWN_KEY, listOf, ownLabel } from './ownpoints.js';
  import { CATEGORIES, RADII, MAX_PLACES, MAX_VIEW_KM, loadPlaces, withDistance, viewMoved, debounce, boundsKm, shareText, shareOrCopy, toggleStar, distanceOf, ptsOf } from './poisearch.js';
  import { prefsQuery, savePrefs, placeStore } from './poiprefs.js';
  import { iconOf } from './poiicons.js';
  import { catText, titleOf, kindText, distText, openText } from './poitext.js';
  import PoiDetail from './PoiDetail.svelte';

  let { center = null, bounds = null, line = null, profile = null, onpoints = undefined, tripId = null, fetcher = undefined } = $props();

  const hasLine = $derived(Array.isArray(line) && line.length >= 2);
  const prefsQ = prefsQuery();
  const ownQ = liveQuery(async () => listOf((await db.settings.get(OWN_KEY))?.value));

  let on = $state([]);
  let mode = $state('around');
  let radiusKm = $state(10);
  let ready = $state(false);
  // read the remembered choice once
  $effect(() => {
    const p = $prefsQ;
    if (!p || untrack(() => ready)) return;
    on = p.on;
    mode = p.mode;
    radiusKm = p.radiusKm;
    ready = true;
  });
  const modeNow = $derived(mode === 'route' && !hasLine ? 'around' : mode);

  let res = $state(null); // loadPlaces answer
  let busy = $state(false);
  let lastBounds = $state(null);
  let lastCenter = null;
  let seq = 0;
  let listOpen = $state(true);
  let savedOpen = $state(false);
  let showAll = $state(false);
  let picked = $state(null);
  let said = $state('');
  const FIRST = 30;
  const hid = `pp-${Math.random().toString(36).slice(2, 8)}`;

  const remember = () => savePrefs((v) => ({ ...v, on: $state.snapshot(on), mode, radiusKm })).catch(() => {});

  async function search({ force = false } = {}) {
    if (!on.length) {
      res = null;
      return;
    }
    const q = { mode: modeNow, keys: $state.snapshot(on), center: center ? { lat: center.lat, lon: center.lon } : null, radiusKm, bounds: bounds ? { ...bounds } : null, line: hasLine ? $state.snapshot(line) : null, tripId };
    if (q.mode === 'around' && !q.center) {
      res = { list: [], at: null, error: 'nohere' };
      return;
    }
    if (q.mode === 'here' && !q.bounds) {
      res = { list: [], at: null, error: 'nomap' };
      return;
    }
    const my = ++seq;
    busy = true;
    try {
      const r = await loadPlaces(q, { store: placeStore, force, online: typeof navigator === 'undefined' || navigator.onLine !== false, ...(fetcher ? { fetcher } : {}) });
      if (my !== seq) return;
      res = r;
      if (q.mode === 'here' && !r.error) lastBounds = q.bounds;
      if (q.mode === 'around') lastCenter = q.center;
    } finally {
      if (my === seq) busy = false;
    }
  }
  const later = debounce(() => search(), 600);

  // chips, mode, radius: one (debounced) search; «Here» waits for «Search here»
  $effect(() => {
    if (!ready) return;
    void [on.length, on.join(), modeNow, radiusKm];
    untrack(() => {
      if (modeNow === 'here' && !lastBounds) {
        res = null;
        return;
      }
      later();
    });
  });
  // around: search again only when you moved more than a quarter of the radius
  $effect(() => {
    const c = center;
    if (!ready || !c) return;
    untrack(() => {
      if (modeNow !== 'around' || !on.length) return;
      if (!lastCenter || distanceOf(c, lastCenter).km >= radiusKm / 4) later();
    });
  });

  function toggle(key) {
    on = on.includes(key) ? on.filter((k) => k !== key) : [...on, key];
    remember();
  }
  function setMode(m) {
    mode = m;
    if (m === 'here') lastBounds = null;
    remember();
  }
  function setRadius(k) {
    radiusKm = Number(k);
    remember();
  }

  const from = $derived(center ? { lat: center.lat, lon: center.lon } : null);
  const places = $derived(res?.list?.length ? withDistance(res.list, from, modeNow === 'route' ? line : null) : []);
  $effect(() => {
    const list = places;
    untrack(() => onpoints?.(on.length ? list : []));
  });
  const shown = $derived(showAll ? places : places.slice(0, FIRST));
  const moved = $derived(modeNow === 'here' && viewMoved(lastBounds, bounds));
  const tooBig = $derived(modeNow === 'here' && !!bounds && boundsKm(bounds) > MAX_VIEW_KM);
  const when = (ms) => (ms ? new Date(ms).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

  const status = $derived.by(() => {
    if (!on.length) return { kind: 'quiet', text: t('Tap a kind above to see those places on the map.|poi') };
    if (busy) return { kind: 'busy', text: t('Loading places from OpenStreetMap …|poi') };
    if (modeNow === 'here' && !res) return { kind: 'quiet', text: tooBig ? t('Zoom in a little, then tap «Search here».|poi') : t('Move the map, then tap «Search here».|poi') };
    if (!res) return null;
    const e = res.error;
    if (e === 'nohere') return { kind: 'warn', text: t('Where you are is not known yet. Allow the location, or use «Here» on the map.|poi') };
    if (e === 'nomap') return { kind: 'warn', text: t('The map is not ready yet.|poi') };
    if (e === 'zoom') return { kind: 'warn', text: t('The map area is too big. Zoom in a little, then tap «Search here».|poi') };
    const count = res.list.length ? tn(res.list.length, '{n} place found', '{n} places found', {}) : t('Nothing found here.|poi');
    const asOf = res.at ? t('as of {when}|poi', { when: when(res.at) }) : '';
    if (e === 'offline') return { kind: res.stale ? 'warn' : 'bad', text: res.stale ? `${t('Offline: the kept places, as of {when}.|poi', { when: when(res.at) })} ${count}` : t('Offline and nothing kept for here. Search once with internet.|poi') };
    if (e === 'busy' || e === 'failed') return { kind: 'bad', retry: true, text: res.stale ? t('OpenStreetMap is busy; showing the kept places, as of {when}.|poi', { when: when(res.at) }) : t('OpenStreetMap is busy right now. Try again in a minute.|poi') };
    return { kind: 'ok', text: [count, res.cut ? t('the nearest {n}|poi', { n: num(MAX_PLACES) }) : '', asOf].filter(Boolean).join(' · ') };
  });

  const modes = $derived([{ key: 'around', name: t('Around me|poi') }, { key: 'here', name: t('Here|poi') }, ...(hasLine ? [{ key: 'route', name: t('Along the route|poi') }] : [])]);
  const radii = RADII.map((r) => ({ key: String(r), name: t('{km} km', { km: r }) }));

  // saved places: your own points and the starred ones
  const starred = $derived($prefsQ?.starred ?? []);
  const own = $derived($ownQ ?? []);
  const savedCount = $derived(starred.length + own.length);
  async function unstar(p) {
    await savePrefs((v) => toggleStar(v, p));
  }
  async function shareAll() {
    const list = [...own.map((p) => ({ ...p, name: ownLabel(p, t), kind: '' })), ...starred];
    const text = shareText(list, (p) => (p.kind ? kindText(p) : ''), t('My places|poi'));
    const r = await shareOrCopy({ title: t('My places|poi'), text });
    said = r === 'copied' ? t('Copied. Paste it into a message.|poi') : r === 'failed' ? t('Could not share. Copy the place from the map app instead.|poi') : '';
  }
  const pts = $derived(ptsOf(line));
</script>

<section class="pp" aria-labelledby={hid} data-poi-panel>
  <h3 id={hid} class="pp-title">{t('Places on the map|poi')}</h3>

  <div class="pp-chips" role="group" aria-label={t('Kinds of places|poi')} data-poi-chips>
    {#each CATEGORIES as c (c.key)}
      {@const Icon = iconOf(c.key)}
      <button type="button" class="pp-chip" aria-pressed={on.includes(c.key)} onclick={() => toggle(c.key)} data-poi-chip={c.key}>
        <Icon size={16} aria-hidden="true" /><span>{catText(c.key)}</span>
      </button>
    {/each}
  </div>

  <div class="pp-where">
    <Seg options={modes} value={modeNow} onchange={setMode} label={t('Where to search|poi')} full={false} small />
    {#if modeNow === 'around'}
      <Seg options={radii} value={String(radiusKm)} onchange={setRadius} label={t('Radius|poi')} full={false} small />
    {/if}
  </div>
  {#if modeNow === 'here' && on.length}
    <button type="button" class="pp-here" onclick={() => search({ force: true })} disabled={busy || tooBig || !bounds || (!moved && !!res && !res.error)} data-poi-search-here>
      <Search size={16} aria-hidden="true" />{t('Search here|poi')}
    </button>
  {/if}

  {#if status}
    <p class="pp-status pp-{status.kind}" role="status" aria-live="polite" data-poi-status={status.kind}>
      <span>{status.text}</span>
      {#if status.retry || (status.kind === 'ok' && res?.at)}
        <button type="button" class="pp-re" onclick={() => search({ force: true })} disabled={busy} data-poi-retry>
          <RefreshCw size={14} aria-hidden="true" />{status.retry ? t('Try again') : t('Load again')}
        </button>
      {/if}
    </p>
  {/if}

  {#if places.length}
    <div class="pp-fold">
      <button type="button" class="pp-fh" aria-expanded={listOpen} onclick={() => (listOpen = !listOpen)} data-poi-list-toggle>
        <span>{t('Places|poi')} <span class="num">{num(places.length)}</span></span><ChevronDown size={18} aria-hidden="true" class={listOpen ? 'pp-up' : ''} />
      </button>
      {#if listOpen}
        <ul class="pp-list" data-poi-list>
          {#each shown as p (p.id)}
            {@const Icon = iconOf(p.kind)}
            {@const o = openText(p.hours)}
            {@const nav = navLinks(p)}
            <li class="pp-row" data-poi-row={p.kind}>
              <button type="button" class="pp-open" onclick={() => (picked = picked?.id === p.id ? null : p)} aria-expanded={picked?.id === p.id}>
                <span class="pp-ic" aria-hidden="true"><Icon size={16} /></span>
                <span class="pp-txt">
                  <span class="pp-name">{titleOf(p)}</span>
                  <span class="pp-meta"><span class="num">{distText(p.d)}</span>{#if o.text}{' · '}<span class="pp-o-{o.state}">{o.text}</span>{/if}</span>
                </span>
              </button>
              <a class="pp-nav" href={nav.google} target="_blank" rel="noopener noreferrer" aria-label={t('Navigate with Google Maps to {name}|poi', { name: titleOf(p) })}><Navigation size={16} aria-hidden="true" /><span>G</span></a>
              <a class="pp-nav" href={nav.osmand} target="_blank" rel="noopener noreferrer" aria-label={t('Navigate with OsmAnd to {name}|poi', { name: titleOf(p) })}><Navigation size={16} aria-hidden="true" /><span>O</span></a>
              {#if picked?.id === p.id}
                <div class="pp-detail"><PoiDetail place={p} {from} line={modeNow === 'route' || pts.length ? line : null} {profile} onclose={() => (picked = null)} /></div>
              {/if}
            </li>
          {/each}
        </ul>
        {#if places.length > FIRST}
          <button type="button" class="pp-more" onclick={() => (showAll = !showAll)} aria-expanded={showAll}>{showAll ? t('Show fewer') : t('Show all {n}', { n: num(places.length) })}</button>
        {/if}
      {/if}
    </div>
  {/if}

  <div class="pp-fold">
    <button type="button" class="pp-fh" aria-expanded={savedOpen} onclick={() => (savedOpen = !savedOpen)} data-poi-saved-toggle>
      <span>{t('Saved places|poi')} <span class="num">{num(savedCount)}</span></span><ChevronDown size={18} aria-hidden="true" class={savedOpen ? 'pp-up' : ''} />
    </button>
    {#if savedOpen}
      {#if !savedCount}
        <p class="pp-hint">{t('Tap a place, then «Save». Your own points on the map show here too.|poi')}</p>
      {:else}
        <ul class="pp-list" data-poi-saved>
          {#each own as p (p.id)}
            <li class="pp-row pp-plain"><span class="pp-txt"><span class="pp-name">{ownLabel(p, t)}</span><span class="pp-meta">{t('Own point|poi')}{#if from}{' · '}<span class="num">{distText(distanceOf(p, from))}</span>{/if}</span></span></li>
          {/each}
          {#each starred as p (p.id)}
            {@const Icon = iconOf(p.kind)}
            <li class="pp-row pp-plain" data-poi-saved-row>
              <span class="pp-ic" aria-hidden="true"><Icon size={16} /></span>
              <span class="pp-txt"><span class="pp-name">{titleOf(p)}</span><span class="pp-meta">{kindText(p)}{#if from}{' · '}<span class="num">{distText(distanceOf(p, from))}</span>{/if}</span></span>
              <button type="button" class="pp-nav" onclick={() => unstar(p)} aria-label={t('Remove «{name}» from the saved places|poi', { name: titleOf(p) })} data-poi-unstar><StarOff size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
        <button type="button" class="pp-here" onclick={shareAll} data-poi-share-all><Share2 size={16} aria-hidden="true" />{t('Share the list|poi')}</button>
        {#if said}<p class="pp-hint" role="status">{said}</p>{/if}
      {/if}
    {/if}
  </div>

  <p class="pp-hint">{t('Data from OpenStreetMap, free. What was loaded along the route works offline.|poi')}</p>
</section>

<style>
  .pp {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pp-title {
    margin: 0;
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .pp-chips {
    display: flex;
    gap: var(--sp-2);
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    padding-bottom: 2px;
    scroll-snap-type: x proximity;
  }
  .pp-chips::-webkit-scrollbar {
    display: none;
  }
  .pp-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    flex: none;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    white-space: nowrap;
    scroll-snap-align: start;
  }
  .pp-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .pp-where {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pp-here,
  .pp-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0 var(--sp-4);
    border: 1px solid var(--brand);
    border-radius: var(--r-ctl);
    background: var(--brand);
    color: var(--brand-ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
  }
  .pp-more {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--line-strong);
  }
  .pp-here:disabled {
    opacity: 0.5;
  }
  .pp-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-1) var(--sp-2);
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pp-status.pp-warn {
    color: var(--warn);
  }
  .pp-status.pp-bad {
    color: var(--bad);
  }
  .pp-re {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: underline;
  }
  .pp-fold {
    border-top: 1px solid var(--line);
  }
  .pp-fh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-align: left;
  }
  :global(.pp-up) {
    transform: rotate(180deg);
  }
  .pp-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pp-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px 44px;
    align-items: center;
    gap: var(--sp-1);
    border-top: 1px solid var(--line);
  }
  .pp-plain {
    grid-template-columns: auto minmax(0, 1fr) 44px;
    min-height: 44px;
  }
  .pp-plain:not(:has(.pp-ic)) {
    grid-template-columns: minmax(0, 1fr);
  }
  .pp-open {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-width: 0;
    min-height: 44px;
    padding: var(--sp-1) 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    text-align: left;
    font: inherit;
  }
  .pp-ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
  }
  .pp-txt {
    display: grid;
    min-width: 0;
  }
  .pp-name {
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .pp-meta {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .pp-o-open {
    color: var(--ok);
  }
  .pp-o-closed {
    color: var(--bad);
  }
  .pp-nav {
    display: grid;
    grid-auto-flow: column;
    place-items: center;
    place-content: center;
    gap: 2px;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: transparent;
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1 var(--font-body);
    text-decoration: none;
  }
  .pp-detail {
    grid-column: 1 / -1;
    padding-bottom: var(--sp-2);
  }
  .pp-hint {
    margin: 0;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
</style>
