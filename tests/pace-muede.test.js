// «Lange Tage» (S1, Noah 21.11.2026 «1a»): fictional rides only.
import { describe, it, expect } from 'vitest';
import { tiredness, isLongDay, LONG_KM } from '../src/lib/pace-muede.js';
import { ridingHours } from '../src/lib/route.js';

// a ride that took `f` times the standard guess (16 km/h, 600 m per hour)
const ride = (i, km, f, gainM = 0) => ({ id: `r${i}`, date: '2026-09-01', km, gainM, movingH: (km / 16 + gainM / 600) * f, use: true });
const shorts = (f) => [1, 2, 3, 4, 5, 6].map((i) => ride(i, 40 + i * 3, f));
const longs = (f, n = 3) => Array.from({ length: n }, (_, i) => ride(10 + i, 90 + i * 10, f));

describe('tiredness', () => {
  it('finds how much longer long rides take', () => {
    const t = tiredness([...shorts(1), ...longs(1.2)]);
    expect(t).toMatchObject({ fromKm: LONG_KM, factor: 1.2, pct: 20, nLong: 3, nShort: 6 });
  });
  it('says nothing with too few long or short rides', () => {
    expect(tiredness([...shorts(1), ...longs(1.2, 2)])).toBeNull();
    expect(tiredness([...shorts(1).slice(0, 4), ...longs(1.2)])).toBeNull();
    expect(tiredness([])).toBeNull();
  });
  it('says nothing when long rides are not slower (under 5 %)', () => {
    expect(tiredness([...shorts(1), ...longs(1.03)])).toBeNull();
    expect(tiredness([...shorts(1), ...longs(0.9)])).toBeNull();
  });
  it('does not believe more than 40 %', () => {
    expect(tiredness([...shorts(1), ...longs(2)]).factor).toBe(1.4);
  });
  it('ignores rides that do not count (left out, under 20 km)', () => {
    const noise = [{ ...ride(30, 100, 3), use: false }, ride(31, 10, 3)];
    expect(tiredness([...shorts(1), ...longs(1.2), ...noise]).factor).toBe(1.2);
  });
  it('takes climbing into account (a hilly long ride is not tiredness)', () => {
    const hilly = [90, 100, 110].map((km, i) => ride(40 + i, km, 1, 1500));
    expect(tiredness([...shorts(1), ...hilly])).toBeNull();
  });
});

describe('long days in the riding hours', () => {
  const tired = { fromKm: 80, factor: 1.25 };
  it('a long day takes longer, a short day does not', () => {
    const plain = ridingHours({ km: 160, gainM: 0 }, 1, null);
    expect(ridingHours({ km: 160, gainM: 0 }, 1, { tired })).toBeGreaterThan(plain);
    expect(ridingHours({ km: 160, gainM: 0 }, 2, { tired })).toBeGreaterThan(ridingHours({ km: 160, gainM: 0 }, 2, null)); // 80 km a day is long too
    expect(ridingHours({ km: 150, gainM: 0 }, 2, { tired })).toBe(ridingHours({ km: 150, gainM: 0 }, 2, null)); // 75 km a day is not
    expect(ridingHours({ km: 60, gainM: 0 }, 1, { tired })).toBe(ridingHours({ km: 60, gainM: 0 }, 1, null));
  });
  it('isLongDay', () => {
    expect(isLongDay({ fromKm: 80 }, 80)).toBe(true);
    expect(isLongDay({ fromKm: 80 }, 79)).toBe(false);
    expect(isLongDay(null, 200)).toBe(false);
  });
});
