/**
 * Paket O «Sportarten»: reading and writing the sport pages' entries (table sportItems, db.js version 16)
 * and their settings record (sportsbase.js CFG_KEY). Deleting goes through ui/ask.js (question + Undo).
 */
import { db } from './db.js';
import { CFG_KEY } from './sportsbase.js';

export const newId = (kind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Save one entry (a new one gets an id and the time it was written). */
export async function putItem(item) {
  const rec = { ...item, id: item.id ?? newId(item.kind), at: item.at ?? new Date().toISOString() };
  await db.sportItems.put(rec);
  return rec;
}
/** Change fields of one entry. */
export const patchItem = async (id, patch) => {
  const old = await db.sportItems.get(id);
  if (!old) return null;
  const rec = { ...old, ...patch };
  await db.sportItems.put(rec);
  return rec;
};
/** Delete entries; → the deleted records (for Undo). */
export async function dropItems(ids) {
  const old = (await db.sportItems.bulkGet(ids)).filter(Boolean);
  await db.sportItems.bulkDelete(ids);
  return old;
}
export const restoreItems = (recs) => db.sportItems.bulkPut(recs);

/** The settings of every sport, and saving them. */
export const readCfg = async () => (await db.settings.get(CFG_KEY))?.value ?? {};
export const saveCfg = (value) => db.settings.put({ key: CFG_KEY, value: JSON.parse(JSON.stringify(value)) });
