// «Heute neu» A «Ein Blick» (Noah 20.10.2026 10:14 «1A 2 … 3a 4a 5b»): the ready wall of Heute, the move of a
// stored wall and the German words. Lists come from the app source. Fictional data only.
import { describe, it, expect } from 'vitest';
import { READY, READY_A, READY_0155, TILE, wallOf, wallRecord, catalog, tripUp } from '../src/lib/home/tiles.js';
import { byTime } from '../src/lib/clear/tipweek.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (w) => w.map((x) => x.id);

describe('«Heute neu» N2: the ready wall (Noah 20.10.2026 «5a»)', () => {
  it('the body and the Aktiv tiles on top, Körperwerte, then the week, the ring, the trip, «Up now», the bikes and 8 shortcuts', () => {
    // Noah 21.10.2026 «Körperwerte und countdown ok»: «Körperwerte» as a whole row under the two tiles on top
    expect(ids(READY).slice(0, 8)).toEqual(['body', 'acts', 'vitals', 'week', 'balance', 'trip', 'important', 'bikes']);
    expect(READY.filter((x) => x.id !== 'vitals').slice(0, 6).every((x) => x.size === 'l')).toBe(true);
    const small = READY.filter((x) => x.size === 's');
    expect(small.length).toBe(8); // 4a: 8 shortcuts
    expect(ids(READY).slice(8)).toEqual(ids(small));
    for (const x of READY) expect(TILE[x.id].sizes, x.id).toContain(x.size);
    // the 8 shortcuts of A stay
    expect(ids(READY.filter((x) => x.size === 's'))).toEqual(ids(READY_A.filter((x) => x.size === 's')));
  });
  it('near a trip its card moves up right under the body, the Aktiv tiles and Körperwerte', () => {
    expect(ids(tripUp(READY, true)).slice(0, 4)).toEqual(['body', 'acts', 'vitals', 'trip']);
    expect(tripUp(READY, false)).toBe(READY);
  });
  it('3a: the cards that left Heute stay in the catalog («Add a tile»)', () => {
    const all = catalog().flatMap((a) => a.tiles.map((x) => x.id));
    for (const x of READY_0155) expect(all, x.id).toContain(x.id);
    expect(all).toContain('du');
    for (const x of READY_A) expect(all, x.id).toContain(x.id);
  });
  it('a wall stored before (v < 10) becomes the new ready wall once; saved again it stays as it was put', () => {
    const old = { v: 8, tiles: [{ id: 'meditation', size: 'long' }, { id: 'flow', size: 'l' }, { id: 'strava', size: 'w' }] };
    expect(wallOf(old)).toEqual(READY);
    expect(wallOf({ v: 9, tiles: READY_A })).toEqual(READY);
    const mine = wallRecord([{ id: 'week', size: 'l' }, { id: 'important', size: 'l' }, { id: 'strava', size: 'w' }]);
    expect(mine.v).toBe(11);
    expect(ids(wallOf(mine))).toEqual(['week', 'important', 'strava']);
    // a wall of N2 (v 10) gets «Körperwerte» once, after «Aktiv heute» (else after the body, else on top); taken away it stays away
    expect(ids(wallOf({ v: 10, tiles: [{ id: 'body', size: 'l' }, { id: 'acts', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['body', 'acts', 'vitals', 'week']);
    expect(ids(wallOf({ v: 10, tiles: [{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['body', 'vitals', 'week']);
    expect(ids(wallOf({ v: 10, tiles: [{ id: 'week', size: 'l' }] }))).toEqual(['vitals', 'week']);
    expect(ids(wallOf(wallRecord([{ id: 'week', size: 'l' }])))).toEqual(['week']);
  });
  it('the time of day keeps the body and the Aktiv tiles on top', () => {
    for (const h of [7, 13, 19, 23]) expect(ids(byTime(READY, h)).slice(0, 2)).toEqual(['body', 'acts']);
  });
});

describe('«Heute neu» A: German words', () => {
  it('the new words are German', () => {
    for (const k of ['Up now', 'You today', 'All areas|home', 'Start|round', 'Show {n} more questions', '{n} days until {trip}.', '{n} things are up today.']) expect(DE[k], k).toBeTruthy();
    expect(DE['Up now']).toBe('Jetzt dran');
    expect(DE['You today']).toBe('Du heute');
    expect(DE['Your body today']).toBe('Dein Körper heute');
    for (const k of ['Active today', 'Resting pulse|body', 'Sleep score|body', 'Active zone minutes|body', 'yesterday {v}', 'Morning check: nothing open', 'Evening check: nothing open']) expect(DE[k], k).toBeTruthy();
  });
});
