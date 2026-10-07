// v0.23.0 (AP09): changing the category of an item keeps its ID and every link to it:
// trip entries (qty, slot, packed), templates, kits, bag links and their weight, weight checks,
// favourites, learnings and debriefs. Also after a backup export → import.
// Runs inside vitest because i18n uses $state. All data here is fictional (test_data_gtp_…).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { itemDraft, itemRecord, nextId, gearStats, groupByCategory, favouriteCounts, matches } from '../src/lib/gear.js';
import { containerWeight, bikeSetup } from '../src/lib/bikes.js';
import { tripStats } from '../src/lib/trips.js';
import { planningGroups } from '../src/lib/preparation.js';
import { loadTemplates, saveTemplates, tripFromTemplate } from '../src/lib/templates.js';
import { tipsByItem } from '../src/lib/debrief.js';

const ID = 'test_data_gtp_TA90';
let n = 0;
let db;

/** An item with every field the dialog knows set, so a lost field shows up. */
const fullItem = () => ({
  id: ID,
  name: 'test_data_gtp_ Roll bag',
  nameDe: 'test_data_gtp_ Rolltasche',
  brand: 'Testbrand',
  model: 'Blue 8 L',
  category: 'bags',
  weightG: 300,
  qty: 1,
  weightStatus: 'logbook',
  weightNote: 'from the logbook',
  carry: 'bike',
  defaultBag: 'bar',
  ownership: 'owned',
  role: 'standard',
  always: true,
  favorite: true,
  favNote: 'never let me down',
  lists: ['test_data_gtp_list'],
  sets: ['base'],
  kits: ['test_data_gtp_K'],
  domains: ['bikepacking', 'weekend'],
  ride: 'daily',
  rain: 'yes',
  coldBelow: 10,
  perHours: 3,
  waterL: 0.5,
  maxQty: 2,
  replaces: 'test_data_gtp_KL90',
  altFor: 'test_data_gtp_KL91',
  volumeL: 8,
  learning: 'Strap it tight',
  note: 'fictional test item',
  reviewedAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
});

const bike = { id: 'test_data_gtp_bike', name: 'test_data_gtp_ Bike', weightG: 10000, slots: ['bar', 'seat'], setup: { bar: 'bag-test_data_gtp_roll', seat: null } };
const container = { id: 'bag-test_data_gtp_roll', name: 'Roll bag', slot: 'bar', volumeL: 8, itemId: ID, pieces: 2, note: '' };
const trip = {
  id: 'test_data_gtp_trip',
  domain: 'bikepacking',
  title: 'test_data_gtp_ Trip',
  startDate: '2026-10-10',
  days: 2,
  bikeId: bike.id,
  setup: { ...bike.setup },
  entries: [{ itemId: ID, slot: 'bar', qty: 2, packed: true }],
  ready: [],
};
const template = { id: 'test_data_gtp_tpl', name: 'test_data_gtp_ Weekend', setup: { bar: container.id }, entries: [{ itemId: ID, slot: 'bar', qty: 2 }], ready: [], sets: {} };

/** "Save" in the item dialog with the category changed, exactly like ItemDialog.svelte. */
async function changeCategory(id, category) {
  const items = await db.items.toArray();
  const item = items.find((i) => i.id === id);
  const draft = { ...itemDraft(item), category };
  const record = itemRecord(draft, { item, items, weightG: item.weightG, now: '2026-10-07T12:00:00.000Z' });
  await db.items.put(record);
  return record;
}

/** Every link to the item, as the app reads it. */
async function expectIntact(category) {
  const items = await db.items.toArray();
  const item = await db.items.get(ID);
  expect(item).toBeTruthy();
  expect(item.id).toBe(ID);
  expect(item.category).toBe(category);
  // trip entry: qty, slot, packed
  const tr = await db.trips.get(trip.id);
  expect(tr.entries).toEqual([{ itemId: ID, slot: 'bar', qty: 2, packed: true }]);
  const stats = tripStats(tr, items, await db.containers.toArray(), bike, 60000);
  const bar = stats.zones.find((z) => z.key === 'bar');
  expect(bar.entries).toHaveLength(1);
  expect(bar.packed).toBe(1);
  expect(bar.grams).toBe(600); // 300 g × 2
  // the trip grouped by category shows it under its new category
  const groups = planningGroups(stats, items, 'category');
  expect(groups.find((g) => g.key === category)?.entries.map((e) => e.itemId)).toEqual([ID]);
  // template
  const tpls = await loadTemplates(db);
  expect(tpls[0].entries).toEqual([{ itemId: ID, slot: 'bar', qty: 2 }]);
  const fresh = tripFromTemplate({ title: 'x', startDate: '2026-11-01', days: 1, bike }, tpls[0], items, 1);
  expect(fresh.entries.find((e) => e.itemId === ID)).toMatchObject({ slot: 'bar', qty: 2, packed: false });
  // kit
  expect(item.kits).toEqual(['test_data_gtp_K']);
  expect(await db.kits.get('test_data_gtp_K')).toBeTruthy();
  // bag link and its weight
  const bag = await db.containers.get(container.id);
  expect(bag.itemId).toBe(ID);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  expect(containerWeight(bag, byId)).toBe(600);
  expect(bikeSetup(bike, [bag], items).bagsG).toBe(600);
  // weight check
  expect(await db.weightChecks.get(1)).toMatchObject({ itemId: ID, item: 'test_data_gtp_ Roll bag', adoptedG: 300 });
  // favourite
  expect(item.favorite).toBe(true);
  expect(item.favNote).toBe('never let me down');
  expect(favouriteCounts(items).inventory).toBe(1);
  // learning and debrief
  expect(tipsByItem(await db.learnings.toArray())[ID]?.id).toBe('test_data_gtp_L1');
  expect((await db.debriefs.get(trip.id)).items[ID]).toBe('used');
  // Gear lists it under the new category, the search still finds it by its ID
  expect(groupByCategory(gearStats(items).inventory).find((g) => g.key === category)?.items.map((i) => i.id)).toEqual([ID]);
  expect(matches(item, { q: 'TA90' })).toBe(true);
}

beforeEach(async () => {
  db = createDb(`category-${++n}`);
  await db.items.put(fullItem());
  await db.kits.put({ id: 'test_data_gtp_K', name: 'test_data_gtp_ Kit', domain: 'bikepacking' });
  await db.trips.put(trip);
  await saveTemplates(db, [template]);
  await db.containers.put(container);
  await db.bikes.put(bike);
  await db.weightChecks.put({ id: 1, item: 'test_data_gtp_ Roll bag', itemId: ID, logbook: '320 g', online: '290 g', adoptedG: 300, decision: 'weighed', sources: '', link: '' });
  await db.learnings.put({ id: 'test_data_gtp_L1', topic: 'Bags', rule: 'Strap it tight', action: '', itemIds: [ID], source: 'test', appliesTo: ['all'], priority: 'high' });
  await db.debriefs.put({ tripId: trip.id, status: 'done', items: { [ID]: 'used' }, missing: [] });
});

describe('changing the category of an item (AP09)', () => {
  it('keeps the ID and every link: trip, template, kit, bag, weight check, favourite, learning', async () => {
    await expectIntact('bags');
    const saved = await changeCategory(ID, 'lux');
    expect(saved.id).toBe(ID);
    await expectIntact('lux');
    expect(await db.items.count()).toBe(1); // no copy under a new ID
  });

  it('still intact after a backup export → import', async () => {
    await changeCategory(ID, 'lux');
    const file = JSON.parse(JSON.stringify(await buildBackup(db))); // like writing and reading a file
    db = createDb(`category-${++n}`);
    await restoreBackup(db, file, 'replace');
    await expectIntact('lux');
  });

  it('a legacy ID keeps its old prefix; new items still get free IDs', async () => {
    const legacy = { ...fullItem(), id: 'KL21', category: 'onbike', replaces: null, altFor: null };
    await db.items.put(legacy);
    await changeCategory('KL21', 'rain');
    expect((await db.items.get('KL21')).category).toBe('rain');
    const items = await db.items.toArray();
    expect(nextId(items, 'onbike')).toBe('KL22'); // the moved KL21 still blocks its number
    expect(nextId(items, 'rain')).toBe('RG01');
  });

  it('open + save without changes loses no field', async () => {
    const before = await db.items.get(ID);
    await changeCategory(ID, 'bags');
    const after = await db.items.get(ID);
    const { updatedAt: a, ...restBefore } = before;
    const { updatedAt: b, ...restAfter } = after;
    expect(restAfter).toEqual(restBefore);
  });

  it('a new item: three required fields, no weight means "not weighed", not 0', () => {
    const draft = { ...itemDraft(null, { name: 'test_data_gtp_ Spork' }), category: 'cook' };
    expect(draft.name).toBe('test_data_gtp_ Spork');
    const rec = itemRecord(draft, { items: [{ id: 'KO07' }], weightG: null });
    expect(rec).toMatchObject({ id: 'KO08', name: 'test_data_gtp_ Spork', category: 'cook', ownership: 'owned', weightG: null, weightStatus: 'missing' });
  });
});
