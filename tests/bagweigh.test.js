import { describe, it, expect } from 'vitest';
import { weighTolerance, weighCompare, weighedOf, withWeighed } from '../src/lib/pack/bagweigh.js';

describe('K3 weigh a bag on the start day', () => {
  it('tolerance: 30 g or 5 %', () => {
    expect(weighTolerance(200)).toBe(30);
    expect(weighTolerance(4000)).toBe(200);
  });
  it('says ok within the tolerance', () => {
    expect(weighCompare({ calcG: 1870, weighedG: 1900 })).toEqual({ status: 'ok', diffG: 30 });
    expect(weighCompare({ calcG: 1870, weighedG: 1800 }).status).toBe('ok');
  });
  it('says more or less beyond it, rounded to 10 g', () => {
    expect(weighCompare({ calcG: 1870, weighedG: 2253 })).toEqual({ status: 'more', diffG: 380 });
    expect(weighCompare({ calcG: 1870, weighedG: 1500 })).toEqual({ status: 'less', diffG: -370 });
  });
  it('is unsure when items have no weight and the scale shows more', () => {
    expect(weighCompare({ calcG: 1000, weighedG: 1900, missing: 2 }).status).toBe('unsure');
    expect(weighCompare({ calcG: 1000, weighedG: 500, missing: 2 }).status).toBe('less');
  });
  it('gives nothing for no number', () => {
    expect(weighCompare({ calcG: 1000, weighedG: 0 })).toBeNull();
    expect(weighCompare({ calcG: 1000 })).toBeNull();
  });
  it('reads and writes the numbers of a trip', () => {
    const trip = { weighed: { seat: { g: 1900, day: '2026-11-20' }, bad: { g: 'x' }, none: null } };
    expect(weighedOf(trip)).toEqual({ seat: { g: 1900, day: '2026-11-20' } });
    expect(weighedOf({})).toEqual({});
    expect(withWeighed(trip, 'frame', 812.4, '2026-11-21')).toEqual({ seat: { g: 1900, day: '2026-11-20' }, frame: { g: 812, day: '2026-11-21' } });
    expect(withWeighed(trip, 'seat', 0)).toEqual({});
  });
});
