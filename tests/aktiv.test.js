// v0.105.0 Design-Refresh P8 «Aktiv»: the pure rules of the new Aktiv pages (src/lib/flow/aktiv.js).
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { monthWeeks, seasonNow, goalPath, lastSeven, monthNumbers, helpedStats, medRecords, isoWeek, hourDepth, usualHour } from '../src/lib/flow/aktiv.js';

const TODAY = '2026-10-09';

describe('monthWeeks (A1 Velo diesen Monat)', () => {
  it('sums this month up to today per week and compares with last month', () => {
    const rides = [
      { date: '2026-10-02', km: 40 },
      { date: '2026-10-08', km: 20.4 },
      { date: '2026-10-09T07:00:00Z', km: 10 },
      { date: '2026-10-20', km: 99 },
      { date: '2026-09-03', km: 35 },
      { date: '2026-09-25', km: 80 },
    ];
    const r = monthWeeks(rides, TODAY);
    expect(r.km).toBe(70);
    expect(r.pct).toBe(100);
    expect(r.weeks).toEqual([40, 30, null, null]);
  });
  it('has no trend without rides last month', () => {
    expect(monthWeeks([{ date: '2026-10-01', km: 5 }], TODAY).pct).toBeNull();
  });
});

describe('seasonNow', () => {
  it('is null without an activity with a season', () => {
    expect(seasonNow([{ id: 'yoga' }], TODAY)).toBeNull();
  });
});

describe('goalPath (B22)', () => {
  it('shows the stations around where you are', () => {
    const p = goalPath({ steps: [10, 25, 50, 100, 250], next: 4, value: 75 });
    expect(p.stations[0].reached).toBe(true);
    expect(p.stations.some((s) => !s.reached)).toBe(true);
    expect(p.value).toBe(75);
    expect(p.target).toBeGreaterThanOrEqual(100);
    expect(p.left).toBe(p.target - 75);
    expect(p.next).toBe(p.stations.filter((s) => !s.reached).length);
  });
  it('is null without steps', () => {
    expect(goalPath(null)).toBeNull();
    expect(goalPath({ steps: [] })).toBeNull();
  });
});

describe('lastSeven (A14)', () => {
  it('gives seven days, today last, with the minutes', () => {
    const log = [
      { actId: 'meditation', day: '2026-10-09', min: 20 },
      { actId: 'meditation', day: '2026-10-09', min: 5 },
      { actId: 'meditation', day: '2026-10-05', min: 0 },
      { actId: 'yoga', day: '2026-10-08', min: 30 },
    ];
    const d = lastSeven(log, 'meditation', TODAY);
    expect(d.map((x) => x.day)).toEqual(['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
    expect(d[6]).toEqual({ day: '2026-10-09', min: 25, any: true });
    expect(d[2]).toEqual({ day: '2026-10-05', min: 0, any: true });
    expect(d[5].any).toBe(false);
  });
});

describe('monthNumbers (A14)', () => {
  it('compares this month with last month up to the same day', () => {
    const rows = [
      { day: '2026-10-01', min: 20, depth: 4 },
      { day: '2026-10-01', min: 10, depth: null },
      { day: '2026-10-07', min: 30, depth: 3 },
      { day: '2026-09-02', min: 15, depth: 3 },
      { day: '2026-09-20', min: 60, depth: 5 },
    ];
    expect(monthNumbers(rows, TODAY)).toEqual({ now: { min: 60, days: 2, depth: 3.5, of: 9 }, before: { min: 15, days: 1, depth: 3 } });
  });
});

describe('helpedStats (A14c)', () => {
  it('counts what helped and the mean depth, most often first', () => {
    const rows = [
      { helped: ['early', 'candle'], depth: 5 },
      { helped: ['early'], depth: 4 },
      { helped: ['early'], depth: null },
      { helped: ['candle'], depth: 3 },
      { helped: [] },
    ];
    expect(helpedStats(rows)).toEqual([
      { id: 'early', n: 3, depth: 4.5 },
      { id: 'candle', n: 2, depth: 4 },
    ]);
  });
});

describe('medRecords (A14c)', () => {
  it('finds the longest, the deepest and the best week', () => {
    const rows = [
      { day: '2026-10-05', min: 45, depth: 3 },
      { day: '2026-10-06', min: 30, depth: 5 },
      { day: '2026-10-07', min: 45, depth: 5 },
      { day: '2026-09-28', min: 20, depth: null },
    ];
    const r = medRecords(rows);
    expect(r.longest.day).toBe('2026-10-07');
    expect(r.deepest.day).toBe('2026-10-07');
    expect(r.week).toEqual({ monday: '2026-10-05', min: 120 });
  });
  it('is empty without sessions', () => {
    expect(medRecords([])).toEqual({ longest: null, deepest: null, week: null });
  });
});

describe('isoWeek', () => {
  it('numbers the weeks like the calendar', () => {
    expect(isoWeek('2026-10-05')).toBe(41);
    expect(isoWeek('2026-01-01')).toBe(1);
    expect(isoWeek('2027-01-01')).toBe(53);
  });
});

describe('hourDepth and usualHour (A14, A14c)', () => {
  it('counts per hour with the mean depth', () => {
    const rows = [
      { hour: 7, depth: 5 },
      { hour: 7, depth: 4 },
      { hour: 7, depth: null },
      { hour: 21, depth: 3 },
      { hour: null },
    ];
    const h = hourDepth(rows);
    expect(h).toHaveLength(24);
    expect(h[7]).toEqual({ h: 7, n: 3, depth: 4.5 });
    expect(h[21]).toEqual({ h: 21, n: 1, depth: 3 });
    expect(h[12]).toEqual({ h: 12, n: 0, depth: null });
    expect(usualHour(rows)).toBe(7);
    expect(usualHour([])).toBeNull();
  });
});
