// Tempo (Noah 19.10.2026 «3a»): the trip list grows 20 rows at a time.
import { describe, it, expect } from 'vitest';
import { nextRows, TOUR_ROWS, PHONE_ROWS } from '../src/lib/touren/kurz.js';

describe('nextRows', () => {
  it('fills up to the next step of 20', () => {
    expect(TOUR_ROWS).toBe(20);
    expect(nextRows(100, PHONE_ROWS)).toBe(15);
    expect(nextRows(100, 20)).toBe(20);
    expect(nextRows(100, 40)).toBe(20);
  });
  it('never goes past the total', () => {
    expect(nextRows(27, 20)).toBe(7);
    expect(nextRows(12, 5)).toBe(7);
    expect(nextRows(20, 20)).toBe(0);
  });
});
