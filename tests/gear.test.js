import { describe, it, expect } from 'vitest';
import { gearStats, matches, weighQueue, nextId, parseGrams, formatWeight, itemWeight, groupByCategory } from '../src/lib/gear.js';

const it_ = (id, extra) => ({ id, name: id, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], ...extra });

describe('gear', () => {
  it('counts weight × quantity and keeps the wishlist apart', () => {
    const s = gearStats([
      it_('EL01', { weightG: 450, qty: 2 }),
      it_('EL02', { weightG: null }),
      it_('EL03', { ownership: 'wishlist', weightG: 999 }),
      it_('SL01', { category: 'sleep', weightG: 50, ownership: 'unclear' }),
    ]);
    expect(s.total).toBe(950);
    expect(s.unweighed).toBe(1);
    expect(s.wishlist.map((i) => i.id)).toEqual(['EL03']);
    expect(s.cats.find((c) => c.key === 'elec')).toMatchObject({ g: 900, n: 2, unweighed: 1 });
    expect(s.top.map((i) => i.id)).toEqual(['EL01', 'SL01']);
  });

  it('searches name, brand, ID and filters by category and role', () => {
    const a = it_('EL01', { name: 'Garmin Edge', brand: 'Garmin', role: 'standard' });
    expect(matches(a, { q: 'edge' })).toBe(true);
    expect(matches(a, { q: 'el01' })).toBe(true);
    expect(matches(a, { q: 'tent' })).toBe(false);
    expect(matches(a, { category: 'sleep' })).toBe(false);
    expect(matches(a, { role: 'standard' })).toBe(true);
    expect(matches(a, { role: 'none' })).toBe(false);
    expect(matches(it_('X', { sets: ['base'] }), { role: 'night' })).toBe(true);
  });

  it('lists only owned, unweighed items to weigh, in category order', () => {
    const q = weighQueue([
      it_('SL01', { category: 'sleep', weightG: null }),
      it_('EL02', { weightG: null }),
      it_('EL03', { weightG: null, ownership: 'wishlist' }),
      it_('EL04'),
    ]);
    expect(q.map((i) => i.id)).toEqual(['EL02', 'SL01']);
  });

  it('helps with IDs, typed grams and display', () => {
    expect(nextId([it_('EL01'), it_('EL19')], 'elec')).toBe('EL20');
    expect(nextId([], 'sleep')).toBe('SL01');
    expect(parseGrams(' 1,250 ')).toBe(1250);
    expect(parseGrams('0')).toBe(null);
    expect(parseGrams('12.5')).toBe(null);
    expect(formatWeight(1234)).toBe('1.23 kg');
    expect(formatWeight(999)).toBe('999 g');
    expect(itemWeight(it_('A', { weightG: null }))).toBe(null);
    expect(groupByCategory([it_('SL01', { category: 'sleep' }), it_('EL01')]).map((g) => g.key)).toEqual(['elec', 'sleep']);
  });
});
