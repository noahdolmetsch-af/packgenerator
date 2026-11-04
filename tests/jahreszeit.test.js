// «Die App zieht sich der Jahreszeit an» (Idee 30): the season from the calendar day (meteorological, northern hemisphere).
import { describe, it, expect } from 'vitest';
import { seasonOf, SEASONS } from '../src/lib/season/season.js';

describe('seasonOf', () => {
  it('maps every month', () => {
    const by = (m) => seasonOf(`2026-${String(m).padStart(2, '0')}-15`);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(by)).toEqual(['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter']);
  });
  it('switches on the first of the month', () => {
    expect(seasonOf('2026-11-30')).toBe('autumn');
    expect(seasonOf('2026-12-01')).toBe('winter');
    expect(seasonOf('2027-03-01')).toBe('spring');
  });
  it('a wrong day gives a season, not an error', () => {
    expect(SEASONS).toContain(seasonOf(''));
    expect(SEASONS).toContain(seasonOf(undefined));
  });
});
