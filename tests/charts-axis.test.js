import { describe, it, expect } from 'vitest';
import { niceScale, niceStep, fracOf, decimalsOf, tickText, minuteText, MINUTE_STEPS } from '../src/lib/charts/axis.js';

describe('genaue Achse', () => {
  it('finds round steps', () => {
    expect(niceStep(17)).toBe(20);
    expect(niceStep(2.1)).toBe(2.5);
    expect(niceStep(0.3)).toBe(0.5);
    expect(niceStep(40, MINUTE_STEPS)).toBe(60);
    expect(niceStep(1000, MINUTE_STEPS)).toBe(1440);
  });
  it('puts both ends on a round step', () => {
    const sc = niceScale([12, 47, 81], { zero: true });
    expect(sc).toMatchObject({ lo: 0, hi: 100, step: 25 });
    expect(sc.ticks).toEqual([0, 25, 50, 75, 100]);
    const line = niceScale([48, 51, 53]);
    expect(line.lo).toBeLessThanOrEqual(48);
    expect(line.hi).toBeGreaterThanOrEqual(53);
    expect(line.hi - line.lo).toBeLessThan(20); // a resting pulse is not flat on a 0–200 axis
    for (const t of line.ticks) expect(Math.abs(t / line.step - Math.round(t / line.step))).toBeLessThan(1e-9);
  });
  it('copes with one value, nothing and minutes', () => {
    expect(niceScale([]).ticks).toEqual([0, 1]);
    const one = niceScale([50]);
    expect(one.lo).toBeLessThan(50);
    expect(one.hi).toBeGreaterThan(50);
    const sleep = niceScale([400, 455, 470], { steps: MINUTE_STEPS });
    expect(sleep.step % 15).toBe(0);
    expect(sleep.ticks.map(minuteText)).toContain('7 h');
  });
  it('places and writes ticks', () => {
    expect(fracOf(25, { lo: 0, hi: 100 })).toBe(0.25);
    expect(decimalsOf(2.5)).toBe(1);
    expect(decimalsOf(0.25)).toBe(2);
    expect(decimalsOf(20)).toBe(0);
    expect(tickText(7.5000001, 2.5)).toBe('7.5');
    expect(minuteText(450)).toBe('7 h 30');
    expect(minuteText(45)).toBe('45 min');
  });
});
