// «Cardio-Belastung» Idee C: the band where your days or weeks usually lie, for values that add up (lib/analyse/ueblich.js).
import { describe, it, expect } from 'vitest';
import { sumBand } from '../src/lib/analyse/ueblich.js';
import { windowOf } from '../src/lib/analyse/detail.js';

const T = '2026-10-09';
const days = windowOf('m3', T).days; // 91 days = 13 weeks
const idx = new Map(days.map((d, i) => [d, i]));

describe('sumBand', () => {
  it('is the middle half of the days: 1 … 91 → 23.5 … 68.5', () => {
    const [lo, hi] = sumBand(days, (d) => idx.get(d) + 1, false);
    expect(lo).toBeCloseTo(23.5, 5);
    expect(hi).toBeCloseTo(68.5, 5);
  });
  it('is the middle half of the weeks when the bars are weeks', () => {
    const [lo, hi] = sumBand(days, () => 100, true); // every week sums to 700
    expect(lo).toBe(700);
    expect(hi).toBe(700);
    const [a, b] = sumBand(days, (d) => (idx.get(d) % 7 === 0 ? (Math.floor(idx.get(d) / 7) + 1) * 100 : 0), true); // weeks 100 … 1300 → 400 … 1000
    expect(a).toBe(400);
    expect(b).toBe(1000);
  });
  it('is null without 7 values', () => {
    expect(sumBand(days, (d) => (idx.get(d) < 5 ? 10 : null), false)).toBeNull();
    expect(sumBand(days.slice(0, 20), () => 5, true)).toBeNull();
  });
});
