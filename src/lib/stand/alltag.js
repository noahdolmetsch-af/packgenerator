/**
 * «Dein Stand in Zahlen» on Alltag (Noah 25.11.2026, second area after Velos und Material): the three big numbers and the
 * last 14 days of minutes outdoors, read from what is already there (nothing new is stored). Pure (tests/stand-alltag.test.js).
 *   - Draussen: the days in a row that reached the daily goal (src/lib/outdoor.js `standing`, the same count as the card on Heute);
 *   - Einkauf: the open points of the everyday shopping list (the ticked ones do not count);
 *   - Verträge: the days to the next last day to cancel (src/lib/alltag.js `deadlineOf`), never an amount.
 * rec: the stored challenge `outdoor` (outdoorOf); activities: the saved activities; shop: the list «Shopping list» or null;
 * contracts: the contracts of Alltag; today: a Zurich day string.
 */
import { dayOf, standing } from '../outdoor.js';
import { deadlineOf, daysUntil } from '../alltag.js';
import { addDays } from '../flow.js';

/** The challenge that is running today (not stopped, not closed, not over), or null. */
export const runningOf = (rec, activities, today) => {
  if (!rec?.from || rec.closed || rec.stopped) return null;
  const st = standing(rec, activities, today);
  return st && st.phase === 'running' ? st : null;
};

/** The open points of the shopping list. */
export const shopOpen = (list) => (Array.isArray(list?.items) ? list.items.filter((x) => x && !x.done).length : 0);

/** Days to the next last day to cancel (0 = today), or null when no running contract has one ahead. */
export function nextDeadlineDays(contracts = [], today) {
  let best = null;
  for (const c of contracts) {
    if (!c || c.stopped) continue;
    const d = deadlineOf(c, today);
    if (!d || d < today) continue;
    const n = daysUntil(d, today);
    if (best == null || n < best) best = n;
  }
  return best;
}

/** The last `n` days up to today, oldest first, never before the first day of the challenge: [{ day, min, done }]. */
export function lastDays(rec, activities, today, n = 14) {
  if (!rec?.from) return [];
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    if (day < rec.from || day > rec.until) continue;
    const x = dayOf(rec, activities, day);
    out.push({ day, min: x.total, done: x.done });
  }
  return out;
}

/** → { running, streak, doneToday, days, shop, deadline, any } */
export function alltagStand({ rec = null, activities = [], shop = null, contracts = [], today } = {}) {
  const st = runningOf(rec, activities, today);
  return {
    running: !!st,
    streak: st ? st.streak : 0,
    doneToday: !!st?.today.done,
    days: st ? lastDays(rec, activities, today) : [],
    shop: shopOpen(shop),
    deadline: nextDeadlineDays(contracts, today),
  };
}
