// «Zielzeit nonstop» (Noah 27.10.2026): a made-up 300 km race.
import { describe, it, expect } from 'vitest';
import { nonstop, hm } from '../src/lib/race/nonstop.js';

describe('finish time riding through', () => {
  it('needs km and a start', () => {
    expect(nonstop({})).toBeNull();
    expect(nonstop({ km: 300 })).toBeNull();
  });
  it('riding time from km and metres up, stops and naps on top', () => {
    const [good, plan, hard] = nonstop({ km: 300, gainM: 6500, start: '2027-05-04T06:00', flatKmh: 25, climbMh: 650, pausePct: 20, fatiguePct: 0, napMin: 30 });
    expect(plan.rideH).toBeCloseTo(12 + 10, 5); // 300/25 + 6500/650
    expect(plan.stopH).toBeCloseTo(4.4, 5);
    expect(plan.totalH).toBeCloseTo(26.9, 5);
    expect(plan.finish).toBe('2027-05-05T08:54');
    expect(good.totalH).toBeLessThan(plan.totalH);
    expect(hard.totalH).toBeGreaterThan(plan.totalH);
  });
  it('hours read as h and min', () => {
    expect(hm(26.9)).toEqual({ h: 26, m: 54 });
  });
});
