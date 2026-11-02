// «Analyse» M2 «Überblick»: the rules of lib/analyse/overview.js. Fictional days only.
import { describe, it, expect } from 'vitest';
import { ticksPerDay, longestRun, heatWeeks, ranking, perWeek } from '../src/lib/analyse/overview.js';
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
});
