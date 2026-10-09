/**
 * v0.36.0 (Noah 1a, 2a, 3b): the database side of "Import prüfen" (pure rules in ../gearimport.js).
 *
 * - The chosen file waits in the "meta" table (key 'gearImport', never exported) until Noah applies it.
 * - "Alle sicheren übernehmen" first keeps a full backup (backup.js buildBackup, like the demo does),
 *   then writes the new and enriched items and the learnings in one transaction. The undecided
 *   "Unsicher" items stay staged.
 * - "Rückgängig" puts that backup back (backup.js restoreBackup) and the staged file too.
 * - "Archivieren" (Nicht im Import) sets ownership 'gone' and remembers the old one; never deletes.
 * - v0.37.1 "Zusammenlegen" (Nicht im Import, and the item window): see mergeitems.js.
 */
import { buildBackup, restoreBackup, LAST_IMPORT, LAST_CHANGE } from '../backup.js';
import { buildWrites, remaining, validateGearImport } from '../gearimport.js';
import { hasStep2, buildStep2, withoutStep2 } from '../importstep2.js';
import { SETS_KEY } from '../sets.js';
import { saveItems } from './bulk.js';

export const STAGED = 'gearImport';
export const UNDO = 'gearImportUndo';
export const UNDO2 = 'gearImportUndo2';

/** Keep a chosen file for the staging page. Returns the problems (empty: staged). */
export async function stageImport(db, data, name = '', now = new Date().toISOString()) {
  const problems = validateGearImport(data);
  if (problems.length) return problems;
  await db.table('meta').put({ key: STAGED, data, name, at: now, decisions: {} });
  return [];
}

/** The staged file ({ data, name, at, decisions }) or null. */
export const getStaged = (db) => db.table('meta').get(STAGED);

/** Remember a decision on an unsure item ('new' or an app item ID; null forgets it). */
export async function decide(db, key, choice) {
  const rec = await getStaged(db);
  if (!rec) return;
  const decisions = { ...(rec.decisions ?? {}) };
  if (choice) decisions[key] = choice;
  else delete decisions[key];
  await db.table('meta').put({ ...rec, decisions });
}

/** Forget the staged file (nothing in the gear changes). */
export const dropStaged = (db) => db.table('meta').delete(STAGED);

/** The last applied import that can be undone: { at, counts, name } (without the big backup) or null. */
export async function lastApplied(db) {
  const rec = await db.table('meta').get(UNDO);
  if (!rec) return null;
  const { backup, staged, ...rest } = rec;
  return rest;
}

/**
 * Apply the safe items and the decided unsure ones. A backup of everything comes first.
 * Returns the counts (see gearimport.js buildWrites).
 */
export async function applyImport(db, now = new Date().toISOString()) {
  const staged = await getStaged(db);
  if (!staged) throw new Error('Nothing to apply.');
  const backup = await buildBackup(db);
  const counts = await db.transaction('rw', db.items, db.learnings, db.table('meta'), async () => {
    const items = await db.items.toArray();
    const learnings = await db.learnings.toArray();
    const w = buildWrites(staged.data, items, learnings, staged.decisions ?? {}, now);
    if (w.items.length) await db.items.bulkPut(w.items);
    if (w.learnings.add.length) await db.learnings.bulkPut(w.learnings.add);
    for (const u of w.learnings.update) await db.learnings.update(u.id, u.changes);
    const rest = remaining(staged.data, w.done, w.took);
    // v0.42.0: the kits, blocks, tasks and old trips (step 2) keep the file staged too.
    if (rest.items.length || hasStep2(rest)) await db.table('meta').put({ ...staged, data: rest, decisions: {}, ...(rest.items.length ? {} : { step1At: now }) });
    else await db.table('meta').delete(STAGED);
    const lastImport = (await db.table('meta').get(LAST_IMPORT)) ?? null;
    await db.table('meta').put({ key: UNDO, at: now, name: staged.name, counts: w.counts, backup, staged, lastImport });
    return w.counts;
  });
  return counts;
}

/** Has the data changed since the import was applied (then undo would lose those changes too)? */
export async function changedSince(db) {
  const rec = await lastApplied(db);
  const change = await db.table('meta').get(LAST_CHANGE);
  if (!rec || !change?.at) return false;
  return Date.parse(change.at) - Date.parse(rec.at) > 5000;
}

/** "Rückgängig": everything as it was before the import, and the file staged again. */
export async function undoImport(db) {
  const rec = await db.table('meta').get(UNDO);
  if (!rec) throw new Error('Nothing to undo.');
  await restoreBackup(db, rec.backup, 'replace');
  // restoreBackup notes a "Replace all data" import; this was none: the note as it was before.
  if (rec.lastImport) await db.table('meta').put(rec.lastImport);
  else await db.table('meta').delete(LAST_IMPORT);
  await db.table('meta').put({ ...rec.staged, key: STAGED });
  await db.table('meta').delete(UNDO);
}

/** Forget the undo backup (the import stays). */
export const keepImport = (db) => db.table('meta').delete(UNDO);

/**
 * "Nicht im Import" → archive: ownership 'gone' (Gear → Gone), the old ownership kept in
 * archivedFrom. Trips keep the item. Returns the undo snapshot for bulk.js undoBulk.
 */
export async function archiveItems(db, ids, now = new Date().toISOString()) {
  const items = (await db.items.bulkGet(ids)).filter((i) => i && i.ownership !== 'gone');
  return saveItems(db, items.map((i) => ({ ...i, ownership: 'gone', archivedFrom: i.ownership ?? 'owned', archivedAt: now, archivedBy: 'import', updatedAt: now })));
}

/* ---------- v0.42.0 step 2: kits, building blocks, tasks, old trips ---------- */

/** Remember a choice for a similar block ('merge' | 'new' | 'skip'). */
export async function choose2(db, id, choice) {
  const rec = await getStaged(db);
  if (!rec) return;
  await db.table('meta').put({ ...rec, choices2: { ...(rec.choices2 ?? {}), [id]: choice } });
}

/** What step 2 works on, read from the database. */
export async function step2Data(db) {
  const [items, setsRec, tasks, events] = await Promise.all([db.items.toArray(), db.settings.get(SETS_KEY), db.maintenance.toArray(), db.events.toArray()]);
  return { items, sets: setsRec?.value ?? [], tasks, events };
}

/**
 * "Übernehmen" of step 2: a backup first, then the building blocks (settings 'sets'), the items'
 * block keys, the preparation list and the old trips in one transaction. The step-2 lists leave the
 * staged file; a file with nothing left goes. Returns the counts.
 */
export async function applyStep2(db, now = new Date().toISOString()) {
  const staged = await getStaged(db);
  if (!staged || !hasStep2(staged.data)) throw new Error('Nothing to apply.');
  const backup = await buildBackup(db);
  return db.transaction('rw', [db.items, db.settings, db.maintenance, db.events, db.table('meta')], async () => {
    const w = buildStep2(staged.data, await step2Data(db), staged.choices2 ?? {}, now);
    if (w.items.length) await db.items.bulkPut(w.items);
    await db.settings.put({ key: SETS_KEY, value: w.sets });
    if (w.tasks.length) await db.maintenance.bulkPut(w.tasks);
    if (w.events.length) await db.events.bulkPut(w.events);
    const rest = withoutStep2(staged.data, now);
    if ((rest.items ?? []).length) await db.table('meta').put({ ...staged, data: rest, choices2: {} });
    else await db.table('meta').delete(STAGED);
    const lastImport = (await db.table('meta').get(LAST_IMPORT)) ?? null;
    await db.table('meta').put({ key: UNDO2, at: now, name: staged.name, counts: w.counts, backup, staged, lastImport });
    return w.counts;
  });
}

/** The last step-2 apply that can be undone: { at, counts, name } or null. */
export async function lastApplied2(db) {
  const rec = await db.table('meta').get(UNDO2);
  if (!rec) return null;
  const { backup, staged, ...rest } = rec;
  return rest;
}

/** "Rückgängig" for step 2: everything as before, and the file staged again. */
export async function undoStep2(db) {
  const rec = await db.table('meta').get(UNDO2);
  if (!rec) throw new Error('Nothing to undo.');
  await restoreBackup(db, rec.backup, 'replace');
  if (rec.lastImport) await db.table('meta').put(rec.lastImport);
  else await db.table('meta').delete(LAST_IMPORT);
  await db.table('meta').put({ ...rec.staged, key: STAGED });
  await db.table('meta').delete(UNDO2);
}

/** Forget the step-2 undo backup. */
export const keepStep2 = (db) => db.table('meta').delete(UNDO2);
