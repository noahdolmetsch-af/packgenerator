import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { applyUpdates } from '../src/lib/updates.js';
import { templateFrom, tripFromTemplate, upsert, loadTemplates } from '../src/lib/templates.js';

const trip = {
  id: 'trip-1', title: 'daily commute', bikeId: 'factor-ls', startDate: '2026-10-04',
  setup: { top: 'bag-top', frame: 'bag-frame' },
  entries: [{ itemId: 'A', slot: 'frame', qty: 2, packed: true }, { itemId: 'B', slot: 'body', qty: 1, packed: true }, { itemId: 'GONE', slot: 'top', qty: 1 }],
  ready: [{ id: 'kit', label: 'Helmet', done: true }, { id: 'a1', label: 'AirPods', itemId: 'EL13' }],
  ride: 'daily', hours: 2, sets: { light: true }, wx: { min: 4, max: 12, rain: 'rain' },
  purpose: { top: 'Quick access' },
};
const items = [
  { id: 'A', ownership: 'owned', defaultBag: 'frame' },
  { id: 'B', ownership: 'owned', defaultBag: 'body' },
  { id: 'C', ownership: 'owned', defaultBag: 'top', always: true },
];

describe('templates', () => {
  it('keeps bags, items, checks, ride and night, but not weather, ticks or bike', () => {
    const t = templateFrom(trip, { id: 'tpl-1', name: ' Daily commute ', now: 'x' });
    expect(t).toMatchObject({ name: 'Daily commute', setup: trip.setup, ride: 'daily', hours: 2, sets: { light: true } });
    expect(t.entries[0]).toEqual({ itemId: 'A', slot: 'frame', qty: 2 });
    expect(t.ready).toEqual([{ id: 'kit', label: 'Helmet' }]);
    expect(t).not.toHaveProperty('wx');
    expect(t).not.toHaveProperty('bikeId');
  });

  it('starts a trip on another bike: its bags where it has places, items into matching bags', () => {
    const t = templateFrom(trip, { id: 'tpl-1', name: 'Daily commute' });
    const bike = { id: 'scott', name: 'Scott', slots: ['seat', 'top'], setup: { seat: 'bag-seat', top: 'bag-top-scott' } };
    const n = tripFromTemplate({ title: 'Commute Monday', startDate: '2026-10-05', days: 1, bike }, t, items, 5);
    expect(n.setup).toEqual({ seat: 'bag-seat', top: 'bag-top' }); // no frame place on this bike
    expect(n.entries).toEqual([
      { itemId: 'A', slot: 'seat', qty: 2, packed: false },
      { itemId: 'B', slot: 'body', qty: 1, packed: false },
      { itemId: 'C', slot: 'top', qty: 1, packed: false },
    ]);
    expect(n.ready).toEqual([{ id: 'kit', label: 'Helmet', done: false }]);
    expect(n).toMatchObject({ ride: 'daily', hours: 2, sets: { light: true }, templateId: 'tpl-1', bikeId: 'scott' });
    expect(n.wx).toBeUndefined();
    expect(n.purpose).toEqual({ top: 'Quick access' }); // what a bag is for comes along
  });

  it('upsert replaces by id or adds', () => {
    expect(upsert([{ id: 'a', name: 'x' }], { id: 'a', name: 'y' })).toEqual([{ id: 'a', name: 'y' }]);
    expect(upsert([{ id: 'a' }], { id: 'b' }).length).toBe(2);
  });

  it('makes the first template "Daily commute" from that trip, once', async () => {
    const db = createDb('tpl-test');
    await db.items.bulkPut(items);
    await db.trips.put(trip);
    await applyUpdates(db);
    const list = await loadTemplates(db);
    expect(list.map((t) => t.name)).toEqual(['Daily commute']);
    expect((await db.trips.get('trip-1')).templateId).toBe('tpl-daily-commute');
    await db.settings.put({ key: 'templates', value: [] });
    await applyUpdates(db);
    expect(await loadTemplates(db)).toEqual([]); // deleted by Noah: stays deleted
  });
});
