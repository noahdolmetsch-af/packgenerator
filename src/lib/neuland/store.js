/**
 * «Neuland»: reading and saving the state (db.settings 'neuland', in the backup) and putting
 * everything together: the person's data → the collections with what was reached and when.
 */
import { NEULAND_KEY, stateOf, collectionsOf, itemsOf, tracksOf, detect, visitedOf, defOf, DEFAULT_HOME } from './neuland.js';
import { loadBase } from './load.js';
import { areaAt, gridOf } from './geo.js';
import { localDay } from '../localday.js';
import { splitNeuland } from './split.js';

export async function readState(db) {
  return stateOf((await db.settings.get(NEULAND_KEY))?.value);
}
export async function saveState(db, state) {
  await splitNeuland(db); // an old «Neuland des Jahres» list under the same setting moves out first, so it is never overwritten
  // a plain copy: IndexedDB cannot store a reactive proxy
  await db.settings.put({ key: NEULAND_KEY, value: JSON.parse(JSON.stringify(stateOf(state))) });
}

/** The canton of a place { lat, lon } (cantons loaded), or null. */
export async function cantonAt(place) {
  if (!place || !Number.isFinite(+place.lat) || !Number.isFinite(+place.lon)) return null;
  const cantons = await loadBase('cantons');
  const i = areaAt(+place.lon, +place.lat, cantons, gridOf(cantons, 0.1));
  return i < 0 ? null : cantons[i].id;
}

/** The person's data Neuland reads (only Dexie reads, so a liveQuery can watch it). */
export async function readRaw(db) {
  const [rec, trips, rides, activities, homeRec] = await Promise.all([
    db.settings.get(NEULAND_KEY),
    db.trips.toArray(),
    db.rides.toArray(),
    db.activities ? db.activities.toArray() : [],
    db.settings.get('homePlace'),
  ]);
  return { value: rec?.value ?? null, trips, rides, activities, homePlace: homeRec?.value ?? null };
}

/**
 * Everything for the page and «Was war neu?». only: collection ids to load (default: all switched
 * on). → { state, home, tracks, all, collections: [{ id, builtIn, on, name, title, kind, map, items, hidden, visited, found }] }
 */
export async function computeFrom(raw, { today = localDay(), only = null } = {}) {
  const state = stateOf(raw.value);
  const all = collectionsOf(state);
  const want = all.filter((c) => (only ? only.includes(c.id) : c.on));
  const bases = await Promise.all(want.map((c) => loadBase(c.id)));
  const tracks = tracksOf({ trips: raw.trips, rides: raw.rides, activities: raw.activities, lines: raw.lines ?? [], today }); // raw.lines: more lines from elsewhere (package S «Reise-Spur» allLines)
  const parts = want.map((c, i) => {
    const def = defOf(c.id);
    const { items, hidden } = itemsOf(state, c.id, bases[i]);
    return { ...c, kind: def?.kind ?? 'point', radius: def?.radius, map: def?.map ?? null, items, hidden };
  });
  const found = detect(parts, tracks);
  const collections = parts.map((p) => ({ ...p, found: found[p.id] ?? {}, visited: visitedOf(state, p.id, p.items, found) }));
  const home = state.home ?? (await cantonAt(raw.homePlace)) ?? DEFAULT_HOME;
  return { state, home, tracks, collections, all };
}

export async function computeNeuland(db, opts = {}) {
  return computeFrom(await readRaw(db), opts);
}
