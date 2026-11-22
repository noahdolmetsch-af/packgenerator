// «Kalender und Achsen» (Noah 07.11.2026 «6 ja»): the axis of a count only steps in whole numbers
import { describe, it, expect } from 'vitest';
import { niceScale } from '../src/lib/charts/axis.js';

describe('niceScale integer', () => {
  it('a small count gets whole steps, not halves', () => {
    const half = niceScale([0, 2], { zero: true });
    expect(half.ticks.some((v) => !Number.isInteger(v))).toBe(true);
    const sc = niceScale([0, 2], { zero: true, integer: true });
    expect(sc.ticks.every(Number.isInteger)).toBe(true);
    expect(sc.step).toBeGreaterThanOrEqual(1);
  });
  it('a larger count keeps round whole steps and covers the data', () => {
    const sc = niceScale([0, 37], { zero: true, integer: true, count: 4 });
    expect(sc.ticks.every(Number.isInteger)).toBe(true);
    expect(sc.hi).toBeGreaterThanOrEqual(37);
    expect(sc.lo).toBe(0);
  });
  it('all zero still gives a usable axis', () => {
    const sc = niceScale([0, 0], { zero: true, integer: true });
    expect(sc.ticks.every(Number.isInteger)).toBe(true);
    expect(sc.hi).toBeGreaterThan(sc.lo);
  });
});
