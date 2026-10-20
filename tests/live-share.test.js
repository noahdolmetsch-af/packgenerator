// «Bild zum Teilen» after the ride (Noah 20.10.2026 «b»): src/lib/live/shareimage.js linePath.
import { describe, it, expect } from 'vitest';
import { linePath } from '../src/lib/live/shareimage.js';

describe('the shape of the ride in the picture', () => {
  const box = { x: 100, y: 200, w: 800, h: 400 };
  it('fits the line into the box, north up, centred, same scale both ways', () => {
    // a made-up ride: 0.02° east, then 0.01° north
    const pts = [[46.9, 7.4, 0], [46.9, 7.42, 60], [46.91, 7.42, 120]];
    const l = linePath(pts, box);
    expect(l).toHaveLength(3);
    for (const [x, y] of l) {
      expect(x).toBeGreaterThanOrEqual(100 - 0.1);
      expect(x).toBeLessThanOrEqual(900 + 0.1);
      expect(y).toBeGreaterThanOrEqual(200 - 0.1);
      expect(y).toBeLessThanOrEqual(600 + 0.1);
    }
    // east is right, north is up
    expect(l[1][0]).toBeGreaterThan(l[0][0]);
    expect(l[2][1]).toBeLessThan(l[1][1]);
    // same scale: 0.02° east × cos(46.9°) against 0.01° north
    const dx = l[1][0] - l[0][0];
    const dy = l[1][1] - l[2][1];
    expect(dx / dy).toBeCloseTo((0.02 * Math.cos((46.903 * Math.PI) / 180)) / 0.01, 1);
    // the tall side fills the box (here the height)
    expect(Math.round(dy)).toBe(400);
  });
  it('too few points or bad ones → no line; many points are thinned', () => {
    expect(linePath([], box)).toEqual([]);
    expect(linePath([[46.9, 7.4, 0], [null, 7.4, 1]], box)).toEqual([]);
    const many = Array.from({ length: 10_000 }, (_, i) => [46.9 + i * 1e-5, 7.4, i]);
    const l = linePath(many, box, 500);
    expect(l.length).toBeLessThanOrEqual(501);
    expect(l.at(-1)[1]).toBeCloseTo(200, 0);
  });
});
