// «Wochenstand» (Noah 24.11.2026 «1-3»): the quiet line on the week card. Fictional data only.
import { describe, it, expect } from 'vitest';
import { weekStand } from '../src/lib/home/wochenstand.js';

const monday = '2026-11-09';
const sunday = '2026-11-15';
const walk = (day, min) => ({ id: `w${day}`, day, kind: 'hike', type: 'Walk', movingS: min * 60 });
const rec = (extra = {}) => ({ name: 'Outdoors', goalMin: 90, from: '2026-11-05', until: '2026-12-31', hand: {}, stopped: false, closed: false, ...extra });

describe('the week stand', () => {
  it('counts the days of the week that reached the goal, Strava and by hand together', () => {
    const acts = [walk('2026-11-09', 100), walk('2026-11-10', 60), walk('2026-11-12', 95)];
    const r = rec({ hand: { '2026-11-10': [30], '2026-11-14': [90] } });
    expect(weekStand({ rec: r, acts, monday, sunday }).outdoor).toEqual({ days: 4, of: 7 });
  });
  it('counts only the days the challenge covered (it started on Wednesday)', () => {
    const r = rec({ from: '2026-11-11', hand: { '2026-11-11': [90] } });
    expect(weekStand({ rec: r, monday, sunday }).outdoor).toEqual({ days: 1, of: 5 });
  });
  it('has no outdoor part without a challenge, with an ended one, or one that starts later', () => {
    expect(weekStand({ rec: null, monday, sunday }).outdoor).toBe(null);
    expect(weekStand({ rec: rec({ stopped: true }), monday, sunday }).outdoor).toBe(null);
    expect(weekStand({ rec: rec({ from: '2026-11-20' }), monday, sunday }).outdoor).toBe(null);
  });
  it('counts the days with a meditation session in the week, once per day', () => {
    const log = [
      { actId: 'meditation', day: '2026-11-09', min: 10 },
      { actId: 'meditation', day: '2026-11-09', min: 5 },
      { actId: 'meditation', day: '2026-11-13', min: 20 },
      { actId: 'meditation', day: '2026-11-16', min: 20 }, // next week
      { actId: 'yoga', day: '2026-11-10', min: 30 },
    ];
    expect(weekStand({ log, medIds: ['meditation'], monday, sunday }).med).toEqual({ days: 2 });
    expect(weekStand({ log: [], medIds: ['meditation'], monday, sunday }).med).toBe(null);
  });
  it('gives nothing without a week', () => {
    expect(weekStand({})).toEqual({ outdoor: null, med: null });
  });
});
