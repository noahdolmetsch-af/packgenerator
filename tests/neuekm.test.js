// «Neue Kilometer» (Träume und Neuland N4, Noah 27.10.2026 «1-5 a»): km on roads ridden for the first time.
import { describe, it, expect } from 'vitest';
import { steps, newKmOf, newKmSummary, newSegments, NEAR_M } from '../src/lib/neuland/neuekm.js';

// fictional straight roads: 0.01° latitude ≈ 1.11 km
const north = (lat0, lat1, lon = 8.3) => [[lat0, lon], [lat1, lon]];
const line = (id, day, pts, kind = 'bike') => ({ id, day, year: day.slice(0, 4), kind, name: `test_data_gtp_${id}`, pts });

describe('steps along a line', () => {
  it('cuts a line into steps of about 100 m that add up to its length', () => {
    const s = steps(north(47.0, 47.01));
    expect(s.length).toBeGreaterThanOrEqual(11);
    const m = s.reduce((a, p) => a + p[2], 0);
    expect(m).toBeGreaterThan(1100);
    expect(m).toBeLessThan(1125);
  });
});

describe('new km per ride', () => {
  it('counts the first ride as all new and the same road again as known', () => {
    const r = newKmOf([line('b', '2026-05-02', north(47.0, 47.02)), line('a', '2026-05-01', north(47.0, 47.02))]);
    expect(r.get('a').newKm).toBeCloseTo(2.2, 0);
    expect(r.get('b').newKm).toBe(0);
    expect(r.get('b').km).toBeCloseTo(2.2, 0);
  });

  it('keeps a road known under GPS jitter, and a parallel road further away is new', () => {
    const jitter = 30 / (111320 * Math.cos((47 * Math.PI) / 180)); // 30 m east
    const far = 300 / (111320 * Math.cos((47 * Math.PI) / 180)); // 300 m east
    const r = newKmOf([line('a', '2026-05-01', north(47.0, 47.02)), line('b', '2026-05-02', north(47.0, 47.02, 8.3 + jitter)), line('c', '2026-05-03', north(47.0, 47.02, 8.3 + far))]);
    expect(r.get('b').newKm).toBe(0);
    expect(r.get('c').newKm).toBeCloseTo(2.2, 0);
    expect(NEAR_M).toBeLessThan(300);
  });

  it('counts only the new part of a longer ride', () => {
    const r = newKmOf([line('a', '2026-05-01', north(47.0, 47.02)), line('b', '2026-06-01', north(47.0, 47.04))]);
    expect(r.get('b').newKm).toBeGreaterThan(2.0);
    expect(r.get('b').newKm).toBeLessThan(2.4);
  });

  it('does not count the way back of an out-and-back ride as new', () => {
    const r = newKmOf([line('a', '2026-05-01', [[47.0, 8.3], [47.02, 8.3], [47.0, 8.3]])]);
    expect(r.get('a').km).toBeCloseTo(4.4, 0);
    expect(r.get('a').newKm).toBeCloseTo(2.2, 0);
  });

  it('leaves out runs and hikes, and the order given does not matter', () => {
    const lines = [line('run', '2026-04-01', north(47.0, 47.02), 'run'), line('a', '2026-05-01', north(47.0, 47.02)), line('b', '2026-05-01', north(47.0, 47.02))];
    const r1 = newKmOf(lines);
    const r2 = newKmOf([...lines].reverse());
    expect(r1.has('run')).toBe(false);
    expect(r1.get('a').newKm).toBeCloseTo(2.2, 0); // the run does not make the road known
    expect(r1.get('b').newKm).toBe(0);
    expect([...r2.entries()]).toEqual([...r1.entries()]);
  });
});

describe('the summary per year', () => {
  it('sums the years newest first and lists the last rides with new km', () => {
    const lines = [line('a', '2025-05-01', north(47.0, 47.02)), line('b', '2026-05-01', north(47.0, 47.04)), line('c', '2026-06-01', north(47.0, 47.04))];
    const s = newKmSummary(lines);
    expect(s.years.map((y) => y.year)).toEqual(['2026', '2025']);
    expect(s.years[1].share).toBeCloseTo(1, 1);
    expect(s.years[0].newKm).toBe(2);
    expect(s.years[0].km).toBe(9);
    expect(s.rides.map((r) => r.id)).toEqual(['b', 'a']); // c brought nothing new
  });
});

describe('the new stretches for the map', () => {
  it('gives only the new part of a longer ride as a line, and nothing for a known road', () => {
    const lines = [line('a', '2025-05-01', north(47.0, 47.02)), line('b', '2026-06-01', north(47.0, 47.04)), line('c', '2026-06-02', north(47.0, 47.02))];
    const byId = newKmOf(lines, { segments: true });
    expect(byId.get('a').segs.length).toBe(1);
    expect(byId.get('b').segs.length).toBe(1);
    const b = byId.get('b').segs[0];
    expect(b[0][0]).toBeGreaterThan(47.019); // starts where the road was known
    expect(b[b.length - 1][0]).toBeGreaterThan(47.035);
    expect(byId.get('c').segs).toEqual([]);
    expect(newSegments(lines, byId, '2026').length).toBe(1);
    expect(newSegments(lines, byId, '2025').length).toBe(1);
    expect(newSegments(lines, byId, 'all').length).toBe(2);
  });

  it('keeps the same numbers with or without the lines', () => {
    const lines = [line('a', '2026-05-01', north(47.0, 47.02)), line('b', '2026-06-01', north(47.0, 47.04))];
    const w = newKmOf(lines, { segments: true });
    const o = newKmOf(lines);
    expect(w.get('b').newKm).toBe(o.get('b').newKm);
    expect(o.get('b').segs).toBeUndefined();
  });
});
