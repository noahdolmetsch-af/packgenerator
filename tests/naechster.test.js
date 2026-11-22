// «Meilensteine motivierender» PR 1: the card «Dein nächster Stern» (nextStar, planFor, paceOf, heroOf).
// Fictional data; days are calendar days (addDays), never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { seedActs, addDays } from '../src/lib/flow.js';
import { msContext, allMilestones } from '../src/lib/flowms.js';
import { nextStar, leftOf, planFor, paceOf, heroOf, UNITS_OF_ICON } from '../src/lib/flow/naechster.js';
import { planOf } from '../src/lib/training/wochenplan.js';
import { weekFor, setDone, logOf } from '../src/lib/training/wochenlog.js';

const T = '2026-11-09'; // a Monday, winter
const acts = seedActs();
const tennis = acts.find((a) => a.icon === 'tennis');
let k = 0;
const e = (actId, day, extra = {}) => ({ id: `e${++k}`, actId, day, at: `${day}T10:00:00.000Z`, n: 1, ...extra });
const daily = (actId, end, n, extra = {}) => Array.from({ length: n }, (_, i) => e(actId, addDays(end, -i), extra));
const build = (log) => {
  const ctx = msContext({ acts, log, today: T });
  return { ctx, list: allMilestones(ctx) };
};
const find = (list, id) => list.find((r) => r.id === id);
const plan = planOf(null);

describe('nextStar', () => {
  it('takes the closest «soon» star, else the one with most progress, null without an open star', () => {
    const { list } = build(daily(tennis.id, T, 24));
    const r = nextStar(list);
    expect(r.next).toBeTruthy();
    expect(r.progress).toBeGreaterThanOrEqual(0.8);
    expect(nextStar([])).toBeNull();
    expect(nextStar(list.map((x) => ({ ...x, off: true })))).toBeNull();
  });
  it('leftOf is what is missing, never below zero', () => {
    const { list } = build(daily(tennis.id, T, 24));
    expect(leftOf(find(list, `${tennis.id}.sessions`))).toBe(1);
  });
});

describe('planFor: what the weekly plan has this week', () => {
  const { ctx, list } = build(daily(tennis.id, T, 24));
  const r = find(list, `${tennis.id}.sessions`);
  it('knows the units of a sport by its icon', () => {
    expect(UNITS_OF_ICON.tennis).toEqual(['tennis']);
  });
  it('names the open tennis unit and says it reaches the star (1 missing, ticks count 1 each)', () => {
    const p = planFor(r, tennis, plan, null, T);
    expect(p).not.toBeNull();
    expect(p.unit.type).toBe('tennis');
    expect(p.reach).toBe(p.unit);
    expect(p.day >= T && p.day <= addDays(T, 6)).toBe(true);
  });
  it('says nothing without a plan, without a unit for the sport, or when the units are ticked off', () => {
    expect(planFor(r, tennis, null, null, T)).toBeNull();
    expect(planFor(r, { ...tennis, icon: 'heart' }, plan, null, T)).toBeNull();
    const { week, cfg } = weekFor(plan, T);
    let log = logOf(null);
    for (const u of week.units.filter((x) => x.type === 'tennis')) log = setDone(log, T, u.id, true, T, week.units, cfg.hours);
    expect(planFor(r, tennis, plan, log, T)).toBeNull();
  });
  it('does not promise a star when the units do not add up (many missing)', () => {
    const { list: far } = build(daily(tennis.id, T, 12));
    const rf = find(far, `${tennis.id}.sessions`); // 12 of 25
    const p = planFor(rf, tennis, plan, null, T);
    expect(p.reach).toBeNull();
    expect(p.count).toBeGreaterThan(0);
  });
  it('counts hours by the length of the unit and gives no promise for a streak', () => {
    const withMin = daily(tennis.id, T, 24, { min: 60 }); // 24 h of 25 h
    const { list: h } = build(withMin);
    const rh = find(h, `${tennis.id}.hours`);
    expect(rh.target).toBe(25);
    expect(planFor(rh, tennis, plan, null, T).reach).not.toBeNull();
    const rw = find(list, `${tennis.id}.weeks`);
    expect(planFor(rw, tennis, plan, null, T).reach).toBeNull();
    expect(ctx.days.length).toBe(24);
  });
});

describe('paceOf: the pace of the last four weeks', () => {
  it('guesses a date for a milestone that only grows', () => {
    // one tick every second day for 40 days: 20 ticks, 3.5 a week
    const log = Array.from({ length: 20 }, (_, i) => e(tennis.id, addDays(T, -2 * i)));
    const { ctx, list } = build(log);
    const r = find(list, `${tennis.id}.sessions`); // 20 of 25
    const p = paceOf(r, ctx, T);
    expect(p.perWeek).toBe(3.5);
    expect(p.days).toBe(10);
    expect(p.eta).toBe(addDays(T, 10));
  });
  it('gives nothing for a streak, for too little history, for no growth, or for a date far away', () => {
    const { ctx, list } = build(daily(tennis.id, T, 24));
    expect(paceOf(find(list, `${tennis.id}.weeks`), ctx, T)).toBeNull();
    const few = build(daily(tennis.id, T, 5));
    expect(paceOf(find(few.list, `${tennis.id}.sessions`), few.ctx, T)).toBeNull();
    const old = Array.from({ length: 4 }, (_, i) => e(tennis.id, addDays(T, -200 - i)));
    const idle = build([...old, e(tennis.id, addDays(T, -1))]);
    expect(paceOf(find(idle.list, `${tennis.id}.sessions`), idle.ctx, T)).toBeNull();
  });
});

describe('heroOf', () => {
  it('plan wins over pace; pace only without a plan; null without an open star', () => {
    const { ctx, list } = build(daily(tennis.id, T, 24));
    const only = list.filter((x) => x.id === `${tennis.id}.sessions`);
    const withPlan = heroOf({ list: only, ctx, acts, plan, today: T });
    expect(withPlan.plan).not.toBeNull();
    expect(withPlan.pace).toBeNull();
    expect(withPlan.pct).toBe(96);
    expect(withPlan.left).toBe(1);
    const noPlan = heroOf({ list: only, ctx, acts, plan: null, today: T });
    expect(noPlan.plan).toBeNull();
    expect(noPlan.pace).not.toBeNull();
    expect(heroOf({ list: [], ctx, acts, plan, today: T })).toBeNull();
  });
});
