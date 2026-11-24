/**
 * Merken (Kal1): the own to-dos live in one settings record { key: 'merken', value: [todo] }, so they
 * travel with every backup and need no new table (Dexie versions 9–11 are taken by open packages).
 * Every write returns the old list, so the caller can offer Undo.
 */
import { newTodo, tick } from './merken.js';
import { reorderGroup } from './merken/order.js';
import { trashItem, forgetItem } from './trash/trash.js'; // «Zuletzt gelöscht»: a deleted to-do waits 30 days
import { newBirthday, newPlant, watered } from './merken/kinds.js';

export const MERKEN_KEY = 'merken';

export async function loadTodos(db) {
  return (await db.settings.get(MERKEN_KEY))?.value ?? [];
}

async function write(db, fn) {
  return db.transaction('rw', db.settings, async () => {
    const before = await loadTodos(db);
    const after = fn(before);
    await db.settings.put({ key: MERKEN_KEY, value: JSON.parse(JSON.stringify(after)) });
    return { before, after };
  });
}

const uid = () => `td-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Adds a to-do; returns { todo, undo } or null for empty text. */
export async function addTodo(db, fields, { now } = {}) {
  const todo = newTodo(fields, { id: uid(), now });
  if (!todo) return null;
  const { before } = await write(db, (list) => [...list, todo]);
  return { todo, undo: () => restoreTodos(db, before) };
}

/** Adds a birthday or a plant (merken/kinds.js); returns { todo, undo } or null without a name. */
export async function addKind(db, kind, fields, { now, today } = {}) {
  const todo = kind === 'birthday' ? newBirthday(fields, { id: uid(), now }) : kind === 'plant' ? newPlant(fields, { id: uid(), now, today }) : null;
  if (!todo) return null;
  const { before } = await write(db, (list) => [...list, todo]);
  return { todo, undo: () => restoreTodos(db, before) };
}

/** «Gegossen»: the plant was watered today; returns Undo. */
export async function waterPlant(db, id, today) {
  const { before } = await write(db, (list) => list.map((t) => (t.id === id && t.kind === 'plant' ? watered(t, today) : t)));
  return () => restoreTodos(db, before);
}

export async function updateTodo(db, id, changes) {
  const { before } = await write(db, (list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  return () => restoreTodos(db, before);
}

/** Changes one to-do with a pure function (a step ticked, a link added); returns Undo. */
export async function changeTodo(db, id, fn) {
  const { before } = await write(db, (list) => list.map((t) => (t.id === id ? fn(t) : t)));
  return () => restoreTodos(db, before);
}

/** F2: moves the to-do at `from` to `to` within a group (ids as shown); returns Undo. */
export async function reorderTodos(db, ids, from, to) {
  const { before } = await write(db, (list) => reorderGroup(list, ids, from, to));
  return () => restoreTodos(db, before);
}

/** Ticks a to-do off (repeats move on); returns Undo. */
export async function tickTodo(db, id, opts) {
  const { before } = await write(db, (list) => list.map((t) => (t.id === id ? tick(t, opts) : t)));
  return () => restoreTodos(db, before);
}

/** Deletes a to-do; returns Undo. trash: false when it is no delete of the user (a reminder that is only taken away). */
export async function removeTodo(db, id, { trash = true } = {}) {
  const { before } = await write(db, (list) => list.filter((t) => t.id !== id));
  const gone = before.find((t) => t.id === id);
  const entry = trash && gone ? await trashItem(db, String(gone.text ?? '').trim() || String(gone.name ?? ''), { store: MERKEN_KEY, row: gone, kind: 'todo' }) : null;
  return async () => {
    await restoreTodos(db, before);
    await forgetItem(db, entry);
  };
}

export const restoreTodos = (db, list) => db.settings.put({ key: MERKEN_KEY, value: list });
