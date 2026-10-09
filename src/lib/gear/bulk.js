/**
 * v0.24.1 (Noah 5a): writing a change to several gear items at once ("Select" in the Gear list).
 * Every change is one Dexie transaction and returns a snapshot of the exact records before it,
 * which `undoBulk` writes back ("Undo"). The new records come from the pure helpers in gear.js.
 */
import { bulkDelete, bulkCategory } from '../gear.js';
import { TEMPLATES_KEY, saveTemplates } from '../templates.js';
import { SETS_KEY } from '../sets.js';

/** Save changed item records (category or ownership). Returns the undo snapshot. */
export async function saveItems(db, changed) {
  return db.transaction('rw', db.items, async () => {
    const before = (await db.items.bulkGet(changed.map((i) => i.id))).filter(Boolean);
    await db.items.bulkPut(changed);
    return { items: before };
  });
}

/**
 * What deleting would touch, read fresh from the database (for the confirm text):
 * { used: IDs on a trip or template, trips, templates }.
 */
export async function deletePlan(db, ids) {
  const trips = await db.trips.toArray();
  const templates = (await db.settings.get(TEMPLATES_KEY))?.value ?? [];
  return bulkDelete(ids, trips, templates);
}

/**
 * Delete the items and take them off every trip and template, all in one transaction.
 * Returns the undo snapshot: the items, the trips before, and the template setting before.
 */
export async function deleteItems(db, ids) {
  return db.transaction('rw', db.items, db.trips, db.settings, db.containers, async () => {
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    // A bag on a bike that is this item keeps its place but loses the link (no dangling ID).
    const gone = new Set(ids);
    const bagsBefore = (await db.containers.toArray()).filter((c) => c.itemId && gone.has(c.itemId));
    if (bagsBefore.length) await db.containers.bulkPut(bagsBefore.map((c) => ({ ...c, itemId: null })));
    const tripsBefore = await db.trips.toArray();
    const setting = await db.settings.get(TEMPLATES_KEY);
    const plan = bulkDelete(ids, tripsBefore, setting?.value ?? []);
    const changedIds = new Set(plan.trips.map((t) => t.id));
    await db.items.bulkDelete(ids);
    if (plan.trips.length) await db.trips.bulkPut(plan.trips);
    if (plan.templates) await saveTemplates(db, plan.templates); // v0.39.0: linked templates drop them from their extras
    return {
      items,
      trips: tripsBefore.filter((t) => changedIds.has(t.id)),
      ...(plan.templates ? { templates: setting } : {}),
      ...(bagsBefore.length ? { containers: bagsBefore } : {}),
    };
  });
}

/** Undo: write the records of a snapshot back exactly as they were. */
export async function undoBulk(db, snap) {
  return db.transaction('rw', [db.items, db.trips, db.settings, db.containers, db.bikes, db.learnings], async () => {
    if (snap.items?.length) await db.items.bulkPut(snap.items);
    if (snap.containers?.length) await db.containers.bulkPut(snap.containers);
    // v0.37.1 (Zusammenlegen, mergeitems.js): bike fixtures and learnings too.
    if (snap.bikes?.length) await db.bikes.bulkPut(snap.bikes);
    if (snap.learnings?.length) await db.learnings.bulkPut(snap.learnings);
    if (snap.trips?.length) await db.trips.bulkPut(snap.trips);
    if ('templates' in snap) {
      if (snap.templates) await db.settings.put(snap.templates);
      else await db.settings.delete(TEMPLATES_KEY);
    }
    // v0.26.0 (Noah 2a): own sets and set amounts (settings "sets"), null = there was none.
    if ('sets' in snap) {
      if (snap.sets) await db.settings.put(snap.sets);
      else await db.settings.delete(SETS_KEY);
    }
  });
}

/*
 * v0.43.0 "Mehrfachauswahl" (Noah): more changes for the selected items. The pure helpers return
 * only the records that really change; changeItems writes them in one transaction (one Undo).
 */

/**
 * The selected items into an area (item.domains). only: the area replaces the others ("Only this
 * area"); else it is added ("Also this area"). An item without areas counts as bikepacking.
 */
export function bulkArea(items, ids, key, { only = false, now = new Date().toISOString() } = {}) {
  const pick = new Set(ids);
  const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  return items
    .filter((i) => pick.has(i.id))
    .map((i) => {
      const had = i.domains?.length ? i.domains : ['bikepacking'];
      const domains = only ? [key] : had.includes(key) ? had : [...had, key];
      return same(had, domains) && i.domains?.length ? null : { ...i, domains, updatedAt: now };
    })
    .filter(Boolean);
}

/** v0.43.0: the selected items archived (ownership 'gone'), the same as "Archive" on one row. */
export function bulkArchive(items, ids, now = new Date().toISOString()) {
  const pick = new Set(ids);
  return items.filter((i) => pick.has(i.id) && i.ownership !== 'gone').map((i) => ({ ...i, ownership: 'gone', updatedAt: now }));
}

/**
 * v0.43.0: the wardrobe's layer or body zone for many pieces at once. patch: { layer } or { zone }
 * (the stored zone value, e.g. 'torso'). Only the items that change.
 */
export function bulkWear(items, ids, patch, now = new Date().toISOString()) {
  const pick = new Set(ids);
  const keys = Object.keys(patch);
  return items.filter((i) => pick.has(i.id) && keys.some((k) => (i[k] ?? null) !== patch[k])).map((i) => ({ ...i, ...patch, updatedAt: now }));
}

/** Read the selected items fresh, change them with fn(items) and save in one transaction. Returns { snap, n }. */
export async function changeItems(db, ids, fn) {
  return db.transaction('rw', db.items, async () => {
    const items = (await db.items.bulkGet(ids)).filter(Boolean);
    const changed = fn(items);
    if (!changed.length) return { snap: null, n: 0 };
    await db.items.bulkPut(changed);
    return { snap: { items: items.filter((i) => changed.some((c) => c.id === i.id)) }, n: changed.length };
  });
}
export const archiveItems = (db, ids) => changeItems(db, ids, (items) => bulkArchive(items, ids));
export const areaItems = (db, ids, key, only = false) => changeItems(db, ids, (items) => bulkArea(items, ids, key, { only }));
export const categoryItems = (db, ids, category) => changeItems(db, ids, (items) => bulkCategory(items, ids, category));
export const wearItems = (db, ids, patch) => changeItems(db, ids, (items) => bulkWear(items, ids, patch));
