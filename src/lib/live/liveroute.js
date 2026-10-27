/**
 * Paket U «GPX auf der Live-Karte öffnen» (Noah 19.10.2026): on the live map without a race you can open
 * a GPX file (komoot, Ride with GPS, Garmin export) and ride along it: km along the route, left to the
 * end, arrival and climbs, the same as a race route.
 *
 * The file is read on the device (route.js parseGpx/routeStats); only a thinned line and the numbers are
 * kept in the settings record LIVE_ROUTE_KEY (on this device only once db.js DEVICE_SETTINGS lists it):
 *   { name, line: [[lat, lon], …], km, gainM, lossM, profile: [[km, m], …], profileFine, start, end, file, loadedAt }
 * The line keeps the bends (Douglas–Peucker, about 5 m) and at most LIVE_LINE_MAX points, enough for
 * «km along the route» and the off-route warning without a heavy settings record.
 * The user can rename it and delete it (askDelete + deleteWithUndo in LiveRouteBox.svelte). When the
 * ride has a trip without a route, «Save route to the trip» copies it as trip.route (only an offer).
 *
 * Pure functions plus three small store helpers that take the settings table (tests: fake-indexeddb).
 * Tested in tests/liveroute.test.js.
 */
import { liveQuery } from 'dexie';
import { parseGpx, routeStats, distKm } from '../route.js';
import { fineLine, FINE_MAX, FINE_TOLERANCE_M } from '../route/fineline.js';

export const LIVE_ROUTE_KEY = 'live-route';
export const LIVE_LINE_MAX = FINE_MAX;
export const LIVE_TOLERANCE_M = FINE_TOLERANCE_M;
/** The line to keep (route/fineline.js). */
export const thinLine = fineLine;
export const NAME_MAX = 80;

const round = (v) => Math.round(v * 1e5) / 1e5;
const pair = (p) => (Array.isArray(p) ? { lat: Number(p[0]), lon: Number(p[1]) } : { lat: Number(p?.lat), lon: Number(p?.lon) });
const okPt = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;

/** A name the user typed: trimmed, inner spaces folded, at most NAME_MAX characters. */
export const cleanName = (name = '') => String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

/**
 * A parsed GPX ({ name, points } of parseGpx) → the live route to keep.
 * fileName names it when the file has no name of its own.
 */
export function liveRouteOf(gpx, fileName = '', now = new Date()) {
  const s = routeStats(gpx, fileName);
  return {
    name: cleanName(s.name) || cleanName(fileName.replace(/\.gpx$/i, '')) || 'GPX',
    line: thinLine(gpx.points),
    km: s.km,
    gainM: s.gainM,
    lossM: s.lossM,
    profile: s.profile,
    profileFine: s.profileFine ?? null,
    start: s.start,
    end: s.end,
    file: fileName,
    loadedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
  };
}

/** GPX text → live route (throws the plain messages of parseGpx: not a GPX, no route in it). */
export const liveRouteFromText = (text, fileName = '', now = new Date()) => liveRouteOf(parseGpx(text), fileName, now);

/**
 * A stored value → a usable live route, or null (missing, broken, fewer than 2 points).
 * km is recounted from the line when it is missing.
 */
export function cleanLiveRoute(v) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.line)) return null;
  const line = v.line.map(pair).filter(okPt).map((p) => [p.lat, p.lon]);
  if (line.length < 2) return null;
  let km = Number(v.km);
  if (!(km > 0)) {
    km = 0;
    for (let i = 1; i < line.length; i++) km += distKm({ lat: line[i - 1][0], lon: line[i - 1][1] }, { lat: line[i][0], lon: line[i][1] });
    km = Math.round(km * 10) / 10;
  }
  if (!(km > 0)) return null;
  const first = { lat: line[0][0], lon: line[0][1] };
  const last = { lat: line.at(-1)[0], lon: line.at(-1)[1] };
  return {
    name: cleanName(v.name) || 'GPX',
    line,
    km,
    gainM: Number.isFinite(Number(v.gainM)) ? Number(v.gainM) : 0,
    lossM: Number.isFinite(Number(v.lossM)) ? Number(v.lossM) : 0,
    profile: Array.isArray(v.profile) ? v.profile.filter((p) => Array.isArray(p) && Number.isFinite(p[0])) : [],
    profileFine: v.profileFine && typeof v.profileFine === 'object' ? v.profileFine : null,
    start: v.start && okPt(pair(v.start)) ? v.start : first,
    end: v.end && okPt(pair(v.end)) ? v.end : last,
    file: typeof v.file === 'string' ? v.file : '',
    loadedAt: typeof v.loadedAt === 'string' ? v.loadedAt : '',
  };
}

/** Renamed: an empty name keeps the old one. */
export const renameLiveRoute = (r, name) => (r ? { ...r, name: cleanName(name) || r.name } : r);

/** Can the route go to this trip? Only when the trip has no route of its own (never overwrites). */
export const canSaveToTrip = (trip) => !!trip && !(trip.route?.line?.length > 1) && !(trip.route?.km > 0);

/**
 * The live route as trip.route (route.js format: the line keeps its bends like every trip route,
 * profile ≤ 300 points).
 */
export function asTripRoute(r) {
  if (!r) return null;
  const pts = r.line.map(([lat, lon]) => ({ lat, lon }));
  const p = r.profile ?? [];
  return {
    name: r.name,
    km: r.km,
    gainM: r.gainM ?? 0,
    lossM: r.lossM ?? 0,
    start: r.start,
    end: r.end,
    line: fineLine(pts),
    profile: p.length > 300 ? Array.from({ length: 300 }, (_, i) => p[Math.round((i * (p.length - 1)) / 299)]) : p,
    profileFine: r.profileFine ?? null,
    file: r.file ?? '',
  };
}

/* ---------- this device: settings record LIVE_ROUTE_KEY ---------- */

/** The kept live route, live (null when there is none). settings: db.settings. */
export const liveRouteQuery = (settings) => liveQuery(async () => cleanLiveRoute((await settings.get(LIVE_ROUTE_KEY))?.value));

/** The kept live route or null. settings: db.settings. */
export async function loadLiveRoute(settings) {
  try {
    return cleanLiveRoute((await settings.get(LIVE_ROUTE_KEY))?.value);
  } catch (err) {
    console.error(err);
    return null;
  }
}
/** Keep r (cleaned); → the route before (for Undo) or null. */
export async function saveLiveRoute(settings, r) {
  const before = await loadLiveRoute(settings);
  const clean = cleanLiveRoute(r);
  if (!clean) throw new Error('invalid');
  await settings.put({ key: LIVE_ROUTE_KEY, value: clean });
  return before;
}
/** Remove it; → the route before (for Undo, put it back with saveLiveRoute). */
export async function clearLiveRoute(settings) {
  const before = await loadLiveRoute(settings);
  await settings.delete(LIVE_ROUTE_KEY);
  return before;
}
