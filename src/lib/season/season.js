// «Die App zieht sich der Jahreszeit an» (Noah 03.11.2026, Idee 30): which season it is, from the calendar day.
// Northern hemisphere, meteorological seasons (the way the weather service counts them). Pure, tested in tests/season.test.js.

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'];

/** 'winter' (Dec–Feb), 'spring' (Mar–May), 'summer' (Jun–Aug) or 'autumn' (Sep–Nov) for a day 'YYYY-MM-DD'. */
export function seasonOf(day) {
  const m = Number(String(day ?? '').slice(5, 7));
  if (!(m >= 1 && m <= 12)) return 'summer'; // not a day: the friendliest one
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'spring';
  if (m <= 8) return 'summer';
  return 'autumn';
}
