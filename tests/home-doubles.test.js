// «Heute ruhiger» part 2 (Noah 26.10.2026 «2a», mockup H2): the double tiles leave Heute once, they stay in the catalog.
import { describe, it, expect } from 'vitest';
import { TILE, READY, DOUBLES, withoutDoubles, wallOf, wallRecord, catalog } from '../src/lib/home/tiles.js';

const ids = (l) => l.map((x) => x.id);

describe('Heute ruhiger: the double tiles (2a)', () => {
  it('go once from a wall of before, only beside the tile that covers them; they stay in the catalog', () => {
    const all = catalog().flatMap((a) => a.tiles.map((x) => x.id));
    for (const id of Object.keys(DOUBLES)) expect(all, id).toContain(id);
    const busy = ['meditation', 'body', 'acts', 'vitals', 'values', 'du', 'aktiv', 'flow', 'morningcheck', 'balance', 'nextms', 'milestones', 'year', 'series', 'week'].map((id) => ({ id, size: TILE[id].size }));
    expect(ids(withoutDoubles(busy))).toEqual(['meditation', 'body', 'acts', 'balance', 'year', 'week']);
    // without «Dein Körper heute» Körperwerte is no double and stays
    expect(ids(withoutDoubles([{ id: 'vitals', size: 'long' }, { id: 'week', size: 'l' }]))).toEqual(['vitals', 'week']);
    // (and, as v < 14, the VO2max tile once after the body and Aktiv, Noah 28.10.2026)
    expect(ids(wallOf({ v: 12, tiles: busy }))).toEqual(['meditation', 'body', 'acts', 'vo2max', 'balance', 'year', 'week']);
    // added again later (the wall is v 13 then), they stay
    expect(ids(wallOf(wallRecord(busy)))).toEqual(ids(busy));
  });
  it('the ready wall has no doubles', () => {
    expect(withoutDoubles(READY)).toEqual(READY);
  });
});
