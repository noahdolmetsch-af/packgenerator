import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newTrip, freshReady, alwaysEntries } from '../src/lib/trips.js';
import { READY_DEFAULT } from '../src/lib/checks.js';

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
});

// v0.45.2 (Noah): the new base check before every ride, his six things first.
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { basicCheck2026 } from '../src/lib/updates.js';
import { READY_OLD_IDS } from '../src/lib/checks.js';

describe('base check 2026', () => {
  it('starts with lock, mini backpack, bottle, sunglasses, cap, wind jacket', () => {
    expect(READY_DEFAULT.slice(0, 6).map((r) => r.id)).toEqual(['lock', 'minipack', 'bottle', 'glasses', 'cap', 'wind']);
    expect(READY_DEFAULT.map((r) => r.id)).not.toContain('route');
  });

  it('replaces the old rows of the saved standard; own rows stay; trips keep their check', async () => {
    const db = new Dexie(`bc-${Math.random()}`);
    db.version(1).stores({ trips: 'id', settings: 'key' });
    const old = READY_OLD_IDS.map((id) => ({ id, label: id }));
    await db.settings.put({ key: 'readyStandard', value: [...old, { id: 'std-1', label: 'Buy gas' }] });
    await db.trips.put({ id: 'next', startDate: '2999-01-01', ready: old.map((r) => ({ ...r, done: false })) });
    expect(await basicCheck2026(db)).toBe(true);
    const std = (await db.settings.get('readyStandard')).value;
    expect(std.map((r) => r.id)).toEqual([...READY_DEFAULT.map((r) => r.id), 'std-1']);
    expect((await db.trips.get('next')).ready.map((r) => r.id)).toEqual(READY_OLD_IDS);
    expect(await basicCheck2026(db)).toBe(false);
  });
});
