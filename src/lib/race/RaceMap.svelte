<script>
  import OfflineBox from '../map/OfflineBox.svelte';
  /**
   * Paket U2 «Karte» (#/race/<id>/map, Noah 19.10.2026 «eine Karte, wo die Strecke abgebildet ist, mit
   * verschiedenen Quellen und Layern … POI filter by zoom, eigene Notizen/Punkte für alle Touren,
   * Höhenprofil unter der Karte, Wetter/Wind/Nacht, Untergrund»). Four boxes:
   * - map-main: the route in its sector colours, the stops (a chip per kind), the beds of your plan, the
   *   depot, your own points, the ground and the layers;
   * - map-profile: the profile under the map (tap: the map shows the place, and the other way round);
   * - map-wx: rain radar, wind and snow along the route, each with its «as of» time;
   * - map-points: your own points (for every trip), add, rename, move, sort, delete with Undo.
   * Network only on a tap; answers kept on this device (meta table).
   */
  import { untrack } from 'svelte';
  import { Plus, Pencil, MapPin, CloudRain, Wind, Snowflake, Crosshair } from '@lucide/svelte';
  import RaceBox from './RaceBox.svelte';
  import MapView from '../map/MapView.svelte';
  import ProfileStrip from '../map/ProfileStrip.svelte';
  import OwnPointSheet from '../map/OwnPointSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { cacheGet, cacheSet, cacheQuery } from './store.js';
  import { POI_KIND } from './outside.js';
  import { darkRiding, hhmm } from './race.js';
  import { sunTimes } from '../blockplan.js';
  import { sectorSegments, stretch, planBeds, nightStretches, placeAt, kmNear, tapKm, minZoomOf } from '../map/maplib.js';
  import { ownQuery, saveOwn, putOwn, newPoint, updatePoint, removePoint, movePoint, ownOnMap, ownLabel, OWN_KINDS } from '../map/ownpoints.js';
  import { MAP_WX_CACHE, RADAR_MAX_ZOOM, RADAR_ATTRIBUTION, fetchRadar, fetchMapWx, wxPoints, wxRows, snowStretches, windArrows, windiest, isOld } from '../map/wx.js';
  import { compass } from './outside.js';
  import { kmRangeIn } from '../map/fineprofile.js';
  import PoiPanel from '../map/PoiPanel.svelte';
  import PoiDetail from '../map/PoiDetail.svelte';
  import WxTimeline from '../map/WxTimeline.svelte';
  import { t, locale } from '../i18n.svelte.js';

  let { ctx } = $props();
  // the page is built anew for every race (RaceDetail keys the part)
  const id = untrack(() => ctx.trip.id);
  const ownQ = ownQuery();
  const wxQ = cacheQuery(MAP_WX_CACHE + id);
  const own = $derived($ownQ ?? []);
  const pts = $derived(ctx.pts ?? []);
  const route = $derived(ctx.route);
  const plan = $derived(ctx.plan);
  const km = $derived(Number(route?.km) || pts.at(-1)?.km || 0);

  /* ---------- formatting ---------- */
  const when = (ms) => (Number.isFinite(ms) ? `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}` : '');
  const asOf = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' }) : '');
  const kindName = (k) => (k === 'bed' ? t('Your bed (plan)') : k === 'own' ? t('My point') : t(POI_KIND[k]?.name ?? 'Other stop'));

  /* ---------- layers (kept per device by the map) ---------- */
  let mapView = $state();
  let ground = $state('auto');
  let shown = $state({ sectors: true, stops: true, beds: true, own: true, night: true, radar: false, wind: false, snow: true });
  const toggles = $derived([
    { key: 'sectors', label: t('Sectors') },
    { key: 'stops', label: t('Stops') },
    { key: 'beds', label: t('Beds of the plan') },
    { key: 'own', label: t('My points') },
    { key: 'night', label: t('Night|map') },
  ]);
  const flip = (key) => (shown = { ...shown, [key]: !shown[key] });

  /* ---------- the stops, filtered by kind ---------- */
  const pois = $derived((ctx.pois ?? []).filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))));
  const kinds = $derived.by(() => {
    const n = {};
    for (const p of pois) n[p.kind] = (n[p.kind] ?? 0) + 1;
    return Object.entries(n)
      .map(([k, c]) => ({ k, c, z: minZoomOf(k) }))
      .sort((a, b) => a.z - b.z || b.c - a.c);
  });
  let kindsOff = $state([]);
  const toggleKind = (k) => (kindsOff = kindsOff.includes(k) ? kindsOff.filter((x) => x !== k) : [...kindsOff, k]);
  const beds = $derived(planBeds(plan, pts));
  const mapPoints = $derived([
    ...(shown.stops ? pois.filter((p) => !kindsOff.includes(p.kind)).map((p) => ({ id: p.id, lat: Number(p.lat), lon: Number(p.lon), kind: p.kind, name: p.name || kindName(p.kind), km: p.km })) : []),
    ...(shown.beds ? beds.map((b) => ({ ...b, name: b.name || t('Night {n}', { n: b.n }) })) : []),
    ...(shown.own ? ownOnMap(own, t) : []),
  ]);
  const segments = $derived(shown.sectors ? sectorSegments(pts, route?.sectors ?? []) : null);

  /* ---------- night and snow ---------- */
  const startPt = $derived(pts[0] ?? null);
  const sun = (day) => (startPt ? sunTimes(day, startPt.lat, startPt.lon) : null);
  const dark = $derived(plan ? darkRiding(plan, sun, Number(ctx.race?.lampH) || 8) : []);
  const nights = $derived(nightStretches(plan, dark));
  const wx = $derived($wxQ ?? null);
  const rows = $derived(wx?.data ? wxRows(wx.data, plan?.etaOf ?? null) : []);
  const snow = $derived(snowStretches(rows, km));
  const stretches = $derived([
    ...(shown.night ? nights.map((n) => ({ line: stretch(pts, n.fromKm, n.toKm), tone: 'night' })) : []),
    ...(shown.snow ? snow.map((s) => ({ line: stretch(pts, s.fromKm, s.toKm), tone: s.state === 'lies' ? 'lies' : 'snow' })) : []),
  ]);
  const arrows = $derived(shown.wind ? windArrows(rows) : []);
  const strongest = $derived(windiest(rows));
  const lines = $derived(rows.map((r) => r.snowLine).filter((v) => v != null));

  /* ---------- rain radar ---------- */
  let radar = $state(null); // { time, url, at }
  cacheGet('map-radar').then((c) => {
    if (c?.data?.url && !isOld(c.at, 2)) radar = { ...c.data, at: c.at };
  });
  const overlays = $derived(shown.radar && radar ? [{ id: 'radar', url: radar.url, maxzoom: RADAR_MAX_ZOOM, opacity: 0.6, attribution: RADAR_ATTRIBUTION }] : []);

  /* ---------- loading from outside, only on a tap ---------- */
  let busy = $state('');
  let msg = $state('');
  const fail = (err) => (navigator.onLine === false ? t('You are offline. Try again with internet.') : err?.message === 'busy' ? t('The free service is busy. Try again in a minute.') : t('Could not load. Try again later.'));
  async function run(key, fn) {
    if (busy) return;
    busy = key;
    msg = '';
    try {
      if (navigator.onLine === false) throw new Error('offline');
      await fn();
    } catch (err) {
      msg = fail(err);
    } finally {
      busy = '';
    }
  }
  const loadRadar = () =>
    run('radar', async () => {
      const f = await fetchRadar();
      await cacheSet('map-radar', f);
      radar = { ...f, at: new Date().toISOString() };
      shown = { ...shown, radar: true };
    });
  const loadWx = () =>
    run('wx', async () => {
      const points = wxPoints(pts, route?.profile ?? []);
      const series = await fetchMapWx(points);
      await cacheSet(MAP_WX_CACHE + id, { points, series });
      shown = { ...shown, wind: true, snow: true };
    });
  function flipWx(key) {
    flip(key);
    if (key === 'radar' && shown.radar && !radar) loadRadar();
    if (key !== 'radar' && shown[key] && !wx?.data) loadWx();
  }

  /* ---------- profile ↔ map ---------- */
  let cursorKm = $state(null);
  const cursor = $derived(cursorKm == null ? null : placeAt(pts, cursorKm));
  // the zoomed part of the profile ↔ the map view (Paket U2 «Feines Höhenprofil»)
  let pview = $state(null); // { from, to } or null (the whole route)
  let pfollow = $state(true); // the profile follows the map
  let pmine = $state(false); // the profile's view was set in the profile: highlight it on the map
  const highlight = $derived(pview && pmine ? stretch(pts, pview.from, pview.to) : []);
  function profileView(v) {
    pmine = !!v;
    if (v) mapView?.fitLine?.(stretch(pts, v.from, v.to));
    else mapView?.fitRoute?.();
  }
  // the place search (PoiPanel): its places as symbols on the map; a tap on one opens PoiDetail
  let poiPoints = $state([]);
  let poiPicked = $state(null);
  let mapBounds = $state(null); // { s, w, n, e }
  function mapView2(b) {
    if (!pfollow) return;
    const r = kmRangeIn(pts, b);
    if (!r) return;
    pmine = false;
    pview = r.to - r.from >= km * 0.98 ? null : r;
  }
  let picked = $state(null);
  const pickedEta = $derived(picked?.km != null && plan ? plan.etaOf(picked.km) : null);

  /* ---------- own points ---------- */
  let adding = $state(false);
  let moving = $state(null); // the point to move
  let sheet = $state(null); // { point, fresh }
  const ownKm = (p) => kmNear(pts, p, 2);

  // the place search's own places: «Add: tap the map» and «Move» wait for a tap here
  let poiPanel = $state(null);
  let poiTapping = $state(false);
  function mapTap(e) {
    if (poiPanel?.tapMap(e)) return;
    if (moving) {
      const p = moving;
      moving = null;
      saveOwn((list) => updatePoint(list, p.id, { lat: Math.round(e.lat * 1e5) / 1e5, lon: Math.round(e.lon * 1e5) / 1e5 }));
      return;
    }
    if (adding) {
      adding = false;
      sheet = { point: { lat: e.lat, lon: e.lon, name: '', note: '', kind: 'note' }, fresh: true };
      return;
    }
    picked = null;
    const k = kmNear(pts, e, tapKm(e.zoom, e.lat));
    if (k != null) cursorKm = k;
  }
  function longPress(e) {
    if (moving) return;
    adding = false;
    sheet = { point: { lat: e.lat, lon: e.lon, name: '', note: '', kind: 'note' }, fresh: true };
  }
  function pick(p) {
    if (String(p.id ?? '').startsWith('poi-')) {
      poiPicked = poiPoints.find((x) => `poi-${x.id}` === p.id) ?? null;
      return;
    }
    if (p.kind === 'own') {
      const o = own.find((x) => x.id === p.id);
      if (o) sheet = { point: o, fresh: false };
      return;
    }
    picked = p;
    if (p.km != null) cursorKm = p.km;
  }
  function addAtCursor() {
    const c = cursor ?? placeAt(pts, 0);
    if (c) sheet = { point: { lat: c.lat, lon: c.lon, name: '', note: '', kind: 'note' }, fresh: true };
  }
  async function saveSheet(p) {
    if (sheet?.fresh) await saveOwn((list) => [...list, newPoint(p)]);
    else await saveOwn((list) => updatePoint(list, p.id, { name: p.name, note: p.note, kind: p.kind }));
  }
  async function removeOwn(p) {
    const name = ownLabel(p, t);
    const answer = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The point goes from every map. The trips stay as they are.') });
    if (answer !== 'delete') return false;
    let before = [];
    await deleteWithUndo({
      run: async () => (before = await saveOwn((list) => removePoint(list, p.id))),
      undo: () => putOwn(before),
      text: t('«{name}» deleted.', { name }),
      name,
    });
  }
  const move = (from, to) => saveOwn((list) => movePoint(list, from, to));
  function showOnMap(p) {
    mapView?.show?.(p.lat, p.lon, 13);
    document.querySelector('[data-race-box="map-main"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function startAdding() {
    moving = null;
    adding = !adding;
    if (adding) document.querySelector('[data-race-box="map-main"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
</script>

<div class="rm" data-race-map>
  <RaceBox
    id="map-main"
    title={t('Map|race')}
    what="Shows the route in the colours of its sectors, the stops along it, the beds of your plan, the depot and your own points, on the map ground you choose."
    why="You see where everything is at a glance and plan where to eat, drink and sleep."
    from="Map grounds: swisstopo, OpenFreeMap, OpenStreetMap or OpenTopoMap. Stops: your stop file and OpenStreetMap (Along the route). Beds and nights: your plan."
  >
    {#if pts.length < 2}
      <p class="rc-note" data-map-noroute>{t('No route yet: load it under «Prepare». The map then shows it here.')}</p>
    {/if}
    <MapView
      bind:this={mapView}
      bind:ground
      bind:shown
      prefsKey="race"
      line={route?.line ?? []}
      {segments}
      {stretches}
      points={poiPoints.length ? [...mapPoints, ...poiPoints.filter((p) => Number.isFinite(Number(p.lat))).map((p) => ({ id: `poi-${p.id}`, lat: Number(p.lat), lon: Number(p.lon), kind: p.kind, name: p.name || kindName(p.kind) }))] : mapPoints}
      {cursor}
      {arrows}
      {overlays}
      {toggles}
      adding={adding || !!moving || poiTapping}
      label={t('Map of the route')}
      {highlight}
      onview={mapView2}
      onmove={(b) => (mapBounds = b)}
      onmapclick={mapTap}
      onlongpress={longPress}
      onpick={pick}
    />
    {#if moving}
      <p class="rc-note" role="status">{t('Tap the new spot of «{name}» on the map.', { name: ownLabel(moving, t) })} <button type="button" class="btn sm" onclick={() => (moving = null)}>{t('Cancel')}</button></p>
    {/if}
    {#if picked}
      <p class="rm-picked" data-map-picked>
        <b>{picked.name}</b>
        <span>{kindName(picked.kind)}{#if picked.km != null}{' '}· {t('km {km}', { km: Math.round(picked.km) })}{/if}{#if pickedEta}{' '}· {t('there {when}', { when: when(pickedEta) })}{/if}</span>
      </p>
    {/if}
    {#if poiPicked}
      <div data-map-poi-detail><PoiDetail place={poiPicked} from={cursor} line={route?.line ?? null} profile={route?.profile ?? null} onclose={() => (poiPicked = null)} /></div>
    {/if}
    <details class="rm-find" data-map-places>
      <summary>{t('Find places')}</summary>
      <PoiPanel bind:this={poiPanel} canTap ontapmode={(v) => (poiTapping = v)} center={cursor ? { lat: cursor.lat, lon: cursor.lon } : null} bounds={mapBounds} line={route?.line ?? null} profile={route?.profile ?? null} tripId={ctx.trip?.id ?? null} onpoints={(l) => (poiPoints = l ?? [])} />
    </details>
    {#if kinds.length && shown.stops}
      <div class="rm-kinds">
        <p class="rc-note">{t('Which stops: tap to hide or show a kind.')}</p>
        <div class="rc-chips" role="group" aria-label={t('Kinds of stops')}>
          {#each kinds as x (x.k)}
            <button type="button" class="rc-chip" aria-pressed={!kindsOff.includes(x.k)} onclick={() => toggleKind(x.k)} data-map-kind={x.k}>{kindName(x.k)} · {x.c}</button>
          {/each}
        </div>
      </div>
    {/if}
    <p class="rc-note">{t('So that a long route stays readable, small stops appear when you zoom in: shops, food and water from zoom 10, the rest from zoom 12. The depot, start, finish, the beds of your plan and your own points always show. Names appear from zoom 13.')}</p>
    <p class="rc-note">{t('Tap a stop for its km and when you are there. Tap the route: the profile below jumps there. Press long on the map (or right-click) to set your own point.')}</p>
  </RaceBox>

  <RaceBox
    id="map-profile"
    title={t('Elevation profile')}
    what="The height along the whole route, with the sectors, the stretches you ride in the dark and snow on the route."
    why="Tap a spot: you see how high it is, how steep, and when your plan has you there; the map shows the place."
    from="The heights of your route file; dark from sunrise and sunset and your plan; snow from the weather layer."
  >
    {#if route?.profile?.length > 1}
      <ProfileStrip profile={route.profile} fine={route.profileFine ?? null} bind:view={pview} bind:follow={pfollow} canFollow onview={profileView} sectors={shown.sectors ? (route.sectors ?? []) : []} nights={shown.night ? nights : []} snow={shown.snow ? snow : []} marks={shown.beds ? beds : []} bind:cursorKm etaOf={plan?.etaOf ?? null} onmove={() => (picked = null)} />
    {:else}
      <p class="rc-note">{t('No heights yet: a route file with heights (GPX) brings the profile.')}</p>
    {/if}
  </RaceBox>

  <RaceBox
    id="map-wx"
    title={t('Weather on the map')}
    what="Puts the rain radar, the wind and the snow on the map: wind and snow for the hour your plan has you at each point (today when the race is too far ahead)."
    why="You see showers coming, where the wind is against you and where snow could lie or fall on high passes."
    from="RainViewer (radar, the last minutes, free) and Open-Meteo (forecast of wind, freezing level and snow depth at 12 points, free). Only on a tap; kept on this device."
  >
    <div class="rc-chips" role="group" aria-label={t('Weather layers')}>
      <button type="button" class="rc-chip" aria-pressed={!!shown.radar} onclick={() => flipWx('radar')} data-map-layer="radar"><CloudRain size={16} aria-hidden="true" /> {t('Rain radar')}</button>
      <button type="button" class="rc-chip" aria-pressed={!!shown.wind} onclick={() => flipWx('wind')} data-map-layer="wind"><Wind size={16} aria-hidden="true" /> {t('Wind')}</button>
      <button type="button" class="rc-chip" aria-pressed={!!shown.snow} onclick={() => flipWx('snow')} data-map-layer="snow"><Snowflake size={16} aria-hidden="true" /> {t('Snow')}</button>
    </div>
    <div class="rc-acts">
      <button type="button" class="btn sm" onclick={loadRadar} disabled={!!busy} data-map-load-radar>{busy === 'radar' ? t('Loading…') : radar ? t('Radar again') : t('Load rain radar')}</button>
      <button type="button" class="btn sm" onclick={loadWx} disabled={!!busy || pts.length < 2} data-map-load-wx>{busy === 'wx' ? t('Loading…') : wx?.data ? t('Wind and snow again') : t('Load wind and snow')}</button>
    </div>
    {#if msg}<p class="rc-warn" role="alert">{msg}</p>{/if}
    {#if pts.length > 1}{#key id}<WxTimeline {route} {plan} tripId={id} />{/key}{/if}
    <ul class="rc-list">
      <li class="rc-row"><span class="rc-row-main"><b>{t('Rain radar')}</b><small>{radar ? t('Radar picture of {when}; it shows now, not your race day.', { when: when(radar.time) }) : t('Not loaded yet.')}</small></span></li>
      <li class="rc-row" data-map-wx-asof>
        <span class="rc-row-main">
          <b>{t('Wind and snow')}</b>
          <small>
            {#if wx?.data}{t('As of {when}', { when: asOf(wx.at) })} · {rows.some((r) => r.planned) ? t('for the hour your plan has you there') : t('for now: the race is beyond the forecast')}{:else}{t('Not loaded yet.')}{/if}
          </small>
        </span>
      </li>
      {#if strongest}
        <li class="rc-row"><span class="rc-row-main"><b>{t('Strongest wind: {v} km/h from {dir} at km {km}', { v: Math.round(strongest.wind), dir: compass(strongest.dir), km: strongest.km })}</b><small>{t('The arrows on the map point where the wind blows; the number is km/h.')}</small></span></li>
      {/if}
      {#if lines.length}
        <li class="rc-row"><span class="rc-row-main"><b>{t('Snow line about {a}–{b} m', { a: Math.round(Math.min(...lines) / 100) * 100, b: Math.round(Math.max(...lines) / 100) * 100 })}</b><small>{t('About 300 m below the freezing level: above it rain can fall as snow.')}</small></span></li>
      {/if}
      {#if wx?.data}
        {#if snow.length}
          {#each snow as s (s.fromKm)}
            <li class="rc-row" data-map-snow><span class="rc-row-main"><b>{t('km {a}–{b}', { a: s.fromKm, b: s.toKm })}</b><small>{s.state === 'lies' ? t('Snow lies there') : t('Above the snow line: snow can fall')}</small></span></li>
          {/each}
        {:else}
          <li class="rc-row"><span class="rc-row-main"><b>{t('No snow on the route')}</b><small>{t('Neither lying snow nor a part above the snow line.')}</small></span></li>
        {/if}
      {/if}
    </ul>
  </RaceBox>

  <OfflineBox {ctx} />

  <RaceBox
    id="map-points"
    title={t('My points')}
    what="Places you mark yourself: a fountain, a dangerous descent, a view, a note. They show on every map, for every trip."
    why="What you learn on one tour is there on the next one."
    from="Your input; kept with your data and in every backup."
  >
    <div class="rc-acts">
      <button type="button" class="btn" class:hi={adding} aria-pressed={adding} onclick={startAdding} data-own-add><Plus size={16} aria-hidden="true" />{adding ? t('Cancel adding') : t('Add point on the map')}</button>
      <button type="button" class="btn" onclick={addAtCursor} disabled={pts.length < 2} data-own-add-cursor><Crosshair size={16} aria-hidden="true" />{cursorKm != null ? t('Add point at km {km}', { km: Math.round(cursorKm) }) : t('Add point at the start')}</button>
    </div>
    <p class="rc-note">{t('Tap «Add point on the map» and then the spot, or press long on the map. Without a map: choose a spot on the profile and add the point there.')}</p>
    {#if own.length}
      <ul class="rc-list" use:sortable={{ onmove: (from, to) => move(from, to) }} data-own-list>
        {#each own as p, i (p.id)}
          {@const k = ownKm(p)}
          <li class="rc-row" data-sort-id={p.id} data-own-row={p.id}>
            <SortGrip name={ownLabel(p, t)} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="rc-row-main" onclick={() => (sheet = { point: p, fresh: false })}>
              <b>{ownLabel(p, t)}</b>
              <small>{t(OWN_KINDS.find((x) => x.key === p.kind)?.name ?? 'Note|point')}{#if k != null}{' '}· {t('km {km} of this route', { km: Math.round(k) })}{/if}{#if p.note}{' '}· {p.note}{/if}</small>
            </button>
            <button type="button" class="rc-icon" aria-label={t('Show {name} on the map', { name: ownLabel(p, t) })} onclick={() => showOnMap(p)}><MapPin size={18} aria-hidden="true" /></button>
            <SortArrows name={ownLabel(p, t)} {i} n={own.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="rc-icon" aria-label={t('Change {name}', { name: ownLabel(p, t) })} onclick={() => (sheet = { point: p, fresh: false })} data-own-edit={p.id}><Pencil size={18} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="rc-empty" data-own-empty>{t('No points yet.')}</p>
    {/if}
  </RaceBox>
</div>

{#if sheet}
  {#key sheet}
    <OwnPointSheet point={sheet.point} fresh={sheet.fresh} onsave={saveSheet} ondelete={removeOwn} onmove={(p) => (moving = p)} onclose={() => (sheet = null)} />
  {/key}
{/if}

<style>
  .rm-find > summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    font-weight: 600;
    cursor: pointer;
  }
  .rm {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
  }
  .rm-picked {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .rm-picked span {
    color: var(--ink-3);
  }
  .rm-kinds {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>
