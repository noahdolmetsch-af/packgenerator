import { describe, it, expect } from 'vitest';
import { velosStand, monthsOf, lastRideDay, daysBetween } from '../src/lib/stand/velos.js';

const rides = [
  { date: '2026-11-16', km: 40 },
  { date: '2026-11-02', km: 20.4 },
  { date: '2026-10-20', km: 100 },
  { date: '2025-12-05', km: 55 },
  { date: '2025-10-30', km: 999 }, // older than 12 months
  { date: '2026-11-30', km: 77 }, // in the future: not counted
];

describe('Stand in Zahlen: Velos', () => {
  it('counts calendar days, not clock hours', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2); // the clock change on 25.10.
    expect(daysBetween('2026-11-16', '2026-11-24')).toBe(8);
  });
  it('finds the last ride up to today', () => {
    expect(lastRideDay(rides, '2026-11-24')).toBe('2026-11-16');
    expect(lastRideDay([], '2026-11-24')).toBeNull();
    expect(lastRideDay([{ date: '2026-11-24', km: 0 }], '2026-11-24')).toBeNull();
  });
  it('gives twelve months, oldest first, newest is this month', () => {
    const m = monthsOf(rides, '2026-11-24', 12);
    expect(m).toHaveLength(12);
    expect(m[0].month).toBe('2025-12');
    expect(m.at(-1)).toEqual({ month: '2026-11', km: 60 });
    expect(m.find((x) => x.month === '2026-10').km).toBe(100);
    expect(m.find((x) => x.month === '2025-12').km).toBe(55);
    expect(m.reduce((s, x) => s + x.km, 0)).toBe(215); // 999 and the future ride stay out
  });
  it('builds the three numbers', () => {
    const s = velosStand({ rides, due: 2, today: '2026-11-24' });
    expect(s).toMatchObject({ km: 60, lastDays: 8, due: 2, any: true });
  });
  it('is quiet without any ride', () => {
    const s = velosStand({ rides: [], due: 0, today: '2026-11-24' });
    expect(s).toMatchObject({ km: 0, lastDays: null, due: 0, any: false });
  });
});
