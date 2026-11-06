// «Eigene Wochenziele» (Noah 05.11.2026, Aktiv 4b): small goals for the calendar week Monday to Sunday. Fictional data only.
import { describe, it, expect } from 'vitest';
import { goalsOf, weekRange, weekKm, weekDone, standOf, standsOf, addGoal, setOf, typedOf, removeGoal, stepGoal, moveTo, suggestions, MAX_GOALS } from '../src/lib/flow/weekgoals.js';
import { normAct } from '../src/lib/flow.js';

const WED = '2026-11-04'; // a Wednesday; the week is Mon 2026-11-02 … Sun 2026-11-08
const med = normAct({ id: 'meditation', name: 'Meditation', ring: 'mind', goals: [{ count: 1, days: 1 }] });
const bike = normAct({ id: 'bike', name: 'Cycling outdoors', ring: 'move' });
const stretch = normAct({ id: 'stretch', name: 'Stretching', ring: 'move' });
const log = [
  { id: 'a', actId: 'meditation', day: '2026-11-01' }, // Sunday before: not this week
  { id: 'b', actId: 'meditation', day: '2026-11-02' },
  { id: 'c', actId: 'meditation', day: '2026-11-04' },
  { id: 'd', actId: 'meditation', day: '2026-11-05' }, // tomorrow: not counted yet
];
const rides = [{ date: '2026-11-01', km: 99 }, { date: '2026-11-02', km: 40.4 }, { date: '2026-11-04T09:00:00.000Z', km: 62.3 }, { date: '2026-11-06', km: 80 }];

describe('goalsOf', () => {
  it('keeps valid goals, drops nonsense and doubles', () => {
    const g = goalsOf([{ id: 'x', kind: 'km', of: 150 }, { kind: 'km', of: 99 }, { kind: 'act', actId: 'meditation', of: '2' }, { kind: 'act', of: 3 }, { kind: 'xyz', of: 3 }, { kind: 'km', of: 0 }, null]);
    expect(g).toEqual([{ id: 'x', kind: 'km', of: 150 }, { id: 'act:meditation', kind: 'act', actId: 'meditation', of: 2 }]);
  });
  it('stores nothing for a missing or broken record, and at most MAX_GOALS', () => {
    expect(goalsOf(undefined)).toEqual([]);
    expect(goalsOf('x')).toEqual([]);
    expect(goalsOf(Array.from({ length: 30 }, (_, i) => ({ kind: 'act', actId: `a${i}`, of: 1 }))).length).toBe(MAX_GOALS);
  });
});

describe('the week', () => {
  it('runs Monday to Sunday', () => {
    expect(weekRange(WED)).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(weekRange('2026-11-08')).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(weekRange('2026-11-09').from).toBe('2026-11-09');
  });
  it('km: only the rides of this week up to today', () => {
    expect(weekKm(rides, WED)).toBe(103);
    expect(weekKm([], WED)).toBe(0);
  });
  it('a sport: its entries from Monday to today', () => {
    expect(weekDone(med, log, [], WED)).toBe(2);
    expect(weekDone(null, log, [], WED)).toBe(0);
  });
  it('the amount of an entry counts (push-ups: 10 a tap)', () => {
    const push = normAct({ id: 'pushups', name: 'Push-ups', ring: 'move', perTap: 10 });
    expect(weekDone(push, [{ id: 'p', actId: 'pushups', day: '2026-11-03', n: 10 }, { id: 'q', actId: 'pushups', day: '2026-11-04', n: 20 }], [], WED)).toBe(30);
  });
});

describe('standOf', () => {
  const data = { acts: [med, bike], log, tripDays: [], rides, today: WED };
  it('km with a bar that stops at full', () => {
    expect(standOf({ id: 'km', kind: 'km', of: 150 }, data)).toMatchObject({ have: 103, of: 150, met: false, left: 5 });
    expect(standOf({ id: 'km', kind: 'km', of: 100 }, data)).toMatchObject({ fill: 1, met: true });
    expect(standOf({ id: 'km', kind: 'km', of: 100 }, { ...data, rides: [{ date: WED, km: 500 }] }).fill).toBe(1);
  });
  it('a sport goal: 2 of 2 is met', () => {
    expect(standOf({ id: 'act:meditation', kind: 'act', actId: 'meditation', of: 2 }, data)).toMatchObject({ have: 2, met: true });
  });
  it('a deleted sport is named missing, not an error', () => {
    expect(standOf({ id: 'act:gone', kind: 'act', actId: 'gone', of: 2 }, data)).toMatchObject({ missing: true, have: 0, met: false });
  });
  it('days left: Monday 7, Sunday 1', () => {
    expect(standOf({ id: 'km', kind: 'km', of: 1 }, { ...data, today: '2026-11-02' }).left).toBe(7);
    expect(standOf({ id: 'km', kind: 'km', of: 1 }, { ...data, today: '2026-11-08' }).left).toBe(1);
  });
  it('standsOf keeps the order', () => {
    const l = goalsOf([{ kind: 'km', of: 150 }, { kind: 'act', actId: 'meditation', of: 2 }]);
    expect(standsOf(l, data).map((s) => s.goal.id)).toEqual(['km', 'act:meditation']);
  });
});

describe('changing the list', () => {
  const l = goalsOf([{ kind: 'km', of: 150 }, { kind: 'act', actId: 'meditation', of: 2 }]);
  it('adds a goal, but not the same thing twice', () => {
    const a = addGoal([], { kind: 'km', of: 100 });
    expect(a).toEqual([{ id: 'km', kind: 'km', of: 100 }]);
    expect(addGoal(a, { kind: 'km', of: 50 })).toBe(a);
    expect(addGoal(a, { kind: 'act', actId: 'yoga', of: 2 }).length).toBe(2);
    expect(addGoal(a, { kind: 'km', of: 0 })).toBe(a);
  });
  it('changes a number; nonsense leaves it', () => {
    expect(setOf(l, 'km', '200')[0].of).toBe(200);
    expect(setOf(l, 'km', 'abc')).toBe(l);
    expect(typedOf('12 km')).toBe(12);
    expect(typedOf('')).toBeUndefined();
  });
  it('deletes, and the list without it can be put back by saving the old one (Undo)', () => {
    const r = removeGoal(l, 'km');
    expect(r.map((g) => g.id)).toEqual(['act:meditation']);
    expect(l.length).toBe(2);
  });
  it('moves one place or to a place; the ends stay', () => {
    expect(stepGoal(l, 'km', 1).map((g) => g.id)).toEqual(['act:meditation', 'km']);
    expect(stepGoal(l, 'km', -1)).toBe(l);
    expect(moveTo(l, 1, 0).map((g) => g.id)).toEqual(['act:meditation', 'km']);
  });
});

describe('suggestions', () => {
  it('offers two meditations, 150 km and three of a move sport, but not what is already there', () => {
    const s = suggestions([med, bike, stretch], []);
    expect(s).toEqual([{ kind: 'act', actId: 'meditation', of: 2 }, { kind: 'km', of: 150 }, { kind: 'act', actId: 'stretch', of: 3 }]);
    expect(suggestions([med, bike, stretch], goalsOf([{ kind: 'km', of: 80 }])).some((x) => x.kind === 'km')).toBe(false);
  });
  it('without sports only the km', () => {
    expect(suggestions([], [])).toEqual([{ kind: 'km', of: 150 }]);
  });
});
