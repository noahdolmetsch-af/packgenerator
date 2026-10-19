/**
 * v0.88.0 «Aufräumen und Ausprobieren»: the test data tidy-up with the database (testdata.js has the
 * rules). One transaction each, so a tidy-up or its Undo is never half done.
 */
import { TEMPLATES_KEY } from './templates.js';
import { findTestData, tidyWrites, undoWrites, tidiedCount } from './testdata.js';

const TABLES = ['trips', 'debriefs', 'items', 'settings', 'learnings'];

async function readAll(db) {
  const [trips, debriefs, items, rec, learnings] = await Promise.all([db.trips.toArray(), db.debriefs.toArray(), db.items.toArray(), db.settings.get(TEMPLATES_KEY), db.learnings.toArray()]);
  return { trips, debriefs, items, templates: rec?.value ?? [], rec, learnings };
}

/** What the sheet shows: { found, tidied } (tidied: how many can come back with «Undo»). */
export async function testDataState(db) {
  const all = await readAll(db);
  return { found: findTestData(all), tidied: tidiedCount(all) };
}

async function write(db, plan, rec) {
  for (const x of plan.trips) await db.trips.update(x.id, x.changes);
  for (const x of plan.debriefs) await db.debriefs.update(x.tripId, x.changes);
  for (const x of plan.items) await db.items.update(x.id, x.changes);
  for (const x of plan.learnings) await db.learnings.update(x.id, x.changes);
  if (rec) await db.settings.put({ ...rec, value: plan.templates });
}

/** Archive the chosen ids (a Set). Returns how many things were archived. */
export async function tidyTestData(db, chosen, now = new Date().toISOString()) {
  return db.transaction('rw', TABLES.map((k) => db.table(k)), async () => {
    const all = await readAll(db);
    const plan = tidyWrites(all, chosen, now);
    await write(db, plan, all.rec);
    return plan.trips.length + plan.items.length + plan.learnings.length + all.templates.filter((x, i) => plan.templates[i] !== x).length;
  });
}

/** «Undo»: everything tidied comes back as it was. Returns how many things came back. */
export async function undoTestData(db, now = new Date().toISOString()) {
  return db.transaction('rw', TABLES.map((k) => db.table(k)), async () => {
    const all = await readAll(db);
    const n = tidiedCount(all);
    await write(db, undoWrites(all, now), all.rec);
    return n;
  });
}
