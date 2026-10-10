// v0.26.0 (Noah 2a, AP11): assign many items at once, repeated = no change, undo snapshots.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { upcomingTrips, intoSet, outOfSet, withBag, intoTemplate, ontoTrip, templateSlot, currentTrip, assignmentOf, assignSet, assignBag, assignTemplate, assignTrip, deleteSet, setQtyIn, renameSetIn } from '../src/lib/gear/assign.js';
import { undoBulk } from '../src/lib/gear/bulk.js';

const item = (id, fields = {}) => ({ id, name: `test_data_gtp_ ${id}`, category: 'hyg', weightG: 10, qty: 1, defaultBag: 'top', ownership: 'owned', role: null, sets: [], ...fields });
const ITEMS = [item('A'), item('B', { sets: ['u-regen'] }), item('C', { ownership: 'wishlist' }), item('D', { role: 'worn', defaultBag: 'body' })];

describe('pure helpers', () => {
  it('into a set / out of a set / default bag change only what differs', () => {
    expect(intoSet(ITEMS, ['A', 'B'], 'u-regen', 'n').map((i) => [i.id, i.sets])).toEqual([['A', ['u-regen']]]);
    expect(outOfSet(ITEMS, ['A', 'B'], 'u-regen', 'n').map((i) => [i.id, i.sets])).toEqual([['B', []]]);
    expect(withBag(ITEMS, ['A', 'D'], 'top', 'n')).toEqual([{ ...ITEMS[3], defaultBag: 'top', updatedAt: 'n' }]);
    const once = intoSet(ITEMS, ['A'], 'u-regen');
    expect(intoSet([once[0]], ['A'], 'u-regen')).toEqual([]);
  });

  it('into a template: missing inventory items in their place, no duplicates', () => {
    const tpls = [{ id: 't1', name: 'T', setup: { top: 'bag-1' }, entries: [{ itemId: 'A', slot: 'top', qty: 2 }] }, { id: 't2', name: 'K', setup: {}, entries: [] }];
    const r = intoTemplate(tpls, 't1', ITEMS, ['A', 'B', 'C', 'D']);
    expect(r.added).toEqual(['B', 'D']);
    expect(r.list[0].entries).toEqual([{ itemId: 'A', slot: 'top', qty: 2 }, { itemId: 'B', slot: 'top', qty: 1 }, { itemId: 'D', slot: 'body', qty: 1 }]);
    expect(r.list[1]).toBe(tpls[1]);
    const again = intoTemplate(r.list, 't1', ITEMS, ['A', 'B', 'D']);
    expect(again.added).toEqual([]);
    expect(again.list).toBe(r.list);
    // A template without bags keeps the usual bag key (tripFromTemplate puts it into the bike's bag).
    expect(templateSlot(item('X', { defaultBag: 'frame' }), {})).toBe('frame');
    expect(templateSlot(item('X', { defaultBag: 'frame' }), { seat: 'bag-s' })).toBe('seat');
  });

  it('onto the trip: like Add material, packed state of existing entries untouched', () => {
    const trip = { setup: { top: 'bag-1' }, entries: [{ itemId: 'A', slot: 'top', qty: 1, packed: true }] };
    const r = ontoTrip(trip, ITEMS, ['A', 'B', 'C', 'D']);
    expect(r.added).toEqual(['B', 'D']);
    expect(r.entries).toEqual([{ itemId: 'A', slot: 'top', qty: 1, packed: true }, { itemId: 'B', slot: 'top', qty: 1, packed: false }, { itemId: 'D', slot: 'body', qty: 1, packed: false }]);
    expect(ontoTrip({ ...trip, entries: r.entries }, ITEMS, ['A', 'B', 'D']).added).toEqual([]);
    expect(ontoTrip({ packs: [{ key: 'pack' }], entries: [] }, ITEMS, ['A']).entries[0].slot).toBe('pack');
  });

  it('the current trip and what an item is assigned to', () => {
    const trips = [{ id: 'old', startDate: '2026-01-01' }, { id: 'next', startDate: '2026-11-01' }, { id: 'later', startDate: '2026-12-01' }];
    expect(currentTrip(trips, null, '2026-10-07').id).toBe('next');
    expect(currentTrip(trips, 'later', '2026-10-07').id).toBe('later');
    expect(currentTrip([], null, '2026-10-07')).toBeNull();
    expect(upcomingTrips([...trips, { id: 'skip', startDate: '2026-10-20', skipped: true }, { id: 'nodate' }], '2026-10-07').map((x) => x.id)).toEqual(['next', 'later', 'nodate']);
    expect(assignmentOf(ITEMS[1], [{ name: 'T', entries: [{ itemId: 'B' }] }, { name: 'U', entries: [] }], { entries: [] })).toEqual({ sets: ['u-regen'], templates: ['T'], trip: false });
  });
});

describe('writes with undo', () => {
  it('into a new set, repeat changes nothing, undo removes the set and the keys', async () => {
    const db = createDb('assign-set');
    await db.items.bulkPut(ITEMS);
    const r = await assignSet(db, ['A', 'B', 'D'], null, { newName: 'test_data_gtp_ Regen' });
    expect(r.n).toBe(3);
    expect((await db.settings.get('sets')).value).toEqual([{ key: r.key, name: 'test_data_gtp_ Regen' }]);
    expect((await db.items.get('A')).sets).toEqual([r.key]);
    expect((await assignSet(db, ['A', 'B', 'D'], r.key)).n).toBe(0);
    expect((await assignSet(db, ['A'], null, { newName: 'test_data_gtp_ regen' })).error).toBe('taken');
    await undoBulk(db, r.snap);
    expect(await db.settings.get('sets')).toBeUndefined();
    expect((await db.items.get('A')).sets).toEqual([]);
    expect((await db.items.get('B')).sets).toEqual(['u-regen']);
  });

  it('out of a set, default bag, amounts, rename and delete with undo', async () => {
    const db = createDb('assign-more');
    await db.items.bulkPut(ITEMS);
    await db.settings.put({ key: 'sets', value: [{ key: 'u-regen', name: 'Regen' }] });
    const out = await assignSet(db, ['A', 'B'], 'u-regen', { out: true });
    expect(out.n).toBe(1);
    await undoBulk(db, out.snap);
    expect((await db.items.get('B')).sets).toEqual(['u-regen']);
    const bag = await assignBag(db, ['A', 'B'], 'frame');
    expect(bag.n).toBe(2);
    expect((await assignBag(db, ['A', 'B'], 'frame')).n).toBe(0);
    await undoBulk(db, bag.snap);
    expect((await db.items.get('A')).defaultBag).toBe('top');
    const q = await setQtyIn(db, 'u-regen', 'B', 2);
    expect((await db.settings.get('sets')).value[0].qty).toEqual({ B: 2 });
    await undoBulk(db, q.snap);
    expect((await db.settings.get('sets')).value[0].qty).toBeUndefined();
    expect((await renameSetIn(db, 'u-regen', 'Nass')).snap).toBeTruthy();
    const del = await deleteSet(db, 'u-regen');
    expect(del.n).toBe(1);
    expect((await db.items.get('B')).sets).toEqual([]);
    expect((await db.settings.get('sets')).value).toEqual([]);
    expect((await deleteSet(db, 'bivy')).error).toBe('builtIn');
    await undoBulk(db, del.snap);
    expect((await db.items.get('B')).sets).toEqual(['u-regen']);
    expect((await db.settings.get('sets')).value[0].name).toBe('Nass');
  });

  it('into a template and onto the trip, repeat = no change, undo puts the records back', async () => {
    const db = createDb('assign-tpl');
    await db.items.bulkPut(ITEMS);
    const tpls = [{ id: 't1', name: 'T', setup: {}, entries: [{ itemId: 'A', slot: 'top', qty: 1 }] }];
    await db.settings.put({ key: 'templates', value: tpls });
    await db.trips.put({ id: 'trip', bikeId: 'bk', setup: { top: 'b' }, entries: [{ itemId: 'A', slot: 'top', qty: 1, packed: true }] });
    await db.items.bulkPut([item('BAG', { category: 'bags' }), item('FIX')]);
    await db.containers.put({ id: 'b', slot: 'top', itemId: 'BAG' });
    await db.bikes.put({ id: 'bk', fixtures: ['FIX'] });
    const tr = await assignTemplate(db, ['A', 'B', 'C'], 't1');
    expect(tr.n).toBe(1);
    expect((await assignTemplate(db, ['A', 'B', 'C'], 't1')).n).toBe(0);
    await undoBulk(db, tr.snap);
    expect((await db.settings.get('templates')).value).toEqual(tpls);
    const tp = await assignTrip(db, ['A', 'B', 'D', 'BAG', 'FIX'], 'trip');
    expect(tp.n).toBe(2);
    expect((await assignTrip(db, ['A', 'B', 'D'], 'trip')).n).toBe(0);
    const entries = (await db.trips.get('trip')).entries;
    expect(entries.map((e) => [e.itemId, e.packed])).toEqual([['A', true], ['B', false], ['D', false]]);
    await undoBulk(db, tp.snap);
    expect((await db.trips.get('trip')).entries).toHaveLength(1);
  });
});
