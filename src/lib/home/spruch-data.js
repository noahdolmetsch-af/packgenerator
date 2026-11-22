/**
 * «Spruch zum Einstieg» PR 2 (Noah 07.11.2026 «Bau spruch pr2»): the numbers the sentences need beyond the watch days, read from
 * the database in ONE place: the weeks in a row (the same series as the tile «Series and milestones», series-data.js), the bike km
 * of this year (the same rides as the year row: ride book, counted Strava rides), the trip of a year ago (bausteine.js yearAgo)
 * and the quotes that are on (Kissenzeit, flowquotes.js). PR 4: your own sayings (settings row OWN_KEY). Read only.
 */
import { readSeries } from './series-data.js';
import { yearAgo } from './bausteine.js';
import { yearSums } from '../flow/yeargoals.js';
import { withStravaRides, bikeActs } from '../kmbook.js';
import { addDays } from '../health.js';
import { QUOTES_KEY, quotesOf } from '../flowquotes.js';
import { OWN_KEY, ownOf } from './spruch.js';

/** { series, km: { now, week }, ago: { title } | null, quotes: [{ id, text, author, source }], own: [{ id, text, ton }] } — the parts that cannot be read stay empty. */
export async function readSpruchExtra(d, today) {
  const out = { series: null, km: null, ago: null, quotes: [], own: [] };
  try {
    const ser = await readSeries(d, today);
    out.series = ser.s ?? null;
    const a = yearAgo({ trips: ser.trips ?? [], debriefs: ser.debriefs ?? [], today });
    const title = String(a?.trip?.title ?? '').trim();
    out.ago = title ? { title } : null;
  } catch {
    /* the sentences from the series and the year ago stay out */
  }
  try {
    const [rides, book, acts] = await Promise.all([d.rides.toArray(), d.kmBook ? d.kmBook.toArray() : [], bikeActs(d)]);
    const all = withStravaRides(rides, book, acts);
    const weekAgo = addDays(today, -7);
    out.km = { now: yearSums(all, today).km, week: weekAgo.slice(0, 4) === today.slice(0, 4) ? yearSums(all, weekAgo).km : 0 };
  } catch {
    /* no bike km */
  }
  try {
    out.quotes = quotesOf((await d.settings.get(QUOTES_KEY))?.value, true).shown;
  } catch {
    /* no quotes */
  }
  try {
    out.own = ownOf((await d.settings.get(OWN_KEY))?.value);
  } catch {
    /* no own sayings */
  }
  return out;
}
