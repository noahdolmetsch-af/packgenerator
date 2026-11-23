// «Analyse» M2 «Überblick»: the rules of lib/analyse/overview.js. Fictional days only.
import { describe, it, expect } from 'vitest';
import { ticksPerDay, longestRun, heatWeeks, ranking, rankByRing, perWeek, weekDays, weekCountFor, changeOf, noticed } from '../src/lib/analyse/overview.js';
import { addDays } from '../src/lib/analyse.js';

const days = Array.from({ length: 14 }, (_, i) => addDays('2026-10-05', i)); // two weeks from a Monday
const log = [
  { actId: 'sauna', day: '2026-10-05' },
  { actId: 'gym', day: '2026-10-05' },
  { actId: 'sauna', day: '2026-10-06' },
  { actId: 'sauna', day: '2026-10-07' },
  { actId: 'gym', day: '2026-10-12' },
  { actId: 'gym', day: '2026-09-30' },
];

describe('overview', () => {
  const per = ticksPerDay(log);
  it('ticks per day and the longest run', () => {
    expect(per.get('2026-10-05')).toBe(2);
    expect(ticksPerDay(log, new Set(['gym'])).get('2026-10-05')).toBe(1);
    expect(longestRun(days, per)).toBe(3);
    expect(longestRun([], per)).toBe(0);
  });
  it('the calendar: Monday on top, levels by your own busy days', () => {
    const h = heatWeeks(days.slice(1), per);
    expect(h.weeks).toHaveLength(2);
    expect(h.weeks[0].cells[0]).toBeNull();
    expect(h.weeks[0].cells[1]).toMatchObject({ day: '2026-10-06', n: 1 });
    expect(h.weeks[1].cells[1].level).toBe(0);
    expect(heatWeeks(days, per).weeks[0].cells[0].level).toBe(4);
    expect(heatWeeks([], per)).toEqual({ weeks: [], top: 0 });
  });
  it('ranking against the same number of days before', () => {
    const acts = [{ id: 'gym' }, { id: 'sauna' }, { id: 'tennis' }];
    const r = ranking(acts, log, days);
    expect(r.map((x) => [x.id, x.n, x.prev, x.diff])).toEqual([
      ['sauna', 3, 0, 3],
      ['gym', 2, 1, 1],
    ]);
  });
  it('per week with the mean of 4 weeks', () => {
    expect(perWeek(days, per)).toEqual([
      { key: '2026-10-05', n: 4, mean4: 4 },
      { key: '2026-10-12', n: 1, mean4: 2.5 },
    ]);
  });

  it('two activities with the same name are one row (data stays), the one with more ticks leads', () => {
    const acts = [{ id: 'g1', name: 'Gym', ring: 'move' }, { id: 'g2', name: ' gym ', ring: 'rest' }];
    const l = [{ actId: 'g1', day: '2026-10-05' }, { actId: 'g1', day: '2026-10-06' }, { actId: 'g2', day: '2026-10-07' }, { actId: 'g2', day: '2026-09-30' }];
    const r = ranking(acts, l, days);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: 'g1', n: 3, prev: 1, diff: 2, ids: ['g1', 'g2'] });
    expect(r[0].act.ring).toBe('move');
  });
  it('the ranking in groups by ring, rows with 0× now in quiet', () => {
    const rank = [
      { id: 'a', act: { ring: 'move' }, n: 3, prev: 1, diff: 2 },
      { id: 'b', act: { ring: 'rest' }, n: 0, prev: 4, diff: -4 },
      { id: 'c', act: { ring: 'rest' }, n: 2, prev: 0, diff: 2 },
      { id: 'd', act: {}, n: 1, prev: 1, diff: 0 },
    ];
    const g = rankByRing(rank);
    expect(g.map((x) => [x.ring, x.rows.map((r) => r.id), x.quiet.map((r) => r.id)])).toEqual([
      ['move', ['a', 'd'], []],
      ['rest', ['c'], ['b']],
    ]);
  });
  it('whole weeks back from today, Monday first', () => {
    const w = weekDays('2026-11-25', 2); // a Wednesday
    expect(w[0]).toBe('2026-11-16');
    expect(w.at(-1)).toBe('2026-11-25');
    expect(w).toHaveLength(10);
  });
  it('the picture covers the whole period and at least 12 weeks', () => {
    const d = (n) => Array.from({ length: n }, (_, i) => addDays('2026-11-25', i - n + 1));
    expect(weekCountFor(d(30), '2026-11-25')).toBe(12);
    expect(weekCountFor(d(365), '2026-11-25')).toBe(53);
    expect(weekCountFor([], '2026-11-25')).toBe(12);
    expect(weekDays('2026-11-25', weekCountFor(d(365), '2026-11-25'))).toEqual(expect.arrayContaining(d(365)));
  });
  it('the running week is marked and stays out of every mean', () => {
    const d = weekDays('2026-10-14', 3); // Wednesday of the third week
    const per = new Map([['2026-09-30', 4], ['2026-10-07', 6], ['2026-10-14', 0]]);
    const w = perWeek(d, per, '2026-10-14');
    expect(w.map((x) => [x.key, x.n, x.running ?? false])).toEqual([['2026-09-28', 4, false], ['2026-10-05', 6, false], ['2026-10-12', 0, true]]);
    expect(w[1].mean4).toBe(5);
    expect(w[2].mean4).toBeNull();
  });
  it('the change against before in whole percent, nothing without a real before', () => {
    expect(changeOf(60, 100)).toEqual({ pct: -40, same: false });
    expect(changeOf(100, 100)).toEqual({ pct: 0, same: true });
    expect(changeOf(5, 0)).toBeNull();
    expect(changeOf(5, null)).toBeNull();
  });
  it('what stands out: most added, most dropped, the running week', () => {
    const rank = [
      { id: 'a', act: { name: 'Gym' }, n: 12, prev: 1, diff: 11 },
      { id: 'b', act: { name: 'Velo' }, n: 8, prev: 19, diff: -11 },
      { id: 'c', act: { name: 'Yoga' }, n: 5, prev: 4, diff: 1 },
    ];
    const per = new Map([['2026-11-17', 1]]); // last week Tuesday, nothing this week (Monday 23.11.)
    const n = noticed({ rank, perDay: per, today: '2026-11-23' });
    expect(n.map((x) => x.kind)).toEqual(['up', 'down', 'week']);
    expect(n[2]).toMatchObject({ n: 0, last: 0 });
    // small changes say nothing
    expect(noticed({ rank: [rank[2]], perDay: new Map(), today: null })).toEqual([]);
    // this week against the week before at the same point
    const per2 = new Map([['2026-11-16', 2], ['2026-11-23', 3]]);
    expect(noticed({ rank: [], perDay: per2, today: '2026-11-23' })).toEqual([{ kind: 'week', n: 3, last: 2 }]);
  });
});
