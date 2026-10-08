// v0.30.2 (L5): event preparation ticked off in the trip and in Bike care, saved the same way.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { tickPrep, untickPrep } from '../src/lib/care/prep.js';

const TODAY = '2026-10-08';
const row = (id, task) => ({ task: { id, task, area: 'Preparation' } });

describe('tick off event preparation', () => {
  it('done: the trip keeps the result, the bike gets its check and service; undo opens it again', async () => {
    const db = createDb('prep-tick');
    await db.bikes.put({ id: 'test_data_gtp_bike', name: 'test_data_gtp_ Bike', km: 1200, parts: [] });
    await db.trips.put({ id: 'test_data_gtp_race', title: 'test_data_gtp_ Race', bikeId: 'test_data_gtp_bike', startDate: '2026-10-20', days: 1, entries: [], prep: { old: { result: 'ok', date: '2026-10-01', by: 'self' } } });
    const rows = [row('p1', 'Check chain wear'), row('p2', 'Wax the chain'), row('p3', 'Book the start number')];
    await tickPrep(db, 'test_data_gtp_race', rows, 'done', { today: TODAY, note: 'Before race' });
    const trip = await db.trips.get('test_data_gtp_race');
    expect(Object.keys(trip.prep).sort()).toEqual(['old', 'p1', 'p2', 'p3']);
    expect(trip.prep.p1).toEqual({ result: 'done', date: TODAY, by: 'self' });
    const chain = (await db.bikes.get('test_data_gtp_bike')).parts.find((p) => p.key === 'chain');
    expect(chain.history.map((h) => [h.action, h.result, h.km])).toEqual([['check', 'ok', 1200], ['service', 'done', 1200]]);
    await untickPrep(db, 'test_data_gtp_race', rows[0]);
    expect(Object.keys((await db.trips.get('test_data_gtp_race')).prep).sort()).toEqual(['old', 'p2', 'p3']);
  });

  it('work needed writes nothing to the bike; a trip without a bike is fine', async () => {
    const db = createDb('prep-needed');
    await db.trips.put({ id: 'test_data_gtp_walk', title: 'test_data_gtp_ Walk', startDate: '2026-10-20', days: 1, entries: [] });
    await tickPrep(db, 'test_data_gtp_walk', [row('p1', 'Check chain wear')], 'done', { today: TODAY });
    await tickPrep(db, 'test_data_gtp_walk', [row('p2', 'Check shifting')], 'needed', { today: TODAY, by: 'shop' });
    expect((await db.trips.get('test_data_gtp_walk')).prep).toEqual({ p1: { result: 'done', date: TODAY, by: 'self' }, p2: { result: 'needed', date: TODAY, by: 'shop' } });
  });
});
