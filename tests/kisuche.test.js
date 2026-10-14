// «Kluge Suche» (Noah 14.10.2026): similar words, typos, filters and the text for Claude. Fictional data.
import { describe, it, expect } from 'vitest';
import { parseFilters, passes, distance, closest, smartSearch, related, claudeText, countRelated, synonymsOf, keywords } from '../src/lib/kisuche/smart.js';

const P = 'test_data_gtp_';
const items = [
  { id: 'a', name: `${P} Hardshell jacket`, nameDe: `${P} Hardshell Jacke`, weightG: 260, tempMin: 0, tempMax: 15 },
  { id: 'b', name: `${P} Winter gloves`, nameDe: `${P} Winterhandschuhe`, weightG: 110, tempMin: -10, tempMax: 5 },
  { id: 'c', name: `${P} Sleeping bag`, nameDe: `${P} Schlafsack`, weightG: 700, tempMin: -5, tempMax: 10 },
  { id: 'd', name: `${P} Rear light`, nameDe: `${P} Rücklicht`, weightG: 30 },
  { id: 'e', name: `${P} Old jacket`, weightG: 90, ownership: 'gone' },
];
const trips = [{ id: 't1', title: `${P} Jura im Regen`, startDate: '2026-09-12', days: 2, bike: `${P} Spark` }];
const learnings = [{ id: 'l1', rule: `${P} Bei Regen die Hardshell oben in die Satteltasche`, action: '', itemIds: ['a'] }, { id: 'l2', rule: `${P} Kette nach Regen ölen`, archived: true }];
const data = { items, trips, templates: [], bikes: [], notes: [], events: [] };
const titles = (r) => r.groups.flatMap((g) => g.rows.map((x) => x.title));

describe('parseFilters', () => {
  it('reads weight, temperature and kind words', () => {
    const f = parseFilters('Material unter 200 g');
    expect(f.weight).toEqual({ max: 200 });
    expect([...f.kinds]).toEqual(['gear']);
    expect(f.rest).toBe('');
    expect(parseFilters('über 1,5 kg').weight).toEqual({ min: 1500 });
    expect(parseFilters('schlafsack bis -5 °C').temp).toEqual({ max: -5 });
    expect(parseFilters('jacke unter 5°C').temp).toEqual({ max: 5 });
    expect(parseFilters('Touren Jura').rest).toBe('jura');
  });
  it('a kind word alone stays a normal search', () => {
    const f = parseFilters('touren');
    expect(f.rest).toBe('touren');
    expect(f.kinds.size).toBe(0);
  });
  it('passes checks only known values', () => {
    expect(passes(items[0], { weight: { max: 300 } })).toBe(true);
    expect(passes({ id: 'x' }, { weight: { max: 300 } })).toBe(false);
    expect(passes(items[1], { temp: { max: 0 } })).toBe(true);
    expect(passes(items[0], { temp: { max: -1 } })).toBe(false);
  });
});

describe('typos and similar words', () => {
  it('distance and closest', () => {
    expect(distance('regenjake', 'regenjacke')).toBe(1);
    expect(distance('abc', 'xyzxyz')).toBeGreaterThan(2);
    const vocab = new Map([['schlafsack', 'schlafsack'], ['hardshell', 'hardshell']]);
    expect(closest('schlafsak', vocab)).toBe('schlafsack');
    expect(closest('zelt', vocab)).toBe(null);
  });
  it('synonyms are found with or without umlauts', () => {
    expect(synonymsOf('Regenjacke')).toContain('hardshell');
    expect(synonymsOf('muetze')).toContain('beanie');
  });
  it('«regenjacke» finds the Hardshell and says so', () => {
    const r = smartSearch('regenjacke', data);
    expect(titles(r)).toContain(`${P} Hardshell jacket`);
    expect(r.also).toContain('hardshell');
  });
  it('a typo finds the right thing', () => {
    const r = smartSearch('schlafsak', data);
    expect(titles(r)).toContain(`${P} Sleeping bag`);
    expect(r.fixed).toBe('schlafsack');
  });
  it('umlauts stay as typed (no folding of the search)', () => {
    expect(titles(smartSearch('rücklicht', data))).toContain(`${P} Rear light`);
  });
  it('a filter without words lists the gear, lightest first, without gone items', () => {
    const r = smartSearch('material unter 200 g', data);
    expect(r.groups.map((g) => g.kind)).toEqual(['gear']);
    expect(titles(r)).toEqual([`${P} Rear light`, `${P} Winter gloves`]);
  });
  it('a kind word narrows the groups', () => {
    const r = smartSearch('touren jura', data);
    expect(r.groups.map((g) => g.kind)).toEqual(['trip']);
  });
});

describe('the text for Claude', () => {
  it('takes only what fits, never archived learnings', () => {
    const r = related('Was nehme ich bei Regen mit?', { ...data, learnings });
    expect(r.items.map((i) => i.id)).toEqual(['a']); // the fitting learning names the Hardshell
    expect(r.trips.map((x) => x.id)).toEqual(['t1']);
    expect(r.learnings.map((x) => x.id)).toEqual(['l1']);
    const text = claudeText('Was nehme ich bei Regen mit?', r);
    expect(text).toContain('My question: Was nehme ich bei Regen mit?');
    expect(text).toContain(`${P} Jura im Regen · 2026-09-12`);
    expect(text).not.toContain('ölen');
  });
  it('a temperature question takes the items that are warm enough', () => {
    const r = related('Was brauche ich unter 0 °C?', { ...data, learnings });
    expect(r.items.map((i) => i.id).sort()).toEqual(['a', 'b', 'c']);
    expect(claudeText('x', r)).toContain('-10 bis 5 °C');
  });
  it('nothing fits: only the question', () => {
    const r = related('Wie spät ist es?', { ...data, learnings });
    expect(countRelated(r)).toBe(0);
    expect(claudeText('Wie spät ist es?', r)).toContain('(nothing in the app fits this question)');
  });
  it('keywords drop the small words', () => {
    expect(keywords('Was nehme ich bei Regen mit?').map((k) => k[0])).toEqual(['regen']);
  });
});
