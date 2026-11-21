/**
 * «Zusammenführen» (Noah 21.11.2026 «Ja, bauen», Sportjahr S8): two sports that are the same one (Gym and eGym, Eishockey
 * twice) become one. Everything that was ticked, timed or saved under the first sport goes to the second; the first sport
 * then leaves the lists. Nothing is lost, and «Undo» puts every row back exactly as it was.
 *
 * What moves: the ticks (flowLog), the session details (flowSessions), the timer templates (flowTemplates) and the Strava
 * sports that pointed to the first sport (setting strava.ticks, map). The goals, the name, the symbol and the group of the
 * target stay. The block size and the usual duration of the first sport go over only when the target has none of its own.
 * No Dexie schema change; the settings are part of the backup as before. Tested in tests/zusammen.test.js.
 */
import { TICKS_KEY } from '../stravaticks.js';
import { USUAL_KEY, usualMap } from './usualmin.js';
import { BLOCKS_KEY, blocksMap } from './bloecke.js';

const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/** How much a merge moves: { log, sessions, templates, strava } (for the question «n ticks go over»). */
export async function mergeCounts(db, fromId) {
  const [log, sessions, templates, ticks] = await Promise.all([
    db.flowLog.where('actId').equals(fromId).count(),
    db.flowSessions.where('actId').equals(fromId).count(),
    db.flowTemplates.where('actId').equals(fromId).count(),
    db.settings.get(TICKS_KEY),
  ]);
  const map = ticks?.value?.map ?? {};
  return { log, sessions, templates, strava: Object.values(map).filter((v) => v === fromId).length };
}

/** The setting maps with the first sport folded into the target: [usual, blocks] made whole. Pure. */
export function foldSettings(fromId, intoId, { usual, blocks, ticks } = {}) {
  const u = usualMap(usual);
  const b = blocksMap(blocks);
  const nu = { ...u };
  const nb = { ...b };
  if (fromId in nu) {
    if (!(intoId in nu)) nu[intoId] = nu[fromId];
    delete nu[fromId];
  }
  if (fromId in nb) {
    if (!(intoId in nb)) nb[intoId] = nb[fromId];
    delete nb[fromId];
  }
  let nt = ticks;
  if (ticks?.map && Object.values(ticks.map).includes(fromId)) {
    nt = { ...ticks, map: Object.fromEntries(Object.entries(ticks.map).map(([k, v]) => [k, v === fromId ? intoId : v])) };
  }
  return { usual: nu, blocks: nb, ticks: nt };
}

async function putOrDelete(db, key, value) {
  if (value === undefined || (value && typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)) await db.settings.delete(key);
  else await db.settings.put({ key, value: copy(value) });
}

/**
 * Fold the sport `fromId` into `intoId`. → what undoMerge needs, or null when one of them does not exist or they are the
 * same. One transaction: either everything moves or nothing.
 */
export async function mergeActs(db, fromId, intoId) {
  if (!fromId || !intoId || fromId === intoId) return null;
  return db.transaction('rw', db.flowActs, db.flowLog, db.flowSessions, db.flowTemplates, db.settings, async () => {
    const [from, into] = await Promise.all([db.flowActs.get(fromId), db.flowActs.get(intoId)]);
    if (!from || !into) return null;
    const [log, sessions, templates] = await Promise.all([
      db.flowLog.where('actId').equals(fromId).toArray(),
      db.flowSessions.where('actId').equals(fromId).toArray(),
      db.flowTemplates.where('actId').equals(fromId).toArray(),
    ]);
    const keys = [TICKS_KEY, USUAL_KEY, BLOCKS_KEY];
    const rows = await Promise.all(keys.map((k) => db.settings.get(k)));
    const before = Object.fromEntries(keys.map((k, i) => [k, copy(rows[i]?.value)]));

    if (log.length) await db.flowLog.bulkPut(log.map((e) => ({ ...e, actId: intoId })));
    if (sessions.length) await db.flowSessions.bulkPut(sessions.map((s) => ({ ...s, actId: intoId })));
    if (templates.length) await db.flowTemplates.bulkPut(templates.map((x) => ({ ...x, actId: intoId })));
    const next = foldSettings(fromId, intoId, { usual: before[USUAL_KEY], blocks: before[BLOCKS_KEY], ticks: before[TICKS_KEY] });
    if (before[TICKS_KEY] !== undefined) await putOrDelete(db, TICKS_KEY, next.ticks);
    await putOrDelete(db, USUAL_KEY, next.usual);
    await putOrDelete(db, BLOCKS_KEY, next.blocks);
    await db.flowActs.delete(fromId);
    return { fromId, intoId, act: from, log: copy(log), sessions: copy(sessions), templates: copy(templates), before };
  });
}

/** «Undo» after mergeActs: the sport is back, every row has its old sport again, the settings are as they were. */
export async function undoMerge(db, saved) {
  if (!saved?.act) return;
  await db.transaction('rw', db.flowActs, db.flowLog, db.flowSessions, db.flowTemplates, db.settings, async () => {
    await db.flowActs.put(saved.act);
    if (saved.log?.length) await db.flowLog.bulkPut(saved.log);
    if (saved.sessions?.length) await db.flowSessions.bulkPut(saved.sessions);
    if (saved.templates?.length) await db.flowTemplates.bulkPut(saved.templates);
    for (const [key, value] of Object.entries(saved.before ?? {})) await putOrDelete(db, key, value);
  });
}
