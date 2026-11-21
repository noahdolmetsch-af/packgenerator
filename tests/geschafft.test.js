// «Geschafft» (Noah 19.11.2026 «1-5a», T1): the rules behind the page after a tick. Fictional data; calendar-day arithmetic only.
import { describe, it, expect } from 'vitest';
import { weekDays, sourceKey, entryToShow, nthThisWeek, weekNumbers, hhmm, hoursGoal, openGoals, compareLast, nextUnit } from '../src/lib/flow/geschafft.js';

// Thursday 19 November 2026; the week runs Monday 16 to Sunday 22
const TODAY = '2026-11-19';
const acts = [
  { id: 'run', ring: 'move' },
  { id: 'yoga', ring: 'move' },
  { id: 'meditation', ring: 'mind' },
  { id: 'bike', ring: 'move' },
];
const e = (id, actId, day, extra = {}) => ({ id, actId, day, at: `${day}T07:00:00.000Z`, n: 1, ...extra });

describe('the week', () => {
  it('runs Monday to Sunday', () => {
    expect(weekDays(TODAY)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
    expect(weekDays('2026-11-22')[0]).toBe('2026-11-16');
  });
  it('counts only movement, not the ride to work, hours only from entries with a duration', () => {
    const log = [e('1', 'run', '2026-11-16', { min: 46 }), e('2', 'yoga', '2026-11-16', { min: 30 }), e('3', 'meditation', '2026-11-17', { min: 20 }), e('4', 'bike', '2026-11-18', { via: 'commute' }), e('5', 'run', '2026-11-19'), e('6', 'run', '2026-11-09', { min: 99 })];
    const w = weekNumbers(log, acts, TODAY);
    expect(w.mins).toBe(76);
    expect(w.done).toEqual([true, false, false, true, false, false, false]);
    expect(w.daysDone).toBe(2);
    expect(w.ticks).toBe(3);
  });
  it('writes hours and minutes', () => {
    expect(hhmm(0)).toBe('0:00');
    expect(hhmm(132)).toBe('2:12');
    expect(hhmm(605)).toBe('10:05');
  });
});

describe('the entry and its number', () => {
  const log = [e('a', 'run', '2026-11-16'), e('b', 'run', '2026-11-19', { at: '2026-11-19T06:00:00.000Z' }), e('c', 'run', '2026-11-19', { at: '2026-11-19T17:00:00.000Z' }), e('d', 'run', '2026-11-12')];
  it('takes the one asked for, else the latest of today, else nothing', () => {
    expect(entryToShow(log, 'a', TODAY).id).toBe('a');
    expect(entryToShow(log, 'zzz', TODAY)).toBe(null);
    expect(entryToShow(log, '', TODAY).id).toBe('c');
    expect(entryToShow(log, '', '2026-11-30')).toBe(null);
  });
  it('says the time of the week by counting, never by judging', () => {
    expect(nthThisWeek(log, log[0])).toBe(1);
    expect(nthThisWeek(log, log[1])).toBe(2);
    expect(nthThisWeek(log, log[2])).toBe(3);
    expect(nthThisWeek(log, log[3])).toBe(1); // the week before
    expect(nthThisWeek(log, null)).toBe(0);
  });
  it('names where it came from', () => {
    expect(sourceKey({ via: 'strava' })).toBe('strava');
    expect(sourceKey({ via: 'timer' })).toBe('timer');
    expect(sourceKey({})).toBe('hand');
    expect(sourceKey({ via: 'something else' })).toBe('hand');
  });
});

describe('the weekly hours', () => {
  it('shows no goal when none was set', () => {
    expect(hoursGoal({}, TODAY)).toBe(null);
    expect(hoursGoal({ goal: null, weekplan: null }, TODAY)).toBe(null);
  });
  it('takes Training › goal first, then the hours of the weekly plan', () => {
    expect(hoursGoal({ goal: { hours: 6 } }, TODAY)).toBe(6);
    expect(hoursGoal({ goal: { hours: 6 }, weekplan: { winter: { hours: 15 } } }, TODAY)).toBe(6);
    expect(hoursGoal({ weekplan: { winter: { hours: 12 } } }, TODAY)).toBe(12);
  });
});

describe('the open weekly goals', () => {
  const st = (id, n, of, met = false, daily = false) => ({ act: { id }, goals: [{}], resting: false, stand: { n, of }, daily, met, open: !met });
  it('lists the sport just ticked first and open ones before met ones', () => {
    const r = openGoals([st('yoga', 1, 2), st('run', 1, 1, true), st('gym', 0, 1), st('bike', 0, 3)], 'run');
    expect(r.list.map((g) => g.act.id)).toEqual(['run', 'yoga', 'gym', 'bike']);
    expect(r.open).toBe(3);
    expect(r.all).toBe(4);
  });
  it('is empty when there are no goals, and says all met when none is open', () => {
    expect(openGoals([], 'run')).toEqual({ list: [], open: 0, all: 0 });
    const r = openGoals([st('yoga', 2, 2, true)], 'run');
    expect(r.list).toEqual([]);
    expect(r.all).toBe(1);
  });
});

describe('the comparison with the last time', () => {
  const run = (id, day, movingS, km, hrAvg) => ({ id, type: 'Run', day, start: `${day}T08:00:00Z`, movingS, km, hrAvg });
  it('is null without a Strava activity, empty without an earlier one', () => {
    expect(compareLast([], '5')).toBe(null);
    const c = compareLast([run('5', '2026-11-19', 2760, 8.2, 148)], '5');
    expect(c.before).toBe(null);
    expect(c.rows).toEqual([]);
  });
  it('compares time, distance and heart rate with the last one of the same type', () => {
    const list = [run('1', '2026-11-08', 3000, 9, 150), run('2', '2026-11-12', 2900, 8.0, 151), run('5', '2026-11-19', 2760, 8.2, 148), { id: '9', type: 'Ride', day: '2026-11-15', start: '2026-11-15T08:00:00Z', movingS: 5000, km: 40 }];
    const c = compareLast(list, '5');
    expect(c.before.id).toBe('2');
    expect(c.rows).toEqual([{ k: 'min', now: 46, before: 48 }, { k: 'km', now: 8.2, before: 8 }, { k: 'hr', now: 148, before: 151 }]);
  });
  it('leaves out a number that one of the two lacks', () => {
    const c = compareLast([run('2', '2026-11-12', 2900, 8, null), run('5', '2026-11-19', 2760, null, 148)], '5');
    expect(c.rows.map((r) => r.k)).toEqual(['min']);
  });
});

describe('the next unit of the weekly plan', () => {
  it('is null without a saved plan', () => {
    expect(nextUnit(null, null, { day: TODAY, time: '10:00' })).toBe(null);
  });
  it('is a later unit of this week, after the moment given, never a past one', () => {
    const plan = { winter: { hours: 15, counts: { tennis: 3, yoga: 2, gym: 2, hockey: 1 } } };
    const a = nextUnit(plan, null, { day: TODAY, time: '07:00' });
    expect(a).not.toBe(null);
    expect(a.day >= TODAY).toBe(true);
    if (a.day === TODAY) expect(a.t > '07:00').toBe(true);
    const b = nextUnit(plan, null, { day: '2026-11-22', time: '23:59' });
    expect(b).toBe(null);
  });
});
