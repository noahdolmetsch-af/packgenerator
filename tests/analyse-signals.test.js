// «Gesundheitssignale» (Noah 03.11.2026, Idee 3): the personal range and the runs outside it.
import { describe, it, expect } from 'vitest';
import { bandOf, runsOutside, hasSignals, MIN_VALUES, RUN } from '../src/lib/analyse/signals.js';

const day = (i) => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
const days = (n) => Array.from({ length: n }, (_, i) => day(i));

describe('bandOf', () => {
  it('is the middle 80 % of the days', () => {
    const ds = days(41);
    const b = bandOf(ds, (d) => ds.indexOf(d)); // 0…40
    expect(b[0]).toBeCloseTo(4);
    expect(b[1]).toBeCloseTo(36);
  });
  it('needs enough values and some spread', () => {
    expect(bandOf(days(MIN_VALUES - 1), () => 50)).toBeNull();
    expect(bandOf(days(40), () => 50)).toBeNull();
    expect(bandOf(days(40), () => null)).toBeNull();
  });
});

describe('runsOutside', () => {
  const ds = days(30);
  const vals = Object.fromEntries(ds.map((d, i) => [d, 50 + (i % 3)]));
  const band = [49, 53];
  it('finds days in a row above the range, newest first', () => {
    for (const i of [5, 6, 7, 8]) vals[ds[i]] = 60;
    for (const i of [20, 21, 22]) vals[ds[i]] = 40;
    const r = runsOutside(ds, (d) => vals[d], band);
    expect(r).toEqual([
      { side: 'below', from: ds[20], to: ds[22], n: 3 },
      { side: 'above', from: ds[5], to: ds[8], n: 4 },
    ]);
  });
  it('ignores runs shorter than RUN, and a missing day ends a run', () => {
    const v = Object.fromEntries(ds.map((d) => [d, 50]));
    v[ds[3]] = 60;
    v[ds[4]] = 60;
    expect(runsOutside(ds, (d) => v[d], band)).toEqual([]);
    for (const i of [10, 11, 13, 14]) v[ds[i]] = 60;
    delete v[ds[12]];
    expect(runsOutside(ds, (d) => v[d], band)).toEqual([]);
    expect(RUN).toBe(3);
  });
  it('a change of side ends the run; without a band there is nothing', () => {
    const v = Object.fromEntries(ds.map((d) => [d, 50]));
    v[ds[1]] = 60; v[ds[2]] = 60; v[ds[3]] = 40; v[ds[4]] = 40;
    expect(runsOutside(ds, (d) => v[d], band)).toEqual([]);
    expect(runsOutside(ds, (d) => v[d], null)).toEqual([]);
  });
});

describe('hasSignals', () => {
  const base = { src: 'fitbit', get: () => 1 };
  it('is for daily Fitbit values only', () => {
    expect(hasSignals(base)).toBe(true);
    expect(hasSignals({ ...base, sum: true })).toBe(false);
    expect(hasSignals({ ...base, own: true })).toBe(false);
    expect(hasSignals({ ...base, key: 'bed' })).toBe(false);
    expect(hasSignals({ ...base, src: 'strava' })).toBe(false);
    expect(hasSignals(null)).toBe(false);
  });
});
