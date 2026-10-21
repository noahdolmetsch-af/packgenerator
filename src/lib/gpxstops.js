/**
 * Paket X «Stopps als Wegpunkte für Garmin» (Noah 20.10.2026): a route with its stops as one GPX file for
 * a bike computer (Garmin, Wahoo, Hammerhead). The stops come from the places the app already knows along
 * the route (route card, Verpflegung, race, live map) and go in as waypoints with a symbol the device
 * knows (gpxout.js GPX_SYM), in km order, twins once. The Live-Karte uses routeGpx() too.
 * Pure functions, tested in tests/gpxstops.test.js.
 */
import { gpxString, WPT_MAX } from './gpxout.js';

/** The kinds of places a stop can be, in the order the chips show them. */
export const STOP_KINDS = ['shop', 'food', 'fuel', 'water', 'sleep', 'camp', 'bike', 'repair', 'station', 'shelter', 'own'];
/** On first: what you need on a long ride. */
export const STOP_KINDS_STD = ['shop', 'food', 'fuel', 'water'];
/** Twins: the same kind within this many metres. */
export const TWIN_M = 40;

const fin = (v) => Number.isFinite(Number(v)) && v !== null && v !== '';
const kindOf = (p) => (STOP_KINDS.includes(p?.kind) ? p.kind : 'own');
const near = (a, b) => {
  const dLat = (a.lat - b.lat) * 111320;
  const dLon = (a.lon - b.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon) < TWIN_M;
};

/** The kinds that are among the points (in STOP_KINDS order). */
export const kindsIn = (points = []) => STOP_KINDS.filter((k) => points.some((p) => kindOf(p) === k));

/**
 * The stops to write: points [{ lat, lon, name, kind, km?, note? }] of the chosen kinds (null = all),
 * with a place, twins once, by km, at most max.
 */
export function stopsOf(points = [], { kinds = null, max = WPT_MAX } = {}) {
  const out = [];
  for (const p of points ?? []) {
    if (!p || !fin(p.lat) || !fin(p.lon)) continue;
    const kind = kindOf(p);
    if (kinds && !kinds.includes(kind)) continue;
    const s = { lat: Number(p.lat), lon: Number(p.lon), name: String(p.name ?? '').trim(), kind, km: fin(p.km) ? Number(p.km) : null, note: p.note ? String(p.note) : '' };
    if (out.some((q) => q.kind === s.kind && near(q, s))) continue;
    out.push(s);
  }
  out.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
  return out.slice(0, max);
}

/**
 * The GPX text of a route with its stops. route: { name, line [[lat, lon]] }; points as stopsOf.
 * nameOf(stop): the name for a stop without one (the kind, translated by the caller).
 */
export function routeGpx(route, points = [], { name = null, kinds = null, nameOf = (s) => s.kind } = {}) {
  const stops = stopsOf(points, { kinds }).map((s) => ({ ...s, name: s.name || nameOf(s) }));
  return gpxString({ name: name || route?.name || 'Route', line: route?.line ?? [], stops });
}
