import { describe, it, expect } from 'vitest';
import { goalsOf, yearShare, yearSums, goalRow, co2Saved, GOALS } from '../src/lib/flow/yeargoals.js';

describe('«Werte überall» WU3 year goals', () => {
  it('starts with a goal for every value, all on', () => {
    const g = goalsOf(null);
    expect(Object.keys(g)).toEqual(GOALS.map((x) => x.key));
    expect(g.km).toEqual({ on: true, of: 5000 });
  });
  it('keeps a switched-off goal and a changed number, and ignores nonsense', () => {
    const g = goalsOf({ km: { on: false, of: 6000 }, hm: { of: -3 } });
    expect(g.km).toEqual({ on: false, of: 6000 });
    expect(g.hm.of).toBe(50000);
  });
  it('counts the share of the year by calendar days', () => {
    expect(yearShare('2026-01-01')).toBeCloseTo(1 / 365);
    expect(yearShare('2026-12-31')).toBe(1);
  });
  it('sums only this year up to today, climbing where the ride knows it', () => {
    const rides = [{ date: '2026-03-01', km: 40.4, gainM: 500 }, { date: '2026-10-13T07:00:00Z', km: 20, gainM: null }, { date: '2025-12-31', km: 99, gainM: 900 }, { date: '2026-10-14', km: 5, gainM: 50 }];
    expect(yearSums(rides, '2026-10-13')).toEqual({ km: 60, hm: 500 });
  });
  it('says how far before or behind the plan', () => {
    const r = goalRow(3000, 5000, '2026-07-02');
    expect(r.fill).toBeCloseTo(0.6);
    expect(r.ahead).toBe(Math.round(3000 - 5000 * (183 / 365)));
  });
  it('estimates the CO₂ saved', () => {
    expect(co2Saved(2760)).toBe(414);
  });
});
