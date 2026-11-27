import { describe, it, expect } from 'vitest';
import { arrivalReport, atGoal, darkMinutes, AT_GOAL_KM } from '../src/lib/live/ankunft.js';

const H = 36e5;
const START = Date.UTC(2027, 5, 12, 5, 0); // 07:00 in Zurich
const plan = { etaOf: (km) => START + 10 * H, offH: 1 };

describe('Ankunfts-Bericht', () => {
  it('knows when you are at the end of the route', () => {
    expect(atGoal({ km: 99.8, totalKm: 100 })).toBe(true);
    expect(atGoal({ km: 98, totalKm: 100 })).toBe(false);
    expect(atGoal({ km: null, totalKm: 100 })).toBe(false);
    expect(atGoal({ km: 0.1, totalKm: 0.2 })).toBe(false); // a route of a few metres has no end to reach
    expect(AT_GOAL_KM).toBe(0.3);
  });
  it('gives the times against the plan: later (+) or earlier (-), and the rest against the planned rest', () => {
    const r = arrivalReport({ startAt: START, endAt: START + 11 * H, movingS: 9 * 3600, stops: [{ s: 600 }, { s: 1800 }], plan, totalKm: 100, bat: { from: 0.9, to: 0.4 } });
    expect(r.totalS).toBe(11 * 3600);
    expect(r.movingS).toBe(9 * 3600);
    expect(r.restS).toBe(2 * 3600);
    expect(r.plan.lateMin).toBe(60);
    expect(r.plan.restDiffMin).toBe(60); // 2 h rest against 1 h planned
    expect(r.stops).toEqual({ n: 2, totalS: 2400, longestS: 1800 });
    expect(r.battery).toEqual({ from: 90, to: 40, usedPct: 50 });
  });
  it('has no plan part without a plan and no battery part without readings', () => {
    const r = arrivalReport({ startAt: START, endAt: START + 3 * H, movingS: 3 * 3600 });
    expect(r.plan).toBeNull();
    expect(r.battery).toBeNull();
    expect(r.stops.n).toBe(0);
    expect(arrivalReport({ startAt: START, endAt: START })).toBeNull();
  });
  it('counts the minutes of darkness ridden, and the share of a full lamp charge', () => {
    expect(darkMinutes(47.37, 8.54, START, START + 3 * H)).toBe(0); // 07:00-10:00 in June
    const night = Date.UTC(2027, 5, 12, 20, 0); // 22:00 in Zurich
    expect(darkMinutes(47.37, 8.54, night, night + 2 * H)).toBeGreaterThan(100);
    const r = arrivalReport({ startAt: night, endAt: night + 2 * H, movingS: 7200, lat: 47.37, lon: 8.54, lights: [{ name: 'Front', pctPerMin: 100 / 480 }, { name: 'Rear', pctPerMin: 0 }] });
    expect(r.dark.min).toBeGreaterThan(100);
    expect(r.dark.lights).toHaveLength(1); // a light that used nothing is not listed
    expect(r.dark.lights[0].name).toBe('Front');
    expect(r.dark.lights[0].pct).toBeGreaterThan(20);
    expect(r.dark.lights[0].pct).toBeLessThanOrEqual(30);
  });
});
