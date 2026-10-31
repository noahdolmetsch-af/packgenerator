// «Rennen-Check» (Noah 27.10.2026 «1b 2b»): the five sheets, their keys and loading answers. Made-up answers.
import { describe, it, expect } from 'vitest';
import { SHEETS, fieldKeys, valueOf, withValue, answersFrom, filled, takeOver } from '../src/lib/race/check-lib.js';

describe('the race check', () => {
  it('has five sheets and every key belongs to one of them', () => {
    expect(SHEETS.map((s) => s.id)).toEqual(['ablauf', 'setup', 'liste', 'schlaf', 'nacht']);
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
});
