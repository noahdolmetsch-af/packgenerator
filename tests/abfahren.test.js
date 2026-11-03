// «Höhenprofil wird abgefahren» (Paket E, Idee 13): the pure part of the ride along the profile.
import { describe, it, expect } from 'vitest';
import { RIDE_MS, ease, rideShare, heightAtKm } from '../src/lib/touren/abfahren.js';

describe('abfahren', () => {
  it('starts at 0, ends at 1 and slows down at the end', () => {
    expect(rideShare(0)).toBe(0);
    expect(rideShare(RIDE_MS)).toBe(1);
    expect(rideShare(RIDE_MS * 5)).toBe(1);
    expect(rideShare(-50)).toBe(0);
    expect(ease(0.5)).toBeGreaterThan(0.5); // quick at first
    expect(ease(0.9) - ease(0.8)).toBeLessThan(ease(0.2) - ease(0.1)); // slow at the end
  });

  it('never goes back', () => {
    let last = -1;
    for (let ms = 0; ms <= RIDE_MS; ms += 40) {
      const p = rideShare(ms);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it('reads the height between two points of the profile', () => {
    const prof = [[0, 400], [10, 800], [20, 600]];
    expect(heightAtKm(prof, 0)).toBe(400);
    expect(heightAtKm(prof, 5)).toBe(600);
    expect(heightAtKm(prof, 15)).toBe(700);
    expect(heightAtKm(prof, 20)).toBe(600);
    expect(heightAtKm(prof, 99)).toBe(600);
    expect(heightAtKm(prof, -3)).toBe(400);
  });

  it('copes with an empty or broken profile', () => {
    expect(heightAtKm([], 3)).toBeNull();
    expect(heightAtKm(undefined, 3)).toBeNull();
    expect(heightAtKm([[1, 500], null, [Number.NaN, 3], [3, 700]], 2)).toBe(600);
  });
});
