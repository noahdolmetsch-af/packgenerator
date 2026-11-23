// «Zählen?» for Fitbit workouts (Noah 21.11.2026, K4): fictional days only.
import { describe, it, expect } from 'vitest';
import { suggestions, entryOf, idOf, zurichAt, withHandled, withoutHandled, grouped, watchMinutesFor } from '../src/lib/flow/fitbittraining.js';

const TODAY = '2026-10-09';
const act = (id, name, extra = {}) => ({ id, name, ring: 'move', icon: 'heart', order: 0, goals: [], ...extra });
const ACTS = [act('tennis', 'Tennis'), act('hockey', 'Eishockey'), act('run', 'Laufen'), act('walk', 'Gehen'), act('gym', 'Gym')];
const ex = (name, start, min, extra = {}) => ({ type: 'OTHER', name, start, end: '19:00', min, ...extra });
const day = (date, ...exercises) => ({ date, exercises });
const run = (over = {}) => suggestions({ health: [], acts: ACTS, log: [], activities: [], handled: [], today: TODAY, ...over });

describe('zurichAt', () => {
  it('summer and winter time in Europe/Zurich', () => {
    expect(zurichAt('2026-07-01', '18:30')).toBe('2026-07-01T16:30:00.000Z');
    expect(zurichAt('2026-12-01', '18:30')).toBe('2026-12-01T17:30:00.000Z');
  });
});

describe('suggestions', () => {
  it('a known workout without a tick is a suggestion with its minutes', () => {
    const r = run({ health: [day('2026-10-05', ex('Tennis', '18:00', 60, { hr: 128 }))] });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ day: '2026-10-05', start: '18:00', min: 60, actId: 'tennis', key: 'tennis', hr: 128 });
    expect(r[0].id).toBe(idOf('2026-10-05', { start: '18:00' }));
  });
  it('«Walk» stays out; an unknown type and a short workout too', () => {
    expect(run({ health: [day('2026-10-05', ex('Walk', '12:00', 40), ex('Curling', '12:00', 40), ex('Tennis', '09:00', 3))] })).toEqual([]);
  });
  it('the type words help when the name is empty', () => {
    expect(run({ health: [day('2026-10-05', ex('', '19:00', 90, { type: 'ICE_HOCKEY' }))] })[0]?.actId).toBe('hockey');
  });
  it('no activity of that kind, or paused: no suggestion', () => {
    expect(run({ health: [day('2026-10-05', ex('Yoga', '07:00', 30))] })).toEqual([]);
    expect(run({ acts: [act('tennis', 'Tennis', { paused: true })], health: [day('2026-10-05', ex('Tennis', '18:00', 60))] })).toEqual([]);
  });
  it('the same activity already ticked that day: no suggestion', () => {
    const log = [{ id: 'x', actId: 'tennis', day: '2026-10-05', at: '2026-10-05T16:00:00.000Z', n: 1 }];
    expect(run({ log, health: [day('2026-10-05', ex('Tennis', '18:00', 60))] })).toEqual([]);
    expect(run({ log, health: [day('2026-10-06', ex('Tennis', '18:00', 60))] })).toHaveLength(1);
  });
  it('a Strava activity of that time is the same session; one far away is not', () => {
    const strava = (time, extra = {}) => ({ id: 's1', day: '2026-10-05', time, movingS: 3300, elapsedS: 3600, ...extra });
    const health = [day('2026-10-05', ex('Tennis', '18:00', 60))];
    expect(run({ health, activities: [strava('18:10')] })).toEqual([]);
    expect(run({ health, activities: [strava('19:20')] })).toEqual([]); // starts 20 min after the workout ends: near
    expect(run({ health, activities: [strava('07:00')] })).toHaveLength(1);
    expect(run({ health, activities: [strava('')] })).toEqual([]); // no time: the same
  });
  it('a Fitbit tick of the file import within 2 minutes: no suggestion', () => {
    const log = [{ id: 'fl-fb-e-1', actId: 'run', day: '2026-10-05', at: zurichAt('2026-10-05', '18:01'), n: 1, via: 'fitbit' }];
    expect(run({ log, health: [day('2026-10-05', ex('Tennis', '18:00', 60))] })).toEqual([]);
  });
  it('done ids, old days and future days are left out', () => {
    const health = [day('2026-10-05', ex('Tennis', '18:00', 60)), day('2026-01-01', ex('Tennis', '18:00', 60)), day('2026-10-10', ex('Tennis', '18:00', 60))];
    expect(run({ health }).map((s) => s.day)).toEqual(['2026-10-05']);
    expect(run({ health, handled: [idOf('2026-10-05', { start: '18:00' })] })).toEqual([]);
  });
  it('newest first, grouped by activity', () => {
    const r = run({ health: [day('2026-10-02', ex('Tennis', '18:00', 60)), day('2026-10-05', ex('Tennis', '18:00', 90), ex('Hockey', '20:00', 120))] });
    expect(r.map((s) => `${s.day} ${s.actId}`)).toEqual(['2026-10-05 hockey', '2026-10-05 tennis', '2026-10-02 tennis']);
    const g = grouped(r);
    expect(g[0]).toMatchObject({ actId: 'tennis', min: 150 });
    expect(g[0].rows).toHaveLength(2);
  });
});

describe('the tick', () => {
  it('has the minutes and the source «fitbit», the id of the workout', () => {
    const [s] = run({ health: [day('2026-10-05', ex('Tennis', '18:00', 60))] });
    const e = entryOf(s, ACTS[0]);
    expect(e).toMatchObject({ id: s.id, actId: 'tennis', day: '2026-10-05', min: 60, via: 'fitbit', n: 1 });
    expect(e.at).toBe('2026-10-05T16:00:00.000Z');
  });
  it('handled ids: add and take away', () => {
    expect(withHandled(['a'], ['b', 'a'])).toEqual(['a', 'b']);
    expect(withoutHandled(['a', 'b'], ['a'])).toEqual(['b']);
  });
});

describe('watchMinutesFor: the length of the watch as a tip for a tick without minutes (Noah 22.11.2026 «3», G)', () => {
  const rows = [{ id: 'k1', day: '2026-10-05', actId: 'tennis' }, { id: 'k2', day: '2026-10-06', actId: 'tennis' }, { id: 'k3', day: '2026-10-07', actId: 'gym' }];
  const health = [
    day('2026-10-05', ex('Tennis', '18:00', 68)),
    day('2026-10-06', ex('Tennis', '10:00', 40), ex('Tennis', '18:00', 50)), // two: ambiguous
    day('2026-10-07', ex('Tennis', '18:00', 60)), // another sport
  ];
  it('exactly one workout of the same sport that day gives its minutes', () => {
    const m = watchMinutesFor({ rows, health, acts: ACTS });
    expect(m.get('k1')).toEqual({ min: 68, name: 'Tennis' });
  });
  it('two workouts that day, or another sport, give no tip', () => {
    const m = watchMinutesFor({ rows, health, acts: ACTS });
    expect(m.has('k2')).toBe(false);
    expect(m.has('k3')).toBe(false);
  });
  it('a workout shorter than the noise limit, or no health day, gives no tip', () => {
    expect(watchMinutesFor({ rows: [rows[0]], health: [day('2026-10-05', ex('Tennis', '18:00', 3))], acts: ACTS }).size).toBe(0);
    expect(watchMinutesFor({ rows, health: [], acts: ACTS }).size).toBe(0);
  });
});
