// «Strecke als Bild» (Paket E, Idee 23): the shape of a trip's route for the lists.
import { describe, it, expect } from 'vitest';
import { shapeLines, shapeOf, SHAPE_W, SHAPE_H } from '../src/lib/touren/streckenform.js';

const LINE = [[46.5, 7.5], [46.6, 7.7], [46.55, 8.0], [46.7, 8.2]];

describe('Streckenform', () => {
  it('uses the recorded ride first, then the planned route', () => {
    const ride = [[47, 8], [47.1, 8.1]];
    expect(shapeLines({ rides: [{ line: ride }], trip: { route: { line: LINE } } })[0].pts).toEqual(ride);
    expect(shapeLines({ trip: { route: { line: LINE } } })[0].pts).toEqual(LINE);
  });

  it('draws a path inside the box for a row with a line', () => {
    const d = shapeOf({ trip: { route: { line: LINE } } });
    expect(d.startsWith('M')).toBe(true);
    const nums = [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(nums.length).toBeGreaterThan(1);
    for (const [x, y] of nums) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(SHAPE_W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(SHAPE_H);
    }
  });

  it('gives nothing for a row without a line', () => {
    expect(shapeOf({ trip: { route: { km: 50 } } })).toBe('');
    expect(shapeOf({})).toBe('');
    expect(shapeOf(null)).toBe('');
    expect(shapeOf({ trip: { route: { line: [[46, 7]] } } })).toBe('');
  });

  it('ignores broken points', () => {
    expect(shapeOf({ trip: { route: { line: [[46, 7], [null, 7], [46.1, 7.1], [46.2, 7.3]] } } })).not.toBe('');
  });
});
