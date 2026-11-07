// «Zeitraum» on Auswerten (Noah 05.11.2026 «1a 2b 3a 4a»): the days a period covers, paging and the means over a range.
// Dates are fixed text (calendar days), fictional data only.
import { describe, it, expect } from 'vitest';
import { rangeOf, step, canStep, withMode, normalize, labelOf } from '../src/lib/flow/zeitraum.js';
import { rangeSummary, lastWeek, firstDayOf } from '../src/lib/uebersicht.js';
import { averagesBetween, averages } from '../src/lib/flowcheck.js';

const TODAY = '2026-11-05';

describe('rangeOf', () => {
  it('week = the 7 days up to today, paging moves by 7 days', () => {
    expect(rangeOf({ mode: 'week', back: 0 }, TODAY)).toEqual({ from: '2026-10-30', to: '2026-11-05', now: true });
    expect(rangeOf({ mode: 'week', back: 1 }, TODAY)).toEqual({ from: '2026-10-23', to: '2026-10-29', now: false });
  });
  it('month = the calendar month, up to today for the current one', () => {
    expect(rangeOf({ mode: 'month', back: 0 }, TODAY)).toEqual({ from: '2026-11-01', to: '2026-11-05', now: true });
    expect(rangeOf({ mode: 'month', back: 1 }, TODAY)).toEqual({ from: '2026-10-01', to: '2026-10-31', now: false });
    expect(rangeOf({ mode: 'month', back: 10 }, TODAY).from).toBe('2026-01-01');
    expect(rangeOf({ mode: 'month', back: 11 }, TODAY)).toMatchObject({ from: '2025-12-01', to: '2025-12-31' });
  });
  it('year = the calendar year, up to today for the current one', () => {
    expect(rangeOf({ mode: 'year', back: 0 }, TODAY)).toEqual({ from: '2026-01-01', to: '2026-11-05', now: true });
    expect(rangeOf({ mode: 'year', back: 1 }, TODAY)).toMatchObject({ from: '2025-01-01', to: '2025-12-31' });
  });
  it('all starts long ago and ends today', () => {
    expect(rangeOf({ mode: 'all' }, TODAY)).toMatchObject({ to: TODAY, now: false });
  });
  it('own range: from/to, swapped when upside down, never past today, incomplete = last 7 days', () => {
    expect(rangeOf({ mode: 'custom', from: '2026-10-01', to: '2026-10-09' }, TODAY)).toMatchObject({ from: '2026-10-01', to: '2026-10-09' });
    expect(rangeOf({ mode: 'custom', from: '2026-10-09', to: '2026-10-01' }, TODAY)).toMatchObject({ from: '2026-10-01', to: '2026-10-09' });
    expect(rangeOf({ mode: 'custom', from: '2026-10-01', to: '2027-01-01' }, TODAY).to).toBe(TODAY);
    expect(rangeOf({ mode: 'custom', from: '2026-10-01', to: null }, TODAY)).toMatchObject({ from: '2026-10-30', to: TODAY, incomplete: true });
  });
});

describe('paging and mode', () => {
  it('goes back and forth but never past the present', () => {
    let p = { mode: 'month', back: 0 };
    expect(canStep(p, 1)).toBe(false);
    p = step(p, -1);
    expect(p.back).toBe(1);
    expect(canStep(p, 1)).toBe(true);
    expect(step(step(p, 1), 1).back).toBe(0);
  });
  it('all and own range cannot be paged; a new mode starts at the present', () => {
    expect(canStep({ mode: 'all' }, -1)).toBe(false);
    expect(canStep({ mode: 'custom', from: '2026-10-01', to: '2026-10-02' }, -1)).toBe(false);
    expect(withMode({ mode: 'month', back: 3 }, 'year')).toEqual({ mode: 'year', back: 0, from: null, to: null });
  });
  it('normalize turns anything into a safe period', () => {
    expect(normalize(null)).toEqual({ mode: 'week', back: 0, from: null, to: null });
    expect(normalize({ mode: 'bogus', back: 5 }).mode).toBe('week');
    expect(normalize({ mode: 'all', back: 5 }).back).toBe(0);
    expect(normalize({ mode: 'custom', from: 'x', to: '2026-10-01' })).toEqual({ mode: 'custom', back: 0, from: null, to: '2026-10-01' });
  });
});

describe('labelOf', () => {
  it('names month and year, none for all', () => {
    expect(labelOf({ mode: 'year', back: 1 }, TODAY, 'de-DE')).toBe('2025');
    expect(labelOf({ mode: 'month', back: 0 }, TODAY, 'de-DE')).toBe('November 2026');
    expect(labelOf({ mode: 'all' }, TODAY, 'de-DE')).toBeNull();
  });
});

describe('rangeSummary / averagesBetween', () => {
  const row = (extra = {}) => ({ acts: [{ kind: 'bike', km: 40, movingS: 3600 }], km: 40, ...extra });
  const table = new Map([
    ['2026-10-02', row({ rhr: 50 })],
    ['2026-10-20', row({ rhr: 54 })],
    ['2026-11-03', { acts: [{ kind: 'run', km: 8, movingS: 2400 }], km: 8, rhr: 52 }],
  ]);
  it('sums sports over any range; the last 7 days are one case of it', () => {
    const month = rangeSummary(table, '2026-10-01', '2026-10-31');
    expect(month.kinds).toEqual([{ kind: 'bike', n: 2, km: 80, time: 7200 }]);
    expect(month.rhr).toBe(52);
    expect(lastWeek(table, TODAY)).toEqual(rangeSummary(table, '2026-10-30', TODAY));
    expect(lastWeek(table, TODAY).kinds.map((k) => k.kind)).toEqual(['run']);
  });
  it('a range before the first day starts there, an empty range is empty', () => {
    expect(firstDayOf(table)).toBe('2026-10-02');
    expect(rangeSummary(table, '1970-01-01', TODAY).kinds.find((k) => k.kind === 'bike').n).toBe(2);
    expect(rangeSummary(table, '2025-01-01', '2025-12-31').kinds).toEqual([]);
  });
  it('means of the questions over a range equal the 7-day mean for the same days', () => {
    const checks = [{ day: '2026-11-04', sleep: 4, energy: 3, mood: 5 }, { day: '2026-11-05', sleep: 2, energy: 3, mood: 4 }, { day: '2026-09-01', sleep: 5, energy: 5, mood: 5 }];
    expect(averagesBetween(checks, '2026-10-30', TODAY).sleep.mean).toBe(averages(checks, TODAY, 7).sleep.mean);
    expect(averagesBetween(checks, '1970-01-01', TODAY).sleep.mean).toBe(3.7);
    expect(averagesBetween(checks, '2025-01-01', '2025-02-01').sleep.mean).toBeNull();
    expect(averagesBetween([], '2026-10-01', TODAY).mood.mean).toBeNull();
  });
});
