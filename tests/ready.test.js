import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { applyUpdates } from '../src/lib/updates.js';
import { newTrip, freshReady, alwaysEntries, READY_DEFAULT } from '../src/lib/trips.js';

const bike = { id: 'scott', name: 'Scott', setup: { top: 'bag-top', seat: 'bag-seat' } };

describe('ready check cleanup (4.10.2026)', () => {
  it('starts with the short list or with the saved standard', () => {
    expect(freshReady().map((r) => r.label)).toEqual(READY_DEFAULT.map((r) => r.label));
    expect(freshReady().some((r) => r.group || r.itemId)).toBe(false);
    const mine = [{ id: 'x', label: 'Backpack packed' }];
    expect(freshReady(mine)).toEqual([{ id: 'x', label: 'Backpack packed', done: false }]);
  });

  it('puts "On every trip" items into every new trip, also a copied one', () => {
    const items = [
      { id: 'EL13', name: 'AirPods', ownership: 'owned', always: true, defaultBag: 'top', sets: [] },
      { id: 'GONE', name: 'Old', ownership: 'gone', always: true, defaultBag: 'top', sets: [] },
      { id: 'XX01', name: 'Thing', ownership: 'owned', defaultBag: 'seat', sets: [] },
    ];
    expect(alwaysEntries(items, [], bike.setup)).toEqual([{ itemId: 'EL13', slot: 'top', qty: 1, packed: false }]);
    const old = { id: 'trip-a', bikeId: 'scott', startDate: '2026-09-01', entries: [{ itemId: 'XX01', slot: 'seat', qty: 1, packed: true }] };
    const t = newTrip({ title: 'Next', startDate: '2026-11-01', days: 1, bike, readyStandard: [{ id: 's', label: 'Mine' }] }, [old], items);
    expect(t.entries.map((e) => e.itemId)).toEqual(['XX01', 'EL13']);
    expect(t.ready).toEqual([{ id: 's', label: 'Mine', done: false }]);
  });

  it('updates coming trips once, keeps own checks and leaves past trips alone', async () => {
    const db = createDb('ready-test');
    await db.items.bulkPut([
      { id: 'EL13', name: 'AirPods', ownership: 'owned' },
      { id: 'KL22', name: 'Glasses', ownership: 'owned', always: false },
      { id: 'WZ23', name: 'Lock', ownership: 'owned' },
    ]);
    const oldReady = [
      { id: 'gear', group: 'Packing', label: 'Riding gear ready', done: true },
      { id: 'a1', group: 'Always with me', label: 'AirPods', itemId: 'EL13', slot: 'top' },
      { id: 'own-1', group: 'This trip', label: 'Buy gas', done: true },
    ];
    await db.trips.bulkPut([
      { id: 'next', startDate: '2099-10-15', setup: { top: 'b' }, entries: [], ready: oldReady },
      { id: 'past', startDate: '2020-06-01', setup: {}, entries: [], ready: oldReady },
    ]);
    await applyUpdates(db);
    const next = await db.trips.get('next');
    expect(next.ready.map((r) => r.label)).toEqual([...READY_DEFAULT.map((r) => r.label), 'Buy gas']);
    expect(next.ready.at(-1)).toEqual({ id: 'own-1', label: 'Buy gas', done: true });
    expect(next.entries).toEqual([{ itemId: 'EL13', slot: 'top', qty: 1, packed: false }]);
    expect((await db.trips.get('past')).ready).toEqual(oldReady);
    expect((await db.items.get('EL13')).always).toBe(true);
    expect((await db.items.get('KL22')).always).toBe(false); // set in the app: stays
    expect((await db.items.get('WZ23')).always).toBeUndefined(); // the lock stays with the layers
    await db.trips.update('next', { ready: [] });
    await applyUpdates(db);
    expect((await db.trips.get('next')).ready).toEqual([]);
  });
});
