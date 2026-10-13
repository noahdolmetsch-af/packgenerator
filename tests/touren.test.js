// v0.102.0 Design-Refresh P4 «Touren» (T1, T3): the pure helpers of the Touren pages, fictional data.
import { describe, it, expect } from 'vitest';
import { overviewCounts, weatherWindow, daysTo, weightByPlace } from '../src/lib/touren.js';

describe('touren', () => {
  it('counts by the three trip states (v0.126.0 TZ-1)', () => {
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

  it('weight by place without food, heaviest first, with the heaviest item', () => {
    const itemsById = { a: { id: 'a', weightG: 900 }, b: { id: 'b', weightG: 300 }, c: { id: 'c', weightG: 500, food: true }, d: { id: 'd', weightG: null } };
    const stats = { consumablesG: 500, zones: [{ key: 'seat', entries: [{ itemId: 'b', qty: 2 }, { itemId: 'c' }] }, { key: 'bar', entries: [{ itemId: 'a' }, { itemId: 'd' }] }, { key: 'frame', entries: [] }] };
    const w = weightByPlace(stats, itemsById, (i) => !!i.food);
    expect(w.rows).toEqual([{ key: 'bar', g: 900, missing: 1 }, { key: 'seat', g: 600, missing: 0 }]);
    expect(w.total).toBe(1500);
    expect(w.missing).toBe(1);
    expect(w.heaviest.item.id).toBe('a');
    expect(w.food).toBe(500);
  });
});
