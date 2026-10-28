/**
 * «Diagramme zum Antippen» K1 (Noah 27.10.2026 «1-5 a»): the numbers behind the chart «Verlauf» on the page
 * «Form und Erholung». Pure functions; tests/form-zeitraum.test.js.
 */
import { addDays } from '../../health.js';

/** The spans the chart can show: key, days, and the short name on its switch. */
export const SPANS = [
  { key: 'w4', days: 28, name: '4 wk|span' },
  { key: 'w12', days: 84, name: '12 wk|span' },
  { key: 'm6', days: 182, name: '6 mo|span' },
  { key: 'y1', days: 365, name: '1 yr|span' },
];
export const SPAN_DEFAULT = 'w12';

/**
 * Your normal resting pulse: the middle half (25th to 75th percentile) of the 30 days before today.
 * table: Map day → { rhr }. → { lo, hi } or null with fewer than 5 values.
 */
export function rhrNormal(table, today) {
  const v = Array.from({ length: 30 }, (_, i) => table?.get(addDays(today, -1 - i))?.rhr)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (v.length < 5) return null;
  const at = (p) => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
  return { lo: at(0.25), hi: at(0.75) };
}

/**
 * The places of the date labels under a chart of n days: first, last and evenly between, at least three
 * when there are three days. → [index]
 */
export function dateMarks(n, count = 4) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  const k = Math.max(3, Math.min(count, n));
  return [...new Set(Array.from({ length: k }, (_, i) => Math.round((i * (n - 1)) / (k - 1))))];
}

/** The highest value of a list and where it is (the first one if it repeats). → { i, v } or null */
export function peakOf(values) {
  let best = null;
  values.forEach((v, i) => {
    if (Number.isFinite(v) && (best == null || v > best.v)) best = { i, v };
  });
  return best;
}
