// «VO2max auf Heute» (Noah 28.10.2026 «2 a und b»): the last value, the one four weeks before, the 90 days.
// Fictional data only; calendar-day arithmetic.
import { describe, it, expect } from 'vitest';
import { vo2Of, VO2_DAYS } from '../src/lib/home/vo2.js';
import { addDays } from '../src/lib/health.js';
import { READY, TILE, wallOf, wallRecord, withVo2 } from '../src/lib/home/tiles.js';
import { SECTION_OF } from '../src/lib/home/sections.js';

const T = '2026-10-28';
const ids = (w) => w.map((x) => x.id);

describe('vo2Of', () => {
  it('nothing without a value, or with only an old one', () => {
    expect(vo2Of([], T)).toBeNull();
    expect(vo2Of([{ date: T, restingHr: 50 }], T)).toBeNull();
    expect(vo2Of([{ date: addDays(T, -(VO2_DAYS + 1)), vo2max: 48 }], T)).toBeNull();
  });
  it('the last value with its day, the one at least 28 days before and the change', () => {
    const rows = [
      { date: addDays(T, -2), vo2max: 49.34 },
      { date: addDays(T, -20), vo2max: 48.9 },
      { date: addDays(T, -31), vo2max: 47.8 },
      { date: addDays(T, -60), vo2max: 46 },
      { date: addDays(T, 1), vo2max: 60 }, // a day after today does not count
    ];
    expect(vo2Of(rows, T)).toEqual({ v: 49.3, day: addDays(T, -2), before: { v: 47.8, day: addDays(T, -31) }, diff: 1.5 });
  });
  it('without a value four weeks before: no change', () => {
    expect(vo2Of([{ date: T, vo2max: 50 }, { date: addDays(T, -10), vo2max: 49 }], T)).toEqual({ v: 50, day: T, before: null, diff: null });
  });
});

describe('the tile on the wall', () => {
  it('in the catalog, in «Dein Körper», on the ready wall', () => {
    expect(TILE.vo2max.sizes).toContain(TILE.vo2max.size);
    expect(SECTION_OF.vo2max).toBe('body');
    expect(ids(READY)).toContain('vo2max');
  });
  it('a wall of before (v 13) gets it once after the body and Aktiv; taken away it stays away', () => {
    expect(ids(wallOf({ v: 13, tiles: [{ id: 'body', size: 'l' }, { id: 'acts', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['moment', 'body', 'acts', 'vo2max', 'week']); // + PR 4: the moment card once, on top without habits
    expect(ids(withVo2([{ id: 'week', size: 'l' }]))).toEqual(['week', 'vo2max']);
    expect(ids(wallOf(wallRecord([{ id: 'week', size: 'l' }])))).toEqual(['week']);
  });
});
