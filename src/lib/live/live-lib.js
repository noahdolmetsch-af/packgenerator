/**
 * Paket U2 «Live-Karte» (Noah 19.10.2026 18:19 «während eines Rennens eine Seite mit einer Karte, meiner
 * live location und Distanzen zu nächsten POI», 18:20 «auf allen Ausfahrten»): the sums behind the live
 * map. Where you are on the route, what comes next, when you arrive, the light left, pauses, the eat
 * reminder, the battery, plan against reality, the off-route warning, the SOS text and the links to
 * Google Maps and OsmAnd. The position itself comes from the Reise-Spur recorder (one GPS source, one
 * wake lock). Pure, tested in tests/live-lib.test.js.
 */
import { snap, pointAt } from '../race/race.js';
import { sunTimes } from '../blockplan.js';
import { openAt } from '../race/outside.js';

const R = 6371;
const RAD = Math.PI / 180;
/** Distance in km between { lat, lon } points. */
export function distKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Where you are on the route: { km, offM } or null without a route. */
export function onRoute(pts, here) {
  if (!pts?.length || !here || !Number.isFinite(here.lat)) return null;
  const s = snap(pts, here);
  return { km: s.km, offM: Math.round(s.offKm * 1000) };
}

/** Height gain between two km of a profile [[km, m], …] (linear between the points). */
export function gainBetween(profile = [], from, to) {
  if (!profile.length || !(to > from)) return 0;
  const at = (k) => {
    for (let i = 1; i < profile.length; i++) {
      if (profile[i][0] >= k) {
        const [k0, m0] = profile[i - 1];
        const [k1, m1] = profile[i];
        return k1 > k0 ? m0 + ((m1 - m0) * (k - k0)) / (k1 - k0) : m1;
      }
    }
    return profile.at(-1)[1];
  };
  let g = 0;
  let prev = at(from);
  for (const [k] of profile) {
    if (k <= from || k >= to) continue;
    const m = at(k);
    if (m > prev) g += m - prev;
    prev = m;
  }
  const end = at(to);
  if (end > prev) g += end - prev;
  return Math.round(g);
}

/**
 * Riding time for a stretch: flat km at kmh plus the climbing at climbMh (the app's simple rule).
 * → hours.
 */
export const rideH = (km, gain, { kmh = 20, climbMh = 600 } = {}) => Math.max(0, km) / Math.max(1, kmh) + Math.max(0, gain) / Math.max(50, climbMh);

/**
 * The stops ahead of you (or around you without a route), nearest first:
 * [{ ...poi, distKm, eta, open: { open, closes, opens } | null }].
 * With a route the distance is along the route; without one it is the straight line.
 */
export function stopsAhead({ pois = [], pts = [], here = null, km = null, kinds = null, n = 5, now = Date.now(), pace = {}, profile = [], rangeKm = 80 }) {
  const want = (p) => !kinds || kinds.includes(p.kind);
  let rows;
  if (pts.length && Number.isFinite(km)) {
    rows = pois.filter((p) => want(p) && Number.isFinite(p.km) && p.km >= km - 0.1 && p.km - km <= rangeKm).map((p) => ({ ...p, distKm: Math.round((p.km - km) * 10) / 10, along: true }));
  } else if (here) {
    rows = pois.filter((p) => want(p) && Number.isFinite(p.lat)).map((p) => ({ ...p, distKm: Math.round(distKm(here, p) * 10) / 10, along: false })).filter((p) => p.distKm <= Math.min(rangeKm, 30));
  } else rows = [];
  rows.sort((a, b) => a.distKm - b.distKm);
  return rows.slice(0, n).map((p) => {
    const gain = p.along ? gainBetween(profile, km, p.km) : 0;
    const eta = now + rideH(p.distKm, gain, pace) * 36e5;
    const open = p.hours ? openAt(p.hours, new Date(eta)) : null;
    return { ...p, gain, eta: Math.round(eta), open };
  });
}

/** The next climb ahead (climbs from climbsOf or the climbs page): { ...climb, distKm } or null. */
export function nextClimb(climbs = [], km) {
  const c = climbs.find((x) => x.toKm > km + 0.05);
  if (!c) return null;
  return { ...c, distKm: Math.max(0, Math.round((c.fromKm - km) * 10) / 10), onIt: c.fromKm <= km };
}

/** When you arrive at the end of the route from km at your pace: { kmLeft, gainLeft, eta } or null. */
export function arrival({ pts = [], profile = [], km, now = Date.now(), pace = {} }) {
  if (!pts.length || !Number.isFinite(km)) return null;
  const total = pts.at(-1).km;
  const kmLeft = Math.max(0, Math.round((total - km) * 10) / 10);
  const gainLeft = gainBetween(profile, km, total);
  return { kmLeft, gainLeft, eta: Math.round(now + rideH(kmLeft, gainLeft, pace) * 36e5) };
}

/** Light left at a place: { set, minLeft, dark } (minLeft < 0 once the sun has set). null at the poles. */
export function lightLeft(lat, lon, now = Date.now()) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const day = new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
  const s = sunTimes(day, lat, lon);
  if (!s) return null;
  return { rise: s.rise, set: s.set, minLeft: Math.round((s.set - now) / 6e4), dark: now < s.rise || now > s.set };
}

/** Arrival after sunset? → minutes in the dark (0 when you arrive in daylight). */
export const darkMinutes = (eta, light) => (light && eta > light.set ? Math.round((eta - light.set) / 6e4) : 0);

/**
 * Pauses from fixes [{ lat, lon, at (ms) }]: a stop is at least minS seconds within moveM metres.
 * → { movingS, stoppedS, stops: [{ at, s, lat, lon }] }.
 */
export function pauses(fixes = [], { minS = 120, moveM = 40 } = {}) {
  const stops = [];
  let movingS = 0;
  let stoppedS = 0;
  let i = 0;
  while (i < fixes.length - 1) {
    let j = i;
    while (j + 1 < fixes.length && distKm(fixes[i], fixes[j + 1]) * 1000 <= moveM) j++;
    const s = (fixes[j].at - fixes[i].at) / 1000;
    if (j > i && s >= minS) {
      stops.push({ at: fixes[i].at, s: Math.round(s), lat: fixes[i].lat, lon: fixes[i].lon });
      stoppedS += s;
      i = j;
    } else {
      movingS += (fixes[i + 1].at - fixes[i].at) / 1000;
      i++;
    }
  }
  return { movingS: Math.round(movingS), stoppedS: Math.round(stoppedS), stops };
}

/**
 * The eat and drink reminder (optional, Noah «3a»): due every everyMin minutes or every everyHm metres up,
 * counted from the last time you ate. → { due, inMin, hmLeft }.
 */
export function eatDue({ lastAt, now = Date.now(), gainSince = 0, everyMin = 45, everyHm = 300 }) {
  if (!lastAt) return { due: false, inMin: everyMin, hmLeft: everyHm };
  const inMin = Math.round(everyMin - (now - lastAt) / 6e4);
  const hmLeft = Math.round(everyHm - gainSince);
  return { due: inMin <= 0 || (everyHm > 0 && hmLeft <= 0), inMin, hmLeft };
}

/**
 * Does the battery last to the end? level 0…1, drainPerH 0…1 (measured, else a guess), hoursLeft.
 * → { hours, enough, atEnd } (atEnd: the level at the end, may be < 0).
 */
export function batteryEnough({ level, drainPerH, hoursLeft, saver = false }) {
  if (!Number.isFinite(level)) return null;
  const d = Number.isFinite(drainPerH) && drainPerH > 0 ? drainPerH : saver ? 0.1 : 0.16;
  const hours = Math.round((level / d) * 10) / 10;
  const atEnd = Number.isFinite(hoursLeft) ? Math.round((level - d * hoursLeft) * 100) / 100 : null;
  return { hours, enough: atEnd == null ? null : atEnd >= 0.1, atEnd, drainPerH: d };
}

/** Drain per hour from two battery readings { level, at }, or null. */
export function drainOf(a, b) {
  if (!a || !b || !(b.at > a.at) || !(a.level > b.level)) return null;
  return (a.level - b.level) / ((b.at - a.at) / 36e5);
}

/** Plan against reality: minutes ahead (+) or behind (−) the plan at km, or null without a plan. */
export function planDelta(plan, km, now = Date.now()) {
  if (!plan?.etaOf || !Number.isFinite(km)) return null;
  const want = plan.etaOf(km);
  if (!Number.isFinite(want)) return null;
  return Math.round((want - now) / 6e4);
}

/**
 * The off-route warning (optional, off by default, Noah «2»): warn once when you are more than limitM
 * away, quiet again below limitM × 0.6 (no ringing back and forth). → { warn, state }.
 */
export function offRouteStep(offM, state = 'on', limitM = 100) {
  if (!Number.isFinite(offM)) return { warn: false, state };
  if (state === 'on' && offM > limitM) return { warn: true, state: 'off' };
  if (state === 'off' && offM < limitM * 0.6) return { warn: false, state: 'on' };
  return { warn: false, state };
}

/** An announcement (optional, Noah «1a optional einstellbar»): the next thing to say, or null. */
export function nextSay({ stop = null, climb = null, said = new Set(), sayKm = 5 }) {
  if (climb && !climb.onIt && climb.distKm <= 2 && !said.has(`climb:${climb.fromKm}`)) {
    return { id: `climb:${climb.fromKm}`, key: 'In {d} km a climb: {len} km at {pct} %', vars: { d: climb.distKm, len: Math.round((climb.toKm - climb.fromKm) * 10) / 10, pct: climb.grade } };
  }
  if (stop && stop.distKm <= sayKm && !said.has(`stop:${stop.id}`)) {
    if (stop.open?.closes) return { id: `stop:${stop.id}`, key: 'In {d} km: {name}, open until {at}', vars: { d: stop.distKm, name: stop.name, at: stop.open.closes } };
    return { id: `stop:${stop.id}`, key: 'In {d} km: {name}', vars: { d: stop.distKm, name: stop.name } };
  }
  return null;
}

/** The ways to a place in other apps (Noah «1a beides»): Google Maps by bike and OsmAnd. */
export function navLinks({ lat, lon }) {
  const p = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${p}&travelmode=bicycling`,
    osmand: `https://osmand.net/map?pin=${p}#16/${lat.toFixed(5)}/${lon.toFixed(5)}`,
  };
}

/** The emergency message (Noah «3a»): position in degrees and as a map link, km on the route, the time. */
export function sosText({ here, km = null, routeName = '', now = Date.now(), labels = (k, v) => k.replace(/\{(\w+)\}/g, (_, x) => v?.[x] ?? '') }) {
  if (!here) return '';
  const at = new Date(now).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
  return [
    labels('I need help. My position at {at}:', { at }),
    `${here.lat.toFixed(5)}, ${here.lon.toFixed(5)}`,
    `https://www.google.com/maps?q=${here.lat.toFixed(6)},${here.lon.toFixed(6)}`,
    km != null ? labels('km {km} of {route}', { km: Math.round(km), route: routeName }) : '',
  ]
    .filter(Boolean)
    .join('\n');
}
export const smsHref = (text, to = '') => `sms:${to}?body=${encodeURIComponent(text)}`;

/** The nearest station (for the abort): along the route ahead and behind, or around you. */
export function nearestStation({ pois = [], here = null, km = null }) {
  const st = pois.filter((p) => p.kind === 'station');
  if (!st.length) return null;
  const d = (p) => (Number.isFinite(km) && Number.isFinite(p.km) ? Math.abs(p.km - km) : here ? distKm(here, p) : Infinity);
  const best = st.reduce((a, b) => (d(b) < d(a) ? b : a));
  return { ...best, distKm: Math.round(d(best) * 10) / 10, behind: Number.isFinite(km) && best.km < km };
}

/**
 * Bike km of a live ride for the bike care (Noah «4a»): counted unless a Strava/Garmin ride of the same
 * bike overlaps it (that one already counts). activities: [{ start (ms), end (ms), bikeId }].
 */
export function liveKmCounts(ride, activities = []) {
  if (!ride || !(ride.km > 0)) return false;
  return !activities.some((a) => (!a.bikeId || !ride.bikeId || a.bikeId === ride.bikeId) && a.start < ride.endAt && a.end > ride.startAt);
}

/** The point on the route at km (for the «you are here» on the profile). */
export const atKm = (pts, km) => (pts?.length && Number.isFinite(km) ? pointAt(pts, km) : null);

/* ---------- Paket U3: the live page (Live.svelte) ---------- */

/** The points of a recording row (recorder.svelte.js: pts [[lat, lon, sec]], startAt) as fixes { lat, lon, at }. */
export const fixesOf = (row) => (Array.isArray(row?.pts) ? row.pts.map((p) => ({ lat: p[0], lon: p[1], at: (row.startAt || 0) + (p[2] || 0) * 1000 })) : []);

/** Your speed while moving (km/h) from the recording, or the fallback until there is enough of it (5 km, 10 min). */
export function paceOf({ km = 0, movingS = 0 } = {}, fallback = 18) {
  if (!(km >= 5) || !(movingS >= 600)) return fallback;
  return Math.round(Math.max(6, Math.min(40, km / (movingS / 3600))) * 10) / 10;
}

/** Does the plan run now (from 6 h before its start to 12 h after its end)? Else plan vs reality says nothing. */
export const planRunning = (plan, now = Date.now()) => !!plan && Number.isFinite(plan.start) && now >= plan.start - 6 * 36e5 && now <= (plan.end ?? plan.start) + 12 * 36e5;

/**
 * Tonight's bed (Noah «1a … das Bett für heute Abend neu berechnet»):
 * - planned: the end of the plan's stage you are on (stages of the Strategie) or the next sleep block;
 * - best: the last place to sleep ahead (pois kind 'sleep') you reach before the planned bedtime, else
 *   before sunset (light.set), each only when it is within the next 24 h; none in reach → the first one ahead.
 * → { planned: { km, name, at } | null, best: { ...poi, distKm, eta } | null } or null without anything.
 */
export function bedTonight({ plan = null, pois = [], km, now = Date.now(), pace = {}, profile = [], light = null }) {
  if (!Number.isFinite(km)) return null;
  let planned = null;
  if (plan?.stages?.length) {
    const s = plan.stages.find((d) => km < d.toKm) ?? null;
    if (s) planned = { km: s.toKm, name: s.place?.name ?? '', at: s.arrive ?? null };
  } else if (plan?.blocks?.length && plan.kmAt) {
    const b = plan.blocks.find((x) => x.kind === 'sleep' && x.from > now);
    if (b) planned = { km: Math.round(plan.kmAt(b.from)), name: '', at: b.from };
  }
  // only a bedtime within the next 24 h counts (a plan for another day says nothing about tonight)
  const soon = (x) => Number.isFinite(x) && x > now && x - now < 24 * 36e5;
  const until = soon(planned?.at) ? planned.at : soon(light?.set) ? light.set : null;
  const ahead = pois
    .filter((p) => p.kind === 'sleep' && Number.isFinite(p.km) && p.km > km + 0.5)
    .sort((a, b) => a.km - b.km)
    .map((p) => {
      const d = p.km - km;
      return { ...p, distKm: Math.round(d * 10) / 10, eta: Math.round(now + rideH(d, gainBetween(profile, km, p.km), pace) * 36e5) };
    });
  const reach = until ? ahead.filter((p) => p.eta <= until) : [];
  const best = reach.at(-1) ?? ahead[0] ?? null;
  if (!planned && !best) return null;
  return { planned, best };
}

/**
 * Where to ask for thunderstorms: on the route the km you reach in the next `hours` (every ~10 km, at most
 * 5 points), without a route only here. → [{ lat, lon, km }]
 */
export function stormPoints({ pts = [], km = null, here = null, kmh = 18, hours = 2 }) {
  if (pts.length && Number.isFinite(km)) {
    const end = Math.min(pts.at(-1).km, km + kmh * hours);
    const n = Math.max(1, Math.min(5, Math.ceil((end - km) / 10) + 1));
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? km : km + ((end - km) * i) / (n - 1);
      const p = pointAt(pts, k);
      out.push({ lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000, km: Math.round(k) });
    }
    return out;
  }
  return here ? [{ lat: Math.round(here.lat * 1000) / 1000, lon: Math.round(here.lon * 1000) / 1000, km: null }] : [];
}

/** The Open-Meteo request for the storm check (free, no key): weather code and CAPE per hour, today and tomorrow. */
export function stormUrl(points) {
  const q = new URLSearchParams({ latitude: points.map((p) => p.lat).join(','), longitude: points.map((p) => p.lon).join(','), hourly: 'weather_code,cape', forecast_days: '2', timezone: 'UTC', timeformat: 'unixtime' });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

/** CAPE from which a thunderstorm is likely (J/kg). */
export const STORM_CAPE = 1000;

/**
 * A thunderstorm in the next `hours` at the points ahead (Open-Meteo weather_code 95–99 = thunderstorm, or a
 * high CAPE). series: the answer (one object per point, or an array). → { km, at, sure } (the first) or null.
 */
export function stormAhead(series, points = [], now = Date.now(), hours = 2) {
  const list = Array.isArray(series) ? series : series ? [series] : [];
  let first = null;
  list.forEach((s, i) => {
    const time = s?.hourly?.time ?? [];
    const code = s?.hourly?.weather_code ?? [];
    const cape = s?.hourly?.cape ?? [];
    for (let j = 0; j < time.length; j++) {
      const at = time[j] * 1000;
      if (at + 36e5 <= now || at > now + hours * 36e5) continue;
      const sure = code[j] >= 95 && code[j] <= 99;
      if (sure || cape[j] >= STORM_CAPE) {
        if (!first || at < first.at || (at === first.at && sure && !first.sure)) first = { km: points[i]?.km ?? null, at: Math.max(at, now), sure };
        break;
      }
    }
  });
  return first;
}

/** The Overpass query for the stops around you (a ride without a route): shops, food, water, beds, stations, bike shops. */
export function aroundQuery(here, m = 4000) {
  const a = `(around:${m},${here.lat.toFixed(4)},${here.lon.toFixed(4)})`;
  const w = `(around:${Math.round(m * 2)},${here.lat.toFixed(4)},${here.lon.toFixed(4)})`;
  return `[out:json][timeout:30];(
node["shop"~"^(supermarket|convenience|bakery|kiosk|general|deli)$"]${a};
node["amenity"~"^(restaurant|fast_food|cafe)$"]${a};
node["amenity"="drinking_water"]${a};
node["amenity"="fountain"]["drinking_water"="yes"]${a};
node["man_made"="water_tap"]["drinking_water"!="no"]${a};
node["shop"="bicycle"]${w};
node["railway"="station"]${w};
node["tourism"~"^(hotel|guest_house|hostel|camp_site|alpine_hut|motel)$"]${w};
);out center tags;`;
}

/** Is the kept «around you» answer still good here? (less than maxKm away and younger than maxDays) */
export const aroundFresh = (cache, here, now = Date.now(), maxKm = 8, maxDays = 7) =>
  !!cache?.center && !!here && distKm(cache.center, here) <= maxKm && now - Date.parse(cache.at ?? 0) < maxDays * 864e5;

/** Has enough time passed since the last time (ms)? For the battery saver: fewer redraws. */
export const due = (lastAt, now, everyMs) => !lastAt || now - lastAt >= everyMs;
