// «Heute neu» N2 (Noah 20.10.2026 «5a»): «Dein Körper heute», four values of today next to yesterday. Fictional data.
import { describe, it, expect } from 'vitest';
import { bodyToday, bodyWeek, valueOf, dirOf, BODY_KEYS } from '../src/lib/home/body.js';
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
});
