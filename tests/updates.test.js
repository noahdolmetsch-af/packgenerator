import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { applyUpdates } from '../src/lib/updates.js';

describe('chat updates', () => {
  it('sets up the four real bikes once and keeps typed weights', async () => {
    const db = createDb('updates-test');
    await db.items.bulkPut([{ id: 'BK04', name: 'Bottle cages', ownership: 'owned' }, { id: 'LI01', name: 'Front light', ownership: 'owned', sets: [] }]);
    await db.bikes.bulkPut([
      { id: 'scott-hardtail', name: 'Scott Hardtail', weightG: 13000, slots: ['seat'], setup: {} },
      { id: 'fully', name: 'Fully', weightG: 14200, slots: [], setup: {} },
      { id: 'gravel', name: 'Gravel', use: 'Veneto gravel', gearing: [32, 34] },
      { id: 'factor-ls', name: 'Factor LS', use: 'Alpenbrevet', gearing: [] },
    ]);
    await db.trips.put({ id: 't', bikeId: 'gravel', entries: [] });
    await applyUpdates(db);
    const bikes = Object.fromEntries((await db.bikes.toArray()).map((b) => [b.id, b]));
    expect(Object.keys(bikes).sort()).toEqual(['canyon-world-cup', 'factor-ls', 'fully', 'scott-hardtail']);
    // The logbook weight goes, Strava's estimate fills the gap (answer 3b); a typed weight stays.
    expect(bikes['scott-hardtail']).toMatchObject({ name: 'Scott Scale', weightG: 13000, km: 2287, fixtures: ['BK02', 'BK01'] });
    expect(bikes['scott-hardtail'].weightNote).toMatch(/Strava/);
    expect(bikes.fully).toMatchObject({ name: 'Scott Spark', weightG: 14200, km: 1460 });
    expect(bikes['factor-ls']).toMatchObject({ use: 'Alpenbrevet; Veneto gravel', gearing: [32, 34] });
    expect((await db.trips.get('t')).bikeId).toBe('factor-ls');
    expect((await db.items.get('LI01')).sets).toEqual(['light']);
    expect(bikes['canyon-world-cup']).toMatchObject({ weightG: 10100, slots: ['seat', 'cage1', 'cage2'] });
    expect(bikes['factor-ls'].slots).toEqual(['cage1', 'cage2']);
    await db.bikes.update('scott-hardtail', { name: 'My Scott', km: 2500 });
    await applyUpdates(db);
    expect(await db.bikes.get('scott-hardtail')).toMatchObject({ name: 'My Scott', km: 2500 });
  });

  it('adds the layers once and never overwrites what was set in the app', async () => {
    const db = createDb('layers-test');
    await db.items.bulkPut([
      { id: 'KL14', name: 'Leg warmers', ownership: 'owned' },
      { id: 'KL12', name: 'Wind vest', ownership: 'owned', role: 'worn' },
      { id: 'KL27', name: 'Long underwear', ownership: 'owned' },
      { id: 'RG08', name: 'Overshoes', ownership: 'owned', rain: 'yes' },
      { id: 'FD01', name: 'Bottle 1.0 L', ownership: 'owned' },
    ]);
    await applyUpdates(db);
    expect(await db.items.get('KL14')).toMatchObject({ coldBelow: 15 });
    expect(await db.items.get('KL12')).toMatchObject({ coldBelow: 15, role: null });
    expect((await db.items.get('RG08')).rain).toBe('yes');
    expect(await db.items.get('FD01')).toMatchObject({ perHours: 3, waterL: 1, maxQty: 2 });
    expect(await db.items.get('KL28')).toMatchObject({ name: 'Trainerhose lang chillig', coldBelow: 5, replaces: 'KL03' });
    expect(await db.items.get('KL29')).toMatchObject({ name: 'Gilet Fleece kuschelig', coldBelow: 10 });
    await db.items.update('KL14', { coldBelow: 8 });
    await db.settings.delete('update.layers2026');
    await applyUpdates(db);
    expect((await db.items.get('KL14')).coldBelow).toBe(8);
    expect(await db.items.count()).toBe(8); // plus the full frame bag
  });

  it('v0.25.0: tags the lodging items once, only owned ones, and never the hoodie', async () => {
    const db = createDb('lodging-test');
    await db.items.bulkPut([
      { id: 'HY07', name: 'test_data_gtp_ toothbrush', ownership: 'owned', sets: ['base'] },
      { id: 'HY08', name: 'test_data_gtp_ toothpaste', ownership: 'owned' },
      { id: 'HY09', name: 'test_data_gtp_ shower gel', ownership: 'wishlist', sets: [] },
      { id: 'OB06', name: 'test_data_gtp_ hoodie', ownership: 'owned', sets: [] },
      { id: 'RG14', name: 'test_data_gtp_ wind jacket', ownership: 'owned', sets: ['lodging'], weightG: 120 },
    ]);
    await applyUpdates(db);
    expect((await db.items.get('HY07')).sets).toEqual(['base', 'lodging']);
    expect((await db.items.get('HY08')).sets).toEqual(['lodging']);
    expect((await db.items.get('HY09')).sets).toEqual([]);
    expect((await db.items.get('OB06')).sets).toEqual([]);
    expect(await db.items.get('RG14')).toMatchObject({ sets: ['lodging'], weightG: 120 });
    // Once: a set taken off in Gear stays off.
    await db.items.update('HY08', { sets: [] });
    await applyUpdates(db);
    expect((await db.items.get('HY08')).sets).toEqual([]);
  });
});

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
    expect(tpls[1].entries).toEqual([{ itemId: 'X1', slot: 'frame', qty: 1 }, { itemId: 'X4', slot: 'body', qty: 1 }]);
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
