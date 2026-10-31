// «Heute neu» A «Ein Blick» (Noah 20.10.2026 10:14 «1A 2 … 3a 4a 5b»): the ready wall of Heute, the move of a
// stored wall and the German words. Lists come from the app source. Fictional data only.
import { describe, it, expect } from 'vitest';
import { READY, READY_A, READY_0155, TILE, wallOf, wallRecord, catalog, tripUp } from '../src/lib/home/tiles.js';
import { byTime } from '../src/lib/clear/tipweek.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (w) => w.map((x) => x.id);

describe('«Heute neu» N2: the ready wall (Noah 20.10.2026 «5a»)', () => {
  it('meditation and the weekly weight, the body and the Aktiv tiles, Körperwerte, then the week, the ring, the last activity, the trip, «Up now», the bikes and 8 shortcuts', () => {
    // Noah 21.10.2026 «Körperwerte und countdown ok»: «Körperwerte» as a whole row under the two tiles on top
    // P6 «Heute ergänzen» (Noah 21.10.2026 «2b»): ME1 meditation on top, SN2l the weekly weight, TR1 the last activity
    // «Heute ruhiger» (Noah 26.10.2026 «2a», changed on purpose): «Körperwerte» left the ready wall, its values are in «Dein Körper heute»
    // «VO2max auf Heute» (Noah 28.10.2026 «2 a und b», changed on purpose): the VO2max tile after the last activity
    // «Heute als Begleiter» PR 4 (Noah 28.10.2026, changed on purpose): the moment card right under the habits
    const order = ['meditation', 'moment', 'discover', 'weighin', 'body', 'acts', 'week', 'balance', 'strava', 'vo2max', 'trip', 'important', 'bikes'];
    expect(ids(READY).slice(0, order.length)).toEqual(order);
    expect(READY.filter((x) => ['body', 'acts', 'week', 'balance', 'strava', 'trip', 'important'].includes(x.id)).every((x) => x.size === 'l')).toBe(true);
    const small = READY.filter((x) => x.size === 's');
    expect(small.length).toBe(8); // 4a: 8 shortcuts
    expect(ids(READY).slice(order.length)).toEqual(ids(small));
    for (const x of READY) expect(TILE[x.id].sizes, x.id).toContain(x.size);
    // the 8 shortcuts of A stay
    expect(ids(READY.filter((x) => x.size === 's'))).toEqual(ids(READY_A.filter((x) => x.size === 's')));
  });
  it('near a trip its card moves up right under the head (meditation, weight, body, Aktiv, Körperwerte)', () => {
    expect(ids(tripUp(READY, true)).slice(0, 5)).toEqual(['meditation', 'moment', 'discover', 'weighin', 'body']);
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
    expect(mine.v).toBe(16);
    expect(ids(wallOf(mine))).toEqual(['week', 'important', 'strava']);
    // a wall of N2 (v 10) gets «Körperwerte» once, after «Aktiv heute» (else after the body, else on top); taken away it stays away
    // (and, as v < 12, the P6 tiles once: meditation and the weight on top, the last activity after the balance or the week)
    // «Heute als Begleiter» PR 4 (v < 15, Noah 28.10.2026): the moment card once right under the habits
    const p6 = ['meditation', 'moment', 'discover', 'weighin']; // PR 5: «Discover» too (v < 16)
    // «VO2max auf Heute» (v < 14, Noah 28.10.2026): the VO2max tile once after the body and Aktiv, else at the end
    // «Heute ruhiger» (v < 13, Noah 26.10.2026 «2a»): beside «Dein Körper heute» «Körperwerte» is a double and goes again
    expect(ids(wallOf({ v: 10, tiles: [{ id: 'body', size: 'l' }, { id: 'acts', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual([...p6, 'body', 'acts', 'vo2max', 'week', 'strava']);
    expect(ids(wallOf({ v: 10, tiles: [{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual([...p6, 'body', 'vo2max', 'week', 'strava']);
    expect(ids(wallOf({ v: 10, tiles: [{ id: 'week', size: 'l' }] }))).toEqual([...p6, 'vitals', 'week', 'strava', 'vo2max']);
    expect(ids(wallOf(wallRecord([{ id: 'week', size: 'l' }])))).toEqual(['week']);
    // P6 on a wall of 0.170–0.179 (v 11): a small meditation tile becomes the card on top; a last activity there stays where it is
    const v11 = { v: 11, tiles: [{ id: 'body', size: 'l' }, { id: 'balance', size: 'l' }, { id: 'meditation', size: 's' }, { id: 'bikes', size: 'long' }] };
    expect(wallOf(v11)).toEqual([{ id: 'meditation', size: 'long' }, { id: 'moment', size: 'long' }, { id: 'discover', size: 'long' }, { id: 'weighin', size: 'long' }, { id: 'body', size: 'l' }, { id: 'vo2max', size: 'w' }, { id: 'balance', size: 'l' }, { id: 'strava', size: 'l' }, { id: 'bikes', size: 'long' }]);
    expect(ids(wallOf({ v: 11, tiles: [{ id: 'strava', size: 'w' }, { id: 'body', size: 'l' }] }))).toEqual([...p6, 'strava', 'body', 'vo2max']);
  });
  it('the time of day keeps the head on top (meditation, weight, body, Aktiv)', () => {
    for (const h of [7, 13, 19, 23]) expect(ids(byTime(READY, h)).slice(0, 6)).toEqual(['meditation', 'moment', 'discover', 'weighin', 'body', 'acts']);
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
