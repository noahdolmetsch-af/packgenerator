/**
 * v0.24.1 (Noah 5a): writing a change to several gear items at once ("Select" in the Gear list).
 * Every change is one Dexie transaction and returns a snapshot of the exact records before it,
 * which `undoBulk` writes back ("Undo"). The new records come from the pure helpers in gear.js.
 */
import { bulkDelete } from '../gear.js';
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
