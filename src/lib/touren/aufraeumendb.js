/**
 * «Touren-Liste aufräumen»: joining doubles and taking them apart again, with the database
 * (aufraeumen.js has the rules). One transaction each, so a join or its «Wieder trennen» is never half done.
 */
import { joinWrites, splitWrites, markTestChanges, unmarkTestChanges } from './aufraeumen.js';

const TABLES = ['trips', 'debriefs', 'rides'];

async function readAll(db) {
  const [trips, debriefs, rides] = await Promise.all([db.trips.toArray(), db.debriefs.toArray(), db.rides.toArray()]);
  return { trips, debriefs, rides };
}

async function write(db, plan) {
  for (const x of plan.trips) await db.trips.update(x.id, x.changes);
  for (const x of plan.debriefs) await db.debriefs.update(x.tripId, x.changes);
  for (const x of plan.rides) await db.rides.update(x.id, x.changes);
}

/** Join the groups: picks is [{ group, keepId }]. Returns the ids that were archived, to hand to splitDoubles. */
export async function joinDoubles(db, picks, now = new Date().toISOString()) {
  return db.transaction('rw', TABLES.map((k) => db.table(k)), async () => {
    const all = await readAll(db);
    const ids = [];
    for (const { group, keepId } of picks) {
      const plan = joinWrites(all, group, keepId, now);
      await write(db, plan);
      ids.push(...plan.trips.map((x) => x.id));
      // the next group reads the new state
      Object.assign(all, await readAll(db));
    }
    return ids;
  });
}

/** Put the given extras back as they were (and their rides on them). Returns how many trips came back. */
export async function splitDoubles(db, ids, now = new Date().toISOString()) {
  return db.transaction('rw', TABLES.map((k) => db.table(k)), async () => {
    const plan = splitWrites(await readAll(db), ids, now);
    await write(db, plan);
    return plan.trips.length;
  });
}

/** Set the «Test trip» switch on the given trips. Returns how many were marked. */
export async function markTests(db, ids, now = new Date().toISOString()) {
  return db.transaction('rw', db.trips, async () => {
    let n = 0;
    for (const id of ids) n += await db.trips.update(id, markTestChanges(now));
    return n;
  });
}

/** «Undo» of markTests: the switch off again. */
export async function unmarkTests(db, ids) {
  return db.transaction('rw', db.trips, async () => {
    let n = 0;
    for (const id of ids) n += await db.trips.update(id, unmarkTestChanges());
    return n;
  });
}
