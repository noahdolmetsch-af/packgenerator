// «Training verbessern» 2 (Noah 2.11.2026): the suggestion for the training week. Fictional only.
import { describe, it, expect } from 'vitest';
import { suggestWeek, weeklySports, VARIANTS, FOCUS } from '../src/lib/training/suggest.js';

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
  });
  it('leaves out days that have passed', () => {
    const r = suggestWeek({ ...base, today: '2026-11-06' });
    expect(r.sessions.every((s) => s.day >= '2026-11-06')).toBe(true);
  });
  it('takes the hours the person set, not the goal', () => {
    const r = suggestWeek({ ...base, hoursSet: 4 });
    expect(r.hours).toBe(4);
    expect(r.mins).toBeLessThan(4 * 60 * 1.1);
    expect(r.why.some((w) => /from your goal/.test(w.key))).toBe(false);
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

describe('harder, easier, focus', () => {
  const full = suggestWeek(base);
  it('harder is more time and more effort, easier less', () => {
    expect(suggestWeek({ ...base, push: 1 }).mins).toBeGreaterThan(full.mins);
    expect(suggestWeek({ ...base, push: -1 }).mins).toBeLessThan(full.mins);
    expect(Math.max(...suggestWeek({ ...base, push: 1 }).sessions.map((s) => s.zone ?? 0))).toBeGreaterThan(Math.max(...full.sessions.map((s) => s.zone ?? 0)));
    expect(suggestWeek({ ...base, push: -1 }).sessions.every((s) => !s.zone || s.zone <= 2)).toBe(true);
  });
  it('intervals: two hard sessions; strength: two strength sessions; recovery: shorter and calm', () => {
    expect(suggestWeek({ ...base, focus: 'hit' }).sessions.filter((s) => s.zone === 4)).toHaveLength(2);
    const k = suggestWeek({ ...base, focus: 'kraft', strengthSport: 'gym' });
    expect(k.sessions.filter((s) => s.sport === 'gym')).toHaveLength(2);
    const r = suggestWeek({ ...base, focus: 'ruhe' });
    expect(r.mins).toBeLessThan(full.mins * 0.7);
    expect(r.sessions.every((s) => !s.zone || s.zone <= 2)).toBe(true);
  });
  it('knows four focuses and falls back to endurance', () => {
    expect(FOCUS).toHaveLength(4);
    expect(suggestWeek({ ...base, focus: 'x' }).mins).toBe(full.mins);
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

describe('free days and time per day (3a)', () => {
  it('leaves a free day empty and moves its session to an open day', () => {
    const r = suggestWeek({ ...base, dayLimits: { 5: 0 } }); // Saturday free
    expect(r.sessions.some((s) => s.day === '2026-11-07')).toBe(false);
    expect(r.sessions.length).toBeGreaterThanOrEqual(3);
    const days = r.sessions.map((s) => s.day);
    expect(new Set(days).size).toBe(days.length);
    expect(r.why.some((w) => /free days stay free/.test(w.key))).toBe(true);
  });
  it('shortens sessions on a day with little time', () => {
    const open = suggestWeek(base).sessions.find((s) => s.day === '2026-11-07');
    const capped = suggestWeek({ ...base, dayLimits: { 5: 30 } }).sessions.find((s) => s.day === '2026-11-07');
    expect(open.mins).toBeGreaterThan(30);
    expect(capped.mins).toBe(30);
  });
  it('leaves nothing on all-free weeks', () => {
    const r = suggestWeek({ ...base, dayLimits: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } });
    expect(r.sessions).toEqual([]);
  });
});

describe('weather in the suggestion (3b)', () => {
  const dry = (except) => Object.fromEntries(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'].map((d) => [d, except.includes(d) ? 'rain' : 'none']));
  const longDay = (r) => r.sessions.find((s) => /Long session/.test(s.name)).day;
  it('moves the long session off a rainy day to a drier one', () => {
    const plain = longDay(suggestWeek(base));
    const wet = suggestWeek({ ...base, wx: dry([plain]) });
    expect(longDay(wet)).not.toBe(plain);
    expect(wet.why.some((w) => /drier day/.test(w.key))).toBe(true);
    const days = wet.sessions.map((s) => s.day);
    expect(new Set(days).size).toBe(days.length);
  });
  it('swaps with a dry core session when every day is taken', () => {
    const full = { ...base, sports: [yoga, { ...yoga, id: 'plank', name: 'Plank' }, { ...yoga, id: 'rope', name: 'Rope' }] };
    const plain = suggestWeek(full);
    const ld = longDay(plain);
    const wet = suggestWeek({ ...full, wx: dry([ld]) });
    expect(longDay(wet)).not.toBe(ld);
    expect(wet.sessions.length).toBe(plain.sessions.length);
  });
  it('keeps it and says so when no day is drier', () => {
    const all = dry(Object.keys(dry([])));
    const r = suggestWeek({ ...base, wx: all });
    expect(r.why.some((w) => /no drier day/.test(w.key))).toBe(true);
  });
  it('changes nothing without a forecast', () => {
    expect(suggestWeek({ ...base, wx: {} })).toEqual(suggestWeek(base));
  });
});

describe('goal per sport (3c)', () => {
  const acts = [
    { id: 'yoga', name: 'Yoga', ring: 'move', order: 1, goals: [{ count: 1, days: 7 }] },
    { id: 'swim', name: 'Swimming', ring: 'move', order: 2, goals: [] },
  ];
  it('lists every sport as a candidate, with 0 for none', async () => {
    const { candidateSports } = await import('../src/lib/training/suggest.js');
    expect(candidateSports(acts, MON).map((c) => [c.id, c.perWeek])).toEqual([['yoga', 1], ['swim', 0]]);
  });
  it('lets the number set in the suggestion win over the goal in Aktiv', () => {
    expect(weeklySports(acts, MON).map((s) => s.id)).toEqual(['yoga']);
    expect(weeklySports(acts, MON, { yoga: 0, swim: 2 }).map((s) => [s.id, s.perWeek])).toEqual([['swim', 2]]);
    expect(weeklySports(acts, MON, { yoga: 9 })[0].perWeek).toBe(3);
  });
  it('gives a sport set here a place before sports that only have a goal in Aktiv', () => {
    const many = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, name: id, ring: 'move', order: i, goals: [{ count: 1, days: 7 }] }));
    many.push({ id: 'z', name: 'Z', ring: 'move', order: 9, goals: [] });
    expect(weeklySports(many, MON).map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(weeklySports(many, MON, { z: 1 }).map((s) => s.id)).toEqual(['z', 'a', 'b']);
  });
});

describe('one session of a wanted sport stays (3c)', () => {
  it('keeps a long sport session even when it is over a third of a short week', () => {
    const r = suggestWeek({ ...base, goal: { hours: 3, base: 80 }, sports: [{ id: 'rowing', name: 'Rowing', mins: 120, perWeek: 1 }] });
    expect(r.sessions.filter((s) => s.sport === 'rowing').length).toBe(1);
  });
});

describe('own changes are remembered (3d)', () => {
  const sug0 = () => suggestWeek(base).sessions;
  const tempo = () => sug0().find((s) => s.name === 'Tempo session');
  it('learns from removing a session and applies it only after two times', async () => {
    const { learnHabits } = await import('../src/lib/training/suggest.js');
    const before = sug0();
    const gone = tempo();
    const after = before.filter((s) => s.id !== gone.id);
    const once = learnHabits(null, before, after);
    expect(once.drop[gone.name]).toBe(1);
    expect(suggestWeek({ ...base, habits: once }).sessions.some((s) => s.name === gone.name)).toBe(true);
    const twice = learnHabits(once, before, after);
    expect(twice.drop[gone.name]).toBe(2);
    const r = suggestWeek({ ...base, habits: twice });
    expect(r.sessions.some((s) => s.name === gone.name)).toBe(false);
    expect(r.why.some((w) => /twice/.test(w.key) && w.vars.name === gone.name)).toBe(true);
  });
  it('learns minutes and never drops the long session', async () => {
    const { learnHabits } = await import('../src/lib/training/suggest.js');
    const before = sug0();
    const t0 = tempo();
    const longS = before.find((s) => s.name === 'Long session, calm');
    const after = before.map((s) => (s.id === t0.id ? { ...s, mins: s.mins * 2 } : s)).filter((s) => s.id !== longS.id);
    let h = learnHabits(null, before, after);
    h = learnHabits(h, before, after);
    expect(h.mins[t0.name].ratio).toBeCloseTo(2, 1);
    const r = suggestWeek({ ...base, habits: h });
    expect(r.sessions.find((s) => s.name === t0.name).mins).toBeGreaterThan(t0.mins * 1.4);
    expect(r.sessions.some((s) => s.name === 'Long session, calm')).toBe(true);
  });
  it('forgets a little when taken as suggested', async () => {
    const { learnHabits } = await import('../src/lib/training/suggest.js');
    const before = sug0();
    const h = learnHabits({ drop: { 'Easy spin': 1 }, mins: {} }, before, before);
    expect(h.drop['Easy spin']).toBeUndefined();
  });
});
