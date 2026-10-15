import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { ALL_PARTS } from '../src/lib/blocksmore.js';
import { applyUpdates } from '../src/lib/updates.js';

describe('v0.26.0 kits become templates (Noah 1a)', () => {
  it('once, skips a template with the same name, ignores items not owned, rain kit becomes a set', async () => {
    const db = createDb('kit-templates-test');
    await db.kits.bulkPut([
      { id: 'D', name: 'test_data_gtp_ Daily', use: 'test_data_gtp_ short rides', domain: 'bikepacking' },
      { id: 'T', name: 'test_data_gtp_ Training', use: 'long rides', domain: 'bikepacking' },
      { id: 'W', name: 'test_data_gtp_ Rain setup (add-on)', use: 'extra for rain', domain: 'bikepacking' },
    ]);
    await db.items.bulkPut([
      { id: 'X1', name: 'a', ownership: 'owned', defaultBag: 'frame', kits: ['D', 'W'], sets: [] },
      { id: 'X2', name: 'b', ownership: 'wishlist', defaultBag: 'top', kits: ['D', 'W'], sets: [] },
      { id: 'X3', name: 'c', ownership: 'gone', defaultBag: 'top', kits: ['D', 'W'], sets: [] },
      { id: 'X4', name: 'd', ownership: 'unclear', role: 'worn', defaultBag: 'body', kits: ['D'], sets: ['base'] },
    ]);
    await db.settings.put({ key: 'templates', value: [{ id: 'tpl-own', name: 'test_data_gtp_ training', setup: {}, entries: [], ready: [] }] });
    await applyUpdates(db);
    const tpls = (await db.settings.get('templates')).value;
    expect(tpls.map((x) => x.id)).toEqual(['tpl-own', 'tpl-kit-D']);
    expect(tpls[1]).toMatchObject({ name: 'test_data_gtp_ Daily', note: 'test_data_gtp_ short rides', setup: {}, ready: [], sets: {}, ride: null, hours: null });
    // v0.66.0: X4's old block Base is Bivouac now; the same items (the block's items come first)
    expect([...tpls[1].entries].sort((a, b) => a.itemId.localeCompare(b.itemId))).toEqual([{ itemId: 'X1', slot: 'frame', qty: 1 }, { itemId: 'X4', slot: 'body', qty: 1 }]);
    const sets = (await db.settings.get('sets')).value;
    expect(sets).toEqual([{ key: 'u-test-data-gtp-rain-setup', name: 'test_data_gtp_ Rain setup', note: 'extra for rain' }]);
    expect((await db.items.get('X1')).sets).toEqual(['u-test-data-gtp-rain-setup']);
    expect((await db.items.get('X2')).sets).toEqual(['u-test-data-gtp-rain-setup']);
    expect((await db.items.get('X3')).sets).toEqual([]);
    // Kits and item.kits stay.
    expect(await db.kits.count()).toBe(3);
    expect((await db.items.get('X1')).kits).toEqual(['D', 'W']);
    // Runs once: a deleted template is not made again.
    await db.settings.put({ key: 'templates', value: [] });
    await applyUpdates(db);
    expect((await db.settings.get('templates')).value).toEqual([]);
  });

});

// v0.27.0 (Noah 1a, AP23 finding 4): the start-up updates never add Noah's own things to data that is not his.
describe('v0.27.0 updates on a fresh or foreign data set', () => {
  it('an empty database stays empty', async () => {
    const db = createDb('updates-fresh-test');
    await applyUpdates(db);
    expect(await db.items.count()).toBe(0);
    expect(await db.containers.count()).toBe(0);
    expect(await db.bikes.count()).toBe(0);
    expect(await db.settings.get('templates')).toBeUndefined();
  });

  it('someone else\'s data (none of the IDs the updates change) gets no new item, bag, bike or ready check', async () => {
    const db = createDb('updates-foreign-test');
    const items = [
      { id: 'test_data_gtp_A1', name: 'test_data_gtp_ jacket', ownership: 'owned', sets: [] },
      { id: 'test_data_gtp_A2', name: 'test_data_gtp_ gel', ownership: 'owned', sets: [], perHours: 2 },
    ];
    await db.items.bulkPut(items);
    await db.bikes.put({ id: 'test_data_gtp_bike', name: 'test_data_gtp_ Bike', slots: ['seat', 'frame'], setup: {} });
    const ready = [{ id: 'own-1', label: 'test_data_gtp_ check tyres', done: true }];
    await db.trips.put({ id: 'test_data_gtp_trip', title: 'test_data_gtp_ trip', bikeId: 'test_data_gtp_bike', startDate: '2999-01-01', entries: [{ itemId: 'test_data_gtp_A1', slot: 'seat', qty: 1, packed: true }], ready });
    await applyUpdates(db);
    // v0.154.0 «Bausteine mehr» (Noah 1a, 2a): only the generic example parts of the new blocks come, never Noah's own things
    const generic = new Set(ALL_PARTS.map((p) => p.name));
    const all = await db.items.toArray();
    expect(all.filter((i) => !String(i.sources ?? '').startsWith('example parts')).map((i) => i.id).sort()).toEqual(['test_data_gtp_A1', 'test_data_gtp_A2']);
    expect(all.filter((i) => String(i.sources ?? '').startsWith('example parts')).every((i) => generic.has(i.name) && i.ownership === 'unclear' && i.weightG == null)).toBe(true);
    expect(await db.items.get('test_data_gtp_A2')).toEqual(items[1]);
    expect(await db.containers.get('bag-TA14')).toBeUndefined();
    expect((await db.bikes.toArray()).map((b) => b.id)).toEqual(['test_data_gtp_bike']);
    const trip = await db.trips.get('test_data_gtp_trip');
    expect(trip.ready).toEqual(ready);
    expect(trip.entries).toEqual([{ itemId: 'test_data_gtp_A1', slot: 'seat', qty: 1, packed: true }]);
  });
});
