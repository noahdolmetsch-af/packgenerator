// «Eigene Experimente» with a measured value (Cockpit-Idee 6): the look back compares the try with the days before.
import { describe, it, expect } from 'vitest';
import { newExp, expsOf, expAgain } from '../src/lib/ruhig/versuche.js';
import { EXP_METRICS, RIDE_METRICS, MIN_SIDE, sideOf, expDaysSoFar, expResult } from '../src/lib/ruhig/versuch-wert.js';
import { feelDay } from '../src/lib/analyse/catalog.js';

const FROM = '2026-10-10';
const e = (extra = {}) => ({ ...newExp({ q: 'Sleep better?', from: FROM, days: 7, metric: 'sleep' }, 'x1'), ...extra });
/** value by day: 420 for the 7 days before the try, then `during` */
const series = (during, before = 420) => (d) => (d < FROM ? before : d >= FROM ? during : null);

describe('metric on a try', () => {
  it('keeps a known value and drops an unknown one; old tries stay as they are', () => {
    expect(newExp({ q: 'a', from: FROM, metric: 'rhr' }, 'i')).toMatchObject({ metric: 'rhr' });
    expect(newExp({ q: 'a', from: FROM, metric: 'nope' }, 'i')).not.toHaveProperty('metric');
    expect(newExp({ q: 'a', from: FROM }, 'i')).not.toHaveProperty('metric');
    expect(expsOf([{ ...newExp({ q: 'a', from: FROM, metric: 'hrv' }, 'i') }])[0].metric).toBe('hrv');
    expect(expsOf([{ ...newExp({ q: 'a', from: FROM }, 'i'), metric: 'zzz' }])[0]).not.toHaveProperty('metric');
  });
  it('«again» keeps the value', () => {
    expect(expAgain(e(), '2026-10-20', 'y').metric).toBe('sleep');
  });
  it('the list has no duplicates', () => {
    expect(new Set(EXP_METRICS).size).toBe(EXP_METRICS.length);
  });
});

describe('days so far', () => {
  it('counts to today, to the early end, or to the last day', () => {
    expect(expDaysSoFar(e(), '2026-10-09')).toEqual([]);
    expect(expDaysSoFar(e(), '2026-10-12')).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    expect(expDaysSoFar(e({ stopped: '2026-10-11' }), '2026-10-15')).toHaveLength(2);
    expect(expDaysSoFar(e(), '2026-11-30')).toHaveLength(7);
  });
});

describe('side of values', () => {
  it('mean, range and spread; days without a value do not count', () => {
    const s = sideOf(['a', 'b', 'c', 'd'], (d) => ({ a: 400, b: 440, c: null }[d]));
    expect(s).toMatchObject({ n: 2, mean: 420, lo: 400, hi: 440 });
    expect(sideOf(['a'], () => null)).toEqual({ n: 0, mean: null, lo: null, hi: null, sd: null });
  });
});

describe('result', () => {
  it('is null without a value or before the first day', () => {
    expect(expResult({ ...e(), metric: undefined }, () => 1, '2026-10-12')).toBeNull();
    expect(expResult(e(), () => 1, '2026-10-09')).toBeNull();
  });
  it('says «few» under three values on a side', () => {
    const r = expResult(e(), series(450), '2026-10-11'); // 2 days so far
    expect(r.verdict).toBe('few');
    expect(r.diff).toBeNull();
    expect(MIN_SIDE).toBe(3);
  });
  it('a clear rise is «up», a clear fall «down»', () => {
    // before: 420 ± small; during: 470 ± small
    const wob = (base) => (d) => base + (Number(d.slice(-2)) % 3) * 4;
    const up = expResult(e(), (d) => (d < FROM ? wob(420)(d) : wob(470)(d)), '2026-10-16');
    expect(up.verdict).toBe('up');
    expect(up.diff).toBeGreaterThan(40);
    expect(up.during.n).toBe(7);
    expect(up.before.n).toBe(7);
    const down = expResult(e(), (d) => (d < FROM ? wob(470)(d) : wob(420)(d)), '2026-10-16');
    expect(down.verdict).toBe('down');
  });
  it('a difference inside the day-to-day swing is «unclear»', () => {
    const swing = (d) => 420 + ((Number(d.slice(-2)) * 37) % 11) * 10 - 50;
    const r = expResult(e(), (d) => (d < FROM ? swing(d) : swing(d) + 5), '2026-10-16');
    expect(r.verdict).toBe('unclear');
  });
  it('the days before are as many as the days so far', () => {
    const seen = [];
    expResult(e(), (d) => (seen.push(d), 1), '2026-10-12');
    expect(seen.filter((d) => d < FROM).sort()).toEqual(['2026-10-07', '2026-10-08', '2026-10-09']);
  });
  it('identical values give no difference', () => {
    expect(expResult(e(), () => 420, '2026-10-16')).toMatchObject({ verdict: 'unclear', diff: 0 });
  });
});

describe('ride values (Persönliches Lernen, Idee 2)', () => {
  it('the ride values are part of the list', () => {
    for (const k of RIDE_METRICS) expect(EXP_METRICS).toContain(k);
    expect(RIDE_METRICS).toEqual(['rideFeel', 'cad', 'spd', 'wkg']);
  });
  it('a second value is kept only next to a first one and never twice the same', () => {
    expect(newExp({ q: 'a', from: FROM, metric: 'rideFeel', also: 'cad' }, 'i')).toMatchObject({ metric: 'rideFeel', also: 'cad' });
    expect(newExp({ q: 'a', from: FROM, metric: 'cad', also: 'cad' }, 'i')).not.toHaveProperty('also');
    expect(newExp({ q: 'a', from: FROM, also: 'cad' }, 'i')).not.toHaveProperty('also');
    expect(newExp({ q: 'a', from: FROM, metric: 'cad', also: 'nope' }, 'i')).not.toHaveProperty('also');
    expect(expsOf([newExp({ q: 'a', from: FROM, metric: 'spd', also: 'wkg' }, 'i')])[0].also).toBe('wkg');
    expect(expsOf([{ ...newExp({ q: 'a', from: FROM, metric: 'spd' }, 'i'), also: 'spd' }])[0]).not.toHaveProperty('also');
  });
  it('«again» keeps both values', () => {
    const x = newExp({ q: 'a', from: FROM, metric: 'rideFeel', also: 'cad' }, 'i');
    expect(expAgain(x, '2026-10-20', 'y')).toMatchObject({ metric: 'rideFeel', also: 'cad' });
  });
  it('days without a ride have no value and the verdict waits for three rides on each side', () => {
    const get = (d) => ({ '2026-10-03': 5, '2026-10-06': 6, '2026-10-08': 5, '2026-10-12': 4, '2026-10-14': 4 }[d] ?? null);
    const r = expResult({ ...e({ days: 7 }), metric: 'rideFeel' }, get, '2026-10-16');
    expect(r.verdict).toBe('few');
    expect(r.during.n).toBe(2);
    expect(r.before.n).toBe(3);
  });
});

describe('felt effort of a day', () => {
  it('is the mean of the bike rides with an answer; own answer before Strava’s', () => {
    expect(feelDay([{ kind: 'bike', feel: 4 }, { kind: 'bike', rpe: 6 }, { kind: 'bike' }, { kind: 'run', feel: 9 }])).toBe(5);
    expect(feelDay([{ kind: 'bike' }])).toBeNull();
    expect(feelDay(undefined)).toBeNull();
  });
});
