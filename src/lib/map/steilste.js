/**
 * The steepest pieces of a route (Noah 23.11.2026 «1-5a»: «Die steilsten Stücke» ab 12 %), for every page with a height profile.
 * Pure, no imports. `route` = { ele: [m…] evenly spread over the length, km }; tests in tests/vorschlaege.test.js.
 */

/** A piece counts as steep from this many percent (Noah «1-5a», 2a: for mountain bikes). */
export const STEEP_PCT = 12;
/** How many steep pieces the list shows. */
export const STEEP_COUNT = 3;

/** A piece is judged over windows of about this many metres, so one wrong height does not make a «steep piece». */
export const WINDOW_M = 250;

/**
 * The steep pieces: stretches whose gradient over about 250 m is at least `minPct` percent, each { fromKm, toKm, lenM, avg, max, up }
 * with the average and highest gradient in percent and the metres climbed; the steepest `count` first (by average, then by length).
 * Only climbs count (you push or you ride up); a downhill is no steep piece.
 */
export function steepest(t, { minPct = STEEP_PCT, count = STEEP_COUNT } = {}) {
  const ele = t?.ele ?? [];
  if (ele.length < 3 || !(t.km > 0)) return [];
  const step = t.km / (ele.length - 1); // km per sample
  const w = Math.max(2, Math.round(WINDOW_M / (step * 1000)));
  const runs = [];
  for (let i = 0; i + w < ele.length; i++) {
    const pct = ((ele[i + w] - ele[i]) / (w * step * 1000)) * 100;
    if (pct < minPct) continue;
    const last = runs.at(-1);
    if (last && i <= last.to) {
      last.to = i + w;
      last.max = Math.max(last.max, pct);
      if (pct > last.best.pct) last.best = { from: i, to: i + w, pct };
    } else runs.push({ from: i, to: i + w, max: pct, best: { from: i, to: i + w, pct } });
  }
  return runs
    .map((r) => {
      // joined windows whose average falls under the limit (a steep bit, a flat bit, a steep bit) keep only their steepest window
      if ((ele[r.to] - ele[r.from]) / ((r.to - r.from) * step * 1000) < minPct / 100) r = { ...r, from: r.best.from, to: r.best.to };
      const up = ele[r.to] - ele[r.from];
      const lenM = (r.to - r.from) * step * 1000;
      return { fromKm: round(r.from * step, 100), toKm: round(r.to * step, 100), lenM: Math.round(lenM), avg: Math.round((up / lenM) * 1000) / 10, max: Math.max(Math.round(r.max * 10) / 10, Math.round((up / lenM) * 1000) / 10), up: Math.round(up) };
    })
    .sort((a, b) => b.avg - a.avg || b.lenM - a.lenM)
    .slice(0, count);
}
const round = (v, k) => Math.round(v * k) / k;

/** The points of the line between two km (for the dark stretch on the map): `pts` [[lat, lon]…], km along the line, `scale` = line km ÷ tour km. */
export function stretchOf(pts = [], fromKm, toKm, pointAt, scale = 1) {
  const a = fromKm * scale;
  const b = toKm * scale;
  const out = [pointAt(pts, a)];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const leg = legKmOf(pts[i - 1], pts[i]);
    run += leg;
    if (run > a && run < b) out.push(pts[i]);
  }
  out.push(pointAt(pts, b));
  return out.filter(Boolean);
}
const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
function legKmOf(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
