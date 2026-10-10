/**
 * v0.67.0 (answers 5a, 6a): the helper's maintenance suggestions for one bike, with the local cache.
 *
 * The cache lives in db.meta "helper.care" (never exported): { bikes: { [bikeId]: { hash, day,
 * result } }, done: [{ bikeId, key, hash, date, km, status }], dismissed: [{ bikeId, key, hash }] }.
 * The key is the bike plus a hash of its data (km, parts, rides, notes); a change of the data asks
 * again, at most once a day per bike (logic.js careRefresh). «Erledigt» is remembered with the date
 * and km and goes to the next request as a check done.
 */
import { db } from '../db.js';
import { localDay } from '../localday.js';
import { isDe } from '../i18n.svelte.js';
import { ask } from './client.svelte.js';
import { maintenancePayload } from './payload.js';
import { careHash, careRefresh } from './logic.js';

export const CARE_KEY = 'helper.care';
const empty = () => ({ bikes: {}, done: [], dismissed: [] });

export async function careState() {
  const rec = await db.meta.get(CARE_KEY).catch(() => null);
  return { ...empty(), ...(rec?.value ?? {}) };
}
async function saveState(state) {
  await db.meta.put({ key: CARE_KEY, value: state });
}

/** The request of one bike, from the database (tasks, notes, trips, rides). */
export async function careInput(bike, today = localDay()) {
  const [tasks, notes, trips, rides, state] = await Promise.all([db.maintenance.toArray(), db.notes.toArray(), db.trips.toArray(), db.rides.toArray(), careState()]);
  return maintenancePayload(bike, { tasks, notes, trips, rides, checks: state.done, today, lang: isDe() ? 'de' : 'en' });
}

/**
 * The suggestions of one bike: from the cache when the data is the same (or already asked today),
 * else asked anew. Returns { result, hash, state, error }.
 */
// One request per bike at a time: a second call waits for the first and then finds it in the cache.
const inflight = new Map();
export async function careSuggestions(bike, opts = {}) {
  while (inflight.has(bike.id)) await inflight.get(bike.id).catch(() => null);
  const run = suggestionsOf(bike, opts);
  inflight.set(bike.id, run);
  try {
    return await run;
  } finally {
    inflight.delete(bike.id);
  }
}
async function suggestionsOf(bike, { today = localDay() } = {}) {
  const input = await careInput(bike, today);
  const hash = careHash(input);
  const state = await careState();
  const cache = state.bikes[bike.id] ?? null;
  const how = careRefresh(cache, hash, today);
  if (how !== 'ask') return { result: cache.result, hash: cache.hash, state, error: null };
  if (!input.parts.length) return { result: { parts: [] }, hash, state, error: null };
  const r = await ask('maintenance', input);
  if (!r.ok) return { result: cache?.result ?? null, hash: cache?.hash ?? hash, state, error: r.error };
  const next = await careState();
  next.bikes = { ...next.bikes, [bike.id]: { hash, day: today, result: r.result } };
  await saveState(next);
  return { result: r.result, hash, state: next, error: null };
}

/** «Erledigt» (done) or × (dismissed): the row goes until the bike's data changes. */
export async function careMark(kind, { bikeId, key, hash, km = null, status = null }) {
  const state = await careState();
  const row = kind === 'done' ? { bikeId, key, hash, date: localDay(), km, status } : { bikeId, key, hash };
  state[kind] = [...(state[kind] ?? []).filter((x) => !(x.bikeId === bikeId && x.key === key && x.hash === hash)), row].slice(-200);
  await saveState(state);
  return state;
}
