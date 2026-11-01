import { describe, it, expect } from 'vitest';
import { buildMap, filterMap, pathText, mapSize } from '../src/lib/appmap.js';
import { FEATURES } from '../src/lib/features.js';

describe('Map of the app', () => {
  const map = buildMap();
  it('holds every function of the catalogue exactly once', () => {
    expect(mapSize(map)).toBe(FEATURES.length);
    const ids = map.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('gives every function a path of place and title', () => {
    for (const g of map) for (const i of g.items) expect(i.path).toEqual([g.label, i.title]);
    expect(pathText(map[0].items[0])).toContain(' › ');
  });
  it('finds the functions of a word and leaves the rest out', () => {
    const hit = filterMap(map, 'understand app');
    expect(mapSize(hit)).toBeGreaterThan(0);
    expect(mapSize(hit)).toBeLessThan(mapSize(map));
    expect(filterMap(map, '')).toBe(map);
    expect(filterMap(map, 'zzzzqqq')).toEqual([]);
  });
});
