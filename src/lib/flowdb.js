/**
 * v0.51.0 «Im Flow»: reading and writing the flow tables (flowActs, flowLog, flowChecks) and the two
 * settings records (the question pool, the bowl default). The rules are in flow.js / flowcheck.js.
 */
import { seedActs, normAct, newEntry, SEED_KEY } from './flow.js';
import { QUESTIONS_KEY, SEED_QUESTIONS } from './flowcheck.js';
import { SEED2_KEY, seed2Plan } from './flowtiles.js';
import { MED_SEED_KEY, seedTemplates } from './flowmed.js';

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
/**
 * Fix 14.10.: today's own ticks of an activity, read from the saved log (the page shows them a moment
 * later). keep(e) narrows them, for example to the commutes.
 */
export const dayEntries = async (db, actId, day, keep = () => true) => (await db.flowLog.where('actId').equals(actId).toArray()).filter((e) => e.day === day && keep(e));
/** Fix 14.10.: take ticks back all at once (a quick double tap could save two); «Rückgängig» puts them back. */
export const removeEntries = (db, list) => db.flowLog.bulkDelete(list.map((e) => e.id));
export const putEntries = (db, list) => db.flowLog.bulkPut(list);

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

/* ---------- hobby pages 2 «Kissenzeit» (B1, B2, B7) ---------- */
/** The three suggested templates, once (setting flow.medSeed); deleted ones do not come back. */
export async function ensureMedSeed(db, actId = 'meditation') {
  await db.transaction('rw', db.flowTemplates, db.settings, async () => {
    const mark = await db.settings.get(MED_SEED_KEY);
    if (mark) return;
    const n = await db.flowTemplates.where('actId').equals(actId).count();
    if (!n) await db.flowTemplates.bulkPut(JSON.parse(JSON.stringify(seedTemplates(actId))));
    await db.settings.put({ key: MED_SEED_KEY, value: true });
  });
}
export const saveTemplate = (db, tpl) => db.flowTemplates.put(JSON.parse(JSON.stringify(tpl)));
export const deleteTemplate = (db, id) => db.flowTemplates.delete(id);
/**
 * A session ended (B7): the log entry and its details in one go, and the template gets «last used».
 * The same session saved twice writes the same rows (the id comes from its start).
 */
export async function saveSession(db, { entry, session }) {
  await db.transaction('rw', db.flowLog, db.flowSessions, db.flowTemplates, async () => {
    const was = await db.flowSessions.get(session.id);
    await db.flowLog.put(entry);
    await db.flowSessions.put(JSON.parse(JSON.stringify(session)));
    if (session.tplId && !was) {
      const tpl = await db.flowTemplates.get(session.tplId);
      if (tpl) await db.flowTemplates.put({ ...tpl, usedAt: session.at, uses: (Number(tpl.uses) || 0) + 1 });
    }
  });
}
/** Delete a session: its log entry and its details. */
export async function deleteSession(db, id) {
  await db.transaction('rw', db.flowLog, db.flowSessions, async () => {
    await db.flowLog.delete(id);
    await db.flowSessions.delete(id);
  });
}

/* ---------- hobby pages 3 «Nach dem Gong» (B3, B5) ---------- */
/**
 * The note after the gong (H23a: all optional) and the kind it was: written into the session's details.
 * A log entry without details (an old one, a tick) gets them now, with what the entry knows.
 */
export async function saveNote(db, id, patch) {
  await db.transaction('rw', db.flowLog, db.flowSessions, async () => {
    const [s, e] = await Promise.all([db.flowSessions.get(id), db.flowLog.get(id)]);
    if (!s && !e) return;
    const base = s ?? { id, actId: e.actId, day: e.day, at: e.at ?? null, min: e.min ?? null, marks: [] };
    await db.flowSessions.put(JSON.parse(JSON.stringify({ ...base, ...patch })));
  });
}
/** «Rückgängig» after deleting a session: the log entry and its details come back. */
export async function restoreSession(db, entry, session) {
  await db.transaction('rw', db.flowLog, db.flowSessions, async () => {
    if (entry) await db.flowLog.put(entry);
    if (session) await db.flowSessions.put(session);
  });
}
