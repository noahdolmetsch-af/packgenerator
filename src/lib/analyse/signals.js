/**
 * «Gesundheitssignale» (Noah 03.11.2026, Idee 3 der Cockpit-Ideen): on the page of a Fitbit value (resting
 * pulse, HRV, sleep …) your personal range and what stands out against it. The range is the middle 80 % of
 * your last 60 days (10th to 90th percentile), so it is yours and not a textbook value. «Stands out» means:
 * at least RUN days in a row on the same side outside the range. Observation only, never a diagnosis.
 * Pure: days are 'YYYY-MM-DD', oldest first; nothing reads the clock or the database.
 */
import { quantile } from './detail.js';

/** The days the range is made of, ending at the last day shown. */
export const BAND_DAYS = 60;
/** The least days with a value before the app says a range at all. */
export const MIN_VALUES = 14;
/** The least days in a row outside the range that count as «stands out». */
export const RUN = 3;
/** At most this many notes. */
export const MAX_NOTES = 5;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Your personal range [low, high] over the days, or null with fewer than MIN_VALUES values or no spread. */
export function bandOf(days, get) {
  const vals = days.map((d) => fin(get(d))).filter((v) => v != null).sort((a, b) => a - b);
  if (vals.length < MIN_VALUES) return null;
  const lo = quantile(vals, 0.1);
  const hi = quantile(vals, 0.9);
  return hi > lo ? [lo, hi] : null;
}

/**
 * The runs of RUN days or more in a row outside the band on one side, newest first (at most MAX_NOTES).
 * → [{ side: 'above' | 'below', from, to, n }]. A day without a value ends a run.
 */
export function runsOutside(days, get, band, run = RUN) {
  if (!band) return [];
  const out = [];
  let cur = null;
  const close = () => {
    if (cur && cur.n >= run) out.push(cur);
    cur = null;
  };
  for (const d of days) {
    const v = fin(get(d));
    const side = v == null ? null : v > band[1] ? 'above' : v < band[0] ? 'below' : null;
    if (!side) close();
    else if (cur && cur.side === side) {
      cur.to = d;
      cur.n++;
    } else {
      close();
      cur = { side, from: d, to: d, n: 1 };
    }
  }
  close();
  return out.reverse().slice(0, MAX_NOTES);
}

/** Does a value get a «Gesundheitssignal» block? Daily Fitbit values with a number; not sums, not own calculations, not bedtime. */
export const hasSignals = (item) => !!item && item.src === 'fitbit' && !!item.get && !item.sum && !item.own && !item.later && !item.hours && item.key !== 'bed';
