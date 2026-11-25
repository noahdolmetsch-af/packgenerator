<script>
  /**
   * «Gipfel-Karte mit Lücken» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, idea 2): Auswerten › Gipfelbuch › Karte,
   * #/flow/gipfelbuch/karte. The summits and passes of the app's list as dots on the map of the app (no map service, works
   * offline): the places you have in the summit book strong, the six nearest ones you do not have yet (the gaps, from your home
   * place) lighter, the rest grey. Under the map the gaps with the distance and «Tours toward it» from the tour suggestions
   * (read only when you ask). A tap on a dot shows it; nothing is a goal, nothing is written without a tap.
   */
  import { liveQuery } from 'dexie';
  import { Mountain, MapPin, Check } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import PlaceSheet from '../../lib/flow/PlaceSheet.svelte';
  import HomePlaceSheet from '../../lib/ich/HomePlaceSheet.svelte';
  import NeulandMap from '../../lib/neuland/NeulandMap.svelte';
  import GipfelTiles from '../../lib/flow/GipfelTiles.svelte';
  import { loadBase } from '../../lib/neuland/load.js';
  import { db } from '../../lib/db.js';
  import { GB_KEY, bookOf, addPlace } from '../../lib/gipfelbuch.js';
  import { loadCatalog, COLLECTIONS, LISTS_KEY, listsOf } from '../../lib/gipfelkatalog.js';
  import { filterCatalog, mapRows, gapsList, toursToward } from '../../lib/gipfelkarte.js';
  import { homeOf } from '../../lib/dayride.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => {
    const [row, home, lrow] = await Promise.all([db.settings.get(GB_KEY), db.settings.get('homePlace'), db.settings.get(LISTS_KEY)]);
    return { book: bookOf(row?.value), home: homeOf(home?.value), lists: listsOf(lrow?.value) };
  });
  const data = $derived($q);
  const book = $derived(data?.book ?? bookOf(null));
  const home = $derived(data?.home ?? null);
  const lists = $derived(data?.lists ?? listsOf(null));

  let catalog = $state([]);
  let bg = $state.raw({});
  $effect(() => {
    loadCatalog().then((c) => (catalog = c)).catch(() => {});
    Promise.all([loadBase('cantons'), loadBase('countries'), loadBase('lakes')])
      .then(([cantons, countries, lakes]) => (bg = { cantons, countries, lakes: lakes.filter((l) => l.rings) }))
      .catch(() => {});
  });

  let filter = $state('all');
  // «Um dich» (Noah 24.11.2026 «1-5a»): with a home place the map starts on its surroundings
  let tilesFailed = $state(false);
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  $effect(() => {
    const up = () => (online = navigator.onLine);
    window.addEventListener('online', up);
    window.addEventListener('offline', up);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', up);
    };
  });
  let viewSel = $state(null);
  const view = $derived(viewSel ?? (home ? 'near' : 'ch'));
  const views = $derived([...(home ? [{ key: 'near', name: t('Around you') }] : []), { key: 'ch', name: t('Switzerland') }, { key: 'alps', name: t('Alps') }]);
  let sel = $state(null);
  let sheet = $state(null); // { sugg }
  let homeOpen = $state(false);
  let tours = $state({}); // key → [{ tour, away }]
  let busy = $state('');
  let msg = $state('');
  let undo = $state(null);

  const chips = $derived([
    { id: 'all', label: t('All') },
    { id: 'peak', label: t('Summits') },
    { id: 'pass', label: t('Passes') },
    ...COLLECTIONS.filter((c) => !lists.hidden.includes(c.id)).map((c) => ({ id: c.id, label: t(c.name) })),
  ]);
  const shown = $derived(filterCatalog(catalog, filter));
  const map = $derived(mapRows(shown, book, home));
  const rows = $derived(map.rows);
  const gaps = $derived(gapsList(rows));
  const picked = $derived(rows.find((r) => r.id === sel) ?? null);
  const points = $derived(rows.map((r) => ({ id: r.id, lat: r.it.lat, lon: r.it.lon, st: r.st === 'have' ? 'year' : r.st === 'near' ? 'old' : '', name: r.it.name })));
  // a wide screen gets a wide map, a phone a nearly square one
  const ratio = typeof matchMedia === 'function' && matchMedia('(min-width: 1000px)').matches ? 1.35 : 0.95;
  // «Um dich» zooms to the open places near you: wide enough for the farthest of them, never tighter than 0.3° or wider than 0.8°
  const span = $derived.by(() => {
    if (!home) return 0.62;
    const h = { lat: Number(home.lat), lon: Number(home.lon) };
    const k = Math.cos((h.lat * Math.PI) / 180);
    const far = Math.max(0, ...rows.filter((r) => r.st === 'near').map((r) => Math.max(Math.abs(r.it.lat - h.lat), (Math.abs(r.it.lon - h.lon) * k) / ratio)));
    return Math.min(0.8, Math.max(0.3, far * 1.35));
  });
  const km = (v) => (v == null ? '' : v < 10 ? `${num(Math.round(v * 10) / 10)} km` : `${num(Math.round(v))} km`);
  const kmNum = (v) => (v == null ? '' : v < 10 ? num(Math.round(v * 10) / 10) : num(Math.round(v)));
  const openNear = $derived(gaps.filter((g) => g.km != null).length);
  const m = (v) => (v == null ? '' : `${num(v)} m`);

  async function askTours(r) {
    busy = r.id;
    msg = '';
    try {
      const all = (await import('../../lib/vorschlaege/data/netz.js')).default;
      tours = { ...tours, [r.id]: toursToward(r.it, all) };
    } catch {
      msg = t('The tour suggestions could not be loaded. Please check the connection and try again.');
    }
    busy = '';
  }
  const wasThere = (r) =>
    (sheet = { sugg: { name: r.it.name, sport: r.it.kind === 'pass' ? 'bike' : 'hike', ele: r.it.m ?? null, day: today, lat: r.it.lat, lon: r.it.lon, ref: 'hand', hm: null } });
  async function onsave(v) {
    const src = sheet.sugg;
    const before = book;
    const nb = addPlace(book, { ...v, lat: src.lat, lon: src.lon }, { day: v.day, ref: 'hand' });
    undo = { text: t('«{name}» is in the summit book', { name: v.name }), book: before };
    await db.settings.put({ key: GB_KEY, value: JSON.parse(JSON.stringify(nb)) });
  }
  const undoNow = async () => {
    if (!undo) return;
    await db.settings.put({ key: GB_KEY, value: JSON.parse(JSON.stringify(undo.book)) });
    undo = null;
  };
</script>

{#snippet card(r)}
  <li class="gkrow" data-gk-row={r.id}>
    {#if r.km != null}<span class="dist" aria-hidden="true"><b class="num">{kmNum(r.km)}</b><small>km</small></span>{/if}
    <div class="who">
      <b>{r.it.name}</b>
      <small>{[r.it.kind === 'pass' ? t('Pass') : t('Summit'), m(r.it.m)].filter(Boolean).join(' · ')}</small>
      {#if r.km != null}<span class="sr">{t('{km} as the crow flies', { km: km(r.km) })}</span>{/if}
    </div>
    <div class="acts">
      {#if r.place}
        <a class="go" href="#/flow/gipfelbuch/{encodeURIComponent(r.place.id)}">{t('Open the page of this place')}</a>
      {:else}
        <button type="button" class="go" disabled={busy === r.id} onclick={() => askTours(r)} data-gk-tours aria-label={t('Tours toward it')}>{t('Tours')} ›</button>
        <button type="button" class="tick" onclick={() => wasThere(r)} data-gk-there aria-label={t('I was there')} title={t('I was there')}><Check size={20} aria-hidden="true" /></button>
      {/if}
    </div>
    {#if tours[r.id]}
      <ul class="tl" data-gk-tourlist={r.id}>
        {#each tours[r.id] as x (x.tour.id)}
          <li><a href="#/trips/vorschlaege/{encodeURIComponent(x.tour.id)}">{x.tour.title}</a> <small class="num">{[x.tour.km != null ? `${num(x.tour.km)} km` : '', x.tour.up != null ? `${num(x.tour.up)} Hm` : '', x.away < 0.2 ? t('leads over it') : t('passes {m} m away', { m: num(Math.round(x.away * 1000)) })].filter(Boolean).join(' · ')}</small></li>
        {:else}
          <li class="none">{t('No tour of the suggestions passes there.')} <a href="#/trips/vorschlaege">{t('Tour suggestions')}</a></li>
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}

<div class="hob gk">
  <header class="ph">
    <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }, { href: '#/flow/gipfelbuch', label: t('Summit book') }]} here={t('Map')} />
    <PageHead title={t('Summit map')} text={!catalog.length ? '' : home ? t('{have} you have · {open} open near you', { have: map.have, open: openNear }) : t('{have} you have', { have: map.have })} />
  </header>

  {#if data}
    <nav class="chips" aria-label={t('Filter the map')}>
      {#each chips as c (c.id)}<button type="button" class="chip" aria-pressed={filter === c.id} onclick={() => ((filter = c.id), (sel = null))} data-gk-chip={c.id}>{c.label}</button>{/each}
    </nav>

    {#if undo}<p class="undo" role="status">{undo.text} <button type="button" class="link" onclick={undoNow}>{t('Undo')}</button></p>{/if}

    {#if !catalog.length}
      <p class="sub" role="status">{t('Loading the map …')}</p>
    {:else if !rows.length}
      <Empty icon={Mountain} level={2} title={t('Nothing on the map for this filter')} text={t('Pick another filter above.')} action={{ label: t('Show everything'), onclick: () => (filter = 'all') }} />
    {:else}
      <div class="lay">
        <div class="mapbox">
          {#if view === 'near' && home && online && !tilesFailed}
            <GipfelTiles center={{ lat: Number(home.lat), lon: Number(home.lon) }} {span} {ratio} {points} selId={sel} title={t('Summit map')} onpick={(id) => (sel = id)} onfail={() => (tilesFailed = true)} />
          {:else}
          <NeulandMap {view} {points} {bg} big dotLabels={view === 'near'} {span} {ratio} labelSize={ratio > 1 ? 2.1 : 3.4} selId={sel} center={home ? { lat: Number(home.lat), lon: Number(home.lon) } : null} title={t('Summit map')} onpick={(id) => (sel = id)} />
          {/if}
          <div class="vsw" data-gk-view><Seg small full={false} label={t('Map section')} value={view} onchange={(v) => (viewSel = v)} options={views} /></div>
          <p class="legend" data-gk-legend>
            <span class="mk"><span class="k have" aria-hidden="true"></span>{t('you have it')}</span>
            <span class="mk"><span class="k near" aria-hidden="true"></span>{t('open, near you')}</span>
          </p>
        </div>
        <div class="side">
          {#if picked}
            <section class="gkc" aria-labelledby="gk-sel-h" data-gk-picked>
              <h2 id="gk-sel-h">{picked.it.name}</h2>
              <ul>{@render card(picked)}</ul>
            </section>
          {/if}
          <section class="gkc" aria-labelledby="gk-gap-h" data-gk-gaps>
            <h2 id="gk-gap-h">{home ? t('Open near you') : t('The highest ones you do not have yet')}</h2>
            {#if !home}
              <p class="sub">{t('Set your home place and the list shows what is nearest to you.')} <button type="button" class="link" onclick={() => (homeOpen = true)} data-gk-home><MapPin size={14} aria-hidden="true" /> {t('Set home place')}</button></p>
            {/if}
            {#if msg}<p class="err" role="alert">{msg}</p>{/if}
            {#if gaps.length}
              <ul>{#each gaps as r (r.id)}{@render card(r)}{/each}</ul>
            {:else}
              <p class="sub" data-gk-nogaps>{t('You have all of them on this map. Pick another filter for more.')}</p>
            {/if}
          </section>
        </div>
      </div>
    {/if}

    <p class="next">{t('Next:')} <a href="#/flow/gipfelbuch">{t('All places')}</a> · <a href="#/trips/vorschlaege">{t('Tour suggestions')}</a> · <a href="#/neuland">{t('New ground')}</a></p>
  {/if}
</div>

{#if sheet}
  {#key sheet}
    <PlaceSheet title={t('Into the summit book')} hint={t('Height and position come from the list. Pick the day.')} place={{ ...sheet.sugg }} withDay={true} others={[]} {onsave} onclose={() => (sheet = null)} />
  {/key}
{/if}
{#if homeOpen}<HomePlaceSheet current={null} onclose={() => (homeOpen = false)} />{/if}

<style>
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  h2 {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .sub,
  .undo,
  .next,
  .err {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .next a {
    color: var(--ink);
  }
  .err {
    color: var(--bad);
  }
  .chips {
    display: flex;
    gap: var(--sp-2);
    overflow-x: auto;
    min-width: 0;
    padding-bottom: 2px;
  }
  .chip {
    flex: none;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-pill);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
  }
  .mapbox {
    position: relative;
    min-width: 0;
  }
  .vsw {
    position: absolute;
    top: var(--sp-2);
    right: var(--sp-2);
    max-width: calc(100% - 16px);
  }
  .legend {
    position: absolute;
    bottom: var(--sp-2);
    left: var(--sp-2);
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-2);
    margin: 0;
    font-size: var(--fs-small);
  }
  .mk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--paper);
    color: var(--ink-2);
  }
  .k {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: var(--r-pill);
    box-sizing: border-box;
  }
  .k.have {
    background: var(--accent);
  }
  .k.near {
    border: 2px solid var(--accent);
    background: var(--paper);
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .gkc {
    padding: var(--sp-4);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gkrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .gkrow:first-child {
    border-top: 0;
  }
  .dist {
    display: flex;
    flex-direction: column;
    flex: none;
    align-items: center;
    width: 40px;
    color: var(--accent);
    line-height: 1.2;
  }
  .dist small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .who {
    flex: 1 1 120px;
    min-width: 0;
  }
  .who b {
    display: block;
    overflow-wrap: break-word;
  }
  .who small,
  .tl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .go {
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--accent);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
    text-decoration: none;
  }
  .tick {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-pill);
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .tl {
    flex: 1 1 100%;
    padding: var(--sp-1) 0 0 var(--sp-3);
    font-size: var(--fs-small);
  }
  .tl li {
    padding: 2px 0;
  }
  .tl a {
    color: var(--ink);
  }
  .none {
    color: var(--ink-2);
  }
  .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
