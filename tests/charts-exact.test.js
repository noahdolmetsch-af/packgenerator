// «Genaue Werte» (Noah 21.11.2026 «1a 2b 3a»): time in a tapped chart is hours and minutes, never rounded away.
import { describe, it, expect } from 'vitest';
import { hoursMin } from '../src/lib/charts/exact.js';

describe('hoursMin', () => {
  it('shows hours and minutes', () => {
    expect(hoursMin(34 * 60 + 24)).toBe('34 h 24 min');
    expect(hoursMin(125)).toBe('2 h 5 min');
  });
  it('leaves out what is zero', () => {
    expect(hoursMin(120)).toBe('2 h');
    expect(hoursMin(45)).toBe('45 min');
    expect(hoursMin(0)).toBe('0 min');
  });
  it('rounds only seconds away and never goes negative', () => {
    expect(hoursMin(59.6)).toBe('1 h');
    expect(hoursMin(-5)).toBe('0 min');
    expect(hoursMin(undefined)).toBe('0 min');
  });
});
