/**
 * The map of the tour suggestions (Noah 23.11.2026 «die karte unbedingt 1:1 so übernehmen»): Switzerland in a 1440 × 900 frame
 * (data/kantone.js, scripts/vorschlaege/build-kantone.py). A point [lat, lon] goes into the same frame with the Swiss grid (LV95,
 * the approximate formulas of swisstopo, good to about one metre), E 2480000 and N 1070000 at the lower left, the same scale on both
 * axes. Pure functions, tested in tests/vorschlaege.test.js.
 */
export const FRAME = { w: 1440, h: 900, e0: 2480000, n1: 1070000, scale: Math.min(1440 / 360000, 900 / 230000) };

/** [lat, lon] (WGS84) → [E, N] in the Swiss grid LV95. */
export function lv95(lat, lon) {
  const p = (lat * 3600 - 169028.66) / 10000;
  const l = (lon * 3600 - 26782.5) / 10000;
  const e = 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3;
  const n = 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p ** 3;
  return [e, n];
}

/** [lat, lon] → [x, y] in the frame (one decimal). */
export function toXY(pt) {
  const [e, n] = lv95(pt[0], pt[1]);
  return [Math.round((e - FRAME.e0) * FRAME.scale * 10) / 10, Math.round((FRAME.h - (n - FRAME.n1) * FRAME.scale) * 10) / 10];
}

/** The SVG path of a line [[lat, lon], …]. */
export const pathOf = (line = []) => line.map((p, i) => `${i ? 'L' : 'M'}${toXY(p).join(' ')}`).join('');

/** Zurich main station in the frame. */
export const ZURICH = toXY([47.3779, 8.5403]);

/** Tours per canton: { zh: 2, … }. */
export const countBy = (tours = []) => tours.reduce((a, t) => ({ ...a, [t.region]: (a[t.region] ?? 0) + 1 }), {});

/** The drawing sizes (frame units) for a map shown k times the frame size: dots, lines and text stay readable. */
export function sizes(k) {
  const s = Math.max(0.2, Math.min(1, k || 1));
  return { dot: Math.max(5, 7 / s), line: Math.max(2, 1.6 / s), font: Math.max(13, 12 / s), pad: Math.max(14, 16 / s) };
}
