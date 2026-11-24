// «Rennatlas» map: the geometry of the three zoom levels, the dashed frame and the scale bar (pure, no page).
import { describe, it, expect } from 'vitest';
import { SHAPES, europeOf, fitBox, viewOf, levelsOf, clusterOf, inEurope, px, py, inView, frameOf, scaleOf, inAlps } from '../src/lib/race/atlas-geo.js';

const P = (lat, lon) => ({ lat, lon });
const EUROPE = europeOf();
const { W, H } = SHAPES.wide;
const ALPS = [P(47.05, 8.3), P(47.4, 8.5), P(46.9, 7.4), P(47.5, 9.4), P(45.9, 10.1)];

describe('map views', () => {
  it('a view keeps the shape of the picture and holds its points', () => {
    const v = viewOf(ALPS, 0.9, 3);
    expect(v.w / v.h).toBeCloseTo(W / H, 5);
    for (const p of ALPS) expect(inView(v, p.lat, p.lon)).toBe(true);
  });
  it('a phone gets a nearly square picture', () => {
    const v = viewOf(ALPS, 0.9, 3, SHAPES.narrow);
    expect(v.w / v.h).toBeCloseTo(SHAPES.narrow.W / SHAPES.narrow.H, 5);
    expect(py(v, v.la0)).toBeCloseTo(SHAPES.narrow.H, 5);
  });
  it('a view of one point is at least minSpan degrees high', () => {
    const v = viewOf([P(47, 8)], 0.9, 3);
    expect(v.la1 - v.la0).toBeGreaterThanOrEqual(3 - 1e-9);
  });
  it('Europe holds Britain, Greece and the Alps', () => {
    for (const [la, lo] of [[51.5, -0.1], [37.98, 23.7], [47, 8], [41.9, 12.5]]) expect(inView(EUROPE, la, lo)).toBe(true);
    expect(inView(EUROPE, 64.1, -21.9)).toBe(false);
  });
  it('the three levels each hold the next one', () => {
    const lv = levelsOf(ALPS);
    for (const [a, b] of [[1, 2], [2, 3]]) {
      const [big, small] = [lv[a], lv[b]];
      expect(small.la0).toBeGreaterThanOrEqual(big.la0 - 1e-9);
      expect(small.la1).toBeLessThanOrEqual(big.la1 + 1e-9);
      expect(small.lo0).toBeGreaterThanOrEqual(big.lo0 - 1e-9);
      expect(small.lo1).toBeLessThanOrEqual(big.lo1 + 1e-9);
    }
    expect(levelsOf([])).toBe(null);
  });
  it('the heart of the points is the densest group', () => {
    const far = [...ALPS, P(37.98, 23.7)];
    expect(clusterOf(far)).toHaveLength(ALPS.length);
  });
  it('knows what Europe holds and what the Alps are', () => {
    expect(inEurope(P(47, 8))).toBe(true);
    expect(inEurope(P(-33.9, 151.2))).toBe(false);
    expect(inAlps(viewOf(ALPS, 0.9, 3))).toBe(true);
    expect(inAlps(viewOf([P(40.4, -3.7)], 0.9, 3))).toBe(false);
  });
});

describe('map drawing', () => {
  it('puts the west edge left, the north edge up', () => {
    const v = fitBox(45, 48, 6, 10);
    expect(px(v, v.lo0)).toBeCloseTo(0, 5);
    expect(py(v, v.la1)).toBeCloseTo(0, 5);
    expect(py(v, v.la0)).toBeCloseTo(H, 5);
    expect(px(v, v.lo1)).toBeCloseTo(W, 5);
  });
  it('the frame of the next zoom lies inside the map', () => {
    const lv = levelsOf(ALPS);
    const f = frameOf(lv[2], lv[3]);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.y).toBeGreaterThanOrEqual(0);
    expect(f.x + f.w).toBeLessThanOrEqual(W + 1e-6);
    expect(f.y + f.h).toBeLessThanOrEqual(H + 1e-6);
    expect(f.w / f.h).toBeCloseTo(W / H, 3);
  });
  it('the scale bar is a round number of kilometres and not too long', () => {
    for (const v of [EUROPE, viewOf(ALPS, 4.2, 9), viewOf(ALPS, 0.9, 3)]) {
      const s = scaleOf(v);
      expect([1, 2, 5].includes(Number(String(s.km)[0]))).toBe(true);
      expect(s.units).toBeLessThanOrEqual(170 + 1e-9);
      expect(s.units).toBeGreaterThan(30);
    }
  });
});
