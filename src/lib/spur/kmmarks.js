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
