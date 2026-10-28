/**
 * «Genaue Werte» (Noah 27.10.2026: «die Diagramme sollen exakte Daten zeigen, nicht nur Schätzungen anhand
 * ungenauer Skalen am Rand»): one shared way to scale a chart. A value axis has round, labelled steps
 * (0, 20, 40 km; 6 h, 7 h, 8 h) with thin grid lines, so every point can be read off; the exact value of a
 * point comes on tap or hover, and charts with few points write the number at the point.
 * Pure: no Svelte, no DOM. Used by GridLines.svelte and YTicks.svelte and every chart of the app.
 */

const NICE = [1, 2, 2.5, 5, 10];
/** Steps for minutes (sleep, duration): 5 min up to 12 h, so the axis says «7 h», not «417 min». */
export const MINUTE_STEPS = [5, 10, 15, 30, 60, 120, 180, 240, 360, 480, 720];

const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (v) => Math.round(v * 1e6) / 1e6;

/** The smallest round step at least `raw`: 1, 2, 2.5, 5 times a power of ten, or the first of `steps`. */
export function niceStep(raw, steps = null) {
  if (!(raw > 0)) return 1;
  if (steps?.length) {
    const s = steps.find((x) => x >= raw);
    if (s) return s;
    const top = steps.at(-1);
    return Math.ceil(raw / top) * top;
  }
  const p = 10 ** Math.floor(Math.log10(raw));
  return NICE.map((m) => round(m * p)).find((s) => s >= raw - 1e-12) ?? 10 * p;
}

/**
 * The scale of a chart from its values. zero: the axis starts at 0 (bars, sums). count: about how many steps.
 * steps: allowed steps (MINUTE_STEPS for minutes). → { lo, hi, step, ticks } with lo and hi on a step, so the
 * top and bottom grid line carry a round number too.
 */
export function niceScale(values = [], { zero = false, count = 4, steps = null } = {}) {
  const vals = values.filter(finite);
  if (!vals.length) return { lo: 0, hi: 1, step: 1, ticks: [0, 1] };
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (max === min) {
    const pad = max === 0 ? 1 : Math.abs(max) * 0.1;
    max += pad;
    if (!zero || min !== 0) min -= pad;
  }
  const step = niceStep((max - min) / Math.max(1, count), steps);
  const lo = round(Math.floor(min / step + 1e-9) * step);
  const hi = round(Math.ceil(max / step - 1e-9) * step);
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(round(v));
  return { lo, hi: hi > lo ? hi : lo + step, step, ticks: ticks.length > 1 ? ticks : [lo, lo + step] };
}

/** Where a value sits, 0 at the bottom line and 1 at the top line of the scale. */
export const fracOf = (v, sc) => (sc.hi === sc.lo ? 0 : (v - sc.lo) / (sc.hi - sc.lo));

/** How many decimals a tick of this step needs (2.5 → 1, 0.25 → 2, 20 → 0). */
export function decimalsOf(step) {
  if (!(step > 0)) return 0;
  for (let d = 0; d < 6; d++) if (Math.abs(Math.round(step * 10 ** d) - step * 10 ** d) < 1e-9) return d;
  return 6;
}

/** A tick as text: the decimals the step needs, in the reader's number format (num from i18n). */
export function tickText(v, step, num = (x) => String(x)) {
  const d = decimalsOf(step);
  return num(Number(v.toFixed(d)));
}

/** A tick of minutes as text: «7 h», «7 h 30», «45 min». */
export function minuteText(v) {
  const m = Math.round(v);
  if (Math.abs(m) < 60) return `${m} min`;
  const h = Math.trunc(m / 60);
  const r = Math.abs(m % 60);
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

/** Write the number at every point when a chart has this many points or fewer. */
export const LABEL_MAX = 12;
