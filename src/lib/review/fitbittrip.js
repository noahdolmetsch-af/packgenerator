/**
 * Stimmung und Energie im Rückblick (Noah 21.10.2026 «fehlen werte für stimmung und energie»): the Fitbit
 * values around a trip instead of the old placeholders «· mit Fitbit». Observation only, nothing invented.
 *   - before: the night before the first day (the sleep Fitbit files under the morning it ends, and that
 *     day's resting heart rate);
 *   - after: the 2 days after the last day (recovery);
 *   - normal: «Dein Normal» before the trip (health.js normalOf, the median of 30 days).
 * rows: healthDays { date, restingHr, sleep: { asleepMin } }. Pure, tested in tests/fitbittrip.test.js.
 */
import { addDays, normalOf } from '../health.js';

const pick = (r) => (r && (Number.isFinite(r.restingHr) || Number.isFinite(r.sleep?.asleepMin)) ? { date: r.date, restingHr: Number.isFinite(r.restingHr) ? r.restingHr : null, sleepMin: Number.isFinite(r.sleep?.asleepMin) ? r.sleep.asleepMin : null } : null);

/** → { before, after: [..], normal: { restingHr, sleepMin } } or null without any value. */
export function fitbitTrip(rows = [], start, end, days = 2) {
  if (!start) return null;
  const last = end && end >= start ? end : start;
  const by = Object.fromEntries(rows.map((r) => [r.date, r]));
  const before = pick(by[start]);
  const after = Array.from({ length: days }, (_, i) => pick(by[addDays(last, i + 1)])).filter(Boolean);
  if (!before && !after.length) return null;
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return { before, after, normal: { restingHr: normalOf(sorted, 'restingHr', start), sleepMin: normalOf(sorted, 'sleep', start) } };
}

/** Minutes as «7 h 05 min». */
export const sleepText = (min) => (Number.isFinite(min) ? `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min` : null);
