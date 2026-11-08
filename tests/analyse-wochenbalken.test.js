// «Cardio-Belastung» Idee B: values that add up show one bar per week from 3 months on (lib/analyse/wochenbalken.js).
import { describe, it, expect } from 'vitest';
import { dailyLimit } from '../src/lib/analyse/wochenbalken.js';
import { bucketsOf, windowOf } from '../src/lib/analyse/detail.js';

const T = '2026-10-09';
const get = () => 100;

describe('weekly bars', () => {
  it('sums switch to weeks above 60 days, other values above 120', () => {
    expect(dailyLimit(true)).toBe(60);
    expect(dailyLimit(false)).toBe(120);
  });
  it('3 months of a sum are 13 weekly totals of 700, a month stays 30 days', () => {
    const m3 = bucketsOf(windowOf('m3', T).days, get, true, dailyLimit(true));
    expect(m3).toHaveLength(13);
    expect(m3.every((p) => p.v === 700 && p.days.length === 7)).toBe(true);
    expect(bucketsOf(windowOf('m', T).days, get, true, dailyLimit(true))).toHaveLength(30);
  });
  it('3 months of a mean value keep their 91 daily points', () => {
    expect(bucketsOf(windowOf('m3', T).days, get, false, dailyLimit(false))).toHaveLength(91);
  });
  it('a week keeps its seven days for a tap on the bar', () => {
    const w = bucketsOf(windowOf('m3', T).days, get, true, dailyLimit(true)).at(-1);
    expect(w.days.at(-1)).toBe(T);
    expect(w.days).toHaveLength(7);
  });
});
