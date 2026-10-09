// v0.43.0 "Wiege-Modus und Mehrfachauswahl": the weighing order (bikes and bags first, then bags,
// sleep, outer and mid layers, the rest; the most used first), save / skip / undo, and the new
// actions for several items at once (building block in and out, default bag, area, archive,
// category, layer and zone), each with one Undo. Fictional test_data_gtp_ records only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { weighQueue, weighGroup, itemToWeigh, usageCounts, orderQueue, readGrams, maxGrams, weighPatch, saveWeight } from '../src/lib/weigh.js';
import { undoBulk, bulkArea, bulkArchive, bulkWear, archiveItems, areaItems, categoryItems, wearItems } from '../src/lib/gear/bulk.js';
import { assignSet, assignBag } from '../src/lib/gear/assign.js';
import DE from '../src/lib/i18n/de/index.js';

const item = (id, f = {}) => ({ id, name: `test_data_gtp_ ${id}`, category: 'lux', weightG: null, qty: 1, weightStatus: 'missing', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const ITEMS = [
  item('LX1'),
  item('LX2'),
  item('SL1', { category: 'sleep' }),
  item('TA1', { category: 'bags', weightG: 450, weightStatus: 'logbook' }), // a bag with a weight from the logbook
  item('TA2', { category: 'bags', weightG: 300, weightStatus: 'measured' }), // weighed: not again
  item('RA1', { category: 'rain' }), // rain wear without a layer: outer
  item('ON1', { category: 'onbike', layer: 'mid', zone: 'torso' }),
  item('ON2', { category: 'onbike', layer: 'outer', zone: 'torso' }),
  item('ON3', { category: 'onbike', layer: 'base', zone: 'torso' }), // base layer: with the rest
  item('EL1', { category: 'elec', weightG: 50, weightStatus: 'measured' }), // weighed
  item('WI1', { ownership: 'wishlist' }), // not owned
  item('GO1', { ownership: 'gone' }),
];
const BIKES = [
  { id: 'b-a', name: 'test_data_gtp_ Gravel', weightG: null },
  { id: 'b-b', name: 'test_data_gtp_ Rennvelo', weightG: 9000, weightNote: '9 kg from Strava (estimate)' },
  { id: 'b-c', name: 'test_data_gtp_ Stadtvelo', weightG: 14000 },
];
const BAGS = [
  { id: 'bag-own', name: 'test_data_gtp_ Rucksack', slot: 'back', itemId: null, weightG: null },
  { id: 'bag-w', name: 'test_data_gtp_ Hüfttasche', slot: 'hip', itemId: null, weightG: 150 },
  { id: 'bag-TA1', name: 'test_data_gtp_ Sattel', slot: 'seat', itemId: 'TA1', pieces: 1 },
];
const TRIPS = [
  { id: 't1', entries: [{ itemId: 'LX2' }, { itemId: 'ON1' }] },
  { id: 't2', entries: [{ itemId: 'LX2' }], ready: [{ itemId: 'LX2' }] },
];
const TEMPLATES = [{ id: 'tpl', entries: [{ itemId: 'LX2' }] }];

describe('the weighing order', () => {
  it('groups: bags, sleep, outer, mid, then the rest', () => {
    expect(['TA1', 'SL1', 'RA1', 'ON2', 'ON1', 'ON3', 'LX1'].map((id) => weighGroup(ITEMS.find((i) => i.id === id)))).toEqual(['bags', 'sleep', 'outer', 'outer', 'mid', 'rest', 'rest']);
  });

  it('only owned items without a weight, and bags not weighed in the app', () => {
    expect(ITEMS.filter(itemToWeigh).map((i) => i.id)).toEqual(['LX1', 'LX2', 'SL1', 'TA1', 'RA1', 'ON1', 'ON2', 'ON3']);
  });

  it('counts each trip or template once per item', () => {
    expect(usageCounts(TRIPS, TEMPLATES)).toEqual({ LX2: 3, ON1: 1 });
  });

  it('bikes and bags first with extras, then the groups, the most used first in a group', () => {
    const q = weighQueue({ items: ITEMS, bikes: BIKES, containers: BAGS, trips: TRIPS, templates: TEMPLATES, extras: true });
    expect(q.map((x) => x.key)).toEqual([
      'bike:b-a', 'bike:b-b', // no weight, an estimate; the Stadtvelo is weighed
      'bag:bag-own', // a bag of the list without a gear item and without weight
      'item:TA1', 'item:SL1', 'item:ON2', 'item:RA1', 'item:ON1', // outer: on-bike before rain (category order)
      'item:LX2', 'item:ON3', 'item:LX1', // LX2 is on 2 trips and a template; then category order, name
    ]);
    // Pack (a trip's items): no bikes and no bags of the list.
    expect(weighQueue({ items: ITEMS }).map((x) => x.kind)).not.toContain('bike');
  });

  it('skipped ones go to the end, an undone one comes first', () => {
    const q = weighQueue({ items: ITEMS });
    const keys = (list) => list.map((x) => x.key);
    const skipped = orderQueue(q, ['item:TA1', 'item:SL1']);
    expect(keys(skipped).slice(-2)).toEqual(['item:TA1', 'item:SL1']);
    expect(keys(skipped)[0]).toBe('item:ON2');
    expect(keys(orderQueue(q, ['item:TA1'], 'item:LX1'))[0]).toBe('item:LX1');
  });

  it('grams: whole numbers, thousands marks, 60 kg for a bike, 30 kg for the rest', () => {
    expect(readGrams('450')).toBe(450);
    expect(readGrams("1'250")).toBe(1250);
    expect(readGrams('1 250')).toBe(1250);
    expect(readGrams('0')).toBe(null);
    expect(readGrams('12,5g')).toBe(null);
    expect(readGrams('12,5')).toBe(null); // never read as 125 g
    expect(readGrams('1.250')).toBe(1250);
    expect(readGrams('35000')).toBe(null);
    expect(readGrams('35000', maxGrams({ kind: 'bike' }))).toBe(35000);
    expect(maxGrams({ kind: 'item' })).toBe(30000);
  });

  it('what saving writes: per piece and "measured"; a bike loses its estimate note', () => {
    const pair = weighQueue({ items: [item('SH1', { qty: 2 })] })[0];
    expect(weighPatch(pair, 801, 'n')).toEqual({ table: 'items', id: 'SH1', patch: { weightG: 401, weightStatus: 'measured', updatedAt: 'n' } });
    const bike = weighQueue({ bikes: BIKES, extras: true })[1];
    expect(weighPatch(bike, 9400, 'n')).toEqual({ table: 'bikes', id: 'b-b', patch: { weightG: 9400, weightNote: null, updatedAt: 'n' } });
    const bag = weighQueue({ containers: BAGS, extras: true })[0];
    expect(weighPatch(bag, 820)).toEqual({ table: 'containers', id: 'bag-own', patch: { weightG: 820 } });
  });
});

async function freshDb(name) {
  const db = createDb(`test_data_gtp_${name}_${Math.random()}`);
  await db.items.bulkPut(ITEMS);
  await db.bikes.bulkPut(BIKES);
  await db.containers.bulkPut(BAGS);
  await db.trips.bulkPut(TRIPS);
  return db;
}
const queueOf = async (db) => weighQueue({ items: await db.items.toArray(), bikes: await db.bikes.toArray(), containers: await db.containers.toArray(), trips: await db.trips.toArray(), extras: true });

describe('save, skip and undo', () => {
  it('saving takes a target off the queue; Undo puts the record back exactly', async () => {
    const db = await freshDb('save');
    const q0 = await queueOf(db);
    const sleep = q0.find((x) => x.key === 'item:SL1');
    const before = await db.items.get('SL1');
    const snap = await saveWeight(db, sleep, 980);
    expect(await db.items.get('SL1')).toMatchObject({ weightG: 980, weightStatus: 'measured' });
    expect((await queueOf(db)).map((x) => x.key)).not.toContain('item:SL1');
    expect((await queueOf(db)).length).toBe(q0.length - 1);
    await undoBulk(db, snap);
    expect(await db.items.get('SL1')).toEqual(before);
    expect((await queueOf(db)).length).toBe(q0.length);
  });

  it('a bike and a bag of the list: saved and undone', async () => {
    const db = await freshDb('bike');
    const [bike, , bag] = await queueOf(db);
    const s1 = await saveWeight(db, bike, 10200);
    const s2 = await saveWeight(db, bag, 640);
    expect((await db.bikes.get('b-a')).weightG).toBe(10200);
    expect((await db.containers.get('bag-own')).weightG).toBe(640);
    await undoBulk(db, s2);
    await undoBulk(db, s1);
    expect((await db.bikes.get('b-a')).weightG).toBe(null);
    expect((await db.containers.get('bag-own')).weightG).toBe(null);
  });

  it('skipping writes nothing', async () => {
    const db = await freshDb('skip');
    const q = await queueOf(db);
    const order = orderQueue(q, [q[0].key]);
    expect(order.at(-1).key).toBe(q[0].key);
    expect(await db.bikes.get('b-a')).toEqual(BIKES[0]);
  });
});

describe('several items at once', () => {
  it('pure helpers change only what differs', () => {
    expect(bulkArea(ITEMS, ['LX1', 'LX2'], 'bikepacking', { now: 'n' })).toEqual([]);
    expect(bulkArea(ITEMS, ['LX1'], 'ski', { now: 'n' })[0].domains).toEqual(['bikepacking', 'ski']);
    expect(bulkArea(ITEMS, ['LX1'], 'ski', { only: true, now: 'n' })[0].domains).toEqual(['ski']);
    expect(bulkArea([item('NO', { domains: [] })], ['NO'], 'bikepacking', { now: 'n' })[0].domains).toEqual(['bikepacking']);
    expect(bulkArchive(ITEMS, ['LX1', 'GO1'], 'n').map((i) => [i.id, i.ownership])).toEqual([['LX1', 'gone']]);
    expect(bulkWear(ITEMS, ['ON1', 'ON2'], { layer: 'outer' }, 'n').map((i) => i.id)).toEqual(['ON1']);
  });

  it('into a building block and out again, each with one Undo', async () => {
    const db = await freshDb('block');
    const ids = ['LX1', 'LX2', 'SL1'];
    const into = await assignSet(db, ids, 'u-test');
    expect(into.n).toBe(3);
    expect((await db.items.bulkGet(ids)).map((i) => i.sets)).toEqual([['u-test'], ['u-test'], ['u-test']]);
    await undoBulk(db, into.snap);
    expect((await db.items.bulkGet(ids)).map((i) => i.sets)).toEqual([[], [], []]);
    await assignSet(db, ids, 'u-test');
    const out = await assignSet(db, ['LX1', 'LX2'], 'u-test', { out: true });
    expect((await db.items.bulkGet(ids)).map((i) => i.sets)).toEqual([[], [], ['u-test']]);
    await undoBulk(db, out.snap);
    expect((await db.items.bulkGet(ids)).map((i) => i.sets)).toEqual([['u-test'], ['u-test'], ['u-test']]);
  });

  it('default bag, area, category and archive, each with one Undo', async () => {
    const db = await freshDb('bulk');
    const ids = ['LX1', 'LX2', 'SL1'];
    const before = await db.items.bulkGet(ids);
    for (const run of [
      () => assignBag(db, ids, 'seat'),
      () => areaItems(db, ids, 'ski', true),
      () => categoryItems(db, ids, 'tools'),
      () => archiveItems(db, ids),
    ]) {
      const res = await run();
      expect(res.n).toBe(3);
      expect(await db.items.bulkGet(ids)).not.toEqual(before);
      await undoBulk(db, res.snap);
      expect(await db.items.bulkGet(ids)).toEqual(before);
    }
    // The archive is the single "Archive": status Gone, the record stays.
    await archiveItems(db, ['LX1']);
    expect(await db.items.get('LX1')).toMatchObject({ ownership: 'gone', id: 'LX1' });
    // Nothing to change: no snapshot, no Undo.
    expect(await archiveItems(db, ['LX1'])).toEqual({ snap: null, n: 0 });
  });

  it('the wardrobe: layer or zone for many pieces, one Undo', async () => {
    const db = await freshDb('wear');
    const ids = ['ON1', 'ON2', 'ON3'];
    const res = await wearItems(db, ids, { zone: 'legs' });
    expect(res.n).toBe(3);
    expect((await db.items.bulkGet(ids)).map((i) => i.zone)).toEqual(['legs', 'legs', 'legs']);
    await undoBulk(db, res.snap);
    expect((await db.items.bulkGet(ids)).map((i) => i.zone)).toEqual(['torso', 'torso', 'torso']);
  });
});

describe('German texts', () => {
  it('the new screens speak German', () => {
    for (const k of ['Record weights', 'Save & next', '{a} of {b}|weigh', '{n} without weight · weigh', 'More actions', 'Area …', 'Layer …', 'Zone …', '{n} items taken out of {block}.']) expect(DE[k], k).toBeTruthy();
    expect(DE['{n} without weight · weigh']).toBe('{n} ohne Gewicht · wiegen');
    expect(DE['Save & next']).toBe('Speichern & weiter');
  });
});
