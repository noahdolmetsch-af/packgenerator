// v0.94.0 «Kachel-Wand» (Noah 11.10.2026, Trello nLi5yNmS «1-5 a»): the wall of tiles (tiles.js).
import { describe, it, expect } from 'vitest';
import { withValues, HEAD_0155, TILES, TILE, READY, READY_0155, SIZES, AREAS, wallOf, wallOf8, wallBefore5, wallRecord, ADDED_0101, ADDED_0127, GONE, REMOVED_0155, moveTile, stepTile, nextSize, resizeTile, removeTile, addTile, catalog, isNew, sizeFor } from '../src/lib/home/tiles.js';
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
  // 0.155.0 HN4: the functions the day card shows left the ready wall (REMOVED_0155); all stay in the catalog
  // «Heute neu» A (Noah 20.10.2026 «4a»): the ready wall has 8 shortcuts; every function stays in the catalog
  it('all 16 functions are tiles; 8 of them are the shortcuts of the ready wall', () => {
    for (const f of FUNCTIONS) {
      expect(TILE[`fn:${f.id}`]?.fn).toBe(f.id);
      expect(catalog().flatMap((a) => a.tiles).some((x) => x.id === `fn:${f.id}`)).toBe(true);
      expect(READY_0155.some((x) => x.id === `fn:${f.id}`)).toBe(!REMOVED_0155.includes(`fn:${f.id}`));
    }
    expect(READY.filter((x) => x.size === 's').length).toBe(8);
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
    // v0.110.0 (I11e): «New in the app» may be a whole row now; the playground still may not
    // v0.127.0: a wall is stored as v 4 now (v 3 walls get the three daily-check tiles once, below)
    // 0.155.0: a wall is stored as v 5 now (walls of before get the order of HN4 once, tests/heuteneu.test.js)
    // Tages-Check back (18.10.2026): v 6, a v 5 wall gets «Deine 15 Fragen» once (tests/heuteneu.test.js);
    // Routine «Das tut mir gut»: v 7 (walls of before get the routine once, below); Paket Q: v 8 (the tip of the week once)
    // «Heute neu» A: v 9; a wall of before (v < 9) becomes the ready wall once (wallOf8 keeps the HN4 steps)
    // «Heute neu» N2: v 10; a wall of before (v < 10) becomes the ready wall once
    // Körperwerte (Noah 21.10.2026 «ok»): v 11; a v 10 wall gets «Körperwerte» once (tests/heute-a.test.js)
    // P6 «Heute ergänzen» (Noah 21.10.2026 «2b»): v 12; a wall of before gets meditation, the weekly weight and the last activity once (tests/heute-a.test.js)
    // «VO2max auf Heute» (Noah 28.10.2026): v 14; a wall of before gets the VO2max tile once (tests/vo2.test.js), so these walls are v 14
    const w = wallOf({ v: 14, tiles: [{ id: 'play', size: 'long' }, { id: 'nope', size: 's' }, { id: 'play', size: 'w' }, null, { id: 'year', size: 'long' }] });
    expect(w).toEqual([{ id: 'play', size: 's' }, { id: 'year', size: 'long' }]);
    expect(wallOf({ v: 14, tiles: [{ id: 'news', size: 'long' }] })).toEqual([{ id: 'news', size: 'long' }]);
    expect(wallRecord(w)).toEqual({ v: 14, tiles: w });
    expect(wallOf({ v: 14, tiles: [] })).toEqual([]);
    expect(wallOf({ v: 9, tiles: [{ id: 'news', size: 'long' }] })).toEqual(READY);
    expect(wallOf({ v: 8, tiles: [{ id: 'news', size: 'long' }] })).toEqual(READY);
    expect(wallOf8({ v: 8, tiles: [{ id: 'news', size: 'long' }] })).toEqual([{ id: 'news', size: 'long' }]);
    expect(wallOf8({ v: 5, tiles: [{ id: 'flow', size: 'l' }, { id: 'balance', size: 'l' }, { id: 'year', size: 'long' }] }).map((x) => x.id)).toEqual(['routine', 'flow', 'balance', 'questions', 'tipweek', 'year']);
    expect(wallOf8({ v: 6, tiles: [{ id: 'flow', size: 'l' }, { id: 'balance', size: 'l' }, { id: 'year', size: 'long' }] }).map((x) => x.id)).toEqual(['routine', 'flow', 'balance', 'tipweek', 'year']);
  });
  it('v0.101.0: the new tiles are marked «neu» for two weeks from the release', () => {
    for (const id of ADDED_0101) {
      expect(isNew(TILE[id], '2026-10-12')).toBe(true);
      expect(isNew(TILE[id], '2026-10-30')).toBe(false);
    }
  });
  it('v0.101.0: a wall stored before gets the new tiles once, after Im Flow', () => {
    const old = wallBefore5({ v: 1, tiles: [{ id: 'trip', size: 'long' }, { id: 'flow', size: 'l' }, { id: 'month', size: 'l' }, { id: 'year', size: 'long' }] });
    // v0.102.0: and the suggestion tile right after Im Flow (at the end without it)
    // v0.127.0: and the daily-check tiles right after Im Flow (WG: the balance and the round tile)
    expect(old.map((x) => x.id)).toEqual(['trip', 'flow', ...ADDED_0127, 'suggest', 'week', 'nextms', 'yearago', 'month', 'year']);
    expect(wallBefore5({ tiles: [{ id: 'year', size: 'long' }] }).map((x) => x.id)).toEqual(['year', ...ADDED_0101, 'suggest', ...ADDED_0127]);
    // a wall of 0.101 (v 2) gets only the suggestion (and the daily-check tiles)
    expect(wallBefore5({ v: 2, tiles: [{ id: 'trip', size: 'long' }, { id: 'flow', size: 'l' }] }).map((x) => x.id)).toEqual(['trip', 'flow', ...ADDED_0127, 'suggest']);
    // taken away after that, they stay away
    expect(wallBefore5(wallRecord(old.filter((x) => x.id !== 'week'))).map((x) => x.id)).not.toContain('week');
  });
  // WG «Wi gaht's?» takes over the daily check: «Deine 15 Fragen» is gone, so a wall of before gets two tiles
  it('v0.127.0: a wall of before (v 3) gets the balance and the round tile once, after Im Flow (WG: no more «Deine 15 Fragen»)', () => {
    const v3 = wallBefore5({ v: 3, tiles: [{ id: 'trip', size: 'long' }, { id: 'flow', size: 'l' }, { id: 'year', size: 'long' }] });
    expect(v3.map((x) => x.id)).toEqual(['trip', 'flow', 'balance', 'morningcheck', 'year']);
    expect(v3.find((x) => x.id === 'morningcheck').size).toBe('l');
    // one taken away stays away; a tile already there is not added twice
    expect(wallBefore5(wallRecord(v3.filter((x) => x.id !== 'balance'))).map((x) => x.id)).not.toContain('balance');
    expect(wallBefore5({ v: 3, tiles: [{ id: 'balance', size: 'long' }] })).toEqual([{ id: 'balance', size: 'long' }, { id: 'morningcheck', size: 'l' }]);
    for (const id of ADDED_0127) {
      expect(isNew(TILE[id], '2026-10-14')).toBe(true); // new since 0.132.0 (14.10.2026; 0.125.0 never went live)
      expect(TILE[id].area).toBe('flow');
    }
  });
  it('WG: the old small «Tagescheck» leaves a stored wall, the rest stays in place («Deine 15 Fragen» is back since 18.10.2026)', () => {
    for (const id of GONE) {
      expect(TILE[id]).toBeUndefined();
      expect(READY.some((x) => x.id === id)).toBe(false);
      expect(catalog().flatMap((a) => a.tiles).some((x) => x.id === id)).toBe(false);
    }
    const stored = { v: 4, tiles: [{ id: 'trip', size: 'long' }, { id: 'check', size: 's' }, { id: 'balance', size: 'l' }, { id: 'morningcheck', size: 'w' }, { id: 'questions', size: 'long' }, { id: 'year', size: 'long' }] };
    expect(wallBefore5(stored)).toEqual([{ id: 'trip', size: 'long' }, { id: 'balance', size: 'l' }, { id: 'morningcheck', size: 'w' }, { id: 'questions', size: 'long' }, { id: 'year', size: 'long' }]);
    // a wall of before (v 3) with the 15 questions: they stay, the round tile comes once
    expect(wallBefore5({ v: 3, tiles: [{ id: 'flow', size: 'l' }, { id: 'questions', size: 'long' }] }).map((x) => x.id)).toEqual(['flow', 'balance', 'morningcheck', 'questions']);
    // saved again, the record has no trace of the small «Tagescheck»
    expect(wallRecord(wallBefore5(stored)).tiles.map((x) => x.id)).not.toContain('check');
  });
  it('Routine «Das tut mir gut» (D1, Noah 1a): right under the tiles on top of HN4; a wall of before (v 6) gets it once there', () => {
    expect(READY_0155.map((x) => x.id).slice(0, 4)).toEqual([...HEAD_0155, 'routine']);
    expect(TILE.routine).toMatchObject({ area: 'today', sizes: ['l', 'long'], size: 'long' });
    const v5 = wallOf8({ v: 6, tiles: [{ id: 'meditation', size: 'long' }, { id: 'daycard', size: 'long' }, { id: 'important', size: 'long' }, { id: 'flow', size: 'l' }] });
    // Paket Q: a wall of before v 8 also gets the tip of the week once (here at the end, no Aktiv/bikes/year)
    expect(v5.map((x) => x.id)).toEqual(['meditation', 'daycard', 'important', 'routine', 'flow', 'tipweek']);
    // Paket C: Tages-Check is v 6, so a v 6 wall gets only the routine (a v 5 wall gets «Deine 15 Fragen» too, above)
    // without the tiles on top: on top; taken away (stored as v 7), it stays away; moved, it stays where it was put
    expect(wallOf8({ v: 6, tiles: [{ id: 'flow', size: 'l' }] }).map((x) => x.id)).toEqual(['routine', 'flow', 'tipweek']);
    expect(wallOf8(wallRecord(v5.filter((x) => x.id !== 'routine'))).map((x) => x.id)).toEqual(['meditation', 'daycard', 'important', 'flow', 'tipweek']);
    expect(wallOf8({ v: 6, tiles: [{ id: 'flow', size: 'l' }, { id: 'routine', size: 'l' }] })).toEqual([{ id: 'flow', size: 'l' }, { id: 'routine', size: 'l' }, { id: 'tipweek', size: 'long' }]);
  });
  it('moves, steps, resizes, removes and adds', () => {
    const w = [{ id: 'trip', size: 'long' }, { id: 'news', size: 'w' }, { id: 'play', size: 's' }];
    expect(moveTile(w, 'play', 0).map((x) => x.id)).toEqual(['play', 'trip', 'news']);
    expect(moveTile(w, 'trip', 99).map((x) => x.id)).toEqual(['news', 'play', 'trip']);
    expect(moveTile(w, 'nope', 0)).toBe(w);
    expect(stepTile(w, 'news', -1).map((x) => x.id)).toEqual(['news', 'trip', 'play']);
    expect(stepTile(w, 'trip', -1).map((x) => x.id)).toEqual(['trip', 'news', 'play']);
    expect(resizeTile(w, 'news', 's')[1].size).toBe('s');
    expect(resizeTile(w, 'news', 'l')[1].size).toBe('w'); // v0.110.0: 'long' is a size of «New» now, 'l' is not
    expect(removeTile(w, 'news').map((x) => x.id)).toEqual(['trip', 'play']);
    expect(addTile(w, 'milestones').at(-1)).toEqual({ id: 'milestones', size: 's' });
    expect(addTile(w, 'news')).toBe(w);
    expect(addTile(w, 'nope')).toBe(w);
    expect(nextSize('news', 'w')).toBe('long'); // v0.110.0 (I11e): s → w → whole row → s
    expect(nextSize('news', 'long')).toBe('s');
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

// Paket P «Daten-Widget» (Noah 19.10.2026 «2 beides»): «Your values today» on Heute as its own tile
describe('Paket P: the tile «Your values today»', () => {
  it('a wall of before (v < 8) gets it once, right under Aktiv; without Aktiv not; taken away it stays away', () => {
    expect(withValues([{ id: 'trip', size: 'long' }, { id: 'aktiv', size: 'long' }, { id: 'year', size: 'long' }]).map((x) => x.id)).toEqual(['trip', 'aktiv', 'values', 'year']);
    expect(withValues([{ id: 'trip', size: 'long' }]).map((x) => x.id)).toEqual(['trip']);
    expect(wallOf8({ v: 7, tiles: [{ id: 'aktiv', size: 'long' }] }).map((x) => x.id)).toEqual(['aktiv', 'values', 'tipweek']) // v 8 also brings Paket Q's tip of the week;
    expect(wallOf8({ v: 8, tiles: [{ id: 'aktiv', size: 'long' }] }).map((x) => x.id)).toEqual(['aktiv']);
    expect(TILE.values.sizes).toEqual(['l', 'long']);
  });
});
