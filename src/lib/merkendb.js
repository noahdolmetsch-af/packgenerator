/**
 * Merken (Kal1): the own to-dos live in one settings record { key: 'merken', value: [todo] }, so they
 * travel with every backup and need no new table (Dexie versions 9–11 are taken by open packages).
 * Every write returns the old list, so the caller can offer Undo.
 */
import { newTodo, tick } from './merken.js';

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

export async function updateTodo(db, id, changes) {
  const { before } = await write(db, (list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  return () => restoreTodos(db, before);
}

/** Ticks a to-do off (repeats move on); returns Undo. */
export async function tickTodo(db, id, opts) {
  const { before } = await write(db, (list) => list.map((t) => (t.id === id ? tick(t, opts) : t)));
  return () => restoreTodos(db, before);
}

export async function removeTodo(db, id) {
  const { before } = await write(db, (list) => list.filter((t) => t.id !== id));
  return () => restoreTodos(db, before);
}

export const restoreTodos = (db, list) => db.settings.put({ key: MERKEN_KEY, value: list });
