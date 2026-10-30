// «Analyse» M6: the rules of the page of one value (lib/analyse/detail.js). Fictional days only.
import { describe, it, expect } from 'vitest';
import { windowOf, bucketsOf, statsOf, typicalOf, mean7, weekdays, weekdayExtremes, tripBands, yearBefore, firstDay, quantile, weekdayOf } from '../src/lib/analyse/detail.js';
import { detailHref } from '../src/lib/analyse/catalog.js';

const T = '2026-10-09';

describe('windowOf', () => {
  it('ends today and goes back by whole ranges', () => {
    expect(windowOf('w', T)).toMatchObject({ from: '2026-10-03', to: T });
    expect(windowOf('w', T).days).toHaveLength(7);
    expect(windowOf('w', T, 1)).toMatchObject({ from: '2026-09-26', to: '2026-10-02' });
    expect(windowOf('d', T, 2).days).toEqual(['2026-10-07']);
  });
  it('«Alles» starts at the first value, else 30 days', () => {
    expect(windowOf('all', T, 0, '2026-10-01').days).toHaveLength(9);
    expect(windowOf('all', T).from).toBe('2026-09-10');
  });
  it('an unknown range falls back to 3 months', () => {
    expect(windowOf('x', T).days).toHaveLength(91);
  });
});

describe('bucketsOf and statsOf', () => {
  const days = windowOf('w', T).days;
  const get = (d) => (d === '2026-10-05' ? null : Number(d.slice(-2)));
  it('one point per day with gaps as null', () => {
    const p = bucketsOf(days, get);
    expect(p).toHaveLength(7);
    expect(p[2].v).toBeNull();
    expect(p[6].v).toBe(9);
  });
  it('weeks when the range is long; totals add up', () => {
    const long = windowOf('y', T).days;
    const p = bucketsOf(long, () => 2, true);
    expect(p).toHaveLength(53);
    expect(p[0].v).toBe(14);
    expect(bucketsOf(long, () => 2)[0].v).toBe(2);
  });
  it('mean, lowest and highest with their day', () => {
    const s = statsOf(days, get);
    expect(s.n).toBe(6);
    expect(s.lo).toEqual({ v: 3, day: '2026-10-03' });
    expect(s.hi).toEqual({ v: 9, day: T });
    expect(s.avg).toBeCloseTo((3 + 4 + 6 + 7 + 8 + 9) / 6);
    expect(statsOf(days, () => null)).toMatchObject({ n: 0, avg: null, lo: null });
  });
});

describe('typical range, 7-day mean, weekdays', () => {
  it('the middle half, only from 7 values', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
    expect(typicalOf(['a', 'b'], () => 1)).toBeNull();
    const days = windowOf('w', T).days;
    expect(typicalOf(days, (d) => Number(d.slice(-2)))).toEqual([4.5, 7.5]);
  });
  it('7-day mean needs 3 values', () => {
    const m = mean7([{ v: 1 }, { v: 2 }, { v: 3 }, { v: null }]);
    expect(m).toEqual([null, null, 2, 2]);
  });
  it('per weekday, Monday first, with highest and lowest', () => {
    expect(weekdayOf('2026-10-05')).toBe(0); // a Monday
    const list = weekdays(windowOf('w', T).days, (d) => (weekdayOf(d) === 6 ? 10 : 2));
    expect(list[6].v).toBe(10);
    expect(weekdayExtremes(list)).toEqual({ hi: 6, lo: 0 });
    expect(weekdayExtremes(weekdays([], () => 1))).toBeNull();
  });
});

describe('trips, year before, first day, link', () => {
  it('trips cut to the days', () => {
    const days = windowOf('w', T).days;
    const end = (tr) => tr.end;
    const b = tripBands([{ name: 'Probe', startDate: '2026-09-30', end: '2026-10-04' }, { name: 'Weg', startDate: '2026-11-01', end: '2026-11-02' }], days, end);
    expect(b).toEqual([{ name: 'Probe', from: '2026-10-03', to: '2026-10-04', a: 0, b: 1 }]);
  });
  it('year before is 52 weeks earlier (same weekday)', () => {
    expect(yearBefore([T])).toEqual(['2025-10-10']);
    expect(weekdayOf(yearBefore([T])[0])).toBe(weekdayOf(T));
  });
  it('first day with a value', () => {
    expect(firstDay(['a', 'b', 'c'], (d) => (d === 'b' ? 1 : null))).toBe('b');
    expect(firstDay(['a'], () => null)).toBeNull();
  });
  it('the link of a value', () => {
    expect(detailHref('act:abc 1')).toBe('#/auswerten/analyse/act%3Aabc%201');
  });
});
