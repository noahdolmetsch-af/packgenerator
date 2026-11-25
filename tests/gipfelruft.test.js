// «Welcher Berg ruft?» (Noah 24.11.2026 «alle 1-5 zusammen», idea 5): only on a good day with good weather, from the list, near home,
// not in the book, free of snow. Fictional places.
import { describe, it, expect } from 'vitest';
import { bergRuft, snowFree, ruftSatz, MAX_KM } from '../src/lib/gipfelbuch-ruft.js';
import { emptyBook, addPlace } from '../src/lib/gipfelbuch.js';

const home = { lat: 47.0, lon: 8.0 };
const catalog = [
  { key: 'peak:nah', name: 'Nahhügel', m: 900, lat: 47.05, lon: 8.0, kind: 'peak', coll: [] }, // 5.6 km
  { key: 'peak:hoch', name: 'Hochhorn', m: 2600, lat: 47.3, lon: 8.0, kind: 'peak', coll: [] }, // 33 km
  { key: 'pass:mitte', name: 'Mittelpass', m: 1700, lat: 47.1, lon: 8.1, kind: 'pass', coll: [] }, // ~13 km
  { key: 'peak:fern', name: 'Fernhorn', m: 3000, lat: 46.0, lon: 8.0, kind: 'peak', coll: [] }, // 111 km
];
const dry = { rainMm: 0, tmax: 18 };
const base = { level: 'hard', wx: dry, home, book: emptyBook(), catalog, today: '2026-07-10' };

describe('snow', () => {
  it('knows the months', () => {
    expect(snowFree(7)).toBe(Infinity);
    expect(snowFree(5)).toBe(2300);
    expect(snowFree(11)).toBe(1800);
    expect(snowFree(2)).toBe(1800);
  });
});

describe('welcher Berg ruft', () => {
  it('on a strong day suggests the highest one within reach that is not in the book', () => {
    const r = bergRuft(base);
    expect(r).toMatchObject({ kind: 'hard', href: '#/flow/gipfelbuch/karte' });
    expect(r.it.name).toBe('Hochhorn');
    expect(r.km).toBeLessThan(MAX_KM);
  });
  it('on a normal day suggests the nearest', () => {
    expect(bergRuft({ ...base, level: 'normal' }).it.name).toBe('Nahhügel');
  });
  it('skips what you have, and what is snowed in', () => {
    const book = addPlace(emptyBook(), { name: 'Hochhorn', sport: 'hike', ele: 2600 }, { day: '2026-06-01' });
    expect(bergRuft({ ...base, book }).it.name).toBe('Mittelpass');
    expect(bergRuft({ ...base, today: '2026-11-24' }).it.name).toBe('Mittelpass'); // 2600 m is snowed in, 1700 m is not
    expect(bergRuft({ ...base, today: '2026-05-20' }).it.name).toBe('Mittelpass'); // in May nothing from 2300 m up
  });
  it('says nothing on a tired day, in rain or wind, without weather, home or list', () => {
    expect(bergRuft({ ...base, level: 'easy' })).toBeNull();
    expect(bergRuft({ ...base, level: 'rest' })).toBeNull();
    expect(bergRuft({ ...base, level: null })).toBeNull();
    expect(bergRuft({ ...base, wx: { rainMm: 3 } })).toBeNull();
    expect(bergRuft({ ...base, wx: { rainMm: 0, wind: 50 } })).toBeNull();
    expect(bergRuft({ ...base, wx: null })).toBeNull();
    expect(bergRuft({ ...base, wx: {} })).toBeNull();
    expect(bergRuft({ ...base, home: null })).toBeNull();
    expect(bergRuft({ ...base, catalog: [] })).toBeNull();
  });
  it('says nothing when everything within reach is in the book', () => {
    let book = emptyBook();
    for (const c of catalog.slice(0, 3)) book = addPlace(book, { name: c.name, sport: 'hike', ele: c.m, lat: c.lat, lon: c.lon }, { day: '2026-06-01' });
    expect(bergRuft({ ...base, book })).toBeNull();
  });
  it('writes a sentence for both kinds of day', () => {
    expect(ruftSatz(bergRuft(base))).toContain('Hochhorn');
    expect(ruftSatz(bergRuft({ ...base, level: 'normal' }))).toContain('Nahhügel');
    expect(ruftSatz(null)).toBe('');
  });
});
