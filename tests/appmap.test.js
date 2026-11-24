import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildMap, buildTree, ICH_GROUPS, filterMap, pathText, mapSize, filterPoints, markOf, freshIds, MAP_PLACES } from '../src/lib/appmap.js';
import { PLACE_TABS } from '../src/lib/nav.js';
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

  it('shows a tree: every point of a place stands in exactly one page row under a tab', () => {
    for (const g of map) {
      const tree = buildTree(g);
      const rows = tree.flatMap((t) => t.pages);
      const ids = rows.flatMap((r) => r.ids);
      expect(ids.toSorted()).toEqual(g.items.map((i) => i.id).toSorted());
      // the tabs are the tabs of the place, in the order of the bar
      const keys = (PLACE_TABS[g.key] ?? []).map((t) => t.key);
      expect(tree.filter((t) => keys.includes(t.key)).map((t) => t.key)).toEqual(keys.filter((k) => tree.some((t) => t.key === k)));
    }
  });
  it('keeps «Further pages» small, so the tree says where a page lives', () => {
    for (const g of map) {
      const rest = buildTree(g).find((t) => t.key === 'rest');
      if (g.key === 'me' || g.key === 'today' || g.key === 'weather') continue;
      expect(rest?.pages.length ?? 0, g.key).toBeLessThanOrEqual(12);
    }
  });
  it('counts a page as opened when any address that leads to it was opened', () => {
    const row = { path: '#/a', alsoPaths: ['#/a/b'], ids: ['x'] };
    expect(markOf(row, { opened: { '#/a/b': 'd' } })).toBe('open');
  });
  it('groups «Ich» like the page «Ich»: every row of Me.svelte lands in one of its groups', () => {
    const me = readFileSync(new URL('../src/pages/Me.svelte', import.meta.url), 'utf8');
    const hrefs = [...me.matchAll(/class="ich-row" href="(#\/[^"]+)"/g)].map((m) => m[1].split('?')[0]);
    expect(hrefs.length).toBeGreaterThan(10);
    for (const h of hrefs) expect(ICH_GROUPS.some((x) => x.re.test(h)), h).toBe(true);
  });
});
