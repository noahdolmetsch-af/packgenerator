<script>
  /**
   * Paket U3 «Live-Karte» (#/live, #/live/<tripId>; Noah 19.10.2026 «während eines Rennens eine Seite mit
   * einer Karte, meiner live location und vielleicht sogar Distanzen zu nächsten POI … auf allen
   * Ausfahrten»). For every ride: with a route the km along it, without one the stops around you.
   *
   * - One GPS, one wake lock: «Start the ride» is the Reise-Spur recording (recorder.svelte.js); the page
   *   reads its latest fix (rec.here). A running recording is picked up. Stop → the after-ride card.
   * - The panel: km done / left, arrival and light, plan against reality and tonight's bed (races), the
   *   next 5 stops with distance, time and opening hours (Navigate: Google Maps, OsmAnd), the next climb,
   *   the profile from where you are, pauses.
   * - Options (settings 'live', all off by default): voice, off-route warning, eat every 300 m up, battery
   *   saver, thunderstorm alert. SOS always at hand. Notes and photos with place (PlaceSheet).
   * The sums are in src/lib/live/live-lib.js (tested); the stops from outside in stops.js.
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Play, Square, Crosshair, MapPin, Navigation, Mountain, Clock, Settings, BatteryMedium, CloudLightning, TriangleAlert, RefreshCw, Utensils, Moon, Flag, LifeBuoy } from '@lucide/svelte';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import MapView from '../lib/map/MapView.svelte';
  import ProfileStrip from '../lib/map/ProfileStrip.svelte';
  import PlaceSheet from '../lib/spur/PlaceSheet.svelte';
  import Essen from '../lib/unterwegs/Essen.svelte';
  import SosSheet from '../lib/live/SosSheet.svelte';
  import { db } from '../lib/db.js';
  import { rec, startRecording, stopRecording, openRecording } from '../lib/spur/recorder.svelte.js';
  import { zurichTime } from '../lib/spur/spur.js';
  import { racesQuery, cacheQuery, cacheGet, cacheSet } from '../lib/race/store.js';
  import { raceOf, schedule, lineKm, climbsOf, hhmm, dayOfMs } from '../lib/race/race.js';
  import { POI_CACHE, POI_KIND } from '../lib/race/outside.js';
  import { mergePois } from '../lib/race/more.js';
  import { paceFromRides, loadedBy, assumptionsOf, compareWays, simPlan } from '../lib/race/strategy.js';
  import { ownQuery, ownOnMap } from '../lib/map/ownpoints.js';
  import { fetchRadar, RADAR_MAX_ZOOM, RADAR_ATTRIBUTION, isOld } from '../lib/map/wx.js';
  import { minText } from '../lib/unterwegs/heimweg.js';
  import { EAT_KEY, eatOf, eaten } from '../lib/unterwegs/essen.js';
  import {
    onRoute, stopsAhead, nextClimb, arrival, lightLeft, darkMinutes, pauses, eatDue, batteryEnough, drainOf, planDelta, offRouteStep, nextSay, navLinks,
    fixesOf, paceOf, planRunning, bedTonight, stormPoints, stormUrl, stormAhead, gainBetween,
  } from '../lib/live/live-lib.js';
  import { AROUND_CACHE, loadAround, loadAlong } from '../lib/live/stops.js';
  import { beep, buzz, say } from '../lib/live/alert.js';
  import { DICTATION } from '../lib/live/dictation.js';
  import { refreshFamilyLink, LIVE_EVERY_MS } from '../lib/live/familylive.js';
  import { t, tn, locale, num } from '../lib/i18n.svelte.js';
  import '../lib/race/race.css';

  let { id = '' } = $props();
  const tid = untrack(() => id);

  /* ---------- the trip, the route, the stops, the plan ---------- */
  const tripQ = liveQuery(() => (tid ? db.trips.get(tid) : null));
  const racesQ = racesQuery();
  const ownQ = ownQuery();
  const osmQ = cacheQuery(POI_CACHE + (tid || '-'));
  const aroundQ = cacheQuery(AROUND_CACHE);
  const cfgQ = liveQuery(() => db.settings.get('live'));
  const eatQ = liveQuery(() => db.settings.get(EAT_KEY));
  const openQ = liveQuery(() => openRecording(db));
  const actsQ = liveQuery(() => db.activities.toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());

  const trip = $derived($tripQ ?? null);
  const stored = $derived(($racesQ ?? {})[tid] ?? null);
  const isRace = $derived(!!trip && !!stored);
  const race = $derived(isRace ? raceOf(stored, trip) : null);
  const route = $derived(stored?.route ?? trip?.route ?? null);
  const pts = $derived(lineKm(route));
  const profile = $derived(route?.profile ?? []);
  const hasRoute = $derived(pts.length > 1);
  const routeName = $derived(trip?.title ?? '');
  const osm = $derived($osmQ?.data ?? []);
  const around = $derived($aroundQ?.data?.list ?? []);
  const pois = $derived((hasRoute ? mergePois(Array.isArray(stored?.pois) ? stored.pois : [], osm) : around).filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))));
  const own = $derived($ownQ ?? []);
  const as = $derived(isRace ? assumptionsOf(stored, paceFromRides($actsQ ?? [], $ridesQ ?? [], loadedBy($tripsQ ?? [], stored.loadedIds ?? []))) : null);
  const plan = $derived.by(() => {
    if (!race || !route?.km) return null;
    if (race.start) {
      const sims = compareWays({ km: route.km, profile, pois, start: race.start, as, own: stored.ownAssume ?? [], fixed: stored.fixedNights ?? {} });
      const sim = sims.find((x) => x?.way === (stored.way ?? 'mixed'));
      if (sim?.done) return simPlan(sim, route.km, profile);
    }
    return schedule(race, route.km, profile);
  });
  const climbs = $derived(profile.length > 1 ? climbsOf(profile, 100) : []);

  /* ---------- options (settings 'live') ---------- */
  const OPTS = { voice: false, offRoute: false, battery: false, eatHm: false, storm: false };
  const cfg = $derived({ ...OPTS, ...($cfgQ?.value ?? {}) });
  const setOpt = (k, v) => db.settings.put({ key: 'live', value: { ...cfg, [k]: v } });

  /* ---------- the ride ---------- */
  const left = $derived(!rec.on ? ($openQ ?? null) : null);
  let err = $state('');
  let after = $state(null); // { ride } once stopped
  let me = $state(null); // the position drawn (throttled in the battery saver)
  let now = $state(Date.now());
  let row = $state(null); // the recording row (for the pauses)
  let follow = $state(true);
  let mapView = $state();
  let ground = $state('auto');
  let shown = $state({ stops: true, own: true, radar: false });
  const AFTER = import.meta.glob('../lib/live/AfterRide.svelte');
  const loadAfter = Object.values(AFTER)[0] ?? null;

  async function start(cont = null) {
    err = '';
    after = null;
    const e = await startRecording(trip, { cont, saver: cfg.battery });
    if (e) return (err = t(e));
    eatFromKm = null;
    batFirst = null;
  }
  async function stop() {
    const ride = await stopRecording();
    after = { ride };
    me = null;
    row = null;
  }

  // the recording row, again whenever a point was kept
  $effect(() => {
    void rec.pts;
    const rid = rec.id;
    if (!rid) return;
    db.tracks.get(rid).then((r) => (row = r ?? null));
  });
  // the first fix at once, then every 2 s (battery saver: every 10 s)
  $effect(() => {
    if (rec.here && !untrack(() => me)) me = { ...rec.here };
  });
  $effect(() => {
    const every = cfg.battery ? 10_000 : 2_000;
    const timer = setInterval(step, every);
    return () => clearInterval(timer);
  });

  /* ---------- what follows from where you are ---------- */
  const at = $derived(me && hasRoute ? onRoute(pts, me) : null);
  const km = $derived(at?.km ?? null);
  const pz = $derived(pauses(fixesOf(row)));
  const fallbackKmh = $derived(isRace ? Number(as?.flatKmh?.value) || 20 : 18);
  const kmh = $derived(paceOf({ km: rec.km, movingS: pz.movingS }, fallbackKmh));
  const pace = $derived({ kmh, climbMh: isRace ? Number(as?.climbMh?.value) || 600 : 600 });
  const light = $derived(me ? lightLeft(me.lat, me.lon, now) : null);
  const arr = $derived(km != null ? arrival({ pts, profile, km, now, pace }) : null);
  const KINDS = ['shop', 'food', 'water', 'sleep', 'station', 'bike'];
  const stops = $derived(me ? stopsAhead({ pois, pts: hasRoute ? pts : [], here: me, km, kinds: KINDS, n: 5, now, pace, profile }) : []);
  const climb = $derived(km != null ? nextClimb(climbs, km) : null);
  const running = $derived(planRunning(plan, now));
  const delta = $derived(running && km != null ? planDelta(plan, km, now) : null);
  const bed = $derived(km != null && (isRace || pois.some((p) => p.kind === 'sleep')) ? bedTonight({ plan: running ? plan : null, pois, km, now, pace, profile, light }) : null);

  /* ---------- formatting ---------- */
  const when = (ms) => (Number.isFinite(ms) ? (dayOfMs(ms) === dayOfMs(now) ? hhmm(ms) : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'Europe/Zurich' })} ${hhmm(ms)}`) : '');
  const fmtKm = (k) => (k == null ? '–' : k >= 100 ? num(Math.round(k)) : num(Math.round(k * 10) / 10));
  const kindName = (k) => t(POI_KIND[k]?.name ?? 'Other stop');
  const openLine = (s) => {
    if (!s.open || s.open.open == null) return t('Opening hours unknown');
    if (s.open.open) return s.open.closes ? t('Open until {at}', { at: s.open.closes }) : t('Open|hours');
    return s.open.opens ? t('Closed then, opens {at}', { at: s.open.opens }) : t('Closed then');
  };
  const darkMin = $derived(arr && light && dayOfMs(arr.eta) === dayOfMs(now) ? darkMinutes(arr.eta, light) : 0);

  /* ---------- the map ---------- */
  const mapPoints = $derived([
    ...(shown.stops ? pois.map((p) => ({ id: p.id, lat: Number(p.lat), lon: Number(p.lon), kind: p.kind, name: p.name || kindName(p.kind), km: p.km })) : []),
    ...(shown.own ? ownOnMap(own, t) : []),
  ]);
  const toggles = $derived([
    { key: 'stops', label: t('Stops') },
    { key: 'own', label: t('My points') },
    { key: 'radar', label: t('Rain radar') },
  ]);
  let radar = $state(null);
  cacheGet('map-radar').then((c) => {
    if (c?.data?.url && !isOld(c.at, 2)) radar = { ...c.data, at: c.at };
  });
  $effect(() => {
    if (!shown.radar || untrack(() => radar) || navigator.onLine === false) return;
    fetchRadar()
      .then(async (f) => {
        await cacheSet('map-radar', f);
        radar = { ...f, at: new Date().toISOString() };
      })
      .catch(() => (msg = t('The rain radar could not load. Try again later.')));
  });
  const overlays = $derived(shown.radar && radar ? [{ id: 'radar', url: radar.url, maxzoom: RADAR_MAX_ZOOM, opacity: 0.6, attribution: RADAR_ATTRIBUTION }] : []);
  // the battery saver: the simple light free map (never dark), back to your ground afterwards
  let groundBefore = null;
  $effect(() => {
    const on = cfg.battery;
    untrack(() => {
      if (on && ground !== 'vector') {
        groundBefore = ground;
        ground = 'vector';
      } else if (!on && groundBefore) {
        ground = groundBefore;
        groundBefore = null;
      }
    });
  });

  /* ---------- the stops from outside ---------- */
  let busy = $state('');
  let msg = $state('');
  const fail = (e) => (navigator.onLine === false ? t('You are offline. Try again with internet.') : e?.message === 'busy' ? t('The free service is busy. Try again in a minute.') : t('Could not load. Try again later.'));
  async function getAround(force = false) {
    if (busy || !me) return;
    busy = 'around';
    msg = '';
    try {
      await loadAround(me, { force });
    } catch (e) {
      msg = fail(e);
    } finally {
      busy = '';
    }
  }
  async function getAlong() {
    if (busy || !hasRoute) return;
    busy = 'along';
    msg = '';
    try {
      await loadAlong(tid, pts);
    } catch (e) {
      msg = fail(e);
    } finally {
      busy = '';
    }
  }
  // once, by itself: the stops around you (no route) after the first fix; along the route when it has none
  let triedAround = false;
  $effect(() => {
    if (hasRoute || !me || triedAround || navigator.onLine === false) return;
    triedAround = true;
    untrack(() => getAround());
  });
  let triedAlong = false;
  $effect(() => {
    if (!hasRoute || !rec.on || triedAlong || $osmQ === undefined || pois.length || navigator.onLine === false) return;
    triedAlong = true;
    untrack(() => getAlong());
  });

  /* ---------- options at work (each tick) ---------- */
  let said = new Set();
  let offState = 'on';
  let offWarn = $state(false);
  let eatFromKm = $state(null);
  let eatRang = false;
  let storm = $state(null); // { km, at, sure }
  let stormAt = 0;
  let bat = $state(null); // { level, at }
  let batFirst = null;
  let batteryApi = null;
  const lang = () => (locale() === 'de-CH' ? 'de-CH' : 'en-GB');

  function step() {
    now = Date.now();
    const h = rec.here;
    if (h && (!me || h.at !== me.at)) me = { ...h };
    if (!rec.on || !me) return;
    if (follow) mapView?.show?.(me.lat, me.lon, 14);
    // voice
    if (cfg.voice) {
      const s = nextSay({ stop: stops[0] ?? null, climb, said });
      if (s) {
        said.add(s.id);
        say(t(s.key, s.vars), lang());
      }
    }
    // off-route
    if (cfg.offRoute && at) {
      const r = offRouteStep(at.offM, offState, 100);
      offState = r.state;
      offWarn = r.state === 'off';
      if (r.warn) {
        beep();
        buzz([400, 150, 400]);
      }
    } else offWarn = false;
    // eat every 300 m up
    if (cfg.eatHm && km != null) {
      if (eatFromKm == null) eatFromKm = km;
      const d = eatDue({ lastAt: now, now, gainSince: gainBetween(profile, eatFromKm, km), everyMin: 1e9, everyHm: 300 });
      if (d.due && !eatRang) {
        eatRang = true;
        buzz([250, 120, 250]);
      }
    }
    // storm: every 15 min
    if (cfg.storm && navigator.onLine !== false && now - stormAt > 15 * 6e4) {
      stormAt = now;
      checkStorm();
    }
    // battery
    if (cfg.battery) readBattery();
    // the family link (Reise-Spur) shows where you are, when the tour has one (familylive.js)
    if (trip?.spurLink?.id && navigator.onLine !== false && now - familyAt >= LIVE_EVERY_MS) {
      familyAt = now;
      refreshFamilyLink(trip, me);
    }
  }
  let familyAt = 0;
  const eatGain = $derived(cfg.eatHm && km != null && eatFromKm != null ? gainBetween(profile, eatFromKm, km) : 0);
  async function ateNow() {
    eatFromKm = km;
    eatRang = false;
    const e = eatOf($eatQ?.value, Date.now());
    if (e) await db.settings.put({ key: EAT_KEY, value: eaten(e, Date.now()) });
  }
  // eaten on the eat card → the 300 m count starts again too
  let eatLast = null;
  $effect(() => {
    const last = $eatQ?.value?.last ?? null;
    if (last && last !== eatLast) {
      if (eatLast != null) untrack(() => {
        eatFromKm = km;
        eatRang = false;
      });
      eatLast = last;
    }
  });

  async function checkStorm() {
    const points = stormPoints({ pts: hasRoute ? pts : [], km, here: me, kmh });
    if (!points.length) return;
    try {
      const res = await fetch(stormUrl(points));
      if (!res.ok) return;
      const s = stormAhead(await res.json(), points, Date.now(), 2);
      if (s && !storm) buzz([500, 200, 500, 200, 500]);
      storm = s;
    } catch {
      /* no answer: try again in 15 min */
    }
  }
  $effect(() => {
    if (cfg.storm && rec.on && me) untrack(() => stormAt === 0 && ((stormAt = Date.now()), checkStorm()));
  });

  const hasBattery = typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function';
  async function readBattery() {
    try {
      batteryApi ??= await navigator.getBattery();
      const r = { level: batteryApi.level, at: Date.now() };
      batFirst ??= r;
      bat = r;
    } catch {
      bat = null;
    }
  }
  $effect(() => {
    if (cfg.battery && hasBattery) untrack(readBattery);
  });
  const hoursLeft = $derived(arr ? (arr.eta - now) / 36e5 : null);
  const batEst = $derived(bat ? batteryEnough({ level: bat.level, drainPerH: drainOf(batFirst, bat), hoursLeft, saver: cfg.battery }) : null);

  /* ---------- sheets ---------- */
  let sos = $state(false);
  let place = $state(false);
  let profileKm = $state(null);
  $effect(() => {
    if (km != null) profileKm = km;
  });
  const recenter = () => {
    follow = true;
    if (me) mapView?.show?.(me.lat, me.lon, 14);
  };
</script>

<div class="lv" data-page="live">
  <Crumb path={[{ href: '#/trips', label: t('Trips|place') }]} here={t('Live map')} />
  <h1 class="rc-h1" tabindex="-1" data-page-title>{t('Live map')}</h1>
  <p class="rc-intro">
    {#if trip}{trip.title}{#if hasRoute} · {t('{km} km · {up} m up', { km: Math.round(route.km || pts.at(-1).km), up: Math.round(route.gainM ?? 0).toLocaleString() })}{/if}{:else}{t('A ride without a tour: the map shows where you are and the stops around you.')}{/if}
  </p>
  {#if trip && !hasRoute}<p class="rc-note" data-live-noroute>{t('This tour has no route: the map shows the stops around you. With a route (GPX) you also get km, arrival and climbs.')}</p>{/if}

  <!-- 1 · start and stop -->
  <section class="lv-go" aria-label={t('The ride')}>
    {#if rec.on}
      <div class="lv-go-row">
        <span class="lv-rec" role="status"><span class="lv-dot" aria-hidden="true"></span>{t('Ride running')} · {num(rec.km)} km{#if rec.acc != null} · ± {rec.acc} m{/if}</span>
        <button type="button" class="btn lv-stop" onclick={stop} data-live-stop><Square size={18} aria-hidden="true" />{t('Stop the ride')}</button>
      </div>
      {#if !me}<p class="rc-note" role="status">{t('Waiting for the GPS …')}</p>{/if}
    {:else}
      <div class="lv-go-row">
        <button type="button" class="btn hi lv-start" onclick={() => start()} data-live-start><Play size={20} aria-hidden="true" />{t('Start the ride')}</button>
        {#if left}<button type="button" class="btn" onclick={() => start(left)} data-live-continue>{t('Continue the ride from {time}', { time: zurichTime(left.startAt) })}</button>{/if}
      </div>
    {/if}
    {#if err || rec.error}<p class="rc-warn" role="alert">{err || t(rec.error)}</p>{/if}
    <p class="rc-note">{t('Your position runs only while this page is open and the screen stays on. That needs battery: best with the phone on the handlebar and on power. The ride is recorded in the travel track at the same time.')}</p>
  </section>

  {#if after}
    <section class="rc-box lv-after" data-live-after aria-label={t('After the ride')}>
      <h2 class="rc-h2">{t('Ride done')}</h2>
      {#if after.ride}
        <p class="rc-text">{t('{km} km recorded. The line is in the travel track of the day.', { km: num(after.ride.km ?? 0) })}</p>
        {#if loadAfter}
          {#await loadAfter() then m}
            <m.default ride={after.ride} {trip} />
          {:catch}
            <p class="rc-note">{t('The summary could not load. The ride is saved.')}</p>
          {/await}
        {/if}
      {:else}
        <p class="rc-text">{t('Too few points to keep this ride.')}</p>
      {/if}
    </section>
  {/if}

  <!-- 3 · the panel: big numbers first (phone) -->
  {#if rec.on && me}
    <section class="lv-panel" aria-label={t('Where you are')} data-live-panel>
      <div class="lv-big">
        {#if hasRoute}
          <div data-live-km><b>{fmtKm(km)}</b><small>{t('km done')}</small></div>
          <div data-live-left><b>{fmtKm(arr?.kmLeft)}</b><small>{t('km to go')}</small></div>
        {:else}
          <div data-live-km><b>{fmtKm(rec.km)}</b><small>{t('km ridden')}</small></div>
          <div><b>{minText(Math.round(pz.movingS / 60)) || '0 min'}</b><small>{t('moving')}</small></div>
        {/if}
      </div>
      {#if arr}
        <p class="lv-line" data-live-arrival>
          <Flag size={18} aria-hidden="true" />
          <span>
            {#if light && !light.dark && light.minLeft > 0}
              {t('Arrival about {at}, {left} of light left', { at: when(arr.eta), left: minText(light.minLeft) })}
            {:else}
              {t('Arrival about {at} · it is dark', { at: when(arr.eta) })}
            {/if}
          </span>
        </p>
        {#if darkMin > 0}<p class="rc-warn lv-line" data-live-dark><Moon size={18} aria-hidden="true" /><span>{t('You arrive {n} after dark: lights on.', { n: minText(darkMin) })}</span></p>{/if}
        <p class="rc-src">{t('At your pace of {kmh} km/h while moving, slower uphill; stops not counted.', { kmh: num(kmh) })}</p>
      {:else if light}
        <p class="lv-line"><Clock size={18} aria-hidden="true" /><span>{light.dark ? t('It is dark.') : t('{left} of light left', { left: minText(light.minLeft) })}</span></p>
      {/if}
      {#if offWarn}<p class="rc-warn lv-line" role="alert" data-live-offroute><TriangleAlert size={18} aria-hidden="true" /><span>{t('Off the route: {m} m away.', { m: at?.offM })}</span></p>{/if}
      {#if storm}<p class="rc-warn lv-line" role="alert" data-live-storm><CloudLightning size={18} aria-hidden="true" /><span>{storm.km != null ? t('Thunderstorm possible around km {km} from {at}.', { km: storm.km, at: hhmm(storm.at) }) : t('Thunderstorm possible here from {at}.', { at: hhmm(storm.at) })} {storm.sure ? '' : t('(high storm energy in the air)')}</span></p>{/if}
      {#if cfg.eatHm && eatGain >= 300}<p class="rc-warn lv-line" role="alert"><Utensils size={18} aria-hidden="true" /><span>{t('{m} m up since you last ate: time to eat.', { m: eatGain })}</span> <button type="button" class="btn sm" onclick={ateNow}>{t('Eaten')}</button></p>{/if}
      {#if batEst}<p class="lv-line" class:rc-warn={batEst.enough === false} data-live-battery><BatteryMedium size={18} aria-hidden="true" /><span>{t('Battery {p} %: lasts about {h} h', { p: Math.round(bat.level * 100), h: num(batEst.hours) })}{#if batEst.enough != null} · {batEst.enough ? t('enough to the finish') : t('not enough to the finish: charge or save')}{/if}</span></p>{/if}

      <!-- plan against reality (races) -->
      {#if isRace && plan}
        {#if delta != null}
          <p class="lv-line" class:rc-ok={delta >= 0} class:rc-warn={delta < 0} data-live-plan>
            <Clock size={18} aria-hidden="true" />
            <span>{delta >= 0 ? t('{t} ahead of the plan', { t: minText(delta) }) : t('{t} behind the plan', { t: minText(-delta) })}</span>
          </p>
        {:else}
          <p class="rc-note" data-live-plan>{t('Plan against reality shows during the race (from {day}).', { day: when(plan.start) })}</p>
        {/if}
      {/if}
      {#if bed}
        <div class="lv-bed" data-live-bed>
          {#if bed.planned}<p class="lv-line"><Moon size={18} aria-hidden="true" /><span>{t('Bed of the plan: km {km}', { km: Math.round(bed.planned.km) })}{#if bed.planned.name} · {bed.planned.name}{/if}{#if running && bed.planned.at} · {when(bed.planned.at)}{/if}</span></p>{/if}
          {#if bed.best}<p class="lv-line"><Moon size={18} aria-hidden="true" /><span>{t('Reachable tonight: {name}, km {km}, in {d} km, about {at}', { name: bed.best.name || kindName('sleep'), km: Math.round(bed.best.km), d: fmtKm(bed.best.distKm), at: when(bed.best.eta) })}</span></p>{/if}
          <p class="rc-src">{t('The last place to sleep you reach before the bedtime of your plan, else before sunset, at your pace now.')}</p>
        </div>
      {/if}
    </section>
  {/if}

  <!-- 2 · the map -->
  <section class="lv-map" aria-label={t('Map|race')}>
    <MapView
      bind:this={mapView}
      bind:ground
      bind:shown
      prefsKey="live"
      line={route?.line ?? []}
      points={mapPoints}
      me={me ? { lat: me.lat, lon: me.lon, acc: me.acc } : null}
      {overlays}
      {toggles}
      label={t('Live map')}
    />
    <div class="rc-acts">
      <button type="button" class="btn sm" aria-pressed={follow} onclick={() => (follow ? (follow = false) : recenter())} data-live-follow><Crosshair size={16} aria-hidden="true" />{follow ? t('Map follows you') : t('Follow me')}</button>
    </div>
    <p class="rc-note">{t('«Map follows you» keeps you in the middle; switch it off to look around. The map ground and the layers are under the map.')}</p>
    {#if msg}<p class="rc-warn" role="alert">{msg}</p>{/if}
  </section>

  <!-- the next stops -->
  {#if rec.on && me}
    <section class="rc-box" aria-labelledby="lv-stops-h" data-live-stops>
      <h2 class="rc-h2" id="lv-stops-h">{hasRoute ? t('Next stops on the route') : t('Stops around you')}</h2>
      {#if stops.length}
        <ul class="rc-list">
          {#each stops as s (s.id)}
            {@const l = navLinks({ lat: Number(s.lat), lon: Number(s.lon) })}
            <li class="rc-row lv-srow" data-live-stop-row={s.kind}>
              <span class="rc-row-main">
                <b>{s.name || kindName(s.kind)}</b>
                <small>{kindName(s.kind)} · <span data-live-dist>{t('{d} km', { d: fmtKm(s.distKm) })}</span>{s.along ? '' : ` ${t('as the crow flies')}`} · {t('there about {at}', { at: when(s.eta) })} · <span class:lv-closed={s.open?.open === false}>{openLine(s)}</span></small>
              </span>
              <details class="lv-nav">
                <summary class="btn sm"><Navigation size={16} aria-hidden="true" />{t('Navigate')}</summary>
                <div class="lv-nav-menu">
                  <a class="btn sm" href={l.google} target="_blank" rel="noopener noreferrer">{t('Google Maps')}</a>
                  <a class="btn sm" href={l.osmand} target="_blank" rel="noopener noreferrer">{t('OsmAnd')}</a>
                </div>
              </details>
            </li>
          {/each}
        </ul>
        <p class="rc-src">{hasRoute ? t('Distance along the route; the time at your pace; opening hours from OpenStreetMap when known.') : t('Straight-line distance from where you are; the time at your pace; opening hours from OpenStreetMap when known.')}</p>
      {:else}
        <p class="rc-empty" data-live-nostops>{busy ? t('Loading…') : hasRoute ? t('No stops ahead on the route yet.') : t('No stops around you found yet.')}</p>
      {/if}
      <div class="rc-acts">
        {#if hasRoute}
          <button type="button" class="btn sm" onclick={getAlong} disabled={!!busy}><RefreshCw size={16} aria-hidden="true" />{busy === 'along' ? t('Loading…') : t('Load stops along the route')}</button>
        {:else}
          <button type="button" class="btn sm" onclick={() => getAround(true)} disabled={!!busy}><RefreshCw size={16} aria-hidden="true" />{busy === 'around' ? t('Loading…') : t('Look for stops around me')}</button>
        {/if}
      </div>
    </section>
  {:else if !rec.on && !after}
    <p class="rc-empty" data-live-empty>{t('Start the ride: then the map shows where you are, and the stops ahead or around you with their distance.')}</p>
  {/if}

  <!-- the next climb and the profile from your km -->
  {#if rec.on && hasRoute && profile.length > 1}
    <section class="rc-box" aria-labelledby="lv-climb-h">
      <h2 class="rc-h2" id="lv-climb-h"><Mountain size={20} aria-hidden="true" /> {t('Next climb')}</h2>
      {#if climb}
        <p class="lv-line" data-live-climb>
          {#if climb.onIt}
            {t('You are on a climb: {d} km to the top at {top} m, {pct} % on average.', { d: fmtKm(Math.max(0, climb.toKm - km)), top: num(climb.top), pct: num(climb.grade) })}
          {:else}
            {t('In {d} km: {len} km at {pct} %, {gain} m up to {top} m.', { d: fmtKm(climb.distKm), len: fmtKm(climb.toKm - climb.fromKm), pct: num(climb.grade), gain: num(climb.gain), top: num(climb.top) })}
          {/if}
        </p>
      {:else if km != null}
        <p class="rc-note">{t('No climb of 100 m or more ahead.')}</p>
      {/if}
      <ProfileStrip {profile} bind:cursorKm={profileKm} />
      <p class="rc-note">{t('The dot is where you are. Tap the profile to look ahead; it jumps back with your next position.')}</p>
    </section>
  {/if}

  <!-- pauses -->
  {#if rec.on && row?.pts?.length > 1}
    <section class="rc-box" aria-labelledby="lv-pz-h" data-live-pauses>
      <h2 class="rc-h2" id="lv-pz-h">{t('Moving and stopped')}</h2>
      <div class="rc-stat">
        <div><b>{minText(Math.round(pz.movingS / 60)) || '0 min'}</b><small>{t('moving')}</small></div>
        <div><b>{minText(Math.round(pz.stoppedS / 60)) || '0 min'}</b><small>{tn(pz.stops.length, '{n} stop', '{n} stops')}</small></div>
      </div>
      <p class="rc-note">{t('A stop is 2 minutes or more within 40 m.')}</p>
    </section>
  {/if}

  <!-- 6 · notes with place -->
  <section class="rc-box" aria-labelledby="lv-notes-h">
    <h2 class="rc-h2" id="lv-notes-h">{t('Notes on the way')}</h2>
    <div class="rc-acts">
      <button type="button" class="btn" onclick={() => (place = true)} data-live-place><MapPin size={18} aria-hidden="true" />{t('I am here')}</button>
      <!-- slot for the dictation of a later package (src/lib/live/dictation.js) -->
      <div class="lv-dictation" data-live-dictation-slot>
        {#if DICTATION}
          {@const D = DICTATION}
          <D {trip} here={me} />
        {/if}
      </div>
    </div>
    <p class="rc-note">{t('A sentence and a photo with the place: it shows on the tour map and in the day of the travel track.')}</p>
  </section>

  {#if rec.on}
    <Essen tripId={trip?.id ?? null} until={plan && running ? plan.end : null} />
  {/if}

  <!-- 4 · options -->
  <details class="rc-box lv-opts" data-live-options>
    <summary class="lv-opts-sum"><Settings size={18} aria-hidden="true" />{t('Settings|live')}</summary>
    <p class="rc-note">{t('All off by default; switch on what helps you. Kept on this device.')}</p>
    <ul class="rc-list">
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.voice} onchange={(e) => setOpt('voice', e.currentTarget.checked)} data-live-opt="voice" /><span><b>{t('Voice announcements')}</b><small>{t('The phone says the next shop or climb a few km ahead.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.offRoute} onchange={(e) => setOpt('offRoute', e.currentTarget.checked)} disabled={!hasRoute} data-live-opt="offRoute" /><span><b>{t('Off-route warning')}</b><small>{hasRoute ? t('A tone and a vibration when you are more than 100 m off the route.') : t('Needs a route.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.eatHm} onchange={(e) => setOpt('eatHm', e.currentTarget.checked)} disabled={!hasRoute} data-live-opt="eatHm" /><span><b>{t('Eat every 300 m up')}</b><small>{t('On top of the eat reminder by time: a vibration after 300 m of climbing.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.battery} onchange={(e) => setOpt('battery', e.currentTarget.checked)} data-live-opt="battery" /><span><b>{t('Battery saver')}</b><small>{t('A simple light map, the map moves every 10 s instead of every 2 s, and less exact GPS (from the next start).')}{#if hasBattery} {t('Shows whether the battery lasts to the finish.')}{/if}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.storm} onchange={(e) => setOpt('storm', e.currentTarget.checked)} data-live-opt="storm" /><span><b>{t('Thunderstorm alert')}</b><small>{t('Every 15 min the forecast for the next 2 hours where you ride (Open-Meteo, free): a line and a vibration.')}</small></span></label>
      </li>
    </ul>
  </details>
</div>

<button type="button" class="lv-sos" onclick={() => (sos = true)} aria-label={t('Emergency')} data-live-sos><LifeBuoy size={20} aria-hidden="true" /><span>SOS</span></button>

{#if sos}<SosSheet here={me} {km} {routeName} {pois} onclose={() => (sos = false)} />{/if}
{#if place}<PlaceSheet {trip} onclose={() => (place = false)} />{/if}

<style>
  .lv {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    min-width: 0;
    max-width: 960px;
  }
  .lv-go {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lv-go-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .lv-start {
    min-height: 56px;
    font-size: var(--fs-sub);
    gap: 8px;
  }
  .lv-stop {
    gap: 6px;
    border-color: var(--bad);
    color: var(--bad);
  }
  .lv-rec {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .lv-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--bad);
  }
  .lv-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .lv-big {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .lv-big > div {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
  }
  .lv-big b {
    font: 700 var(--fs-display)/1.05 var(--font-body);
    font-variant-numeric: tabular-nums;
  }
  .lv-big small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lv-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
    min-width: 0;
  }
  .lv-line :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .lv-bed {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lv-map {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .lv-closed {
    color: var(--bad);
  }
  .lv-nav {
    position: relative;
    flex: none;
  }
  .lv-nav summary {
    list-style: none;
    gap: 4px;
  }
  .lv-nav summary::-webkit-details-marker {
    display: none;
  }
  .lv-nav-menu {
    position: absolute;
    right: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    box-shadow: 0 4px 12px var(--shadow);
  }
  .lv-opts-sum {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    font-weight: 700;
    cursor: pointer;
  }
  .lv-opt {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    width: 100%;
  }
  .lv-opt input {
    width: 22px;
    height: 22px;
    flex: none;
    margin-top: 2px;
  }
  .lv-opt span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .lv-opt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lv-dictation:empty {
    display: none;
  }
  .lv-sos {
    position: fixed;
    right: 12px;
    bottom: calc(104px + env(safe-area-inset-bottom));
    z-index: 20;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 56px;
    min-height: 48px;
    padding: 0 14px;
    border: 2px solid var(--bad);
    border-radius: 24px;
    background: var(--paper);
    color: var(--bad);
    font: 700 var(--fs-body)/1 var(--font-body);
    box-shadow: 0 2px 8px var(--shadow);
    cursor: pointer;
  }
  @media (min-width: 720px) {
    .lv-sos {
      bottom: 24px;
      right: 24px;
    }
  }
</style>
