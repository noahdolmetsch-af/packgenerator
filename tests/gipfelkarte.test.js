// Gipfel-Karte mit Lücken (Noah 24.11.2026 «alle 1-5 zusammen»): rows, gaps near home, tours toward a place. Fictional places.
import { describe, it, expect } from 'vitest';
import * as M from '../src/lib/gipfelkarte.js';
import { emptyBook, addPlace } from '../src/lib/gipfelbuch.js';

const cat = [
  { key: 'peak:a', name: 'Ahorn', m: 3000, lat: 46.0, lon: 8.0, kind: 'peak', coll: ['vier'] },
  { key: 'peak:b', name: 'Behorn', m: 2000, lat: 46.1, lon: 8.1, kind: 'peak', coll: [] },
  { key: 'pass:c', name: 'Cepass', m: 2100, lat: 46.9, lon: 8.9, kind: 'pass', coll: ['paesse2000'] },
  { key: 'pass:d', name: 'Depass', m: 1500, lat: 47.0, lon: 9.0, kind: 'pass', coll: [] },
];

describe('the rows of the map', () => {
  it('marks what you have, the nearest gaps and the rest', () => {
    const book = addPlace(emptyBook(), { name: 'Ahorn', sport: 'hike', ele: 3000 }, { day: '2026-07-01' });
    const { rows, have, total } = M.mapRows(cat, book, { lat: 46.91, lon: 8.91 }, { n: 1 });
    expect(rows.map((r) => [r.it.name, r.st])).toEqual([['Ahorn', 'have'], ['Behorn', 'gap'], ['Cepass', 'near'], ['Depass', 'gap']]);
    expect(have).toBe(1);
    expect(total).toBe(4);
    expect(rows[2].km).toBeLessThan(10);
  });
  it('takes own places with a position along, and has no «near» without a home', () => {
    const book = addPlace(emptyBook(), { name: 'Eigener Hügel', sport: 'hike', lat: 46.3, lon: 8.3 }, { day: '2026-07-01' });
    const { rows } = M.mapRows(cat, book, null);
    expect(rows.at(-1)).toMatchObject({ id: expect.stringMatching(/^own:/), st: 'have', own: true });
    expect(rows.filter((r) => r.st === 'near')).toEqual([]);
    expect(M.gapsList(rows, 2).map((r) => r.it.name)).toEqual(['Ahorn', 'Cepass']); // highest first without a home
  });
  it('lists the gaps nearest first with a home', () => {
    const { rows } = M.mapRows(cat, emptyBook(), { lat: 47.0, lon: 9.0 });
    expect(M.gapsList(rows, 2).map((r) => r.it.name)).toEqual(['Depass', 'Cepass']);
  });
  it('filters by kind and by collection', () => {
    expect(M.filterCatalog(cat, 'pass').map((c) => c.name)).toEqual(['Cepass', 'Depass']);
    expect(M.filterCatalog(cat, 'vier').map((c) => c.name)).toEqual(['Ahorn']);
    expect(M.filterCatalog(cat, 'all')).toBe(cat);
  });
});

describe('tours toward a place', () => {
  const tours = [
    { id: 't1', title: 'Weit', km: 30, line: [[46.0, 8.1], [46.0, 8.2]] },
    { id: 't2', title: 'Nah', km: 20, line: [[45.99, 7.99], [46.0, 8.0], [46.01, 8.01]] },
    { id: 't3', title: 'Auch nah', km: 10, line: [[46.0, 7.99], [46.0, 8.01]] },
  ];
  it('finds the tours whose line comes close, the closest first', () => {
    const r = M.toursToward(cat[0], tours);
    expect(r.map((x) => x.tour.id)).toEqual(['t3', 't2']);
    expect(r[0].away).toBeLessThan(0.1);
    expect(M.toursToward(cat[1], tours)).toEqual([]);
    expect(M.toursToward(cat[0], null)).toEqual([]);
  });
});
