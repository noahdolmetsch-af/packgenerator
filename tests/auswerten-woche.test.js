// «Auswerten neu» Teil 2, Reiter «Woche»: the period against the one before, the recovery of the period. Fictional data only.
import { describe, it, expect } from 'vitest';
import { prevRange, changePct, periodRecovery, longest } from '../src/lib/auswerten/woche.js';
import { addDays } from '../src/lib/health.js';

const TODAY = '2026-10-20';
const table = (n, f, key = 'hrv') => {
  const t = new Map();
  for (let i = 1; i <= n; i++) t.set(addDays(TODAY, -i), { [key]: f(i) });
  return t;
};

describe('woche: the period against the one before and the recovery of the period', () => {
  it('pages one step back for a week and a month, nothing for all', () => {
    expect(prevRange({ mode: 'week', back: 0 }, TODAY)).toEqual({ from: addDays(TODAY, -13), to: addDays(TODAY, -7) });
    expect(prevRange({ mode: 'month', back: 0 }, TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(prevRange({ mode: 'all', back: 0 }, TODAY)).toBeNull();
  });
  it('says the change in percent, null without a base', () => {
    expect(changePct(150, 100)).toBe(50);
    expect(changePct(50, 100)).toBe(-50);
    expect(changePct(10, 0)).toBeNull();
  });
  it('puts the middle of the week against the own 12 months', () => {
    const t = table(200, (i) => (i <= 7 ? 55 : 75));
    const r = periodRecovery(t, { from: addDays(TODAY, -7), to: addDays(TODAY, -1) }, TODAY);
    const hrv = r.find((x) => x.key === 'hrv');
    expect(hrv.median).toBe(55);
    expect(hrv.n).toBe(7);
    expect(hrv.place).toBe('below');
    expect(r.find((x) => x.key === 'rhr')).toBeUndefined();
    expect(periodRecovery(t, { from: addDays(TODAY, -2), to: addDays(TODAY, -1) }, TODAY)).toEqual([]);
  });
  it('lists the longest units first', () => {
    const l = longest([{ day: '2026-10-01', min: 30 }, { day: '2026-10-02', min: 90 }, { day: '2026-10-03', min: 0 }, { day: '2026-10-04', min: 60 }], 2);
    expect(l.map((u) => u.min)).toEqual([90, 60]);
  });
});
