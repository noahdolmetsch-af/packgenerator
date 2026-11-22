// Tempo (Noah 11.11.2026 «1-4 umsetzen»): the start-up step ensureTrips wrote trips again at every start although
// nothing changed (a trip whose bike is not found stays «without bike»). Now it writes only what really changes.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { ensureTrips } from '../src/lib/trips.js';

const writes = (db) => {
  const ids = [];
  db.trips.hook('updating', (_mods, key) => { ids.push(key); });
  db.trips.hook('creating', (key) => { ids.push(key); });
  return ids;
};

describe('ensureTrips writes only trips that change', () => {
  it('leaves a trip alone that the step cannot improve, at every start', async () => {
    const db = createDb('test_data_gtp_ensure_leise');
    // no bike set up and the trip names none: bikeId stays null, setup {} and ready stay as the step makes them
    await db.trips.put({ id: 'trip-a', bike: 'Unbekannt', entries: [{ itemId: 'X1', slot: 'top', qty: 1, packed: false }], setup: {}, ready: [], bikeId: null });
    const ids = writes(db);
    expect(await ensureTrips(db)).toBe(0);
    expect(await ensureTrips(db)).toBe(0);
    expect(ids).toEqual([]);
  });

  it('still writes a trip that needs the step, once', async () => {
    const db = createDb('test_data_gtp_ensure_leise2');
    await db.bikes.put({ id: 'b1', name: 'Velo', setup: { seat: 'bag1' }, fixtures: [] });
    await db.trips.put({ id: 'trip-b', bike: 'Velo', entries: [{ itemId: 'X1', container: 'top', qty: 1, packed: false }] });
    await db.trips.put({ id: 'trip-c', bike: 'Unbekannt', entries: [], setup: {}, ready: [], bikeId: null });
    const ids = writes(db);
    expect(await ensureTrips(db)).toBe(1);
    expect(ids).toEqual(['trip-b']);
    expect(await ensureTrips(db)).toBe(0);
    expect(ids).toEqual(['trip-b']);
  });
});
