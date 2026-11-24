// «Suche am Ort» (Warteliste 1, V2; Noah «2a», «3b»): rules in src/lib/suche/ort.js
import { describe, it, expect } from 'vitest';
import { hereKind, placeRows, featuresOf, tripRows, filterRows, sumOf, choicesOf, hitOf } from '../src/lib/suche/ort.js';

const rides = [
  { id: 1, name: 'Jura-Runde', day: '2026-10-03', km: 82, src: 'Strava', bike: 'Strassenvelo' },
  { id: 2, name: 'Feierabend am See', day: '2026-09-02', km: 28, src: 'file', bike: 'Strassenvelo' },
  { id: 3, name: 'Alpenrunde Süd', day: '2025-08-14', km: 318, src: 'hand', bike: 'Gravel Blau' },
];
const trips = [{ id: 'x', title: 'Alpenrunde Nord', startDate: '2026-08-14', bike: 'Gravel Blau' }];

describe('hereKind', () => {
  it('knows the three pages and nothing else', () => {
    expect(hereKind('#/me')).toBe('me');
    expect(hereKind('#/trips?tab=x')).toBe('trips');
    expect(hereKind('#/auswerten/')).toBe('auswerten');
    expect(hereKind('#/me/data')).toBe(null);
    expect(hereKind('#/')).toBe(null);
  });
});

describe('placeRows', () => {
  it('has functions under Ich and under Auswerten', () => {
    expect(featuresOf('me').length).toBeGreaterThan(10);
    expect(featuresOf('auswerten').length).toBeGreaterThan(0);
  });
  it('finds only functions of the place', () => {
    const mine = new Set(featuresOf('me').map((f) => f.id));
    for (const r of placeRows('backup', 'me')) expect(mine.has(r.featureId)).toBe(true);
    expect(placeRows('x', 'me')).toEqual([]);
  });
});

describe('trip rows', () => {
  const rows = tripRows({ rides, trips });
  it('lists rides and trips, newest first', () => {
    expect(rows.map((r) => r.title)).toEqual(['Jura-Runde', 'Feierabend am See', 'Alpenrunde Nord', 'Alpenrunde Süd']);
  });
  it('finds by words, in any case, with umlauts', () => {
    expect(filterRows(rows, 'alpenrunde').length).toBe(2);
    expect(filterRows(rows, 'ALPENRUNDE süd').length).toBe(1);
  });
  it('narrows by year, bike, kind and distance, and sums', () => {
    expect(filterRows(rows, '', { year: '2026' }).length).toBe(3);
    expect(filterRows(rows, '', { bike: 'Gravel Blau' }).length).toBe(2);
    expect(filterRows(rows, '', { art: 'strava' }).length).toBe(1);
    expect(filterRows(rows, '', { dist: 'long' }).map((r) => r.title)).toEqual(['Jura-Runde', 'Alpenrunde Süd']);
    expect(sumOf(filterRows(rows, '', { year: '2026', bike: 'Strassenvelo' }))).toEqual({ n: 2, km: 110 });
  });
  it('offers the choices that exist', () => {
    const c = choicesOf(rows);
    expect(c.year).toEqual(['2026', '2025']);
    expect(c.bike).toEqual(['Gravel Blau', 'Strassenvelo']);
    expect(c.art).toContain('strava');
  });
  it('hitOf without words lets everything through', () => {
    expect(hitOf('')('x')).toBe(true);
  });
});
