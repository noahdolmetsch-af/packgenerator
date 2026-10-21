// «Körperwerte» on Heute (Noah 21.10.2026 «Körperwerte und countdown ok»): the Fitbit values of today,
// else the last day of 7. Fictional data only.
import { describe, it, expect } from 'vitest';
import { VITALS, vitalOf, vitalsToday } from '../src/lib/home/vitals.js';
import { BODY } from '../src/lib/uebersicht.js';

const T = '2026-10-21';
describe('vitals', () => {
  it('every value opens a tab of Körperwerte that exists', () => {
    for (const x of VITALS) expect(BODY[x.tab], x.tab).toBeTruthy();
  });
  it('the value of a day row; nothing invented', () => {
    const row = { date: T, restingHr: 52.4, hrvMs: 41.6, sleep: { asleepMin: 438 }, steps: 8123.2, azm: 0, kcal: 2210 };
    expect(VITALS.map((x) => vitalOf(row, x.key))).toEqual([52, 42, 7.3, 8123, 0, 2210]);
    expect(vitalOf({ date: T }, 'rhr')).toBe(null);
    expect(vitalOf({ date: T, sleep: { asleepMin: 0 } }, 'sleep')).toBe(null);
    expect(vitalOf(null, 'steps')).toBe(null);
  });
  it('today first, else the last day of 7, with its day', () => {
    const rows = [
      { date: '2026-10-13', hrvMs: 60 },
      { date: '2026-10-19', hrvMs: 44, restingHr: 55 },
      { date: T, restingHr: 53, steps: 4000 },
      { date: '2026-10-22', restingHr: 99 },
    ];
    const v = vitalsToday(rows, T);
    expect(v.any).toBe(true);
    const by = Object.fromEntries(v.rows.map((r) => [r.key, r]));
    expect(by.rhr).toMatchObject({ v: 53, day: T });
    expect(by.hrv).toMatchObject({ v: 44, day: '2026-10-19' });
    expect(by.steps).toMatchObject({ v: 4000, day: T });
    expect(by.sleep).toMatchObject({ v: null, day: null });
    expect(vitalsToday([], T).any).toBe(false);
  });
});
