/**
 * Paket U2 «Feines Höhenprofil» (Noah 19.10.2026 «detailierteres profil für das höhenprofil bitte. sonst
 * bringt es nichts. es muss zoombar sein … analog zu komoot routenplaner»).
 *
 * Next to the coarse profile ([[km, m]], ≤ 800 points, used by the plan sums) a route keeps a fine one:
 *   route.profileFine = { v: 1, step: 0.1, km: 1004.3, d: [h0, h1 − h0, h2 − h1, …] }
 * Heights every `step` km (whole metres), stored as differences so the JSON stays small (it lives in the
 * settings record and so in the backup and the sync). The step grows with the length: at most FINE_MAX
 * points, so a 1000 km route has 100 m steps and stays well under 80 KB.
 *
 * Built on the GPX import from the raw track points: resampled every 10 m, a moving median over 50 m
 * (takes out GPS and elevation-model spikes), then the mean over each step (light smoothing). The climbing
 * then stays close to what the 3 m threshold of route.js counts.
 *
 * Pure functions (no browser), tested in tests/fineprofile.test.js. Everything that reads a profile here
 * takes the encoded form, a decoded one (decode) or falls back to a coarse [[km, m]] profile (fineOf).
 */
// haversine (the same as route.js; kept here so route.js can import this module without a loop)
function distKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** The steps a fine profile may use (km) and the most points it keeps. */
export const FINE_STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1];
export const FINE_MAX = 12000;
/** The step for a route of km: the finest that keeps at most FINE_MAX points. */
export const stepFor = (km) => FINE_STEPS.find((s) => (Number(km) || 0) / s <= FINE_MAX) ?? FINE_STEPS.at(-1);

const GRID = 0.01; // the resampling grid before the median (10 m)
const MEDIAN = 5; // points of the moving median (5 × 10 m ≈ 50 m)

/* ---------- build, encode, decode ---------- */

/**
 * The raw track points ([{ lat, lon, ele }], ele may be null) → the encoded fine profile, or null when
 * fewer than two points have a height. opts.step forces a step (tests).
 */
export function buildFine(points = [], opts = {}) {
  const ks = [];
  const es = [];
  let km = 0;
  for (let i = 0; i < points.length; i++) {
    if (i) km += distKm(points[i - 1], points[i]);
    const e = points[i]?.ele;
    if (e != null && Number.isFinite(Number(e))) ks.push(km), es.push(Number(e));
  }
  if (es.length < 2) return null;
  return fineFromSeries(ks, es, km, opts);
}

/**
 * Heights at known km (ks ascending, es the heights) → the encoded fine profile (resample, median, mean).
 * total: the length of the route (default: the last km).
 */
export function fineFromSeries(ks, es, total = ks.at(-1), opts = {}) {
  if (!ks?.length || ks.length !== es.length) return null;
  const len = Math.max(0, Number(total) || 0);
  const step = opts.step ?? stepFor(len);
  // 1. every 10 m, straight between the known points
  const n = Math.max(2, Math.floor(len / GRID) + 1);
  const g = new Float64Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const k = i * GRID;
    while (j < ks.length - 2 && ks[j + 1] < k) j++;
    const [a, b] = [ks[j], ks[Math.min(j + 1, ks.length - 1)]];
    const [ha, hb] = [es[j], es[Math.min(j + 1, ks.length - 1)]];
    g[i] = k <= a ? ha : k >= b ? hb : ha + ((hb - ha) * (k - a)) / (b - a || 1);
  }
  // 2. the moving median over 50 m
  const med = new Float64Array(n);
  const half = Math.floor(MEDIAN / 2);
  const win = [];
  for (let i = 0; i < n; i++) {
    win.length = 0;
    for (let w = Math.max(0, i - half); w <= Math.min(n - 1, i + half); w++) win.push(g[w]);
    win.sort((x, y) => x - y);
    med[i] = win[Math.floor(win.length / 2)];
  }
  // 3. the mean over each step (centred), whole metres
  const out = Math.max(2, Math.floor(len / step + 1e-9) + 1);
  const per = step / GRID;
  const m = new Array(out);
  for (let i = 0; i < out; i++) {
    const c = i * per;
    const lo = Math.max(0, Math.round(c - per / 2));
    const hi = Math.min(n - 1, Math.round(c + per / 2));
    let s = 0;
    for (let w = lo; w <= hi; w++) s += med[w];
    m[i] = Math.round(s / (hi - lo + 1));
  }
  return encode(m, step, len);
}

/** Heights every step km → the stored form { v: 1, step, km, d } (d: first height, then differences). */
export function encode(heights = [], step = 0.1, km = (heights.length - 1) * step) {
  const d = new Array(heights.length);
  let prev = 0;
  for (let i = 0; i < heights.length; i++) {
    const h = Math.round(Number(heights[i]) || 0);
    d[i] = i ? h - prev : h;
    prev = h;
  }
  return { v: 1, step, km: Math.round(km * 100) / 100, d };
}

/** Is this a usable stored (or decoded) fine profile? */
export const isFine = (f) => !!f && Number(f.step) > 0 && ((Array.isArray(f.d) && f.d.length > 1) || (f.m?.length > 1 && f.decoded));

const cache = new WeakMap();
/**
 * The stored form → { decoded: true, step, km, n, m: Float64Array, coarse }. Cached per object, so a page
 * can call it on every draw. A decoded profile passes through.
 */
export function decode(f) {
  if (!f) return null;
  if (f.decoded) return f;
  if (cache.has(f)) return cache.get(f);
  if (!isFine(f)) return null;
  const m = new Float64Array(f.d.length);
  let h = 0;
  for (let i = 0; i < f.d.length; i++) (h += Number(f.d[i]) || 0), (m[i] = h);
  const out = { decoded: true, step: Number(f.step), km: Math.max(Number(f.km) || 0, (m.length - 1) * f.step), n: m.length, m, coarse: false };
  cache.set(f, out);
  return out;
}

/**
 * The profile to draw: the fine one when there is one, else the coarse [[km, m]] profile resampled
 * (marked coarse: its gradients are straight lines between far points). null without heights.
 */
export function fineOf(fine, profile = []) {
  const d = decode(fine);
  if (d) return d;
  const p = (profile ?? []).filter((x) => Array.isArray(x) && Number.isFinite(x[0]) && Number.isFinite(x[1]));
  if (p.length < 2) return null;
  if (cache.has(profile)) return cache.get(profile);
  const total = p.at(-1)[0];
  const step = Math.max(0.05, stepFor(total));
  const n = Math.max(2, Math.floor(total / step + 1e-9) + 1);
  const m = new Float64Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const k = i * step;
    while (j < p.length - 2 && p[j + 1][0] < k) j++;
    const [a, b] = [p[j], p[Math.min(j + 1, p.length - 1)]];
    m[i] = k <= a[0] ? a[1] : k >= b[0] ? b[1] : a[1] + ((b[1] - a[1]) * (k - a[0])) / (b[0] - a[0] || 1);
  }
  const out = { decoded: true, step, km: total, n, m, coarse: true };
  cache.set(profile, out);
  return out;
}

/** The fine profile as [[km, m]] (for code that reads the coarse form, e.g. the climbs). */
export function toProfile(fine) {
  const f = decode(fine);
  if (!f) return [];
  return Array.from(f.m, (h, i) => [Math.round(Math.min(f.km, i * f.step) * 1000) / 1000, Math.round(h)]);
}

/** A coarse [[km, m]] profile of at most n points taken from the fine one (keeps both ends). */
export function coarseOf(fine, n = 800) {
  const all = toProfile(fine);
  if (all.length <= n) return all;
  return Array.from({ length: n }, (_, i) => all[Math.round((i * (all.length - 1)) / (n - 1))]);
}

/* ---------- reading ---------- */

const clampKm = (f, km) => Math.max(0, Math.min(f.km, Number(km) || 0));

/** The height at km (straight between the steps); null without a profile. */
export function heightAt(fine, km) {
  const f = decode(fine);
  if (!f) return null;
  const x = clampKm(f, km) / f.step;
  const i = Math.min(f.n - 1, Math.floor(x));
  if (i >= f.n - 1) return f.m[f.n - 1];
  return f.m[i] + (f.m[i + 1] - f.m[i]) * (x - i);
}

/** The gradient in % over len km around km (the 100 m there), one decimal. */
export function gradeAt(fine, km, len = 0.1) {
  const f = decode(fine);
  if (!f) return 0;
  let a = clampKm(f, km - len / 2);
  let b = Math.min(f.km, a + len);
  if (b - a < len) a = Math.max(0, b - len);
  if (!(b > a)) return 0;
  return Math.round(((heightAt(f, b) - heightAt(f, a)) / ((b - a) * 1000)) * 1000) / 10;
}

/**
 * The points to draw from fromKm to toKm: at most maxPoints [{ km, m }]. When the stretch has more steps,
 * each bucket keeps its lowest and highest point in their order, so a peak never disappears when zoomed
 * out. The first and last point lie exactly on fromKm and toKm.
 */
export function slice(fine, fromKm = 0, toKm = Infinity, maxPoints = 400) {
  const f = decode(fine);
  if (!f) return [];
  const a = clampKm(f, fromKm);
  const b = clampKm(f, Math.min(toKm, f.km));
  if (!(b > a)) return [{ km: a, m: heightAt(f, a) }];
  const i0 = Math.ceil(a / f.step - 1e-9);
  const i1 = Math.floor(b / f.step + 1e-9);
  const inner = [];
  for (let i = i0; i <= i1; i++) {
    const k = i * f.step;
    if (k > a && k < b) inner.push(i);
  }
  const out = [{ km: a, m: heightAt(f, a) }];
  const room = Math.max(2, maxPoints - 2);
  if (inner.length <= room) {
    for (const i of inner) out.push({ km: i * f.step, m: f.m[i] });
  } else {
    const buckets = Math.max(1, Math.floor(room / 2));
    const per = inner.length / buckets;
    for (let k = 0; k < buckets; k++) {
      const s = Math.floor(k * per);
      const e = Math.min(inner.length, Math.floor((k + 1) * per));
      if (e <= s) continue;
      let lo = inner[s];
      let hi = inner[s];
      for (let q = s + 1; q < e; q++) {
        const i = inner[q];
        if (f.m[i] < f.m[lo]) lo = i;
        if (f.m[i] > f.m[hi]) hi = i;
      }
      for (const i of lo === hi ? [lo] : lo < hi ? [lo, hi] : [hi, lo]) out.push({ km: i * f.step, m: f.m[i] });
    }
  }
  out.push({ km: b, m: heightAt(f, b) });
  return out;
}

/** Lowest and highest point from fromKm to toKm: { lo, loKm, hi, hiKm }. */
export function rangeOf(fine, fromKm = 0, toKm = Infinity) {
  const f = decode(fine);
  if (!f) return null;
  const pts = slice(f, fromKm, toKm, Infinity);
  let lo = pts[0];
  let hi = pts[0];
  for (const p of pts) {
    if (p.m < lo.m) lo = p;
    if (p.m > hi.m) hi = p;
  }
  return { lo: Math.round(lo.m), loKm: lo.km, hi: Math.round(hi.m), hiKm: hi.km };
}

/** Metres up and down from fromKm to toKm (every step counts; the fine profile is smoothed already). */
export function gainOf(fine, fromKm = 0, toKm = Infinity) {
  const f = decode(fine);
  if (!f) return { up: 0, down: 0 };
  const pts = slice(f, fromKm, toKm, Infinity);
  let up = 0;
  let down = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].m - pts[i - 1].m;
    if (d > 0) up += d;
    else down -= d;
  }
  return { up: Math.round(up), down: Math.round(down) };
}

/** Climbing counted like route.js (3 m threshold) over the whole fine profile: { gain, loss }. */
export function climbOf(fine, threshold = 3) {
  const f = decode(fine);
  if (!f) return { gain: 0, loss: 0 };
  let gain = 0;
  let loss = 0;
  let ref = f.m[0];
  for (let i = 1; i < f.n; i++) {
    const d = f.m[i] - ref;
    if (d >= threshold) (gain += d), (ref = f.m[i]);
    else if (d <= -threshold) (loss -= d), (ref = f.m[i]);
  }
  return { gain: Math.round(gain), loss: Math.round(loss) };
}

/* ---------- steepness like komoot ---------- */

/**
 * The steepness classes of the drawing. Up: under 3, 3–6, 6–9, 9–12, 12–15, over 15 %; down in three
 * shades (3–6, 6–12, over 12 %). `token` is the CSS custom property ProfileStrip defines for it (with the
 * same value as `colour`, which the map uses: maplibre cannot read CSS).
 */
export const STEEPNESS = [
  { key: 'd3', min: -Infinity, max: -12, name: 'down, over 12 %', token: '--ps-d3', colour: '#4d7fb4' },
  { key: 'd2', min: -12, max: -6, name: 'down, 6–12 %', token: '--ps-d2', colour: '#8fb6dd' },
  { key: 'd1', min: -6, max: -3, name: 'down, 3–6 %', token: '--ps-d1', colour: '#c4dbef' },
  { key: 'u0', min: -3, max: 3, name: 'flat, under 3 %', token: '--ps-u0', colour: '#bcd9b0' },
  { key: 'u1', min: 3, max: 6, name: '3–6 %', token: '--ps-u1', colour: '#e9d46c' },
  { key: 'u2', min: 6, max: 9, name: '6–9 %', token: '--ps-u2', colour: '#f0a33c' },
  { key: 'u3', min: 9, max: 12, name: '9–12 %', token: '--ps-u3', colour: '#e2692c' },
  { key: 'u4', min: 12, max: 15, name: '12–15 %', token: '--ps-u4', colour: '#c8331f' },
  { key: 'u5', min: 15, max: Infinity, name: 'over 15 %', token: '--ps-u5', colour: '#7c1b12' },
];
export const steepKey = (pct) => STEEPNESS.find((s) => pct < s.max)?.key ?? 'u5';

/** A nice length for the coloured pieces: about `parts` pieces in the stretch, never finer than a step. */
export function segKmFor(fine, fromKm, toKm, parts = 160) {
  const f = decode(fine);
  const span = Math.max(0, toKm - fromKm);
  const raw = Math.max(f?.step ?? 0.1, span / parts);
  return niceStep(raw);
}

/** The pieces from fromKm to toKm with their gradient and class: [{ fromKm, toKm, pct, key }]. */
export function segments(fine, fromKm = 0, toKm = Infinity, segKm = null) {
  const f = decode(fine);
  if (!f) return [];
  const a = clampKm(f, fromKm);
  const b = clampKm(f, Math.min(toKm, f.km));
  if (!(b > a)) return [];
  const s = segKm ?? segKmFor(f, a, b);
  const out = [];
  let k = Math.floor(a / s) * s;
  while (k < b - 1e-9) {
    const x = Math.max(a, k);
    const y = Math.min(b, k + s);
    if (y > x) {
      const pct = Math.round(((heightAt(f, y) - heightAt(f, x)) / ((y - x) * 1000)) * 1000) / 10;
      out.push({ fromKm: x, toKm: y, pct, key: steepKey(pct) });
    }
    k += s;
  }
  return out;
}

/**
 * The next summit or valley ahead of km (a turn of at least `min` m, so a bump does not count):
 * { kind: 'summit' | 'valley', km, m, distKm } or null when the route only goes one way to the end.
 */
export function nextTurn(fine, km, min = 20) {
  const f = decode(fine);
  if (!f) return null;
  const i0 = Math.min(f.n - 1, Math.max(0, Math.round(clampKm(f, km) / f.step)));
  let hi = i0;
  let lo = i0;
  for (let i = i0 + 1; i < f.n; i++) {
    if (f.m[i] > f.m[hi]) hi = i;
    if (f.m[i] < f.m[lo]) lo = i;
    if (hi > i0 && f.m[hi] - f.m[i] >= min) return turn(f, 'summit', hi, km);
    if (lo > i0 && f.m[i] - f.m[lo] >= min) return turn(f, 'valley', lo, km);
  }
  return null;
}
const turn = (f, kind, i, km) => ({ kind, km: Math.round(i * f.step * 100) / 100, m: Math.round(f.m[i]), distKm: Math.round((i * f.step - km) * 100) / 100 });

/* ---------- axes and the view ---------- */

/** 1, 2, 2.5 or 5 × 10ⁿ: the nice step at or above raw. */
export function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw - 1e-12) return Math.round(m * p * 1e6) / 1e6;
  return 10 * p;
}

/** About `count` round ticks from lo to hi: { step, ticks: [values] } (only those inside). */
export function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) return { step: 1, ticks: [lo] };
  const step = niceStep((hi - lo) / Math.max(1, count));
  const ticks = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6 + 0);
  return { step, ticks };
}

/** The smallest stretch the profile zooms to (km). */
export const minSpan = (fine) => Math.max(0.3, (decode(fine)?.step ?? 0.05) * 6);

/**
 * A view { from, to } kept inside 0…total and at least minSpan long; null when it is the whole route
 * (within half a percent).
 */
export function clampView(view, total, least = 0.3) {
  if (!view || !(total > 0)) return null;
  let span = Math.max(least, Math.min(total, view.to - view.from));
  let from = Math.max(0, Math.min(total - span, view.from));
  if (span >= total * 0.995) return null;
  return { from: Math.round(from * 1000) / 1000, to: Math.round((from + span) * 1000) / 1000 };
}

/** Zoom the view by factor (< 1 in, > 1 out) around km (default: the middle). */
export function zoomView(view, total, factor, atKm = null, least = 0.3) {
  const v = view ?? { from: 0, to: total };
  const c = atKm ?? (v.from + v.to) / 2;
  const span = (v.to - v.from) * factor;
  const f = (c - v.from) / (v.to - v.from || 1);
  return clampView({ from: c - span * f, to: c - span * f + span }, total, least);
}

/** Move the view by km (it stops at the ends). */
export function panView(view, total, byKm) {
  if (!view) return null;
  const span = view.to - view.from;
  const from = Math.max(0, Math.min(total - span, view.from + byKm));
  return { from: Math.round(from * 1000) / 1000, to: Math.round((from + span) * 1000) / 1000 };
}

/**
 * The km of the route the map shows: pts (lineKm, [{ lat, lon, km }]) and the map bounds
 * { west, south, east, north } → { from, to } of the points inside, null when none is inside.
 */
export function kmRangeIn(pts = [], b) {
  if (!b || !(pts?.length > 1)) return null;
  let from = Infinity;
  let to = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.lat >= b.south && p.lat <= b.north && p.lon >= b.west && p.lon <= b.east) {
      // half the way to the neighbours outside, so the edge of the map is not cut short
      const prev = pts[i - 1]?.km ?? p.km;
      const next = pts[i + 1]?.km ?? p.km;
      from = Math.min(from, (p.km + prev) / 2);
      to = Math.max(to, (p.km + next) / 2);
    }
  }
  if (!Number.isFinite(from)) return null;
  return { from: Math.round(from * 100) / 100, to: Math.round(to * 100) / 100 };
}
