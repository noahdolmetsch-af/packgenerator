// «Tippfehler-Frage» (Warteliste 6; Noah 22.11.2026 «1-5 a»): the rule asks, it never blocks; a shifted comma becomes the suggestion.
import { describe, it, expect } from 'vitest';
import { askTypo, numberOf, okKey, okOf, withOk, KINDS } from '../src/lib/typo/frage.js';

describe('askTypo', () => {
  it('a normal value is not asked about', () => {
    expect(askTypo({ kind: 'bodyKg', value: 72 })).toBe(null);
    expect(askTypo({ kind: 'km', value: 85.5 })).toBe(null);
  });
  it('a shifted comma is offered as the suggestion', () => {
    expect(askTypo({ kind: 'bodyKg', value: 700 })).toMatchObject({ suggest: 70, why: 'range' });
    expect(askTypo({ kind: 'bodyKg', value: 7 })).toMatchObject({ suggest: 70 });
    expect(askTypo({ kind: 'km', value: 8500 })).toMatchObject({ suggest: 85 });
    expect(askTypo({ kind: 'minutes', value: 9000 })).toMatchObject({ suggest: 90 });
  });
  it('with your own values it compares with them, and picks the shift that lands near them', () => {
    const own = [72, 73, 71.5, 72.4];
    expect(askTypo({ kind: 'bodyKg', value: 125, own })).toMatchObject({ why: 'own', suggest: null });
    expect(askTypo({ kind: 'bodyKg', value: 7.3, own })).toMatchObject({ suggest: 73 });
    expect(askTypo({ kind: 'bodyKg', value: 74, own })).toBe(null);
  });
  it('fewer than three own values are not used', () => {
    expect(askTypo({ kind: 'bodyKg', value: 50, own: [72, 73] })).toBe(null);
  });
  it('a value marked as right is not asked about again', () => {
    expect(askTypo({ kind: 'bodyKg', value: 300, ok: [okKey('bodyKg', 300)] })).toBe(null);
    expect(askTypo({ kind: 'bodyKg', value: 301, ok: [okKey('bodyKg', 300)] })).not.toBe(null);
  });
  it('no number, zero, negative or an unknown kind: no question (the page keeps its own check)', () => {
    expect(askTypo({ kind: 'bodyKg', value: NaN })).toBe(null);
    expect(askTypo({ kind: 'bodyKg', value: 0 })).toBe(null);
    expect(askTypo({ kind: 'bodyKg', value: -5 })).toBe(null);
    expect(askTypo({ kind: 'nope', value: 5 })).toBe(null);
  });
  it('every kind has limits, decimals and a unit', () => {
    for (const k of Object.values(KINDS)) expect(k.max).toBeGreaterThan(k.min);
  });
});

describe('numberOf and the remembered values', () => {
  it('reads a comma and rejects text', () => {
    expect(numberOf('70,5')).toBe(70.5);
    expect(numberOf(' 8 ')).toBe(8);
    expect(numberOf('')).toBe(null);
    expect(numberOf('abc')).toBe(null);
  });
  it('remembers a value once and keeps the newest 200', () => {
    let v;
    for (let i = 1; i <= 205; i++) v = withOk(v, 'km', i);
    expect(okOf(v)).toHaveLength(200);
    expect(okOf(v).at(-1)).toBe('km:205');
    expect(okOf(withOk(withOk(undefined, 'km', 3), 'km', 3))).toEqual(['km:3']);
    expect(okOf(undefined)).toEqual([]);
  });
});
