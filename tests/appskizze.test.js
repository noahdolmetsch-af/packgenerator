import { describe, it, expect } from 'vitest';
import { buildMap } from '../src/lib/appmap.js';
import { buildMind } from '../src/lib/appskizze.js';

const map = buildMap();

describe('Karte der App as a mind map', () => {
  it('shows every place of the map as a branch, none twice, in the order of the map', () => {
    const mind = buildMind(map);
    expect(mind.map((b) => b.key)).toEqual(map.map((g) => g.key));
    expect(new Set(mind.map((b) => b.key)).size).toBe(mind.length);
  });
  it('gives every branch its tabs and every tab its pages, each a page of the map', () => {
    const known = new Set(map.flatMap((g) => g.points.map((p) => p.path)));
    for (const b of buildMind(map)) {
      expect(b.tabs.length, b.key).toBeGreaterThan(0);
      for (const tab of b.tabs) {
        expect(tab.pages.length, `${b.key}/${tab.key}`).toBeGreaterThan(0);
        for (const r of tab.pages) expect(known.has(r.path) || tab.pages.some((x) => x.alsoPaths?.includes(r.path)), `${b.key}: ${r.path}`).toBe(true);
      }
    }
  });
  it('counts the same points as the map (a point is in exactly one twig of its place)', () => {
    for (const b of buildMind(map)) {
      const rows = b.tabs.flatMap((tab) => tab.pages);
      const paths = new Set(rows.flatMap((r) => [r.path, ...(r.alsoPaths ?? [])]));
      for (const p of b.points) expect(paths.has(p.path), `${b.key}: ${p.path}`).toBe(true);
    }
  });
});
