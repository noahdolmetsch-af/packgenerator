// «Kochen» online shop search: the address of a shop's search for an ingredient
import { describe, it, expect } from 'vitest';
import { SHOPS, shopOf, shopLink } from '../src/lib/kochen/shop.js';
import { prefsOf } from '../src/lib/kochen/kochen.js';

describe('shop search links', () => {
  it('builds the search address and encodes the name', () => {
    expect(shopLink('migros', 'Eier')).toBe('https://www.migros.ch/de/search?query=Eier');
    expect(shopLink('coop', 'Hüttenkäse & Gurke')).toBe('https://www.coop.ch/de/search/?text=H%C3%BCttenk%C3%A4se%20%26%20Gurke');
  });
  it('no shop or no name gives no link', () => {
    expect(shopLink('', 'Eier')).toBe('');
    expect(shopLink('other', 'Eier')).toBe('');
    expect(shopLink('migros', '  ')).toBe('');
  });
  it('the saved choice is only a known shop', () => {
    expect(shopOf('coop')).toBe('coop');
    expect(shopOf('x')).toBe('');
    expect(prefsOf({ shop: 'migros' }).shop).toBe('migros');
    expect(prefsOf({ shop: 5 }).shop).toBe('');
    expect(SHOPS.every((s) => s.url('a').startsWith('https://'))).toBe(true);
  });
});
