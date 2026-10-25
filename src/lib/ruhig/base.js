/**
 * Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «5a»: the whole package): small helpers
 * shared by its modules (days, ids, clean text, moving rows). Pure, no database.
 */
export const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (x) => typeof x === 'string' && DAY.test(x);
export const uid = (p = 'r') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
/** Text made safe: one line (or kept lines with `lines`), trimmed, at most `max` characters. */
export function clean(s, max = 200, lines = false) {
  const v = String(s ?? '');
  return (lines ? v.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : v.replace(/\s+/g, ' ')).trim().slice(0, max);
}
/** A calendar day plus n days (UTC noon, so summer time never shifts it). */
export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Whole days from a to b (b − a). */
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
/** «24.10.2026» */
export const dmy = (day) => (isDay(day) ? `${+day.slice(8, 10)}.${+day.slice(5, 7)}.${day.slice(0, 4)}` : '');
/** A row moved from place `from` to place `to` (arrows and drag); out of range: unchanged. */
export function move(list, from, to) {
  if (to < 0 || to >= list.length || from === to || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
/** The last day of a trip. */
export const tripEnd = (trip) => (isDay(trip?.startDate) ? addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1) : null);
/** Real trips (not an idea, not skipped) with a start day. */
export const realTrips = (trips) => (trips ?? []).filter((x) => x && isDay(x.startDate) && !x.idea && !x.skipped);
