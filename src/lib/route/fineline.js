/**
 * Strecke genau (Noah 27.10.2026 «die Punkte auf der Karte sind noch sehr ungenau»): a route line that keeps
 * its bends. Douglas–Peucker with a tolerance of about 5 m (in windows, no recursion, so a 50 000-point file
 * is fine), then at most max points evenly spread. Used for the live route and for every trip route
 * (route.js routeStats); before, a trip route kept only 200 evenly picked points (one every 560 m on 112 km).
 * Plain module without imports.
 */
export const FINE_MAX = 3000;
export const FINE_TOLERANCE_M = 5;
const CHUNK = 400;
const round = (v) => Math.round(v * 1e5) / 1e5;
const pair = (p) => (Array.isArray(p) ? { lat: Number(p[0]), lon: Number(p[1]) } : { lat: Number(p?.lat), lon: Number(p?.lon) });
const okPt = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;

/** Distance (m) of p from the segment a–b in a flat local frame (good enough for metres). */
function offM(p, a, b) {
  const k = Math.cos((a.lat * Math.PI) / 180) * 111320;
  const ax = a.lon * k;
  const ay = a.lat * 110540;
  const bx = b.lon * k - ax;
  const by = b.lat * 110540 - ay;
  const px = p.lon * k - ax;
  const py = p.lat * 110540 - ay;
  const len = bx * bx + by * by;
  const f = len ? Math.max(0, Math.min(1, (px * bx + py * by) / len)) : 0;
  return Math.hypot(px - bx * f, py - by * f);
}

/**
 * The line to keep: Douglas–Peucker with toleranceM (no recursion, so a 50 000-point file is fine),
 * then at most max points evenly spread (first and last kept). points: [{ lat, lon }] or [[lat, lon]].
 * → [[lat, lon], …] rounded to 1 m.
 */
export function fineLine(points = [], max = FINE_MAX, toleranceM = FINE_TOLERANCE_M) {
  const pts = points.map(pair).filter(okPt);
  if (pts.length <= 2) return pts.map((p) => [round(p.lat), round(p.lon)]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  // in windows of CHUNK points (their ends kept): a zig-zag track would make one pass over all points
  // quadratic and hang a phone; this way it stays about n × CHUNK
  const stack = [];
  for (let s = 0; s < pts.length - 1; s += CHUNK) {
    const e = Math.min(pts.length - 1, s + CHUNK);
    keep[s] = keep[e] = 1;
    stack.push([s, e]);
  }
  while (stack.length) {
    const [s, e] = stack.pop();
    let best = -1;
    let at = -1;
    for (let i = s + 1; i < e; i++) {
      const d = offM(pts[i], pts[s], pts[e]);
      if (d > best) (best = d), (at = i);
    }
    if (best > toleranceM && at > 0) {
      keep[at] = 1;
      stack.push([s, at], [at, e]);
    }
  }
  let out = pts.filter((_, i) => keep[i]);
  if (out.length > max) {
    const step = (out.length - 1) / (max - 1);
    out = Array.from({ length: max }, (_, i) => out[Math.round(i * step)]);
  }
  return out.map((p) => [round(p.lat), round(p.lon)]);
}

