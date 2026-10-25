/**
 * Paket D «Mit Freunden»: the settings rows of this package (see freunde.js), read and written in one
 * place. Each write returns the value before, for Undo.
 */
import { db as appDb } from '../db.js';
import { ME_KEY, ASKS_KEY, NOTES_KEY, SHELF_KEY, GEAR_KEY } from './freunde.js';

export const FRIEND_KEYS = [ME_KEY, ASKS_KEY, NOTES_KEY, SHELF_KEY, GEAR_KEY];

export async function readKey(key, fallback, db = appDb) {
  return (await db.settings.get(key))?.value ?? fallback;
}

/** fn(before) → after; written in one transaction; returns before. */
export async function changeKey(key, fallback, fn, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const before = (await db.settings.get(key))?.value ?? fallback;
    await db.settings.put({ key, value: fn(before) });
    return before;
  });
}

export const putKey = (key, value, db = appDb) => db.settings.put({ key, value });
