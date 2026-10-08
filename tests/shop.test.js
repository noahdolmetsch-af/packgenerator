// v0.34.0 (L3): the shopping list of a trip. Fictional items only.
import { describe, it, expect, afterEach } from 'vitest';
import { shopList, shopCount, toggleShop, shopText, shopLine } from '../src/lib/shop.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const items = {
  gel: { id: 'gel', name: 'test_data_gtp_ Gel', nameDe: 'test_data_gtp_ Gel DE', category: 'food' },
  bar: { id: 'bar', name: 'test_data_gtp_ Bar', category: 'food' },
  tube: { id: 'tube', name: 'test_data_gtp_ Tube', category: 'tools' },
};
const trip = (extra = {}) => ({
  id: 'test_data_gtp_t', title: 'test_data_gtp_ Trip',
  entries: [
    { itemId: 'tube', slot: 'seat', qty: 1 },
    { itemId: 'gel', slot: 'top', qty: 3 },
    { itemId: 'bar', slot: 'body', qty: 5 },
    { itemId: 'gone', slot: 'seat', qty: 2 },
    { itemId: 'gel', slot: 'body', qty: 1 },
  ],
  ...extra,
});

describe('shopList', () => {
  it('food and consumables with their amounts, one row per item', () => {
    expect(shopList(trip(), items)).toEqual([
      { itemId: 'gel', name: 'test_data_gtp_ Gel', qty: 4, done: false },
      { itemId: 'bar', name: 'test_data_gtp_ Bar', qty: 5, done: false },
    ]);
  });
  it('the ticks come from trip.shop; a tick of an item no longer on the trip is ignored', () => {
    const rows = shopList(trip({ shop: { bar: true, old: true } }), items);
    expect(rows.map((r) => r.done)).toEqual([false, true]);
    expect(shopCount(rows)).toEqual({ total: 2, done: 1, open: 1 });
  });
  it('names in the language of the app', () => {
    lang.v = 'de';
    expect(shopList(trip(), items)[0].name).toBe('test_data_gtp_ Gel DE');
  });
  it('nothing to buy', () => {
    expect(shopList({ entries: [{ itemId: 'tube', qty: 1 }] }, items)).toEqual([]);
    expect(shopList(null, items)).toEqual([]);
    expect(shopCount([])).toEqual({ total: 0, done: 0, open: 0 });
  });
});

describe('toggleShop', () => {
  it('ticks and unticks one item, keeps the others, never changes the input', () => {
    const before = { bar: true };
    const after = toggleShop(before, 'gel');
    expect(after).toEqual({ bar: true, gel: true });
    expect(before).toEqual({ bar: true });
    expect(toggleShop(after, 'bar')).toEqual({ gel: true });
    expect(toggleShop(undefined, 'gel')).toEqual({ gel: true });
  });
});

describe('shopText', () => {
  it('open first, bought below, nothing lost', () => {
    const tr = trip({ shop: { bar: true } });
    expect(shopText(tr, shopList(tr, items))).toBe(['Shopping list: test_data_gtp_ Trip', '☐ 4 × test_data_gtp_ Gel', '', 'Already bought:', '✓ 5 × test_data_gtp_ Bar'].join('\n'));
  });
  it('one piece is just the name; German heading', () => {
    expect(shopLine({ name: 'X', qty: 1 })).toBe('X');
    lang.v = 'de';
    expect(shopText({ title: 'T' }, [])).toBe('Einkaufsliste: T\nNichts zu kaufen für diese Tour.');
  });
});
