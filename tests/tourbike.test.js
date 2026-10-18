// Standard-Velo (VS1–VS4, Noah 14.10.2026 «1a 2b 3a»). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { sortBikes } from '../src/lib/bikes.js';
import { TOUR_BIKE, tourBike, setTourBike, standardBike, tourBikeId, moveBike, makeStandard, withNewBike, saveOrder } from '../src/lib/tourbike.svelte.js';

let n = 0;
const fresh = () => createDb(`tourbike-${++n}`);
const ids = (list) => list.map((b) => b.id);

const BIKES = [
  { id: 'test_data_gtp_c', name: 'test_data_gtp_ Hardtail', order: 3 },
  { id: 'test_data_gtp_a', name: 'test_data_gtp_ Trailbike', order: 1 },
  { id: 'test_data_gtp_d', name: 'test_data_gtp_ Fully', order: 4 },
  { id: 'test_data_gtp_b', name: 'test_data_gtp_ Gravel', order: 2 },
];
// the last tour was on the hardtail
const TRIPS = [
  { id: 't1', bikeId: 'test_data_gtp_b', startDate: '2026-09-01', createdAt: '2026-09-01T08:00:00Z', domain: 'bikepacking' },
  { id: 't2', bikeId: 'test_data_gtp_c', startDate: '2026-10-01', createdAt: '2026-10-01T08:00:00Z', domain: 'bikepacking' },
];

describe('standard bike and order', () => {
  it('the standard bike is the first one in the order', () => {
    expect(standardBike(BIKES).id).toBe('test_data_gtp_a');
    expect(standardBike([])).toBeNull();
  });

  it('a new tour brings the standard bike, or with «last» the bike of the last tour; not asked yet = standard', () => {
    expect(tourBikeId(TRIPS, BIKES, 'standard', '2026-10-14')).toBe('test_data_gtp_a');
    expect(tourBikeId(TRIPS, BIKES, null, '2026-10-14')).toBe('test_data_gtp_a');
    expect(tourBikeId(TRIPS, BIKES, 'last', '2026-10-14')).toBe('test_data_gtp_c');
    // without any tour «last» falls back to the first bike in the order
    expect(tourBikeId([], BIKES, 'last', '2026-10-14')).toBe('test_data_gtp_a');
    expect(tourBikeId(TRIPS, [], 'standard')).toBeNull();
  });

  it('arrows move one place; at the ends nothing moves', () => {
    expect(ids(moveBike(BIKES, 'test_data_gtp_c', -1))).toEqual(['test_data_gtp_a', 'test_data_gtp_c', 'test_data_gtp_b', 'test_data_gtp_d']);
    expect(ids(moveBike(BIKES, 'test_data_gtp_c', 1))).toEqual(['test_data_gtp_a', 'test_data_gtp_b', 'test_data_gtp_d', 'test_data_gtp_c']);
    expect(ids(moveBike(BIKES, 'test_data_gtp_a', -1))).toEqual(ids(sortBikes(BIKES)));
    expect(ids(moveBike(BIKES, 'test_data_gtp_d', 1))).toEqual(ids(sortBikes(BIKES)));
  });

  it('«Als Standard» puts a bike on top, the others keep their order', () => {
    expect(ids(makeStandard(BIKES, 'test_data_gtp_d'))).toEqual(['test_data_gtp_d', 'test_data_gtp_a', 'test_data_gtp_b', 'test_data_gtp_c']);
  });

  it('a new bike goes last, also when the others have no order yet', () => {
    const old = [{ id: 'test_data_gtp_y', name: 'test_data_gtp_ Y' }, { id: 'test_data_gtp_x', name: 'test_data_gtp_ X' }];
    const neu = { id: 'test_data_gtp_a', name: 'test_data_gtp_ A' };
    expect(ids(withNewBike(old, neu))).toEqual(['test_data_gtp_x', 'test_data_gtp_y', 'test_data_gtp_a']);
  });

  it('saves the order into the bikes (only what changes) and the setting', async () => {
    const db = fresh();
    await db.bikes.bulkPut(BIKES);
    const after = makeStandard(BIKES, 'test_data_gtp_d');
    expect(await saveOrder(db, BIKES, after)).toBe(4);
    expect(ids(sortBikes(await db.bikes.toArray()))).toEqual(ids(after));
    expect(await saveOrder(db, await db.bikes.toArray(), after)).toBe(0);
    await setTourBike(db, 'last');
    expect((await db.settings.get(TOUR_BIKE)).value).toBe('last');
    expect(tourBike.mode).toBe('last');
    await setTourBike(db, 'other');
    expect((await db.settings.get(TOUR_BIKE)).value).toBe('last');
  });
});
