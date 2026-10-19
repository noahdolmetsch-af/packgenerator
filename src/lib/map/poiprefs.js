/**
 * «Orte auf der Karte»: the one settings record 'poi-search' = { on, mode, radiusKm, starred } (in the
 * backup: your chips and your starred places) and the store of the answers (db.meta, this device only).
 * The pure rules are in poisearch.js.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { SETTINGS_KEY, prefsOf } from './poisearch.js';

/** The prefs, live. */
export const prefsQuery = () => liveQuery(async () => prefsOf((await db.settings.get(SETTINGS_KEY))?.value));

/** Change the prefs: fn(prefs) → new prefs. Returns the prefs before (for Undo). */
export async function savePrefs(fn) {
  let before;
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(SETTINGS_KEY);
    before = prefsOf(rec?.value);
    await db.settings.put({ key: SETTINGS_KEY, value: prefsOf(fn(before)) });
  });
  return before;
}

/** The answers' store: db.meta ({ get(key), put({ key, value }) }). */
export const placeStore = {
  get: (key) => db.meta.get(key),
  put: (rec) => db.meta.put(rec),
};
