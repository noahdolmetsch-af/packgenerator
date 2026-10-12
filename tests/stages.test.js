// v0.102.0 Design-Refresh P4 «Touren» (T3 «Etappen»): stages of a trip, fictional data only.
import { describe, it, expect } from 'vitest';
import { stageDays, hasStages, stageCuts, dayRange, stagePlan, ownStages, cleanStages, pointAtKm, gainBetween } from '../src/lib/stages.js';
import { stage } from '../src/lib/ride.js';

const line = [[47.0, 7.0], [47.1, 7.1], [47.2, 7.2], [47.3, 7.3]];
const route = { name: 'Testrunde', km: 120, gainM: 1200, start: { lat: 47.0, lon: 7.0 }, end: { lat: 47.3, lon: 7.3 }, line, profile: [[0, 400], [40, 800], [80, 600], [120, 1000]] };
const trip = (extra = {}) => ({ id: 'tt', startDate: '2026-10-20', days: 3, route, ...extra });

describe('stages', () => {
  it('counts days and only trips of two days or more get stages', () => {
    expect(stageDays({ days: 3 })).toBe(3);
    expect(stageDays({ days: 3, nonstop: true })).toBe(1);
    expect(hasStages({ days: 1 })).toBe(false);
    expect(hasStages({ days: 2 })).toBe(true);
  });

  it('shares the route out evenly without own stages', () => {
    expect(stageCuts(trip())).toEqual([40, 80, 120]);
    expect(stageCuts({ days: 2 })).toEqual([null, null]);
    expect(ownStages(trip())).toBe(false);
  });

  it('takes own cuts and falls back when a cut is not rising', () => {
    const own = trip({ stages: { start: 'A', days: [{ km: 50, name: 'B' }, { km: 70, name: 'C' }, { km: null, name: 'D' }] } });
    expect(stageCuts(own)).toEqual([50, 70, 120]);
    expect(ownStages(own)).toBe(true);
    const bad = trip({ stages: { days: [{ km: 90 }, { km: 30 }, { km: null }] } });
    expect(stageCuts(bad)).toEqual([90, 90.1, 120]);
    expect(dayRange(own, 1)).toEqual({ fromKm: 50, toKm: 70 });
  });

  it('plans the days with dates, names, km and a night after all but the last', () => {
    const plan = stagePlan(trip({ stages: { start: 'A', days: [{ km: 50, name: 'B' }, { km: 70, name: 'C' }, { km: null, name: 'D' }] } }));
    expect(plan.map((s) => [s.date, s.from, s.to, s.km, s.night])).toEqual([
      ['2026-10-20', 'A', 'B', 50, true],
      ['2026-10-21', 'B', 'C', 20, true],
      ['2026-10-22', 'C', 'D', 50, false],
    ]);
    expect(plan[2].end).toEqual({ lat: 47.3, lon: 7.3 });
    expect(plan.reduce((s, d) => s + d.gainM, 0)).toBeGreaterThan(1000);
  });

  it('cleans the sheet: numbers from text, not rising cuts out, names trimmed', () => {
    expect(cleanStages({ start: ' A ', days: [{ km: '45,5', name: ' B ' }, { km: '20', name: 'C' }, { km: '99', name: 'D' }] }, trip())).toEqual({
      start: 'A',
      days: [{ km: 45.5, name: 'B' }, { km: null, name: 'C' }, { km: null, name: 'D' }],
    });
  });

  it('finds a point along the line and the climbing of a part', () => {
    expect(pointAtKm(line, 0, 120)).toEqual({ lat: 47.0, lon: 7.0 });
    expect(pointAtKm(line, 120, 120)).toEqual({ lat: 47.3, lon: 7.3 });
    const mid = pointAtKm(line, 60, 120);
    expect(mid.lat).toBeGreaterThan(47.1);
    expect(mid.lat).toBeLessThan(47.2);
    expect(gainBetween(route, 0, 40)).toBe(Math.round((1200 * 400) / 800));
  });

  it('On the way takes the own stages (ride.js stage)', () => {
    const own = trip({ stages: { days: [{ km: 50 }, { km: 70 }, { km: null }] } });
    expect(stage(own, 0).km).toBe(50);
    expect(stage(own, 1).km).toBe(20);
    expect(stage(trip(), 1).km).toBe(40);
  });
});
