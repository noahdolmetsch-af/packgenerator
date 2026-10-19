// Paket U2 «Feines Höhenprofil» (Noah 19.10.2026 «detailierteres profil … zoombar … analog zu komoot»):
// the fine profile next to the coarse one (src/lib/map/fineprofile.js). Fictional tracks only.
import { describe, it, expect } from 'vitest';
import * as F from '../src/lib/map/fineprofile.js';
import { climb, routeStats } from '../src/lib/route.js';
import { joinSectors } from '../src/lib/race/files.js';
import { sampleRoute, withSampleFine, SAMPLE_KM } from '../src/lib/race/sample.js';

// a made-up track going east along 46.5° N: a point every ~10 m, heights from fn(km), a little noise
function track(km, fn, noise = 0, every = 0.01) {
  const pts = [];
  const degPerKm = 1 / (111.32 * Math.cos((46.5 * Math.PI) / 180));
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) * 2 - 1;
  for (let k = 0; k <= km + 1e-9; k += every) pts.push({ lat: 46.5, lon: 7 + k * degPerKm, ele: fn(k) + rnd() * noise });
  return pts;
}
const trueGain = (km, fn, step = 0.01) => {
  let g = 0;
  for (let k = step; k <= km + 1e-9; k += step) g += Math.max(0, fn(k) - fn(k - step));
  return g;
};

describe('step and size', () => {
  it('the step grows with the length, never more than FINE_MAX points', () => {
    expect(F.stepFor(50)).toBe(0.05);
    expect(F.stepFor(600)).toBe(0.05);
    expect(F.stepFor(1000)).toBe(0.1);
    expect(F.stepFor(2000)).toBe(0.2);
    expect(F.stepFor(2800)).toBe(0.25);
    for (const km of [10, 999, 1200, 4000]) expect(km / F.stepFor(km)).toBeLessThanOrEqual(F.FINE_MAX);
  });
  it('a 1000 km route stays under 80 KB as JSON (and the sample under 30 KB)', () => {
    const fn = (k) => 800 + 500 * Math.sin(k / 9) + 40 * Math.sin(k * 1.3);
    const f = F.buildFine(track(1000, fn, 2, 0.05));
    expect(f.step).toBe(0.1);
    expect(f.d.length).toBeGreaterThan(9900);
    expect(f.d.length).toBeLessThanOrEqual(10001);
    const kb = JSON.stringify(f).length / 1024;
    console.log(`fine profile 1000 km: ${kb.toFixed(1)} KB, sample: ${(JSON.stringify(sampleRoute().profileFine).length / 1024).toFixed(1)} KB`);
    expect(kb).toBeLessThan(80);
    expect(JSON.stringify(sampleRoute().profileFine).length / 1024).toBeLessThan(30);
  });
});

describe('build, encode, decode', () => {
  it('encode and decode round-trip whole metres', () => {
    const f = F.encode([500, 503, 501, 510], 0.1);
    expect(f).toEqual({ v: 1, step: 0.1, km: 0.3, d: [500, 3, -2, 9] });
    const d = F.decode(f);
    expect(Array.from(d.m)).toEqual([500, 503, 501, 510]);
    expect(d.km).toBeCloseTo(0.3);
    expect(F.decode(f)).toBe(d); // cached
    expect(F.toProfile(f)).toEqual([[0, 500], [0.1, 503], [0.2, 501], [0.3, 510]]);
    expect(F.isFine(f)).toBe(true);
    expect(F.isFine(null)).toBe(false);
    expect(F.decode({ step: 0.1, d: [1] })).toBeNull();
  });
  it('builds from the raw points: the length, the heights, null without heights', () => {
    const fn = (k) => 400 + k * 50; // 5 %
    const f = F.buildFine(track(10, fn));
    expect(f.step).toBe(0.05);
    expect(f.km).toBeCloseTo(10, 1);
    expect(F.heightAt(f, 5)).toBeCloseTo(650, -1);
    expect(F.gradeAt(f, 5)).toBeCloseTo(5, 0);
    expect(F.buildFine([{ lat: 1, lon: 1, ele: null }, { lat: 1, lon: 2, ele: null }])).toBeNull();
  });
  it('smoothing: GPS noise and a spike do not add climbing; real short ramps stay', () => {
    // rolling hills with short 10 % ramps, ±4 m noise on every point, and one 60 m spike (a DEM error)
    const fn = (k) => 600 + 120 * Math.sin(k / 3) + 25 * Math.max(0, Math.sin(k * 4));
    const pts = track(40, fn, 4);
    pts[1500].ele += 60;
    const real = trueGain(40, fn);
    const raw = climb(pts).gain;
    const f = F.buildFine(pts);
    const fine = F.climbOf(f).gain;
    expect(raw).toBeGreaterThan(real * 1.15); // the noise inflates the raw count
    expect(fine).toBeGreaterThan(real * 0.85);
    expect(fine).toBeLessThan(real * 1.12);
    // the spike is gone
    expect(F.heightAt(f, 15)).toBeLessThan(fn(15) + 15);
  });
  it('the route import keeps both profiles (route.js and the sectors of a race)', () => {
    const pts = track(5, (k) => 500 + 20 * Math.sin(k));
    const r = routeStats({ name: 'x', points: pts });
    expect(r.profile.length).toBeLessThanOrEqual(300);
    expect(F.isFine(r.profileFine)).toBe(true);
    const half = Math.floor(pts.length / 2);
    const { route } = joinSectors([{ name: 'A', points: pts.slice(0, half + 1) }, { name: 'B', points: pts.slice(half) }]);
    expect(route.profile.length).toBeLessThanOrEqual(800);
    expect(F.decode(route.profileFine).km).toBeCloseTo(route.km, 0);
  });
});

describe('reading', () => {
  const f = F.encode([100, 110, 120, 110, 100, 100, 130], 0.1); // 0.6 km
  it('heightAt and gradeAt', () => {
    expect(F.heightAt(f, 0.05)).toBe(105);
    expect(F.heightAt(f, 9)).toBe(130);
    expect(F.heightAt(f, -1)).toBe(100);
    expect(F.gradeAt(f, 0.1)).toBe(10);
    expect(F.gradeAt(f, 0.35)).toBe(-10);
    expect(F.heightAt(null, 1)).toBeNull();
  });
  it('slice keeps the ends exact and, when thinned, the peaks', () => {
    expect(F.slice(f, 0.05, 0.25).map((p) => [Math.round(p.km * 100) / 100, p.m])).toEqual([[0.05, 105], [0.1, 110], [0.2, 120], [0.25, 115]]);
    const big = F.encode(Array.from({ length: 2001 }, (_, i) => (i === 1234 ? 2000 : 500 + (i % 7))), 0.1);
    const s = F.slice(big, 0, 200, 100);
    expect(s.length).toBeLessThanOrEqual(100);
    expect(Math.max(...s.map((p) => p.m))).toBe(2000);
    expect(s[0].km).toBe(0);
    expect(s.at(-1).km).toBe(200);
  });
  it('range, up and down of a stretch', () => {
    expect(F.rangeOf(f, 0, 0.6)).toEqual({ lo: 100, loKm: 0, hi: 130, hiKm: 0.6 });
    expect(F.gainOf(f)).toEqual({ up: 50, down: 20 });
    expect(F.gainOf(f, 0, 0.2)).toEqual({ up: 20, down: 0 });
  });
  it('the next summit or valley ahead', () => {
    const p = F.encode([100, 130, 160, 140, 120, 125, 180], 0.1);
    expect(F.nextTurn(p, 0)).toMatchObject({ kind: 'summit', km: 0.2, m: 160 });
    expect(F.nextTurn(p, 0.25)).toMatchObject({ kind: 'valley', km: 0.4, m: 120 });
    expect(F.nextTurn(p, 0.45)).toBeNull();
  });
  it('the fallback: a coarse profile is resampled and marked coarse', () => {
    const c = F.fineOf(null, [[0, 100], [2, 200]]);
    expect(c.coarse).toBe(true);
    expect(F.heightAt(c, 1)).toBeCloseTo(150);
    expect(F.fineOf(null, [])).toBeNull();
    expect(F.fineOf(f, [[0, 1], [1, 2]]).coarse).toBe(false);
  });
});

describe('steepness like komoot', () => {
  it('classes up and down', () => {
    expect([-15, -8, -4, 0, 2.9, 4, 7, 10, 13, 20].map(F.steepKey)).toEqual(['d3', 'd2', 'd1', 'u0', 'u0', 'u1', 'u2', 'u3', 'u4', 'u5']);
    for (const c of F.STEEPNESS) expect(c.token).toMatch(/^--ps-/);
  });
  it('segments carry their gradient; zoomed out they are longer', () => {
    const f = F.encode([100, 110, 120, 110, 100, 100, 130], 0.1);
    const s = F.segments(f, 0, 0.6, 0.1);
    expect(s.map((x) => x.pct)).toEqual([10, 10, -10, -10, 0, 30]);
    expect(s.map((x) => x.key)).toEqual(['u3', 'u3', 'd2', 'd2', 'u0', 'u5']);
    const r = sampleRoute();
    expect(F.segKmFor(r.profileFine, 0, 1004)).toBeGreaterThan(F.segKmFor(r.profileFine, 600, 610));
    expect(F.segments(r.profileFine, 0, 1004).length).toBeLessThanOrEqual(220);
  });
});

describe('the view', () => {
  it('nice ticks', () => {
    expect(F.niceStep(3.2)).toBe(5);
    expect(F.niceStep(0.12)).toBe(0.2);
    expect(F.niceTicks(0, 1000, 4).ticks).toEqual([0, 250, 500, 750, 1000]);
    expect(F.niceTicks(12.3, 13.1, 4).ticks).toEqual([12.4, 12.6, 12.8, 13]);
  });
  it('zoom, pan and clamp', () => {
    expect(F.zoomView(null, 100, 0.5)).toEqual({ from: 25, to: 75 });
    expect(F.zoomView(null, 100, 0.5, 0)).toEqual({ from: 0, to: 50 });
    expect(F.zoomView({ from: 25, to: 75 }, 100, 4)).toBeNull(); // back to the whole route
    expect(F.panView({ from: 10, to: 20 }, 100, -30)).toEqual({ from: 0, to: 10 });
    expect(F.clampView({ from: 50, to: 50.01 }, 100, 0.3)).toEqual({ from: 50, to: 50.3 });
    expect(F.minSpan(F.encode([1, 2, 3], 0.1))).toBeCloseTo(0.6);
  });
  it('the km range the map shows', () => {
    const pts = [0, 1, 2, 3, 4].map((k) => ({ lat: 46, lon: 7 + k * 0.1, km: k * 10 }));
    expect(F.kmRangeIn(pts, { west: 7.05, east: 7.25, south: 45, north: 47 })).toEqual({ from: 5, to: 25 });
    expect(F.kmRangeIn(pts, { west: 9, east: 10, south: 45, north: 47 })).toBeNull();
  });
});

describe('the sample race', () => {
  it('has a fine profile every 100 m that agrees with the coarse one', () => {
    const r = sampleRoute();
    const f = F.decode(r.profileFine);
    expect(f.step).toBe(0.1);
    expect(f.km).toBe(SAMPLE_KM);
    for (const [km, m] of r.profile) expect(F.heightAt(f, km)).toBeCloseTo(m, 0);
    expect(F.rangeOf(f, 660, 680).hi).toBe(2060);
    expect(F.climbOf(f).gain).toBe(r.gainM);
    // short ramps over 10 % that the 2 km profile cannot show
    const steep = F.segments(f, 0, SAMPLE_KM, 0.1).filter((s) => s.pct > 10).length;
    expect(steep).toBeGreaterThan(30);
  });
  it('an old stored sample gets the fine profile; other races stay as they are', () => {
    const r = sampleRoute();
    const old = { sample: true, route: { ...r, profileFine: undefined } };
    expect(F.isFine(withSampleFine(old).route.profileFine)).toBe(true);
    expect(withSampleFine(old).route).toBe(withSampleFine(old).route);
    const other = { route: { ...r, profileFine: undefined } };
    expect(withSampleFine(other)).toBe(other);
    expect(withSampleFine(null)).toBeNull();
  });
});
