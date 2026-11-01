/**
 * «Kochen» after training (Noah 29.10.2026 «a», Bezug zum Training): when you rode today or yesterday,
 * Kochen offers the groups that fit after a ride. A suggestion only: it reads the rides that are there,
 * stores nothing and can be hidden for the day. Tested in tests/kochtraining.test.js.
 */
import { addDays } from '../flow.js';

/** From this many km a ride counts as a long one (carbs help too, not only protein). */
export const LONG_KM = 60;
/** From this many km a ride counts at all. */
export const MIN_KM = 20;

const dayOf = (x) => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x) ? x.slice(0, 10) : null);

/**
 * The latest ride day of today or yesterday: { day: 'today' | 'yesterday', km, groups: [standard group keys] }
 * or null when there was none (or only short ones).
 */
export function trainingOf(rides = [], today) {
  for (const [which, d] of [['today', today], ['yesterday', addDays(today, -1)]]) {
    const km = Math.round(rides.filter((r) => dayOf(r?.date) === d).reduce((s, r) => s + (Number(r.km) || 0), 0));
    if (km >= MIN_KM) return { day: which, date: d, km, groups: km >= LONG_KM ? ['carbs', 'protein'] : ['protein'] };
  }
  return null;
}
