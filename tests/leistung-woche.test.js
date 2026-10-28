// TR7d–TR7f «Analysen über die Wochen» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the pure maths of the week
// cards (src/lib/training/week/weeks.js). Calendar days only (shiftDay), fictional activities.
import { describe, it, expect } from 'vitest';
import { shiftDay, mondayOf, isoWeek, DEFAULT_BOUNDS } from '../src/lib/training.js';
import {
  actLoad, loadsOf, dailyLoads, weekLoads, mondays, curveBests, nearSame, monthStart, daysBetween,
  effPoints, trendOf, sums, monthSums, defaultMonths, lastYearDay, yearSums, niceTicks, WEEKS, CURVE_SPANS,
} from '../src/lib/training/week/weeks.js';

const TODAY = '2026-10-14'; // a Wednesday, KW 42
const act = (id, day, f = {}) => ({ id, day, km: 40, hm: 500, movingS: 3600, hrAvg: 130, wNorm: null, effort: null, ...f });
const Z2 = { 120: 3000, 100: 300, 140: 200 }; // most time at 120 bpm: Z2 with the standard bounds

describe('the load of one activity', () => {
  it('power load with a power meter and an FTP, else Relative Effort, else 0', () => {
    const ref = act('r', shiftDay(TODAY, -10), { w20: 250 }); // FTP 238
    const p = act('p', TODAY, { wNorm: 238, effort: 99 });
    expect(actLoad(p, [ref, p])).toBe(100); // (238/238)² × 1 h × 100
    expect(actLoad(act('e', TODAY, { effort: 55 }), [ref])).toBe(55);
    expect(actLoad(act('n', TODAY, { wNorm: 200, effort: 42 }), [])).toBe(42); // no FTP: the effort
    expect(actLoad(act('z', TODAY), [])).toBe(0);
  });
  it('per day the sum', () => {
    const acts = [act('a', TODAY, { effort: 30 }), act('b', TODAY, { effort: 20 }), act('c', shiftDay(TODAY, -1), { effort: 5 })];
    const d = dailyLoads(acts, loadsOf(acts));
    expect(d.get(TODAY)).toBe(50);
    expect(d.get(shiftDay(TODAY, -1))).toBe(5);
  });
});

describe('load per week', () => {
  it('16 weeks, sums, empty weeks, this week marked', () => {
    const acts = [act('a', TODAY, { effort: 40 }), act('b', shiftDay(TODAY, 1), { effort: 99 }), act('c', shiftDay(mondayOf(TODAY), -1), { effort: 30 }), act('d', shiftDay(mondayOf(TODAY), -7), { effort: 20 })];
    const w = weekLoads(acts, TODAY);
    expect(w).toHaveLength(16);
    expect(w.at(-1)).toMatchObject({ load: 40, n: 1, current: true, kw: 42 }); // tomorrow does not count
    expect(w.at(-2)).toMatchObject({ load: 50, n: 2, current: false, kw: 41 });
    expect(w.at(-3)).toMatchObject({ load: 0, n: 0 });
    expect(mondays(TODAY, 3)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12']);
  });
});

describe('the power curve: 90 days against the year', () => {
  it('per span the best of the last 90 days and of the calendar year, with the day', () => {
    const c = (w20, w60) => CURVE_SPANS.map((s) => [s, s === 1200 ? w20 : s === 3600 ? w60 : 300]);
    const acts = [act('a', shiftDay(TODAY, -20), { pCurve: c(251, 214) }), act('b', '2026-05-12', { pCurve: c(262, 219) }), act('c', '2025-12-30', { pCurve: c(300, 300) })];
    const r = curveBests(acts, TODAY);
    const at = (s) => r.find((x) => x.span === s);
    expect(at(1200)).toEqual({ span: 1200, d90: { w: 251, day: shiftDay(TODAY, -20) }, year: { w: 262, day: '2026-05-12' } });
    expect(at(3600).d90.w).toBe(214);
    expect(nearSame(214, 219)).toBe('near');
    expect(nearSame(251, 262)).toBeNull();
    expect(nearSame(200, 206)).toBeNull(); // 2.9 %
    expect(nearSame(200, 200)).toBe('same');
    expect(curveBests([act('x', TODAY)], TODAY).every((x) => !x.d90 && !x.year)).toBe(true);
  });
});

describe('efficiency: watts per heartbeat', () => {
  it('only calm rides (Z2) with power and heart rate in the last four months, and a rising trend', () => {
    const acts = [];
    for (let i = 0; i < 10; i++) acts.push(act(`e${i}`, shiftDay('2026-07-01', i * 10), { wNorm: 190 + i * 2, hrAvg: 135, hist: Z2 }));
    acts.push(act('hard', '2026-08-15', { wNorm: 260, hrAvg: 160, hist: { 160: 3000 } })); // Z4: not calm
    acts.push(act('nopm', '2026-08-16', { hrAvg: 130, hist: Z2 })); // no power meter
    acts.push(act('old', '2026-06-20', { wNorm: 190, hrAvg: 135, hist: Z2 })); // before July
    const r = effPoints(acts, TODAY, DEFAULT_BOUNDS);
    expect(r.from).toBe('2026-07-01');
    expect(r.pts).toHaveLength(10);
    expect(r.pts[0]).toEqual({ day: '2026-07-01', x: 0, v: Math.round((190 / 135) * 1000) / 1000 });
    expect(r.trend.b).toBeGreaterThan(0);
    expect(r.trend.end).toBeGreaterThan(r.trend.start);
  });
  it('least squares on a straight line', () => {
    const t = trendOf([{ x: 0, v: 1 }, { x: 10, v: 2 }, { x: 20, v: 3 }], 30);
    expect(t.b).toBeCloseTo(0.1, 9);
    expect(t.start).toBeCloseTo(1, 9);
    expect(t.end).toBeCloseTo(4, 9);
    expect(trendOf([{ x: 1, v: 1 }], 5)).toBeNull();
  });
  it('calendar helpers', () => {
    expect(monthStart(TODAY, 3)).toBe('2026-07-01');
    expect(monthStart('2026-02-10', 3)).toBe('2025-11-01');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // over the clock change
    expect(isoWeek('2026-10-14')).toBe(42);
  });
});

describe('month against month, year against year', () => {
  it('sums of every sport; the last full month against the one before', () => {
    const acts = [act('a', '2026-09-03', { km: 50.4, hm: 700, movingS: 5400, effort: 60 }), act('b', '2026-09-20', { km: 9.1, hm: 80, movingS: 1800, effort: 30 }), act('c', '2026-08-10', { km: 40, hm: 500, movingS: 3600 })];
    expect(defaultMonths(TODAY)).toEqual(['2026-09', '2026-08']);
    expect(defaultMonths('2026-01-05')).toEqual(['2025-12', '2025-11']);
    expect(monthSums(acts, '2026-09')).toEqual({ km: 60, hm: 780, h: 2, load: 90, n: 2 });
    expect(sums([], new Map())).toEqual({ km: 0, hm: 0, h: 0, load: 0, n: 0 });
  });
  it('this year to today against last year to the same day', () => {
    const acts = [act('a', '2026-01-01'), act('b', TODAY), act('c', shiftDay(TODAY, 1)), act('d', '2025-10-14'), act('e', '2025-10-15'), act('f', '2024-12-31')];
    const y = yearSums(acts, TODAY);
    expect(y.cur).toMatchObject({ year: '2026', to: TODAY, n: 2, km: 80 });
    expect(y.prev).toMatchObject({ year: '2025', to: '2025-10-14', n: 1 });
    expect(lastYearDay('2028-02-29')).toBe('2027-02-28');
  });
});

describe('axis ticks', () => {
  it('round steps covering the range', () => {
    expect(niceTicks(-15, 62, 4).ticks).toEqual([-20, 0, 20, 40, 60, 80]);
    expect(niceTicks(1.37, 1.54, 3).ticks).toEqual([1.3, 1.4, 1.5, 1.6]);
  });
});
