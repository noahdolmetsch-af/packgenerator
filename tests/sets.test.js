// v0.26.0 (Noah 2a, AP10): own sets next to the built-in ones, delete plan, "+ Set" in Pack.
import { describe, it, expect, afterEach } from 'vitest';
import { allSets, addSet, renameSet, deleteSetPlan, setQty, qtyOf, setView, addSetEntries, setAddable, setKey, setUse, isBuiltIn } from '../src/lib/sets.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const item = (id, fields = {}) => ({ id, name: `test_data_gtp_ ${id}`, category: 'rain', weightG: 100, qty: 1, defaultBag: 'seat', ownership: 'owned', role: null, sets: [], ...fields });

describe('allSets', () => {
  it('lists the built-in sets first (translated), then own sets as written', () => {
    const own = [{ key: 'u-regen', name: 'test_data_gtp_ Regen' }, { key: 'sleep', qty: { SL01: 2 } }];
    const list = allSets(own);
    expect(list.map((s) => s.key)).toEqual(['base', 'warm', 'sleep', 'cook', 'light', 'lodging', 'firstaid', 'u-regen']);
    expect(list.find((s) => s.key === 'u-regen')).toMatchObject({ name: 'test_data_gtp_ Regen', builtIn: false });
    expect(list.find((s) => s.key === 'sleep')).toMatchObject({ name: 'Night: Sleep', builtIn: true, qty: { SL01: 2 } });
    lang.v = 'de';
    expect(allSets(own).find((s) => s.key === 'sleep').name).toBe('Nacht: Schlafen');
    expect(allSets(own).find((s) => s.key === 'u-regen').name).toBe('test_data_gtp_ Regen');
    expect(allSets(undefined)).toHaveLength(7); // v0.28.0: + first aid
  });

  it('makes, renames and refuses names that are empty or taken', () => {
    const a = addSet([], ' test_data_gtp_ Regen ');
    expect(a).toEqual({ key: 'u-test-data-gtp-regen', value: [{ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Regen' }] });
    expect(addSet(a.value, 'TEST_DATA_GTP_ regen').error).toBe('taken');
    expect(addSet(a.value, 'Lodging').error).toBe('taken');
    expect(addSet(a.value, '  ').error).toBe('empty');
    expect(setKey('Regen', [{ key: 'u-regen' }])).toBe('u-regen-2');
    expect(renameSet(a.value, 'u-test-data-gtp-regen', 'test_data_gtp_ Nass').value[0]).toMatchObject({ key: 'u-test-data-gtp-regen', name: 'test_data_gtp_ Nass' });
    // Noah 5b: built-in blocks can be renamed; an empty name brings the label back; keys stay.
    const r = renameSet(a.value, 'sleep', 'test_data_gtp_ Schlafsack');
    expect(r.value[1]).toEqual({ key: 'sleep', name: 'test_data_gtp_ Schlafsack' });
    expect(allSets(r.value).find((s) => s.key === 'sleep')).toMatchObject({ name: 'test_data_gtp_ Schlafsack', builtIn: true });
    expect(renameSet(r.value, 'sleep', ' ').value[1]).toEqual({ key: 'sleep' });
    expect(renameSet(a.value, 'u-gone', 'x').error).toBe('missing');
    expect(isBuiltIn('lodging')).toBe(true);
    expect(setUse('lodging')).toBe('Comes with Lodging');
  });
});

describe('delete plan', () => {
  it('removes the record and the key from every item; built-in sets cannot be deleted', () => {
    const value = [{ key: 'u-regen', name: 'Regen' }, { key: 'u-x', name: 'X' }];
    const items = [item('A', { sets: ['u-regen', 'sleep'] }), item('B', { sets: ['sleep'] }), item('C', { sets: ['u-regen'] })];
    const plan = deleteSetPlan(value, items, 'u-regen', 'now');
    expect(plan.value).toEqual([{ key: 'u-x', name: 'X' }]);
    expect(plan.items.map((i) => [i.id, i.sets])).toEqual([['A', ['sleep']], ['C', []]]);
    expect(deleteSetPlan(value, items, 'sleep')).toBeNull();
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
