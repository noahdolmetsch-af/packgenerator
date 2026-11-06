/**
 * Paket X «Umweg neu planen» (Noah 20.10.2026 «unbedingt umsetzen»): on the live map «Neu planen zu …»
 * a shop, a bed, a station, a fountain, one of your own points, a place you search or a point you press
 * on the map. The app asks a free bike router for the way there and back onto your route a little
 * after the place, and draws it on the map. You can send it to the Garmin as a GPX (detour + the rest of
 * the route) or open it in Google Maps / OsmAnd.
 *
 * Router: BRouter (brouter.de, the public server of the open-source bike router; free, no account, no
 * key, fair use: one request per tap; off the route the app asks by itself at most once a minute). Profiles «trekking» (quiet roads and
 * good paths) and «fastbike» (road bike, short and paved). askRouter is the one door to the router
 * (Sicherheitsnetz, Noah 05.11.2026): a time limit, one more try after a quick failure, a short memory of
 * answers, a stop for ways that are too far, and clear words for every failure (routerMsg). When it does not
 * answer, the app says so and offers the navigation apps instead. The answer stays on this device
 * (localStorage, so a reload during the ride keeps the detour). brouter.de gets the positions of the way
 * and keeps the requests for two weeks (its privacy policy); RouterNote.svelte says so where the app asks.
 *
 * Pure functions plus planDetour (takes a fetcher for tests). Tested in tests/reroute.test.js.
 */
import { snap, pointAt } from './race/race.js';
import { distKm } from './route.js';
import { gpxString } from './gpxout.js';

export const BROUTER = 'https://brouter.de/brouter';
export const PROFILES = [
  { key: 'trekking', name: 'Quiet roads and good paths' },
  { key: 'fastbike', name: 'Short and paved (road bike)' },
];
export const PROFILE_STD = 'trekking';
/** Back onto the route this far after the place (km), so you do not ride the same way back and forth. */
export const REJOIN_AHEAD_KM = 1;
/** A place farther than this from you is not offered (km, as the crow flies). */
export const MAX_KM = 60;
/** Within this (m) of the detour line the off-route warning stays quiet. */
export const ON_DETOUR_M = 120;
/** The kinds offered first in «Neu planen zu …», in this order. */
export const TARGET_KINDS = ['shop', 'sleep', 'station', 'water', 'food', 'bike', 'fuel'];
export const PER_KIND = 3;
export const DETOUR_KEY = 'pg-live-detour';
/** The colour of the detour on the map (the blue of --l3, apart from the route and the climb colours). */
export const DETOUR_COLOUR = '#3f7fbf';

const fin = (v) => Number.isFinite(Number(v));
const P = (p) => ({ lat: Number(p.lat), lon: Number(p.lon) });

/** The router address for [{ lat, lon }] (start, places on the way, end). */
export function brouterUrl(points, profile = PROFILE_STD, alt = 0) {
  const lonlats = points.map((p) => `${Number(p.lon).toFixed(5)},${Number(p.lat).toFixed(5)}`).join('|');
  const prof = PROFILES.some((x) => x.key === profile) ? profile : PROFILE_STD;
  return `${BROUTER}?lonlats=${lonlats}&profile=${prof}&alternativeidx=${Math.max(0, Math.min(3, Math.round(Number(alt)) || 0))}&format=geojson`;
}

/** BRouter GeoJSON → { line: [[lat, lon, ele]], km, gainM, min } or null. */
export function parseBrouter(json) {
  const f = json?.features?.[0];
  const c = f?.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const line = c.filter((x) => fin(x?.[0]) && fin(x?.[1])).map(([lon, lat, ele]) => (fin(ele) ? [lat, lon, Math.round(ele)] : [lat, lon]));
  const pr = f.properties ?? {};
  let km = Number(pr['track-length']) / 1000;
  if (!(km > 0)) km = line.slice(1).reduce((s, p, i) => s + distKm({ lat: line[i][0], lon: line[i][1] }, { lat: p[0], lon: p[1] }), 0);
  const gainM = fin(pr['filtered ascend']) ? Math.max(0, Math.round(Number(pr['filtered ascend']))) : null;
  const min = fin(pr['total-time']) ? Math.round(Number(pr['total-time']) / 60) : null;
  return { line, km: Math.round(km * 10) / 10, gainM, min };
}

/** Where a place lies on the route from fromKm on: { km, offKm } (a round tour does not snap back to the start). */
export function snapAhead(pts = [], p, fromKm = 0) {
  if (pts.length < 2 || !p) return null;
  const a = pointAt(pts, fromKm);
  const rest = [{ ...a, km: fromKm }, ...pts.filter((x) => x.km > fromKm)];
  if (rest.length < 2) return { km: fromKm, offKm: distKm(a, P(p)) };
  return snap(rest, P(p));
}

/**
 * Where you come back onto the route: REJOIN_AHEAD_KM after the place (never behind you), or null
 * without a route or when that is past its end (then the detour ends at the place).
 */
export function rejoinOf(pts = [], target, fromKm = 0, ahead = REJOIN_AHEAD_KM) {
  if (pts.length < 2 || !target) return null;
  const total = pts.at(-1).km;
  const s = snapAhead(pts, target, fromKm);
  const km = Math.max(fromKm, s?.km ?? fromKm) + ahead;
  if (km >= total - 0.05) return null;
  const p = pointAt(pts, km);
  return { km: Math.round(km * 10) / 10, lat: p.lat, lon: p.lon };
}

/**
 * The places to offer: per kind (TARGET_KINDS) the PER_KIND nearest to you, your own points, then the rest
 * is left out. pois: [{ id, kind, name, lat, lon }]; own: [{ id, lat, lon, name }].
 * → [{ id, kind, name, lat, lon, distKm }] sorted by kind order, then distance.
 */
export function targetsOf({ pois = [], own = [], here = null, kinds = TARGET_KINDS, per = PER_KIND, maxKm = MAX_KM } = {}) {
  if (!here) return [];
  const withD = (p) => ({ ...p, lat: Number(p.lat), lon: Number(p.lon), distKm: Math.round(distKm(P(here), P(p)) * 10) / 10 });
  const out = [];
  for (const k of kinds) {
    const list = pois
      .filter((p) => p.kind === k && fin(p.lat) && fin(p.lon))
      .map(withD)
      .filter((p) => p.distKm <= maxKm && p.distKm > 0.05)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, per);
    out.push(...list);
  }
  const mine = own
    .filter((p) => fin(p.lat) && fin(p.lon))
    .map((p) => withD({ ...p, kind: 'own' }))
    .filter((p) => p.distKm <= maxKm)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, per * 2);
  return [...out, ...mine];
}

/* ---------- Sicherheitsnetz für den Router (Noah 05.11.2026 «ok bauen») ---------- */

/** The router gets this long to answer (ms). Measured 05.11.2026: 8 km 1 s, 50 km 3.5 s, 110 km 6 s. */
export const ROUTER_TIMEOUT_MS = 15000;
/** After a quick failure (no connection, 502, 504) one more try, after this pause (ms). A timeout or «busy» is never repeated. */
export const ROUTER_RETRY_MS = 1500;
/** A leg longer than this (km as the crow flies) is not asked: the free router did not answer for 600 km. */
export const ROUTER_TOO_FAR_KM = 200;
/** The same question within this time (ms) is answered from memory, at most ROUTER_CACHE_MAX answers are kept. */
export const ROUTER_CACHE_MS = 10 * 60 * 1000;
export const ROUTER_CACHE_MAX = 30;
/** What askRouter uses when a call does not say otherwise (tests set a short pause). */
export const ROUTER_TUNING = { timeoutMs: ROUTER_TIMEOUT_MS, retryMs: ROUTER_RETRY_MS, reserve: true };
const cache = new Map();
export const clearRouterCache = () => cache.clear();
const copyOf = (r) => ({ ...r, line: r.line.map((p) => [...p]) });
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** The longest leg of a way [{ lat, lon }] in km, as the crow flies. */
export const longestLegKm = (way = []) => way.slice(1).reduce((m, p, i) => Math.max(m, distKm(P(way[i]), P(p))), 0);

/**
 * One request to the router for the way [{ lat, lon }] → parseBrouter's answer.
 * Throws 'toofar' (a leg over ROUTER_TOO_FAR_KM, nothing is sent), 'offline' (no internet), 'busy' (429, 503),
 * 'timeout' (no answer in ROUTER_TIMEOUT_MS), 'noroute' or 'failed'. A quick failure is tried once more.
 * The same question within ROUTER_CACHE_MS is answered from memory, also without internet.
 * opts: { timeoutMs, retryMs, now, online } (for tests).
 */
async function askBRouter(way, profile, fetcher, alt, opts) {
  const { timeoutMs = ROUTER_TUNING.timeoutMs, retryMs = ROUTER_TUNING.retryMs, now = Date.now(), online = globalThis.navigator?.onLine } = opts;
  if (longestLegKm(way) > ROUTER_TOO_FAR_KM) throw new Error('toofar');
  const url = brouterUrl(way, profile, alt);
  const kept = cache.get(url);
  if (kept && now - kept.at < ROUTER_CACHE_MS) return copyOf(kept.r);
  if (online === false) throw new Error('offline');
  let fail = 'failed';
  for (let tries = 0; tries < 2; tries++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      let res;
      try {
        res = await fetcher(url, { signal: ctl.signal });
      } catch {
        // aborted by the timer: the router is too slow, trying again would only wait longer
        if (ctl.signal.aborted) throw new Error('timeout');
        fail = 'failed';
        if (tries === 0) {
          await wait(retryMs);
          continue;
        }
        throw new Error('failed');
      }
      if (res.status === 429 || res.status === 503) throw new Error('busy');
      if (res.status === 502 || res.status === 504) {
        fail = 'failed';
        if (tries === 0) {
          await wait(retryMs);
          continue;
        }
        throw new Error('failed');
      }
      if (!res.ok) throw new Error(res.status === 400 || res.status === 500 ? 'noroute' : 'failed');
      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error(ctl.signal.aborted ? 'timeout' : 'noroute');
      }
      const r = parseBrouter(json);
      if (!r) throw new Error('noroute');
      cache.set(url, { at: now, r: copyOf(r) });
      while (cache.size > ROUTER_CACHE_MAX) cache.delete(cache.keys().next().value);
      return r;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(fail);
}

/* ---------- Reserve-Router (Noah 05.11.2026 «2a und b») ---------- */

/** The reserve routers, FOSSGIS public servers (free, no account, open to browsers). Asked only when brouter.de fails. */
export const VALHALLA = 'https://valhalla1.openstreetmap.de/route';
export const OSRM = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving';
/** Valhalla refuses more than 150 km of path (measured 05.11.2026); as the crow flies we stop earlier. */
export const VALHALLA_MAX_KM = 110;
/** Valhalla's bicycle type for each BRouter profile (it changes the speed, hardly the way). */
export const BICYCLE_TYPE = { trekking: 'Hybrid', fastbike: 'Road', gravel: 'Cross', mtb: 'Mountain' };
/** A reserve gets this long (ms) and is asked once. */
export const RESERVE_TIMEOUT_MS = 10000;
/** These failures of brouter.de send the question on to the reserve; «no way», «too far» and «offline» do not. */
const RESERVE_AFTER = ['failed', 'timeout', 'busy'];

export const sumLegsKm = (way = []) => way.slice(1).reduce((m, p, i) => m + distKm(P(way[i]), P(p)), 0);

/** Valhalla's route address for [{ lat, lon }]. */
export function valhallaUrl(points, profile = PROFILE_STD) {
  const type = BICYCLE_TYPE[profile] ?? BICYCLE_TYPE[PROFILE_STD];
  const json = { locations: points.map((p) => ({ lat: Number(Number(p.lat).toFixed(5)), lon: Number(Number(p.lon).toFixed(5)) })), costing: 'bicycle', costing_options: { bicycle: { bicycle_type: type } }, units: 'kilometers' };
  return `${VALHALLA}?json=${encodeURIComponent(JSON.stringify(json))}`;
}

/** OSRM's route address for [{ lat, lon }] (the path says «driving», the server's bike data is behind «routed-bike»). */
export function osrmUrl(points) {
  const c = points.map((p) => `${Number(p.lon).toFixed(5)},${Number(p.lat).toFixed(5)}`).join(';');
  return `${OSRM}/${c}?overview=full&geometries=geojson`;
}

/** An encoded line (Valhalla: 6 digits) → [[lat, lon]]. */
export function decodeLine(str = '', digits = 6) {
  const f = 10 ** digits;
  const out = [];
  let i = 0;
  let lat = 0;
  let lon = 0;
  const next = () => {
    let shift = 0;
    let res = 0;
    let b;
    do {
      b = str.charCodeAt(i++) - 63;
      res |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32 && i <= str.length);
    return res & 1 ? ~(res >> 1) : res >> 1;
  };
  while (i < str.length) {
    lat += next();
    lon += next();
    out.push([lat / f, lon / f]);
  }
  return out;
}

/** Valhalla's answer → { line, km, gainM: null, min } or null. The legs are joined (their shared point once). */
export function parseValhalla(json) {
  const legs = json?.trip?.legs;
  if (!Array.isArray(legs) || !legs.length) return null;
  const line = [];
  for (const l of legs) {
    const pts = decodeLine(l?.shape ?? '');
    line.push(...(line.length ? pts.slice(1) : pts));
  }
  const s = json.trip.summary ?? {};
  if (line.length < 2 || !(Number(s.length) > 0)) return null;
  return { line: line.filter((p) => fin(p[0]) && fin(p[1])), km: Math.round(Number(s.length) * 10) / 10, gainM: null, min: fin(s.time) ? Math.round(Number(s.time) / 60) : null };
}

/** OSRM's answer → { line, km, gainM: null, min } or null. */
export function parseOsrm(json) {
  const r = json?.code === 'Ok' ? json?.routes?.[0] : null;
  const c = r?.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2 || !(Number(r.distance) > 0)) return null;
  return { line: c.filter((x) => fin(x?.[0]) && fin(x?.[1])).map(([lon, lat]) => [lat, lon]), km: Math.round(Number(r.distance) / 100) / 10, gainM: null, min: fin(r.duration) ? Math.round(Number(r.duration) / 60) : null };
}

/**
 * brouter.de did not answer: ask the reserve routers one after the other, each once (Valhalla, then OSRM).
 * → the answer with `via: 'valhalla' | 'osrm'`, or null when none helps. The answer has no climb and hardly knows
 * the kind of way, so the screens say so.
 */
export async function askReserve(way, profile = PROFILE_STD, fetcher = fetch, { timeoutMs = RESERVE_TIMEOUT_MS } = {}) {
  const km = sumLegsKm(way);
  const list = [
    { key: 'valhalla', ok: km <= VALHALLA_MAX_KM, url: () => valhallaUrl(way, profile), parse: parseValhalla },
    { key: 'osrm', ok: true, url: () => osrmUrl(way), parse: parseOsrm },
  ];
  for (const x of list) {
    if (!x.ok) continue;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetcher(x.url(), { signal: ctl.signal });
      if (!res?.ok) continue;
      const r = x.parse(await res.json());
      if (r) return { ...r, via: x.key };
    } catch {
      /* this reserve did not answer: the next one */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/**
 * The one door to the routers: brouter.de first (askBRouter, with its safety net); when it does not answer
 * ('failed', 'timeout', 'busy') the reserve routers once each, for the first way only (alt 0). Without a
 * reserve answer the first error is thrown as before.
 */
export async function askRouter(way, profile = PROFILE_STD, fetcher = fetch, alt = 0, opts = {}) {
  try {
    return await askBRouter(way, profile, fetcher, alt, opts);
  } catch (e) {
    if (alt !== 0 || !RESERVE_AFTER.includes(e?.message) || !(opts.reserve ?? ROUTER_TUNING.reserve)) throw e;
    const r = await askReserve(way, profile, fetcher, opts.reserveTimeoutMs ? { timeoutMs: opts.reserveTimeoutMs } : undefined);
    if (!r) throw e;
    // kept like any answer: the same question during the outage is answered from memory
    cache.set(brouterUrl(way, profile, alt), { at: opts.now ?? Date.now(), r: { ...r, line: r.line.map((p) => [...p]) } });
    return r;
  }
}

/**
 * The words for an error of askRouter (English key; the caller puts it through t()). online: navigator.onLine.
 * noroute: the caller's own text for «no way found» (a way, a round), otherwise the text for a way.
 */
export function routerMsg(e, { round = false, noroute = null, online = globalThis.navigator?.onLine } = {}) {
  const m = e?.message;
  if (m === 'busy') return round ? 'The bike router is busy right now. Try again in a minute.' : 'The bike router is busy right now. Try again in a minute, or use a navigation app.';
  if (m === 'noroute') return noroute ?? 'The bike router found no way there. Choose another place, or use a navigation app.';
  if (m === 'toofar') return round ? 'That is too far for the bike router. Choose a shorter round.' : 'That is too far for the bike router. Choose a place closer to you, or use a navigation app.';
  if (m === 'timeout') return round ? 'The bike router takes too long. Try again.' : 'The bike router takes too long. Choose a place closer to you, or use a navigation app.';
  if (m === 'offline' || online === false) return round ? 'Offline: a new round needs the internet.' : 'Offline: a new way needs the internet. A navigation app with offline maps still works.';
  return round ? 'The bike router did not answer. Try again.' : 'The bike router did not answer. Try again, or use a navigation app.';
}

/**
 * Ask the router. here: where you are; target: { lat, lon, name, kind }; pts/fromKm: the route and your km
 * (optional). → the detour { line, km, gainM, min, target, rejoin, fromKm, extraKm, profile, at }.
 * Throws 'busy' (too many requests), 'noroute' (no way found) or 'failed'.
 */
export async function planDetour({ here, target, pts = [], fromKm = null, profile = PROFILE_STD, oneWay = false, fetcher = fetch, now = Date.now(), alt = 0 }) {
  if (!here || !target) throw new Error('failed');
  const hasRoute = pts.length > 1 && fin(fromKm);
  // «Nur hin» (Noah 27.10.2026 «2a»): only the way there; at the place the app asks how you go back
  const rejoin = hasRoute && !oneWay ? rejoinOf(pts, target, fromKm) : null;
  const way = [P(here), P(target), ...(rejoin ? [rejoin] : [])];
  const r = await askRouter(way, profile, fetcher, alt);
  const along = rejoin ? Math.max(0, rejoin.km - fromKm) : 0;
  return {
    ...r,
    target: { lat: Number(target.lat), lon: Number(target.lon), name: target.name ?? '', kind: target.kind ?? 'target' },
    rejoin,
    fromKm: hasRoute ? Math.round(fromKm * 10) / 10 : null,
    extraKm: rejoin ? Math.round((r.km - along) * 10) / 10 : null,
    ...(oneWay && hasRoute ? { oneWay: true } : {}),
    profile,
    at: now,
  };
}

/** The same way twice? (equal length, climb and middle point) */
const sameWay = (a, b) => a.km === b.km && a.gainM === b.gainM && a.line.length === b.line.length && Math.abs(a.line[a.line.length >> 1][0] - b.line[b.line.length >> 1][0]) < 1e-4 && Math.abs(a.line[a.line.length >> 1][1] - b.line[b.line.length >> 1][1]) < 1e-4;

/**
 * Live-Navigation Schritt 5 (Noah 31.10.2026 «1-5 a»): up to `n` different ways to choose from. The router
 * is asked one after the other (fair use of the free router); the first answer must work (else it throws like
 * planDetour), later ones that fail end the search. → [detour] with `tags`: 'shortest', 'fastest', 'flattest'
 * on the ways that are the best in that (only when the ways differ in it).
 */
export async function planAlternatives(opts = {}, n = 3) {
  const out = [await planDetour({ ...opts, alt: 0 })];
  for (let i = 1; i < n; i++) {
    let d;
    try {
      d = await planDetour({ ...opts, alt: i });
    } catch {
      break;
    }
    if (!out.some((o) => sameWay(o, d))) out.push(d);
  }
  const best = (key, low = true) => {
    const v = out.map((o) => o[key]).filter(fin);
    if (v.length < 2 || new Set(v).size < 2) return null;
    return low ? Math.min(...v) : Math.max(...v);
  };
  const kmB = best('km');
  const minB = best('min');
  const gainB = best('gainM');
  return out.map((o) => ({ ...o, tags: [...(kmB != null && o.km === kmB ? ['shortest'] : []), ...(minB != null && o.min === minB ? ['fastest'] : []), ...(gainB != null && o.gainM === gainB ? ['flattest'] : [])] }));
}

/** Distance (m) from p to the nearest point of a line [[lat, lon]] (by its points; the line is dense). */
export function offLineM(line = [], p) {
  if (!line.length || !p) return Infinity;
  let best = Infinity;
  for (const q of line) best = Math.min(best, distKm(P(p), { lat: q[0], lon: q[1] }));
  return Math.round(best * 1000);
}

/** Are you on the detour (so the off-route warning stays quiet)? */
export const onDetour = (detour, here, m = ON_DETOUR_M) => !!detour?.line?.length && !!here && offLineM(detour.line, here) <= m;

/** The detour is done once you are back on the route past the rejoin point (or at the place without a route). */
export function detourDone(detour, { km = null, here = null, offM = null } = {}) {
  if (!detour) return false;
  // still off the route (offM given): a km near the place is not «back on the route»
  if (offM != null && offM > OFF_ROUTE_M) return false;
  if (detour.rejoin && fin(km)) return km >= detour.rejoin.km + 0.3;
  // only the way there: done once you were at the place and are back on the route away from it
  if (detour.oneWay) return !!detour.reached && offM != null && !!here && distKm(P(here), P(detour.target)) * 1000 > AT_PLACE_M * 2;
  if (!detour.rejoin && here) return distKm(P(here), P(detour.target)) < 0.05;
  return false;
}

/**
 * The GPX for the bike computer: the detour, then the rest of the route from the rejoin point, with the
 * place as a waypoint. pts: the route [{ lat, lon, km }].
 */
export function detourGpx(detour, pts = [], name = 'Detour') {
  if (!detour?.line?.length) return '';
  const rest = detour.rejoin ? pts.filter((p) => p.km > detour.rejoin.km).map((p) => [p.lat, p.lon]) : [];
  return gpxString({ name, line: [...detour.line, ...rest], stops: [{ ...detour.target, name: detour.target.name || name, kind: detour.target.kind === 'own' ? 'own' : detour.target.kind || 'target' }] });
}

/** Keep and read the detour on this device (a reload during the ride keeps it). */
export function saveDetour(d, store = globalThis.localStorage) {
  try {
    if (d) store?.setItem(DETOUR_KEY, JSON.stringify(d));
    else store?.removeItem(DETOUR_KEY);
  } catch {
    /* private window: the detour lives until the page closes */
  }
}
export function loadDetour(store = globalThis.localStorage, now = Date.now()) {
  try {
    const d = JSON.parse(store?.getItem(DETOUR_KEY) ?? 'null');
    // a detour older than a day is from another ride
    return d?.line?.length && fin(d.at) && now - d.at < 864e5 ? d : null;
  } catch {
    return null;
  }
}

/* ---------- Umweg und zurück (Noah 27.10.2026 «1a 2b 3a») ---------- */

/**
 * After a stop the app asks how you go back (1a): 'exit' back to the spot where you left the route (a race
 * counts only the whole route), or 'fast' the shortest way onto the route ahead. In race mode 'exit' is
 * chosen first, else 'fast'.
 */
export const RETURN_MODES = ['exit', 'fast'];
export const returnModeStd = (race = false) => (race ? 'exit' : 'fast');

/**
 * The point you ride back to: 'exit' the route at exitKm; 'fast' the nearest point of the route ahead of
 * exitKm (never behind it). → { km, lat, lon } or null without a route.
 */
export function returnPoint(mode, pts = [], { exitKm = 0, here = null } = {}) {
  if (pts.length < 2 || !fin(exitKm)) return null;
  let km = Number(exitKm);
  if (mode === 'fast' && here) km = Math.max(km, snapAhead(pts, here, km)?.km ?? km);
  km = Math.min(km, pts.at(-1).km);
  const p = pointAt(pts, km);
  return { km: Math.round(km * 10) / 10, lat: p.lat, lon: p.lon };
}

/**
 * The way back onto the route from here. → { line, km, gainM, min, mode, rejoin, skippedKm } where
 * skippedKm is the part of the route you leave out (0 for 'exit'). Throws like askRouter, 'failed'
 * without a route or position.
 */
export async function planReturn({ here, mode = 'fast', pts = [], exitKm = null, profile = PROFILE_STD, fetcher = fetch }) {
  const rejoin = here ? returnPoint(mode, pts, { exitKm, here }) : null;
  if (!rejoin) throw new Error('failed');
  const r = await askRouter([P(here), rejoin], profile, fetcher);
  return { ...r, mode: RETURN_MODES.includes(mode) ? mode : 'fast', rejoin, skippedKm: Math.max(0, Math.round((rejoin.km - Number(exitKm)) * 10) / 10) };
}

/**
 * Off the route the app plans the way back by itself at once (2b), but asks the router at most once a
 * minute (fair use of the free router). Off: more than OFF_ROUTE_M from the route (and from a detour) for
 * OFF_ROUTE_S seconds.
 */
export const OFF_ROUTE_M = 80;
export const OFF_ROUTE_S = 15;
export const REROUTE_GAP_S = 60;
/** offM: metres from the route now; offSince: when you went off (ms) or null; lastAt: the last automatic plan (ms). */
export function shouldReroute({ offM = 0, offSince = null, lastAt = null, now = Date.now(), onDetour: onD = false } = {}) {
  if (onD || !(offM > OFF_ROUTE_M) || offSince == null || !fin(offSince)) return false;
  if (now - offSince < OFF_ROUTE_S * 1000) return false;
  return lastAt == null || !fin(lastAt) || now - lastAt >= REROUTE_GAP_S * 1000;
}

/**
 * «Gleichen Weg zurück» (Noah 27.10.2026): off the route, ride your own track back to where you left it.
 * track: your recorded points [{ lat, lon }] (oldest first); pts: the route [{ lat, lon, km }].
 * The way back is your track since the last point within OFF_ROUTE_M of the route, reversed (no
 * router, works offline). → { line: [[lat, lon]], km, rejoin: { km, lat, lon } } or null when you never
 * were on the route or are on it now.
 */
export function backtrackOf(track = [], pts = []) {
  const T = (track ?? []).filter((p) => fin(p?.lat) && fin(p?.lon));
  if (T.length < 2 || pts.length < 2) return null;
  const near = (p) => (snap(pts, P(p))?.offKm ?? Infinity) * 1000 <= OFF_ROUTE_M;
  let i = T.length - 1;
  if (near(T[i])) return null;
  while (i >= 0 && !near(T[i])) i--;
  if (i < 0) return null;
  const back = T.slice(i).reverse();
  let km = 0;
  for (let j = 1; j < back.length; j++) km += distKm(P(back[j - 1]), P(back[j]));
  const s = snap(pts, P(T[i]));
  const p = pointAt(pts, s.km);
  return { line: back.map((q) => [Number(q.lat), Number(q.lon)]), km: Math.round(km * 10) / 10, rejoin: { km: Math.round(s.km * 10) / 10, lat: p.lat, lon: p.lon } };
}

/* ---------- at the place: the way back (PR 5 «Umweg und zurück») ---------- */

/** Within this of the detour's place counts as «arrived»: the app asks how you go back. */
export const AT_PLACE_M = 80;
/** At the place of a detour to a place (not on a way back)? */
export const atPlace = (detour, here, m = AT_PLACE_M) => !!detour?.target && !detour.back && !!here && distKm(P(here), P(detour.target)) * 1000 <= m;

/**
 * A planned way back as a detour the map shows like any other. r: planReturn's answer; back: 'exit',
 * 'fast', 'auto' (planned by itself off the route) or 'same' (your own track back).
 */
export function returnDetour(r, { exitKm = null, back = 'fast', now = Date.now() } = {}) {
  return {
    line: r.line,
    km: r.km,
    gainM: r.gainM ?? 0,
    min: r.min ?? null,
    target: { lat: r.rejoin.lat, lon: r.rejoin.lon, name: '', kind: 'route' },
    rejoin: r.rejoin,
    fromKm: exitKm != null && fin(exitKm) ? Math.round(exitKm * 10) / 10 : null,
    extraKm: null,
    skippedKm: r.skippedKm ?? 0,
    profile: r.profile ?? PROFILE_STD,
    back,
    at: now,
  };
}
/** «Gleichen Weg zurück» as a detour (backtrackOf's answer; no router). */
export const backDetour = (b, now = Date.now()) => returnDetour({ ...b, gainM: 0, min: null, skippedKm: 0 }, { exitKm: b.rejoin.km, back: 'same', now });
