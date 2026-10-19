/**
 * Paket U «Rennen»: reading and writing the one settings record of the races (RACES_KEY, in the backup)
 * and the answers from outside kept on this device only (meta table, never in the backup).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { RACES_KEY, racesOf } from './race.js';

/** All races, live: { [tripId]: stored race }. */
export const racesQuery = () => liveQuery(async () => racesOf((await db.settings.get(RACES_KEY))?.value));

/**
 * Change one race: patch is an object (merged) or a function (stored → new stored). Returns the old
 * stored race (for Undo with putRace).
 */
export async function saveRace(tripId, patch) {
  let before;
  await db.transaction('rw', db.settings, async () => {
    const value = (await db.settings.get(RACES_KEY))?.value ?? {};
    const races = { ...racesOf(value) };
    before = races[tripId] ?? null;
    const cur = before ?? {};
    races[tripId] = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch };
    await db.settings.put({ key: RACES_KEY, value: { ...value, races } });
  });
  return before;
}

/** Put a stored race back as it was (Undo); null removes it (the trip is no longer a race here). */
export async function putRace(tripId, stored) {
  await db.transaction('rw', db.settings, async () => {
    const value = (await db.settings.get(RACES_KEY))?.value ?? {};
    const races = { ...racesOf(value) };
    if (stored == null) delete races[tripId];
    else races[tripId] = stored;
    await db.settings.put({ key: RACES_KEY, value: { ...value, races } });
  });
}

/** A cached answer from outside (OSM places, roads, weather) for this device: { at, data } or null. */
export async function cacheGet(key) {
  try {
    return (await db.meta.get(key)) ?? null;
  } catch {
    return null;
  }
}
export async function cacheSet(key, data) {
  try {
    await db.meta.put({ key, at: new Date().toISOString(), data });
  } catch (err) {
    console.error(err);
  }
}
/** Live cache entry. */
export const cacheQuery = (key) => liveQuery(() => db.meta.get(key));
