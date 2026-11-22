// «Weg zum Ziel» › kind of step «Training progress»: the three suggested check points, the three lines of a check
// point (plan runs, week goal, longest ride against the stage goal), the tick that sets itself from 80 % and the stage
// goal, and the cases with nothing to measure. Fictional data, fixed days, no clock.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newGoal, addSteps, applyAuto, setDone, dueOf, typeProgress } from '../src/lib/weg/weg.js';
import { TYPES, typeOf, suggestions } from '../src/lib/weg/types/index.js';
import DE from '../src/lib/i18n/de/index.js';
import training, { weekOfStep, dayKmOf, stageGoal, lines, say, REACHED, CHECK_OFFSETS } from '../src/lib/weg/types/training.js';
import { trainingPlan } from '../src/lib/race/race.js';

const START = '2027-05-15'; // a Saturday; its week starts Monday 2027-05-10
const goal = () => newGoal({ title: 'Test Rennen', kind: 'race', start: START }, { id: 'g1', now: 'x' });
const withSteps = (g = goal()) => addSteps(g, suggestions(g, [training]), { ids: (i) => `t${i + 1}` });
// the 4-weeks-before check point: day 2027-04-17, week from Monday 2027-04-12
const WEEK = '2027-04-12';
const sess = (day, mins, more = {}) => ({ day, mins, ...more });
const planned = [sess('2027-04-13', 60), sess('2027-04-15', 90), sess('2027-04-17', 150)]; // 300 minutes
const act = (day, mins) => ({ day, movingS: mins * 60 });
const base = { today: '2027-04-18', sessions: planned, acts: [act('2027-04-13', 60), act('2027-04-15', 90), act('2027-04-17', 100)], rides: [{ day: '2027-04-17', km: 95 }], dayKm: 200 };
const step = () => withSteps().steps.find((s) => s.offset === 28);

describe('registry and suggestions', () => {
  it('is in the registry and suggests three check points 8, 4 and 2 weeks before the start', () => {
    expect(TYPES.map((t) => t.type)).toContain('training');
    expect(typeOf('training')).toBe(training);
    const s = suggestions(goal(), [training]);
    expect(s.map((x) => x.offset)).toEqual([56, 28, 14]);
    expect(s.every((x) => x.type === 'training' && x.title && x.note)).toBe(true);
    expect(s.map((x) => x.key)).toEqual(['check8', 'check4', 'check2']);
    expect(new Set(s.map((x) => x.title)).size).toBe(CHECK_OFFSETS.length);
  });
  it('the check points are steps like all others: days counted back, strip «x of y», own tick', () => {
    const g = withSteps();
    expect(g.steps.map((s) => dueOf(g, s))).toEqual(['2027-03-20', '2027-04-17', '2027-05-01']);
    expect(typeProgress(setDone(g, 't1', true), 'training', '2027-03-01')).toMatchObject({ done: 1, total: 3 });
  });
  it('the link goes to the training plans, counted back from the start day when there is one', () => {
    expect(training.link(goal())).toBe('#/flow/plans?race=2027-05-15');
    expect(training.link({ start: '' })).toBe('#/flow/plans');
  });
});

describe('the week of a check point', () => {
  it('is the Monday of the step day, else the current week, else nothing', () => {
    expect(weekOfStep(goal(), step(), '2027-04-18')).toBe(WEEK);
    const free = withSteps(newGoal({ title: 'Frei', kind: 'free' }, { id: 'f', now: 'x' }));
    expect(weekOfStep(free, free.steps[0], '2027-04-18')).toBe(WEEK);
    expect(weekOfStep(free, free.steps[0], '')).toBe('');
  });
  it('the day length comes as a number or per goal', () => {
    expect(dayKmOf(goal(), { dayKm: 180 })).toBe(180);
    expect(dayKmOf(goal(), { dayKm: { g1: 150, g2: 99 } })).toBe(150);
    expect(dayKmOf(goal(), { dayKm: { g2: 99 } })).toBe(0);
    expect(dayKmOf(goal(), {})).toBe(0);
  });
});

describe('the stage goal', () => {
  it('is the longest ride of that week in the race build-up, as the page of the race shows it', () => {
    const row = trainingPlan(START, WEEK, 200).find((w) => w.week === WEEK);
    expect(row.longKm).toBe(90);
    expect(stageGoal(goal(), WEEK, { today: '2027-04-18', dayKm: 200 })).toEqual({ km: 90, taper: false });
    // seen from an earlier day it is the build-up of that day (the same as Build.svelte shows today)
    const seen = trainingPlan(START, '2027-03-01', 200).find((w) => w.week === WEEK).longKm;
    expect(stageGoal(goal(), WEEK, { today: '2027-03-01', dayKm: 200 }).km).toBe(seen);
  });
  it('the last two weeks are the taper; the race week and a missing day length give none', () => {
    expect(stageGoal(goal(), '2027-05-03', { today: '2027-04-18', dayKm: 200 }).taper).toBe(true);
    expect(stageGoal(goal(), '2027-05-10', { today: '2027-04-18', dayKm: 200 })).toBeNull();
    expect(stageGoal(goal(), WEEK, { today: '2027-04-18' })).toBeNull();
    expect(stageGoal({ ...goal(), start: '' }, WEEK, { dayKm: 200 })).toBeNull();
  });
});

describe('the three lines', () => {
  it('everything reached: plan runs, 310 of 300 minutes, 95 of 90 km', () => {
    expect(lines(goal(), step(), base)).toEqual([
      { key: 'plan', state: 'ok', sessions: 3 },
      { key: 'week', state: 'ok', have: 250, of: 300, fill: 0.83 },
      { key: 'long', state: 'ok', have: 95, of: 90, taper: false },
    ]);
  });
  it('the week goal is reached from 80 % and not below', () => {
    expect(REACHED).toBe(0.8);
    const at = (mins) => lines(goal(), step(), { ...base, acts: [act('2027-04-13', mins)] })[1];
    expect(at(240).state).toBe('ok');
    expect(at(239).state).toBe('open');
  });
  it('sessions ticked by hand count; a session that is ticked and on Strava counts once', () => {
    const hand = lines(goal(), step(), { ...base, acts: [], sessions: [sess('2027-04-13', 60, { done: true }), sess('2027-04-15', 90, { done: true }), sess('2027-04-17', 150, { done: true })] })[1];
    expect(hand).toMatchObject({ have: 300, state: 'ok' });
    const both = lines(goal(), step(), { ...base, sessions: planned.map((s) => ({ ...s, done: true })) })[1];
    expect(both.have).toBe(300);
  });
  it('only what happened up to today and inside the week counts', () => {
    const l = lines(goal(), step(), { ...base, today: '2027-04-14', acts: [act('2027-04-13', 60), act('2027-04-16', 200), act('2027-04-09', 500)], rides: [{ day: '2027-04-16', km: 200 }, { day: '2027-04-13', km: 40 }] });
    expect(l[1].have).toBe(60);
    expect(l[2].have).toBe(40);
  });
  it('a week that has not started is «later», not open', () => {
    const l = lines(goal(), step(), { ...base, today: '2027-04-05', acts: [], rides: [] });
    expect(l.map((x) => x.state)).toEqual(['ok', 'later', 'later']);
  });
  it('nothing to measure says «none»: no plan in that week, no stage goal', () => {
    const none = lines(goal(), step(), { today: '2027-04-18' });
    expect(none.map((x) => x.state)).toEqual(['none', 'none', 'none']);
    expect(lines(goal(), step(), { ...base, dayKm: 0 })[2]).toMatchObject({ state: 'none', of: 0, have: 95 });
  });
  it('broken or empty data never throws', () => {
    const junk = { today: '2027-04-18', sessions: [null, {}, { day: 'x', mins: 'y' }], acts: [null, {}], rides: [{ km: 'x' }, null], dayKm: 'x' };
    expect(lines(goal(), step(), junk).map((x) => x.state)).toEqual(['none', 'none', 'none']);
    expect(training.auto(goal(), step(), junk)).toBeNull();
    expect(training.auto(goal(), step())).toBeNull();
  });
});

describe('the tick that sets itself (Noah «a»)', () => {
  it('ticks when the plan runs, the week is at 80 % and the longest ride reached the stage goal', () => {
    const g = withSteps();
    const r = applyAuto(g, TYPES, base);
    expect(r.steps.find((s) => s.offset === 28)).toMatchObject({ done: true, by: 'auto' });
    expect(r.steps.filter((s) => s.done)).toHaveLength(1); // the other two weeks are not reached
  });
  it('stays quietly open when the longest ride is short or the week is below 80 %', () => {
    const g = withSteps();
    expect(applyAuto(g, TYPES, { ...base, rides: [{ day: '2027-04-17', km: 89 }] })).toBe(g);
    expect(applyAuto(g, TYPES, { ...base, acts: [act('2027-04-13', 200)] })).toBe(g);
    expect(training.auto(goal(), step(), { ...base, acts: [] })).toBeNull();
  });
  it('ticks without a stage goal when plan and week are fine; never without a plan', () => {
    const g = withSteps();
    expect(applyAuto(g, TYPES, { ...base, dayKm: 0, rides: [] }).steps.find((s) => s.offset === 28).done).toBe(true);
    expect(applyAuto(g, TYPES, { ...base, sessions: [] })).toBe(g);
  });
  it('never takes a tick back and never ticks again what the user unticked', () => {
    const g = withSteps();
    const ticked = applyAuto(g, TYPES, base);
    expect(applyAuto(ticked, TYPES, { today: '2027-04-18' })).toBe(ticked);
    const unticked = setDone(ticked, ticked.steps.find((s) => s.offset === 28).id, false);
    expect(applyAuto(unticked, TYPES, base).steps.find((s) => s.offset === 28).done).toBe(false);
  });
  it('a hand tick works at any time, with nothing known', () => {
    const g = setDone(withSteps(), 't2', true);
    expect(g.steps[1]).toMatchObject({ done: true, by: 'user' });
    expect(applyAuto(g, TYPES, {})).toBe(g);
  });
});

describe('the words', () => {
  it('every line has a calm text with numbers, and a German text exists for everything the type can say', () => {
    const keys = new Set([training.label, ...suggestions(goal(), [training]).flatMap((x) => [x.title, x.note])]);
    const cases = [base, { ...base, rides: [], acts: [] }, { today: '2027-04-18' }, { ...base, today: '2027-04-05' }, { ...base, dayKm: 0 }];
    for (const ctx of cases) for (const l of lines(goal(), step(), ctx)) {
      const s = say(l);
      keys.add(s.label);
      keys.add(s.text);
      expect(s.state).toBe(l.state);
    }
    expect(say(lines(goal(), step(), { ...base, acts: [act('2027-04-13', 60)] })[1])).toMatchObject({ text: '{have} of {of} min', vars: { have: 60, of: 300 } });
    expect(say(lines(goal(), step(), base)[2])).toMatchObject({ text: '{have} of {of} km', vars: { have: 95, of: 90 } });
    for (const k of keys) expect(DE[k], k).toBeTruthy();
    for (const k of keys) expect(DE[k], k).not.toBe(k);
  });
});

describe('loading and the page ctx', () => {
  it('load() reads the week plan and the activities; the page puts them under ctx.training', async () => {
    const db = createDb('weg-training-1');
    await db.settings.put({ key: 'training.plan', value: { sessions: [{ id: 'a', day: '2027-04-13', mins: 60 }, { id: 'b', day: 'nope', mins: 5 }] } });
    await db.activities.bulkPut([
      { id: '1', day: '2027-04-13', kind: 'bike', km: 40, movingS: 3600, line: 'x'.repeat(50) },
      { id: '2', day: '2027-04-14', kind: 'run', km: 8, movingS: 2400 },
    ]);
    const data = await training.load(db);
    expect(data.sessions).toHaveLength(1);
    expect(data.acts).toEqual([{ day: '2027-04-13', movingS: 3600, km: 40, kind: 'bike' }, { day: '2027-04-14', movingS: 2400, km: 8, kind: 'run' }]);
    expect(data.rides.map((r) => r.km)).toEqual([40]);
    const g = withSteps();
    const r = lines(g, step(), { today: '2027-04-18', training: { ...data, dayKm: 200 } });
    expect(r[0]).toMatchObject({ state: 'ok', sessions: 1 });
    expect(r[1]).toMatchObject({ have: 100, of: 60 });
    expect(r[2]).toMatchObject({ have: 40, of: 90, state: 'open' });
  });
  it('load() on an empty database gives empty lists', async () => {
    expect(await training.load(createDb('weg-training-2'))).toEqual({ sessions: [], acts: [], rides: [] });
  });
});
