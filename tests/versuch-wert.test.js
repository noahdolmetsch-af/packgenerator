// «Eigene Experimente» with a measured value (Cockpit-Idee 6): the look back compares the try with the days before.
import { describe, it, expect } from 'vitest';
import { newExp, expsOf, expAgain } from '../src/lib/ruhig/versuche.js';
import { EXP_METRICS, MIN_SIDE, sideOf, expDaysSoFar, expResult } from '../src/lib/ruhig/versuch-wert.js';

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
