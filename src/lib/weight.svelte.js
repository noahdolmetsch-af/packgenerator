/** TR6: the weight entries, live for every page (weight.js has the rules). */
import { liveQuery } from 'dexie';
import { db as appDb } from './db.js';
import { WEIGHT_KEY, RIDER_KEY, entriesOf, withEntry, latestOf } from './weight.js';

export const weight = $state({ loaded: false, entries: [] });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => (await appDb.settings.get(WEIGHT_KEY))?.value ?? null).subscribe({
    next: (v) => Object.assign(weight, { entries: entriesOf(v), loaded: true }),
    error: () => (weight.loaded = true),
  });
}

/** Saves one day's weight (kg null removes that day's entry). */
export async function saveWeight(day, kg, db = appDb) {
  await db.transaction('rw', db.settings, async () => {
    const now = entriesOf((await db.settings.get(WEIGHT_KEY))?.value);
    const entries = withEntry(now, day, kg);
    await db.settings.put({ key: WEIGHT_KEY, value: { entries } });
    // the newest weight is also the body weight Packen and Velos › Setup read
    const last = latestOf(entries);
    if (last) await db.settings.put({ key: RIDER_KEY, value: Math.round(last.kg * 1000) });
  });
}
/** Removes every entry. */
export const clearWeight = (db = appDb) => db.settings.delete(WEIGHT_KEY);
