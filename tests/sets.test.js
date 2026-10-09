// v0.26.0 (Noah 2a, AP10): own sets next to the built-in ones, delete plan, "+ Set" in Pack.
import { describe, it, expect, afterEach } from 'vitest';
import { allSets, addSet, renameSet, deleteSetPlan, setQty, qtyOf, setView, addSetEntries, setAddable, setKey, setUse, isBuiltIn, entriesWeight, isBlockTip, startBlocks, templateBlocks, blocksLine, blockLabel } from '../src/lib/sets.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const item = (id, fields = {}) => ({ id, name: `test_data_gtp_ ${id}`, category: 'rain', weightG: 100, qty: 1, defaultBag: 'seat', ownership: 'owned', role: null, sets: [], ...fields });

describe('allSets', () => {
  it('lists the built-in sets first (translated), then own sets as written', () => {
    // v0.55.0 «Bausteine neu»: the new built-in blocks; a record of an old key (sleep) is no own block.
    const own = [{ key: 'u-regen', name: 'test_data_gtp_ Regen' }, { key: 'bivy', qty: { SL01: 2 } }, { key: 'sleep', qty: { SL01: 2 } }];
    const list = allSets(own);
    expect(list.map((s) => s.key)).toEqual(['bivy', 'tent', 'hotel', 'cook', 'firstaid', 'repair', 'charge', 'lights', 'race', 'food', 'hygiene', 'comfort', 'u-regen']);
    expect(list.find((s) => s.key === 'u-regen')).toMatchObject({ name: 'test_data_gtp_ Regen', builtIn: false });
    expect(list.find((s) => s.key === 'bivy')).toMatchObject({ name: 'Bivouac', builtIn: true, qty: { SL01: 2 } });
    expect(list.find((s) => s.key === 'tent').name).toBe('Tent');
    lang.v = 'de';
    expect(allSets(own).find((s) => s.key === 'bivy').name).toBe('Biwak');
    expect(allSets(own).find((s) => s.key === 'hotel').name).toBe('Hotel/Hütte');
    expect(allSets(own).find((s) => s.key === 'u-regen').name).toBe('test_data_gtp_ Regen');
    expect(allSets(undefined)).toHaveLength(12);
  });

  it('makes, renames and refuses names that are empty or taken', () => {
    const a = addSet([], ' test_data_gtp_ Regen ');
    expect(a).toEqual({ key: 'u-test-data-gtp-regen', value: [{ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Regen' }] });
    expect(addSet(a.value, 'TEST_DATA_GTP_ regen').error).toBe('taken');
    expect(addSet(a.value, 'Hotel/hut').error).toBe('taken');
    expect(addSet(a.value, 'Tent').error).toBe('taken');
    expect(addSet(a.value, '  ').error).toBe('empty');
    expect(setKey('Regen', [{ key: 'u-regen' }])).toBe('u-regen-2');
    expect(renameSet(a.value, 'u-test-data-gtp-regen', 'test_data_gtp_ Nass').value[0]).toMatchObject({ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Nass' });
    // Noah 5b: built-in blocks can be renamed; an empty name brings the label back; keys stay.
    const r = renameSet(a.value, 'bivy', 'test_data_gtp_ Schlafsack');
    expect(r.value[1]).toEqual({ key: 'bivy', name: 'test_data_gtp_ Schlafsack' });
    expect(allSets(r.value).find((s) => s.key === 'bivy')).toMatchObject({ name: 'test_data_gtp_ Schlafsack', builtIn: true });
    expect(renameSet(r.value, 'bivy', ' ').value[1]).toEqual({ key: 'bivy' });
    expect(renameSet(a.value, 'u-gone', 'x').error).toBe('missing');
    expect(isBuiltIn('hotel')).toBe(true);
    expect(isBuiltIn('lodging')).toBe(false);
    expect(setUse('hotel')).toBe('Comes with a night in a hotel or hut');
  });
});

describe('delete plan', () => {
  it('removes the record and the key from every item; built-in sets cannot be deleted', () => {
    const value = [{ key: 'u-regen', name: 'Regen' }, { key: 'u-x', name: 'X' }];
    const items = [item('A', { sets: ['u-regen', 'sleep'] }), item('B', { sets: ['sleep'] }), item('C', { sets: ['u-regen'] })];
    const plan = deleteSetPlan(value, items, 'u-regen', 'now');
    expect(plan.value).toEqual([{ key: 'u-x', name: 'X' }]);
    expect(plan.items.map((i) => [i.id, i.sets])).toEqual([['A', ['sleep']], ['C', []]]);
    expect(deleteSetPlan(value, items, 'bivy')).toBeNull();
  });
});

describe('amounts per item', () => {
  it('stores only amounts other than 1, also for built-in sets', () => {
    let v = setQty([], 'sleep', 'SL01', 2);
    expect(v).toEqual([{ key: 'sleep', qty: { SL01: 2 } }]);
    v = setQty(v, 'sleep', 'SL01', 1);
    expect(v).toEqual([{ key: 'sleep' }]);
    expect(setQty([], 'sleep', 'SL01', 1)).toEqual([]);
    expect(qtyOf({ qty: { G: 2 } }, 'G')).toBe(2);
    expect(qtyOf({}, 'G')).toBe(1);
  });
});

describe('set card', () => {
  it('weighs only inventory items, unknown stays unknown, gone ones listed last', () => {
    const set = { key: 'u-regen', qty: { G: 2 } };
    const items = [item('X', { sets: ['u-regen'], ownership: 'gone', weightG: 999 }), item('G', { sets: ['u-regen'], weightG: 50 }), item('N', { sets: ['u-regen'], weightG: null }), item('Y')];
    const v = setView(set, items);
    expect(v.items.map((i) => i.id)).toEqual(['G', 'N', 'X']);
    expect(v.inventory.map((i) => i.id)).toEqual(['G', 'N']);
    expect([v.g, v.missing]).toEqual([100, 1]);
  });
});

describe('+ Set in Pack', () => {
  const trip = { setup: { seat: 'bag-1' }, entries: [{ itemId: 'A', slot: 'seat', qty: 3, packed: true }] };
  const items = [
    item('A', { sets: ['u-regen'] }),
    item('B', { sets: ['u-regen', 'sleep'] }),
    item('C', { sets: ['u-regen'], ownership: 'gone' }),
    item('D', { sets: ['u-regen'], role: 'worn' }),
    item('E', { sets: ['u-regen'], defaultBag: 'frame' }),
  ];
  it('adds inventory items not on the trip, in their bag, with the amount; existing entries untouched', () => {
    const { entries, added } = addSetEntries(trip, items, { key: 'u-regen', qty: { B: 2, A: 5 } });
    expect(added).toEqual(['B', 'D', 'E']);
    expect(entries[0]).toEqual({ itemId: 'A', slot: 'seat', qty: 3, packed: true });
    expect(entries.slice(1)).toEqual([
      { itemId: 'B', slot: 'seat', qty: 2, packed: false, src: 'set' },
      { itemId: 'D', slot: 'body', qty: 1, packed: false, src: 'set' },
      { itemId: 'E', slot: 'seat', qty: 1, packed: false, src: 'set' },
    ]);
    expect(setAddable(trip, items, { key: 'u-regen' })).toBe(3);
  });
  it('an item in two sets is packed once', () => {
    const first = addSetEntries(trip, items, { key: 'u-regen' });
    const second = addSetEntries({ ...trip, entries: first.entries }, items, { key: 'sleep' });
    expect(second.added).toEqual([]);
    expect(second.entries.filter((e) => e.itemId === 'B')).toHaveLength(1);
    expect(addSetEntries({ ...trip, entries: first.entries }, items, { key: 'u-regen' }).added).toEqual([]);
  });
  it('skips bags and fixtures', () => {
    expect(addSetEntries(trip, items, { key: 'u-regen' }, { skip: new Set(['B']) }).added).toEqual(['D', 'E']);
  });
});

// v0.30.0 (Noah, finding 2): the "New trip" window shows blocks with weight, tips and templates in words.
describe('New trip: blocks and templates in words', () => {
  const items = [
    item('S1', { role: 'standard' }),
    item('S2', { role: 'worn', weightG: null }),
    item('R1', { sets: ['u-regen'], weightG: 260 }),
    item('R2', { sets: ['u-regen'], weightG: 70 }),
    item('R3', { sets: ['u-regen'], ownership: 'gone' }),
    item('W1', { sets: ['warm'] }),
  ];
  const sets = [{ key: 'warm', name: 'Night: Warm' }, { key: 'u-regen', name: 'test_data_gtp_ Regen' }];
  it('weighs new entries honestly, with their amount', () => {
    expect(entriesWeight([{ itemId: 'R1', qty: 1 }, { itemId: 'R2', qty: 2 }], items)).toMatchObject({ g: 400, missing: 0 });
    expect(entriesWeight([{ itemId: 'S2', qty: 1 }, { itemId: 'R1' }], items)).toMatchObject({ g: 260, missing: 1 });
  });
  it('tips: rain with rain, hygiene with a night (v0.55.0: Warm and Light are no tips any more)', () => {
    expect(isBlockTip(sets[1], { wet: true })).toBe(true);
    expect(isBlockTip(sets[1], { wet: false })).toBe(false);
    expect(isBlockTip(sets[0], { max: 8 })).toBe(false);
    expect(isBlockTip({ key: 'hygiene' }, { night: 'outdoor' })).toBe(true);
    expect(isBlockTip({ key: 'hygiene' }, { night: 'none' })).toBe(false);
    expect(isBlockTip({ key: 'lights' }, { night: 'outdoor' })).toBe(false);
  });
  it('a template is "Standard + blocks" only when it is exactly that', () => {
    expect(startBlocks(['S1', 'S2', 'R1', 'R2'], ['S1', 'S2'], sets, items).map((s) => s.key)).toEqual(['u-regen']);
    expect(startBlocks(['S1', 'S2'], ['S1', 'S2'], sets, items)).toEqual([]);
    expect(startBlocks(['S1', 'S2', 'R1'], ['S1', 'S2'], sets, items)).toBeNull(); // only half the block
    expect(startBlocks(['S1', 'R1', 'R2'], ['S1', 'S2'], sets, items)).toBeNull(); // not the whole standard set
    expect(startBlocks(['S1', 'S2', 'R1', 'R2', 'W1'], ['S1', 'S2'], sets, items).map((s) => s.key)).toEqual(['warm', 'u-regen']);
  });
  it('v0.30.1 (Noah N10): a template always in blocks, the rest as single items', () => {
    const words = (ids) => {
      const r = templateBlocks(ids, ['S1', 'S2'], sets, items);
      return { standard: r.standard, blocks: r.blocks.map((s) => s.key), single: r.single };
    };
    expect(words(['S1', 'S2', 'R1', 'R2'])).toEqual({ standard: true, blocks: ['u-regen'], single: 0 });
    expect(words(['S1', 'S2', 'R1'])).toEqual({ standard: true, blocks: [], single: 1 }); // half a block: a single item
    expect(words(['S1', 'R1', 'R2'])).toEqual({ standard: false, blocks: ['u-regen'], single: 1 }); // not the whole standard set
    expect(words(['S1', 'S2', 'R1', 'R2', 'W1', 'X9'])).toEqual({ standard: true, blocks: ['warm', 'u-regen'], single: 1 });
  });
});

// v0.32.0 (finding 5, stage 1): a template in the two words of the app.
describe('blocksLine', () => {
  it('"Standard + Rain + 2 extra", German «Standard + Regen + 2 Extra»', () => {
    const rain = { key: 'u-regen', name: 'Regen', builtIn: false };
    expect(blocksLine({ standard: true, blocks: [rain], single: 2 })).toBe('Standard + Regen + 2 extra');
    expect(blocksLine({ standard: false, blocks: [], single: 1 })).toBe('1 extra');
    expect(blocksLine({ standard: false, blocks: [], single: 0 })).toBe('0 items');
    lang.v = 'de';
    expect(blocksLine({ standard: true, blocks: [rain], single: 2 })).toBe('Standard + Regen + 2 Extra');
    expect(blockLabel({ builtIn: true, name: 'Nacht: Kochen' })).toBe('Kochen');
    expect(blockLabel({ builtIn: false, name: 'Nacht: eigen' })).toBe('Nacht: eigen');
  });
});
