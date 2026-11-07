// «Eine Fundliste» (Träume und Neuland N10): one list of finds for Neuland, the summit book and «Neuland des Jahres». Fictional data only.
import { describe, it, expect } from 'vitest';
import { visitLines, findsOf, SAME_PLACE_KM } from '../src/lib/neuland/funde.js';
import { neulandYear, withFinds } from '../src/lib/wohl.js';
import { linesToTracks, detect } from '../src/lib/neuland/neuland.js';

const P = 'test_data_gtp_';
const book = {
  places: [
    { id: 'p1', name: `${P}Hügel`, sport: 'hike', lat: 47.1, lon: 8.2 },
    { id: 'p2', name: `${P}Halle`, sport: 'other', lat: null, lon: null },
    { id: 'p3', name: `${P}Nahe Passhöhe`, sport: 'bike', lat: 46.5, lon: 8.0 },
    { id: 'p4', name: '', sport: 'hike', lat: 47, lon: 8 },
  ],
  visits: [
    { id: 'v1', placeId: 'p1', day: '2026-06-01', ref: 'hand', hm: null },
    { id: 'v2', placeId: 'p1', day: '2025-05-01', ref: 'hand', hm: null },
    { id: 'v3', placeId: 'p2', day: '2026-02-03', ref: 'hand', hm: null },
    { id: 'v4', placeId: 'p3', day: '2026-07-04', ref: 'hand', hm: null },
    { id: 'v5', placeId: 'p4', day: '2026-07-04', ref: 'hand', hm: null },
    { id: 'v6', placeId: 'p1', day: 'bad', ref: 'hand', hm: null },
  ],
  dismissed: [],
};
const result = {
  collections: [
    { id: 'u-pass', on: true, builtIn: false, name: `${P}Pässe`, items: [{ id: 'a', name: `${P}Passhöhe`, lat: 46.5004, lon: 8.0004 }, { id: 'b', name: `${P}Weit weg`, lat: 46.9, lon: 8.9 }], visited: new Map([['a', { day: '2026-07-04' }]]) },
    { id: 'u-off', on: false, builtIn: false, name: `${P}Aus`, items: [{ id: 'c', name: `${P}Aus`, lat: 47.1, lon: 8.2 }], visited: new Map([['c', { day: '2026-06-01' }]]) },
  ],
};

describe('Fundliste (N10)', () => {
  it('visits of places with coordinates become one-point lines', () => {
    const lines = visitLines(book);
    expect(lines.map((l) => l.day).sort()).toEqual(['2025-05-01', '2026-06-01', '2026-07-04', '2026-07-04']);
    expect(lines.every((l) => l.pts.length === 1 && l.source === 'gipfelbuch')).toBe(true);
    expect(visitLines(null)).toEqual([]);
  });
  it('a summit-book visit ticks a Neuland point on that day', () => {
    const items = [{ id: 'a', name: 'A', lat: 46.5004, lon: 8.0004 }, { id: 'b', name: 'B', lat: 46.9, lon: 8.9 }];
    const found = detect([{ id: 'u-x', kind: 'point', radius: 0.6, items }], linesToTracks(visitLines(book), '2026-11-07'));
    expect(Object.keys(found['u-x'])).toEqual(['a']);
    expect(found['u-x'].a.day).toBe('2026-07-04');
  });
  it('lists the first reach of each place, newest first, without doubles', () => {
    const list = findsOf({ result, book });
    // p3 lies next to the reached Neuland point (one place), p4 has no name, the switched-off collection is not read
    expect(list.map((x) => [x.from, x.name, x.day])).toEqual([
      ['neuland', `${P}Passhöhe`, '2026-07-04'],
      ['gipfelbuch', `${P}Halle`, '2026-02-03'],
      ['gipfelbuch', `${P}Hügel`, '2025-05-01'],
    ]);
  });
  it('a year picks only its finds', () => {
    expect(findsOf({ result, book, year: 2026 }).map((x) => x.name)).toEqual([`${P}Passhöhe`, `${P}Halle`]);
    expect(findsOf({ result, book, year: 2025 }).map((x) => x.name)).toEqual([`${P}Hügel`]);
    expect(findsOf({ result: null, book: null })).toEqual([]);
  });
  it('without coordinates a place is listed even when Neuland has points', () => {
    expect(findsOf({ result, book, year: 2026 }).some((x) => x.name === `${P}Halle`)).toBe(true);
    expect(SAME_PLACE_KM).toBe(0.6);
  });
  it('the Neuland of the year gets the finds, a name already there is not added twice', () => {
    const own = [{ id: 'o1', name: `${P}Halle`, day: '2026-03-01' }, { id: 'o2', name: `${P}Eigener Fund`, day: '2026-04-01' }];
    const finds = findsOf({ result, book });
    const y = neulandYear(own, [], 2026, finds);
    expect(y.map((x) => x.name)).toEqual([`${P}Passhöhe`, `${P}Eigener Fund`, `${P}Halle`]);
    expect(y.find((x) => x.name === `${P}Halle`).id).toBe('o1');
    expect(neulandYear(own, [], 2026).map((x) => x.name)).toEqual([`${P}Eigener Fund`, `${P}Halle`]);
    expect(neulandYear(own, [], null, finds)).toHaveLength(4);
    expect(withFinds([], [{ id: 'f', name: ' A  b ', day: '2026-01-01' }, { id: 'g', name: 'a b', day: '2026-01-02' }])).toHaveLength(1);
  });
});
