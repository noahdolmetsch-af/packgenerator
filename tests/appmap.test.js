import { describe, it, expect } from 'vitest';
import { buildMap, filterMap, pathText, mapSize, filterPoints, markOf, freshIds, MAP_PLACES } from '../src/lib/appmap.js';
import { PLACES } from '../src/lib/nav.js';
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
    const hit = filterMap(map, 'privacy terms');
    expect(mapSize(hit)).toBeGreaterThan(0);
    expect(mapSize(hit)).toBeLessThan(mapSize(map));
    expect(filterMap(map, '')).toBe(map);
    expect(filterMap(map, 'zzzzqqq')).toEqual([]);
  });

  it('follows the places of the bar (read from nav.js) and ends with «Ich»', () => {
    expect(MAP_PLACES.map((p) => p.key)).toEqual([...PLACES.filter((p) => p.key !== 'quick').map((p) => p.key), 'me']);
    const keys = map.map((g) => g.key);
    for (const k of keys) expect(MAP_PLACES.some((p) => p.key === k)).toBe(true);
    // no place holds nearly half of everything any more (before: «Ich» 257 of 503)
    for (const g of map) expect(g.items.length).toBeLessThan(FEATURES.length * 0.45);
  });
  it('gives every place its pages as points, each function on exactly one point', () => {
    for (const g of map) {
      const ids = g.points.flatMap((p) => p.ids);
      expect(ids.toSorted()).toEqual(g.items.map((i) => i.id).toSorted());
      for (const p of g.points) expect(p.title).toBeTruthy();
    }
  });
  it('marks a point opened, new or never opened, and filters by it', () => {
    const p = { path: '#/x', href: '#/x', title: 'X', ids: ['a', 'b'] };
    expect(markOf(p, {})).toBe('never');
    expect(markOf(p, { opened: { '#/x': '2026-11-23' } })).toBe('open');
    expect(markOf(p, { used: new Set(['b']) })).toBe('open');
    expect(markOf(p, { fresh: new Set(['a']) })).toBe('new');
    expect(markOf(p, { fresh: new Set(['a']), used: new Set(['a']) })).toBe('open');
    const m = [{ key: 'k', label: 'K', items: [], points: [p, { path: '#/y', href: '#/y', title: 'Y', ids: ['c'] }] }];
    expect(filterPoints(m, 'all', {})).toBe(m);
    expect(filterPoints(m, 'never', { opened: { '#/x': 'd' } })[0].points.map((q) => q.path)).toEqual(['#/y']);
    expect(filterPoints(m, 'new', { fresh: new Set(['c']) })[0].points.map((q) => q.path)).toEqual(['#/y']);
    expect(filterPoints(m, 'new', {})).toEqual([]);
  });
  it('knows the functions the versions of the last two weeks brought', () => {
    const list = [{ version: '2', date: '2026-11-22', since: ['f.a'] }, { version: '1', date: '2026-10-01', since: ['f.b'] }, { version: '0', date: '2026-11-20' }];
    expect([...freshIds('2026-11-23', 14, list)]).toEqual(['f.a']);
  });
});
