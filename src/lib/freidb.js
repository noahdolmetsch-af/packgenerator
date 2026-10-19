/**
 * Paket T «Freie Zeit»: the data. The page settings are one settings record { key: 'frei', value }
 * (areas, collections, rituals, own ideas …, frei.js); the entries are rows of the table «frei»
 * (Dexie version 18): kind 'entry' (a collection entry with photos), 'essential' («In this phase …»),
 * 'longing' (Reise-Wünsche), 'hope' (a trip's hope and what you experienced), 'dayplan', 'mark'
 * («Fürs nächste Mal»), 'log' («Worked» of «Worauf hab ich Lust?»). Both travel in every backup.
 * Every write returns what Undo needs.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from './db.js';
import { FREI_KEY, uid } from './frei.js';

const plain = (x) => JSON.parse(JSON.stringify(x ?? null));

export async function loadCfg(db = appDb) {
  return (await db.settings.get(FREI_KEY))?.value ?? {};
}
/** Change the record with fn(cfg) → cfg, reading what is saved first; returns the old record (Undo). */
export async function changeCfg(fn, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const before = await loadCfg(db);
    await db.settings.put({ key: FREI_KEY, value: plain(fn(plain(before)) ?? before) });
    return before;
  });
}
export const restoreCfg = (before, db = appDb) => db.settings.put({ key: FREI_KEY, value: plain(before) });

/** The record, live. */
export const cfgQuery = (db = appDb) => liveQuery(() => loadCfg(db));
/** Rows of one kind, live (newest first). */
export const rowsQuery = (kind, db = appDb) => liveQuery(async () => (await db.frei.where('kind').equals(kind).toArray()).sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? ''))));

/** Save a row (new or changed). */
export async function putRow(row, db = appDb) {
  const rec = plain({ id: row.id ?? uid('fr'), at: row.at ?? new Date().toISOString(), ...row });
  await db.frei.put(rec);
  return rec;
}
/** Delete a row; returns it for Undo. */
export async function deleteRow(id, db = appDb) {
  const rec = await db.frei.get(id);
  await db.frei.delete(id);
  return rec;
}
export const restoreRow = (rec, db = appDb) => (rec ? db.frei.put(rec) : null);

/** Move all entries of collection `from` to `to` ('' = without a collection); returns the old rows. */
export async function moveEntries(from, to, db = appDb) {
  return db.transaction('rw', db.frei, async () => {
    const rows = (await db.frei.where('coll').equals(from).toArray()).filter((r) => r.kind === 'entry');
    await db.frei.bulkPut(rows.map((r) => ({ ...r, coll: to || `-${from}` })));
    return rows;
  });
}
export const restoreRows = (rows, db = appDb) => db.frei.bulkPut(rows ?? []);
