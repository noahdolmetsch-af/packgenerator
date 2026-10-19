// v0.102.0 Design-Refresh P4 «Touren» (T1, T3): the pure helpers of the Touren pages, fictional data.
import { describe, it, expect } from 'vitest';
import { overviewCounts, weatherWindow, daysTo, weightByPlace, rideBand } from '../src/lib/touren.js';
import { tripStats } from '../src/lib/trips.js';

describe('touren', () => {
  it('counts by the three trip states (v0.125.0 TZ-1)', () => {
    expect(overviewCounts({ counts: { plan: 3, done: 1, rated: 9, all: 13 } })).toEqual({ plan: 3, done: 1, rated: 9, all: 13 });
    expect(overviewCounts({ empty: true })).toBeNull();
  });

  it('days to a date, calendar days', () => {
    expect(daysTo('2026-10-20', '2026-10-12')).toBe(8);
    expect(daysTo('2026-03-30', '2026-03-28')).toBe(2); // over the change to summer time
    expect(daysTo(null, '2026-10-12')).toBeNull();
  });

  it('the weather window: dry days near the warmest dry one are the best, three at most', () => {
    const day = (date, max, rainMm = 0) => ({ date, min: max - 8, max, rainMm, rainPct: rainMm ? 80 : 10 });
    const fc = { days: [day('2026-10-12', 15), day('2026-10-13', 18), day('2026-10-14', 19, 6), day('2026-10-15', 17), day('2026-10-16', 12), day('2026-10-17', 18), day('2026-10-18', 16)] };
    const w = weatherWindow(fc, '2026-10-12');
    expect(w.days).toHaveLength(7);
    expect(w.days[2].rain).toBe('rain');
    expect(w.best).toEqual(['2026-10-13', '2026-10-15', '2026-10-17']);
    expect(weatherWindow({ days: [] }, '2026-10-12')).toBeNull();
  });

  it('weight by place: the places heaviest first, then food and water as their own row (v0.137.0 DK3), with the heaviest item', () => {
    const itemsById = { a: { id: 'a', weightG: 900 }, b: { id: 'b', weightG: 300 }, c: { id: 'c', weightG: 500, food: true }, d: { id: 'd', weightG: null } };
    const stats = { consumablesG: 500, zones: [{ key: 'seat', entries: [{ itemId: 'b', qty: 2 }, { itemId: 'c' }] }, { key: 'bar', entries: [{ itemId: 'a' }, { itemId: 'd' }] }, { key: 'frame', entries: [] }] };
    const w = weightByPlace(stats, itemsById, (i) => !!i.food);
    expect(w.rows).toEqual([{ key: 'bar', g: 900, missing: 1 }, { key: 'seat', g: 600, missing: 0 }, { key: 'food', g: 500, missing: 0 }]);
    expect(w.total).toBe(2000);
    expect(w.missing).toBe(1);
    expect(w.heaviest.item.id).toBe('a');
    expect(w.food).toBe(500);
  });

  it('v0.137.0 (DK3, Noah 2a): the rows add up to the one trip weight: worn bags on me, food included', () => {
    const items = [
      { id: 'a', name: 'Tent', weightG: 900, category: 'shelter', ownership: 'owned' },
      { id: 'c', name: 'Bar', weightG: 200, category: 'food', ownership: 'owned' },
      { id: 'j', name: 'Jacket', weightG: 300, category: 'clothing', ownership: 'owned' },
      { id: 'x', name: 'Lamp', weightG: null, category: 'electronics', ownership: 'owned' },
    ];
    const trip = { setup: {}, entries: [{ itemId: 'a', slot: 'mounted' }, { itemId: 'c', slot: 'mounted', qty: 2 }, { itemId: 'j', slot: 'body' }, { itemId: 'x', slot: 'body' }] };
    const stats = tripStats(trip, items, [], null, 0);
    expect(stats.packG).toBe(900 + 400 + 300);
    expect(stats.packG).toBe(stats.gearG + stats.onMeG);
    expect(stats.packG).toBe(stats.baseG + stats.wornG + stats.consumablesG);
    expect(stats.packMissing).toBe(1);
    const w = weightByPlace(stats, Object.fromEntries(items.map((i) => [i.id, i])), (i) => i.category === 'food');
    expect(w.total).toBe(stats.packG);
    expect(w.missing).toBe(stats.packMissing);
    expect(w.rows.at(-1)).toEqual({ key: 'food', g: 400, missing: 0 });
    expect(weightByPlace({ zones: [], wornBagsG: 250, wornBagsMissing: 0 }, {}).rows).toEqual([{ key: 'body', g: 250, missing: 0 }]);
  });

  it('Impeccable Touren 1: a trip on the way leads the band, day by calendar day', () => {
    const trips = [
      { id: 'a', startDate: '2026-05-10', days: 3 },
      { id: 'b', startDate: '2026-05-14', days: 1 },
    ];
    const rows = [
      { kind: 'trip', tripId: 'b', title: 'Day ride' },
      { kind: 'trip', tripId: 'a', title: 'Three days' },
    ];
    expect(rideBand(rows, trips, '2026-05-11')).toMatchObject({ state: 'ride', tripId: 'a', title: 'Three days', day: 2, total: 3 });
    expect(rideBand(rows, trips, '2026-05-12')).toMatchObject({ tripId: 'a', day: 3 });
    expect(rideBand(rows, trips, '2026-05-13')).toBeNull();
    expect(rideBand(rows, trips, '2026-05-09')).toBeNull();
    // the start day stays the packing day until packing is finished
    expect(rideBand(rows, trips, '2026-05-10')).toBeNull();
    expect(rideBand(rows, [{ ...trips[0], packedAt: '2026-05-10' }, trips[1]], '2026-05-10')).toMatchObject({ tripId: 'a', day: 1 });
    expect(rideBand([{ kind: 'replan', tripId: 'a' }], trips, '2026-05-11')).toBeNull();
  });
});
