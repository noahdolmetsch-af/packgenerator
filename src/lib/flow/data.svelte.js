/**
 * v0.51.0 «Im Flow»: the records the flow views read, as one live query (activities, the log of the
 * last 70 days, the checks of the last 30 days, the trip days, the question pool and bowl default).
 * Heute's card, the flow page and the floating windows each read it.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { addDays, normAct, tripDays } from '../flow.js';
import { QUESTIONS_KEY, poolOf } from '../flowcheck.js';
import { BOWL_KEY, bowlOf } from '../flowbowl.js';
import { homeTrips } from '../home/heute.js';
import { ensureSeed } from '../flowdb.js';

/** today: YYYY-MM-DD. */
export function flowQuery(today) {
  return liveQuery(async () => {
    const [acts, log, checks, trips, pool, bowl, seeded] = await Promise.all([
      db.flowActs.toArray(),
      db.flowLog.where('day').aboveOrEqual(addDays(today, -70)).toArray(),
      db.flowChecks.where('day').aboveOrEqual(addDays(today, -30)).toArray(),
      db.trips.toArray(),
      db.settings.get(QUESTIONS_KEY),
      db.settings.get(BOWL_KEY),
      db.settings.get('flowSeeded'),
    ]);
    return {
      acts: acts.map(normAct).sort((a, b) => a.order - b.order),
      log,
      checks,
      tripDays: tripDays(homeTrips(trips), today),
      pool: poolOf(pool?.value),
      bowl: bowlOf(bowl?.value),
      seeded: !!seeded || acts.length > 0,
    };
  });
}

let seeding = false;
/** Seed once when the data says so (a fresh start, or a restored backup without flow data). */
export async function seedIfNeeded(data) {
  if (!data || data.seeded || seeding) return;
  seeding = true;
  try {
    await ensureSeed(db);
  } finally {
    seeding = false;
  }
}
