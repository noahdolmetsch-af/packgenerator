// «Rennen-Check» (Noah 27.10.2026 «1b 2b»): the sheets, their keys and loading answers. Made-up answers.
import { describe, it, expect } from 'vitest';
import { SHEETS, fieldKeys, valueOf, withValue, answersFrom, filled, takeOver, gramsOf, setupWeight, DAY_BEFORE, dayBeforeDone } from '../src/lib/race/check-lib.js';

describe('the race check', () => {
  it('has six sheets and every key belongs to one of them', () => {
    expect(SHEETS.map((s) => s.id)).toEqual(['ablauf', 'setup', 'liste', 'schlaf', 'nacht', 'vorher']);
    for (const k of Object.keys(fieldKeys())) expect(SHEETS.some((s) => k.startsWith(`${s.id}.`)), k).toBe(true);
  });
  it('starts empty, the ticks with their suggestion', () => {
    expect(valueOf(null, 'ablauf.A')).toBe('');
    expect(valueOf(null, 'ablauf.q.night')).toBe(true);
    expect(valueOf(null, 'liste.0.on')).toBe(true);
  });
  it('keeps a changed field and counts what is filled', () => {
    let c = withValue(null, 'ablauf.race', 'Hill race 300', '2026-10-27T10:00:00Z');
    c = withValue(c, 'ablauf.B', 'Gravel bike');
    expect(valueOf(c, 'ablauf.race')).toBe('Hill race 300');
    expect(filled(c, 'ablauf').done).toBe(2);
    expect(filled(c, 'nacht').done).toBe(0);
  });
  it('loads answers of the fillable sheets page and leaves out unknown keys', () => {
    const got = answersFrom({ at: 'x', values: { 'ablauf.A': 'Ride through', 'ablauf.q.outside': true, 'nope.x': 'y', 'setup.0.g': 120 } });
    expect(got).toEqual({ values: { 'ablauf.A': 'Ride through', 'ablauf.q.outside': true, 'setup.0.g': '120' }, n: 3 });
    expect(answersFrom({ data: { values: { 'nacht.0': 'Shop at 18:00' } } }).n).toBe(1);
    expect(answersFrom({ values: { other: 1 } })).toBeNull();
    expect(answersFrom(null)).toBeNull();
  });
  it('takes over another race into the empty fields, never the race own fields', () => {
    const other = { values: { 'ablauf.race': 'Old race', 'ablauf.B': 'Gravel bike', 'liste.1.v': '1 rain jacket', 'ablauf.q.cook': true, 'nacht.0': '' } };
    const mine = { values: { 'liste.1.v': 'Poncho' } };
    const { check, n } = takeOver(mine, other);
    expect(n).toBe(2);
    expect(valueOf(check, 'ablauf.race')).toBe('');
    expect(valueOf(check, 'ablauf.B')).toBe('Gravel bike');
    expect(valueOf(check, 'liste.1.v')).toBe('Poncho');
    expect(valueOf(check, 'ablauf.q.cook')).toBe(true);
  });
  it('reads grams from what you wrote', () => {
    expect(gramsOf('200')).toBe(200);
    expect(gramsOf('2× 100')).toBe(200);
    expect(gramsOf('1.2 kg')).toBe(1200);
    expect(gramsOf('1,5 kg')).toBe(1500);
    expect(gramsOf('150 g + 40')).toBe(190);
    expect(gramsOf('')).toBeNull();
    expect(gramsOf('light')).toBeNull();
  });
  it('adds up the target setup and compares it with the target', () => {
    let c = withValue(null, 'setup.0.g', '300');
    c = withValue(c, 'setup.0.full', '1.4 kg');
    c = withValue(c, 'setup.1.g', '200');
    c = withValue(c, 'setup.total', '1.5 kg');
    const w = setupWeight(c);
    expect(w).toMatchObject({ empty: 500, full: 1600, target: 1500, over: 100, counted: 2 });
    expect(setupWeight(null)).toMatchObject({ empty: 0, full: 0, target: null, over: null, counted: 0 });
  });
  it('the day before: counts the ticked steps, the ticks start empty', () => {
    expect(dayBeforeDone(null)).toEqual({ done: 0, of: DAY_BEFORE.length });
    let c = withValue(null, 'vorher.0.done', true);
    c = withValue(c, 'vorher.3.v', 'Start 06:00, alarm 04:30');
    expect(dayBeforeDone(c).done).toBe(1);
    expect(filled(c, 'vorher').done).toBe(1);
    expect(answersFrom({ values: { 'vorher.1.done': true } }).values).toEqual({ 'vorher.1.done': true });
    // taking over another race brings the plan, not the ticks
    const got = takeOver(null, c).check.values;
    expect(got['vorher.3.v']).toBe('Start 06:00, alarm 04:30');
    expect('vorher.0.done' in got).toBe(false);
  });
});
