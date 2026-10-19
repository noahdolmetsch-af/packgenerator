/**
 * Eigene Listen: all lists in one settings record { key: 'merken.lists', value: [list] }, so they travel with
 * every backup and need no new table (like merkendb.js). Every write returns Undo.
 */
import { LISTS_KEY, newList } from './ownlists.js';

export async function loadLists(db) {
  return (await db.settings.get(LISTS_KEY))?.value ?? [];
}

const put = (db, list) => db.settings.put({ key: LISTS_KEY, value: JSON.parse(JSON.stringify(list)) });

async function write(db, fn) {
  return db.transaction('rw', db.settings, async () => {
    const before = await loadLists(db);
    await put(db, fn(before));
    return before;
  });
}

export const uid = (p = 'ls') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** A new list; returns { list, undo } or null for an empty name. */
export async function addList(db, fields) {
  const list = newList(fields, { id: uid() });
  if (!list) return null;
  const before = await write(db, (all) => [...all, list]);
  return { list, undo: () => put(db, before) };
}

/** Changes one list with fn(list) → list; returns Undo. */
export async function changeList(db, id, fn) {
  const before = await write(db, (all) => all.map((l) => (l.id === id ? fn(l) : l)));
  return () => put(db, before);
}

export async function removeList(db, id) {
  const before = await write(db, (all) => all.filter((l) => l.id !== id));
  return () => put(db, before);
}
