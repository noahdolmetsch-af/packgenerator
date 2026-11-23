import { describe, it, expect } from 'vitest';
import { restLine } from '../src/lib/training/dein-stand.js';

const before = (d, n) => {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() - n);
  return x.toISOString().slice(0, 10);
};
const table = (rhrs) => new Map(rhrs.map((r, i) => [before('2026-11-10', i), { rhr: r }]));

describe('«Dein Stand»: the resting pulse line', () => {
  it('takes the median of the last 7 days against the usual one', () => {
    expect(restLine(table([58, 56, 57, 60, 55, 59, 57]), '2026-11-10', 54, before)).toEqual({ now: 57, usual: 54, diff: 3 });
    expect(restLine(table([50, 50, 52, 51, 50, 49, 50]), '2026-11-10', 54, before)).toEqual({ now: 50, usual: 54, diff: -4 });
  });
  it('says nothing with fewer than three days or without a usual value', () => {
    expect(restLine(table([58, 57]), '2026-11-10', 54, before)).toBeNull();
    expect(restLine(table([58, 57, 56]), '2026-11-10', undefined, before)).toBeNull();
    expect(restLine(null, '2026-11-10', 54, before)).toBeNull();
  });
});
