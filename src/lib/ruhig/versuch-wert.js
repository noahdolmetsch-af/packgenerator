/**
 * «Eigene Experimente» with a measured value (Noah 03.11.2026, Cockpit-Idee 6): a try can name one value of
 * the Analyse pages (sleep, resting pulse, how you feel …). The look back then shows the mean during the try
 * against the mean of the same number of days right before it, with the range of both and an honest word on
 * whether the difference is more than the day-to-day swing. Never a proof: a few days are few, and other
 * things change too. Pure (no data access: `get(day)` is passed in), tested in tests/versuch-wert.test.js.
 */
import { addDays, daysBetween } from './base.js';

/** The values a try can measure: keys of the Analyse catalog (analyse/catalog.js), a short, meaningful list. */
export const EXP_METRICS = ['sleep', 'eff', 'rhr', 'hrv', 'ready', 'felt:sleep', 'felt:energy', 'felt:mood', 'steps'];
/** At least this many days with a value on each side before anything is said. */
export const MIN_SIDE = 3;
/** The difference counts as «clear» when it is more than this many times its standard error. */
export const CLEAR_AT = 2;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** n, mean, lowest, highest and the spread (sample standard deviation) of the values of the days. */
export function sideOf(days, get) {
  const vals = days.map((d) => fin(get(d))).filter((v) => v != null);
  const n = vals.length;
  if (!n) return { n: 0, mean: null, lo: null, hi: null, sd: null };
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  return { n, mean, lo: Math.min(...vals), hi: Math.max(...vals), sd };
}

/** The days a try covers so far (to today, the early end or its last day, whichever comes first). */
export function expDaysSoFar(e, today) {
  const last = [today, addDays(e.from, e.days - 1), e.stopped].filter(Boolean).sort()[0];
  const n = daysBetween(e.from, last) + 1;
  return n > 0 ? Array.from({ length: n }, (_, i) => addDays(e.from, i)) : [];
}

/**
 * The comparison of a try: null without a value or before the first day.
 * → { days, during, before, diff, se, verdict: 'few' | 'up' | 'down' | 'unclear' }
 * 'few': under MIN_SIDE days with a value on one side (no number is judged then).
 */
export function expResult(e, get, today) {
  if (!e?.metric || typeof get !== 'function') return null;
  const days = expDaysSoFar(e, today);
  if (!days.length) return null;
  const before = Array.from({ length: days.length }, (_, i) => addDays(e.from, i - days.length));
  const during = sideOf(days, get);
  const bef = sideOf(before, get);
  const out = { days: days.length, during, before: bef, diff: null, se: null, verdict: 'few' };
  if (during.n < MIN_SIDE || bef.n < MIN_SIDE) return out;
  out.diff = during.mean - bef.mean;
  out.se = Math.sqrt(during.sd ** 2 / during.n + bef.sd ** 2 / bef.n);
  out.verdict = out.diff !== 0 && Math.abs(out.diff) > CLEAR_AT * out.se ? (out.diff > 0 ? 'up' : 'down') : 'unclear';
  return out;
}
