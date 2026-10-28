/**
 * UI-Test 26.10.2026 T4 «Eine Serien-Rechnung»: the series over everything is read in ONE place, so
 * «Serie» in the year row, the tile «Serie und Meilensteine», the milestones page and the milestone
 * check on Today never disagree. The same rides as the tile «Diese Woche»: the ride book, the counted
 * Strava rides and the Strava bike activities (kmbook.js withStravaRides). Trips as on Today
 * (homeTrips: no archived and no test trips). The rules themselves are in series.js (pure, tested).
 */
import { activeDays, seriesOf, restOf, REST_KEY } from './series.js';
import { homeTrips } from './heute.js';
import { withStravaRides, bikeActs } from '../kmbook.js';

/** The tables readSeries reads, for a transaction around it. */
export const seriesTables = (d) => [d.flowLog, d.rides, d.kmBook, d.activities, d.trips, d.debriefs, d.settings].filter(Boolean);

/** The series of `today` from the database. → { s: seriesOf(...), trips: the trips of Today, debriefs } */
export async function readSeries(d, today) {
  const [log, rides, book, acts, trips, debriefs, rest] = await Promise.all([
    d.flowLog.toArray(),
    d.rides.toArray(),
    d.kmBook ? d.kmBook.toArray() : [],
    bikeActs(d),
    d.trips.toArray(),
    d.debriefs.toArray(),
    d.settings.get(REST_KEY),
  ]);
  const home = homeTrips(trips);
  const days = activeDays({ log, rides: withStravaRides(rides, book, acts), trips: home, debriefs, today });
  return { s: seriesOf(days, restOf(rest?.value), today), trips: home, debriefs };
}
