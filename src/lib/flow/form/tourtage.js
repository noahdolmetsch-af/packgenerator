/**
 * «Diagramme zum Antippen» K4 (Noah 27.10.2026 «1-5 a», answer 4a): the Tour-Bereitschaft on «Form und
 * Erholung» as one chart. The days before and during a tour, counted from its first day (−7 … −1, then
 * day 1 … n), with the resting pulse and the sleep of each day; the last tours laid over the same days so
 * they can be compared. Pure; tests/form-tourtage.test.js.
 */
import { addDays } from '../../health.js';

/** How many days before a tour the chart shows. */
export const BEFORE = 7;

/** First day and number of days of a trip. */
export function spanOf(trip) {
  const s = String(trip?.startDate ?? '').slice(0, 10);
  return { s, n: Math.max(1, Number(trip?.days) || 1) };
}

/**
 * The days of a trip with the BEFORE days ahead of it: [{ day, rel, rhr, sleep, future, inTour }].
 * rel: −BEFORE … −1 before the tour, 1 … n on it (no 0, the way people count tour days).
 */
export function tourDays(trip, table, today, before = BEFORE) {
  const { s, n } = spanOf(trip);
  if (!s) return [];
  return Array.from({ length: before + n }, (_, i) => {
    const day = addDays(s, i - before);
    const row = table?.get(day) ?? {};
    const rel = i < before ? i - before : i - before + 1;
    const fut = today != null && day > today;
    return { day, rel, rhr: fut ? null : (row.rhr ?? null), sleep: fut ? null : (row.sleep ?? null), future: fut, inTour: rel > 0 };
  });
}

/** The label of a relative day: «−3», «Day 2» comes from the page (t()); here only the number. */
export const relText = (rel) => (rel < 0 ? `−${-rel}` : String(rel));

/**
 * The longest chart of the current tour and the past ones, so all share one axis of days.
 * → [rel …] from −before to the longest tour's last day.
 */
export function relAxis(lists) {
  const n = Math.max(1, ...lists.map((l) => l.filter((d) => d.inTour).length));
  const before = Math.max(0, ...lists.map((l) => l.filter((d) => !d.inTour).length));
  return [...Array.from({ length: before }, (_, i) => i - before), ...Array.from({ length: n }, (_, i) => i + 1)];
}

/** The value of one list at a relative day, or null. */
export const atRel = (list, rel, key = 'rhr') => list.find((d) => d.rel === rel)?.[key] ?? null;

/** Trips that touch the days from..to, for bands in the chart «Verlauf»: [{ trip, s, e }]. */
export function tripsIn(trips = [], from, to) {
  return trips
    .filter((t) => t?.startDate && !t.skipped && !t.idea && !t.archivedAt)
    .map((t) => {
      const { s, n } = spanOf(t);
      return { trip: t, s, e: addDays(s, n - 1) };
    })
    .filter((x) => x.e >= from && x.s <= to)
    .sort((a, b) => a.s.localeCompare(b.s));
}
