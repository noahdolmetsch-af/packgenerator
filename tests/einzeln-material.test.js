// Einzelideen Material und Überall (996 Ideen, Noah 25.10.2026: 19, 20, 24, 37, 38, 40). Fictional data only.
import { describe, it, expect } from 'vitest';
import { addWhy, favWhy, FAV_WHY, SOLVES, solvesOf, toggleSolve, solveScore, fillOf, fullOf, tripFill } from '../src/lib/einzeln/material.js';
import { wishReason } from '../src/lib/insights.js';
import { itemDraft, itemRecord } from '../src/lib/gear.js';
import { freeNames } from '../src/lib/tools/convert.js';
import { meaningsOf } from '../src/lib/suche/meanings.js';
import { createDictation } from '../src/lib/dictate.js';
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
