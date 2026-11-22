/**
 * «Cardio-Belastung» Idee E (Noah 07.11.2026 «alle A–F»): the highest days of the shown range, to be named with what
 * was recorded on them (a trip, a workout, a ride). Pure: days are 'YYYY-MM-DD'.
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The `n` days with the highest value, highest first; on equal values the newer day first. → [{ day, v }] */
export function topDays(days = [], get, n = 3) {
  return days
    .map((day) => ({ day, v: fin(get?.(day)) }))
    .filter((x) => x.v != null && x.v > 0)
    .sort((a, b) => b.v - a.v || (a.day < b.day ? 1 : -1))
    .slice(0, n);
}

/** «Alpenrunde · Morgenlauf, Yoga» from the trip title (or '') and the names of the day; '' when there is nothing. */
export const whatText = (trip, doneNames = '') => [trip, doneNames].filter(Boolean).join(' · ');
