// «Frage deine Daten» (Noah 03.11.2026, Idee 7): questions about the training. Fictional data only.
import './setup/de.js';
import { describe, it, expect } from 'vitest';
import { answerFor, EXAMPLES } from '../src/lib/assistent/answers.js';
import { zoneIn, weeksIn, efficientRides, compareWeeks, sumsOf, trainAnswer } from '../src/lib/assistent/trainfragen.js';
import { isSearchChord } from '../src/lib/nav/keys.js';
import de from '../src/lib/i18n/de/index.js';

const BOUNDS = [114, 133, 152, 171]; // Z1 < 114 ≤ Z2 < 133 …
const today = '2026-11-03';
const addDays = (iso, d) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
const ride = (id, ago, over = {}) => ({ id, day: addDays(today, -ago), name: `Runde ${id}`, kind: 'bike', wDevice: true, wAvg: 150, hrAvg: 120, movingS: 3600, hm: 100, km: 30, hist: { 120: 3000, 140: 600 }, ...over });
const acts = [
  ride('a', 3, { wAvg: 160, hrAvg: 118 }), // Z2, 1.36
  ride('b', 10, { wAvg: 150, hrAvg: 125 }), // Z2, 1.20
  ride('c', 20, { wAvg: 190, hrAvg: 128 }), // Z2, 1.48
  ride('d', 30, { wAvg: 200, hrAvg: 150, hist: { 150: 3000 } }), // Z3
  ride('e', 5, { wDevice: false }), // no power meter
  ride('f', 6, { movingS: 600 }), // too short
  ride('g', 7, { hidden: true }),
  ride('h', 8, { hist: null, hrAvg: 125, wAvg: 140 }), // no histogram: Z2 by mean pulse
];

describe('what the question names', () => {
  it('finds the zone and the weeks', () => {
    expect(zoneIn('zeig mir meine effizientesten z2-fahrten')).toBe(2);
    expect(zoneIn('effizienteste zone 3 fahrten')).toBe(3);
    expect(zoneIn('effizienteste fahrten')).toBeNull();
    expect(zoneIn('wz22 komisch')).toBeNull();
    expect(weeksIn('vergleiche meine letzten vier wochen')).toBe(4);
    expect(weeksIn('compare my last 6 weeks')).toBe(6);
    expect(weeksIn('vergleiche die letzten 40 wochen')).toBeNull();
    expect(weeksIn('vergleiche mein jahr')).toBeNull();
  });
});

describe('efficientRides', () => {
  it('ranks Z2 rides by watts per heartbeat, with the right ones left out', () => {
    const { rows, total } = efficientRides(acts, BOUNDS, 2);
    expect(rows.map((r) => r.id)).toEqual(['c', 'a', 'b', 'h']);
    expect(total).toBe(4);
    expect(rows[0].eff).toBe(1.48);
    expect(rows.find((r) => r.id === 'h').approx).toBe(true);
    expect(rows.find((r) => r.id === 'a').approx).toBe(false);
  });
  it('without a zone every ride with power and pulse counts; the top is cut', () => {
    const { rows, total } = efficientRides(acts, BOUNDS, null, 2);
    expect(rows).toHaveLength(2);
    expect(total).toBe(5);
  });
});

describe('compareWeeks', () => {
  it('sums the last N weeks against the N before', () => {
    const list = [ride('x', 2, { km: 50, hm: 500, movingS: 7200 }), ride('y', 15, { km: 20, hm: 100, movingS: 3600 }), ride('z', 40, {})];
    const c = compareWeeks(list, today, 2);
    expect(c.now).toMatchObject({ from: '2026-10-21', to: today, n: 1, km: 50, hm: 500, s: 7200 });
    expect(c.prev).toMatchObject({ from: '2026-10-07', to: '2026-10-20', n: 1, km: 20 });
    expect(sumsOf(list, '2026-01-01', today).n).toBe(3);
  });
});

describe('answers', () => {
  it('lists the rides with a link to each', () => {
    const a = trainAnswer('zeig mir meine effizientesten z2-fahrten', { acts, bounds: BOUNDS, today });
    expect(a.kind).toBe('efficient');
    expect(a.rows).toHaveLength(4);
    expect(a.rows[0].href).toBe('#/flow/training/a/c');
    expect(a.title).toContain('Z2');
  });
  it('says what is missing instead of guessing', () => {
    const a = trainAnswer('effizienteste z2 fahrten', { acts: [], bounds: BOUNDS, today });
    expect(a.rows).toEqual([]);
    expect(a.lines[0]).toMatch(/power meter|Leistungsmesser/);
  });
  it('compares the weeks, and answerFor reaches both rules first', () => {
    const c = answerFor('Vergleiche meine letzten vier Wochen', { today, acts, bounds: BOUNDS });
    expect(c.kind).toBe('compare');
    expect(c.lines.length).toBeGreaterThan(3);
    expect(answerFor('Zeig mir meine effizientesten Z2-Fahrten', { today, acts, bounds: BOUNDS }).kind).toBe('efficient');
    // the other rules still work, and a question without acts is not taken by the new rules
    expect(trainAnswer('wie viele km diesen monat', { acts, bounds: BOUNDS, today })).toBeNull();
    expect(answerFor('Vergleiche meine letzten vier Wochen', { today })).toBeNull();
  });
  it('the examples have a German text', () => {
    for (const e of EXAMPLES) expect(de[e], e).toBeTruthy();
  });
});

describe('⌘ K', () => {
  const e = (o) => ({ key: 'k', metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...o });
  it('is the pure chord only', () => {
    expect(isSearchChord(e({ metaKey: true }))).toBe(true);
    expect(isSearchChord(e({ ctrlKey: true, key: 'K' }))).toBe(true);
    expect(isSearchChord(e({}))).toBe(false);
    expect(isSearchChord(e({ metaKey: true, shiftKey: true }))).toBe(false);
    expect(isSearchChord(e({ ctrlKey: true, key: 'j' }))).toBe(false);
  });
});
