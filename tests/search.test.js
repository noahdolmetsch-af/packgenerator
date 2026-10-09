import { describe, it, expect } from 'vitest';
import { searchAll, tripDay } from '../src/lib/search.js';

const data = {
  items: [
    { id: 'RG01', name: 'Rain jacket', nameDe: 'Regenjacke', brand: 'Haglöfs', weightG: 180, ownership: 'owned', favorite: true },
    { id: 'RG06', name: 'Rain trousers UL', nameDe: 'Regenhose', ownership: 'owned', weightG: null },
    { id: 'KL01', name: 'Bib shorts', ownership: 'owned', weightG: 150 },
    { id: 'X1', name: 'Old rain cape', ownership: 'gone' },
    { id: 'W1', name: 'Down jacket UL', ownership: 'wishlist' },
  ],
  trips: [{ id: 't1', title: 'Jura weekend', startDate: '2026-05-01', bike: 'Factor LS' }],
  templates: [{ id: 'favorites', name: 'favorites-tested-bikepacking-gear', entries: [{}, {}] }],
  bikes: [{ id: 'b1', name: 'Factor LS', km: 3689 }],
  notes: [{ id: 'n1', text: 'Rain jacket zip broken', status: 'open', at: '2026-10-01' }],
};

describe('search everything', () => {
  it('finds gear by English or German name, never gone items', () => {
    const r = searchAll('regen', data);
    expect(r[0].kind).toBe('gear');
    expect(r[0].rows.map((x) => x.id)).toEqual(['RG01', 'RG06']);
    expect(searchAll('cape', data)).toEqual([]);
  });

  it('every word has to match, across kinds', () => {
    const r = searchAll('rain jacket', data);
    expect(r.map((g) => g.kind)).toEqual(['gear', 'note']);
    expect(r[0].rows[0]).toMatchObject({ title: '★ Rain jacket', sub: 'Haglöfs', v: '180 g', href: '#/gear?q=Rain%20jacket&item=RG01' });
  });

  it('finds trips, bikes and templates', () => {
    expect(searchAll('factor', data).map((g) => g.kind)).toEqual(['trip', 'bike']);
    expect(searchAll('favor', data)[0]).toMatchObject({ kind: 'template', rows: [{ sub: '2 items' }] });
    expect(searchAll('jacket', data)[0].rows.find((x) => x.id === 'W1').sub).toBe('not weighed · wishlist');
  });

  it('v0.40.0: a trip day with the weekday, the year only for another year', () => {
    expect(tripDay('2026-10-18', new Date('2026-10-09T12:00:00'))).toBe('Sun 18 Oct');
    expect(tripDay('2025-10-18', new Date('2026-10-09T12:00:00'))).toBe('Sat, 18 Oct 2025');
    expect(searchAll('jura', data)[0].rows[0].sub).toMatch(/^Fri,? 1 May( 2026)? · Factor LS$/);
  });

  it('needs two letters', () => {
    expect(searchAll('r', data)).toEqual([]);
    expect(searchAll('  ', data)).toEqual([]);
  });
});
