// «Training verbessern» 2 (Noah 2.11.2026): the suggestion for the training week. Fictional only.
import { describe, it, expect } from 'vitest';
import { suggestWeek, weeklySports, VARIANTS } from '../src/lib/training/suggest.js';

const MON = '2026-11-02';
const base = { monday: MON, today: MON, goal: { hours: 8, base: 80 } };
const yoga = { id: 'yoga', name: 'Yoga', mins: 30, perWeek: 1 };

describe('suggestWeek', () => {
  it('builds about the goal hours, one session per day at most, sorted by day', () => {
    const r = suggestWeek(base);
    expect(r.mins).toBeGreaterThan(8 * 60 * 0.9);
    expect(r.mins).toBeLessThan(8 * 60 * 1.1);
    const days = r.sessions.map((s) => s.day);
    expect(new Set(days).size).toBe(days.length);
    expect([...days].sort()).toEqual(days);
    expect(r.why[0].key).toMatch(/from your goal/);
  });
  it('keeps the share in Z1–Z2 at the goal or above', () => {
    const r = suggestWeek({ ...base, goal: { hours: 6, base: 95 } });
    expect(r.sessions.every((s) => !s.zone || s.zone <= 2)).toBe(true);
  });
  it('is lighter in the race week and when tired', () => {
    const full = suggestWeek(base).mins;
    expect(suggestWeek({ ...base, daysToRace: 4 }).mins).toBeLessThan(full * 0.6);
    expect(suggestWeek({ ...base, level: 'rest' }).mins).toBeLessThan(full * 0.7);
  });
  it('puts sports of Aktiv in as their own sessions', () => {
    const r = suggestWeek({ ...base, sports: [yoga] });
    const s = r.sessions.find((x) => x.sport === 'yoga');
    expect(s).toMatchObject({ kind: 'other', mins: 30 });
    expect(r.why.some((w) => w.key.startsWith('Your sports'))).toBe(true);
  });
  it('leaves out days that have passed', () => {
    const r = suggestWeek({ ...base, today: '2026-11-06' });
    expect(r.sessions.every((s) => s.day >= '2026-11-06')).toBe(true);
    expect(r.why.some((w) => /passed/.test(w.key))).toBe(true);
  });
  it('has different layouts', () => {
    const l = Array.from({ length: VARIANTS }, (_, v) => suggestWeek({ ...base, variant: v }).sessions.map((s) => s.day).join());
    expect(new Set(l).size).toBe(VARIANTS);
  });
  it('without goal uses the recent weeks, else 6 hours', () => {
    expect(suggestWeek({ monday: MON, today: MON, recentMins: 300 }).why[0].key).toMatch(/last weeks/);
    expect(suggestWeek({ monday: MON, today: MON }).why[0].key).toMatch(/Set a goal/);
  });
});

describe('weeklySports', () => {
  const g = (count, days = 7) => ({ id: 'g', count, days });
  it('takes moving sports with a goal, not the core kinds, paused ones or meditation', () => {
    const acts = [
      { id: 'yoga', name: 'Yoga', ring: 'move', goals: [g(2)], minMin: 30, order: 1 },
      { id: 'bike', name: 'Bike', ring: 'move', goals: [g(3)], order: 0 },
      { id: 'climb', name: 'Climbing', ring: 'move', goals: [g(1, 30)], order: 2 },
      { id: 'gym', name: 'Gym', ring: 'move', goals: [g(1)], paused: true, order: 3 },
      { id: 'meditation', name: 'Meditation', ring: 'mind', goals: [g(7)], order: 4 },
    ];
    expect(weeklySports(acts, MON).map((s) => s.id)).toEqual(['yoga']);
  });
});
