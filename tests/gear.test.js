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
    expect(matches(it_('X', { sets: ['bivy'] }), { role: 'night' })).toBe(true);
    // v0.55.0: an old key alone (kept for older versions) is no block any more
    expect(matches(it_('Y', { sets: ['base'] }), { role: 'night' })).toBe(false);
    // v0.32.0 (finding 5, stage 1): "Comes along": Standard = worn, standard pack or "On every trip".
    expect(matches(it_('W', { role: 'worn' }), { role: 'standard' })).toBe(true);
    expect(matches(it_('A', { always: true }), { role: 'standard' })).toBe(true);
    expect(matches(it_('A', { always: true }), { role: 'none' })).toBe(false);
    expect(matches(it_('W', { role: 'worn' }), { role: 'worn' })).toBe(true);
    expect(matches(a, { role: 'worn' })).toBe(false);
    expect(matches(it_('O', { role: 'optional' }), { role: 'optional' })).toBe(true);
    expect(matches(it_('N', {}), { role: 'none' })).toBe(true);
  });

  it('lists only owned, unweighed items to weigh, in category order when priority is equal', () => {
    const q = weighQueue([
      it_('SL01', { category: 'sleep', weightG: null }),
      it_('EL02', { weightG: null }),
      it_('EL03', { weightG: null, ownership: 'wishlist' }),
      it_('EL04'),
    ]);
    expect(q.map((i) => i.id)).toEqual(['EL02', 'SL01']);
  });

  it('leaves food and water out of the gear total and the top 10', () => {
    const s = gearStats([it_('EL01', { weightG: 300 }), it_('FD01', { category: 'food', weightG: 1000 })]);
    expect(s.total).toBe(300);
    expect(s.consumablesG).toBe(1000);
    expect(s.top.map((i) => i.id)).toEqual(['EL01']);
    expect(s.cats.find((c) => c.key === 'food')).toMatchObject({ g: 1000, consumable: true });
  });

  it('weighs every-ride items first, then overnight sets, then optional, then the rest', () => {
    const q = weighQueue([
      it_('EL01', { weightG: null }),
      it_('EL02', { weightG: null, role: 'optional' }),
      it_('SL01', { category: 'sleep', weightG: null, sets: ['bivy'] }),
      it_('SL02', { category: 'sleep', weightG: null, role: 'standard' }),
      it_('EL03', { weightG: null, role: 'worn' }),
    ]);
    expect(q.map((i) => i.id)).toEqual(['EL03', 'SL02', 'SL01', 'EL02', 'EL01']);
  });

  it('helps with IDs, typed grams and display', () => {
    expect(nextId([it_('EL01'), it_('EL19')], 'elec')).toBe('EL20');
    expect(nextId([], 'sleep')).toBe('SL01');
    expect(parseGrams(' 1,250 ')).toBe(1250);
    expect(parseGrams('0')).toBe(null);
    expect(parseGrams('12.5')).toBe(null);
    expect(formatWeight(1234)).toBe('1.23 kg');
    expect(formatWeight(999)).toBe('999 g');
    expect(formatWeight(64000)).toBe('64 kg');
    expect(formatWeight(1500)).toBe('1.5 kg');
    expect(formatWeight(12340)).toBe('12.3 kg');
    expect(itemWeight(it_('A', { weightG: null }))).toBe(null);
    expect(groupByCategory([it_('SL01', { category: 'sleep' }), it_('EL01')]).map((g) => g.key)).toEqual(['elec', 'sleep']);
  });
});

// v0.27.0 (Noah 1a): an item with an unknown category (e.g. from someone else's import) is not invisible.
describe('unknown category', () => {
  it('gets its own group at the end and its own sums', () => {
    const items = [it_('SL01', { category: 'sleep' }), it_('test_data_gtp_X1', { category: 'clothing' }), it_('test_data_gtp_X2', { category: undefined })];
    const groups = groupByCategory(items);
    expect(groups.map((g) => g.key)).toEqual(['sleep', 'other']);
    expect(groups[1]).toMatchObject({ name: 'Other / unknown category', unknown: true });
    expect(groups[1].items.map((i) => i.id)).toEqual(['test_data_gtp_X1', 'test_data_gtp_X2']);
    expect(gearStats(items).other.n).toBe(2);
  });
});
