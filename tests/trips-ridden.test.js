// v0.143.0 WS3 «Wie letzte Tour» (Release-Analyse F5, Noah 14.10.2026 «1a»): a copy comes only from a trip
// really ridden with that bike, never from one planned for later, skipped, an idea or without a list.
import { describe, it, expect } from 'vitest';
import { riddenTrips, lastTripOn, newTrip } from '../src/lib/trips.js';

const entries = [{ itemId: 'test_data_wlt_A', slot: 'seat', qty: 1, packed: true }];
const trip = (id, startDate, more = {}) => ({ id, title: `test_data_wlt_ ${id}`, bikeId: 'test_data_wlt_bike', startDate, entries, ...more });
const TODAY = '2026-10-14';

describe('riddenTrips', () => {
  it('keeps trips started before today or finished today, with a list, not skipped, not an idea', () => {
    const list = [trip('past', '2026-10-01'), trip('today', TODAY), trip('todayDone', TODAY, { finished: true }), trip('later', '2026-10-24'), trip('skipped', '2026-09-01', { skipped: true }), trip('idea', '2026-09-02', { idea: true }), trip('empty', '2026-09-03', { entries: [] }), trip('nodate', '')];
    expect(riddenTrips(list, TODAY).map((x) => x.id)).toEqual(['past', 'todayDone']);
  });
});

describe('Like the last trip', () => {
  it('copies the last ridden trip of the bike, never the one planned for later', () => {
    const list = [trip('old', '2026-09-01'), trip('last', '2026-10-02'), trip('later', '2026-10-24')];
    expect(lastTripOn('test_data_wlt_bike', riddenTrips(list, TODAY))?.id).toBe('last');
    const bike = { id: 'test_data_wlt_bike', name: 'test_data_wlt_ Bike', setup: { seat: 'test_data_wlt_bag' } };
    const items = [{ id: 'test_data_wlt_A', name: 'A', ownership: 'owned', domains: ['bikepacking'] }];
    const made = newTrip({ title: 'New', startDate: '2026-10-20', days: 1, bike }, riddenTrips(list, TODAY), items, 1);
    expect(made.copiedFrom).toBe('last');
    expect(made.entries.find((e) => e.itemId === 'test_data_wlt_A')?.packed).toBe(false);
  });
  it('another bike has its own last trip', () => {
    const list = [trip('mine', '2026-10-02'), trip('other', '2026-10-05', { bikeId: 'test_data_wlt_other' })];
    expect(lastTripOn('test_data_wlt_bike', riddenTrips(list, TODAY))?.id).toBe('mine');
    expect(lastTripOn('test_data_wlt_none', riddenTrips(list, TODAY))).toBeNull();
  });
});
