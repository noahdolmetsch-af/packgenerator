/**
 * Km marks along a tour line (Noah 23.11.2026, tour suggestions: «die tourlinie … kaum zu erkennen»): a small number every `step` km,
 * so you see how far you are on the line. pts: [[lat, lon], …]. → [{ km, pos: [lat, lon] }], the point that first passes each mark.
 */
const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
function legKm(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** The step that fits the length: 1 km under 8 km, 5 km under 30 km, 10 km under 100 km, else 20 km. */
export const stepFor = (km) => (km < 8 ? 1 : km < 30 ? 5 : km < 100 ? 10 : 20);

export function kmMarks(pts = [], step = null) {
  if (!Array.isArray(pts) || pts.length < 2) return [];
  let total = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push((total += legKm(pts[i - 1], pts[i])));
  const s = step ?? stepFor(total);
  const out = [];
  let next = s;
  for (let i = 1; i < pts.length && next < total - s / 3; i++) {
    while (cum[i] >= next && next < total - s / 3) {
      out.push({ km: next, pos: pts[i] });
      next += s;
    }
  }
  return out;
}

/** The length of the line in km (haversine, leg by leg). */
export function lineKm(pts = []) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += legKm(pts[i - 1], pts[i]);
  return total;
}

/** The point at `km` along the line, straight between the two points it lies between; null for no line. */
export function pointAtKm(pts = [], km = 0) {
  if (!Array.isArray(pts) || !pts.length) return null;
  if (pts.length === 1 || km <= 0) return pts[0];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const leg = legKm(pts[i - 1], pts[i]);
    if (run + leg >= km) {
      const f = leg > 0 ? (km - run) / leg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    }
    run += leg;
  }
  return pts.at(-1);
}

/**
 * The km along the line of the point of the line nearest to `pos` ([lat, lon]), with the distance to it in km:
 * { km, away }. The nearest point lies on a stretch between two points (flat plane around the place). null for no line.
 */
export function nearestOnLine(pts = [], pos) {
  if (!Array.isArray(pts) || pts.length < 2 || !pos) return null;
  const k = Math.cos(rad(pos[0]));
  const px = (p) => [(p[1] - pos[1]) * k * 111.32, (p[0] - pos[0]) * 110.57];
  let best = null;
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const leg = legKm(pts[i - 1], pts[i]);
    const [ax, ay] = px(pts[i - 1]);
    const [bx, by] = px(pts[i]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const f = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const away = Math.hypot(ax + dx * f, ay + dy * f);
    if (!best || away < best.away) best = { km: run + leg * f, away };
    run += leg;
  }
  return best;
}
