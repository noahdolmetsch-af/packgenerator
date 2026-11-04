/**
 * «Warum zählt das?» (Noah 04.11.2026 «1a 2a 3a …», Entdecken und Sammeln, Idee 6 «Nachvollziehbare
 * Anerkennung»): for a place the app found on your route, show WHERE: the line of the day, the place, the
 * closest point of the line and the distance. Pure functions (no database, no screen), tested in
 * tests/neuland-beleg.test.js. The detection itself (detect() in neuland.js) is not changed.
 *
 * proofOf() takes the finding of the app (found[cid][id]: day, tripId, rideId), the item with its place
 * and the tracks (tracksOf()) and answers: which track made the finding, how close the line came, the
 * piece of line around the place for the little map, and whether the hit is «clear» or «close».
 */
import { segKm, km } from './geo.js';
import { ADDED_RADIUS, OWN_RADIUS, isBuiltIn } from './neuland.js';

const RAD = Math.PI / 180;

/** The zone of a point item in km: what detect() uses (radius of its collection plus the lake point's own radius). */
export function reachOf(coll, item) {
  const radius = coll?.radius ?? (isBuiltIn(coll?.id) ? ADDED_RADIUS : OWN_RADIUS);
  return radius + (item?.r ?? 0);
}

/** Closest point of the segment a–b to p (all [lat, lon]) in a flat local projection: { km, at: [lat, lon] }. */
function nearestOnSegment(p, a, b) {
  const k = Math.cos(p[0] * RAD);
  const ax = (a[1] - p[1]) * k, ay = a[0] - p[0];
  const bx = (b[1] - p[1]) * k, by = b[0] - p[0];
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? -(ax * dx + ay * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx, y = ay + t * dy;
  return { km: Math.sqrt(x * x + y * y) * 111.195, at: [p[0] + y, p[1] + x / k], seg: t };
}

/** The point of a line [[lat, lon], …] closest to p: { km, at, index } (index = the segment's start), or null. */
export function nearestOnLine(p, line) {
  if (!line?.length) return null;
  if (line.length === 1) return { km: km(p, line[0]), at: line[0], index: 0 };
  let best = null;
  for (let i = 1; i < line.length; i++) {
    const n = nearestOnSegment(p, line[i - 1], line[i]);
    if (!best || n.km < best.km) best = { km: n.km, at: n.at, index: i - 1 };
  }
  return best;
}

/**
 * Which tracks could have made a finding: the ones of its day that match its trip or ride; when none does,
 * those of the day; when still none, all of them (an old finding whose line changed since).
 */
export function candidateTracks(found, tracks = []) {
  if (!found?.day) return [];
  const day = tracks.filter((t) => t.day === found.day);
  const exact = day.filter((t) => (found.tripId ? t.tripId === found.tripId : true) && (found.rideId ? t.rideId === found.rideId : true));
  return exact.length ? exact : day.length ? day : tracks;
}

/** A hit within this share of the zone is «clear»; further out (towards the edge) it is «close». */
export const CLEAR_SHARE = 0.5;

/** Extra metres of line shown on each side of the closest point. */
const WINDOW_MIN_KM = 0.4;

/**
 * The proof of one finding. found: found[cid][id] of computeFrom() ({ day, tripId, rideId }); item: a point
 * item { lat, lon } ; reachKm: reachOf(); tracks: tracksOf().
 * → null (no point, no finding or no line), or
 *   { src, day, tripId, rideId, thin, distM, reachM, level: 'clear'|'close', at: [lat, lon],
 *     spot: [lat, lon], pieces: [[[lat, lon], …], …] }   pieces: the parts of the line near the place
 * thin: only a start or end place counted, not a line of several points.
 */
export function proofOf(found, item, reachKm, tracks) {
  if (!found?.day || !Number.isFinite(item?.lat) || !Number.isFinite(item?.lon)) return null;
  const spot = [item.lat, item.lon];
  let best = null;
  for (const tr of candidateTracks(found, tracks)) {
    const n = nearestOnLine(spot, tr.pts);
    if (n && (!best || n.km < best.n.km)) best = { tr, n };
  }
  if (!best) return null;
  const { tr, n } = best;
  const span = Math.max(WINDOW_MIN_KM, n.km * 2.2, reachKm * 1.6);
  const pieces = [];
  let cur = null;
  for (let i = 1; i < tr.pts.length; i++) {
    const near = segKm(spot, tr.pts[i - 1], tr.pts[i]) <= span * 1.5;
    if (near) {
      if (!cur) pieces.push((cur = [tr.pts[i - 1]]));
      cur.push(tr.pts[i]);
    } else cur = null;
  }
  if (!pieces.length && tr.pts.length === 1) pieces.push([tr.pts[0]]);
  return {
    src: tr.src,
    day: tr.day,
    tripId: tr.tripId ?? null,
    rideId: tr.rideId ?? null,
    thin: tr.pts.length < 3,
    distM: Math.round(n.km * 1000),
    reachM: Math.round(reachKm * 1000),
    level: n.km <= reachKm * CLEAR_SHARE ? 'clear' : 'close',
    at: n.at,
    spot,
    span,
    pieces,
  };
}

/**
 * The little map: the proof drawn in a box of w × h. Flat projection around the place, north up.
 * → { w, h, k (px per km), pieces: ['M x y L x y …'], spot: [x, y], at: [x, y], zone (px radius), bar: { px, m } }
 */
export function mapOf(proof, w = 300, h = 200) {
  const [lat0, lon0] = proof.spot;
  const c = Math.cos(lat0 * RAD);
  const half = Math.max(proof.span, proof.reachM / 1000 * 1.3);
  const k = Math.min(w / 2, h / 2) / half; // the shorter side shows `half` km each way
  const xy = (p) => [+(w / 2 + (p[1] - lon0) * c * 111.195 * k).toFixed(1), +(h / 2 - (p[0] - lat0) * 111.195 * k).toFixed(1)];
  const pieces = proof.pieces.map((pc) => pc.map(xy).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '));
  // a scale bar of a round length, at most 40 % of the width
  const room = (w * 0.4) / k; // km
  const steps = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  const len = [...steps].reverse().find((s) => s <= room) ?? steps[0];
  return { w, h, k, pieces, spot: xy(proof.spot), at: xy(proof.at), zone: +((proof.reachM / 1000) * k).toFixed(1), bar: { px: +(len * k).toFixed(1), m: Math.round(len * 1000) } };
}
