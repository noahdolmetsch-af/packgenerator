// «Rennen aus dem Rennatlas» (Noah 24.11.2026 «a»): read a list of races, say what is known, build the record.
import { describe, it, expect } from 'vitest';
import { hmApprox, hmBasis, parseAtlas, rowOf, daysOf, isKnown, preselected, atlasOf, atlasLine, keyOf, MAX_ROWS } from '../src/lib/race/atlas.js';

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

describe('the new fields of the list', () => {
  it('keeps support, deadline, last edition and the two links, and drops a link that is not https', () => {
    const r = rowOf({ name: 'A', support: 'Selbstversorgt', deadline: 'Entfällt', edition: 'Vergangen', date2026: '02.08.2026', urlLast: 'https://example.org/last', urlMore: 'http://example.org/more' });
    expect(r).toMatchObject({ support: 'Selbstversorgt', deadline: 'Entfällt', edition: 'Vergangen', date2026: '02.08.2026', urlLast: 'https://example.org/last', urlMore: '' });
    expect(rowOf({ name: 'B' })).toMatchObject({ support: '', deadline: '', edition: '', date2026: '', hmNote: '', urlLast: '', urlMore: '' });
  });
  it('says an estimated climb is an estimate and why', () => {
    const est = rowOf({ name: 'C', hm: 15000, hmNote: 'ca., Vorjahr (2024, 671 km)' });
    expect(hmApprox(est)).toBe(true);
    expect(hmBasis(est)).toBe('Vorjahr (2024, 671 km)');
    const exact = rowOf({ name: 'D', hm: 2300 });
    expect(hmApprox(exact)).toBe(false);
    expect(hmBasis(exact)).toBe('');
    expect(hmApprox(rowOf({ name: 'E', hmNote: 'ca., Vorjahr' }))).toBe(false);
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

import { rangeOf, overlaps, byMonth, yearPos, packLanes, yearsOf } from '../src/lib/race/atlas.js';

describe('season', () => {
  const A = { name: 'A', date: '2027-06-12', days: 3 };
  const B = { name: 'B', date: '2027-06-14', days: 1 };
  const C = { name: 'C', date: '2027-06-15', days: 2 };
  it('gives the days of a race and finds races on the same days', () => {
    expect(rangeOf(A)).toEqual({ from: '2027-06-12', to: '2027-06-14' });
    expect(rangeOf({ name: 'x', days: 2 })).toBeNull();
    const o = overlaps([A, B, C, { name: 'D' }]);
    expect(o[keyOf(A)]).toEqual(['B']);
    expect(o[keyOf(B)]).toEqual(['A']);
    expect(o[keyOf(C)]).toBeUndefined();
  });
  it('groups by month and puts the undated last', () => {
    const g = byMonth([{ name: 'z' }, C, { name: 'J', date: '2027-01-02' }, A]);
    expect(g.map((x) => x.key)).toEqual(['2027-01', '2027-06', '']);
    expect(g[1].rows.map((r) => r.name)).toEqual(['C', 'A']);
  });
  it('places a day in its year and says nothing for another year', () => {
    expect(yearPos('2027-01-01', 2027)).toBe(0);
    expect(Math.round(yearPos('2027-07-02', 2027))).toBe(50);
    expect(yearPos('2026-12-31', 2027)).toBeNull();
    expect(yearsOf([{ name: 'a', date: '2028-01-01' }, A, { name: 'n' }])).toEqual(['2027', '2028']);
  });
  it('packs bars on lanes without touching', () => {
    expect(packLanes([{ a: 0, b: 20 }, { a: 10, b: 30 }, { a: 25, b: 40 }, { a: 50, b: 60 }])).toEqual([0, 1, 0, 0]);
    expect(packLanes([])).toEqual([]);
  });
});
