// v0.24.1 (Noah 5a): several gear items at once: change the category (IDs stay), move to the
// wishlist or back, delete (also off every trip and template), and undo each of them.
// All data here is fictional (test_data_gtp_…).
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { bulkCategory, bulkOwnership, bulkDelete, itemsInUse, namesList } from '../src/lib/gear.js';
import { saveItems, deletePlan, deleteItems, undoBulk } from '../src/lib/gear/bulk.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const item = (id, extra = {}) => ({ id, name: `test_data_gtp_ ${id}`, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], kits: [], ...extra });
const items = [item('EL01'), item('EL02', { category: 'light' }), item('EL03', { ownership: 'wishlist' }), item('SL01', { category: 'sleep' })];
const trips = [
  { id: 'test_data_gtp_trip1', title: 'A', entries: [{ itemId: 'EL01', slot: 'top', qty: 1, packed: true }, { itemId: 'SL01', slot: 'seat', qty: 1, packed: false }], ready: [{ id: 'r1', label: 'x', done: false }, { id: 'r2', label: 'old', itemId: 'EL01', done: true }] },
  { id: 'test_data_gtp_trip2', title: 'B', entries: [{ itemId: 'SL01', slot: 'seat', qty: 1, packed: false }], ready: [] },
];
const templates = [
  { id: 'tpl1', name: 'T1', entries: [{ itemId: 'EL02', slot: 'top', qty: 1 }, { itemId: 'SL01', slot: 'seat', qty: 2 }] },
  { id: 'tpl2', name: 'T2', entries: [{ itemId: 'SL01', slot: 'seat', qty: 1 }] },
];

describe('bulk changes (pure)', () => {
  it('changes the category and keeps every ID and field', () => {
    const out = bulkCategory(items, ['EL01', 'EL02', 'SL01'], 'light', 'NOW');
    // EL02 is already in Lights: nothing to change there.
    expect(out.map((i) => [i.id, i.category])).toEqual([['EL01', 'light'], ['SL01', 'light']]);
    expect(out[0]).toEqual({ ...items[0], category: 'light', updatedAt: 'NOW' });
  });

  it('moves to the wishlist or back, only what changes', () => {
    expect(bulkOwnership(items, ['EL01', 'EL03'], 'wishlist', 'NOW').map((i) => i.id)).toEqual(['EL01']);
    // v0.44.0: a wish that becomes owned keeps the day it was bought (the review of 12 months).
    expect(bulkOwnership(items, ['EL01', 'EL03'], 'owned', 'NOW')).toEqual([{ ...items[2], ownership: 'owned', boughtAt: 'NOW', updatedAt: 'NOW' }]);
  });

  it('knows which items are on a trip or a template', () => {
    expect(itemsInUse(['EL01', 'EL02', 'EL03'], trips, templates)).toEqual(['EL01', 'EL02']);
    expect(itemsInUse(['EL03'], trips, templates)).toEqual([]);
  });

  it('deleting takes the items off trips (entries and old ready rows) and templates', () => {
    const plan = bulkDelete(['EL01', 'EL02'], trips, templates);
    expect(plan.used).toEqual(['EL01', 'EL02']);
    expect(plan.trips.map((t) => t.id)).toEqual(['test_data_gtp_trip1']);
    expect(plan.trips[0].entries.map((e) => e.itemId)).toEqual(['SL01']);
    expect(plan.trips[0].ready.map((r) => r.id)).toEqual(['r1']);
    expect(plan.templates.map((t) => t.entries.map((e) => e.itemId))).toEqual([['SL01'], ['SL01']]);
    expect(plan.templates[1]).toBe(templates[1]); // untouched templates stay the same object
    // Nothing on a trip or template: nothing else changes.
    expect(bulkDelete(['EL03'], trips, templates)).toEqual({ ids: ['EL03'], used: [], trips: [], templates: null });
  });

  it('names at most five in the confirm text', () => {
    expect(namesList(['a', 'b'])).toBe('a, b');
    expect(namesList(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])).toBe('a, b, c, d, e and 3 more');
    lang.v = 'de';
    expect(namesList(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('a, b, c, d, e und 1 weitere');
  });
});

describe('bulk changes in the database, with undo', () => {
  let n = 0;
  async function fresh() {
    const db = createDb(`gearselect-${++n}`);
    await db.items.bulkPut(structuredClone(items));
    await db.trips.bulkPut(structuredClone(trips));
    await db.settings.put({ key: 'templates', value: structuredClone(templates) });
    return db;
  }

  it('category change and undo', async () => {
    const db = await fresh();
    const snap = await saveItems(db, bulkCategory(items, ['EL01', 'SL01'], 'tools'));
    expect((await db.items.toArray()).map((i) => [i.id, i.category])).toEqual([['EL01', 'tools'], ['EL02', 'light'], ['EL03', 'elec'], ['SL01', 'tools']]);
    expect((await db.trips.get('test_data_gtp_trip1')).entries.map((e) => e.itemId)).toEqual(['EL01', 'SL01']);
    await undoBulk(db, snap);
    expect(await db.items.toArray()).toEqual(items);
  });

  it('delete removes items, trip entries and template entries; undo restores the exact records', async () => {
    const db = await fresh();
    expect((await deletePlan(db, ['EL01', 'EL02', 'EL03'])).used).toEqual(['EL01', 'EL02']);
    const snap = await deleteItems(db, ['EL01', 'EL02', 'EL03']);
    expect((await db.items.toArray()).map((i) => i.id)).toEqual(['SL01']);
    expect((await db.trips.get('test_data_gtp_trip1')).entries.map((e) => e.itemId)).toEqual(['SL01']);
    expect((await db.settings.get('templates')).value[0].entries.map((e) => e.itemId)).toEqual(['SL01']);
    expect(snap.trips.map((t) => t.id)).toEqual(['test_data_gtp_trip1']);
    await undoBulk(db, snap);
    expect(await db.items.toArray()).toEqual(items);
    expect(await db.trips.toArray()).toEqual(trips);
    expect((await db.settings.get('templates')).value).toEqual(templates);
  });
});
