// «Auswerten neu»: the own normal over the years and the two patterns (bedtime, ride). Fictional data only.
import { describe, it, expect } from 'vitest';
import { normalOf, normal28, normalYears, shareBelow, placeIn, valuesOf, MIN } from '../src/lib/auswerten/normal.js';
import { bedMinutes, bedtimeGroups, rideHours, rideGroups, MIN_NIGHTS } from '../src/lib/auswerten/muster.js';
import { addDays } from '../src/lib/health.js';

const TODAY = '2026-10-20';

/** A table with one value per day for `n` days before TODAY; value = f(i), i = 1 for yesterday. */
const table = (n, f, key = 'hrv') => {
  const t = new Map();
  for (let i = 1; i <= n; i++) t.set(addDays(TODAY, -i), { [key]: f(i) });
  return t;
};

describe('normal: the usual range of the last 12 months', () => {
  it('gives the middle half and the middle, today not counted', () => {
    const t = table(100, (i) => 50 + i); // 51..150
    t.set(TODAY, { hrv: 999 });
    const n = normalOf(t, 'hrv', TODAY);
    expect(n.n).toBe(100);
    expect(n.median).toBeGreaterThan(95);
    expect(n.median).toBeLessThan(105);
    expect(n.q1).toBeLessThan(n.median);
    expect(n.q3).toBeGreaterThan(n.median);
    expect(n.q3).toBeLessThan(200);
    expect(n.to).toBe(addDays(TODAY, -1));
  });
  it('says nothing under the minimum of days', () => {
    expect(normalOf(table(MIN - 1, () => 70), 'hrv', TODAY)).toBeNull();
    expect(normalOf(table(MIN, () => 70), 'hrv', TODAY)).not.toBeNull();
  });
  it('counts only the last 365 days', () => {
    const t = table(500, (i) => (i <= 365 ? 70 : 10));
    const n = normalOf(t, 'hrv', TODAY);
    expect(n.median).toBe(70);
    expect(n.q1).toBe(70);
  });
  it('ignores days without the value', () => {
    const t = table(60, (i) => (i % 2 ? 70 : null));
    expect(valuesOf(t, 'hrv', addDays(TODAY, -60), TODAY).length).toBe(30);
  });
  it('gives the 28-day middle as the second number, null under 7 days', () => {
    const t = table(100, (i) => (i <= 28 ? 80 : 60));
    expect(normal28(t, 'hrv', TODAY)).toEqual({ median: 80, n: 28 });
    expect(normal28(table(6, () => 70), 'hrv', TODAY)).toBeNull();
  });
});

describe('normal: per year and shareBelow', () => {
  it('groups by year, oldest first, leaves out a thin year', () => {
    const t = new Map();
    for (let i = 0; i < 40; i++) t.set(addDays('2024-01-01', i), { hrv: 60 });
    for (let i = 0; i < 40; i++) t.set(addDays('2025-01-01', i), { hrv: 70 });
    for (let i = 0; i < 5; i++) t.set(addDays('2026-01-01', i), { hrv: 80 });
    const y = normalYears(t, 'hrv');
    expect(y.years.map((r) => r.year)).toEqual(['2024', '2025']);
    expect(y.years[0].median).toBe(60);
    expect(y.years[1].median).toBe(70);
    expect(y.all.n).toBe(85);
  });
  it('says how many of 100 days were lower', () => {
    const t = table(200, (i) => i); // 1..200
    expect(shareBelow(t, 'hrv', 101)).toBe(50);
    expect(shareBelow(t, 'hrv', 0)).toBe(0);
    expect(shareBelow(table(50, (i) => i), 'hrv', 10)).toBeNull();
  });
  it('places a value in or outside the usual range', () => {
    const n = { q1: 65, q3: 90 };
    expect(placeIn(n, 60)).toBe('below');
    expect(placeIn(n, 95)).toBe('above');
    expect(placeIn(n, 70)).toBe('usual');
    expect(placeIn(null, 70)).toBeNull();
  });
});

describe('muster: bedtime', () => {
  it('turns a time into minutes after noon', () => {
    expect(bedMinutes('22:30')).toBe(1350);
    expect(bedMinutes('00:30')).toBe(1470);
    expect(bedMinutes('23:00')).toBeLessThan(bedMinutes('00:30'));
    expect(bedMinutes('x')).toBeNull();
    expect(bedMinutes(null)).toBeNull();
  });
  it('compares the nights of the groups, says nothing with one group only', () => {
    const t = new Map();
    for (let i = 0; i < MIN_NIGHTS; i++) {
      t.set(addDays('2026-01-01', i), { hrv: 80, sleep: 450, night: { start: '22:00', deepMin: 70 } });
      t.set(addDays('2026-03-01', i), { hrv: 60, sleep: 380, night: { start: '01:00', deepMin: 50 } });
    }
    const g = bedtimeGroups(t);
    expect(g.length).toBe(4);
    expect(g[0].hrv).toBe(80);
    expect(g[2].hrv).toBe(60);
    expect(g[2].n).toBe(MIN_NIGHTS);
    const one = new Map([...t].filter(([, r]) => r.night.start === '22:00'));
    expect(bedtimeGroups(one)).toEqual([]);
  });
});

describe('muster: ride', () => {
  const rides = (h) => ({ acts: [{ kind: 'bike', movingS: h * 3600 }] });
  it('sums the bike hours of a day, skips hidden and other kinds', () => {
    expect(rideHours({ acts: [{ kind: 'bike', movingS: 3600 }, { kind: 'bike', movingS: 1800, hidden: true }, { kind: 'run', movingS: 3600 }] })).toBe(1);
    expect(rideHours({})).toBe(0);
  });
  it('compares the night after a day without a ride and after a long ride', () => {
    const t = new Map();
    for (let i = 0; i < MIN_NIGHTS; i++) {
      const none = addDays('2026-01-01', i * 2);
      const long = addDays('2026-05-01', i * 2);
      t.set(none, {});
      t.set(addDays(none, 1), { hrv: 80, sleep: 450 });
      t.set(long, rides(4));
      t.set(addDays(long, 1), { hrv: 62, sleep: 420 });
    }
    const g = rideGroups(t, addDays);
    expect(g.find((x) => x.key === 'none').hrv).toBe(80);
    expect(g.find((x) => x.key === 'long').hrv).toBe(62);
  });
  it('says nothing without enough days in both groups', () => {
    const t = new Map();
    for (let i = 0; i < MIN_NIGHTS; i++) {
      const d = addDays('2026-01-01', i * 2);
      t.set(d, {});
      t.set(addDays(d, 1), { hrv: 80, sleep: 450 });
    }
    expect(rideGroups(t, addDays)).toEqual([]);
  });
});

describe('form: recovery against the 12-month normal', () => {
  it('uses the 12 months as the normal and the last 28 days as the second number', async () => {
    const { recoveryParts } = await import('../src/lib/form.js');
    const t = new Map();
    for (let i = 1; i <= 400; i++) t.set(addDays(TODAY, -i), { hrv: i <= 28 ? 90 : 70, rhr: i <= 28 ? 50 : 55 });
    t.set(TODAY, { hrv: 70, rhr: 55 });
    const hrv = recoveryParts(t, TODAY).find((p) => p.key === 'hrv');
    expect(hrv.normal).toBe(70); // 337 of 365 days are 70
    expect(hrv.normal28).toBe(90);
    expect(hrv.delta).toBe(0);
    const rhr = recoveryParts(t, TODAY).find((p) => p.key === 'rhr');
    expect(rhr.normal28).toBe(50);
  });
});
