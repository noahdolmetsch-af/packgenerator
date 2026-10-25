<script>
  /**
   * «Stopps in der Nähe» (#/stopps, #/stopps?trip=<id>; Noah 22.10.2026 «tankstellen, brunnen, restaurants, etc
   * können entlang der route oder in meinem umkreis geladen werden … als stand alone button auf dem home screen»;
   * 24.10.2026 «1a 2a 3a 4b 5a»): water, petrol stations, restaurants, shops, WC, cash, pharmacy, a pump, bike
   * shops, stations and beds, around you or along the route of a trip. Free data from OpenStreetMap through the
   * live map's loaders (live/stops.js), so the live map and the race page share what is loaded here.
   * The kinds you switch off stay off on this device (settings 'stops-kinds'). Only a suggestion: nothing is changed.
   */
  import { liveQuery } from 'dexie';
  import { untrack } from 'svelte';
  import { MapPin, LocateFixed, RefreshCw, Navigation } from '@lucide/svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import KindIcon from '../lib/map/KindIcon.svelte';
  import { db } from '../lib/db.js';
  import { HOME_PLACE } from '../lib/know.js';
  import { localDay } from '../lib/localday.js';
  import { POI_CACHE, POI_KIND } from '../lib/race/outside.js';
  import { cacheQuery } from '../lib/race/store.js';
  import { hhmm } from '../lib/race/race.js';
  import { stopsAhead, navLinks } from '../lib/live/live-lib.js';
  import { AROUND_CACHE, loadAround, loadAlong } from '../lib/live/stops.js';
  import { STOP_KINDS, STOPS_KEY, HEUTE_OFF_KEY, AROUND_KM, AHEAD_KM, kindsOn, flipKind, tripsWithRoute, ptsOfTrip, placeOnRoute } from '../lib/stops/nearby.js';
  import '../lib/race/race.css';
  import { t, num } from '../lib/i18n.svelte.js';

  const tripsQ = liveQuery(() => db.trips.toArray());
  const kindsQ = liveQuery(() => db.settings.get(STOPS_KEY));
  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const heuteOffQ = liveQuery(async () => (await db.settings.get(HEUTE_OFF_KEY)) ?? null);
  const racesQ = liveQuery(async () => (await db.settings.get('races')) ?? null);
  const aroundQ = cacheQuery(AROUND_CACHE);

  const today = localDay();
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const routes = $derived(tripsWithRoute($tripsQ ?? [], today, $racesQ?.value?.races ?? {}));
  let tripId = $state(params.get('trip') ?? '');
  const trip = $derived(routes.find((tr) => tr.id === tripId) ?? null);
  // a trip with a route in the link opens along its route; else around you
  let chosen = $state(null);
  // with a trip in the link: wait until the trips are read before deciding (no search around you meanwhile)
  const ready = $derived($tripsQ !== undefined && $racesQ !== undefined);
  const mode = $derived(chosen ?? (params.get('trip') ? (!ready ? 'wait' : routes.some((tr) => tr.id === params.get('trip')) ? 'route' : 'around') : 'around'));
  $effect(() => {
    // no trip chosen yet (or one without a route): the next one with a route
    if (routes.length && !routes.some((tr) => tr.id === tripId)) untrack(() => (tripId = routes[0].id));
  });
  // null when nothing is kept yet (undefined: still reading)
  const poiKey = $derived(POI_CACHE + (trip?.id ?? '-'));
  const poiQ = $derived.by(() => {
    const k = poiKey;
    return liveQuery(async () => (await db.meta.get(k)) ?? null);
  });
  const pts = $derived(ptsOfTrip(trip));
  const kinds = $derived(kindsOn($kindsQ?.value));

  /* ---------- where you are ---------- */
  let here = $state(null); // { lat, lon }
  let gps = $state('idle'); // idle | asking | ok | denied
  function locate() {
    if (!navigator.geolocation) return (gps = 'denied');
    gps = 'asking';
    navigator.geolocation.getCurrentPosition(
      (p) => {
        here = { lat: p.coords.latitude, lon: p.coords.longitude };
        gps = 'ok';
      },
      () => (gps = 'denied'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }
  locate();
  const home = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  // without a position: around your home place
  const from = $derived(here ?? (gps === 'denied' ? home : null));
  const onRoute = $derived(mode === 'route' ? placeOnRoute(pts, here) : null);
  const fromKm = $derived(onRoute?.km ?? 0);

  /* ---------- loading ---------- */
  let busy = $state('');
  let say = $state(null); // { bad, text }
  const fail = (e) => (navigator.onLine === false ? t('You are offline. Try again with internet.') : e?.message === 'busy' ? t('The free service is busy. Try again in a minute.') : t('Could not load. Try again later.'));
  async function getAround(force = false) {
    if (busy || !from) return;
    busy = 'around';
    say = null;
    try {
      const list = await loadAround(from, { force });
      if (force || !list.length) say = { bad: false, text: list.length ? t('{n} places found around you.', { n: num(list.length) }) : t('No places found around you.') };
    } catch (e) {
      say = { bad: true, text: fail(e) };
    } finally {
      busy = '';
    }
  }
  async function getAlong() {
    if (busy || !trip || pts.length < 2) return;
    busy = 'route';
    say = null;
    try {
      const list = await loadAlong(trip.id, pts, { fromKm });
      const n = list.filter((p) => p.km >= fromKm - 0.1 && p.km - fromKm <= AHEAD_KM).length;
      say = { bad: false, text: n ? t('{n} places in the next {km} km.', { n: num(n), km: AHEAD_KM }) : t('No stops found in the next {km} km.', { km: AHEAD_KM }) };
    } catch (e) {
      say = { bad: true, text: fail(e) };
    } finally {
      busy = '';
    }
  }
  // once, by itself: around you as soon as the position is there (a kept answer that still fits is used)
  let triedAround = '';
  $effect(() => {
    if (mode !== 'around' || !from || navigator.onLine === false) return;
    const k = `${from.lat.toFixed(3)},${from.lon.toFixed(3)}`;
    if (k === triedAround) return;
    triedAround = k;
    untrack(() => getAround());
  });
  // along a route: once per trip when nothing is kept ahead of you
  let triedRoute = '';
  $effect(() => {
    const kept = $poiQ;
    if (mode !== 'route' || !trip || kept === undefined || gps === 'asking' || navigator.onLine === false || triedRoute === trip.id) return;
    if (busy) return;
    const list = Array.isArray(kept?.data) ? kept.data : [];
    triedRoute = trip.id;
    if (!list.some((p) => p.km >= fromKm - 0.1 && p.km - fromKm <= AHEAD_KM)) untrack(() => getAlong());
  });

  /* ---------- the list ---------- */
  const now = Date.now();
  const pois = $derived(mode === 'route' ? (Array.isArray($poiQ?.data) ? $poiQ.data : []) : ($aroundQ?.data?.list ?? []));
  const rows = $derived(
    mode === 'route'
      ? pts.length > 1
        ? stopsAhead({ pois, pts, here: here ?? pts[0], km: fromKm, kinds, n: 40, now, pace: { kmh: 18 }, rangeKm: AHEAD_KM })
        : []
      : from
        ? stopsAhead({ pois, here: from, kinds, n: 40, now, pace: { kmh: 18 }, rangeKm: AROUND_KM })
        : [],
  );
  const kindName = (k) => t(POI_KIND[k]?.name ?? 'Other stop');
  const fmtKm = (k) => (k == null ? '–' : k >= 100 ? num(Math.round(k)) : num(Math.round(k * 10) / 10));
  const openLine = (s) => {
    if (!s.open || s.open.open == null) return ['shop', 'food', 'fuel', 'bike', 'pharmacy'].includes(s.kind) ? t('Opening hours unknown') : '';
    if (s.open.open) return s.open.closes ? t('Open until {at}', { at: s.open.closes }) : t('Open|hours');
    return s.open.opens ? t('Closed then, opens {at}', { at: s.open.opens }) : t('Closed then');
  };
  const flip = (k) => db.settings.put({ key: STOPS_KEY, value: flipKind($kindsQ?.value, k) });
  const allOn = () => db.settings.put({ key: STOPS_KEY, value: { off: [] } });
</script>

<section class="rc st" data-page="stopps">
  <Crumbs crumbs={[{ label: t('Trips|place'), href: '#/trips' }]} here={t('Stops nearby')} />
  <PageHead title={t('Stops nearby')} text={t('Water, petrol stations, restaurants, shops, WC, cash and more: around you, or along the route of a trip. Free data from OpenStreetMap.')} />

  <div class="rc-box">
    <Seg options={[{ key: 'around', name: t('Around me|poi') }, { key: 'route', name: t('Along the route|poi') }]} value={mode} onchange={(k) => ((chosen = k), (say = null))} label={t('Where to look for stops')} full={false} />
    {#if mode === 'around'}
      <p class="rc-note" data-stops-where>
        {#if gps === 'asking'}{t('Looking for your position …')}
        {:else if here}{t('Around where you are now, up to {km} km as the crow flies.', { km: AROUND_KM })}
        {:else if home}{t('Your position is not shared: around your home place instead.')}
        {:else}{t('Your position is not shared, and no home place is set. Allow the position in the browser, or set your home place under Me.')}{/if}
      </p>
    {:else if routes.length}
      <label class="rc-lab">{t('Trip')}
        <select class="inp" bind:value={tripId} onchange={() => (say = null)} data-stops-trip>
          {#each routes as tr (tr.id)}<option value={tr.id}>{tr.title || t('Trip')}{tr.startDate ? ` · ${tr.startDate}` : ''}</option>{/each}
        </select>
      </label>
      <p class="rc-note" data-stops-where>{onRoute ? t('From where you are on the route (km {km}), the next {ahead} km.', { km: num(Math.round(fromKm)), ahead: AHEAD_KM }) : t('From the start of the route, the first {ahead} km. Near the route, the list starts where you are.', { ahead: AHEAD_KM })}</p>
    {:else}
      <p class="rc-note" data-stops-noroute>{t('No trip with a route yet. Add a GPX route to a trip, then its stops show here.')}</p>
    {/if}

    <div class="rc-chips" role="group" aria-label={t('Show these kinds')}>
      {#each STOP_KINDS as k (k)}<button type="button" class="rc-chip" aria-pressed={kinds.includes(k)} onclick={() => flip(k)} data-stops-kind={k}>{kindName(k)}</button>{/each}
      {#if kinds.length < STOP_KINDS.length}<button type="button" class="rc-chip" onclick={allOn} data-stops-all>{t('All kinds')}</button>{/if}
    </div>

    <div class="rc-acts">
      {#if mode === 'around'}
        <button type="button" class="btn sm" onclick={() => getAround(true)} disabled={!!busy || !from} data-stops-load><RefreshCw size={16} aria-hidden="true" />{busy === 'around' ? t('Loading…') : t('Look for stops around me')}</button>
        {#if gps !== 'ok'}<button type="button" class="btn sm" onclick={locate} disabled={gps === 'asking'} data-stops-locate><LocateFixed size={16} aria-hidden="true" />{t('Use my position')}</button>{/if}
      {:else if trip}
        <button type="button" class="btn sm" onclick={getAlong} disabled={!!busy} data-stops-load><RefreshCw size={16} aria-hidden="true" />{busy === 'route' ? t('Loading…') : t('Load stops along the route')}</button>
      {/if}
    </div>
    {#if say}<p class={say.bad ? 'rc-warn' : 'rc-note'} role="status" data-stops-msg>{say.text}</p>{/if}
  </div>

  <section class="rc-box" aria-labelledby="st-h" data-stops-list>
    <h2 id="st-h" class="rc-h2"><MapPin size={20} aria-hidden="true" />{mode === 'route' ? t('Next stops on the route') : t('Stops around you')}</h2>
    {#if rows.length}
      <ul class="rc-list">
        {#each rows as s (s.id)}
          {@const l = navLinks({ lat: Number(s.lat), lon: Number(s.lon) })}
          <li class="rc-row st-row" data-stops-row={s.kind}>
            <KindIcon kind={s.kind} size={18} />
            <span class="rc-row-main">
              <b>{s.name || kindName(s.kind)}</b>
              <small>{kindName(s.kind)} · <span data-stops-dist>{mode === 'route' ? t('km {km}, in {d} km', { km: num(Math.round(s.km)), d: fmtKm(s.distKm) }) : t('{d} km as the crow flies', { d: fmtKm(s.distKm) })}</span>{#if mode === 'around'}{' '}· {t('by bike about {at}', { at: hhmm(s.eta) })}{/if}{#if openLine(s)}{' '}· <span class:st-closed={s.open?.open === false}>{openLine(s)}</span>{/if}</small>
            </span>
            <span class="st-go">
              <a class="btn sm" href={l.google} target="_blank" rel="noopener noreferrer" aria-label={t('Navigate to {name} with Google Maps', { name: s.name || kindName(s.kind) })}><Navigation size={16} aria-hidden="true" />{t('Google Maps')}</a>
              <a class="btn sm" href={l.osmand} target="_blank" rel="noopener noreferrer">{t('OsmAnd')}</a>
            </span>
          </li>
        {/each}
      </ul>
      <p class="rc-note">{mode === 'route' ? t('Distance along the route; opening hours from OpenStreetMap when known.') : t('Straight-line distance; the time at about 18 km/h; opening hours from OpenStreetMap when known.')}</p>
    {:else}
      <p class="rc-note" data-stops-empty>{busy ? t('Loading…') : t('No stops of these kinds yet. Load them with the button above, or switch on more kinds.')}</p>
    {/if}
    {#if mode === 'route' && trip}<a class="btn sm" href={`#/live/${encodeURIComponent(trip.id)}`} data-stops-live>{t('Open the live map of this trip')}</a>{/if}
  </section>

  {#if $heuteOffQ !== undefined}<label class="rc-inline st-heute"><input type="checkbox" checked={$heuteOffQ?.value !== true} onchange={(e) => db.settings.put({ key: HEUTE_OFF_KEY, value: !e.currentTarget.checked })} data-stops-heute />{t('Show the button «Stops nearby» on Today')}</label>{/if}
</section>

<style>
  .st {
    padding-bottom: 24px;
  }
  .st-row {
    flex-wrap: wrap;
  }
  .st-row .rc-row-main {
    flex: 1 1 14em;
    cursor: default;
  }
  .st-go {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .st-closed {
    color: var(--bad);
  }
  .st-heute {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
