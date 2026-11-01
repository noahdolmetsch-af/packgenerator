// «Velos ausmustern» (Noah 1.11.2026 «1-5 a»): retiring hides a bike from the choice lists, loses nothing, and
// comes back with Undo or «Bring back». Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { isRetired, activeBikes, retiredBikes, retireRecord, retireBike, restoreBike } from '../src/lib/bikeretire.js';
import { standardBike } from '../src/lib/tourbike.svelte.js';

const fresh = async () => {
  const db = createDb(`ausm-${Math.random().toString(36).slice(2)}`);
  await db.bikes.bulkPut([
    { id: 'blau', name: 'Testvelo Blau', order: 0 },
    { id: 'rot', name: 'Testvelo Rot', order: 1 },
  ]);
  await db.trips.put({ id: 'T1', title: 'Testtour', bikeId: 'blau', bike: 'Testvelo Blau' });
  await db.kmBook.put({ id: 'K1', bikeId: 'blau', date: '2026-10-01', state: 'counted', km: 40 });
  return db;
};

describe('retiring a bike', () => {
  it('knows retired, archived and sold bikes', () => {
    expect(isRetired({ retired: { reason: 'sold' } })).toBe(true);
    expect(isRetired({ archived: true })).toBe(true);
    expect(isRetired({ status: 'sold' })).toBe(true);
    expect(isRetired({ id: 'x' })).toBe(false);
    expect(isRetired(null)).toBe(false);
  });

  it('cleans the record: unknown reason becomes other, bad day empty, note trimmed', () => {
    expect(retireRecord({ reason: 'stolen', at: 'gestern', note: '  weg  ' })).toEqual({ at: null, reason: 'other', note: 'weg' });
    expect(retireRecord({ reason: 'sold', at: '2026-10-31' })).toEqual({ at: '2026-10-31', reason: 'sold', note: '' });
  });

  it('hides the bike from the lists but keeps its trips and km', async () => {
    const db = await fresh();
    await retireBike(db, 'blau', { reason: 'sold', at: '2026-11-01' });
    const all = await db.bikes.toArray();
    expect(activeBikes(all).map((b) => b.id)).toEqual(['rot']);
    expect(retiredBikes(all).map((b) => b.id)).toEqual(['blau']);
    expect((await db.bikes.get('blau')).retired.reason).toBe('sold');
    expect(await db.trips.count()).toBe(1);
    expect(await db.kmBook.count()).toBe(1);
    expect(standardBike(all).id).toBe('rot');
  });

  it('Undo and bringing back restore the bike', async () => {
    const db = await fresh();
    const before = await retireBike(db, 'blau', { reason: 'broken' });
    await restoreBike(db, 'blau', before);
    expect(isRetired(await db.bikes.get('blau'))).toBe(false);
    await retireBike(db, 'rot', {});
    await restoreBike(db, 'rot');
    expect(activeBikes(await db.bikes.toArray())).toHaveLength(2);
  });

  it('is not there: nothing happens', async () => {
    const db = await fresh();
    expect(await retireBike(db, 'weg', {})).toBeNull();
  });
});
