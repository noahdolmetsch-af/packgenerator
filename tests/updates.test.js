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
    expect(bikes['scott-hardtail']).toMatchObject({ name: 'Scott Scale', weightG: null, fixtures: ['BK02', 'BK01'] });
    expect(bikes.fully).toMatchObject({ name: 'Scott Spark', weightG: 14200 });
    expect(bikes['factor-ls']).toMatchObject({ use: 'Alpenbrevet; Veneto gravel', gearing: [32, 34] });
    expect((await db.trips.get('t')).bikeId).toBe('factor-ls');
    expect((await db.items.get('LI01')).sets).toEqual(['light']);
    expect(bikes['canyon-world-cup']).toMatchObject({ weightG: 10100, slots: ['seat', 'cage1', 'cage2'] });
    expect(bikes['factor-ls'].slots).toEqual(['cage1', 'cage2']);
    await db.bikes.update('scott-hardtail', { name: 'My Scott' });
    await applyUpdates(db);
    expect((await db.bikes.get('scott-hardtail')).name).toBe('My Scott');
  });

  it('adds the layers once and never overwrites what was set in the app', async () => {
    const db = createDb('layers-test');
    await db.items.bulkPut([
      { id: 'KL14', name: 'Leg warmers', ownership: 'owned' },
      { id: 'RG08', name: 'Overshoes', ownership: 'owned', rain: 'yes' },
      { id: 'FD01', name: 'Bottle 1.0 L', ownership: 'owned' },
    ]);
    await applyUpdates(db);
    expect(await db.items.get('KL14')).toMatchObject({ coldBelow: 10 });
    expect((await db.items.get('RG08')).rain).toBe('yes');
    expect(await db.items.get('FD01')).toMatchObject({ perHours: 3, waterL: 1 });
    expect(await db.items.get('KL28')).toMatchObject({ name: 'Warm long gloves', ownership: 'unclear', coldBelow: 5 });
    await db.items.update('KL14', { coldBelow: 8 });
    await applyUpdates(db);
    expect((await db.items.get('KL14')).coldBelow).toBe(8);
  });
});
