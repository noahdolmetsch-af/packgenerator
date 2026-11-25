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

/**
 * The drawing sizes (frame units) for a map shown k times the frame size. Dots, lines and text keep the same size on the screen,
 * whether the whole country or one canton fills the map (Noah 25.11.2026 «die Punkte sind viel zu gross, gerade auf dem Handy»):
 * a dot is about 3 px wide in radius, so that 600 starts still can be told apart on a phone.
 */
export function sizes(k) {
  const s = Math.max(0.2, Math.min(4, k || 1));
  return { dot: 3.2 / s, hit: 8 / s, line: 1.4 / s, font: 12.5 / s, pad: 16 / s };
}

/**
 * The part of the frame to show when cantons are chosen (Noah 25.11.2026): the box around their outlines with some room, in the
 * shape of the frame (so the map keeps its height). No canton chosen, or none with an outline: the whole frame.
 * paths: { key: 'M x y L x y …' }. Returns { x, y, w, h } in frame units.
 */
export function viewOf(paths, keys = [], frame = { w: FRAME.w, h: FRAME.h }, pad = 28) {
  const whole = { x: 0, y: 0, w: frame.w, h: frame.h };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const k of keys) {
    const nums = (paths?.[k] ?? '').match(/-?\d+(?:\.\d+)?/g);
    if (!nums) continue;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = +nums[i], y = +nums[i + 1];
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  if (!Number.isFinite(x0)) return whole;
  let w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
  const ratio = frame.w / frame.h;
  if (w / h < ratio) w = h * ratio;
  else h = w / ratio;
  w = Math.min(w, frame.w);
  h = Math.min(h, frame.h);
  const x = Math.max(0, Math.min(frame.w - w, (x0 + x1) / 2 - w / 2));
  const y = Math.max(0, Math.min(frame.h - h, (y0 + y1) / 2 - h / 2));
  return { x, y, w, h };
}

/** The size of the hover card (px): the card is as wide as this at most and about this high. */
export const TIP = { w: 232, h: 132, gap: 14 };

/**
 * Where the hover card of a dot goes, in px inside the map: above the dot, in the middle of it, pushed back into the map on the left and right,
 * and below the dot when there is no room above. dot: [x, y] in px; box: [width, height] of the drawn map in px.
 */
export function tipPos(dot, box, tip = TIP) {
  const w = Math.min(tip.w, Math.max(120, box[0] - 8));
  const left = Math.max(4, Math.min(box[0] - w - 4, dot[0] - w / 2));
  const above = dot[1] - tip.gap - tip.h >= 4;
  const top = above ? dot[1] - tip.gap - tip.h : Math.min(box[1] - tip.h - 4, dot[1] + tip.gap);
  return { left: Math.round(left), top: Math.round(Math.max(4, top)), width: w, below: !above };
}
