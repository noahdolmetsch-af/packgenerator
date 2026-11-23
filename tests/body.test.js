// «Heute neu» N2 (Noah 20.10.2026 «5a»): «Dein Körper heute», four values of today next to yesterday. Fictional data.
import { describe, it, expect } from 'vitest';
import { bodyToday, bodyWeek, valueOf, dirOf, usualOf, offOf, fetchedOf, stepsByNow, BODY_KEYS, BANNER_KEYS } from '../src/lib/home/body.js';
import { addDays } from '../src/lib/health.js';

const T = '2026-10-09';
const Y = '2026-10-08';

describe('«Dein Körper heute»', () => {
  it('four values, today next to yesterday, an arrow for up and down', () => {
    const rows = [
      { date: Y, restingHr: 52, azm: 40, sleep: { asleepMin: 420, efficiency: 90 } },
      { date: T, restingHr: 55, azm: 12, sleep: { asleepMin: 450, efficiency: 90 } },
    ];
    const b = bodyToday(rows, T);
    expect(b.any).toBe(true);
    expect(b.rows.map((r) => r.key)).toEqual(BODY_KEYS);
    const by = Object.fromEntries(b.rows.map((r) => [r.key, r]));
    expect(by.pulse).toMatchObject({ now: 55, before: 52, dir: 1 });
    expect(by.sleep).toMatchObject({ now: 7.5, before: 7, dir: 1 });
    expect(by.score).toMatchObject({ now: 90, before: 90, dir: 0, kind: 'efficiency' });
    expect(by.azm).toMatchObject({ now: 12, before: 40, dir: -1 });
  });
  it('Fitbit\'s own sleep score wins over the efficiency when a day has one', () => {
    expect(valueOf({ sleep: { asleepMin: 400, score: 81, efficiency: 93 } }, 'score')).toBe(81);
    expect(bodyToday([{ date: T, sleep: { asleepMin: 400, score: 81 } }], T).rows.find((r) => r.key === 'score').kind).toBe('score');
  });
  it('nothing is invented: missing values stay empty, without an arrow', () => {
    const b = bodyToday([{ date: T, restingHr: 50 }], T);
    expect(b.rows.find((r) => r.key === 'pulse')).toMatchObject({ now: 50, before: null, dir: null });
    expect(b.rows.find((r) => r.key === 'sleep').now).toBeNull();
    expect(bodyToday([], T).any).toBe(false);
    expect(bodyToday([{ date: '2026-09-01', restingHr: 50 }], T).any).toBe(false);
    expect(dirOf(null, 3)).toBeNull();
    expect(valueOf({ sleep: { asleepMin: 0 } }, 'sleep')).toBeNull();
  });
  it('the sheet: this week next to the week before, and where today stands in the last 4 weeks', () => {
    // 14 fictional days: pulse 50 in the week before, 54 this week, today 56; 20 days ago a low of 46
    const rows = [{ date: addDays(T, -20), restingHr: 46 }];
    for (let i = 0; i < 14; i++) rows.push({ date: addDays(T, -i), restingHr: i === 0 ? 56 : i < 7 ? 54 : 50, azm: i < 7 ? 30 : null });
    const w = bodyWeek(rows, T);
    const by = Object.fromEntries(w.rows.map((r) => [r.key, r]));
    expect(w.any).toBe(true);
    expect(by.pulse).toMatchObject({ now: 56, day: T, min: 46, max: 56, share: 1, prev: 50, dir: 1 });
    expect(by.pulse.week).toBeCloseTo(54.3, 1);
    expect(by.azm).toMatchObject({ now: 30, week: 30, prev: null, dir: null, share: 1 });
    expect(by.sleep).toMatchObject({ now: null, share: null, week: null });
  });
  it('the sheet takes the last day with a value when today has none yet, and never invents one', () => {
    const w = bodyWeek([{ date: addDays(T, -2), restingHr: 51 }, { date: addDays(T, -3), restingHr: 55 }], T);
    expect(w.rows.find((r) => r.key === 'pulse')).toMatchObject({ now: 51, day: addDays(T, -2), share: 0 });
    expect(bodyWeek([], T).any).toBe(false);
  });
  it('Noah 7.11.2026 «1a»: a value without a reading today carries the last one of the last 7 days, with its day', () => {
    // the night and the pulse of today have not come yet, the active zone minutes have
    const rows = [
      { date: Y, restingHr: 54, azm: 30, sleep: { asleepMin: 180, efficiency: 94 } },
      { date: T, azm: 10 },
    ];
    const by = Object.fromEntries(bodyToday(rows, T).rows.map((r) => [r.key, r]));
    expect(by.pulse).toMatchObject({ now: null, last: { value: 54, day: Y } });
    expect(by.sleep).toMatchObject({ now: null, last: { value: 3, day: Y } });
    expect(by.score).toMatchObject({ now: null, last: { value: 94, day: Y }, kind: 'efficiency' });
    expect(by.azm).toMatchObject({ now: 10, last: null });
    // 3 days back still counts, 8 days back does not
    expect(bodyToday([{ date: addDays(T, -3), restingHr: 49 }], T).rows[0].last).toEqual({ value: 49, day: addDays(T, -3) });
    expect(bodyToday([{ date: addDays(T, -8), restingHr: 49 }], T).rows[0].last).toBeNull();
  });
});

describe('«Dein Körper heute» as a banner (Noah 23.11.2026)', () => {
  // 30 fictional days before today: sleep 6 h 15 (375 min), HRV 60, resting pulse 50; today a short night and a low HRV
  const days = Array.from({ length: 30 }, (_, i) => ({ date: addDays(T, -(i + 1)), restingHr: 50, hrvMs: 60, sleep: { asleepMin: 375 }, azm: 40 }));
  it('the banner has the pulse, the zone minutes, sleep and HRV, in this order; the sleep score stays in the sheet', () => {
    expect(BANNER_KEYS).toEqual(['pulse', 'azm', 'sleep', 'hrv', 'steps']);
    expect(BODY_KEYS).toContain('score');
    expect(BODY_KEYS).toContain('hrv');
  });
  it('the usual value is the median of the 30 days before; without 7 values there is none', () => {
    expect(usualOf(days, 'sleep', T)).toBe(6.3);
    expect(usualOf(days, 'hrv', T)).toBe(60);
    expect(usualOf(days.slice(0, 5), 'hrv', T)).toBeNull();
    expect(usualOf(days, 'pulse', T)).toBeNull();
  });
  it('a value far from the usual (15 % or more) gets a quiet mark, never a verdict', () => {
    expect(offOf(3.9, 6.3)).toBe(-1);
    expect(offOf(36, 60)).toBe(-1);
    expect(offOf(70, 60)).toBe(1);
    expect(offOf(6, 6.3)).toBe(0);
    expect(offOf(null, 6.3)).toBeNull();
    expect(offOf(5, null)).toBeNull();
  });
  it('bodyToday carries the usual value, the mark and when the day was fetched', () => {
    const rows = [...days, { date: T, restingHr: 54, hrvMs: 36, sleep: { asleepMin: 235 }, azm: 12, at: `${T}T05:12:00.000Z` }];
    const by = Object.fromEntries(bodyToday(rows, T).rows.map((r) => [r.key, r]));
    expect(by.sleep).toMatchObject({ now: 3.9, usual: 6.3, off: -1 });
    expect(by.hrv).toMatchObject({ now: 36, usual: 60, off: -1 });
    expect(by.azm).toMatchObject({ now: 12, before: 40 });
    expect(by.pulse.fetched).toMatchObject({ day: 'today' });
  });
  it('a value of an earlier day says that day and when it was fetched', () => {
    const y = addDays(T, -1);
    const rows = [{ date: y, restingHr: 52, at: `${y}T20:40:00.000Z` }];
    const p = bodyToday(rows, T).rows.find((r) => r.key === 'pulse');
    expect(p.now).toBeNull();
    expect(p.last).toMatchObject({ value: 52, day: y });
    expect(p.fetched).toMatchObject({ day: 'yesterday' });
  });
  it('«fetched» tells today, yesterday or the day, and the time; nothing without a time', () => {
    expect(fetchedOf('2026-10-09T05:12:00.000Z', T, 'UTC')).toEqual({ day: 'today', hm: '05:12' });
    expect(fetchedOf('2026-10-08T21:40:00.000Z', T, 'UTC')).toEqual({ day: 'yesterday', hm: '21:40' });
    expect(fetchedOf('2026-10-05T10:00:00.000Z', T, 'UTC')).toEqual({ day: '2026-10-05', hm: '10:00' });
    expect(fetchedOf(undefined, T)).toBeNull();
    expect(fetchedOf('nonsense', T)).toBeNull();
  });
});

describe('the steps of the banner: today next to yesterday up to the same hour', () => {
  const hours = (per) => Array.from({ length: 24 }, (_, h) => (h >= 6 && h < 22 ? per : 0));
  it('yesterday by now counts the hours that have begun', () => {
    expect(stepsByNow({ stepH: hours(100) }, 9)).toBe(400); // hours 6, 7, 8, 9
    expect(stepsByNow({ stepH: hours(100) }, 23)).toBe(1600);
    expect(stepsByNow({ stepH: hours(100) }, 3)).toBe(0);
    expect(stepsByNow({ stepH: [1, 2] }, 9)).toBeNull();
    expect(stepsByNow({}, 9)).toBeNull();
    expect(stepsByNow({ stepH: hours(100) }, null)).toBeNull();
    expect(stepsByNow({ stepH: new Array(24).fill(null) }, 9)).toBeNull();
  });
  it('bodyToday: steps with yesterday by now and a quiet mark far from it', () => {
    const rows = [{ date: addDays(T, -1), steps: 9000, stepH: hours(100) }, { date: T, steps: 700, stepH: hours(100) }];
    const s = bodyToday(rows, T, 9).rows.find((r) => r.key === 'steps');
    expect(s).toMatchObject({ now: 700, before: 9000, byNow: 400, off: 1 });
    const none = bodyToday([{ date: addDays(T, -1), steps: 9000 }, { date: T, steps: 700 }], T, 9).rows.find((r) => r.key === 'steps');
    expect(none).toMatchObject({ now: 700, before: 9000, byNow: null, off: null });
    expect(valueOf({ steps: 4210.4 }, 'steps')).toBe(4210);
    expect(valueOf({ steps: -1 }, 'steps')).toBeNull();
  });
});
