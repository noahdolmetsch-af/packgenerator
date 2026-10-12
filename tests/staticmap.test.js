// v0.102.0 Design-Refresh P4 «Touren» (T3 «Strecke»): the still map without a library, fictional points.
import { describe, it, expect } from 'vitest';
import { project, mapView, linePath, TILE } from '../src/lib/staticmap.js';

describe('staticmap', () => {
  it('projects with Web Mercator', () => {
    expect(project({ lat: 0, lon: 0 }, 0)).toEqual({ x: TILE / 2, y: TILE / 2 });
    expect(project({ lat: 0, lon: 180 }, 1).x).toBe(TILE * 2);
  });

  it('fits the points into the box with a margin and covers it with tiles', () => {
    const pts = [{ lat: 47.0, lon: 7.0 }, { lat: 47.3, lon: 7.4 }];
    const v = mapView(pts, 600, 280);
    expect(v.z).toBeGreaterThanOrEqual(3);
    for (const p of pts.map(v.px)) {
      expect(p.x).toBeGreaterThanOrEqual(28 - 0.1);
      expect(p.x).toBeLessThanOrEqual(600 - 28 + 0.1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(280);
    }
    const left = Math.min(...v.tiles.map((t) => t.left));
    const top = Math.min(...v.tiles.map((t) => t.top));
    expect(left).toBeLessThanOrEqual(0);
    expect(top).toBeLessThanOrEqual(0);
    expect(Math.max(...v.tiles.map((t) => t.left)) + TILE).toBeGreaterThanOrEqual(600);
    expect(v.tiles[0].url).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/);
  });

  it('gives no map without points and a path for a line', () => {
    expect(mapView([], 600, 280)).toBeNull();
    const v = mapView([{ lat: 47, lon: 7 }, { lat: 47.1, lon: 7.1 }], 600, 280);
    expect(linePath([[47, 7], [47.1, 7.1]], v.px)).toMatch(/^M[\d.]+,[\d.]+ L[\d.]+,[\d.]+$/);
  });
});
