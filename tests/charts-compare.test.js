// «Vergleich» (Noah 21.11.2026): one line says how a bar stands against the year before or the mean.
import { describe, it, expect } from 'vitest';
import { againstYear, againstMean } from '../src/lib/charts/compare.js';

describe('againstYear', () => {
  it('names the difference in hours and minutes', () => {
    expect(againstYear(300, 180)).toBe('2 h more than the year before');
    expect(againstYear(100, 145)).toBe('45 min less than the year before');
  });
  it('says «the same» at equal values', () => {
    expect(againstYear(120, 120)).toBe('The same as the year before');
  });
  it('is silent against a gap', () => {
    expect(againstYear(120, null)).toBe('');
    expect(againstYear(NaN, 10)).toBe('');
  });
});

describe('againstMean', () => {
  it('compares with the mean, with a 5 % band', () => {
    expect(againstMean(200, [100, 100, 100])).toBe('Above your average');
    expect(againstMean(50, [100, 100, 100])).toBe('Below your average');
    expect(againstMean(102, [100, 100, 100])).toBe('About your average');
  });
  it('needs three real values and a mean above zero', () => {
    expect(againstMean(10, [10, 20])).toBe('');
    expect(againstMean(10, [0, 0, 0])).toBe('');
  });
});
