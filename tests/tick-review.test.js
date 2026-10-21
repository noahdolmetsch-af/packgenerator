import { describe, it, expect } from 'vitest';
import { mondayOf, fromOf, longestRun, currentRun, tilesOf, perWeek, weekdays, hours, daily, gridOf, halvesOf, bestTable, months } from '../src/lib/flow/auswertung.js';

// fictional ticks: Monday 2026-10-05 … Sunday 2026-10-18
const e = (actId, day, extra = {}) => ({ id: `${actId}-${day}-${extra.k ?? 0}`, actId, day, at: `${day}T07:30:00Z`, n: 1, ...extra });
const LOG = [
  e('yoga', '2026-10-05', { min: 30 }),
  e('yoga', '2026-10-06', { min: 30 }),
  e('yoga', '2026-10-07', { min: 20 }),
  e('sauna', '2026-10-07', { k: 1 }),
  e('pushups', '2026-10-12', { n: 10 }),
  e('pushups', '2026-10-13', { n: 10 }),
  e('meditation', '2026-10-18', { min: 15 }),
];

describe('Auswertung deiner Aktivitäten (rules)', () => {
  it('weeks start on Monday, periods end today', () => {
    expect(mondayOf('2026-10-18')).toBe('2026-10-12');
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
    expect(fromOf('2026-10-18', 14)).toBe('2026-10-05');
  });
  it('runs of days in a row', () => {
    expect(longestRun(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-07', '2026-10-12'])).toBe(3);
    expect(longestRun([])).toBe(0);
    expect(currentRun(['2026-10-16', '2026-10-17'], '2026-10-18')).toBe(2);
    expect(currentRun(['2026-10-17', '2026-10-18'], '2026-10-18')).toBe(2);
    expect(currentRun(['2026-10-15'], '2026-10-18')).toBe(0);
  });
  it('the key tiles of a period', () => {
    const k = tilesOf(LOG, '2026-10-05', '2026-10-18', '2026-10-18');
    expect(k).toMatchObject({ days: 6, ticks: 7, amount: 25, min: 95, perWeek: 3.5, longest: 3, current: 1, acts: 4 });
  });
  it('ticks per week by ring', () => {
    const ring = { yoga: 'move', pushups: 'move', sauna: 'rest', meditation: 'mind' };
    const w = perWeek(LOG, '2026-10-05', '2026-10-18', (id) => ring[id]);
    expect(w.map((x) => x.mon)).toEqual(['2026-10-05', '2026-10-12']);
    expect(w[0]).toMatchObject({ n: 4, rings: { move: 3, mind: 0, rest: 1 } });
    expect(w[1]).toMatchObject({ n: 3, rings: { move: 2, mind: 1, rest: 0 } });
  });
  it('weekdays and times of day add up to the ticks', () => {
    const wd = weekdays(LOG);
    expect(wd.map((x) => x.n)).toEqual([2, 2, 2, 0, 0, 0, 1]);
    const h = hours(LOG);
    expect(h.reduce((s, x) => s + x.n, 0)).toBe(7);
  });
  it('per day with the 7-day mean', () => {
    const d = daily(LOG, '2026-10-05', '2026-10-11');
    expect(d).toHaveLength(7);
    expect(d[2]).toMatchObject({ day: '2026-10-07', n: 2 });
    expect(d[6].mean).toBe(Math.round((4 / 7) * 100) / 100);
  });
  it('the grid activity × weekday leaves out activities without a tick', () => {
    const g = gridOf(LOG, ['yoga', 'run', 'pushups']);
    expect(g.map((r) => r.id)).toEqual(['yoga', 'pushups']);
    expect(g[0].n).toEqual([1, 1, 1, 0, 0, 0, 0]);
  });
  it('first against second half', () => {
    const h = halvesOf(LOG, '2026-10-05', '2026-10-18');
    expect(h.rows.map((r) => r.ticks)).toEqual([4, 3]);
    expect(h.ticks).toEqual({ p: 25, dir: 'less' });
    expect(halvesOf([], '2026-10-05', '2026-10-18')).toBeNull();
  });
  it('best values against 90 days and the year', () => {
    const b = bestTable(LOG, '2026-10-12', '2026-10-18');
    const run = b.rows.find((r) => r.k === 'run');
    expect(run).toMatchObject({ me: 2, d90: 3, year: 3, star: false });
    expect(b.rows.find((r) => r.k === 'day')).toMatchObject({ me: 1, d90: 2 });
    expect(bestTable([], '2026-10-12', '2026-10-18')).toBeNull();
  });
  it('per month, newest first, cut to the period', () => {
    const m = months(LOG, '2026-09-20', '2026-10-18');
    expect(m.map((x) => x.m)).toEqual(['2026-10', '2026-09']);
    expect(m[0]).toMatchObject({ ticks: 7, days: 6, min: 95 });
    expect(m[1].ticks).toBe(0);
  });
});

import { valuesOf, valueQuestions, valueTiles, valueDaily, valueWeekdays, valueHalves, valueMonths } from '../src/lib/flow/auswertung.js';
describe('Auswertung deiner Antworten (rules)', () => {
  const r = (qid, day, value, kind = 'scale') => ({ id: `${qid}-${day}`, qid, day, at: `${day}T08:00`, kind, value });
  const ROWS = [r('erholung.akku', '2026-10-05', 6), r('erholung.akku', '2026-10-06', 8), r('erholung.akku', '2026-10-12', 4), r('erholung.akku', '2026-10-13', 6), r('erholung.kaffee', '2026-10-13', 2, 'number'), r('x.text', '2026-10-13', 'gut', 'text'), r('tour', '2026-10-13', 40, 'ride')];
  it('only answers with a number count', () => {
    expect(valueQuestions(ROWS)).toEqual([{ qid: 'erholung.akku', n: 4 }, { qid: 'erholung.kaffee', n: 1 }]);
    expect(valuesOf(ROWS, 'erholung.akku').map((x) => x.v)).toEqual([6, 8, 4, 6]);
  });
  it('tiles, per day, weekdays', () => {
    const v = valuesOf(ROWS, 'erholung.akku');
    expect(valueTiles(v, '2026-10-05', '2026-10-18')).toMatchObject({ n: 4, days: 4, mean: 6, min: 4, max: 8 });
    const d = valueDaily(v, '2026-10-05', '2026-10-11');
    expect(d[0]).toMatchObject({ v: 6, mean: 6 });
    expect(d[2]).toMatchObject({ v: null, mean: 7 });
    expect(valueWeekdays(v).slice(0, 2).map((x) => x.mean)).toEqual([5, 7]);
  });
  it('halves and months', () => {
    const v = valuesOf(ROWS, 'erholung.akku');
    expect(valueHalves(v, '2026-10-05', '2026-10-18')).toMatchObject({ rows: [{ mean: 7 }, { mean: 5 }], change: { p: 29, dir: 'less' } });
    expect(valueMonths(v, '2026-09-20', '2026-10-18')).toEqual([{ m: '2026-10', n: 4, mean: 6, min: 4, max: 8 }, { m: '2026-09', n: 0, mean: null, min: null, max: null }]);
  });
});
