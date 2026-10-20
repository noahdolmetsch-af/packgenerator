// «Aktiv neu» (Noah 20.10.2026 «2a 3a»): the day table of Strava, the app's rides and Fitbit, the week in
// numbers against the usual week, 12 weeks, the normal. Fictional data only.
import { describe, it, expect } from 'vitest';
import { dayTable, weekNumbers, weekSeries, normalOf, shown, WEEK_KEYS, METRICS, windowValue } from '../src/lib/messwerte.js';
import DE from '../src/lib/i18n/de/index.js';

const T = '2026-10-20';
const add = (d, n) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

describe('messwerte', () => {
  it('a day sums km of bike rides and other sports, weights pulse and power by time, takes the Fitbit day', () => {
    const t = dayTable({
      bikeRides: [{ date: T, km: 30, gainM: 400 }],
      acts: [
        { id: '1', day: T, kind: 'bike', km: 30, hm: 400, movingS: 3600, hrAvg: 140, wAvg: 200, wDevice: true },
        { id: '2', day: T, kind: 'run', km: 10, hm: 100, movingS: 1800, hrAvg: 155 },
        { id: '3', day: T, kind: 'run', km: 5, movingS: 900, hidden: true },
      ],
      health: [{ date: T, azm: 40, sleep: { asleepMin: 420 }, restingHr: 52, hrvMs: 45, steps: 9000 }],
    });
    const d = t.get(T);
    expect(d).toMatchObject({ km: 40, hm: 500, time: 5400, hr: 145, watt: 200, azm: 40, sleep: 420, rhr: 52, hrv: 45, steps: 9000 });
    expect(d.acts.map((a) => a.id)).toEqual(['1', '2']);
  });
  it('the week next to the mean of the 4 weeks before; a mean value is a mean, a sum is a sum', () => {
    const health = [];
    for (let i = 0; i < 35; i++) health.push({ date: add(T, -i), azm: i < 7 ? 30 : 20, restingHr: i < 7 ? 55 : 50 });
    const t = dayTable({ health });
    const w = Object.fromEntries(weekNumbers(t, T).map((r) => [r.key, r]));
    expect(w.azm).toMatchObject({ now: 210, base: 140, pct: 50, flat: false });
    expect(w.rhr).toMatchObject({ now: 55, base: 50, pct: 10 });
    expect(w.km.now).toBeNull();
    expect(windowValue(t, 'azm', add(T, -6), T)).toBe(210);
    expect(weekSeries(t, 'azm', T, 12)).toHaveLength(12);
    expect(weekSeries(t, 'azm', T, 12).at(-1)).toMatchObject({ to: T, v: 210 });
    expect(normalOf(t, 'rhr', T)).toMatchObject({ last: 55, mean7: 55, normal: 50 });
  });
  it('time and sleep read as hours', () => {
    expect(shown('time', 5400)).toBe('1 h 30');
    expect(shown('sleep', 425)).toBe('7 h 05');
    expect(shown('sleep', 40)).toBe('40 min');
  });
  it('every name and sentence has German; the card shows six values', () => {
    expect(WEEK_KEYS).toHaveLength(6);
    for (const m of METRICS) {
      expect(DE[m.name] ?? DE[m.name.replace(/\|\w+$/, '')], m.name).toBeTruthy();
      expect(DE[m.about], m.about).toBeTruthy();
    }
  });
});
