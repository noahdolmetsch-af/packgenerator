// «Heute neu» A «Ein Blick» (Noah 20.10.2026 10:14 «1A 2 … 3a 4a 5b»): the ready wall of Heute, the move of a
// stored wall and the German words. Lists come from the app source. Fictional data only.
import { describe, it, expect } from 'vitest';
import { READY, READY_0155, TILE, wallOf, wallRecord, catalog } from '../src/lib/home/tiles.js';
import { byTime } from '../src/lib/clear/tipweek.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (w) => w.map((x) => x.id);

describe('«Heute neu» A: the ready wall', () => {
  it('«Up now» beside the trip, «You today» beside the week, the bikes, then 8 shortcuts', () => {
    expect(ids(READY).slice(0, 5)).toEqual(['important', 'trip', 'du', 'week', 'bikes']);
    expect(READY.slice(0, 4).every((x) => x.size === 'l')).toBe(true);
    const small = READY.filter((x) => x.size === 's');
    expect(small.length).toBe(8); // 4a: 8 shortcuts
    expect(ids(READY).slice(5)).toEqual(ids(small));
    for (const x of READY) expect(TILE[x.id].sizes, x.id).toContain(x.size);
  });
  it('3a: the cards that left Heute stay in the catalog («Add a tile»)', () => {
    const all = catalog().flatMap((a) => a.tiles.map((x) => x.id));
    for (const x of READY_0155) expect(all, x.id).toContain(x.id);
    expect(all).toContain('du');
  });
  it('a wall stored before (v < 9) becomes the new ready wall once; saved again it stays as it was put', () => {
    const old = { v: 8, tiles: [{ id: 'meditation', size: 'long' }, { id: 'flow', size: 'l' }, { id: 'strava', size: 'w' }] };
    expect(wallOf(old)).toEqual(READY);
    const mine = wallRecord([{ id: 'week', size: 'l' }, { id: 'important', size: 'l' }, { id: 'strava', size: 'w' }]);
    expect(mine.v).toBe(9);
    expect(ids(wallOf(mine))).toEqual(['week', 'important', 'strava']);
  });
  it('the time of day keeps «Up now» and the trip on top', () => {
    for (const h of [7, 13, 19, 23]) expect(ids(byTime(READY, h)).slice(0, 2)).toEqual(['important', 'trip']);
  });
});

describe('«Heute neu» A: German words', () => {
  it('the new words are German', () => {
    for (const k of ['Up now', 'You today', 'All areas|home', 'Start|round', 'Show {n} more questions', '{n} days until {trip}.', '{n} things are up today.']) expect(DE[k], k).toBeTruthy();
    expect(DE['Up now']).toBe('Jetzt dran');
    expect(DE['You today']).toBe('Du heute');
  });
});
