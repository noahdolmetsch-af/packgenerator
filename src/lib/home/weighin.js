/**
 * P6 «Heute ergänzen», SN2l (Noah 21.10.2026 «2b»): the weight once a week on Heute. A calm card asks
 * «Weight this week?» when no weight was typed in the last 7 days. «Not today» hides it until tomorrow
 * (db.settings WEIGH_KEY { until }); «Stop asking» takes the tile off the wall (it stays in the catalog).
 * The weight is the same as under Ich › Gewicht (weight.svelte.js saveWeight); there is no second place.
 * Pure functions, tested in tests/weighin.test.js.
 */
import { addDays } from '../health.js';

export const WEIGH_KEY = 'homeWeigh';
/** How many days a weight counts as «this week». */
export const WEIGH_DAYS = 7;

/** The card is due: no weight in the last 7 days and not put away for today. entries: weight.js entriesOf. */
export function weighDue(entries = [], today, ask = null) {
  if (ask?.until && today < ask.until) return false;
  const from = addDays(today, -(WEIGH_DAYS - 1));
  return !entries.some((e) => e.day >= from && e.day <= today);
}

/** «Not today»: the record that hides the card until tomorrow. */
export const notToday = (today) => ({ until: addDays(today, 1) });
