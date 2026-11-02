import { describe, it, expect } from 'vitest';
import { compareWindows, running, sameDay, weeklyCounts, meanPerWeek, aroundTrip, pastTrips } from '../src/lib/analyse/compare.js';

describe('analyse compare (M3)', () => {
  it('month: from the 1st to today against the whole month before', () => {
    const w = compareWindows('2026-10-27', 'month');
    expect(w.now.from).toBe('2026-10-01');
    expect(w.now.days).toHaveLength(27);
    expect(w.prev.from).toBe('2026-09-01');
    expect(w.prev.to).toBe('2026-09-30');
    expect(compareWindows('2026-01-10', 'month').prev.from).toBe('2025-12-01');
  });
  it('week starts on Monday; year on 1 January', () => {
    const w = compareWindows('2026-10-27', 'week'); // a Tuesday
    expect(w.now.from).toBe('2026-10-26');
    expect(w.prev.days).toHaveLength(7);
    const y = compareWindows('2026-10-27', 'year');
    expect(y.now.from).toBe('2026-01-01');
    expect(y.prev.to).toBe('2025-12-31');
  });
  it('running total for sums, running mean otherwise', () => {
    const v = { a: 2, c: 4 };
    expect(running(['a', 'b', 'c'], (d) => v[d], true)).toEqual([2, 2, 6]);
    expect(running(['b', 'a', 'c'], (d) => v[d], false)).toEqual([null, 2, 3]);
  });
  it('same day of the period before, or its last day', () => {
    expect(sameDay([1, 5], [1, 3, 9])).toEqual({ now: 5, prev: 3, diff: 2, at: 1 });
    expect(sameDay([1, 2, 3, 4], [1, 2])).toMatchObject({ prev: 2, at: 1 });
    expect(sameDay([], [1])).toBeNull();
  });
  it('counts ticks per week for the chosen activities', () => {
    const log = [
      { actId: 'gym', day: '2026-10-26' },
      { actId: 'gym', day: '2026-10-27' },
      { actId: 'yoga', day: '2026-10-20' },
      { actId: 'gym', day: '2026-10-28' }, // after today
    ];
    const w = weeklyCounts(log, ['gym', 'yoga'], '2026-10-27', 2);
    expect(w.map((x) => x.key)).toEqual(['2026-10-19', '2026-10-26']);
    expect(w[1].n).toEqual({ gym: 2, yoga: 0 });
    expect(w[0].n.yoga).toBe(1);
    expect(meanPerWeek(w, 'gym')).toBe(1);
  });
  it('the days before a trip against the days after it', () => {
    const v = { '2026-10-09': 6, '2026-10-08': 8, '2026-10-13': 9, '2026-10-14': 7 };
    const r = aroundTrip({ startDate: '2026-10-10' }, '2026-10-12', (d) => v[d] ?? null, '2026-10-14', 7);
    expect(r).toMatchObject({ before: 7, after: 8, diff: 1, afterDays: 2 });
    expect(aroundTrip(null, null, () => 1, '2026-10-14')).toBeNull();
  });
  it('past trips, newest first', () => {
    const trips = [{ id: 1, startDate: '2026-09-01' }, { id: 2, startDate: '2026-10-20' }, { id: 3, startDate: '2026-10-30' }];
    expect(pastTrips(trips, (tr) => tr.startDate, '2026-10-27').map((t) => t.id)).toEqual([2, 1]);
  });
});
