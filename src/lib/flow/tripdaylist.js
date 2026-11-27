/** The days a bike trip counts as a tick for «Cycling outdoors» (flow.js tripDays), as a live query; Heute, the Haken-Verlauf and «Was auffällt» read it. */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { tripDays } from '../flow.js';
import { homeTrips } from '../home/heute.js';

export const tripDayQuery = (today) =>
  liveQuery(async () => {
    const [trips, rode] = await Promise.all([db.trips.toArray(), db.kmBook.where('date').equals(today).count()]);
    return tripDays(homeTrips(trips), today, { rodeToday: rode > 0 });
  });
