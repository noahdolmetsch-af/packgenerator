/**
 * «Verschiedene Wege zum selben Ziel» (Noah 04.11.2026 «1a 2a 3a 4b 5a», Entdecken und Sammeln, Idee 3):
 * for a place, every day your line passed it, from which SIDE you came (north, east, south, west) and with
 * which sport. Pure functions (no database, no screen), tested in tests/neuland-wege.test.js.
 *
 * The side is not stored: it is worked out from the line each time, so nothing can go out of date and
 * nothing is counted or changed by it. The ground («Untergrund») is a separate step (OpenStreetMap).
 */
import { km, lineBox } from './geo.js';
import { nearestOnLine } from './beleg.js';
import { TYPE_NAMES } from '../training.js';

export const SIDES = ['N', 'E', 'S', 'W'];
/** The line is followed back from the closest point until it is this far along ... */
export const APPROACH_KM = 3;
/** ... a line that began nearer than this has no approach to judge (you started here). */
export const MIN_APPROACH_KM = 1.5;
/** An approach that ends closer to the place than this went in a loop; no side. */
const LOOP_KM = 1;
const RAD = Math.PI / 180;

/** Compass bearing in degrees (0 = north, 90 = east) from a to b, both [lat, lon]. */
export function bearing(a, b) {
  const dx = (b[1] - a[1]) * Math.cos(a[0] * RAD);
  const dy = b[0] - a[0];
  return ((Math.atan2(dx, dy) / RAD) + 360) % 360;
}

/** The side a bearing belongs to: N from 315° to 45°, E to 135°, S to 225°, W to 315°. */
export const sideOfBearing = (deg) => SIDES[Math.floor(((deg + 45) % 360) / 90)];

/**
 * The run-up: follow the line back from its closest point to the place until it is APPROACH_KM along.
 * place [lat, lon]; pts the line; near = nearestOnLine().
 * → { side: 'N' | 'E' | 'S' | 'W', run: [[lat, lon], …] (the run-up in riding order, ending at the closest point) },
 *   or null (a line without a run-up, a loop, a start or end place only).
 */
export function approachOf(place, pts, near) {
  if (!near || !pts || pts.length < 3) return null;
  let at = Math.min(near.index, pts.length - 1);
  let acc = km(near.at, pts[at]);
  const run = [near.at, pts[at]];
  while (at > 0 && acc < APPROACH_KM) {
    acc += km(pts[at], pts[at - 1]);
    at--;
    run.push(pts[at]);
  }
  const from = run[run.length - 1];
  if (acc < MIN_APPROACH_KM || km(place, from) < LOOP_KM) return null;
  return { side: sideOfBearing(bearing(place, from)), run: run.reverse() };
}

/** The side you came from: 'N' | 'E' | 'S' | 'W' | null (see approachOf). */
export const approachSide = (place, pts, near) => approachOf(place, pts, near)?.side ?? null;

const sideRun = (a) => ({ side: a?.side ?? null, run: a?.run ?? null });

/**
 * Every day a line passed within reachKm of the place. place { lat, lon }; tracks tracksOf().
 * → [{ day, tripId, rideId, src, type, distM, side, run }] (run: the run-up as a line, for the ground lookup), the newest day first; one entry per day
 * (a trip route and the Strava ride of the same day count once, the one that knows its sport wins).
 */
export function waysOf(place, reachKm, tracks = []) {
  if (!Number.isFinite(place?.lat) || !Number.isFinite(place?.lon)) return [];
  const spot = [place.lat, place.lon];
  const padLat = (reachKm * 1.2) / 111 + 0.001;
  const padLon = padLat / Math.max(0.2, Math.cos(place.lat * RAD));
  const byDay = new Map();
  for (const tr of tracks) {
    if (!tr?.pts?.length) continue;
    const b = lineBox(tr.pts);
    if (place.lat < b[0] - padLat || place.lat > b[2] + padLat || place.lon < b[1] - padLon || place.lon > b[3] + padLon) continue;
    const n = nearestOnLine(spot, tr.pts);
    if (!n || n.km > reachKm) continue;
    const way = { day: tr.day, tripId: tr.tripId ?? null, rideId: tr.rideId ?? null, src: tr.src, type: tr.type || null, distM: Math.round(n.km * 1000), ...sideRun(approachOf(spot, tr.pts, n)) };
    const cur = byDay.get(tr.day);
    if (!cur) byDay.set(tr.day, way);
    else {
      const best = cur.type || !way.type ? cur : way;
      const other = best === cur ? way : cur;
      byDay.set(tr.day, { ...best, side: best.side ?? other.side, run: best.run ?? other.run });
    }
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/**
 * The ways sorted by side. → { rows: [{ side, n, last, ways }], unknown (days with no side to judge),
 * missing: the sides not yet used (only when at least one side is known), total }
 */
export function sidesOf(ways = []) {
  const rows = SIDES.map((side) => {
    const w = ways.filter((x) => x.side === side);
    return { side, n: w.length, last: w[0]?.day ?? null, ways: w };
  }).filter((r) => r.n);
  const unknown = ways.filter((w) => !w.side).length;
  return { rows, unknown, missing: rows.length ? SIDES.filter((s) => !rows.some((r) => r.side === s)) : [], total: ways.length };
}

/** The sports of the ways, most used first. → [{ key (a word for t()), n }]; ways without a known sport are left out. */
export function sportsOf(ways = []) {
  const count = new Map();
  for (const w of ways) {
    if (!w.type) continue;
    const key = TYPE_NAMES[w.type] ?? 'Other|kind';
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  return [...count].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
}
