// «Eigenes Diagramm» (D1–D6): the rules of lib/analyse/diagram.js. Fictional days only.
import { describe, it, expect } from 'vitest';
import { diagramWindow, stepBuckets, seriesOf, rolling7, rangeOf, fromMean, toggleKey, moveKey, recentKeys, matches, mondayOf, MAX_VALUES, DEFAULT_KEYS } from '../src/lib/analyse/diagram.js';

const T = '2026-10-09';

describe('diagramWindow', () => {
  it('fixed periods end today and go back whole periods', () => {
    expect(diagramWindow('30', T).days).toHaveLength(30);
    expect(diagramWindow('90', T)).toMatchObject({ to: T, from: '2026-07-12' });
    expect(diagramWindow('30', T, 1).to).toBe('2026-09-09');
    expect(diagramWindow('nix', T).days).toHaveLength(90);
  });
  it('own: swapped when the wrong way round, never after today, at most 3 years', () => {
    expect(diagramWindow('own', T, 0, { from: '2026-10-05', to: '2026-10-01' })).toMatchObject({ from: '2026-10-01', to: '2026-10-05' });
    expect(diagramWindow('own', T, 0, { from: '2026-10-01', to: '2027-01-01' }).to).toBe(T);
    expect(diagramWindow('own', T, 0, { from: '2010-01-01', to: T }).days).toHaveLength(1096);
    expect(diagramWindow('own', T, 0, { from: '', to: '' }).days).toHaveLength(90);
  });
});

describe('buckets and series', () => {
  const days = diagramWindow('30', T).days;
  it('weeks start on Monday, months by calendar month', () => {
    expect(mondayOf(T)).toBe('2026-10-05');
    const w = stepBuckets(days, 'week');
    expect(w[0].key).toBe(mondayOf(days[0]));
    expect(w.at(-1)).toEqual({ key: '2026-10-05', days: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', T] });
    expect(stepBuckets(days, 'month').map((b) => b.key)).toEqual(['2026-09', '2026-10']);
    expect(stepBuckets(days, 'day')).toHaveLength(30);
  });
  it('means, totals, gaps and the keep filter', () => {
    const b = stepBuckets(['2026-10-05', '2026-10-06', '2026-10-12'], 'week');
    const get = (d) => (d === '2026-10-12' ? null : 2);
    expect(seriesOf(b, get)).toEqual([2, null]);
    expect(seriesOf(b, get, { sum: true })).toEqual([4, null]);
    expect(seriesOf(b, () => 3, { keep: (d) => d !== '2026-10-05' })).toEqual([3, 3]);
  });
  it('7-point mean, ranges and «from the mean»', () => {
    expect(rolling7([1, 2, 3, null, 5])).toEqual([null, null, 2, 2, 2.75]);
    expect(rangeOf([2, 4])).toEqual({ lo: 2, hi: 4 });
    expect(rangeOf([2, 4], true)).toEqual({ lo: 0, hi: 4 });
    expect(rangeOf([3, 3])).toEqual({ lo: 2, hi: 4 });
    expect(rangeOf([null])).toEqual({ lo: 0, hi: 1 });
    expect(fromMean([90, 110, null])).toEqual([-10, 10, null]);
    expect(fromMean([0, 0])).toEqual([0, 0]);
  });
});

describe('choosing values', () => {
  it('at most 6, a second tap takes it away, order with arrows and drag', () => {
    let k = [];
    for (let i = 0; i < 8; i++) k = toggleKey(k, `v${i}`);
    expect(k).toHaveLength(MAX_VALUES);
    expect(toggleKey(k, 'v0')).not.toContain('v0');
    expect(moveKey(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveKey(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveKey(['a'], 3, 0)).toEqual(['a']);
  });
  it('recent picks without the ones shown; search ignores case and umlauts', () => {
    expect(recentKeys(['a', 'b', 'a', 'c'], ['b'])).toEqual(['a', 'c']);
    expect(matches('Höchster Puls', 'hochst')).toBe(true);
    expect(matches('Schlaf', 'SCHL')).toBe(true);
    expect(matches('Sauna', 'puls')).toBe(false);
    expect(matches('x', '')).toBe(true);
  });
  it('starts with the values of mockup D1', () => {
    expect(DEFAULT_KEYS).toEqual(['sleep', 'rhr', 'azm', 'km:bike', 'felt:energy']);
  });
});
