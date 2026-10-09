// v0.51.0 «Im Flow – kleiner Start»: rolling goals, seasons, rings, the grid, ticking, the daily
// check, the countdown and the singing bowl schedule. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { seedActs, normAct, activeGoals, restsUntil, halfEnds, halfSince, actState, flowStates, rings, ringFill, summary, gridRow, lastDays, addDays, tripDays, entriesFor, tapSub, newEntry, lastEntryOn, moveAct, toggleMonth, goalWords } from '../src/lib/flow.js';
import { rotating, poolOf, SEED_QUESTIONS, answer, complete, nextOpen, yesterdayOf, averages, checkOf } from '../src/lib/flowcheck.js';
import { startTimer, elapsedSec, remainingSec, pauseTimer, resumeTimer, isDone, dueBowls, clock, loggedMinutes, timerOf } from '../src/lib/flowtimer.js';
import { bowlTimes, bowlOf, nextBowl, parseMarks, rand } from '../src/lib/flowbowl.js';
import { createDb, DATA_TABLES, SCHEMA_VERSION } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { ensureSeed, tick, deleteAct } from '../src/lib/flowdb.js';

const T = '2026-10-09'; // Friday
const acts = seedActs();
const A = Object.fromEntries(acts.map((a) => [a.id, a]));
let k = 0;
const e = (actId, day, extra = {}) => ({ id: `e${++k}`, actId, day, at: `${day}T08:00:00.000Z`, n: A[actId]?.perTap ?? 1, ...extra });

describe('the small start', () => {
  it('twelve activities, no real names, Sauna fixed in Erholung, Yoga with two sub-goals', () => {
    expect(acts.map((a) => a.id)).toEqual(['meditation', 'pushups', 'yoga', 'stretch', 'run', 'tennis', 'bike', 'hockey', 'climb', 'gym', 'spin', 'sauna']);
    expect(A.sauna.ring).toBe('rest');
    expect(A.meditation.ring).toBe('mind');
    expect(A.yoga.goals.map((g) => g.labelDe)).toEqual(['Yoga Studio', 'Zuhause']);
    expect(A.pushups).toMatchObject({ perTap: 10, goals: [{ count: 10, days: 1 }] });
    expect(A.climb.goals[0]).toMatchObject({ count: 1, days: 30 }); // «pro Monat» = last 30 days (1a)
    expect(A.bike.counts).toContain('commute');
  });
});

describe('seasons (fixed months per sport)', () => {
  it('Velo: summer 3/7 until October, winter 1/7', () => {
    expect(activeGoals(A.bike, T)[0]).toMatchObject({ count: 3, days: 7 });
    expect(activeGoals(A.bike, '2026-11-02')[0]).toMatchObject({ count: 1, days: 7 });
    expect(halfEnds(A.bike, T)).toBe('2026-10-31');
  });
  it('Gym and Indoor-Velo rest until 1 Nov; Eishockey is in winter since 1 Oct', () => {
    expect(activeGoals(A.gym, T)).toEqual([]);
    expect(restsUntil(A.gym, T)).toBe('2026-11-01');
    expect(restsUntil(A.spin, T)).toBe('2026-11-01');
    expect(activeGoals(A.hockey, T)[0]).toMatchObject({ count: 2, days: 30 });
    expect(halfSince(A.hockey, T)).toBe('2026-10-01');
    expect(halfEnds(A.hockey, T)).toBe('2027-03-31');
    expect(restsUntil(A.hockey, '2026-06-15')).toBe('2026-10-01');
  });
  it('a month tap moves it between summer and winter', () => {
    expect(toggleMonth([4, 5, 6], 5)).toEqual([4, 6]);
    expect(toggleMonth([4, 6], 5)).toEqual([4, 5, 6]);
  });
});

describe('rolling goals', () => {
  it('Laufen 1 in 10 days: met, due again in 4 days', () => {
    const s = actState(A.run, [e('run', '2026-10-03')], T);
    expect(s.met).toBe(true);
    expect(s.goals[0].dueIn).toBe(4);
    expect(actState(A.run, [e('run', '2026-09-29')], T).met).toBe(false); // 11 days ago: out of the window
  });
  it('a daily goal counts days reached in the last 7 and is open today', () => {
    const log = ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map((d) => e('meditation', d));
    const s = actState(A.meditation, log, T);
    expect(s.stand).toEqual({ n: 6, of: 7 });
    expect(s.open).toBe(true);
    expect(s.met).toBe(false);
    expect(actState(A.meditation, [...log, e('meditation', T)], T).stand).toEqual({ n: 7, of: 7 });
  });
  it('Liegestütze: one tap = 10 (the goal amount), 10 daily reached', () => {
    const one = newEntry(A.pushups, { day: T });
    expect(one.n).toBe(10);
    expect(actState(A.pushups, [one], T).open).toBe(false);
    expect(newEntry(A.pushups, { day: T, n: 25 }).n).toBe(25); // the amount can be typed (3)
  });
  it('Yoga: a tap goes to the sub-goal still open, a choice wins', () => {
    const s0 = actState(A.yoga, [], T);
    expect(tapSub(s0)).toBe('studio');
    const s1 = actState(A.yoga, [e('yoga', '2026-10-08', { sub: 'studio' })], T);
    expect(tapSub(s1)).toBe('home');
    expect(s1.stand).toEqual({ n: 1, of: 2 });
    expect(s1.met).toBe(false);
    expect(actState(A.yoga, [e('yoga', '2026-10-08', { sub: 'studio' }), e('yoga', T, { sub: 'home' })], T).met).toBe(true);
  });
  it('Velo: each commute counts as one ride, trip days count, «zählt auch» another activity', () => {
    const log = [e('bike', T, { via: 'commute' }), e('bike', T, { via: 'commute' })];
    const s = actState(A.bike, log, T, ['2026-10-05']);
    expect(s.goals[0].done).toBe(3);
    expect(s.met).toBe(true);
    expect(s.commuteToday).toBe(2);
    const withSpin = normAct({ ...A.bike, counts: ['spin'] });
    expect(entriesFor(withSpin, [e('spin', T)], []).length).toBe(1);
  });
  it('trip days: every day of a trip up to today, skipped trips not', () => {
    expect(tripDays([{ startDate: '2026-10-07', days: 3 }, { startDate: '2026-10-01', days: 1, skipped: true }], '2026-10-08')).toEqual(['2026-10-07', '2026-10-08']);
  });
});

describe('rings, summary and the grid', () => {
  const log = [e('meditation', '2026-10-08'), e('meditation', '2026-10-07'), e('run', '2026-10-03'), e('tennis', '2026-10-06'), e('sauna', '2026-10-05'), e('stretch', '2026-10-05'), e('climb', '2026-10-02')];
  const states = flowStates(acts, log, T);
  it('resting activities are not in the Bewegen ring', () => {
    const r = rings(states, log, T);
    expect(r.move.of).toBe(8); // pushups, yoga, stretch, run, tennis, bike, hockey, climb
    expect(r.move.n).toBe(3); // run, tennis, climb
    expect(r.mind).toEqual({ n: 2, of: 7 });
    expect(r.rest).toEqual({ n: 1, of: 2 });
    expect(ringFill(r.rest)).toBe(0.5);
  });
  it('the summary names what is on track and what is missing', () => {
    const s = summary(states);
    expect(s.met.map((a) => a.id)).toEqual(['run', 'tennis', 'climb']);
    expect(s.missing.find((m) => m.act.id === 'stretch').n).toBe(2);
    expect(s.missing.filter((m) => m.act.id === 'yoga').map((m) => m.goal.id)).toEqual(['studio', 'home']);
  });
  it('7 or 14 columns: done, open today, nothing', () => {
    const days = lastDays(T, 7);
    expect(days[0]).toBe('2026-10-03');
    const med = states.find((s) => s.act.id === 'meditation');
    expect(gridRow(med, log, days, T)).toEqual(['none', 'none', 'none', 'none', 'done', 'done', 'open']);
    expect(lastDays(T, 14)).toHaveLength(14);
  });
  it('paused activities leave the rings and the grid', () => {
    const paused = acts.map((a) => (a.id === 'tennis' ? { ...a, paused: true } : a));
    expect(flowStates(paused, log, T).some((s) => s.act.id === 'tennis')).toBe(false);
  });
});

describe('ticking and editing', () => {
  it('the last entry of today is what a second tap takes back', () => {
    const log = [e('pushups', T, { at: `${T}T07:00:00Z` }), e('pushups', T, { at: `${T}T09:00:00Z`, id: 'late' })];
    expect(lastEntryOn(log, 'pushups', T).id).toBe('late');
    expect(lastEntryOn(log, 'pushups', '2026-10-08')).toBeNull();
  });
  it('moving an activity renumbers the order', () => {
    const list = moveAct(acts, 'sauna', 0);
    expect(list[0].id).toBe('sauna');
    expect(list.map((a) => a.order)).toEqual(list.map((_, i) => i));
  });
  it('goal words', () => {
    expect(goalWords({ count: 1, days: 1 }).key).toBe('daily');
    expect(goalWords({ count: 10, days: 1 })).toEqual({ key: '{n} daily', vars: { n: 10 } });
    expect(goalWords({ count: 3, days: 7 })).toEqual({ key: '{n}× in {d} days', vars: { n: 3, d: 7 } });
  });
  it('a broken record is made whole', () => {
    const a = normAct({ id: 'x', ring: 'bogus', goals: [{ count: '2', days: 'x' }], season: { summer: [13, 4, 4] } });
    expect(a).toMatchObject({ ring: 'move', perTap: 1, goals: [{ id: 'g0', count: 2, days: 7 }], season: { summer: [4], winter: [] } });
  });
});

describe('the daily check', () => {
  it('the 4th question in turn: each of the ten every ten days', () => {
    const a = rotating(null, T).q.id;
    expect(rotating(null, addDays(T, 10)).q.id).toBe(a);
    expect(rotating(null, addDays(T, 1)).q.id).not.toBe(a);
    expect(new Set(lastDays(T, 10).map((d) => rotating(null, d).q.id)).size).toBe(10);
    expect(poolOf([])).toBe(SEED_QUESTIONS);
  });
  it('one answer at a time, the next open question, complete after four', () => {
    let c = checkOf(null, T);
    expect(nextOpen(c)).toBe('sleep');
    c = answer(c, 'sleep', 7, T);
    c = answer(c, 'energy', 6, T);
    expect(nextOpen(c)).toBe('mood');
    c = answer(c, 'mood', 8, T);
    c = answer(c, 'extra', 5, T, 'body');
    expect(complete(c)).toBe(true);
    expect(c.q).toBe('body');
  });
  it('yesterday marker and the 7-day mean', () => {
    const checks = [{ day: '2026-10-08', sleep: 6, energy: 7, mood: 7, q: 'calm', extra: 5 }, { day: '2026-10-07', sleep: 8, energy: 5, mood: 6 }];
    expect(yesterdayOf(checks, T, 'sleep')).toBe(6);
    expect(yesterdayOf(checks, T, 'extra', 'body')).toBeNull(); // another question yesterday
    expect(averages(checks, T).sleep.mean).toBe(7);
    expect(averages(checks, T).sleep.series).toEqual([null, null, null, null, 8, 6, null]);
  });
});

describe('the countdown (from timestamps)', () => {
  const t0 = Date.parse('2026-10-09T07:00:00Z');
  it('counts down to the target and ends there', () => {
    const tm = startTimer({ actId: 'meditation', minutes: 10, now: t0, bowl: { ends: true } });
    expect(remainingSec(tm, t0 + 78_000)).toBe(522);
    expect(clock(remainingSec(tm, t0 + 78_000))).toBe('8:42');
    expect(isDone(tm, t0 + 600_000)).toBe(true);
    expect(remainingSec(tm, t0 + 900_000)).toBe(0); // never below zero
    expect(elapsedSec(tm, t0 + 900_000)).toBe(600);
  });
  it('a pause holds the time, also when the screen was locked', () => {
    let tm = startTimer({ actId: 'yoga', minutes: 5, now: t0 });
    tm = pauseTimer(tm, t0 + 60_000);
    expect(elapsedSec(tm, t0 + 600_000)).toBe(60);
    tm = resumeTimer(tm, t0 + 600_000);
    expect(elapsedSec(tm, t0 + 630_000)).toBe(90);
    expect(loggedMinutes(tm, t0 + 630_000)).toBe(2);
  });
  it('bowls: one sounds when due; missed ones while locked are skipped, the end still sounds', () => {
    let tm = startTimer({ actId: 'meditation', minutes: 10, now: t0, bowl: { ends: true, mode: 'every', every: 2 } });
    expect(tm.bowls).toEqual([0, 120, 240, 360, 480, 600]);
    let r = dueBowls(tm, t0 + 500);
    expect(r.play).toBe(0);
    tm = r.timer;
    r = dueBowls(tm, t0 + 121_000);
    expect(r.play).toBe(120);
    tm = r.timer;
    r = dueBowls(tm, t0 + 700_000); // the phone slept through 240 … 600
    expect(r.play).toBe(600);
    expect(r.timer.played).toEqual([0, 120, 240, 360, 480, 600]);
    expect(dueBowls(r.timer, t0 + 701_000).play).toBeNull();
  });
  it('a stored timer is checked', () => {
    expect(timerOf({ actId: 'x' })).toBeNull();
    expect(timerOf({ actId: 'x', targetSec: 60, startedAt: 1 })).toMatchObject({ pausedAt: null, played: [] });
  });
});

describe('the singing bowl schedule', () => {
  it('start and end, or not', () => {
    expect(bowlTimes(600, { ends: true })).toEqual([0, 600]);
    expect(bowlTimes(600, { ends: false })).toEqual([]);
  });
  it('regularly, at chosen minutes, at random times within the session', () => {
    expect(bowlTimes(600, { mode: 'every', every: 3 })).toEqual([0, 180, 360, 540, 600]);
    expect(bowlTimes(600, { mode: 'marks', marks: parseMarks('2, 7,5 99') })).toEqual([0, 120, 450, 600]);
    expect(parseMarks('3; 7.5 x')).toEqual([3, 7.5]);
    const r = bowlTimes(1200, { mode: 'random', count: 3 }, 42);
    expect(r).toHaveLength(5);
    expect(r.slice(1, -1).every((x) => x >= 30 && x <= 1170)).toBe(true);
    expect(bowlTimes(1200, { mode: 'random', count: 3 }, 42)).toEqual(r); // the same seed, the same times
    expect(bowlTimes(1200, { mode: 'random', count: 3 }, 7)).not.toEqual(r);
  });
  it('settings made safe, the next bowl', () => {
    expect(bowlOf({ mode: 'x', every: -3 })).toMatchObject({ ends: true, mode: 'none', every: 5 });
    expect(nextBowl([0, 120, 600], 130)).toBe(600);
    expect(nextBowl([0, 600], 600)).toBeNull();
    const g = rand(1);
    expect(g()).toBeGreaterThanOrEqual(0);
  });
});

describe('the database', () => {
  it('a schema bump with three tables that go into the backup', async () => {
    expect(SCHEMA_VERSION).toBe(6);
    expect(DATA_TABLES).toEqual(expect.arrayContaining(['flowActs', 'flowLog', 'flowChecks']));
    const db = createDb('flow-1');
    await ensureSeed(db);
    await ensureSeed(db); // once
    expect(await db.flowActs.count()).toBe(12);
    const entry = await tick(db, A.pushups, { day: T });
    await db.flowChecks.put({ day: T, sleep: 7 });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.flowActs).toHaveLength(12);
    expect(file.tables.flowLog[0]).toMatchObject({ id: entry.id, n: 10 });
    const other = createDb('flow-2');
    await restoreBackup(other, file, 'replace');
    expect(await other.flowChecks.get(T)).toMatchObject({ sleep: 7 });
    expect(await other.flowLog.count()).toBe(1);
  });
  it('deleting an activity removes its history; a user who deleted all is not seeded again', async () => {
    const db = createDb('flow-3');
    await ensureSeed(db);
    await tick(db, A.run, { day: T });
    await deleteAct(db, 'run');
    expect(await db.flowLog.count()).toBe(0);
    await db.flowActs.clear();
    await ensureSeed(db);
    expect(await db.flowActs.count()).toBe(0);
  });
});
