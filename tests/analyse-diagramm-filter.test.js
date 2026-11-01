// «Eigenes Diagramm» D4: the filter rules of lib/analyse/diagram.js. Fictional days only.
import { describe, it, expect } from 'vitest';
import { cleanFilter, filterCount, keepOf, bothKeep, dropOutliers, tripDaySet, tickDays, EMPTY_FILTER } from '../src/lib/analyse/diagram.js';

const MON = '2026-10-05';
const SAT = '2026-10-10';

describe('cleanFilter and filterCount', () => {
  it('unknown parts fall back to «all»; all 7 weekdays mean no weekday filter', () => {
    expect(cleanFilter(null)).toEqual(EMPTY_FILTER);
    expect(cleanFilter({ wd: [0, 1, 2, 3, 4, 5, 6] }).wd).toEqual([]);
    expect(cleanFilter({ wd: [4, 0, 9, 0], act: { id: 'x', mode: 'nope' }, trip: 'x', felt: { part: 'energy', op: 'hi' }, outliers: 'yes' })).toEqual({ wd: [0, 4], act: null, trip: 'all', felt: { part: 'energy', op: 'hi' }, outliers: false });
    expect(filterCount(cleanFilter({ wd: [0], trip: 'only', outliers: true }))).toBe(3);
  });
});

describe('keepOf', () => {
  const ctx = { ticks: tickDays([{ actId: 'sauna', day: MON }]), tripDays: tripDaySet([{ startDate: SAT, days: 2 }], (tr) => '2026-10-11'), felt: (p, d) => (d === MON ? 8 : d === SAT ? 3 : null) };
  it('weekdays, activity, trips and «Wi gaht\'s?»', () => {
    expect(keepOf(cleanFilter({ wd: [0, 1, 2, 3, 4] }), ctx)(SAT)).toBe(false);
    expect(keepOf(cleanFilter({ wd: [0, 1, 2, 3, 4] }), ctx)(MON)).toBe(true);
    expect(keepOf(cleanFilter({ act: { id: 'sauna', mode: 'with' } }), ctx)(MON)).toBe(true);
    expect(keepOf(cleanFilter({ act: { id: 'sauna', mode: 'with' } }), ctx)(SAT)).toBe(false);
    expect(keepOf(cleanFilter({ act: { id: 'sauna', mode: 'without' } }), ctx)(MON)).toBe(false);
    expect(keepOf(cleanFilter({ trip: 'only' }), ctx)('2026-10-11')).toBe(true);
    expect(keepOf(cleanFilter({ trip: 'without' }), ctx)(SAT)).toBe(false);
    expect(keepOf(cleanFilter({ felt: { part: 'energy', op: 'hi' } }), ctx)(MON)).toBe(true);
    expect(keepOf(cleanFilter({ felt: { part: 'energy', op: 'lo' } }), ctx)(SAT)).toBe(true);
    expect(keepOf(cleanFilter({ felt: { part: 'energy', op: 'lo' } }), ctx)('2026-10-06')).toBe(false);
    expect(keepOf(EMPTY_FILTER, ctx)('2026-10-06')).toBe(true);
  });
  it('the value filter comes on top of the one for everything', () => {
    const all = keepOf(cleanFilter({ wd: [0, 5] }), ctx);
    const own = keepOf(cleanFilter({ trip: 'only' }), ctx);
    expect(bothKeep(all, own)(SAT)).toBe(true);
    expect(bothKeep(all, own)(MON)).toBe(false);
    expect(bothKeep(all, null)).toBe(all);
  });
});

describe('outliers, trip days, ticked days', () => {
  it('drops values far off the middle half, not under 8 values', () => {
    const v = [10, 11, 10, 12, 11, 10, 11, 12, 60, null];
    expect(dropOutliers(v)).toEqual([10, 11, 10, 12, 11, 10, 11, 12, null, null]);
    expect(dropOutliers([1, 2, 99])).toEqual([1, 2, 99]);
  });
  it('trip days and ticked days', () => {
    expect([...tripDaySet([{ startDate: SAT }], () => '2026-10-12')]).toEqual([SAT, '2026-10-11', '2026-10-12']);
    expect(tripDaySet([{ startDate: null }], () => null).size).toBe(0);
    expect(tickDays([{ actId: 'a', day: MON }, { actId: 'a', day: MON }, { day: MON }]).get('a').size).toBe(1);
  });
});
