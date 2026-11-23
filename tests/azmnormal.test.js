import { describe, it, expect } from 'vitest';
import { azmNormal } from '../src/lib/weekmore.js';

const shift = (d, n) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const MON = '2026-11-16';
/** a week with the same value on `days` days */
const week = (monday, perDay, days = 7) => Array.from({ length: days }, (_, i) => ({ date: shift(monday, i), azm: perDay }));

describe('Aktivzonenminuten gegen das eigene Normal', () => {
  it('the usual is the median of the weeks before, not the mean', () => {
    const health = [...week(shift(MON, -7), 10), ...week(shift(MON, -14), 10), ...week(shift(MON, -21), 10), ...week(shift(MON, -28), 100), ...week(MON, 5)];
    // weekly sums: 70, 70, 70, 700 → median 70 (a mean would be 227)
    expect(azmNormal(health, MON)).toMatchObject({ normal: 70, weeks: 4 });
  });

  it('too few weeks: no usual yet', () => {
    const health = [...week(shift(MON, -7), 10), ...week(shift(MON, -14), 10)];
    expect(azmNormal(health, MON)).toBeNull();
  });

  it('a half-synced week (under four days) does not pull the usual down', () => {
    const health = [...week(shift(MON, -7), 10), ...week(shift(MON, -14), 10), ...week(shift(MON, -21), 10), ...week(shift(MON, -28), 10), ...week(shift(MON, -35), 10, 2)];
    expect(azmNormal(health, MON)).toMatchObject({ normal: 70, weeks: 4 });
  });

  it('a week marked as a pause is left out', () => {
    const health = [...week(shift(MON, -7), 10), ...week(shift(MON, -14), 10), ...week(shift(MON, -21), 10), ...week(shift(MON, -28), 10), ...week(shift(MON, -35), 1)];
    expect(azmNormal(health, MON, shift(MON, 6), [shift(MON, -35)])).toMatchObject({ normal: 70, weeks: 4 });
  });

  it('the same week a year ago (52 weeks back), up to the same weekday when the week is still running', () => {
    const health = [...week(shift(MON, -364), 20), ...[7, 14, 21, 28].flatMap((k) => week(shift(MON, -k), 10))];
    expect(azmNormal(health, MON)).toMatchObject({ normal: 70, year: 140 });
    expect(azmNormal(health, MON, shift(MON, 2))).toMatchObject({ year: 60 });
  });

  it('only a year ago, without a usual week: the year line stays, the usual is null', () => {
    expect(azmNormal(week(shift(MON, -364), 20), MON)).toEqual({ normal: null, weeks: 1, year: 140 });
  });

  it('no data at all: null', () => {
    expect(azmNormal([], MON)).toBeNull();
  });
});
