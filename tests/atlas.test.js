// «Rennen aus dem Rennatlas» (Noah 24.11.2026 «a»): read a list of races, say what is known, build the record.
import { describe, it, expect } from 'vitest';
import { parseAtlas, rowOf, daysOf, isKnown, preselected, atlasOf, atlasLine, keyOf, MAX_ROWS } from '../src/lib/race/atlas.js';

const LIST = [
  { name: 'Alpenrunde', date: '2027-06-12', days: '6–10', km: 1000, hm: 30000, city: 'Beispielstadt', land: 'Schweiz', surface: 'MTB / Offroad', url: 'https://example.org/alpenrunde', registered: true, checked: '2026-11-24', source: 'Veranstalter' },
  { name: 'Seeweg', date: '2027-05-01', days: 2, km: 303, fav: true },
  { name: 'Ohne Datum', days: '3–5' },
  { km: 5 },
];

describe('reading the file', () => {
  it('takes a list or an object with races, sorts by day and drops rows without a name', () => {
    for (const raw of [JSON.stringify(LIST), JSON.stringify({ format: 'rennatlas', races: LIST })]) {
      const got = parseAtlas(raw);
      expect(got.error).toBe('');
      expect(got.rows.map((r) => r.name)).toEqual(['Seeweg', 'Alpenrunde', 'Ohne Datum']);
    }
  });
  it('says what is wrong with a file', () => {
    expect(parseAtlas('not json').error).toBe('unreadable');
    expect(parseAtlas('{"x":1}').error).toBe('format');
    expect(parseAtlas('[]').error).toBe('empty');
    expect(parseAtlas('[{"km":3}]').error).toBe('empty');
    expect(parseAtlas(undefined).error).toBe('unreadable');
  });
  it('counts a race twice in the file once', () => {
    const got = parseAtlas(JSON.stringify([{ name: 'A', date: '2027-01-01' }, { name: ' a ', date: '2027-01-01' }, { name: 'A', date: '2027-02-01' }]));
    expect(got.rows).toHaveLength(2);
  });
  it('reads at most MAX_ROWS rows', () => {
    const many = Array.from({ length: MAX_ROWS + 20 }, (_, i) => ({ name: `R${i}` }));
    expect(parseAtlas(JSON.stringify(many)).rows).toHaveLength(MAX_ROWS);
  });
  it('cleans every field', () => {
    const r = rowOf({ name: '  X  ', date: '27.6.2027', days: '6–10', km: '1000', hm: -4, url: 'http://insecure.example', registered: 'yes', fav: true });
    expect(r).toMatchObject({ name: 'X', date: '', days: 10, daysText: '6–10', km: 1000, hm: null, url: '', registered: false, fav: true });
    expect(rowOf({ name: 'Y', url: 'https://example.org/y' }).url).toBe('https://example.org/y');
    expect(rowOf(null)).toBeNull();
    expect(rowOf('x')).toBeNull();
  });
});

describe('days, known races, preselection', () => {
  it('plans the longest time of a range', () => {
    expect(daysOf('6–10')).toBe(10);
    expect(daysOf(3)).toBe(3);
    expect(daysOf('')).toBe(1);
    expect(daysOf('99')).toBe(40);
  });
  it('knows a race by name and start day', () => {
    const row = rowOf({ name: 'Alpenrunde', date: '2027-06-12' });
    expect(isKnown(row, [{ title: ' alpenrunde ', startDate: '2027-06-12' }])).toBe(true);
    expect(isKnown(row, [{ title: 'Alpenrunde', startDate: '2028-06-12' }])).toBe(false);
    expect(isKnown(rowOf({ name: 'Ohne' }), [{ title: 'Ohne', startDate: null }])).toBe(true);
    expect(keyOf(row)).toBe('alpenrunde|2027-06-12');
  });
  it('turns on the registered races and the favourites', () => {
    expect(preselected(rowOf({ name: 'a', registered: true }))).toBe(true);
    expect(preselected(rowOf({ name: 'a', fav: true }))).toBe(true);
    expect(preselected(rowOf({ name: 'a' }))).toBe(false);
  });
});

describe('what stays on the race', () => {
  it('keeps the small facts and the line under the title', () => {
    const a = atlasOf(rowOf(LIST[0]));
    expect(a).toMatchObject({ km: 1000, hm: 30000, land: 'Schweiz', url: 'https://example.org/alpenrunde', registered: true, checked: '2026-11-24' });
    expect(atlasLine(a)).toEqual({ km: 1000, hm: 30000 });
    expect(atlasLine({ km: null, hm: null })).toBeNull();
    expect(atlasLine(undefined)).toBeNull();
  });
});
