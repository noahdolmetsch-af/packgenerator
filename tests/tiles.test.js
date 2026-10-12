// v0.94.0 «Kachel-Wand» (Noah 11.10.2026, Trello nLi5yNmS «1-5 a»): the wall of tiles (tiles.js).
import { describe, it, expect } from 'vitest';
import { TILES, TILE, READY, SIZES, AREAS, wallOf, wallRecord, ADDED_0101, moveTile, stepTile, nextSize, resizeTile, removeTile, addTile, catalog, isNew, sizeFor } from '../src/lib/home/tiles.js';
import { FUNCTIONS } from '../src/lib/home/fnlist.js';

describe('the tiles', () => {
  it('every tile has a known area, its sizes and a start size among them', () => {
    const areas = new Set(AREAS.map((a) => a.key));
    for (const x of TILES) {
      expect(areas.has(x.area), x.id).toBe(true);
      expect(x.sizes.every((s) => SIZES.includes(s)), x.id).toBe(true);
      expect(x.sizes, x.id).toContain(x.size);
    }
    expect(new Set(TILES.map((x) => x.id)).size).toBe(TILES.length);
  });
  it('all 16 functions are tiles, and on the ready wall', () => {
    for (const f of FUNCTIONS) {
      expect(TILE[`fn:${f.id}`]?.fn).toBe(f.id);
      expect(READY.some((x) => x.id === `fn:${f.id}`)).toBe(true);
    }
  });
  it('the ready wall uses sizes its tiles can take', () => {
    for (const x of READY) expect(TILE[x.id].sizes, x.id).toContain(x.size);
  });
});

describe('the stored wall', () => {
  it('without a record: the ready wall, minus the sections switched off in the old layout', () => {
    expect(wallOf(null)).toEqual(READY);
    const w = wallOf(undefined, { off: ['year', 'actions'] });
    expect(w.some((x) => x.id === 'year' || x.id.startsWith('fn:'))).toBe(false);
    expect(w.some((x) => x.id === 'bikes')).toBe(true);
  });
  it('drops unknown tiles and doubles, fixes sizes', () => {
    const w = wallOf({ v: 3, tiles: [{ id: 'news', size: 'long' }, { id: 'nope', size: 's' }, { id: 'news', size: 's' }, null, { id: 'year', size: 'long' }] });
    expect(w).toEqual([{ id: 'news', size: 'w' }, { id: 'year', size: 'long' }]);
    expect(wallRecord(w)).toEqual({ v: 3, tiles: w });
    expect(wallOf({ v: 3, tiles: [] })).toEqual([]);
  });
  it('v0.101.0: the new tiles are marked «neu» for two weeks from the release', () => {
    for (const id of ADDED_0101) {
      expect(isNew(TILE[id], '2026-10-12')).toBe(true);
      expect(isNew(TILE[id], '2026-10-30')).toBe(false);
    }
  });
  it('v0.101.0: a wall stored before gets the new tiles once, after Im Flow', () => {
    const old = wallOf({ v: 1, tiles: [{ id: 'trip', size: 'long' }, { id: 'flow', size: 'l' }, { id: 'month', size: 'l' }, { id: 'year', size: 'long' }] });
    // v0.102.0: and the suggestion tile right after Im Flow (at the end without it)
    expect(old.map((x) => x.id)).toEqual(['trip', 'flow', 'suggest', 'week', 'nextms', 'yearago', 'month', 'year']);
    expect(wallOf({ tiles: [{ id: 'year', size: 'long' }] }).map((x) => x.id)).toEqual(['year', ...ADDED_0101, 'suggest']);
    // a wall of 0.101 (v 2) gets only the suggestion
    expect(wallOf({ v: 2, tiles: [{ id: 'trip', size: 'long' }, { id: 'flow', size: 'l' }] }).map((x) => x.id)).toEqual(['trip', 'flow', 'suggest']);
    // taken away after that, they stay away
    expect(wallOf(wallRecord(old.filter((x) => x.id !== 'week'))).map((x) => x.id)).not.toContain('week');
  });
  it('moves, steps, resizes, removes and adds', () => {
    const w = [{ id: 'trip', size: 'long' }, { id: 'news', size: 'w' }, { id: 'play', size: 's' }];
    expect(moveTile(w, 'play', 0).map((x) => x.id)).toEqual(['play', 'trip', 'news']);
    expect(moveTile(w, 'trip', 99).map((x) => x.id)).toEqual(['news', 'play', 'trip']);
    expect(moveTile(w, 'nope', 0)).toBe(w);
    expect(stepTile(w, 'news', -1).map((x) => x.id)).toEqual(['news', 'trip', 'play']);
    expect(stepTile(w, 'trip', -1).map((x) => x.id)).toEqual(['trip', 'news', 'play']);
    expect(resizeTile(w, 'news', 's')[1].size).toBe('s');
    expect(resizeTile(w, 'news', 'long')[1].size).toBe('w');
    expect(removeTile(w, 'news').map((x) => x.id)).toEqual(['trip', 'play']);
    expect(addTile(w, 'milestones').at(-1)).toEqual({ id: 'milestones', size: 's' });
    expect(addTile(w, 'news')).toBe(w);
    expect(addTile(w, 'nope')).toBe(w);
    expect(nextSize('news', 'w')).toBe('s');
    expect(nextSize('series', 'w')).toBe('l');
    expect(sizeFor('nope', 'l')).toBe('s');
  });
});

describe('the catalog and the «New» dot', () => {
  it('groups every tile by area and finds by the translated words', () => {
    expect(catalog().flatMap((a) => a.tiles).length).toBe(TILES.length);
    const hit = catalog('meilen', (s) => (s === 'Milestones' ? 'Meilensteine' : s)).flatMap((a) => a.tiles.map((x) => x.id));
    expect(hit).toEqual(['milestones']);
    expect(catalog('zzzz')).toEqual([]);
  });
  it('a tile is new for two weeks after its version', () => {
    const news = [{ version: '0.94.0', date: '2026-10-11' }];
    const tile = { since: '0.94.0' };
    expect(isNew(tile, '2026-10-10', news)).toBe(false);
    expect(isNew(tile, '2026-10-11', news)).toBe(true);
    expect(isNew(tile, '2026-10-24', news)).toBe(true);
    expect(isNew(tile, '2026-10-25', news)).toBe(false);
    expect(isNew({}, '2026-10-11', news)).toBe(false);
    expect(isNew({ since: '9.9.9' }, '2026-10-11', news)).toBe(false);
  });
});
