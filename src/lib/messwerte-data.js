/**
 * «Aktiv neu» (20.10.2026): the live day table of messwerte.js, from the database. Without the tables
 * (an old database in tests) the parts are empty.
 */
import { liveQuery } from 'dexie';
import { db } from './db.js';
import { dayTable } from './messwerte.js';
import { withStravaRides, bikeActs, notIgnored } from './kmbook.js';
import { withFitLoad } from './fitload.js';

export async function loadTable(d = db) {
  const [health, acts, rides, kmBook, bikes, prefs] = await Promise.all([
    d.healthDays ? d.healthDays.toArray() : [],
    d.activities ? d.activities.toArray() : [],
    d.rides ? d.rides.toArray() : [],
    d.kmBook ? d.kmBook.toArray() : [],
    bikeActs(d),
    d.settings.get('strava'),
  ]);
  const ok = notIgnored(acts, prefs?.value?.ignore);
  // «TSS vom Gerät» (Noah 28.10.2026 «1a»): a FIT ride's TSS is its load; a ride without Strava twin adds to its day
  const fit = withFitLoad(ok, rides);
  const table = dayTable({ health, acts: fit.acts, bikeRides: withStravaRides(rides, kmBook, bikes) });
  for (const f of fit.extra) {
    if (!table.has(f.day)) table.set(f.day, { day: f.day, acts: [] });
    const row = table.get(f.day);
    row.fitTss = (row.fitTss ?? 0) + f.tss;
  }
  return table;
}
/** A Svelte store: the day table, again after every change of the tables it reads. */
export const tableQuery = () => liveQuery(() => loadTable());
