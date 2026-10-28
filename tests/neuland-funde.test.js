// «Eine Fundliste» (Träume und Neuland N10): Neuland, Gipfelbuch and «Neuland des Jahres» from one list.
import { describe, it, expect } from 'vitest';
import { bookTracks, findsOfYear, sameName } from '../src/lib/neuland/funde.js';
import { detect, visitedOf, stateOf } from '../src/lib/neuland/neuland.js';
import { computeFrom } from '../src/lib/neuland/store.js';

const P = 'test_data_gtp_';
const BOOK = {
  places: [
    { id: 'p1', name: 'Piz Corvatsch', sport: 'hike', ele: 3451, lat: 46.409, lon: 9.813 },
    { id: 'p2', name: `${P}Halle`, sport: 'other', ele: null, lat: null, lon: null, label: 'Tennis' },
    { id: 'p3', name: `${P}Alter Pass`, sport: 'bike', ele: 1900, lat: 46.5, lon: 8.5 },
  ],
  visits: [
    { id: 'v1', placeId: 'p1', day: '2026-08-02', ref: 'hand' },
    { id: 'v2', placeId: 'p2', day: '2026-03-01', ref: 'hand' },
    { id: 'v3', placeId: 'p3', day: '2025-07-01', ref: 'hand' },
    { id: 'v4', placeId: 'p1', day: '2027-01-01', ref: 'hand' },
  ],
  dismissed: [],
};

describe('one find list', () => {
  it('turns Gipfelbuch visits with a place into one-point tracks', () => {
    const tr = bookTracks(BOOK, '2026-12-31');
    expect(tr).toEqual([
      { day: '2025-07-01', tripId: null, rideId: null, src: 'gipfelbuch', pts: [[46.5, 8.5]] },
      { day: '2026-08-02', tripId: null, rideId: null, src: 'gipfelbuch', pts: [[46.409, 9.813]] },
    ]);
    expect(bookTracks(null)).toEqual([]);
  });

  it('a summit in the Gipfelbuch ticks the peak, marked as from the book', () => {
    const defs = [{ id: 'peaks', kind: 'point', radius: 0.5, items: [{ id: 'k-piz-corvatsch', name: 'Piz Corvatsch', lat: 46.409, lon: 9.813 }] }];
    const found = detect(defs, bookTracks(BOOK, '2026-12-31'));
    expect(found.peaks['k-piz-corvatsch']).toMatchObject({ day: '2026-08-02', book: true });
    // a ride there earlier wins and is not from the book
    const ride = { day: '2026-07-01', tripId: 't1', rideId: null, src: 'trip', pts: [[46.409, 9.813]] };
    expect(detect(defs, [ride, ...bookTracks(BOOK)]).peaks['k-piz-corvatsch'].book).toBeUndefined();
  });

  it('Neuland reads the Gipfelbuch through computeFrom', async () => {
    const raw = { value: { off: ['municipalities', 'cantons', 'countries', 'passes', 'huts', 'lakes'] }, trips: [], rides: [], activities: [], homePlace: null, osm: null, book: BOOK };
    const r = await computeFrom(raw, { today: '2026-12-31', only: ['peaks'] });
    const peaks = r.collections.find((c) => c.id === 'peaks');
    expect(peaks.visited.get('k-piz-corvatsch')).toMatchObject({ day: '2026-08-02', by: 'auto', book: true });
    expect(r.tracks).toEqual([]); // the book is no line for the maps
  });

  it('the year list: own first, then Neuland, then the Gipfelbuch, then evenings, one line per name', () => {
    const items = [
      { id: 'k-piz-corvatsch', name: 'Piz Corvatsch', alt: 3451 },
      { id: 'UR', name: 'Uri' },
    ];
    const visited = new Map([
      ['k-piz-corvatsch', { day: '2026-08-02', by: 'auto', book: true }],
      ['UR', { day: '2026-06-01', by: 'auto' }],
    ]);
    const collections = [
      { id: 'peaks', items: [items[0]], visited },
      { id: 'cantons', items: [items[1]], visited },
    ];
    const own = [
      { id: 'n1', name: 'uri', day: '2026-06-02' }, // the same as the canton
      { id: 'n2', name: `${P}Neues Café`, day: '2026-05-01' },
    ];
    const rows = [{ qid: 'spass.coolstes', day: '2026-04-01', value: 'new', note: `${P}Neues Café` }];
    const list = findsOfYear({ own, rows, collections, book: BOOK, year: 2026 });
    expect(list.map((x) => [x.from, x.name])).toEqual([
      ['neuland', 'Piz Corvatsch · 3451 m'],
      ['own', 'uri'],
      ['own', `${P}Neues Café`],
      ['gipfelbuch', `${P}Halle`],
    ]); // newest first; the evening «Neues Café» is the same as the own entry
    expect(list[0].href).toBe('#/neuland?c=peaks');
    expect(list.find((x) => x.from === 'gipfelbuch').href).toBe('#/flow/gipfelbuch');
    // while Neuland still loads: own, Gipfelbuch (Piz Corvatsch first reached 2026) and evenings
    expect(findsOfYear({ own: [], rows, collections: [], book: BOOK, year: '2026' }).map((x) => x.from)).toEqual(['gipfelbuch', 'evening', 'gipfelbuch']);
  });

  it('compares names without case and accents', () => {
    expect(sameName('Zürich-Höngg')).toBe(sameName('zurich hongg'));
    expect(stateOf(null)).toBeTruthy();
    expect(visitedOf(null, 'peaks', [], {}).size).toBe(0);
  });
});
