// «Sammel-Wand» (Neuer Schwung, Idee F, Noah 05.11.2026): what the wall shows, pure. Fictional data only.
import { describe, it, expect } from 'vitest';
import { recent, highestPlaces, totals, isEmpty, RECENT_SHOWN } from '../src/lib/sammlung/wand.js';
import { bookOf } from '../src/lib/gipfelbuch.js';

const stamps = [
  { id: 's1', tripId: 't1', place: 'Test Pass Loop', date: '2026-10-12', km: 84 },
  { id: 's2', tripId: '', place: 'Seeland Test', date: '2026-09-01', km: null },
];
const passes = [
  { id: 'p1', key: 'furka', name: 'Furka Test', m: 2429, date: '2026-07-04', ref: '' },
  { id: 'p2', key: '', name: 'Col Test', m: null, date: '', ref: '' },
];
const book = bookOf({
  places: [
    { id: 'g1', name: 'Test Horn', sport: 'hike', ele: 3100 },
    { id: 'g2', name: 'Test Joch', sport: 'bike', ele: 2200 },
    { id: 'g3', name: 'Test Halle', sport: 'other', ele: null },
    { id: 'g4', name: 'Test Kreuz', sport: 'bike', ele: 1500 },
  ],
  visits: [
    { id: 'v1', placeId: 'g1', day: '2026-08-20', ref: 'hand' },
    { id: 'v2', placeId: 'g2', day: '2026-10-20', ref: 'hand' },
    { id: 'v3', placeId: 'g3', day: '2026-10-01', ref: 'hand' },
    { id: 'v4', placeId: 'g4', day: '2026-06-01', ref: 'hand' },
  ],
});

describe('Sammel-Wand: Zuletzt dazugekommen', () => {
  it('mixes the shelves, newest first, a thing without a day last', () => {
    const r = recent({ stamps, passes, book }, 20);
    expect(r.map((x) => x.name)).toEqual(['Test Joch', 'Test Pass Loop', 'Test Halle', 'Seeland Test', 'Test Horn', 'Furka Test', 'Test Kreuz', 'Col Test']);
    expect(r[0]).toMatchObject({ kind: 'place', m: 2200, href: '#/flow/gipfelbuch' });
    expect(r[1]).toMatchObject({ kind: 'stamp', href: '#/debrief/tourenpass' });
    expect(r.at(-1)).toMatchObject({ kind: 'pass', date: '' });
  });
  it('shows a few, not everything', () => {
    expect(recent({ stamps, passes, book })).toHaveLength(RECENT_SHOWN);
    expect(recent({}, 5)).toEqual([]);
  });
});

describe('Sammel-Wand: Gipfelbuch-Regal', () => {
  it('lists the highest places with a height, at most three', () => {
    const top = highestPlaces(book);
    expect(top.map((x) => x.name)).toEqual(['Test Horn', 'Test Joch', 'Test Kreuz']);
    expect(top[0]).toMatchObject({ ele: 3100, last: '2026-08-20', n: 1 });
  });
  it('is empty for an empty book', () => {
    expect(highestPlaces(bookOf(null))).toEqual([]);
  });
});

describe('Sammel-Wand: Zahlen und leere Wand', () => {
  it('counts every shelf; Neuland stays null while it is counted', () => {
    expect(totals({ stamps, passes, book, neuland: 14, stars: 2 })).toEqual({ stamps: 2, passes: 2, places: 4, neuland: 14, stars: 2 });
    expect(totals({ stamps, passes, book }).neuland).toBeNull();
  });
  it('is empty only when no shelf has anything', () => {
    expect(isEmpty(totals({ book: bookOf(null), neuland: 0 }))).toBe(true);
    expect(isEmpty(totals({ book: bookOf(null), neuland: null }))).toBe(true);
    expect(isEmpty(totals({ stamps, neuland: 0 }))).toBe(false);
    expect(isEmpty(totals({ neuland: 3 }))).toBe(false);
    expect(isEmpty(totals({ stars: 1, neuland: 0 }))).toBe(false);
  });
  it('has no goal: no percentage and no «missing» field', () => {
    expect(Object.keys(totals({}))).toEqual(['stamps', 'passes', 'places', 'neuland', 'stars']);
  });
});
