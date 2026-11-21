// «Sportjahr» (Noah 21.11.2026, S3): the rules behind the page. Fictional data; calendar-day arithmetic only.
import { describe, it, expect } from 'vitest';
import { training, yearBack, windowOf, prevWindow, totals, bySport, colourOf, grainOf, buckets, lastYearLine, records, weeksWith, goalOfYear, goalLine, perWeek } from '../src/lib/flow/sportjahr.js';

const TODAY = '2026-11-21';
const u = (id, day, sport, min, extra = {}) => ({ id, day, at: `${day}T07:00:00.000Z`, sport, actId: sport, ring: 'move', min, minQuelle: min ? 'gemessen' : null, quelle: 'hand', ...extra });

describe('what counts', () => {
  it('movement only; the ride to work ticked by hand is left out', () => {
    const l = [u('1', '2026-11-01', 'run', 30), u('2', '2026-11-01', 'meditation', 10, { ring: 'mind' }), u('3', '2026-11-02', 'bike', null, { quelle: 'weg' })];
    expect(training(l).map((x) => x.id)).toEqual(['1']);
  });
});

describe('windows and the year before', () => {
  it('a year earlier, 29 February becomes 28 February', () => {
    expect(yearBack('2026-11-21')).toBe('2025-11-21');
    expect(yearBack('2028-02-29')).toBe('2027-02-28');
  });
  it('the window never goes past today; «Everything» starts at the first unit', () => {
    expect(windowOf({ from: '2026-01-01', to: '2026-12-31' }, [], TODAY)).toEqual({ from: '2026-01-01', to: TODAY });
    expect(windowOf({ from: '1970-01-01', to: TODAY }, [u('1', '2022-03-05', 'run', 30)], TODAY)).toEqual({ from: '2022-03-05', to: TODAY });
    expect(prevWindow('year', { from: '2026-01-01', to: TODAY })).toEqual({ from: '2025-01-01', to: '2025-11-21' });
    expect(prevWindow('all', { from: '2022-03-05', to: TODAY })).toBeNull();
  });
});

describe('totals', () => {
  it('measured and estimated minutes apart, units, days, sports, km', () => {
    const l = [u('1', '2026-11-01', 'run', 30, { km: 5 }), u('2', '2026-11-01', 'tennis', 60, { minQuelle: 'ca.' }), u('3', '2026-11-03', 'run', 45, { km: 7.34 })];
    expect(totals(l)).toEqual({ gemessen: 75, ca: 60, n: 3, nCa: 1, days: 2, sports: 2, km: 12.3, mins: 135 });
  });
});

describe('the sports', () => {
  const now = [u('1', '2026-11-01', 'run', 30, { km: 5 }), u('2', '2026-11-02', 'bike', 120, { km: 50 }), u('3', '2026-11-03', 'bike', 60, { km: 25 }), u('4', '2026-11-04', 'yoga', 30, { minQuelle: 'ca.' })];
  const before = [u('5', '2025-11-01', 'bike', 100, { km: 40 })];
  it('most minutes first, with the year before', () => {
    const rows = bySport(now, before);
    expect(rows.map((r) => r.sport)).toEqual(['bike', 'run', 'yoga']);
    expect(rows[0]).toMatchObject({ mins: 180, n: 2, days: 2, km: 75, prev: { mins: 100, n: 1, days: 1, km: 40 } });
    expect(rows[2]).toMatchObject({ ca: 30, prev: { mins: 0, n: 0 } });
    expect(bySport(now)[0].prev).toBeNull();
  });
  it('the biggest sports get a colour, the rest is «other»', () => {
    const rows = ['a', 'b', 'c'].map((s, i) => ({ sport: s, mins: 10 - i }));
    expect([...colourOf(rows, 2)]).toEqual([['a', 0], ['b', 1], ['c', 'other']]);
  });
});

describe('the bars', () => {
  it('a year has twelve months, the months to come stay empty', () => {
    const w = { from: '2026-01-01', to: TODAY };
    const b = buckets([u('1', '2026-01-05', 'run', 30), u('2', '2026-01-20', 'bike', 60), u('3', '2026-11-02', 'run', 45)], 'year', w);
    expect(b).toHaveLength(12);
    expect(b[0]).toMatchObject({ key: '2026-01', mins: 90, n: 2, parts: { run: 30, bike: 60 } });
    expect(b[11].mins).toBe(0);
    expect(b[10].mins).toBe(45);
  });
  it('a week and a month have one bar per day; «Everything» one per year', () => {
    expect(grainOf('week', { from: '2026-11-15', to: TODAY })).toBe('day');
    expect(buckets([], 'week', { from: '2026-11-15', to: TODAY })).toHaveLength(7);
    expect(buckets([], 'month', { from: '2026-11-01', to: TODAY })).toHaveLength(21);
    const all = buckets([u('1', '2022-03-05', 'run', 30)], 'all', { from: '2022-03-05', to: TODAY });
    expect(all.map((x) => x.key)).toEqual(['2022', '2023', '2024', '2025', '2026']);
    expect(grainOf('custom', { from: '2026-01-01', to: TODAY })).toBe('month');
  });
  it('the line of last year: twelve months or nothing', () => {
    const l = [u('1', '2025-03-05', 'run', 30), u('2', '2025-03-09', 'run', 30)];
    const line = lastYearLine(l, { from: '2026-01-01', to: TODAY });
    expect(line[2]).toBe(60);
    expect(line).toHaveLength(12);
    expect(lastYearLine([], { from: '2026-01-01', to: TODAY })).toBeNull();
  });
});

describe('records and series', () => {
  it('longest week, most in one day, longest run of days', () => {
    const l = [u('1', '2026-11-02', 'run', 60), u('2', '2026-11-03', 'run', 90), u('3', '2026-11-03', 'yoga', 30), u('4', '2026-11-04', 'run', 20), u('5', '2026-11-09', 'run', 60), u('6', '2026-11-11', 'run', 10)];
    const r = records(l);
    expect(r.longestWeek).toEqual({ mon: '2026-11-02', mins: 200 });
    expect(r.mostPerDay).toEqual({ day: '2026-11-03', n: 2 });
    expect(r.longestStreak).toEqual({ days: 3, end: '2026-11-04' });
    expect(records([])).toEqual({ longestWeek: null, mostPerDay: null, longestStreak: null });
  });
  it('weeks with training: at least two units, the weeks to come are marked', () => {
    const l = [u('1', '2026-11-02', 'run', 60), u('2', '2026-11-04', 'run', 60), u('3', '2026-11-10', 'run', 60)];
    const w = weeksWith(l, 2026, TODAY);
    expect(w.length).toBeGreaterThanOrEqual(52);
    expect(w.find((x) => x.mon === '2026-11-02')).toMatchObject({ n: 2, ok: true, future: false });
    expect(w.find((x) => x.mon === '2026-11-09')).toMatchObject({ n: 1, ok: false });
    expect(w.find((x) => x.mon === '2026-11-23').future).toBe(true);
    expect(w[0].mon.slice(0, 4)).toBe('2025'); // the week with 1 January starts in December
  });
});

describe('the goal as a line (S10)', () => {
  it('uses the goal only with hours; a passed goal day draws no line and says so', () => {
    expect(goalOfYear(null, TODAY)).toBeNull();
    expect(goalOfYear({ name: 'Alps', hours: 6, until: '2027-01-04' }, TODAY)).toEqual({ name: 'Alps', hours: 6, until: '2027-01-04', passed: false });
    expect(goalOfYear({ name: 'Old', hours: 6, until: '2026-10-24' }, TODAY).passed).toBe(true);
    expect(goalOfYear({ name: 'Old', hours: null, until: '2026-10-24' }, TODAY)).toMatchObject({ hours: null, passed: true });
    expect(goalOfYear({ name: 'No hours', hours: null, until: '2027-01-04' }, TODAY)).toBeNull();
  });
  it('the line is hours per week times the days of the bar divided by 7', () => {
    const bars = [{ from: '2026-11-01', to: '2026-11-30' }, { from: '2026-11-02', to: '2026-11-02' }, { from: '2026-01-01', to: '2026-12-31' }];
    expect(goalLine(bars, 7)).toEqual([1800, 60, 21900]);
    expect(goalLine(bars, 0)).toBeNull();
    expect(goalLine(bars, null)).toBeNull();
  });
  it('hours per week of a window, counted up to today', () => {
    expect(perWeek(600, { from: '2026-11-02', to: '2026-11-08' }, TODAY)).toBe(600);
    expect(perWeek(600, { from: '2026-11-01', to: '2026-11-30' }, '2026-11-14')).toBe(Math.round((600 / 14) * 7));
    expect(perWeek(0, { from: '2026-12-01', to: '2026-12-31' }, TODAY)).toBeNull();
  });
});
