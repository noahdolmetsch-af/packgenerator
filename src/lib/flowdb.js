/**
 * v0.51.0 «Im Flow»: reading and writing the flow tables (flowActs, flowLog, flowChecks) and the two
 * settings records (the question pool, the bowl default). The rules are in flow.js / flowcheck.js.
 */
import { seedActs, normAct, newEntry, SEED_KEY } from './flow.js';
import { QUESTIONS_KEY, SEED_QUESTIONS } from './flowcheck.js';
import { SEED2_KEY, seed2Plan } from './flowtiles.js';

/**
 * The small start: the twelve activities and the question pool, once. A restored backup without
 * flow data (an older file) gets them again; a user who deleted every activity keeps an empty page
 * (the seed mark is a setting and goes into the backup).
 */
export async function ensureSeed(db) {
  await db.transaction('rw', db.flowActs, db.settings, async () => {
    const [mark, n, pool] = await Promise.all([db.settings.get(SEED_KEY), db.flowActs.count(), db.settings.get(QUESTIONS_KEY)]);
    if (!pool) await db.settings.put({ key: QUESTIONS_KEY, value: SEED_QUESTIONS });
    if (mark || n) {
      if (!mark) await db.settings.put({ key: SEED_KEY, value: true });
      return;
    }
    await db.flowActs.bulkPut(seedActs());
    await db.settings.put({ key: SEED_KEY, value: true });
  });
}

/** Tick an activity: the new log entry (kept for «Rückgängig»). */
export async function tick(db, act, opts) {
  const e = newEntry(act, opts);
  await db.flowLog.put(e);
  return e;
}
export const removeEntry = (db, id) => db.flowLog.delete(id);
export const putEntry = (db, e) => db.flowLog.put(e);

export const saveAct = (db, act) => db.flowActs.put(JSON.parse(JSON.stringify(normAct(act))));
/** Delete an activity with its history and its session details (pausing keeps them). Stars reached stay. */
export async function deleteAct(db, id) {
  await db.transaction('rw', db.flowActs, db.flowLog, db.flowSessions, async () => {
    await db.flowActs.delete(id);
    await db.flowLog.where('actId').equals(id).delete();
    await db.flowSessions.where('actId').equals(id).delete();
  });
}
/** Save a new order (moveAct in flow.js gives the list). */
export const saveOrder = (db, list) => db.flowActs.bulkPut(list.map((a) => JSON.parse(JSON.stringify(a))));

export const saveCheck = (db, check) => db.flowChecks.put(JSON.parse(JSON.stringify(check)));
export const saveQuestions = (db, list) => db.settings.put({ key: QUESTIONS_KEY, value: JSON.parse(JSON.stringify(list)) });

/* ---------- hobby pages, package 1 (Aktiv › Aktivität, Meilensteine) ---------- */
/**
 * Seed 2, once (setting flow.seed2): the playful names, the six favourite tiles and the walk, for new
 * and existing users, without overwriting their own (flowtiles.js seed2Plan). Runs after the first seed.
 */
export async function ensureSeed2(db) {
  await db.transaction('rw', db.flowActs, db.settings, async () => {
    const [mark, acts] = await Promise.all([db.settings.get(SEED2_KEY), db.flowActs.toArray()]);
    if (mark || !acts.length) return;
    const plan = seed2Plan(acts);
    if (plan.length) await db.flowActs.bulkPut(JSON.parse(JSON.stringify(plan)));
    await db.settings.put({ key: SEED2_KEY, value: true });
  });
}
/** Keep the stars reached (flowms.js newStars): they never get lost. */
export const saveStars = (db, rows) => (rows.length ? db.flowStars.bulkPut(rows) : Promise.resolve());
/** A setting of the hobby pages (flow.msTune, flow.reward, flow.hiddenSugg); null removes it. */
export const putSetting = (db, key, value) => (value == null ? db.settings.delete(key) : db.settings.put({ key, value: JSON.parse(JSON.stringify(value)) }));
/** Several activities at once (favourites, their order, a new one from a suggestion). */
export const putActs = (db, list) => db.flowActs.bulkPut(list.map((a) => JSON.parse(JSON.stringify(normAct(a)))));
