import { describe, it, expect } from 'vitest';
import { rueckblick, quellen, bestwerte, unitsOf } from '../src/lib/flow/rueckblick.js';

const u = (day, o = {}) => ({ day, sport: 'run', ring: 'move', quelle: 'strava', min: 60, minQuelle: 'gemessen', ...o });
const LIST = [
  u('2026-03-01', { km: 10, min: 50 }),
  u('2026-03-09', { km: 21.14, min: 118 }),
  u('2026-04-02', { quelle: 'hand', min: 60, minQuelle: 'ca.' }),
  u('2025-03-05', { km: 8, min: 40 }),
  u('2026-03-02', { sport: 'bike', km: 40 }),
];

describe('Rückblick pro Sportart', () => {
  it('takes only the units of one sport', () => {
    expect(unitsOf(LIST, 'run')).toHaveLength(4);
  });

  it('counts this window and the year before, the average only from measured time', () => {
    const r = rueckblick(LIST, 'run', { from: '2026-01-01', to: '2026-12-31' }, { from: '2025-01-01', to: '2025-12-31' });
    expect(r.now.n).toBe(3);
    expect(r.now.mins).toBe(228);
    expect(r.now.nCa).toBe(1);
    expect(r.avgMin).toBe(84);
    expect(r.prev.n).toBe(1);
    expect(r.prevAvgMin).toBe(40);
    expect(r.now.km).toBe(31.1);
  });

  it('has no year before for «Alles»', () => {
    const r = rueckblick(LIST, 'run', { from: '2025-01-01', to: '2026-12-31' }, null);
    expect(r.prev).toBeNull();
    expect(r.prevAvgMin).toBeNull();
  });

  it('has no average when nothing was measured', () => {
    const r = rueckblick([u('2026-01-01', { minQuelle: 'ca.' })], 'run', { from: '2026-01-01', to: '2026-12-31' });
    expect(r.avgMin).toBeNull();
  });

  it('tells where the units come from', () => {
    expect(quellen(unitsOf(LIST, 'run'))).toEqual({ strava: 3, hand: 1 });
  });

  it('finds the best values; a ca. time is never a record', () => {
    const b = bestwerte(unitsOf(LIST, 'run').filter((x) => x.day.startsWith('2026')));
    expect(b.longest).toEqual({ min: 118, day: '2026-03-09' });
    expect(b.farthest).toEqual({ km: 21.1, day: '2026-03-09' });
    expect(b.busiest).toEqual({ month: '2026-03', n: 2 });
  });

  it('has no best values without data', () => {
    expect(bestwerte([])).toEqual({ longest: null, farthest: null, busiest: null });
  });
});
