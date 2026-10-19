// Paket U2 «Anstiege»: every climb on its own (src/lib/race/climbs-lib.js). Fictional sample race only.
import { describe, it, expect } from 'vitest';
import * as C from '../src/lib/race/climbs-lib.js';
import { climbsOf } from '../src/lib/race/race.js';
import { sampleRoute, samplePois } from '../src/lib/race/sample.js';

const route = sampleRoute();

describe('finding the climbs', () => {
  it('follows the rule of climbsOf (same climbs, exact km)', () => {
    for (const g of [100, 150, 300]) {
      const a = C.climbStretches(route.profile, g).map((s) => [Math.round(s.fromKm), Math.round(s.toKm), Math.round(s.top - s.low)]);
      const b = climbsOf(route.profile, g).map((c) => [c.fromKm, c.toKm, c.gain]);
      expect(a).toEqual(b);
    }
  });
  it('the sample race has about 30 climbs and the pass above 2000 m near km 670', () => {
    const list = C.climbsDetail({ route });
    expect(list.length).toBeGreaterThan(20);
    expect(list.length).toBeLessThan(45);
    const pass = list.find((c) => c.top > 2000);
    expect(pass).toBeTruthy();
    expect(pass.toKm).toBeGreaterThan(660);
    expect(pass.toKm).toBeLessThan(680);
    // the fine profile (100 m steps): 6 % on the way up, the steeper ramp of 9 % below the top
    expect(pass.max).toBeCloseTo(9, 0);
    expect(pass.estimated).toBe(false);
    expect(pass.avg).toBeGreaterThan(4);
  });
  it('the fine profile gives more detail than the coarse one: real short ramps', () => {
    const fine = C.climbsDetail({ route });
    const coarse = C.climbsDetail({ route: { ...route, profileFine: null } });
    expect(coarse[0].estimated).toBe(true);
    expect(Math.max(...fine.map((c) => c.max))).toBeGreaterThan(Math.max(...coarse.map((c) => c.max)));
    expect(C.climbProfile(route).length).toBe(route.profileFine.d.length);
    expect(C.climbProfile({ profile: [[0, 1], [1, 2]] })).toEqual([[0, 1], [1, 2]]);
    expect(C.climbProfile(null)).toEqual([]);
  });
  it('a higher minimum gives fewer climbs', () => {
    expect(C.climbsDetail({ route, minGain: 1000 }).length).toBeLessThan(C.climbsDetail({ route, minGain: 100 }).length);
    expect(C.climbsDetail({ route: { profile: [] } })).toEqual([]);
    expect(C.climbsDetail({ route: null })).toEqual([]);
  });
});

describe('the numbers of one climb', () => {
  // 0–1 km at 5 %, 1–1.5 km at 10 %: 100 m up over 1.5 km, top 1100 m, a fine profile (100 m step)
  const profile = [];
  for (let k = 0; k <= 15; k++) profile.push([k / 10, 1000 + (k <= 10 ? k * 5 : 50 + (k - 10) * 10)]);
  profile.push([1.6, 1090], [1.7, 1050]);
  const fine = { profile, sectors: [{ name: 'Sektor 01', fromKm: 0, toKm: 2 }] };
  const [c] = C.climbsDetail({ route: fine, minGain: 50 });
  it('length, gain, top, average and max', () => {
    expect(c.fromKm).toBe(0);
    expect(c.toKm).toBe(1.5);
    expect(c.lengthKm).toBe(1.5);
    expect(c.gain).toBe(100);
    expect(c.top).toBe(1100);
    expect(c.avg).toBeCloseTo(6.7, 1);
    expect(c.max).toBe(10);
    expect(c.maxAt).toBe(1);
    expect(c.estimated).toBe(false);
    expect(c.sector).toBe('Sektor 01');
  });
  it('the gradient per 100 m: 15 bars, 5 % then 10 %', () => {
    expect(c.bars).toHaveLength(15);
    expect(c.bars[0]).toEqual({ fromKm: 0, toKm: 0.1, pct: 5 });
    expect(c.bars[14].pct).toBe(10);
  });
  it('a coarse profile (2 km) is interpolated and marked estimated', () => {
    const list = C.climbsDetail({ route: { ...route, profileFine: null } });
    expect(list[0].estimated).toBe(true);
    expect(list[0].bars.length).toBe(Math.ceil(list[0].lengthKm * 10 - 1e-9));
  });
  it('heightAt interpolates linearly', () => {
    expect(C.heightAt([[0, 100], [2, 200]], 1)).toBe(150);
    expect(C.heightAt([[0, 100], [2, 200]], 5)).toBe(200);
    expect(C.heightAt([], 1)).toBe(null);
    expect(C.stepOf(route.profile)).toBe(2);
  });
});

describe('difficulty', () => {
  it('a FIETS-like score: gain² / (length × 10) + top bonus', () => {
    expect(C.climbScore(1000, 10, 900)).toBe(10);
    expect(C.climbScore(100, 1, 1500)).toBe(1.5);
    expect(C.climbScore(0, 1, 500)).toBe(0);
  });
  it('the category in words', () => {
    expect(C.levelOf(0.4).name).toBe('Easy');
    expect(C.levelOf(5).name).toBe('Hard');
    expect(C.levelOf(12).name).toBe('Extreme');
  });
  it('steepness classes 0–3 / 3–6 / 6–9 / 9–12 / over 12', () => {
    expect([0, 2.9, 3, 6.5, 9, 12, 20].map(C.steepClass)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  });
});

describe('time, light, supplies, sorting and totals', () => {
  const plan = { etaOf: (km) => Date.parse('2027-06-19T08:00:00') + km * 36e5 / 20, blocks: [] };
  const list = C.climbsDetail({ route, plan, as: { climbMh: { value: 600 } }, pois: samplePois(route), isDark: (km, ms) => new Date(ms).getHours() >= 22 || new Date(ms).getHours() < 5 });
  it('arrival, time on the climb from the climbing rate and the plan', () => {
    const c = list[0];
    expect(c.eta).toBe(plan.etaOf(c.fromKm));
    expect(c.climbH).toBeCloseTo(c.gain / 600, 2);
    expect(c.planH).toBeCloseTo(c.lengthKm / 20, 1);
    expect(['ok', 'midday', 'dark', 'hot']).toContain(c.when);
    expect(list.some((x) => x.dark?.foot || x.dark?.top)).toBe(true);
  });
  it('the climbing rate takes the luggage share', () => {
    expect(C.climbRateOf({ climbMh: 650, loadClimbPct: 90 })).toBe(585);
    expect(C.climbRateOf({})).toBe(650);
  });
  it('water and shops within 3 km of the foot and the top', () => {
    const near = C.suppliesNear([{ kind: 'water', km: 10 }, { kind: 'shop', km: 12.5 }, { kind: 'food', km: 14 }, { kind: 'sleep', km: 10 }], 11);
    expect(near.water).toHaveLength(1);
    expect(near.shop.map((p) => p.km)).toEqual([12.5, 14]);
    expect(list.some((c) => c.foot.water.length || c.summit.shop.length)).toBe(true);
  });
  it('sorts by gain, steepness and difficulty', () => {
    const g = C.sortClimbs(list, 'gain');
    expect(g[0].gain).toBe(Math.max(...list.map((c) => c.gain)));
    expect(C.sortClimbs(list, 'steep')[0].max).toBe(Math.max(...list.map((c) => c.max)));
    expect(C.sortClimbs(list, 'score')[0].score).toBe(Math.max(...list.map((c) => c.score)));
    expect(C.sortClimbs(g, 'order').map((c) => c.n)).toEqual(list.map((c) => c.n));
  });
  it('totals: count, metres up, the steepest, the longest and the hardest', () => {
    const s = C.climbTotals(list, route.gainM);
    expect(s.n).toBe(list.length);
    expect(s.gain).toBe(list.reduce((a, c) => a + c.gain, 0));
    expect(s.share).toBeGreaterThan(50);
    expect(s.hardest.score).toBe(Math.max(...list.map((c) => c.score)));
    expect(s.longest.lengthKm).toBe(Math.max(...list.map((c) => c.lengthKm)));
    expect(C.climbTotals([], 0).n).toBe(0);
  });
  it('the mini profile and the ?climb= parameter', () => {
    const p = C.miniPath(route.profile, list[0].fromKm, list[0].toKm);
    expect(p.line.startsWith('M')).toBe(true);
    expect(p.hi).toBeGreaterThan(p.lo);
    expect(C.climbParam('#/race/x/climbs?climb=4')).toBe('4');
    expect(C.climbParam('#/race/x/climbs')).toBe(null);
  });
});
