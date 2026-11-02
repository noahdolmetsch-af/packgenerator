import { describe, it, expect } from 'vitest';
import { valueHref, dayHref, dayOfHash, rangeOfHash } from '../src/lib/analyse/jump.js';
import { detailHref } from '../src/lib/analyse/catalog.js';

describe('Analyse jump targets', () => {
  it('builds the link of a value, with or without a period', () => {
    expect(valueHref('sleep')).toBe('#/auswerten/analyse/sleep');
    expect(valueHref('sleep', 'y')).toBe('#/auswerten/analyse/sleep?zeit=y');
    expect(valueHref('a b', 'nope')).toBe('#/auswerten/analyse/a%20b');
    expect(detailHref('rhr')).toBe(valueHref('rhr'));
  });
  it('builds the link of a day and leaves out a wrong day', () => {
    expect(dayHref('2026-10-05')).toBe('#/auswerten/analyse?tag=2026-10-05');
    expect(dayHref('5.10.')).toBe('#/auswerten/analyse');
  });
  it('reads the day and the period back from the hash', () => {
    expect(dayOfHash('#/auswerten/analyse?tag=2026-10-05')).toBe('2026-10-05');
    expect(dayOfHash('#/auswerten/analyse?tag=x')).toBeNull();
    expect(dayOfHash('#/auswerten/analyse')).toBeNull();
    expect(rangeOfHash('#/auswerten/analyse/sleep?zeit=w')).toBe('w');
    expect(rangeOfHash('#/auswerten/analyse/sleep?zeit=zz')).toBeNull();
  });
});
