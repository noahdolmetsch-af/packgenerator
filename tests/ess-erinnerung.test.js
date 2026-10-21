// Noah 21.10.2026: the eat reminder can be hidden, has your own minutes and is on or off per tour.
import { describe, it, expect } from 'vitest';
import { everyOf, tripEat, startEat, nextEat, EVERY_STD, EVERY_MIN, EVERY_MAX } from '../src/lib/unterwegs/essen.js';

describe('Ess-Erinnerung: own minutes and per tour', () => {
  it('own minutes from 10 to 180, else the standard', () => {
    expect(everyOf(25)).toBe(25);
    expect(everyOf('90')).toBe(90);
    expect(everyOf(EVERY_MIN - 1)).toBe(EVERY_STD);
    expect(everyOf(EVERY_MAX + 1)).toBe(EVERY_STD);
    expect(everyOf('x')).toBe(EVERY_STD);
    const e = startEat({ every: 25, now: 0, until: 4 * 36e5 });
    expect(nextEat(e)).toBe(25 * 60000);
  });
  it('a tour is on unless switched off in Plan, with its own minutes', () => {
    expect(tripEat({})).toEqual({ on: true, every: EVERY_STD });
    expect(tripEat({ eat: { on: false, every: 20 } })).toEqual({ on: false, every: 20 });
    expect(tripEat(null)).toEqual({ on: true, every: EVERY_STD });
  });
});
