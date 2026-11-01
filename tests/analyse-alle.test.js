// «Analyse: alle Werte» (Noah 27.10.2026): hour profiles, Fitbit's hourly activity and the tiles without data.
import { describe, it, expect } from 'vitest';
import { hourProfile, activeHours, meanOfHours, sumOf, tilesOf, ACTIVE_HOUR_STEPS } from '../src/lib/analyse.js';
import { cleanDay, cleanShaped, MORE_NUM, MORE_SHAPED, EXTRA } from '../src/lib/health.js';

const H = (fill) => Array.from({ length: 24 }, (_, i) => fill(i));

describe('analyse: alle Werte', () => {
  it('the mean per hour of the day over the days', () => {
    const days = { a: H((i) => (i === 7 ? 80 : null)), b: H((i) => (i === 7 ? 60 : i === 8 ? 70 : null)) };
    const p = hourProfile(['a', 'b', 'c'], (d) => days[d]);
    expect(p).toHaveLength(24);
    expect(p[7]).toBe(70);
    expect(p[8]).toBe(70);
    expect(p[0]).toBeNull();
  });

  it('counts the hours from 9 to 21 with enough steps, like Fitbit', () => {
    expect(activeHours(H((i) => (i >= 9 && i < 13 ? ACTIVE_HOUR_STEPS : 10)))).toBe(4);
    expect(activeHours(H(() => null))).toBeNull();
    expect(activeHours(null)).toBeNull();
    expect(activeHours(H((i) => (i === 22 ? 5000 : 0)))).toBe(0);
  });

  it('means and sums only over what is there', () => {
    expect(meanOfHours([60, null, 80])).toBe(70);
    expect(meanOfHours(null)).toBeNull();
    expect(sumOf({ light: 10, mod: 5, sed: 600 }, ['light', 'mod', 'very'])).toBe(15);
    expect(sumOf(null)).toBeNull();
  });

  it('shows a value without data, and a place holder, only with «all»', () => {
    const groups = [{ key: 'g', name: 'G', items: [{ key: 'x', src: 'fitbit', get: () => null }, { key: 'y', src: 'fitbit', later: 'own' }, { key: 'z', src: 'fitbit', get: () => 3 }] }];
    expect(tilesOf(groups, ['d1'], ['fitbit'])[0].tiles.map((t) => t.key)).toEqual(['z']);
    const all = tilesOf(groups, ['d1'], ['fitbit'], { all: true })[0].tiles;
    expect(all.map((t) => [t.key, !!t.empty])).toEqual([['x', true], ['y', true], ['z', false]]);
  });

  it('keeps the new Fitbit values of a day, and drops what does not fit', () => {
    expect(EXTRA).toEqual(expect.arrayContaining([...MORE_NUM, ...MORE_SHAPED]));
    const r = cleanDay({ date: '2026-10-20', vo2max: 55.9, floors: 12, levels: { sed: 600, x: 'no' }, stepH: H(() => 1), hrH: [1, 2], exercises: [{ name: 'Gehen', min: 30 }, { name: 'kaputt' }], vo2level: 'GOOD', vo2est: 'yes' });
    expect(r).toEqual({ date: '2026-10-20', vo2max: 55.9, floors: 12, levels: { sed: 600 }, stepH: H(() => 1), exercises: [{ name: 'Gehen', min: 30 }], vo2level: 'GOOD' });
    expect(cleanShaped('hrZones', [])).toBeUndefined();
  });
});
