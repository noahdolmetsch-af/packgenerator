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
   *
   * Paket U3 neu (Noah 19.10.2026 «1a und b 2b 3b 4b 5a», like komoot / Google Maps): while the ride runs
   * the map fills the screen. On top a band of big numbers (3 at the start: km done, km to go, arrival;
   * you choose up to 6 and their order, livemap.js). North stays up, you are an arrow; the start view
   * shows the next 20 km, then the map follows you (it moves when you near the edge; «Follow me» after
   * you moved it). The ridden part is faded, the climbs ahead are coloured by steepness (fine profile).
   * Stops are small symbols. A bottom sheet (drag the handle; three heights): the next stop and climb;
   * pulled up the stops with Navigate, your profile from your km, the eat card, the numbers, the options
   * and «Stop the ride». SOS, «I am here», the map ground, the layers, the offline strips and the place
   * search are in the «⋯» menu top right. Sideways (handlebar): the map left, the numbers right.
   */
  import { untrack, tick } from 'svelte';
  import { liveQuery } from 'dexie';
  import { CloudRain, Route, Play, Square, Crosshair, MapPin, Navigation, Mountain, Clock, Settings, BatteryMedium, CloudLightning, TriangleAlert, RefreshCw, Utensils, Moon, Flag, LifeBuoy, Ellipsis, Minimize2, Maximize2, SlidersHorizontal, Check, X, Layers, Camera, WifiOff } from '@lucide/svelte';
  import KindIcon from '../lib/map/KindIcon.svelte';
  import { DURING_RIDE } from '../lib/live/during.js';
  import { FEATURES } from '../lib/features.js';
  const FEATURE_TITLE = Object.fromEntries(FEATURES.map((f) => [f.id, f.title]));
  import PoiPanel from '../lib/map/PoiPanel.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import OvNearby from '../lib/sources/OvNearby.svelte';
  import { wptsOnMap } from '../lib/route/fromgpx.js';
  import PoiDetail from '../lib/map/PoiDetail.svelte';
  import WxTimeline from '../lib/map/WxTimeline.svelte';
  import LiveRouteBox from '../lib/live/LiveRouteBox.svelte';
  import { liveRouteQuery } from '../lib/live/liveroute.js';
  import OfflineBox from '../lib/map/OfflineBox.svelte';
  import { reserveOf } from '../lib/map/offline.js';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { GROUNDS, SWISS_OVERLAYS } from '../lib/map/sources.js';
  import { chooseGround } from '../lib/map/groundpref.svelte.js';
  import { stretch } from '../lib/map/maplib.js';
  import { fineOf, heightAt, gradeAt } from '../lib/map/fineprofile.js';
  import { zoomFactor } from '../lib/map/zoomfactor.js';
  import { LIVE_TILES, TILE, MAX_TILES, tilesOf, toggleTile, moveTile, tileValues, gainStep, headingOf, aheadLine, gradeLines, sheetSnaps, nearestSnap } from '../lib/live/livemap.js';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import MapView from '../lib/map/MapView.svelte';
  import ProfileStrip from '../lib/map/ProfileStrip.svelte';
  import PlaceSheet from '../lib/spur/PlaceSheet.svelte';
  import Essen from '../lib/unterwegs/Essen.svelte';
  import { dayIndex } from '../lib/ride.js'; // Idee 57: the ride day for the planned stops
  import { localDay as todayLocal } from '../lib/localday.js';
  import SosSheet from '../lib/live/SosSheet.svelte';
  import RerouteSheet from '../lib/live/RerouteSheet.svelte';
  import { onDetour, detourDone, detourGpx, saveDetour, loadDetour, DETOUR_COLOUR, atPlace, returnDetour, backDetour, backtrackOf, planReturn, returnModeStd, shouldReroute, OFF_ROUTE_M } from '../lib/reroute.js';
  import { saveGpx } from '../lib/gpxout.js';
  import { LANDI_RADAR } from '../lib/wetter/kern.js';
  import LiveWetter from '../lib/live/LiveWetter.svelte';
  import LiveEnergie from '../lib/live/LiveEnergie.svelte';
  import LiveEssen from '../lib/live/LiveEssen.svelte';
  import LivePlaceNote from '../lib/tourenb/LivePlaceNote.svelte'; // Idee 55 (Touren b): a note at a point of the route
  import LiveWebcam from '../lib/live/LiveWebcam.svelte';
  import { camsQuery, camsOnMap, camOfPoint } from '../lib/wetter/webcamsmap.js';
  import { db } from '../lib/db.js';
  import { rec, startRecording, stopRecording, openRecording, pauseRecording, resumeRecording, addSensor, setGpsLow, lapRecording } from '../lib/spur/recorder.svelte.js';
  import PauseBar from '../lib/live/PauseBar.svelte';
  import TurnHint from '../lib/live/TurnHint.svelte';
  import { turnsOf, nextTurn, turnSay } from '../lib/live/turns.js';
  import { lapNow, lapsOf, ghostOf, ghostDelta, lastRideOf, deltaText } from '../lib/live/laps.js';
  import DataPages from '../lib/live/DataPages.svelte';
  import LiveSmallMap from '../lib/live/LiveSmallMap.svelte';
  import DataPagesEditor from '../lib/live/DataPagesEditor.svelte';
  import { PAGES_KEY, cleanPages, fieldCatalogue } from '../lib/live/datapages.js';
  import { statsOf } from '../lib/live/ble.js';
  import { distKm as distKmPts } from '../lib/spur/polyline.js';
  import SensorBox from '../lib/live/SensorBox.svelte';
  import { fresh, onValue } from '../lib/live/sensors.svelte.js';
  import { limitStep } from '../lib/live/ble.js';

  import { autoKmhOf, autoPauseStep, speedKmh, movingNow, totalNow, pausedNow, HINT_S, AUTO_MIN_KMH, AUTO_MAX_KMH } from '../lib/live/pause.js';
  import { resumeOf } from '../lib/live/resume.js';
  import { zurichTime } from '../lib/spur/spur.js';
  import { racesQuery, cacheQuery, cacheGet, cacheSet } from '../lib/race/store.js';
  import { raceOf, schedule, lineKm, climbsOf, hhmm, dayOfMs } from '../lib/race/race.js';
  import { POI_CACHE, POI_KIND, WX_CACHE } from '../lib/race/outside.js';
  import { mergePois } from '../lib/race/more.js';
  import { withSampleFine } from '../lib/race/sample.js';
  import { paceFromRides, loadedBy, assumptionsOf, compareWays, simPlan } from '../lib/race/strategy.js';
  import { ownQuery, ownOnMap } from '../lib/map/ownpoints.js';
  import { fetchRadar, RADAR_MAX_ZOOM, RADAR_ATTRIBUTION, isOld } from '../lib/map/wx.js';
  import { minText } from '../lib/unterwegs/heimweg.js';
  import { EAT_KEY, eatOf, eaten } from '../lib/unterwegs/essen.js';
  import {
    onRoute, stopsAhead, nextClimb, arrival, lightLeft, darkMinutes, pauses, eatDue, batteryEnough, drainOf, planDelta, offRouteStep, nextSay, navLinks,
    fixesOf, paceOf, planRunning, bedTonight, stormPoints, stormUrl, stormAhead, gainBetween,
  } from '../lib/live/live-lib.js';
  import { AROUND_CACHE, ALONG_AHEAD_KM, loadAround, loadAlong } from '../lib/live/stops.js';
  import { beep, buzz, say } from '../lib/live/alert.js';
  import { DICTATION } from '../lib/live/dictation.js';
  import { refreshFamilyLink, LIVE_EVERY_MS } from '../lib/live/familylive.js';
  // Gruppen-Live-Karte (Noah 25.10.2026 «b»): friends on the map through a link
  import GroupPanel from '../lib/live/GroupPanel.svelte';
  import { endKeptGroup } from '../lib/live/group.js';
  import { saveLiveRide, bookBikeKm, saveLeftRides } from '../lib/live/saveride.js';
  import LiveLabel from '../lib/live/LiveLabel.svelte';
  import { deleteEntries } from '../lib/kmbookdb.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { saveFailed } from '../lib/ui/ask.js';
  import EndRideSheet from '../lib/live/EndRideSheet.svelte';
  import { pointDots } from '../lib/live/event.js';
  import { t, tn, locale, num } from '../lib/i18n.svelte.js';
  import SleepList from '../lib/race/ride/SleepList.svelte';
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
  // a GPX opened on the live map (LiveRouteBox, settings 'live-route') when the ride has no route of its own
  const liveQ = liveRouteQuery(db.settings);
  const route = $derived(withSampleFine(stored)?.route ?? trip?.route ?? (!isRace ? $liveQ : null) ?? null);
  const pts = $derived(lineKm(route));
  const profile = $derived(route?.profile ?? []);
  const hasRoute = $derived(pts.length > 1);
  const routeName = $derived(trip?.title ?? $liveQ?.name ?? '');
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
  const OPTS = { voice: false, offRoute: false, battery: false, eatHm: false, storm: false, autoPause: false, autoKmh: 4, hrMax: 0, powerMax: 0, dim: false, autoData: false, turns: true, turnVoice: true };
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

  const rideName = (ride, tr = trip) => tr?.title || t('Ride {date}', { date: new Date(ride.startAt || Date.now()).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' }) });
  async function start(cont = null) {
    err = '';
    after = null;
    // a ride before that was never ended is not lost: it goes to Touren as its own entry first
    try {
      const kept = await saveLeftRides(db, { keep: cont?.id ?? null, nameOf: rideName });
      if (kept.length) offerDone(t('The ride before was not ended. It is in Trips now too.'));
    } catch (x) {
      err = saveFailed(x);
    }
    const e = await startRecording(trip, { cont, saver: cfg.battery });
    if (e) return (err = t(e));
    eatFromKm = null;
    batFirst = null;
  }
  // after the app loaded anew in the middle of a ride: go on by itself, once (resume.js)
  let resumed = $state(false);
  let resumeTried = false;
  $effect(() => {
    const o = $openQ;
    if (resumeTried || rec.on || o === undefined) return;
    resumeTried = true;
    const r = resumeOf(o, tid);
    if (r) untrack(() => start(r).then(() => (resumed = rec.on)));
  });
  let groupRows = $state([]);
  let groupEnded = $state(false);
  // Live Navigation M9/M10 (Noah 26.10.2026): «Fahrt beenden» asks once, then the ride is saved at once as
  // its own entry in Touren («Live Navigation») and its km go to the bike, with Undo (saveride.js)
  let askEnd = $state(false);
  async function endAnswer(a) {
    askEnd = false;
    if (a === 'end') await stop();
  }
  async function stop() {
    const ride = await stopRecording();
    let saved = null;
    if (ride) {
      const name = rideName(ride);
      try {
        saved = await saveLiveRide(db, ride, { trip, name });
        const b = await bookBikeKm(db, ride, { trip, name, note: t('Live map') });
        if (b) {
          offerDone(t('Saved in Trips. {km} km added to {bike}.', { km: num(b.entry.km), bike: b.bike.name }), async () => {
            await deleteEntries(db, b.ids);
            await db.tracks.update(ride.id, { kmId: null });
          }, 10_000);
        } else offerDone(t('Saved in Trips as «Live Navigation».'));
      } catch (x) {
        err = saveFailed(x);
      }
    }
    after = { ride, saved };
    // the group ride ends with the ride: every place of it is deleted (an event group of several days goes on)
    groupEnded = await endKeptGroup(db);
    groupRows = [];
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
  const pz = $derived(pauses(fixesOf(row), { breaks: rec.on ? rec.breaks : (row?.breaks ?? []) }));
  // Pausieren (pause.js): the riding time runs every second and stands in a pause; the whole time and the pauses
  const breaks = $derived(rec.on ? rec.breaks : (row?.breaks ?? []));
  const movingLive = $derived(rec.on ? movingNow({ movingS: pz.movingS, lastAt: rec.lastAt, now, paused: rec.paused, breaks }) : pz.movingS);
  const totalS = $derived(rec.on ? totalNow(rec.startAt, now) : 0);
  const pausedLive = $derived(pausedNow(breaks, now));
  const fallbackKmh = $derived(isRace ? Number(as?.flatKmh?.value) || 20 : 18);
  const kmh = $derived(paceOf({ km: rec.km, movingS: pz.movingS }, fallbackKmh));
  const pace = $derived({ kmh, climbMh: isRace ? Number(as?.climbMh?.value) || 600 : 600 });
  const light = $derived(me ? lightLeft(me.lat, me.lon, now) : null);
  const arr = $derived(km != null ? arrival({ pts, profile, km, now, pace }) : null);
  // Noah 22.10.2026: petrol stations count as stops too (they were loaded but never shown)
  // «Stopps in der Nähe» (Noah 24.10.2026 «4b»): also WC, cash, pharmacy and a pump
  const KINDS = ['shop', 'fuel', 'food', 'water', 'sleep', 'station', 'bike', 'toilet', 'atm', 'pharmacy', 'repair'];
  // Noah 24.10.2026 «5a»: with a route, the stops along it or around you (a switch)
  let stopsMode = $state('route');
  const alongMode = $derived(hasRoute && stopsMode === 'route');
  const stops = $derived(me ? stopsAhead({ pois: alongMode ? pois : around, pts: alongMode ? pts : [], here: me, km, kinds: KINDS, n: 5, now, pace, profile }) : []);
  const climb = $derived(km != null ? nextClimb(climbs, km) : null);
  // Abbiege-Hinweise (turns.js): the turns of the route, once; the next one while you are on the route
  const turns = $derived(hasRoute ? turnsOf(pts) : []);
  const turnNext = $derived(cfg.turns && at && at.offM < 100 ? nextTurn(turns, at.kmx ?? at.km) : null);
  const running = $derived(planRunning(plan, now));
  const delta = $derived(running && km != null ? planDelta(plan, km, now) : null);
  const bed = $derived(km != null && (isRace || pois.some((p) => p.kind === 'sleep')) ? bedTonight({ plan: running ? plan : null, pois, km, now, pace, profile, light }) : null);
  // U4 «Wo schlafe ich heute?»: the next places to sleep ahead on the route (on by default in a race)
  const wxQ = cacheQuery(WX_CACHE + (tid || '-'));
  const showSleep = $derived(hasRoute && km != null && (cfg.sleepSpots ?? isRace));

  /* ---------- formatting ---------- */
  const when = (ms) => (Number.isFinite(ms) ? (dayOfMs(ms) === dayOfMs(now) ? hhmm(ms) : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'Europe/Zurich' })} ${hhmm(ms)}`) : '');
  const fmtKm = (k) => (k == null ? '–' : k >= 100 ? num(Math.round(k)) : num(Math.round(k * 10) / 10));
  const kindName = (k) => t(POI_KIND[k]?.name ?? 'Other stop');
  const openLine = (s) => {
    // water, beds and stations have no shop hours: say nothing rather than «unknown»
    if (!s.open || s.open.open == null) return ['shop', 'food', 'fuel', 'bike'].includes(s.kind) ? t('Opening hours unknown') : '';
    if (s.open.open) return s.open.closes ? t('Open until {at}', { at: s.open.closes }) : t('Open|hours');
    return s.open.opens ? t('Closed then, opens {at}', { at: s.open.opens }) : t('Closed then');
  };
  const darkMin = $derived(arr && light && dayOfMs(arr.eta) === dayOfMs(now) ? darkMinutes(arr.eta, light) : 0);

  /* ---------- the map ---------- */
  const camsQ = camsQuery();
  let camPicked = $state(null);
  const mapPoints = $derived([
    ...(shown.stops ? pois.map((p) => ({ id: p.id, lat: Number(p.lat), lon: Number(p.lon), kind: p.kind, name: p.name || kindName(p.kind), km: p.km })) : []),
    ...(shown.own ? ownOnMap(own, t) : []),
    ...(shown.own ? camsOnMap($camsQ) : []), // Paket Wetter: your webcams with a place
    // «Neue Quellen»: the waypoints of the tour's GPX file (Ride with GPS, Komoot …)
    ...(shown.own ? wptsOnMap(trip?.route).map((w) => ({ ...w, name: w.name || kindName(w.kind) })) : []),
    // Gruppen-Live-Karte: the others of the group (you are the blue dot)
    ...groupRows.filter((r) => !r.me && r.pos).map((r) => ({ id: `grp-${r.m}`, lat: r.pos[0], lon: r.pos[1], kind: 'friend', name: `${r.name || t('Without a name')}${r.part?.help ? ` (${t('needs help')})` : r.wait ? ` (${t('waiting')})` : ''}`, minZoom: 0 })),
    // Gruppenfahrt für Events: the meeting points and the camp of the group
    ...pointDots(groupRows).map((p) => ({ id: p.id, lat: p.pos[0], lon: p.pos[1], kind: 'friend', name: `${p.n} ${p.text}`, minZoom: 0 })),
    ...(detour ? [{ id: 'detour-target', lat: detour.target.lat, lon: detour.target.lon, kind: detour.target.kind === 'own' ? 'own' : detour.target.kind || 'other', name: detour.target.name || t('Detour'), minZoom: 0 }] : []),
  ]);
  const toggles = $derived([
    { key: 'stops', label: t('Stops') },
    { key: 'own', label: t('My points') },
    { key: 'radar', label: t('Rain radar') },
    { key: 'veloland', label: t('SchweizMobil') },
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
  const overlays = $derived([
    // SchweizMobil (map/sources.js SWISS_OVERLAYS): the signposted cycling routes, under the rain
    ...(shown.veloland ? SWISS_OVERLAYS.filter((o) => o.id === 'veloland') : []),
    ...(shown.radar && radar ? [{ id: 'radar', url: radar.url, maxzoom: RADAR_MAX_ZOOM, opacity: 0.6, attribution: RADAR_ATTRIBUTION }] : []),
  ]);
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

  // Noah 21.10.2026 (picture): the round Pause and lap buttons sit over the bottom fields of a data page;
  // the fields end above them (button 56 px + 12 px gap + a little air)
  const DP_BUTTONS = 76;

  /* ---------- the stops from outside ---------- */
  let busy = $state('');
  let msg = $state('');
  // Live Navigation PR 2: the true reason (stops.js askServers tries every server first)
  const fail = (e) => (navigator.onLine === false ? t('You are offline. Try again with internet.') : e?.message === 'busy' ? t('All OpenStreetMap servers are full or too slow right now.|poi') + ' ' + t('Try again in a minute.|poi') : e?.message === 'net' ? t('No OpenStreetMap server could be reached. Check the internet connection.|poi') : t('Could not load. Try again later.'));
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
  // Noah 22.10.2026: the button said nothing; now the answer stands right under it (stopsMsg)
  let stopsMsg = $state('');
  async function getAlong() {
    if (busy || !hasRoute) return;
    busy = 'along';
    msg = '';
    stopsMsg = '';
    try {
      const from = km ?? 0;
      const list = await loadAlong(tid, pts, { fromKm: from });
      if (!list.some((p) => p.km >= from - 0.1 && p.km - from <= ALONG_AHEAD_KM)) stopsMsg = t('No stops found in the next {km} km.', { km: ALONG_AHEAD_KM });
    } catch (e) {
      msg = fail(e);
      stopsMsg = msg;
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

  /* ---------- Pausieren, Auto-Pause, Sensoren (Noah 20.10.2026) ---------- */
  let fixNow = null;
  let fixPrev = null;
  let fixSeenAt = 0;
  let autoSt = {};
  let standSince = null;
  let standing = $state(false);
  let gainSt = $state({ base: null, gain: 0 });
  let maxKmh = $state(0);
  let hrSt = {};
  let powerSt = {};
  let limitMsg = $state('');
  const autoKmh = $derived(autoKmhOf(cfg.autoKmh));
  async function pauseNow(auto = false) {
    standing = false;
    standSince = null;
    await pauseRecording({ auto });
  }
  async function goOn() {
    autoSt = {};
    await resumeRecording();
  }
  function rideStep() {
    const h = rec.here;
    if (h && h.at !== fixNow?.at) {
      fixPrev = fixNow;
      fixNow = h;
      fixSeenAt = now; // the phone's clock (the GPS time of a fix can differ)
      if (!rec.paused) {
        gainSt = gainStep(gainSt, h.alt);
        const v = speedKmh(fixNow, fixPrev);
        if (Number.isFinite(v) && v < 120 && (h.acc == null || h.acc <= 30) && v > maxKmh) maxKmh = Math.round(v * 10) / 10;
      }
    }
    // the speed now; no new fix for 15 s counts as standing
    let kmhNow = fixNow ? speedKmh(fixNow, fixPrev) : null;
    if (fixNow && now - fixSeenAt > 15_000) kmhNow = 0;
    if (cfg.autoPause && rec.on) {
      const r = autoPauseStep(autoSt, { kmh: kmhNow, now, limit: autoKmh, paused: rec.paused, auto: rec.auto });
      autoSt = r.st;
      if (r.act === 'pause') pauseNow(true);
      if (r.act === 'resume') goOn();
    }
    // the hint: standing a minute without a pause
    if (!rec.paused && !cfg.autoPause && Number.isFinite(kmhNow) && kmhNow < 2) {
      standSince ??= now;
      standing = now - standSince >= HINT_S * 1000;
    } else {
      standSince = null;
      standing = false;
    }
    // your own limits for the pulse and the power (a tone, no judgement)
    const hr = limitStep(hrSt, { value: fresh('hr', now), limit: Number(cfg.hrMax) || 0, now });
    hrSt = hr.st;
    const pw = limitStep(powerSt, { value: fresh('power', now), limit: Number(cfg.powerMax) || 0, now });
    powerSt = pw.st;
    if (hr.ring || pw.ring) {
      beep();
      buzz([300, 120, 300]);
      limitMsg = hr.ring ? t('Heart rate above {n} bpm for a minute.', { n: cfg.hrMax }) : t('Power above {n} W for a minute.', { n: cfg.powerMax });
    }
    if (hrSt.since == null && powerSt.since == null) limitMsg = '';
    // Stromsparen 1a: your own pause or a minute standing → the GPS asks less (an auto-pause keeps it exact, to go on at once)
    setGpsLow((rec.paused && !rec.auto) || standing);
  }
  // the sensor values go with the recording (every 5 s)
  $effect(() => onValue((kind, v, at) => addSensor(kind, v, at)));
  $effect(() => {
    if (!rec.on) untrack(() => {
      gainSt = { base: null, gain: 0 };
      maxKmh = 0;
      autoSt = {};
      standing = false;
    });
  });

  function step() {
    now = Date.now();
    const h = rec.here;
    if (h && (!me || h.at !== me.at)) me = { ...h };
    if (rec.on) rideStep();
    if (!rec.on || !me) return;
    // on a data page the map is not moved (Stromsparen 2a: no drawing while you do not see it)
    if (follow && viewSet && dpIndex === 0) mapView?.keep?.(me.lat, me.lon, sheetPx);
    // the turn ahead (Abbiege-Hinweise): its voice first, before the stops and climbs
    const ts = cfg.turns && cfg.turnVoice && turnNext ? turnSay(turnNext, turnNext.distM, said) : null;
    if (ts) {
      said.add(ts.id);
      say(t(ts.key, ts.vars), lang());
    }
    // voice
    if (cfg.voice && !ts) {
      const s = nextSay({ stop: stops[0] ?? null, climb, said });
      if (s) {
        said.add(s.id);
        say(t(s.key, s.vars), lang());
      }
    }
    // off-route
    if (cfg.offRoute && at) autoStep();
    if (cfg.offRoute && at && !onDetour(detour, me) && autoHold !== 'free') {
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
    // the battery: with the saver every tick, else once a minute (the «Battery» field of the data pages)
    if (hasBattery && (cfg.battery || now - batAt > 60_000)) {
      batAt = now;
      readBattery();
    }
    // the family link (Reise-Spur) shows where you are, when the tour has one (familylive.js)
    if (trip?.spurLink?.id && navigator.onLine !== false && now - familyAt >= LIVE_EVERY_MS) {
      familyAt = now;
      refreshFamilyLink(trip, me);
    }
  }
  let familyAt = 0;
  let batAt = 0;
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

  /* ---------- «Neu planen zu …» (Paket X, reroute.js) ---------- */
  let reroute = $state(false);
  let picked = $state(null); // a point pressed long on the map
  let detour = $state(loadDetour());
  let gpxMsg = $state('');
  const setDetour = (d, fit = true) => {
    detour = d;
    gpxMsg = '';
    backErr = '';
    saveDetour(d);
    if (fit && d?.line?.length > 1) {
      follow = false;
      mapView?.fitLine?.(d.line.map(([a, b]) => [a, b]), sheetPx);
    }
  };
  // back on the route past the rejoin point (or at the place): the detour has done its job
  $effect(() => {
    if (detour && detourDone(detour, { km, here: me, offM: at?.offM ?? null })) untrack(() => setDetour(null));
  });

  /* ---------- Umweg und zurück (Noah 27.10.2026 «1a 2b 3a», PR 5) ---------- */
  // 1a: at the place the app asks how you go back; a race chooses «back where I left» first
  let backPick = $state(null);
  const backMode = $derived(backPick ?? returnModeStd(isRace));
  let backBusy = $state(false);
  let backErr = $state('');
  const arrived = $derived(hasRoute && detour?.fromKm != null && atPlace(detour, me));
  const routerErr = (e) =>
    e?.message === 'busy'
      ? t('The bike router is busy right now. Try again in a minute, or use a navigation app.')
      : navigator.onLine === false
        ? t('Offline: a new way needs the internet. A navigation app with offline maps still works.')
        : t('The bike router did not answer. Try again, or use a navigation app.');
  async function planBack() {
    if (!me || !detour || backBusy) return;
    backBusy = true;
    backErr = '';
    const exitKm = detour.fromKm;
    try {
      const r = await planReturn({ here: me, mode: backMode, pts, exitKm, profile: detour.profile });
      setDetour(returnDetour(r, { exitKm, back: backMode }));
    } catch (e) {
      backErr = routerErr(e);
    } finally {
      backBusy = false;
    }
  }
  // 2b: off the route the app plans the way back by itself (with the off-route warning on);
  // «Undo» waits until you are back on the route, «Go on without the route» also keeps the warning quiet
  let offSince = null;
  let lastOnKm = null;
  let autoAt = null;
  let autoBusy = false;
  let autoHold = $state(null); // null | 'undo' | 'free'
  function autoStep() {
    if (at.offM <= OFF_ROUTE_M) {
      offSince = null;
      lastOnKm = at.km;
      autoHold = null;
      return;
    }
    offSince ??= now;
    if (detour || autoHold || autoBusy || lastOnKm == null || !navigator.onLine) return;
    if (shouldReroute({ offM: at.offM, offSince, lastAt: autoAt, now })) autoPlan(lastOnKm);
  }
  async function autoPlan(exitKm) {
    autoBusy = true;
    autoAt = now;
    try {
      const r = await planReturn({ here: me, mode: 'fast', pts, exitKm });
      if (!detour) setDetour(returnDetour(r, { exitKm, back: 'auto' }), false);
    } catch {
      /* no answer: the off-route warning still tells you, the next try in a minute */
    } finally {
      autoBusy = false;
    }
  }
  // 3a (Noah): «Gleichen Weg zurück»: your own track back to where you left the route, no router
  const sameBack = $derived(detour?.back === 'auto' && hasRoute ? backtrackOf(fixesOf(row), pts) : null);
  const autoUndo = () => ((autoHold = 'undo'), setDetour(null));
  const autoFree = () => ((autoHold = 'free'), setDetour(null));
  const takeSame = () => sameBack && setDetour(backDetour(sameBack), false);
  const detourLine = $derived(detour ? detour.line.map(([a, b]) => [a, b]) : []);
  async function detourToGarmin() {
    const name = `${t('Detour')} ${detour.target.name || ''}`.trim();
    const r = await saveGpx(detourGpx(detour, hasRoute ? pts : [], name), name);
    gpxMsg = r === 'cancelled' ? '' : t('GPX saved: open it in Garmin Connect, Wahoo or komoot and send it to the bike computer.');
  }
  let profileKm = $state(null);
  $effect(() => {
    if (km != null) profileKm = km;
  });
  const recenter = () => {
    follow = true;
    if (me) mapView?.centerOn?.(me.lat, me.lon, 14, sheetPx);
  };

  /* ---------- the full-screen map (Paket U3 neu) ---------- */
  let small = $state(false); // «Leave the full view»: the page under it, the ride goes on
  const full = $derived(rec.on && !small);
  const f = $derived(hasRoute ? fineOf(route?.profileFine ?? null, profile) : null);
  // your direction: from the last fix at least 8 m away (north stays up, the arrow turns)
  let deg = $state(null);
  let prevFix = null;
  $effect(() => {
    const m = me;
    if (!m) return;
    untrack(() => {
      const h = headingOf(m, prevFix);
      if (h != null) {
        deg = h;
        prevFix = m;
      } else if (!prevFix) prevFix = m;
    });
  });
  const meOnMap = $derived(me ? { lat: me.lat, lon: me.lon, acc: me.acc, deg: deg ?? undefined } : null);
  // the route: ridden part faded, the climbs ahead coloured (recomputed every 500 m)
  const kmStep = $derived(km == null ? null : Math.floor(km * 2) / 2);
  const done = $derived(kmStep != null && kmStep > 0 ? stretch(pts, 0, kmStep) : []);
  const grades = $derived(kmStep != null && route?.profileFine ? gradeLines(pts, route.profileFine, kmStep, kmStep + 150, 0.5) : []);
  // the start view: the next 20 km ahead (or you), once the map and the first fix are there
  let viewSet = false;
  $effect(() => {
    if (!full || !me || viewSet || !mapView) return;
    untrack(async () => {
      await tick();
      await new Promise((r) => setTimeout(r, 400)); // the map needs its first frame
      if (viewSet || !mapView) return;
      viewSet = true;
      if (hasRoute && km != null) mapView.fitLine?.(aheadLine(pts, km, 20), sheetPx);
      else mapView.centerOn?.(me.lat, me.lon, 14, sheetPx);
    });
  });
  $effect(() => {
    if (!rec.on) viewSet = false;
  });

  /* the numbers on top */
  // a ride without a route starts with km ridden, riding time and the clock
  const chosen = $derived(cfg.tiles || hasRoute ? tilesOf(cfg.tiles) : ['done', 'moving', 'clock']);
  const tiles = $derived(chosen.filter((k) => hasRoute || !TILE[k].route));
  const saveTiles = (list) => setOpt('tiles', list);
  const nextTop = $derived(climb && km != null ? { distKm: Math.max(0, climb.toKm - km) } : null);
  const vals = $derived(
    tileValues({
      now,
      km,
      ridden: rec.km,
      left: arr?.kmLeft,
      eta: arr?.eta,
      movingS: movingLive,
      totalS,
      hr: fresh('hr', now),
      power: fresh('power', now),
      cadence: fresh('cadence', now),
      gain: gainSt.gain,
      maxKmh,
      stops: pz.stops.length,
      kmh: pz.movingS >= 60 ? kmh : null, // the average only once you have ridden (not the assumed pace)
      speed: me?.speed ?? null,
      height: f && km != null ? heightAt(f, km) : null,
      grade: f && km != null ? gradeAt(f, km, 0.1) : null,
      top: nextTop,
      stop: stops[0] ?? null,
      lightMin: light && !light.dark ? light.minLeft : null,
      dark: !!light?.dark,
      delta,
      clock: (ms) => hhmm(ms),
    }),
  );
  /* «Datenseiten wie am Garmin» (datapages.js): the map is page 0, then the rider's pages */
  const pagesQ = liveQuery(() => db.settings.get(PAGES_KEY));
  const dpSet = $derived(cleanPages($pagesQ?.value));
  const savePages = (v) => db.settings.put({ key: PAGES_KEY, value: $state.snapshot(v) });
  const dpFields = fieldCatalogue(LIVE_TILES);
  let dpIndex = $state(0);
  let dpEdit = $state(null);
  let dpOpen = $state(false);
  const sn = $derived(row?.sensors ?? {});
  // the speed of the ride from the kept points (km/h between two points)
  const speedSeries = $derived.by(() => {
    const p = row?.pts ?? [];
    const out = [];
    for (let i = 1; i < p.length; i++) {
      const dt = (p[i][2] ?? 0) - (p[i - 1][2] ?? 0);
      if (dt <= 0) continue;
      const d = distKmPts(p[i - 1], p[i]);
      const v = (d / dt) * 3600;
      if (v < 120) out.push([p[i][2], Math.round(v * 10) / 10]);
    }
    return out;
  });
  const series = $derived({ hr: sn.hr ?? [], power: sn.power ?? [], cadence: sn.cadence ?? [], speed: speedSeries });
  const profileAhead = $derived(km != null && profile.length > 1 ? profile.filter((x) => x[0] >= km - 0.5 && x[0] <= km + 50) : []);
  // Runden (laps.js): the running lap
  const lap = $derived(rec.on ? lapNow(rec.laps, { km: rec.km, movingS: movingLive, now, startAt: rec.startAt }) : null);
  async function newLap() {
    await lapRecording({ movingS: movingLive });
    buzz([120]);
  }
  // «Gegen dich selbst» (laps.js): your last closed ride of this tour along the route
  const pastQ = liveQuery(() => db.tracks.where('kind').equals('rec').toArray());
  const pastRide = $derived(hasRoute ? (lastRideOf($pastQ ?? [], { tripId: tid || null, notId: rec.id })[0] ?? null) : null);
  const ghost = $derived(pastRide ? ghostOf(pastRide, pts) : []);
  let ghostStart = $state(null); // the route km where this ride began
  $effect(() => {
    if (!rec.on) ghostStart = null;
    else if (ghostStart == null && at && at.offM < 300) ghostStart = at.kmx ?? at.km;
  });
  const ghostS = $derived(ghost.length && at && at.offM < 300 && ghostStart != null ? ghostDelta(ghost, { km: at.kmx ?? at.km, movingS: movingLive, startKm: ghostStart }) : null);
  const hrStats = $derived(statsOf(sn.hr));
  const pwStats = $derived(statsOf(sn.power, { noZero: true }));
  const dash = { value: '–' };
  const vv = (x) => (x == null || !Number.isFinite(Number(x)) ? dash : { value: String(Math.round(Number(x))) });
  const dpValues = $derived({
    ...vals,
    avgHr: vv(hrStats?.avg),
    maxHr: vv(hrStats?.max),
    avgPower: vv(pwStats?.avg),
    maxPower: vv(pwStats?.max),
    lap: lap ? { value: `${Math.floor(lap.movingS / 3600)}:${String(Math.floor((lap.movingS % 3600) / 60)).padStart(2, '0')}:${String(lap.movingS % 60).padStart(2, '0')}` } : dash,
    lapKm: lap ? { value: String(Math.round(lap.km * 10) / 10) } : dash,
    ghost: ghostS != null ? { value: deltaText(ghostS) } : dash,
    battery: bat ? vv(bat.level * 100) : dash,
    nextWp: dash,
    upToTop: climb && km != null ? vv(gainBetween(profile, km, climb.toKm)) : dash,
  });
  const tileLabel = (k) => (k === 'done' && !hasRoute ? t('km ridden') : t(TILE[k].label));

  /* the bottom sheet: three heights, drag the handle or tap it */
  let stageH = $state(700);
  let stageW = $state(400);
  /* «Karte frei» (M13, Noah 27.10.2026): on the computer the numbers are a small box over the map */
  let bandH = $state(0);
  const snaps = $derived(sheetSnaps(stageH));
  let snap = $state('peek');
  let dragH = $state(null);
  const sheetPx = $derived(Math.min(stageH, dragH ?? snaps[snap]));
  let drag = null;
  function sheetDown(e) {
    drag = { y: e.clientY, h: sheetPx, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function sheetMove(e) {
    if (!drag) return;
    const dy = (e.clientY - drag.y) / zoomFactor();
    if (Math.abs(dy) > 6) drag.moved = true;
    if (drag.moved) dragH = Math.max(snaps.peek - 40, Math.min(snaps.full + 20, drag.h - dy));
  }
  function sheetUp() {
    if (!drag) return;
    if (drag.moved && dragH != null) snap = nearestSnap(dragH, snaps);
    else snap = snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek';
    drag = null;
    dragH = null;
  }
  const openSheet = (to = 'full') => (snap = to);

  /* the profile in the sheet: from your km on, until you zoom yourself */
  let pview = $state(null);
  let ptouched = $state(false);
  $effect(() => {
    if (kmStep == null || ptouched || !f) return;
    pview = { from: Math.max(0, kmStep - 2), to: Math.min(f.km, kmStep + 40) };
  });

  /* the «⋯» menu */
  let menu = $state(false);
  let choose = $state(false);
  // the place search (PoiPanel): its places as symbols; a tap on one opens its detail (PoiDetail)
  let mapBounds = $state(null); // { s, w, n, e } of the map
  let poiPoints = $state([]);
  let poiPicked = $state(null);
  const allPoints = $derived([...mapPoints, ...poiPoints.filter((p) => Number.isFinite(Number(p.lat))).map((p) => ({ id: `poi-${p.id}`, lat: Number(p.lat), lon: Number(p.lon), kind: p.kind, name: p.name || kindName(p.kind) }))]);
  // «Weitere Quellen»: «Add a place by tapping the map» of the place search
  let poiPanel = $state(null);
  let poiTapping = $state(false);
  // «Ziel wählen» (Versteckte Funktionen, Noah 22.10.2026 «1a»): a button in place of the long press only; the next tap on the map is the goal
  let goalTapping = $state(false);
  function mapTap(e) {
    if (goalTapping && Number.isFinite(e?.lat)) {
      goalTapping = false;
      picked = { lat: e.lat, lon: e.lon };
      reroute = true;
      return;
    }
    // a place set by tapping the map: the window «In der Nähe» comes back with it
    const was = poiTapping;
    poiPanel?.tapMap(e);
    if (was) openNear();
  }
  // Suchvorschläge (Noah 27.10.2026 «In der Nähe als Popup»): the place search in its own window, on the
  // phone from below, on the computer on the right; the map stays usable beside it (not modal)
  let nearDlg = $state(null);
  let nearOpen = $state(false);
  function openNear() {
    if (!nearDlg) return;
    if (!nearDlg.open) nearDlg.show();
    nearOpen = true;
  }
  function closeNear() {
    if (nearDlg?.open) nearDlg.close();
    nearOpen = false;
  }
  // «Hin» on a place: the detour planner with this place chosen (Umweg und zurück)
  function goTo(p) {
    if (!p) return;
    picked = { lat: Number(p.lat), lon: Number(p.lon), name: p.name || kindName(p.kind) };
    closeNear();
    reroute = true;
  }
  function pickPoint(p) {
    const id = String(p?.id ?? '');
    if (id.startsWith('cam-')) return (camPicked = camOfPoint($camsQ, id));
    if (!id.startsWith('poi-')) return;
    poiPicked = poiPoints.find((x) => `poi-${x.id}` === id) ?? null;
    if (!poiPicked) return;
    openNear();
    tick().then(() => document.querySelector('[data-live-poi-detail]')?.scrollIntoView({ block: 'start' }));
  }
  const showRouteBox = $derived(!isRace && !(trip?.route?.line?.length > 1));
  const groundToggles = $derived(toggles);
  const flip = (key) => (shown = { ...shown, [key]: !shown[key] });
  // offline (like komoot's «OFFLINE»): a line over the map
  let offline = $state(typeof navigator !== 'undefined' && navigator.onLine === false);
  // «Save the screen»: darker after 2 min without a touch; a touch or a warning brightens it
  let touchedAt = $state(Date.now());
  const warning = $derived(offWarn || !!storm || !!limitMsg || rec.paused || standing);
  const dimmed = $derived(cfg.dim && full && !warning && now - touchedAt > 120_000);
  // Stromsparen 2a: after 2 min without a touch the first data page instead of the map; a warning brings the map back
  let autoSwitched = false;
  $effect(() => {
    const idle = full && now - touchedAt > 120_000;
    const warn = warning;
    untrack(() => {
      if (cfg.autoData && idle && !warn && dpIndex === 0 && dpSet.pages.length) {
        dpIndex = 1;
        autoSwitched = true;
      } else if (autoSwitched && (warn || !cfg.autoData)) {
        dpIndex = 0;
        autoSwitched = false;
      } else if (autoSwitched && dpIndex !== 1) autoSwitched = false;
    });
  });
  function keydown(e) {
    touchedAt = Date.now();
    if (e.key === 'Escape' && menu) {
      menu = false;
      e.stopPropagation();
    }
  }
</script>

<svelte:window onkeydown={keydown} ononline={() => (offline = false)} onoffline={() => (offline = true)} />

<div class="lv" data-page="live">
  <Crumb path={[{ href: '#/trips', label: t('Trips|place') }]} here={t('Live map')} />
  <h1 class="rc-h1" tabindex="-1" data-page-title>{t('Live map')}</h1>
  <p class="rc-intro">
    {#if trip}{trip.title}{#if hasRoute}{' '}· {t('{km} km · {up} m up', { km: Math.round(route.km || pts.at(-1).km), up: num(Math.round(route.gainM ?? 0)) })}{/if}{:else}{t('A ride without a tour.')}{/if}
  </p>
  {#if trip && !hasRoute}<p class="rc-note" data-live-noroute>{t('This tour has no route. With a route (GPX) you also get km, arrival and climbs.')}</p>{/if}

  <!-- start (and the way back to the full view) -->
  <section class="lv-go" aria-label={t('The ride')}>
    {#if rec.on}
      <div class="lv-go-row">
        <span class="lv-rec" role="status"><span class="lv-dot" aria-hidden="true"></span>{t('Ride running')} · {num(rec.km)} km{#if rec.acc != null}{' '}· ± {rec.acc} m{/if}</span>
        <button type="button" class="btn hi" onclick={() => (small = false)} data-live-open><Maximize2 size={18} aria-hidden="true" />{t('Back to the live map')}</button>
      </div>
    {:else}
      <div class="lv-go-row">
        <button type="button" class="btn hi lv-start" onclick={() => start()} data-live-start><Play size={20} aria-hidden="true" />{t('Start the ride')}</button>
        {#if left}<button type="button" class="btn" onclick={() => start(left)} data-live-continue>{t('Continue the ride from {time}', { time: zurichTime(left.startAt) })}</button>{/if}
      </div>
    {/if}
    {#if resumed && rec.on}<p class="rc-note" role="status" data-live-resumed>{t('The app had loaded anew: your ride goes on. What you rode is saved; the time between is a gap in the travel track.')}</p>{/if}
    {#if err || rec.error}<p class="rc-warn" role="alert">{err || t(rec.error)}</p>{/if}
    <p class="rc-note">{t('Your position runs only while this page is open and the screen stays on. That needs battery: best with the phone on the handlebar and on power. The ride is recorded in the travel track at the same time.')}</p>
    {#if !rec.on}
      <details class="lv-tip" data-live-flight-tip>
        <summary>{t('Save battery: ride in flight mode')}</summary>
        <p class="rc-note">{t('Store the map along your route first (offline strips, on the race map or in the «⋯» menu of the live map). Then switch on flight mode and switch GPS and Bluetooth on again: the ride is recorded, the sensors and all numbers work. Without internet there is no weather, thunderstorm alert, public transport, family link or place search.')}</p>
      </details>
    {/if}
  </section>

  {#if after}
    <section class="rc-box lv-after" data-live-after aria-label={t('After the ride')}>
      <h2 class="rc-h2">{t('Ride done')}</h2>
      {#if after.ride}
        <p class="rc-text">{t('{km} km recorded. The line is in the travel track of the day.', { km: num(after.ride.km ?? 0) })}</p>
        {#if after.saved}<p class="rc-text" data-live-saved><LiveLabel /> {t('Saved as its own entry in Trips.')} <a href="#/trips" data-live-saved-link>{t('Open Trips')}</a></p>{/if}
        {#if loadAfter}
          {#await loadAfter() then m}
            <m.default ride={after.ride} {trip} />
          {:catch}
            <p class="rc-note">{t('The summary could not load. The ride is saved.')}</p>
          {/await}
        {/if}
      {:else}
        <p class="rc-text" data-live-too-short>{t('Too few points to keep this ride.')} {t('The phone had no GPS position, or the ride was shorter than a few seconds. Nothing was saved.')}</p>
      {/if}
      {#if groupEnded}<p class="rc-note" data-live-group-ended>{t('The group ride has ended. The places are deleted.')}</p>{/if}
    </section>
  {/if}

  {#if showRouteBox && !rec.on}
    <LiveRouteBox {trip} />
  {/if}

  {#if !rec.on && !after}
    <p class="rc-empty" data-live-empty>{t('Start the ride: then the map fills the screen and shows where you are, the numbers you choose and the stops ahead or around you.')}</p>
    <!-- «Live-Karte sichtbar» (Noah 25.10.2026 «bitte fortfahren»): what the map can do during the ride, named as in the catalogue -->
    <section class="rc-box lv-during" aria-labelledby="lv-during-h" data-live-during>
      <h2 id="lv-during-h" class="rc-h2">{t('During the ride')}</h2>
      <ul>
        {#each DURING_RIDE as x (x.id)}<li data-during={x.id}><b>{t(FEATURE_TITLE[x.id])}</b><span>{t(x.sub)}</span></li>{/each}
      </ul>
    </section>
  {/if}

  <!-- Gruppen-Live-Karte: invite friends before the start too -->
  {#if !rec.on}
    <div class="rc-box"><GroupPanel title={routeName} {route} me={null} onrows={(r) => (groupRows = r)} /></div>
  {/if}

  <!-- options stay reachable before the start too -->
  {#if !rec.on}
    {@render options()}
  {/if}
</div>

{#if rec.on}
  <!-- the full view while riding -->
  <div class="lvf" class:lvf-hidden={!full} class:lvf-onpage={dpIndex > 0} style:--lvf-box-h="{bandH}px" role="region" aria-label={t('Live map')} onpointerdowncapture={() => (touchedAt = Date.now())} data-live-full>
    {#if dimmed}<div class="lvf-dim" aria-hidden="true" data-live-dim></div>{/if}
    <!-- the numbers: a band on the phone, a small box over the map on the computer -->
    <div class="lvf-band" bind:clientHeight={bandH} data-live-panel>
      <ul class="lvf-tiles n{tiles.length}">
        {#each tiles as k (k)}
          <li data-live-tile={k} data-live-km={k === 'done' ? '' : undefined} data-live-left={k === 'left' ? '' : undefined}>
            <b>{vals[k].value}{#if TILE[k].unit && vals[k].value !== '–'}<small>{TILE[k].unit}</small>{/if}</b>
            <span>{tileLabel(k)}</span>
          </li>
        {/each}
      </ul>
      <button type="button" class="lvf-ic" onclick={() => ((choose = true), openSheet('full'))} aria-label={t('Choose numbers')} data-live-choose><SlidersHorizontal size={20} aria-hidden="true" /></button>
    </div>

    <div class="lvf-stage" bind:clientHeight={stageH} bind:clientWidth={stageW} style:--dp-pad="{(stageW >= 900 ? 0 : sheetPx) + DP_BUTTONS}px">
      <DataPages barTop set={dpSet} fields={dpFields} values={dpValues} {series} {profileAhead} route={hasRoute} bind:index={dpIndex} onedit={(pid) => ((dpEdit = pid), (dpOpen = true), openSheet('full'))}>
        {#snippet map()}
          <MapView
            bind:this={mapView}
            bind:ground
            bind:shown
            prefsKey="live"
            line={route?.line ?? []}
            points={allPoints}
            me={meOnMap}
            {done}
            grades={detour ? [...grades, { line: detourLine, colour: DETOUR_COLOUR }] : grades}
            {overlays}
            fill
            bar={false}
            fitButton={false}
            navAt="top-left"
            label={t('Live map')}
            ondrag={() => (follow = false)}
            onmove={(b) => (mapBounds = b)}
            onpick={pickPoint}
            adding={poiTapping || goalTapping}
            onmapclick={mapTap}
            onlongpress={(p) => ((picked = p), (reroute = true))}
          />
        {/snippet}
        {#snippet smallMap()}
          <LiveSmallMap me={meOnMap} line={route?.line ?? []} {done} />
        {/snippet}
      </DataPages>

      <!-- warnings over the map -->
      <div class="lvf-alerts">
        {#if turnNext && turnNext.distM <= 1000}<div class="lvf-turn" data-live-turn><TurnHint turn={turnNext} distM={turnNext.distM} /></div>{/if}
        {#if !me}<p class="lvf-alert" role="status">{t('Waiting for the GPS …')}</p>{/if}
        {#if goalTapping}<p class="lvf-alert" role="status" data-live-goal-hint><Flag size={18} aria-hidden="true" /><span>{t('Tap the map where you want to go.')}</span> <button type="button" class="btn sm" onclick={() => (goalTapping = false)}>{t('Cancel')}</button></p>{/if}
        {#if resumed}<p class="lvf-alert" role="status" data-live-resumed-full><RefreshCw size={18} aria-hidden="true" /><span>{t('The app had loaded anew: your ride goes on.')}</span> <button type="button" class="btn sm" onclick={() => (resumed = false)}>{t('OK')}</button></p>{/if}
        {#if offWarn}<p class="lvf-alert lvf-bad" role="alert" data-live-offroute><TriangleAlert size={18} aria-hidden="true" /><span>{at?.offM >= 1000 ? t('Off the route: {d} km away.', { d: fmtKm(at.offM / 1000) }) : t('Off the route: {m} m away.', { m: at?.offM })}</span></p>{/if}
        {#if storm}<p class="lvf-alert lvf-bad" role="alert" data-live-storm><CloudLightning size={18} aria-hidden="true" /><span>{storm.km != null ? t('Thunderstorm possible around km {km} from {at}.', { km: storm.km, at: hhmm(storm.at) }) : t('Thunderstorm possible here from {at}.', { at: hhmm(storm.at) })}</span></p>{/if}
        {#if cfg.eatHm && eatGain >= 300}<p class="lvf-alert" role="alert"><Utensils size={18} aria-hidden="true" /><span>{t('{m} m up since you last ate: time to eat.', { m: eatGain })}</span> <button type="button" class="btn sm" onclick={ateNow}>{t('Eaten')}</button></p>{/if}
        {#if msg}<p class="lvf-alert lvf-bad" role="alert">{msg}</p>{/if}
        <LiveWetter {me} />
        <LiveEssen {me} />
        <LivePlaceNote {me} tripId={trip?.id ?? null} />
        {#if detour}
          <div class="lvf-alert lv-detour" role="status" data-live-detour data-live-detour-back={detour.back ?? null}>
            <Route size={18} aria-hidden="true" />
            <span class="lv-detour-main">
              <b>{detour.back === 'auto' ? t('New way back onto the route') : detour.back === 'same' ? t('The same way back') : detour.back ? t('Way back onto the route') : t('Detour to {name}', { name: detour.target.name || t('the point') })}</b>
              <small>{[t('{d} km', { d: fmtKm(detour.km) }), detour.gainM ? `${num(detour.gainM)} m ↑` : '', detour.min ? t('about {min} min', { min: num(detour.min) }) : '', detour.rejoin ? t('back on the route at km {km}', { km: num(Math.round(detour.rejoin.km)) }) : '', detour.extraKm != null && detour.extraKm > 0 ? t('{d} km more', { d: fmtKm(detour.extraKm) }) : '', detour.skippedKm > 0 ? t('{d} km of the route left out', { d: fmtKm(detour.skippedKm) }) : ''].filter(Boolean).join(' · ')}</small>
              {#if detour.back === 'auto'}
                <small>{t('You were off the route, so the app planned the shortest way back.')}</small>
                <span class="lv-back-acts">
                  <button type="button" class="btn sm" onclick={autoUndo} data-live-auto-undo>{t('Undo')}</button>
                  <button type="button" class="btn sm" onclick={autoFree} data-live-auto-free>{t('Go on without the route')}</button>
                  {#if sameBack}<button type="button" class="btn sm" onclick={takeSame} data-live-auto-same>{t('The same way back')}</button>{/if}
                </span>
              {/if}
              {#if arrived}
                <span class="lv-back" data-live-return>
                  <b>{t('You are there. How do you go back?')}</b>
                  <span class="lv-back-acts" role="group" aria-label={t('The way back')}>
                    <button type="button" class="btn sm" aria-pressed={backMode === 'exit'} onclick={() => (backPick = 'exit')} data-live-return-mode="exit">{t('Back where I left the route (km {km})', { km: num(Math.round(detour.fromKm)) })}</button>
                    <button type="button" class="btn sm" aria-pressed={backMode === 'fast'} onclick={() => (backPick = 'fast')} data-live-return-mode="fast">{t('The fastest way onto the route')}</button>
                  </span>
                  {#if isRace}<small>{t('In a race only the whole route counts, so «back where I left» is chosen first.')}</small>{/if}
                  <span><button type="button" class="btn sm primary" onclick={planBack} disabled={backBusy || !me} data-live-return-go>{backBusy ? t('Planning…') : t('Plan the way back')}</button></span>
                  {#if backErr}<small class="lv-back-err" role="alert" data-live-return-error>{backErr}</small>{/if}
                </span>
              {:else if detour.back !== 'auto'}
                <span><button type="button" class="btn sm" onclick={detourToGarmin} data-live-detour-garmin>{t('GPX for Garmin')}</button></span>
              {/if}
              {#if gpxMsg}<small data-live-detour-gpx>{gpxMsg}</small>{/if}
            </span>
            <button type="button" class="lvf-ic lv-detour-x" onclick={() => setDetour(null)} aria-label={t('Remove the detour')} data-live-detour-off><X size={18} aria-hidden="true" /></button>
          </div>
        {/if}
        {#if offline}<p class="lvf-alert" role="status" data-live-offline><WifiOff size={18} aria-hidden="true" /><span>{t('Offline: the map shows what is stored, the ride goes on.')}</span></p>{/if}
        {#if limitMsg}<p class="lvf-alert lvf-bad" role="alert" data-live-limit><TriangleAlert size={18} aria-hidden="true" /><span>{limitMsg}</span></p>{/if}
      </div>

      {#if !rec.paused}<button type="button" class="lvf-lap" style:bottom="{sheetPx + 12}px" onclick={newLap} aria-label={t('New lap')} data-live-lap><Flag size={20} aria-hidden="true" /><small>{lap?.n ?? 1}</small></button>{/if}
      <PauseBar paused={rec.paused} auto={rec.auto} {standing} movingS={movingLive} pausedS={pausedLive} limit={autoKmh} bottom={sheetPx + 12} onpause={() => pauseNow(false)} onresume={goOn} onstop={stop} />
      <button type="button" class="lvf-ic lvf-photo" class:lvf-hidden={snap === 'full' || dpIndex > 0} onclick={() => (place = true)} style:bottom="{sheetPx + 70}px" aria-label={t('Photo or note with the place')} data-live-photo><Camera size={22} aria-hidden="true" /></button>

      <!-- Versteckte Funktionen (Noah 22.10.2026): the emergency window one tap away, not only in «⋯» -->
      <button type="button" class="lvf-ic lvf-sosq" class:lvf-hidden={snap === 'full' || dpIndex > 0} onclick={() => (sos = true)} style:bottom="{sheetPx + 126}px" aria-label={t('Emergency')} data-live-sos-quick><LifeBuoy size={22} aria-hidden="true" /></button>
      <!-- «In der Nähe» (Suchvorschläge): the place window one tap away -->
      <button type="button" class="lvf-nearbtn" class:lvf-hidden={snap === 'full' || dpIndex > 0} aria-expanded={nearOpen} onclick={() => (nearOpen ? closeNear() : openNear())} style:bottom="{sheetPx + 238}px" data-live-near-btn><MapPin size={18} aria-hidden="true" />{t('Nearby')}</button>
      <!-- «Ziel wählen»: tap the button, then the spot on the map (the long press still works) -->
      <button type="button" class="lvf-ic lvf-goal" class:lvf-hidden={snap === 'full' || dpIndex > 0} aria-pressed={goalTapping} onclick={() => ((goalTapping = !goalTapping), goalTapping && (snap = 'peek'))} style:bottom="{sheetPx + 182}px" aria-label={t('Choose a goal')} title={t('Choose a goal')} data-live-goal><Flag size={22} aria-hidden="true" /></button>
      <!-- the «⋯» menu -->
      <button type="button" class="lvf-ic lvf-menu-btn" aria-expanded={menu} aria-haspopup="true" onclick={() => (menu = !menu)} aria-label={t('More')} data-live-menu><Ellipsis size={22} aria-hidden="true" /></button>
      {#if menu}
        <div class="lvf-menu" role="group" aria-label={t('More')} data-live-menu-panel>
          <div class="lvf-menu-head">
            <b>{t('More')}</b>
            <button type="button" class="lvf-ic" onclick={() => (menu = false)} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
          </div>
          <button type="button" class="btn lvf-sos" onclick={() => ((menu = false), (sos = true))} data-live-sos><LifeBuoy size={20} aria-hidden="true" />{t('Emergency')} · SOS</button>
          <a class="btn" href={LANDI_RADAR} target="_blank" rel="noopener noreferrer" data-landi><CloudRain size={18} aria-hidden="true" />{t('Landi rain radar')}</a>
          <button type="button" class="btn" onclick={() => ((menu = false), (picked = null), (reroute = true))} data-live-reroute><Route size={18} aria-hidden="true" />{t('Plan a new way to …')}</button>
          <button type="button" class="btn" onclick={() => ((menu = false), (place = true))} data-live-place><MapPin size={18} aria-hidden="true" />{t('I am here')}</button>
          <div class="lv-dictation" data-live-dictation-slot>
            {#if DICTATION}
              {@const D = DICTATION}
              <D {trip} here={me} />
            {/if}
          </div>
          <label class="lvf-ground">
            <span><Layers size={16} aria-hidden="true" />{t('Map ground')}</span>
            <select class="inp" bind:value={ground} onchange={() => chooseGround(ground)} data-map-ground>
              {#each GROUNDS as x (x.key)}<option value={x.key}>{t(x.name)}</option>{/each}
            </select>
          </label>
          <div class="lvf-chips" role="group" aria-label={t('Layers on the map')}>
            {#each groundToggles as x (x.key)}
              <button type="button" class="lvf-chip" aria-pressed={!!shown[x.key]} onclick={() => flip(x.key)} data-map-layer={x.key}>{x.label}</button>
            {/each}
          </div>
          {#if hasRoute}
            <details class="lvf-fold">
              <summary>{t('Offline strips')}</summary>
              <OfflineBox line={route?.line ?? []} name={routeName} tripId={tid || null} reserve={trip ? reserveOf(trip) : null} />
            </details>
          {/if}
          <!-- «Während der Fahrt» also during the ride (Noah 27.10.2026 «1a») -->
          <details class="lvf-fold lv-during" data-live-menu-during>
            <summary>{t('During the ride')}</summary>
            <ul>
              {#each DURING_RIDE as x (x.id)}<li><b>{t(FEATURE_TITLE[x.id])}</b><span>{t(x.sub)}</span></li>{/each}
            </ul>
          </details>
          <button type="button" class="btn" onclick={() => ((menu = false), (small = true))} data-live-minimize><Minimize2 size={18} aria-hidden="true" />{t('Leave the full view')}</button>
          <p class="rc-note">{t('The ride goes on; «Back to the live map» brings this view back.')}</p>
        </div>
      {/if}

      <button type="button" class="lvf-ic lvf-follow" class:lvf-hidden={snap === 'full' || dpIndex > 0} aria-pressed={follow} onclick={() => (follow ? (follow = false) : recenter())} style:bottom="{sheetPx + 12}px" aria-label={follow ? t('Map follows you') : t('Follow me')} data-live-follow><Crosshair size={22} aria-hidden="true" /></button>

      <!-- the bottom sheet -->
      <section class="lvf-sheet" class:lvf-dragging={dragH != null} style:height="{sheetPx}px" aria-label={t('Ahead of you')} data-live-sheet={snap}>
        <button
          type="button"
          class="lvf-handle"
          aria-label={snap === 'full' ? t('Pull the panel down') : t('Pull the panel up')}
          onpointerdown={sheetDown}
          onpointermove={sheetMove}
          onpointerup={sheetUp}
          onpointercancel={sheetUp}
          data-live-sheet-toggle><span aria-hidden="true"></span></button
        >
        <!-- a tap or a key inside the pulled-down sheet pulls it up -->
        <div class="lvf-body" class:lvf-scroll={snap !== 'peek'} onfocusin={() => snap === 'peek' && (snap = 'full')}>
          <!-- collapsed: the next stop and the next climb -->
          <div class="lvf-peek">
            {#if stops[0]}
              {@const s = stops[0]}
              <p class="lvf-next" data-live-next>
                <KindIcon kind={s.kind} size={20} />
                <span><b>{s.name || kindName(s.kind)}</b><small>{t('{d} km', { d: fmtKm(s.distKm) })} · {t('there about {at}', { at: when(s.eta) })}{#if openLine(s)}{' '}· <span class:lv-closed={s.open?.open === false}>{openLine(s)}</span>{/if}</small></span>
              </p>
            {:else if me}
              <p class="lvf-next lvf-muted">{busy ? t('Loading…') : hasRoute ? t('No stops ahead on the route yet.') : t('No stops around you found yet.')}</p>
            {/if}
            {#if hasRoute && profile.length > 1 && km != null}
              <p class="lvf-next" data-live-climb>
                <span class="lvf-mt" aria-hidden="true"><Mountain size={20} /></span>
                <span>
                  {#if climb}
                    {#if climb.onIt}
                      <b>{t('On a climb: {d} km to the top', { d: fmtKm(Math.max(0, climb.toKm - km)) })}</b><small>{t('top {m} m', { m: num(climb.top) })} · {num(climb.grade)} %</small>
                    {:else}
                      <b>{t('Climb in {d} km', { d: fmtKm(climb.distKm) })}</b><small>{fmtKm(climb.toKm - climb.fromKm)} km · {num(climb.grade)} % · {num(climb.gain)} m ↑ · {t('top {m} m', { m: num(climb.top) })}</small>
                    {/if}
                  {:else}
                    <b>{t('No climb of 100 m or more ahead.')}</b>
                  {/if}
                </span>
              </p>
            {/if}
          </div>

          <!-- pulled up (drawn always, so a search keeps its state; hidden below the edge while pulled down) -->
            {#if arr || light}
              <div class="lvf-part">
                {#if arr}
                  <p class="lv-line" data-live-arrival>
                    <Flag size={18} aria-hidden="true" />
                    <span>{#if light && !light.dark && light.minLeft > 0}{t('Arrival about {at}, {left} of light left', { at: when(arr.eta), left: minText(light.minLeft) })}{:else}{t('Arrival about {at} · it is dark', { at: when(arr.eta) })}{/if}</span>
                  </p>
                  {#if darkMin > 0}<p class="rc-warn lv-line" data-live-dark><Moon size={18} aria-hidden="true" /><span>{t('You arrive {n} after dark: lights on.', { n: minText(darkMin) })}</span></p>{/if}
                  <p class="rc-src">{t('At your pace of {kmh} km/h while moving, slower uphill; stops not counted.', { kmh: num(kmh) })}</p>
                {:else if light}
                  <p class="lv-line"><Clock size={18} aria-hidden="true" /><span>{light.dark ? t('It is dark.') : t('{left} of light left', { left: minText(light.minLeft) })}</span></p>
                {/if}
                {#if isRace && plan}
                  {#if delta != null}
                    <p class="lv-line" class:rc-ok={delta >= 0} class:rc-warn={delta < 0} data-live-plan><Clock size={18} aria-hidden="true" /><span>{delta >= 0 ? t('{t} ahead of the plan', { t: minText(delta) }) : t('{t} behind the plan', { t: minText(-delta) })}</span></p>
                  {:else}
                    <p class="rc-note" data-live-plan>{t('Plan against reality shows during the race (from {day}).', { day: when(plan.start) })}</p>
                  {/if}
                {/if}
                {#if bed}
                  <div class="lv-bed" data-live-bed>
                    {#if bed.planned}<p class="lv-line"><Moon size={18} aria-hidden="true" /><span>{t('Bed of the plan: km {km}', { km: Math.round(bed.planned.km) })}{#if bed.planned.name}{' '}· {bed.planned.name}{/if}{#if running && bed.planned.at}{' '}· {when(bed.planned.at)}{/if}</span></p>{/if}
                    {#if bed.best}<p class="lv-line"><Moon size={18} aria-hidden="true" /><span>{t('Reachable tonight: {name}, km {km}, in {d} km, about {at}', { name: bed.best.name || kindName('sleep'), km: Math.round(bed.best.km), d: fmtKm(bed.best.distKm), at: when(bed.best.eta) })}</span></p>{/if}
                  </div>
                {/if}
                {#if showSleep}
                  <div class="lv-sleep" data-live-sleep>
                    <h2 class="lvf-h">{t('Where do I sleep tonight?')}</h2>
                    <SleepList compact {pois} {own} {pts} {km} {now} kmh={pace.kmh} wx={$wxQ?.data ?? null} bagC={race?.bagC ?? 5} />
                  </div>
                {/if}
                {#if batEst}<p class="lv-line" class:rc-warn={batEst.enough === false} data-live-battery><BatteryMedium size={18} aria-hidden="true" /><span>{t('Battery {p} %: lasts about {h} h', { p: Math.round(bat.level * 100), h: num(batEst.hours) })}{#if batEst.enough != null}{' '}· {batEst.enough ? t('enough to the finish') : t('not enough to the finish: charge or save')}{/if}</span></p>{/if}
              </div>
            {/if}

            <!-- the stops -->
            <div class="lvf-part" data-live-stops>
              <!-- Noah 24.10.2026 «3a»: the next stops and the place search are one part «Stops» -->
              <h2 class="lvf-h">{t('Stops')}</h2>
              {#if hasRoute}
                <div data-live-stops-mode><Seg options={[{ key: 'route', name: t('Along the route|poi') }, { key: 'around', name: t('Around me|poi') }]} value={stopsMode} onchange={(k) => ((stopsMode = k), k === 'around' && !around.length && getAround())} label={t('Where to look for stops')} full={false} small /></div>
              {/if}
              {#if stops.length}
                <ul class="rc-list">
                  {#each stops as s (s.id)}
                    {@const l = navLinks({ lat: Number(s.lat), lon: Number(s.lon) })}
                    <li class="rc-row lv-srow" data-live-stop-row={s.kind}>
                      <KindIcon kind={s.kind} size={18} />
                      <span class="rc-row-main">
                        <b>{s.name || kindName(s.kind)}</b>
                        <small>{kindName(s.kind)} · <span data-live-dist>{t('{d} km', { d: fmtKm(s.distKm) })}</span>{s.along ? '' : ` ${t('as the crow flies')}`} · {t('there about {at}', { at: when(s.eta) })}{#if openLine(s)}{' '}· <span class:lv-closed={s.open?.open === false}>{openLine(s)}</span>{/if}</small>
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
                <p class="rc-src">{alongMode ? t('Distance along the route; the time at your pace; opening hours from OpenStreetMap when known.') : t('Straight-line distance from where you are; the time at your pace; opening hours from OpenStreetMap when known.')}</p>
              {:else}
                <p class="rc-empty" data-live-nostops>{busy ? t('Loading…') : alongMode ? t('No stops ahead on the route yet.') : t('No stops around you found yet.')}</p>
              {/if}
              <div class="rc-acts">
                {#if alongMode}
                  <button type="button" class="btn sm" onclick={getAlong} disabled={!!busy}><RefreshCw size={16} aria-hidden="true" />{busy === 'along' ? t('Loading…') : t('Load stops along the route')}</button>
                {:else}
                  <button type="button" class="btn sm" onclick={() => getAround(true)} disabled={!!busy}><RefreshCw size={16} aria-hidden="true" />{busy === 'around' ? t('Loading…') : t('Look for stops around me')}</button>
                {/if}
              </div>
              {#if stopsMsg}<p class="rc-note" role="status" data-live-stops-msg>{stopsMsg}</p>{/if}
              <!-- places: the window «In der Nähe» (Suchvorschläge, Noah 27.10.2026) -->
              <div class="lv-places" data-live-places>
                <h3 class="lv-h3">{t('More places on the map')}</h3>
                <button type="button" class="btn" onclick={openNear} data-live-near-open><MapPin size={18} aria-hidden="true" />{t('Nearby: what do you need?')}</button>
              </div>
            </div>

            <!-- Gruppen-Live-Karte (Noah 25.10.2026 «b») -->
            <div class="lvf-part"><GroupPanel title={routeName} {route} {me} onrows={(r) => (groupRows = r)} /></div>

            <!-- the profile from your km -->
            {#if hasRoute && profile.length > 1}
              <div class="lvf-part">
                <h2 class="lvf-h">{t('Elevation profile')}</h2>
                <ProfileStrip {profile} fine={route?.profileFine ?? null} bind:cursorKm={profileKm} bind:view={pview} onview={() => (ptouched = true)} meKm={km} />
                <p class="rc-note">{t('The blue dot is where you are. The profile shows the next 40 km; zoom or move it to look further, «Whole route» shows everything.')}</p>
              </div>
            {/if}
            {#if hasRoute}
              <div class="lvf-part">
                {#key tid}<WxTimeline {route} plan={plan && running ? plan : null} pace={kmh} fromKm={km ?? 0} tripId={tid || 'live'} auto />{/key}
              </div>
            {/if}


            {#if showRouteBox}
              <div class="lvf-part"><LiveRouteBox {trip} /></div>
            {/if}

            <Essen tripId={trip?.id ?? null} until={plan && running ? plan.end : null} fuelStops={trip?.fuelStops ?? []} day={trip ? dayIndex(trip, todayLocal()) : 0} />
            <LiveEnergie rideKm={rec.km} movingS={pz.movingS} profile={hasRoute ? profile : []} {km} {me} />

            <div class="lvf-part"><SensorBox {now} /></div>

            <div class="lvf-part" data-live-ov><OvNearby at={me ? { lat: me.lat, lon: me.lon } : null} /></div>

            {#if ghostS != null}
              <div class="lvf-part" data-live-ghost>
                <h2 class="lvf-h">{t('Against your last ride')}</h2>
                <p class="rc-text"><b>{deltaText(ghostS)}</b> · {ghostS > 0 ? t('slower than your last ride on this route, in riding time') : t('faster than your last ride on this route, in riding time')}</p>
                <p class="rc-note">{t('Compared at the same km of the route, from where you started today. Pauses and stops do not count.')}</p>
              </div>
            {/if}

            {#if rec.laps.length}
              <div class="lvf-part" data-live-laps>
                <h2 class="lvf-h">{t('Laps')}</h2>
                <ol class="lvf-laps">
                  {#each lapsOf(rec.laps, { km: rec.km, movingS: movingLive, now, startAt: rec.startAt }) as l (l.n)}
                    <li><b>{l.n}</b><span>{num(Math.round(l.km * 10) / 10)} km</span><span>{minText(Math.round(l.movingS / 60)) || '0 min'}</span></li>
                  {/each}
                </ol>
              </div>
            {/if}

            {#if row?.pts?.length > 1}
              <div class="lvf-part" data-live-pauses>
                <h2 class="lvf-h">{t('Moving and stopped')}</h2>
                <div class="rc-stat">
                  <div><b>{minText(Math.round(movingLive / 60)) || '0 min'}</b><small>{t('moving')}</small></div>
                  {#if pausedLive >= 60}<div><b>{minText(Math.round(pausedLive / 60))}</b><small>{t('paused')}</small></div>{/if}
                  <div><b>{minText(Math.round(pz.stoppedS / 60)) || '0 min'}</b><small>{tn(pz.stops.length, '{n} stop', '{n} stops')}</small></div>
                </div>
                <p class="rc-note">{t('A stop is 2 minutes or more within 40 m.')}</p>
              </div>
            {/if}

            <!-- «Datenseiten wie am Garmin»: pages, fields, grids, charts, zones -->
            <details class="lvf-part lvf-fold" bind:open={dpOpen} data-live-datapages>
              <summary><SlidersHorizontal size={18} aria-hidden="true" />{t('Data pages')}</summary>
              {#key dpEdit}<DataPagesEditor set={dpSet} fields={dpFields} route={hasRoute} start={dpEdit} onsave={savePages} />{/key}
            </details>

            <!-- the numbers on top: choose and sort -->
            <details class="lvf-part lvf-fold" bind:open={choose} data-live-numbers>
              <summary><SlidersHorizontal size={18} aria-hidden="true" />{t('Numbers on top')}</summary>
              <p class="rc-note">{t('Choose up to {n} numbers and their order (arrows or drag).', { n: MAX_TILES })}</p>
              <div class="lvf-chips" role="group" aria-label={t('Numbers on top')}>
                {#each LIVE_TILES.filter((x) => hasRoute || !x.route) as x (x.key)}
                  <button type="button" class="lvf-chip" aria-pressed={chosen.includes(x.key)} disabled={!chosen.includes(x.key) && chosen.length >= MAX_TILES} onclick={() => saveTiles(toggleTile(chosen, x.key))} data-live-tile-pick={x.key}>{#if chosen.includes(x.key)}<Check size={16} aria-hidden="true" />{/if}{t(x.label)}</button>
                {/each}
              </div>
              <ol class="lvf-order" use:sortable={{ onmove: (a, b) => saveTiles(moveTile(chosen, a, b)) }}>
                {#each chosen as k, i (k)}
                  <li data-sort-id={k}><SortGrip name={t(TILE[k].label)} onstep={(dir) => saveTiles(moveTile(chosen, i, i + dir))} /><span>{t(TILE[k].label)}</span><SortArrows name={t(TILE[k].label)} {i} n={chosen.length} onstep={(dir) => saveTiles(moveTile(chosen, i, i + dir))} /></li>
                {/each}
              </ol>
            </details>

            {@render options()}

            <div class="lvf-part lvf-end">
              <button type="button" class="btn lv-stop" onclick={() => (askEnd = true)} data-live-stop><Square size={18} aria-hidden="true" />{t('Stop the ride')}</button>
              {#if askEnd}<EndRideSheet km={rec.km} movingS={movingLive} ondone={endAnswer} />{/if}
              <p class="rc-note">{t('Pull the handle down for the map. SOS, «I am here» and the map ground are in the «⋯» menu top right.')}</p>
            </div>
        </div>
      </section>
    </div>
  </div>
{/if}

{#snippet options()}
  <details class="rc-box lv-opts" data-live-options>
    <summary class="lv-opts-sum"><Settings size={18} aria-hidden="true" />{t('Settings|live')}</summary>
    <p class="rc-note">{t('All off by default; switch on what helps you. Kept on this device.')}</p>
    <ul class="rc-list">
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.voice} onchange={(e) => setOpt('voice', e.currentTarget.checked)} data-live-opt="voice" /><span><b>{t('Voice announcements')}</b><small>{t('The phone says the next shop or climb a few km ahead.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.offRoute} onchange={(e) => setOpt('offRoute', e.currentTarget.checked)} disabled={!hasRoute} data-live-opt="offRoute" /><span><b>{t('Off-route warning')}</b><small>{hasRoute ? t('A tone and a vibration when you are more than 100 m off the route. The app then plans the way back by itself.') : t('Needs a route.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.eatHm} onchange={(e) => setOpt('eatHm', e.currentTarget.checked)} disabled={!hasRoute} data-live-opt="eatHm" /><span><b>{t('Eat every 300 m up')}</b><small>{t('On top of the eat reminder by time: a vibration after 300 m of climbing.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.battery} onchange={(e) => setOpt('battery', e.currentTarget.checked)} data-live-opt="battery" /><span><b>{t('Battery saver')}</b><small>{t('A simple light map, the map moves every 10 s instead of every 2 s, and less exact GPS (from the next start).')}{#if hasBattery}{' '}{t('Shows whether the battery lasts to the finish.')}{/if}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.turns} onchange={(e) => setOpt('turns', e.currentTarget.checked)} disabled={!hasRoute} data-live-opt="turns" /><span><b>{t('Turn hints')}</b><small>{hasRoute ? t('An arrow before each turn of the route, from 1 km before.') : t('Needs a route.')}</small></span></label>
        {#if cfg.turns && hasRoute}
          <label class="lv-opt lv-sub"><input type="checkbox" checked={cfg.turnVoice} onchange={(e) => setOpt('turnVoice', e.currentTarget.checked)} data-live-opt="turnVoice" /><span><b>{t('Say the turns')}</b><small>{t('The phone says «In 200 m turn left» and «Turn left now».')}</small></span></label>
        {/if}
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.autoPause} onchange={(e) => setOpt('autoPause', e.currentTarget.checked)} data-live-opt="autoPause" /><span><b>{t('Auto-pause')}</b><small>{t('Slower than your limit for 10 s: the riding time stands; it goes on by itself when you ride on.')}</small></span></label>
        {#if cfg.autoPause}
          <label class="lv-num">{t('Pause below')} <input class="inp" type="number" inputmode="decimal" min={AUTO_MIN_KMH} max={AUTO_MAX_KMH} step="0.5" value={autoKmh} onchange={(e) => setOpt('autoKmh', autoKmhOf(e.currentTarget.value))} data-live-opt="autoKmh" /> km/h</label>
        {/if}
      </li>
      <li class="rc-row">
        <span class="lv-opt lv-opt-col"><span><b>{t('Limits for the sensors')}</b><small>{t('A tone when the pulse or the power stays above your own limit for a minute. Empty: no tone.')}</small></span></span>
        <span class="lv-nums">
          <label class="lv-num">{t('Heart rate|sensor')} <input class="inp" type="number" inputmode="numeric" min="0" max="250" step="1" value={cfg.hrMax || ''} onchange={(e) => setOpt('hrMax', Math.max(0, Math.min(250, Math.round(Number(e.currentTarget.value) || 0))))} data-live-opt="hrMax" /> bpm</label>
          <label class="lv-num">{t('Power|sensor')} <input class="inp" type="number" inputmode="numeric" min="0" max="2500" step="5" value={cfg.powerMax || ''} onchange={(e) => setOpt('powerMax', Math.max(0, Math.min(2500, Math.round(Number(e.currentTarget.value) || 0))))} data-live-opt="powerMax" /> W</label>
        </span>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.autoData} onchange={(e) => setOpt('autoData', e.currentTarget.checked)} data-live-opt="autoData" /><span><b>{t('Data page instead of the map')}</b><small>{t('After 2 minutes without a touch the first data page shows: the map is not drawn, that saves battery. A warning brings the map back.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.dim} onchange={(e) => setOpt('dim', e.currentTarget.checked)} data-live-opt="dim" /><span><b>{t('Save the screen')}</b><small>{t('After 2 minutes without a touch the map gets darker (less battery on most phones). A touch or a warning makes it bright again.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.sleepSpots ?? isRace} onchange={(e) => setOpt('sleepSpots', e.currentTarget.checked)} disabled={!hasRoute} data-live-opt="sleepSpots" /><span><b>{t('Places to sleep ahead')}</b><small>{hasRoute ? t('The next three places to sleep on the route in the panel: hotels, roofs, places open at night and your own spots. On by default in a race.') : t('Needs a route.')}</small></span></label>
      </li>
      <li class="rc-row">
        <label class="lv-opt"><input type="checkbox" checked={cfg.storm} onchange={(e) => setOpt('storm', e.currentTarget.checked)} data-live-opt="storm" /><span><b>{t('Thunderstorm alert')}</b><small>{t('Every 15 min the forecast for the next 2 hours where you ride (Open-Meteo, free): a line and a vibration.')}</small></span></label>
      </li>
    </ul>
  </details>
{/snippet}

{#if camPicked}<LiveWebcam cam={camPicked} onclose={() => (camPicked = null)} />{/if}
<dialog class="lv-near" bind:this={nearDlg} onclose={() => (nearOpen = false)} aria-labelledby="lv-near-h" data-live-near>
  <div class="lv-near-head">
    <h2 id="lv-near-h">{t('Nearby')}</h2>
    <button type="button" class="lvf-ic" onclick={closeNear} aria-label={t('Close')} data-live-near-close><X size={20} aria-hidden="true" /></button>
  </div>
  {#if poiPicked}
    <div data-live-poi-detail><PoiDetail place={poiPicked} from={me} line={route?.line ?? null} profile={route?.profile ?? null} ongo={goTo} onclose={() => (poiPicked = null)} /></div>
  {/if}
  <PoiPanel bind:this={poiPanel} title={false} canTap ongo={goTo} ontapmode={(v) => ((poiTapping = v), v && (closeNear(), (snap = 'peek')))} center={me ? { lat: me.lat, lon: me.lon } : null} bounds={mapBounds} line={route?.line ?? null} profile={route?.profile ?? null} tripId={trip?.id ?? null} onpoints={(l) => (poiPoints = l ?? [])} />
</dialog>
{#if reroute}<RerouteSheet here={me} pts={hasRoute ? pts : []} {km} {pois} {own} {picked} onplan={setDetour} onclose={() => ((reroute = false), (picked = null))} />{/if}
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
  .lv-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-body);
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
  .lv-closed {
    color: var(--bad);
  }
  .lv-srow {
    align-items: center;
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
  .lv-tip summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lv-opt-col {
    flex: 1 1 auto;
  }
  .lv-nums {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    padding-left: 32px;
  }
  .lv-num {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding-left: 32px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .lv-nums .lv-num {
    padding-left: 0;
  }
  .lv-num .inp {
    width: 5.5em;
    min-height: 44px;
  }
  .lvf-turn {
    pointer-events: none;
  }
  /* Suchvorschläge: the button «In der Nähe» and its window (phone from below, computer on the right) */
  .lvf-nearbtn {
    position: absolute;
    right: 10px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) var(--font-body);
    box-shadow: 0 1px 4px var(--shadow);
    cursor: pointer;
    transition: bottom 0.15s var(--ease-out);
  }
  .lvf-nearbtn[aria-expanded='true'] {
    background: var(--brand);
    border-color: var(--brand);
    color: var(--brand-ink);
  }
  .lv-near {
    position: fixed;
    inset: 70px 0 0 0;
    z-index: 40; /* like the full view (.lvf), later in the page so above it; toasts (40, later still) stay on top */
    width: 100%;
    max-width: none;
    height: auto;
    max-height: none;
    margin: 0;
    padding: 10px 16px 24px;
    border: 0;
    border-radius: 20px 20px 0 0;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 -6px 24px var(--shadow);
    overflow: auto;
    overscroll-behavior: contain;
  }
  .lv-near-head {
    position: sticky;
    top: -10px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: -10px -16px 8px;
    padding: 10px 16px 8px;
    background: var(--paper);
  }
  .lv-near-head h2 {
    margin: 0;
  }
  @media (min-width: 900px) {
    .lv-near {
      inset: 0 0 0 auto;
      width: 440px;
      border-radius: 0;
      border-left: 1px solid var(--line);
      box-shadow: -8px 0 30px var(--shadow);
    }
  }
  .lvf-lap {
    position: absolute;
    left: 74px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 48px;
    min-width: 48px;
    padding: 0 10px;
    border-radius: 24px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 4px var(--shadow);
    cursor: pointer;
    transition: bottom 0.15s var(--ease-out);
  }
  .lvf-laps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  .lvf-laps li {
    display: grid;
    grid-template-columns: 2em 1fr 1fr;
    gap: 8px;
    font-size: var(--fs-small);
  }
  .lv-sub {
    padding-left: 32px;
  }
  .lvf-lap small {
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .lvf-sosq {
    position: absolute;
    right: 10px;
    z-index: 2;
    color: var(--bad);
    box-shadow: 0 1px 4px var(--shadow);
    transition: bottom 0.15s var(--ease-out);
  }
  .lvf-goal {
    position: absolute;
    right: 10px;
    z-index: 2;
    box-shadow: 0 1px 4px var(--shadow);
    transition: bottom 0.15s var(--ease-out);
  }
  .lvf-goal[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .lvf-photo {
    position: absolute;
    right: 10px;
    z-index: 2;
    box-shadow: 0 1px 4px var(--shadow);
    transition: bottom 0.15s var(--ease-out);
  }
  .lvf-dim {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: var(--scrim);
    pointer-events: none;
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

  /* ---------- the full view ---------- */
  .lvf {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background: var(--paper);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left);
  }
  .lvf-hidden {
    display: none;
  }
  .lvf-band {
    display: flex;
    align-items: stretch;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    min-width: 0;
  }
  .lvf-tiles {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px 8px;
    margin: 0;
    padding: 0;
    list-style: none;
    min-width: 0;
  }
  .lvf-tiles.n1 {
    grid-template-columns: 1fr;
  }
  .lvf-tiles.n2,
  .lvf-tiles.n4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lvf-tiles li {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .lvf-tiles b {
    font: 700 var(--fs-section) / 1.1 var(--font-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lvf-tiles b small {
    margin-left: 3px;
    font-size: var(--fs-tiny);
    font-weight: 500;
    color: var(--ink-3);
  }
  .lvf-tiles span {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lvf-ic {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .lvf-band .lvf-ic {
    align-self: center;
  }
  .lvf-stage {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }
  .lvf-alerts {
    position: absolute;
    top: 52px; /* under the bar of the data pages */
    left: 56px;
    right: 60px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
  }
  .lvf-alert {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    box-shadow: 0 1px 4px var(--shadow);
    pointer-events: auto;
  }
  .lvf-bad {
    border-left: 4px solid var(--bad);
  }
  .lv-detour {
    border-left: 4px solid var(--l3);
    flex-wrap: nowrap;
    align-items: flex-start;
  }
  .lv-detour-main {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
  .lv-detour small {
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .lv-detour-main .btn {
    margin-top: 4px;
  }
  .lv-back {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-1);
    margin-top: var(--sp-1);
  }
  .lv-back-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1);
  }
  .lv-back-acts .btn[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    font-weight: 600;
  }
  .lv-detour .lv-back-err {
    color: var(--bad);
  }
  .lv-detour .lv-detour-x {
    width: 36px;
    height: 36px;
  }
  .lvf-menu-btn {
    position: absolute;
    top: 52px;
    right: 8px;
    z-index: 3;
    box-shadow: 0 1px 4px var(--shadow);
  }
  .lvf-menu {
    position: absolute;
    top: 52px;
    right: 8px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(340px, calc(100% - 16px));
    max-height: calc(100% - 16px);
    overflow: auto;
    padding: 10px 12px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: 0 6px 20px var(--shadow);
  }
  .lvf-menu-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .lvf-menu .btn {
    justify-content: flex-start;
    gap: 8px;
  }
  .lvf-sos {
    border: 2px solid var(--bad);
    color: var(--bad);
    font-weight: 700;
  }
  .lvf-ground {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lvf-ground span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .lvf-ground select {
    min-height: 44px;
    max-width: 100%;
  }
  .lvf-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .lvf-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .lvf-chip[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .lvf-chip:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .lvf-fold > summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    font-weight: 600;
    cursor: pointer;
  }
  .lvf-fold > summary::after {
    content: '›';
    margin-left: auto;
    color: var(--ink-3);
    transition: transform 0.15s var(--ease-out);
  }
  .lvf-fold[open] > summary::after {
    transform: rotate(90deg);
  }
  .lvf-follow {
    position: absolute;
    right: 10px;
    z-index: 2;
    box-shadow: 0 1px 4px var(--shadow);
    transition: bottom 0.15s var(--ease-out);
  }
  .lvf-follow[aria-pressed='true'] {
    color: var(--l3);
    border-color: var(--l3);
  }
  .lvf-sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    border-radius: 16px 16px 0 0;
    background: var(--paper);
    box-shadow: 0 -2px 12px var(--shadow);
    transition: height 0.2s var(--ease-drawer);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .lvf-dragging {
    transition: none;
  }
  .lvf-handle {
    flex: none;
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 28px;
    padding: 8px 0 4px;
    border: 0;
    background: transparent;
    cursor: grab;
    touch-action: none;
  }
  .lvf-handle span {
    width: 44px;
    height: 5px;
    border-radius: 3px;
    background: var(--line-strong);
  }
  .lvf-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .lvf-scroll {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .lvf-peek {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lvf-next {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    min-width: 0;
  }
  .lvf-next > span:last-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .lvf-next b {
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .lvf-next small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lvf-muted {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lvf-mt {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--hi);
    color: var(--hi);
  }
  .lvf-part {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .lvf-h {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .lv-places {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .lv-h3 {
    margin: 0;
    font-size: var(--fs-body);
  }
  .lvf-order {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }
  .lvf-order li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 6px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
  }
  .lvf-order li > span {
    flex: 1;
    min-width: 0;
  }
  .lvf-end {
    align-items: flex-start;
  }
  @media (min-width: 900px) {
    .lvf-sheet {
      left: 12px;
      right: auto;
      width: 440px;
      border-radius: 16px 16px 0 0;
    }
  }
  @media (min-width: 900px) and (min-height: 561px) {
    /* «Karte frei»: the map takes the whole screen, the numbers are a small box at the top left */
    .lvf {
      grid-template-rows: minmax(0, 1fr);
    }
    .lvf-band {
      position: absolute;
      top: calc(12px + env(safe-area-inset-top));
      left: 12px;
      z-index: 5;
      width: min(480px, 38vw);
      padding: 8px 6px 8px 12px;
      border: 1px solid var(--line);
      border-radius: var(--radius-card);
      box-shadow: 0 2px 10px var(--shadow);
    }
    .lvf-stage {
      grid-row: 1;
    }
    /* on a data page the page shows the numbers itself */
    .lvf-onpage .lvf-band {
      display: none;
    }
    .lvf-tiles b {
      font-size: var(--fs-section);
    }
    /* the page dots float as a small bar at the top in the middle */
    .lvf :global(.dps-top) {
      position: absolute;
      top: 12px;
      left: 50%;
      z-index: 4;
      transform: translateX(-50%);
      padding: 0 4px;
      border: 1px solid var(--line);
      border-radius: 999px;
      box-shadow: 0 1px 4px var(--shadow);
    }
    .lvf:not(.lvf-onpage) :global(.maplibregl-ctrl-top-left) {
      top: calc(var(--lvf-box-h) + 12px);
    }
    .lvf:not(.lvf-onpage) .lvf-alerts {
      top: 64px;
      left: calc(min(480px, 38vw) + 24px);
    }
    .lvf-menu-btn,
    .lvf-menu {
      top: 12px;
    }
    .lvf-onpage .lvf-alerts {
      top: 64px;
    }
  }
  /* sideways on the handlebar: the map left, the numbers right */
  @media (orientation: landscape) and (max-height: 560px) {
    .lvf {
      grid-template-rows: minmax(0, 1fr);
      grid-template-columns: minmax(0, 1fr) minmax(180px, 32%);
    }
    .lvf-band {
      grid-column: 2;
      grid-row: 1;
      flex-direction: column;
      border-bottom: 0;
      border-left: 1px solid var(--line);
      overflow-y: auto;
    }
    .lvf-tiles,
    .lvf-tiles.n2,
    .lvf-tiles.n4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-content: start;
      gap: 10px 8px;
    }
    .lvf-tiles b {
      font-size: var(--fs-page);
    }
    .lvf-stage {
      grid-column: 1;
      grid-row: 1;
    }
    .lvf-sheet {
      right: 0;
      left: 0;
      width: auto;
    }
  }
  /* «Während der Fahrt»: one quiet list, the name bold, a short line after it */
  .lv-during ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .lv-during li {
    display: grid;
    gap: 1px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .lv-during b {
    color: var(--ink);
    font-weight: 600;
  }
</style>
