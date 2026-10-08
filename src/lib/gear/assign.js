/**
 * v0.26.0 (Noah 2a, AP11): assign many items at once, from "Select" in Gear or "Assign…" in the
 * item dialog: into a set, out of a set, a default bag, into a template, onto the trip.
 *
 * The pure helpers compute only what really changes, so a repeated assignment changes nothing.
 * The write functions do one Dexie transaction each and return a snapshot of the exact records
 * before it, which bulk.js undoBulk writes back ("Undo"): items, the template setting, the sets
 * setting or the trip.
 */
import { isInventory } from '../gear.js';
import { slotFor, addEntries } from '../trips.js';
import { TEMPLATES_KEY } from '../templates.js';
import { SETS_KEY, addSet, deleteSetPlan, renameSet, setQty } from '../sets.js';

const pickOf = (ids) => new Set(ids);

/** The picked items put into a set; only the ones not in it yet. */
export function intoSet(items, ids, key, now = new Date().toISOString()) {
  const pick = pickOf(ids);
  return items.filter((i) => pick.has(i.id) && !i.sets?.includes(key)).map((i) => ({ ...i, sets: [...(i.sets ?? []), key], updatedAt: now }));
}

/** The picked items taken out of a set; only the ones in it. */
export function outOfSet(items, ids, key, now = new Date().toISOString()) {
  const pick = pickOf(ids);
  return items.filter((i) => pick.has(i.id) && i.sets?.includes(key)).map((i) => ({ ...i, sets: i.sets.filter((s) => s !== key), updatedAt: now }));
}

/** The picked items get a default bag (BAGS key); only the ones with another bag. Trips keep their places. */
export function withBag(items, ids, bag, now = new Date().toISOString()) {
  const pick = pickOf(ids);
  return items.filter((i) => pick.has(i.id) && i.defaultBag !== bag).map((i) => ({ ...i, defaultBag: bag, updatedAt: now }));
}

/**
 * Where an item goes in a template: worn on me; with the template's bags its usual bag via
 * slotFor; a template without bags (e.g. made from a kit) keeps the usual bag itself, which
 * tripFromTemplate later puts into the bike's matching bag (or slotFor's choice).
 */
export function templateSlot(item, setup) {
  if (item.role === 'worn') return 'body';
  const hasBags = Object.values(setup ?? {}).some(Boolean);
  return hasBags ? slotFor(item.defaultBag, setup) : item.defaultBag || 'seat';
}

/**
 * The picked items into one template: missing ones as entries in their place; no duplicates.
 * Returns { list (the new template list), added (IDs) }; list is the same array when nothing changes.
 */
export function intoTemplate(templates, tplId, items, ids) {
  const tpl = templates.find((x) => x.id === tplId);
  if (!tpl) return { list: templates, added: [] };
  const pick = pickOf(ids);
  const have = new Set((tpl.entries ?? []).map((e) => e.itemId));
  const add = items.filter((i) => pick.has(i.id) && isInventory(i) && !have.has(i.id));
  if (!add.length) return { list: templates, added: [] };
  let entries = tpl.entries ?? [];
  for (const i of add) entries = addEntries(entries, [i.id], templateSlot(i, tpl.setup));
  return { list: templates.map((x) => (x.id === tplId ? { ...x, entries } : x)), added: add.map((i) => i.id) };
}

/**
 * The picked items onto a trip, like "Add material" with ticks (addEntries): only inventory
 * items not on it yet, each in its usual bag; existing entries (and what is packed) stay.
 * slotOf(item): the place (default: worn on me, else slotFor with the trip's bags).
 * skip: IDs that never go into a bag (the bags themselves, the bike's fixtures), as in Pack.
 * Returns { entries, added }.
 */
export function ontoTrip(trip, items, ids, slotOf = null, skip = new Set()) {
  const pick = pickOf(ids);
  // A trip without a bike (v0.21.0, trip.packs) puts them into its first bag.
  const slot = slotOf ?? ((i) => (Array.isArray(trip.packs) ? trip.packs[0]?.key ?? 'body' : i.role === 'worn' ? 'body' : slotFor(i.defaultBag, trip.setup)));
  const have = new Set((trip.entries ?? []).map((e) => e.itemId));
  let entries = trip.entries ?? [];
  const added = [];
  for (const i of items) {
    if (!pick.has(i.id) || !isInventory(i) || have.has(i.id) || skip.has(i.id)) continue;
    have.add(i.id);
    added.push(i.id);
    entries = addEntries(entries, [i.id], slot(i), { packed: false });
  }
  return { entries, added };
}

/**
 * The trip Pack shows: the one last opened on this device (chosen), else the next upcoming
 * one that is not skipped, else the newest. Same rule as Pack.svelte. null without trips.
 */
export function currentTrip(trips, chosen, today) {
  const byDate = [...trips].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  return (
    byDate.find((t) => t.id === chosen) ??
    byDate.filter((t) => !t.skipped && !t.finished && (t.startDate ?? '') >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ??
    byDate[0] ??
    null
  );
}

/**
 * v0.26.0 (Noah 7a): the planned trips to choose from for "Onto a trip": not skipped, not
 * finished, from today on (or without a date), the next one first.
 */
export function upcomingTrips(trips, today) {
  return trips
    .filter((t) => !t.skipped && !t.finished && (!t.startDate || t.startDate >= today))
    .sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'));
}

/** Where an item is now (AP11 "show the existing assignment"): { sets (keys), templates (names), trip (bool) }. */
export function assignmentOf(item, templates = [], trip = null) {
  return {
    sets: [...(item.sets ?? [])],
    templates: templates.filter((x) => (x.entries ?? []).some((e) => e.itemId === item.id)).map((x) => x.name),
    trip: !!trip && (trip.entries ?? []).some((e) => e.itemId === item.id),
  };
}

/* ---------- writes (one transaction each, with an undo snapshot) ---------- */

/** Items into a set; with newName a new own set is made first. Returns { snap, n, key } or { error }. */
export async function assignSet(db, ids, key, { newName = null, out = false } = {}) {
  return db.transaction('rw', db.items, db.settings, async () => {
    const snap = {};
    let setKey = key;
    if (newName != null) {
      const rec = await db.settings.get(SETS_KEY);
      const made = addSet(rec?.value ?? [], newName);
      if (made.error) return { error: made.error };
      snap.sets = rec ?? null;
      setKey = made.key;
      await db.settings.put({ key: SETS_KEY, value: made.value });
    }
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    const changed = out ? outOfSet(items, ids, setKey) : intoSet(items, ids, setKey);
    snap.items = items.filter((i) => changed.some((c) => c.id === i.id));
    if (changed.length) await db.items.bulkPut(changed);
    return { snap, n: changed.length, key: setKey };
  });
}

/** A default bag for the items. Returns { snap, n }. */
export async function assignBag(db, ids, bag) {
  return db.transaction('rw', db.items, async () => {
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    const changed = withBag(items, ids, bag);
    if (changed.length) await db.items.bulkPut(changed);
    return { snap: { items: items.filter((i) => changed.some((c) => c.id === i.id)) }, n: changed.length };
  });
}

/** Items into a template. Returns { snap (the template setting before), n }. */
export async function assignTemplate(db, ids, tplId) {
  return db.transaction('rw', db.items, db.settings, async () => {
    const setting = await db.settings.get(TEMPLATES_KEY);
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    const { list, added } = intoTemplate(setting?.value ?? [], tplId, items, ids);
    if (!added.length) return { snap: {}, n: 0 };
    await db.settings.put({ ...(setting ?? {}), key: TEMPLATES_KEY, value: list });
    return { snap: { templates: setting ?? null }, n: added.length };
  });
}

/** Items onto a trip. Returns { snap (the trip before), n }. Bags and the bike's fixtures stay off (as in Pack). */
export async function assignTrip(db, ids, tripId) {
  return db.transaction('rw', db.items, db.trips, db.containers, db.bikes, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return { snap: {}, n: 0 };
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    const bike = trip.bikeId ? await db.bikes.get(trip.bikeId) : null;
    const skip = new Set([...(await db.containers.toArray()).map((c) => c.itemId).filter(Boolean), ...(bike?.fixtures ?? [])]);
    const { entries, added } = ontoTrip(trip, items, ids, null, skip);
    if (!added.length) return { snap: {}, n: 0 };
    await db.trips.put({ ...trip, entries });
    return { snap: { trips: [trip] }, n: added.length };
  });
}

/** Change the sets setting (rename, amount). fn(value) → { value } or { error }. Returns { snap } or { error }. */
export async function editSets(db, fn) {
  return db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(SETS_KEY);
    const res = fn(rec?.value ?? []);
    if (res.error) return { error: res.error };
    await db.settings.put({ key: SETS_KEY, value: res.value });
    return { snap: { sets: rec ?? null } };
  });
}
export const renameSetIn = (db, key, name) => editSets(db, (v) => renameSet(v, key, name));
export const setQtyIn = (db, key, itemId, n) => editSets(db, (v) => ({ value: setQty(v, key, itemId, n) }));

/** Delete an own set: its record goes and every item loses the key, in one transaction. Returns { snap, n }. */
export async function deleteSet(db, key) {
  return db.transaction('rw', db.items, db.settings, async () => {
    const rec = await db.settings.get(SETS_KEY);
    const items = await db.items.toArray();
    const plan = deleteSetPlan(rec?.value ?? [], items, key);
    if (!plan) return { error: 'builtIn' };
    await db.settings.put({ key: SETS_KEY, value: plan.value });
    if (plan.items.length) await db.items.bulkPut(plan.items);
    return { snap: { sets: rec ?? null, items: items.filter((i) => plan.items.some((c) => c.id === i.id)) }, n: plan.items.length };
  });
}
