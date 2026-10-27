/**
 * Paket X «Umweg neu planen» (Noah 20.10.2026 «unbedingt umsetzen»): on the live map «Neu planen zu …»
 * a shop, a bed, a station, a fountain, one of your own points, a place you search or a point you press
 * on the map. The app asks a free bike router for the way there and back onto your route a little
 * after the place, and draws it on the map. You can send it to the Garmin as a GPX (detour + the rest of
 * the route) or open it in Google Maps / OsmAnd.
 *
 * Router: BRouter (brouter.de, the public server of the open-source bike router; free, no account, no
 * key, fair use: one request per tap; off the route the app asks by itself at most once a minute). Profiles «trekking» (quiet roads and
 * good paths) and «fastbike» (road bike, short and paved). When it does not answer, the app says so and
 * offers the navigation apps instead. The answer stays on this device (localStorage, so a reload during
 * the ride keeps the detour); nothing else is sent.
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
export function brouterUrl(points, profile = PROFILE_STD) {
  const lonlats = points.map((p) => `${Number(p.lon).toFixed(5)},${Number(p.lat).toFixed(5)}`).join('|');
  const prof = PROFILES.some((x) => x.key === profile) ? profile : PROFILE_STD;
  return `${BROUTER}?lonlats=${lonlats}&profile=${prof}&alternativeidx=0&format=geojson`;
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

/** One request to the router for the way [{ lat, lon }] → parseBrouter's answer. Throws 'busy', 'noroute' or 'failed'. */
export async function askRouter(way, profile = PROFILE_STD, fetcher = fetch) {
  let res;
  try {
    res = await fetcher(brouterUrl(way, profile));
  } catch {
    throw new Error('failed');
  }
  if (res.status === 429 || res.status === 503) throw new Error('busy');
  if (!res.ok) throw new Error(res.status === 400 || res.status === 500 ? 'noroute' : 'failed');
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('noroute');
  }
  const r = parseBrouter(json);
  if (!r) throw new Error('noroute');
  return r;
}

/**
 * Ask the router. here: where you are; target: { lat, lon, name, kind }; pts/fromKm: the route and your km
 * (optional). → the detour { line, km, gainM, min, target, rejoin, fromKm, extraKm, profile, at }.
 * Throws 'busy' (too many requests), 'noroute' (no way found) or 'failed'.
 */
export async function planDetour({ here, target, pts = [], fromKm = null, profile = PROFILE_STD, fetcher = fetch, now = Date.now() }) {
  if (!here || !target) throw new Error('failed');
  const hasRoute = pts.length > 1 && fin(fromKm);
  const rejoin = hasRoute ? rejoinOf(pts, target, fromKm) : null;
  const way = [P(here), P(target), ...(rejoin ? [rejoin] : [])];
  const r = await askRouter(way, profile, fetcher);
  const along = rejoin ? Math.max(0, rejoin.km - fromKm) : 0;
  return {
    ...r,
    target: { lat: Number(target.lat), lon: Number(target.lon), name: target.name ?? '', kind: target.kind ?? 'target' },
    rejoin,
    fromKm: hasRoute ? Math.round(fromKm * 10) / 10 : null,
    extraKm: rejoin ? Math.round((r.km - along) * 10) / 10 : null,
    profile,
    at: now,
  };
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
