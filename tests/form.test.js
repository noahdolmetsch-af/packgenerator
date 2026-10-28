// «Form und Erholung» (Noah 20.10.2026 «1a 2b 3a 4a 5a») and the Garmin overview: load, fitness,
// fatigue, form, readiness 0–100, the recovery hint, tour readiness, the overview numbers.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { loadOf, dayLoads, formSeries, recoveryParts, readiness, recoveryAlarm, tourOf, pastTours, RAMP_MAX, shownForm, formWeeksOf, weekForm } from '../src/lib/form.js';
import { formOf } from '../src/lib/form-data.js';
import { dayTable } from '../src/lib/messwerte.js';
import { focus, lastWeek, caloriesOf, stats, hrStats, kindsOf, windowOf, monthStart, kindDay } from '../src/lib/uebersicht.js';
import { daysFrom, chunks, pick } from '../api/_lib/googledays.js';
import { cleanDay, mergeDay } from '../src/lib/health.js';

const T = '2026-10-20';
const add = (d, n) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

describe('form: load', () => {
  it('power first, then Strava effort, then pulse', () => {
    expect(loadOf({ wDevice: true, wNorm: 200, movingS: 3600 }, { ftp: 200 })).toEqual({ load: 100, how: 'power' });
    expect(loadOf({ wDevice: false, wNorm: 200, movingS: 3600, effort: 77 }, { ftp: 200 })).toEqual({ load: 77, how: 'effort' });
    const p = loadOf({ movingS: 3600, hrAvg: 150 }, { rest: 50, max: 190 });
    expect(p.how).toBe('pulse');
    expect(p.load).toBeGreaterThan(50);
    expect(p.load).toBeLessThan(150);
    expect(loadOf({ movingS: 3600 })).toBeNull();
    expect(loadOf({ hidden: true, effort: 40 })).toBeNull();
  });
  it('sums the loads per day', () => {
    const m = dayLoads([
      { day: T, effort: 40 },
      { day: T, effort: 20 },
      { day: add(T, -1), effort: 10 },
    ]);
    expect(m.get(T)).toBe(60);
    expect(m.get(add(T, -1))).toBe(10);
  });
});

describe('form: fitness, fatigue, form', () => {
  it('a steady load: fitness and fatigue meet, form near 0', () => {
    const loads = new Map();
    for (let i = 0; i < 300; i++) loads.set(add(T, -i), 50);
    const s = formSeries(loads, add(T, -6), T);
    expect(s).toHaveLength(7);
    expect(s.at(-1).fat).toBeCloseTo(50, 0);
    expect(Math.abs(s.at(-1).form)).toBeLessThan(5);
  });
  it('a hard week: fatigue above fitness, form negative; a rest week: form positive', () => {
    const loads = new Map();
    for (let i = 7; i < 200; i++) loads.set(add(T, -i), 40);
    for (let i = 0; i < 7; i++) loads.set(add(T, -i), 150);
    expect(formSeries(loads, T, T)[0].form).toBeLessThan(-20);
    const rest = new Map();
    for (let i = 7; i < 200; i++) rest.set(add(T, -i), 60);
    expect(formSeries(rest, T, T)[0].form).toBeGreaterThan(10);
  });
});

describe('form: recovery and readiness', () => {
  const table = (today, over = {}) => {
    const h = [];
    for (let i = 1; i <= 30; i++) h.push({ date: add(today, -i), restingHr: 50, hrvMs: 50, sleep: { asleepMin: 450 } });
    h.push({ date: today, restingHr: 50, hrvMs: 50, sleep: { asleepMin: 450 }, ...over });
    return dayTable({ health: h });
  };
  it('a normal day counts nothing; a higher resting pulse and a short night pull down', () => {
    const p = recoveryParts(table(T), T);
    expect(p.map((x) => x.key)).toEqual(['rhr', 'hrv', 'sleep']);
    expect(p.every((x) => x.points === 0)).toBe(true);
    const bad = recoveryParts(table(T, { restingHr: 56, hrvMs: 40, sleep: { asleepMin: 330 } }), T);
    expect(bad.find((x) => x.key === 'rhr').points).toBe(-24);
    expect(bad.find((x) => x.key === 'hrv').delta).toBe(-20);
    expect(bad.find((x) => x.key === 'sleep').points).toBe(-12);
  });
  it('the felt sleep and energy of the morning check count (5a)', () => {
    const p = recoveryParts(new Map(), T, { sleep: 9, energy: 3 });
    expect(p.find((x) => x.key === 'feltSleep').points).toBe(7.5);
    expect(p.find((x) => x.key === 'energy').points).toBe(-9);
  });
  it('readiness 0–100 with a level and the main reason', () => {
    expect(readiness({ series: [], parts: [] })).toBeNull();
    const r = readiness({ series: [{ day: T, load: 0, fit: 0, fat: 0, form: 0 }], parts: [{ key: 'rhr', points: -24 }, { key: 'sleep', points: -6 }] });
    expect(r.score).toBe(30);
    expect(r.level).toBe('rest');
    expect(r.reason.key).toBe('rhr');
    const good = readiness({ series: [{ day: T, load: 50, fit: 50, fat: 30, form: 20 }], parts: [{ key: 'sleep', points: 5 }] });
    expect(good.score).toBe(85);
    expect(good.level).toBe('hard');
  });
  it('the ramp: fitness rising over 7 days', () => {
    const series = Array.from({ length: 8 }, (_, i) => ({ day: add(T, i - 7), load: 80, fit: 30 + i * 2, fat: 40, form: -10 }));
    expect(readiness({ series }).ramp).toBe(14);
    expect(RAMP_MAX).toBe(8);
  });
  it('the recovery hint needs two days in a row', () => {
    const h = [];
    for (let i = 2; i <= 32; i++) h.push({ date: add(T, -i), restingHr: 50, hrvMs: 50 });
    h.push({ date: add(T, -1), restingHr: 56, hrvMs: 40 });
    h.push({ date: T, restingHr: 57, hrvMs: 41 });
    expect(recoveryAlarm(dayTable({ health: h }), T)).toBe(true);
    h.pop();
    h.push({ date: T, restingHr: 50, hrvMs: 50 });
    expect(recoveryAlarm(dayTable({ health: h }), T)).toBe(false);
  });
});

describe('form: tour readiness (4a)', () => {
  const trips = [
    { id: 'a', title: 'Testtour', startDate: add(T, 3), days: 4 },
    { id: 'b', title: 'Idee', startDate: add(T, 1), days: 2, idea: true },
    { id: 'c', title: 'Alt', startDate: add(T, -40), days: 3 },
  ];
  it('the next trip within 7 days, before it starts', () => {
    const r = tourOf(trips, new Map(), T);
    expect(r).toMatchObject({ phase: 'before', inDays: 3 });
    expect(r.trip.id).toBe('a');
    expect(r.days).toHaveLength(4);
  });
  it('during a trip: the day number and the resting pulse per day', () => {
    const tb = dayTable({ health: [{ date: add(T, 3), restingHr: 51 }, { date: add(T, 4), restingHr: 55 }] });
    const r = tourOf(trips, tb, add(T, 4));
    expect(r).toMatchObject({ phase: 'during', dayNo: 2 });
    expect(r.days.map((d) => d.rhr)).toEqual([51, 55, null, null]);
    expect(r.days.map((d) => d.future)).toEqual([false, false, true, true]);
  });
  it('past multi-day trips with a resting pulse', () => {
    const tb = dayTable({ health: [{ date: add(T, -39), restingHr: 54 }] });
    const p = pastTours(trips, tb, T);
    expect(p).toHaveLength(1);
    expect(p[0].trip.id).toBe('c');
  });
});

describe('form: all together', () => {
  it('formOf reads the activities, the Fitbit days and the morning check', () => {
    const acts = [];
    for (let i = 0; i < 60; i += 2) acts.push({ id: String(i), day: add(T, -i), kind: 'bike', km: 40, movingS: 5400, effort: 90 });
    const health = Array.from({ length: 31 }, (_, i) => ({ date: add(T, -i), restingHr: 50, hrvMs: 50, sleep: { asleepMin: 450 } }));
    const f = formOf({ table: dayTable({ acts, health }), checks: [{ day: T, sleep: 8, energy: 8 }], today: T });
    expect(f.series).toHaveLength(84);
    expect(f.ready.score).toBeGreaterThanOrEqual(0);
    expect(f.ready.score).toBeLessThanOrEqual(100);
    expect(f.ready.parts.map((p) => p.key)).toContain('energy');
    expect(f.felt).toEqual({ sleep: 8, energy: 8 });
  });
});

describe('Garmin overview', () => {
  const acts = [
    { id: '1', day: T, kind: 'bike', km: 20.7, hm: 300, movingS: 4094, kcal: 600, hrMax: 158 },
    { id: '2', day: add(T, -2), kind: 'bike', km: 18, hm: 200, movingS: 3600, kj: 500 },
    { id: '3', day: add(T, -6), kind: 'bike', km: 62, hm: 800, movingS: 12000 },
    { id: '4', day: add(T, -1), kind: 'run', km: 8, hm: 50, movingS: 2700 },
    { id: '5', day: add(T, -20), kind: 'run', km: 5, movingS: 1800 },
  ];
  const health = [
    { date: T, restingHr: 46, kcal: 2400, kcalActive: 700, hrMax: 160 },
    { date: add(T, -1), restingHr: 50 },
  ];
  const tb = dayTable({ acts, health, bikeRides: [{ date: add(T, -3), km: 30, gainM: 100 }] });
  it('a sport per day; the bike counts the rides of the app too', () => {
    expect(kindDay(tb.get(T), 'bike')).toMatchObject({ km: 20.7, n: 1, kcal: 600 });
    expect(kindDay(tb.get(add(T, -3)), 'bike')).toMatchObject({ km: 30, n: 1, time: 0 });
    expect(kindsOf(tb, T)).toEqual(['bike', 'run']);
  });
  it('«Im Fokus»: 7 days, today on the right, 28 dots', () => {
    const f = focus(tb, T, 'bike');
    expect(f.bars).toHaveLength(7);
    expect(f.bars.at(-1)).toMatchObject({ day: T, km: 20.7 });
    expect(f.km).toBeCloseTo(130.7, 1);
    expect(f.dots).toHaveLength(28);
    expect(f.dots.at(-1).size).toBeGreaterThan(0);
  });
  it('«Letzte 7 Tage» and the calories of a day', () => {
    const w = lastWeek(tb, T);
    expect(w.kinds.map((k) => [k.kind, k.n])).toEqual([
      ['bike', 4],
      ['run', 1],
    ]);
    expect(w.rhr).toBe(48);
    expect(caloriesOf(tb.get(T))).toEqual({ total: 2400, active: 700, rest: 1700, src: 'fitbit' });
    expect(caloriesOf(tb.get(add(T, -2)))).toEqual({ total: null, active: 500, rest: null, src: 'strava' });
    expect(caloriesOf(undefined).src).toBeNull();
  });
  it('the sport page: 7 days, 4 weeks, a year by month; the heart rate page', () => {
    const s = stats(tb, T, 'bike', 'km', 'd7');
    expect(s.bars).toHaveLength(7);
    expect(s.total).toBeCloseTo(130.7, 1);
    expect(s.perDay).toBeCloseTo(130.7 / 7, 1);
    expect(s.acts.map((a) => a.id)).toEqual(['1', '2', '3']);
    expect(stats(tb, T, 'bike', 'km', 'w4').bars).toHaveLength(28);
    const y = stats(tb, T, 'run', 'time', 'y1');
    expect(y.bars).toHaveLength(12);
    expect(y.bars.at(-1).key).toBe('2026-10-01');
    expect(y.total).toBe(4500);
    expect(stats(tb, T, 'bike', 'km', 'd7', 1).to).toBe(add(T, -7));
    const h = hrStats(tb, T, 'd7');
    expect(h.rest).toBe(48);
    expect(h.high).toBe(160);
    expect(h.days[0]).toEqual({ key: T, rest: 46, high: 160 });
    expect(windowOf('y1', T).from).toBe('2025-11-01');
    expect(monthStart('2026-01-15', -1)).toBe('2025-12-01');
  });
});

describe('Fitbit calories and highest pulse', () => {
  it('reads the roll-ups tolerantly and keeps the values', () => {
    expect(chunks('2026-10-01', '2026-10-30').map((c) => c.join('…'))).toEqual(['2026-10-01…2026-10-14', '2026-10-15…2026-10-28', '2026-10-29…2026-10-30']);
    expect(pick({ totalCalories: { kcalSum: 2100.4 } }, /kcal/i)).toBe(2100.4);
    const date = { year: 2026, month: 10, day: 20 };
    const rows = daysFrom(
      {
        kcal: [{ civilStartTime: { date }, totalCalories: { kcalSum: 2100.4 } }],
        kcalActive: [{ civilStartTime: { date }, activeEnergyBurned: { kcalSum: 500 } }],
        hr: [{ civilStartTime: { date }, heartRate: { beatsPerMinuteMin: 45, beatsPerMinuteMax: 171 } }],
      },
      T,
      T,
    );
    // «Alle Werte» 27.10.2026: the lowest pulse of the day comes along
    expect(rows[0]).toEqual({ date: T, kcal: 2100, kcalActive: 500, hrMax: 171, hrMin: 45 });
    const c = cleanDay(rows[0]);
    expect(c).toEqual({ date: T, kcal: 2100, kcalActive: 500, hrMax: 171, hrMin: 45 });
    expect(mergeDay({ date: T, steps: 5 }, c, 'google', 'x')).toMatchObject({ steps: 5, kcal: 2100, hrMax: 171 });
  });
});

describe('form: the line of the Wochenrückblick', () => {
  it('fitness and form at the end of the week, the change against the week before', async () => {
    const { weekForm } = await import('../src/lib/form.js');
    const series = Array.from({ length: 10 }, (_, i) => ({ day: add(T, i - 9), load: i ? 50 : 0, fit: 20 + i, fat: 30, form: -10 + i }));
    expect(weekForm(series, T)).toEqual({ fit: 29, form: -1, delta: 7 });
    expect(weekForm(series.map((s) => ({ ...s, load: 0 })), T)).toBeNull();
    expect(weekForm(series, '2020-01-01')).toBeNull();
  });
});

// UI-Test 26.10.2026 T3 (G3-01): one calculation for Form, Training and the Wochenrückblick
describe('one form for every page', () => {
  const loads = new Map();
  for (let i = 0; i < 200; i++) loads.set(add(T, -i), i % 3 ? 40 : 90);
  it('the same day has the same numbers, whatever span a page shows', () => {
    const short = formSeries(loads, add(T, -83), T).at(-1);
    const long = formSeries(loads, add(T, -111), T).at(-1);
    expect(long).toEqual(short);
  });
  it('the shown form is the shown fitness minus the shown Müdigkeit', () => {
    expect(shownForm({ fit: 23.4, fat: 15.6, form: 7.8 })).toEqual({ fit: 23, fat: 16, form: 7 });
    expect(shownForm(null)).toEqual({ fit: 0, fat: 0, form: 0 });
  });
  it('Training: one point per week from the same series; today is the page «Form»', () => {
    const series = formSeries(loads, add(T, -111), T);
    const mons = ['2026-10-12', '2026-10-19'];
    const r = formWeeksOf(series, T, mons);
    expect(r.weeks.map((w) => w.monday)).toEqual(mons);
    expect(r.weeks[0]).toMatchObject(shownForm(series.find((s) => s.day === '2026-10-18')));
    expect(r.now).toEqual(shownForm(formSeries(loads, add(T, -83), T).at(-1)));
    expect(formWeeksOf([], T, mons)).toBeNull();
  });
  it('the Wochenrückblick rounds the same way', () => {
    const series = formSeries(loads, add(T, -83), T);
    expect(weekForm(series, T).form).toBe(shownForm(series.at(-1)).form);
  });
});
