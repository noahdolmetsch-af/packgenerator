import { describe, it, expect } from 'vitest';
import { planFavorites, favoritesTemplate, isFavoritesFile, FAVORITES } from '../src/lib/favorites.js';
import { matches } from '../src/lib/gear.js';

const items = [
  { id: 'KL15', name: 'Buff', nameDe: 'Buff dünn', category: 'onbike', brand: 'Buff', weightG: 30, defaultBag: 'top', ownership: 'owned' },
  { id: 'OB07', name: 'Off-bike shoes', nameDe: 'Off-bike-Schuhe', category: 'offbike', brand: '', weightG: 400, defaultBag: 'seat', ownership: 'owned' },
  { id: 'KL13', name: 'Warm gilet (Albion)', nameDe: 'Fleece-Weste UL', category: 'onbike', weightG: 120, defaultBag: 'seat', ownership: 'owned', role: 'optional' },
  { id: 'BK01', name: 'Quad Lock mount', category: 'bike', defaultBag: 'mounted', ownership: 'owned' },
  { id: 'KL01', name: 'Bib shorts', category: 'onbike', role: 'worn', defaultBag: 'body', ownership: 'owned' },
  { id: 'OB01', name: 'Zip-off trousers', category: 'offbike', ownership: 'owned' },
];
const file = {
  app: 'pack-generator',
  kind: 'favorites',
  list: { key: FAVORITES, name: FAVORITES },
  rows: [
    { de: 'Buff dünn', ids: ['KL15'] },
    { de: 'On shoes', ids: ['OB07'], brand: 'On', note: 'Not for racing' },
    { de: 'fleece gilet', find: 'fleece gilet', item: { name: 'Fleece gilet', category: 'offbike' } },
    { de: 'Socken Nike', item: { name: 'Socks (Nike)', category: 'offbike', defaultBag: 'seat' } },
    { de: 'quadlock on stem', ids: ['BK01'] },
    { de: 'Bib', ids: ['KL01'] },
  ],
};
const NOW = '2026-10-05T10:00:00.000Z';

describe('favourites list', () => {
  it('recognises the file', () => {
    expect(isFavoritesFile(file)).toBe(true);
    expect(isFavoritesFile({ app: 'pack-generator', tables: {} })).toBe(false);
  });

  it('stars the matching items without touching their weights', () => {
    const p = planFavorites(file, items, NOW);
    const buff = p.updates.find((u) => u.id === 'KL15');
    expect(buff.changes).toEqual({ favorite: true, lists: [FAVORITES] });
    // The brand is filled only when it was empty, the note is kept.
    expect(p.updates.find((u) => u.id === 'OB07').changes).toMatchObject({ brand: 'On', favNote: 'Not for racing' });
  });

  it('finds an item by its words before adding a new one', () => {
    const p = planFavorites(file, items, NOW);
    expect(p.rows.find((r) => r.de === 'fleece gilet')).toEqual({ de: 'fleece gilet', ids: ['KL13'], added: false });
    expect(p.adds.map((a) => [a.id, a.name, a.favorite])).toEqual([['OB08', 'Socks (Nike)', true]]);
  });

  it('applied twice gives the same result', () => {
    const p = planFavorites(file, items, NOW);
    const after = items.map((i) => ({ ...i, ...(p.updates.find((u) => u.id === i.id)?.changes ?? {}) })).concat(p.adds);
    const again = planFavorites(file, after, NOW);
    expect(again.adds).toEqual([]);
    expect(again.updates.find((u) => u.id === 'KL15').changes.lists).toEqual([FAVORITES]);
    expect(again.rows.find((r) => r.de === 'Socken Nike').ids).toEqual(['OB08']);
  });

  it('makes a template and a filter of the favourites', () => {
    const p = planFavorites(file, items, NOW);
    const after = items.map((i) => ({ ...i, ...(p.updates.find((u) => u.id === i.id)?.changes ?? {}) })).concat(p.adds);
    const t = favoritesTemplate(after, { now: NOW });
    expect(t.name).toBe(FAVORITES);
    expect(Object.fromEntries(t.entries.map((e) => [e.itemId, e.slot]))).toEqual({ KL15: 'top', OB07: 'seat', KL13: 'seat', BK01: 'mounted', KL01: 'body', OB08: 'seat' });
    expect(after.filter((i) => matches(i, { fav: true })).map((i) => i.id)).not.toContain('OB01');
  });
});
