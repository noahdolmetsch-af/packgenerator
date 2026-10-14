/**
 * SN5+ «Favoriten» (Noah 13.10.2026, answers 1a 2a 3a): more on the favourites page.
 *
 * - F1 favBars: each trip kind's favourite weight against the other kinds; the heaviest is the full bar.
 * - F2 oftenTaken: items that were on at least half of the trips of one kind (and on at least
 *   MIN_TRIPS trips of it), not starred yet. «Nicht mehr vorschlagen» keeps the item's ID in the
 *   settings record FAV_OFF.
 * - F3 lastTrips: the last trip each item was on («zuletzt dabei»).
 * - F4 favBlock: «Als Baustein speichern» makes a COPY: an own building block (sets.js) whose record
 *   remembers the trip kind and the favourites of that kind at that moment (record.fav = { domain, ids }).
 *   favDrift says what changed in the stars since; applyDrift takes it over, keepDrift only forgets it.
 *
 * Everything is a suggestion: nothing changes before a tap, and every tap has an Undo.
 * Pure functions first; the small writes at the end (one transaction each, with an undo snapshot
 * for bulk.js undoBulk).
 */
import { isInventory } from './gear.js';
import { itemDomains, domainOf } from './domains.js';
import { SETS_KEY, addSet } from './sets.js';
import { intoSet, outOfSet, refreshTemplates } from './gear/assign.js';

/** Settings key: the item IDs that «Oft dabei» does not suggest any more. */
export const FAV_OFF = 'favSuggestOff';
/** «Oft dabei» needs at least this many trips of a kind (one trip says nothing about «often»). */
export const MIN_TRIPS = 2;
/** At most this many «Oft dabei» rows. */
export const MAX_OFTEN = 8;

/* ---------- F1 the bar per trip kind ---------- */

/** groups: favoritesByDomain → { [key]: share 0..1 }; the heaviest kind is 1, a kind without weight 0. */
export function favBars(groups) {
  const max = Math.max(0, ...groups.map((g) => g.grams ?? 0));
  return Object.fromEntries(groups.map((g) => [g.key, max > 0 ? (g.grams ?? 0) / max : 0]));
}

/* ---------- the trips that happened ---------- */

/** Trips that took place: started by today, not skipped, with something packed. Newest first. */
export function pastTripsOf(trips, today) {
  return (trips ?? [])
    .filter((t) => !t.skipped && t.startDate && t.startDate <= today && (t.entries ?? []).length)
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || (a.title ?? '').localeCompare(b.title ?? ''));
}

/* ---------- F3 zuletzt dabei ---------- */

/** { [itemId]: { trip, date } }: the newest trip that took place with the item on it. */
export function lastTrips(trips, today) {
  const out = {};
  for (const trip of pastTripsOf(trips, today)) {
    for (const e of trip.entries) if (e?.itemId && !out[e.itemId]) out[e.itemId] = { trip, date: trip.startDate };
  }
  return out;
}

/* ---------- F2 oft dabei ---------- */

/**
 * The items often on the trips of a kind, without a star: [{ item, domain, n, of }], best share
 * first, at most `max`. «Often»: on at least half of the trips of that kind (Noah 2a), and the kind
 * has at least MIN_TRIPS trips. An item shows once, with the kind where its share is the highest.
 * off: item IDs not to suggest any more.
 */
export function oftenTaken(items, trips, today, { off = [], min = MIN_TRIPS, max = MAX_OFTEN } = {}) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const skip = new Set(off ?? []);
  const kinds = new Map(); // domain → trips
  for (const t of pastTripsOf(trips, today)) {
    const d = domainOf(t);
    kinds.set(d, [...(kinds.get(d) ?? []), t]);
  }
  const best = new Map(); // itemId → row
  for (const [domain, list] of kinds) {
    if (list.length < min) continue;
    const count = new Map();
    for (const t of list) for (const id of new Set(t.entries.map((e) => e?.itemId).filter(Boolean))) count.set(id, (count.get(id) ?? 0) + 1);
    for (const [id, n] of count) {
      const item = byId.get(id);
      if (!item || item.favorite || !isInventory(item) || skip.has(id) || n * 2 < list.length) continue;
      const row = { item, domain, n, of: list.length };
      const was = best.get(id);
      if (!was || n / list.length > was.n / was.of || (n / list.length === was.n / was.of && n > was.n)) best.set(id, row);
    }
  }
  return [...best.values()].sort((a, b) => b.n / b.of - a.n / a.of || b.n - a.n || a.item.name.localeCompare(b.item.name)).slice(0, max);
}

/* ---------- F4 als Baustein ---------- */

/** The favourites of a trip kind now (IDs, sorted). */
export const favIdsOf = (items, domain) =>
  items
    .filter((i) => i.favorite && i.ownership !== 'gone' && itemDomains(i).includes(domain))
    .map((i) => i.id)
    .sort();

/**
 * A new own building block from the favourites of a kind: { value, key, items } (the new sets
 * value, its key, the changed item records) or { error } (sets.js addSet: 'empty' | 'taken').
 * ids: the favourites chosen in the window. The block remembers ALL favourites of the kind, so a
 * favourite left out now is no «change» later.
 */
export function favBlock(value, items, domain, ids, name, now = new Date().toISOString()) {
  const made = addSet(value, name);
  if (made.error) return made;
  const fav = { domain, ids: favIdsOf(items, domain), at: now };
  return { key: made.key, value: made.value.map((s) => (s.key === made.key ? { ...s, fav } : s)), items: intoSet(items, ids, made.key, now) };
}

/**
 * What changed in the stars of the block's kind since it was made: { add, drop, n, now }.
 * add: newly starred items not in the block yet; drop: items that lost their star and are still in
 * it. now: the favourites of the kind today (what the block remembers after a tap). set: the block
 * (allSets row or record, with fav); null when it was not made from the favourites.
 */
export function favDrift(set, items) {
  if (!set?.fav?.domain) return null;
  const was = new Set(set.fav.ids ?? []);
  const now = favIdsOf(items, set.fav.domain);
  const cur = new Set(now);
  const inBlock = (i) => (i.sets ?? []).includes(set.key);
  const add = items.filter((i) => cur.has(i.id) && !was.has(i.id) && !inBlock(i)).map((i) => i.id);
  const drop = items.filter((i) => was.has(i.id) && !cur.has(i.id) && inBlock(i)).map((i) => i.id);
  return { add, drop, n: add.length + drop.length, now };
}

/** The sets value with the block's remembered favourites set to `ids`. */
export const withFavIds = (value, key, ids, now = new Date().toISOString()) => (value ?? []).map((s) => (s.key === key && s.fav ? { ...s, fav: { ...s.fav, ids: [...ids], at: now } } : s));

/* ---------- writes ---------- */

/** «Speichern» in «Als Baustein speichern». Returns { key, snap } or { error }. */
export async function saveFavBlock(db, domain, ids, name) {
  return db.transaction('rw', db.items, db.settings, async () => {
    const rec = await db.settings.get(SETS_KEY);
    const items = await db.items.toArray();
    const res = favBlock(rec?.value ?? [], items, domain, ids, name);
    if (res.error) return { error: res.error };
    await db.settings.put({ key: SETS_KEY, value: res.value });
    if (res.items.length) await db.items.bulkPut(res.items);
    await refreshTemplates(db);
    return { key: res.key, snap: { sets: rec ?? null, items: items.filter((i) => res.items.some((c) => c.id === i.id)) } };
  });
}

/**
 * «übernehmen?» on a block made from the favourites: the new favourites in, the unstarred out, and
 * the block remembers today's favourites. keep = true only forgets the change (nothing moves).
 * Returns { snap, n } (n: items moved).
 */
export async function takeDrift(db, key, { keep = false } = {}) {
  return db.transaction('rw', db.items, db.settings, async () => {
    const rec = await db.settings.get(SETS_KEY);
    const set = (rec?.value ?? []).find((s) => s.key === key);
    const items = await db.items.toArray();
    const d = favDrift(set, items);
    if (!d) return { snap: null, n: 0 };
    const changed = keep ? [] : [...intoSet(items, d.add, key), ...outOfSet(items, d.drop, key)];
    await db.settings.put({ key: SETS_KEY, value: withFavIds(rec.value, key, d.now) });
    if (changed.length) await db.items.bulkPut(changed);
    if (changed.length) await refreshTemplates(db);
    return { snap: { sets: rec ?? null, items: items.filter((i) => changed.some((c) => c.id === i.id)) }, n: changed.length };
  });
}

/** «Nicht mehr vorschlagen» (and back): the settings record FAV_OFF. Returns the list before. */
export async function suggestOff(db, id, off = true) {
  const rec = await db.settings.get(FAV_OFF);
  const list = rec?.value ?? [];
  const next = off ? [...new Set([...list, id])] : list.filter((x) => x !== id);
  await db.settings.put({ key: FAV_OFF, value: next });
  return list;
}
