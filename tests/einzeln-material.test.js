// Einzelideen Material und Überall (996 Ideen, Noah 25.10.2026: 19, 20, 21, 22, 24, 37, 38, 40). Fictional data only.
import { describe, it, expect } from 'vitest';
import { addWhy, favWhy, FAV_WHY, SOLVES, solvesOf, toggleSolve, solveScore, twiceOf, keepTwice, ownViewsOf, STD_VIEWS, inOwnView, ownViewCounts, toggleOwnView, dropOwnView, fillOf, fullOf, tripFill } from '../src/lib/einzeln/material.js';
import { wishReason } from '../src/lib/insights.js';
import { itemDraft, itemRecord } from '../src/lib/gear.js';
import { freeNames } from '../src/lib/tools/convert.js';
import { meaningsOf } from '../src/lib/suche/meanings.js';
import { createDictation } from '../src/lib/dictate.js';
import { GROUP_PLACES } from '../src/lib/groups.js';
import de from '../src/lib/i18n/de/index.js';

const P = 'test_data_gtp_';

describe('19 why a favourite', () => {
  it('adds a reason once, joined with ·', () => {
    expect(addWhy('', 'Reliable')).toBe('Reliable');
    expect(addWhy('Reliable', 'Warm')).toBe('Reliable · Warm');
    expect(addWhy('Reliable · Warm', 'warm')).toBe('Reliable · Warm');
  });
  it('a reason only for a favourite with a note', () => {
    expect(favWhy({ favorite: true, favNote: ' Warm ' })).toBe('Warm');
    expect(favWhy({ favorite: false, favNote: 'Warm' })).toBe('');
    expect(favWhy({ favorite: true })).toBe('');
  });
  it('a wish that replaces a favourite says why that one is a favourite', () => {
    const old = { id: 'A', name: `${P}Jacket`, favorite: true, favNote: 'Packs small', weightG: 300, ownership: 'owned' };
    const wish = { id: 'W', name: `${P}New jacket`, replaces: 'A', weightG: 200, ownership: 'wishlist' };
    const r = wishReason(wish, [old, wish], [], []);
    expect(r.reasons.some((x) => x.includes('Packs small'))).toBe(true);
  });
  it('every quick reason has German', () => {
    for (const w of FAV_WHY) expect(de[w], w).toBeTruthy();
  });
});

describe('20 a wish counts for the trouble it solves', () => {
  it('keeps the known troubles in order and toggles them', () => {
    expect(solvesOf({ solves: ['chargers', 'nonsense', 'dry'] })).toEqual(['dry', 'chargers']);
    expect(toggleSolve(['dry'], 'chargers')).toEqual(['dry', 'chargers']);
    expect(toggleSolve(['dry', 'chargers'], 'dry')).toEqual(['chargers']);
  });
  it('a solved trouble moves a wish up even without grams', () => {
    const plain = { id: 'a', name: `${P}a`, ownership: 'wishlist' };
    const dry = { id: 'b', name: `${P}b`, ownership: 'wishlist', solves: ['dry'] };
    expect(solveScore(dry)).toBeGreaterThan(0);
    expect(wishReason(dry, [], [], []).score).toBeGreaterThan(wishReason(plain, [], [], []).score);
    expect(wishReason(dry, [], [], []).reasons.join(' ')).toContain('Stays dry');
  });
  it('every trouble has German', () => {
    for (const s of SOLVES) expect(de[s.name], s.name).toBeTruthy();
  });
});

describe('21 the same task twice', () => {
  const items = [
    { id: 'b1', name: `${P}Base 1`, zone: 'torso', layer: 'base', tempMin: 10, ownership: 'owned' },
    { id: 'b2', name: `${P}Base 2`, zone: 'torso', layer: 'base', tempMin: 11, ownership: 'owned' },
    { id: 'm1', name: `${P}Fleece`, zone: 'torso', layer: 'mid', tempMin: 10, ownership: 'owned' },
    { id: 'm2', name: `${P}Puffy`, zone: 'torso', layer: 'mid', tempMin: -5, ownership: 'owned' },
    { id: 'r1', name: `${P}Rain jacket`, zone: 'torso', layer: 'outer', ownership: 'owned' },
    { id: 'w1', name: `${P}Wind vest`, zone: 'torso', layer: 'outer', ownership: 'owned' },
  ];
  const trip = { entries: items.map((i) => ({ itemId: i.id, qty: 1 })) };
  it('finds two base layers of the same warmth, not a fleece and a puffy, not rain and wind', () => {
    const g = twiceOf(trip, items);
    expect(g.map((x) => x.items.map((i) => i.id))).toEqual([['b1', 'b2']]);
    expect(g[0].zone).toBe('upper');
    expect(g[0].layer).toBe('base');
  });
  it('a group kept on purpose is not asked again', () => {
    const key = twiceOf(trip, items)[0].key;
    expect(twiceOf({ ...trip, ...keepTwice(trip, key) }, items)).toEqual([]);
  });
});

describe('22 own views', () => {
  it('start with Repair, Winter and Always along; a stored list wins', () => {
    expect(ownViewsOf(undefined).map((v) => v.id)).toEqual(STD_VIEWS.map((v) => v.id));
    expect(ownViewsOf([{ id: 'x', name: 'Kids' }])).toEqual([{ id: 'x', name: 'Kids' }]);
    expect(ownViewsOf([])).toEqual([]);
    for (const v of STD_VIEWS) expect(de[v.std], v.std).toBeTruthy();
  });
  it('an item is in several views without a copy', () => {
    const views = ownViewsOf(undefined);
    const pump = { id: 'p', ownViews: toggleOwnView(toggleOwnView([], 'always', views), 'repair', views) };
    expect(pump.ownViews).toEqual(['repair', 'always']);
    expect(inOwnView(pump, 'repair') && inOwnView(pump, 'always')).toBe(true);
    expect(ownViewCounts([pump, { id: 'q', ownViews: ['repair'] }], views)).toEqual({ repair: 2, winter: 0, always: 1 });
  });
  it('deleting a view keeps its items, or moves them to another view', () => {
    const items = [{ id: 'a', ownViews: ['winter', 'repair'] }, { id: 'b', ownViews: ['repair'] }];
    expect(dropOwnView(items, 'winter', null, 'now')).toEqual([{ id: 'a', ownViews: ['repair'], updatedAt: 'now' }]);
    expect(dropOwnView(items, 'repair', 'always', 'now').map((i) => i.ownViews)).toEqual([['winter', 'always'], ['always']]);
  });
  it('is a group place (rename and delete with the one window)', () => {
    expect(GROUP_PLACES.some((g) => g.name === 'Own views of Material')).toBe(true);
  });
});

describe('24 empty weight and content apart', () => {
  it('fill and full weight', () => {
    expect(fillOf({ fillG: '750' })).toBe(750);
    expect(fillOf({ fillG: 0 })).toBeNull();
    expect(fullOf({ weightG: 120, fillG: 750 })).toBe(870);
    expect(fullOf({ weightG: null, fillG: 750 })).toBeNull();
  });
  it('a trip adds the content of its items, not the ones counted as food and water', () => {
    const byId = { b: { id: 'b', fillG: 750 }, g: { id: 'g', fillG: 230 }, w: { id: 'w', fillG: 500, waterL: 0.5 } };
    const eats = (i) => i.waterL > 0;
    expect(tripFill([{ itemId: 'b', qty: 2 }, { itemId: 'g' }, { itemId: 'w' }], byId, eats)).toEqual({ g: 1730, n: 2 });
  });
  it('the item window stores the content as a number, and only when given', () => {
    const item = { id: 'B1', name: `${P}Bottle`, category: 'cook', defaultBag: 'top', ownership: 'owned', role: null, sets: [], qty: 1, weightG: 120, weightStatus: 'measured' };
    const plain = itemRecord(itemDraft(item), { item, items: [item], weightG: 120, now: 'n' });
    expect('fillG' in plain).toBe(false);
    const filled = itemRecord({ ...itemDraft(item), fillG: '750' }, { item, items: [item], weightG: 120, now: 'n' });
    expect(filled.fillG).toBe(750);
  });
});

describe('37 the begun question becomes text when the microphone fails', () => {
  it('flushes the words still heard on an error', () => {
    let rec;
    class Speech {
      constructor() {
        rec = this;
      }
      start() {}
      stop() {}
      abort() {}
    }
    const got = [];
    let state = null;
    const d = createDictation({ Speech, onwords: (w) => got.push(w), onstate: (s) => (state = s) });
    d.start();
    rec.onresult({ resultIndex: 0, results: Object.assign([Object.assign([{ transcript: 'wie warm ist es' }], { isFinal: false })], {}) });
    rec.onerror({ error: 'audio-capture' });
    expect(got.join(' ')).toContain('wie warm ist es');
    expect(state.error).toBe('nomic');
  });
});

describe('38 converted pictures never take an old name', () => {
  it('keeps the name, adds a suffix for the same format and numbers doubles', () => {
    expect(freeNames(['IMG_1.HEIC', 'velo.jpg', 'a.png', 'a.webp'], 'jpg', 'umgewandelt')).toEqual(['IMG_1.jpg', 'velo-umgewandelt.jpg', 'a.jpg', 'a-2.jpg']);
    expect(freeNames(['x.JPEG'], 'jpg', 'c')).toEqual(['x-c.jpg']);
  });
});

describe('40 the search asks when a word means two things', () => {
  const g = (kind, n) => ({ kind, name: kind, rows: Array.from({ length: n }, (_, i) => ({ id: `${kind}${i}` })), more: 0 });
  it('two kinds with hits → two choices, the bigger first, with the kind word in front', () => {
    const m = meaningsOf('kette', [g('page', 2), g('bike', 1), g('gear', 3)]);
    expect(m.map((x) => [x.kind, x.q])).toEqual([['gear', 'material kette'], ['bike', 'velos kette']]);
  });
  it('clear searches ask nothing', () => {
    expect(meaningsOf('kette', [g('gear', 3)])).toEqual([]);
    expect(meaningsOf('material kette', [g('gear', 3), g('bike', 1)])).toEqual([]);
    expect(meaningsOf('unter 200 g', [g('gear', 3), g('bike', 1)])).toEqual([]);
    expect(meaningsOf('a b c d e', [g('gear', 3), g('bike', 1)])).toEqual([]);
  });
});
