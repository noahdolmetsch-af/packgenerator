import { describe, it, expect } from 'vitest';
import { slotOf, weekPattern, monthsOf, seasonsOf, tickDaysOf, runsAndGaps, bestWeek, extremeOf, bestMonth, isNew } from '../src/lib/analyse/patterns.js';

describe('analyse patterns and records (M4)', () => {
  it('parts of the day', () => {
    expect([6, 12, 18, 23, 2].map(slotOf)).toEqual([0, 1, 2, 3, 3]);
  });
  it('week pattern: weekday × part of the day, most and least', () => {
    const log = [
      { actId: 'a', day: '2026-10-10', at: '2026-10-10T18:00:00' }, // Saturday evening
      { actId: 'a', day: '2026-10-10', at: '2026-10-10T19:00:00' },
      { actId: 'b', day: '2026-10-07', at: '2026-10-07T12:00:00' }, // Wednesday midday
      { actId: 'b', day: '2026-10-08' }, // no time
    ];
    const p = weekPattern(log, ['2026-10-07', '2026-10-08', '2026-10-10']);
    expect(p.grid[2][5]).toBe(2);
    expect(p.grid[1][2]).toBe(1);
    expect(p.most).toEqual({ slot: 2, wd: 5 });
    expect(p.least).toEqual({ slot: 1, wd: 2 });
    expect(weekPattern(log, ['2026-10-10'], new Set(['b'])).most).toBeNull();
  });
  it('months of a year: sum or mean, not after today', () => {
    const v = { '2026-01-05': 10, '2026-01-06': 20, '2026-03-01': 5, '2026-11-01': 99 };
    const sum = monthsOf(2026, (d) => v[d] ?? null, { sum: true, today: '2026-10-27' });
    expect(sum[0]).toBe(30);
    expect(sum[1]).toBeNull();
    expect(sum[10]).toBeNull();
    expect(monthsOf(2026, (d) => v[d] ?? null, { today: '2026-10-27' })[0]).toBe(15);
    expect(seasonsOf(sum, true)).toEqual([30, 5, null, null]);
  });
  it('runs and gaps of tick days', () => {
    const days = tickDaysOf([{ actId: 'a', day: '2026-10-01' }, { actId: 'a', day: '2026-10-02' }, { actId: 'a', day: '2026-10-03' }, { actId: 'a', day: '2026-10-08' }, { actId: 'a', day: '2026-10-09' }, { actId: 'b', day: '2026-10-09' }], 'a');
    const r = runsAndGaps(days, '2026-10-10');
    expect(r).toMatchObject({ longest: 3, longestEnd: '2026-10-03', current: 2, gap: 4, gapEnd: '2026-10-08', since: 1 });
    expect(runsAndGaps(days, '2026-10-12').current).toBe(0);
    expect(runsAndGaps([], '2026-10-12').since).toBeNull();
  });
  it('best week, extremes, best month, new', () => {
    const log = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-13'].map((day) => ({ actId: 's', day }));
    expect(bestWeek(log, 's')).toEqual({ key: '2026-10-05', n: 3 });
    const v = { '2026-09-01': 50, '2026-10-01': 48, '2026-10-02': 52 };
    const days = Object.keys(v);
    expect(extremeOf(days, (d) => v[d], true)).toEqual({ v: 48, day: '2026-10-01' });
    expect(extremeOf(days, (d) => v[d])).toEqual({ v: 52, day: '2026-10-02' });
    expect(bestMonth(days, (d) => v[d])).toEqual({ key: '2026-10', v: 100 });
    expect(isNew('2026-10-20', '2026-10-27')).toBe(true);
    expect(isNew('2026-08-20', '2026-10-27')).toBe(false);
  });
});
