// «Gemeinsame Einheiten» (Noah 21.11.2026, S2): flowLog and Strava activities in one list. Fictional data only.
import { describe, it, expect } from 'vitest';
import { einheiten, summe, ohneMessung, quelleOf } from '../src/lib/flow/einheiten.js';
import { seedActs } from '../src/lib/flow.js';

const acts = seedActs();
const tick = (id, actId, day, extra = {}) => ({ id, actId, day, at: `${day}T07:00:00.000Z`, n: 1, ...extra });
const strava = (id, type, day, extra = {}) => ({ id, type, day, start: `${day}T16:00:00.000Z`, name: 'Fictional ride', km: 40.2, hm: 500, movingS: 5400, hrAvg: 140, ...extra });
const run = (o) => einheiten({ acts, ...o });

describe('one list for ticks and Strava', () => {
  it('a Strava tick and its activity are one unit with the numbers of the activity', () => {
    const u = run({ log: [tick('fl-strava-1', 'bike', '2026-11-10', { via: 'strava', stravaId: '1', min: 90 })], activities: [strava('1', 'Ride', '2026-11-10')] });
    expect(u).toHaveLength(1);
    expect(u[0]).toMatchObject({ actId: 'bike', quelle: 'strava', min: 90, minQuelle: 'gemessen', km: 40.2, hm: 500, hr: 140, stravaId: '1', name: 'Fictional ride' });
  });
  it('the time of a Strava tick without minutes comes from the activity', () => {
    const u = run({ log: [tick('fl-strava-1', 'bike', '2026-11-10', { via: 'strava', stravaId: '1' })], activities: [strava('1', 'Ride', '2026-11-10')] });
    expect(u[0]).toMatchObject({ min: 90, minQuelle: 'gemessen' });
  });
  it('a second ride on a day (no tick of its own) is a unit too', () => {
    const u = run({ log: [tick('fl-strava-1', 'bike', '2026-11-10', { via: 'strava', stravaId: '1' })], activities: [strava('1', 'Ride', '2026-11-10'), strava('2', 'Ride', '2026-11-10', { start: '2026-11-10T18:00:00.000Z', movingS: 1800 })] });
    expect(u.map((x) => x.id)).toEqual(['fl-strava-1', 'strava-2']);
    expect(u[1]).toMatchObject({ actId: 'bike', min: 30, minQuelle: 'gemessen', quelle: 'strava' });
  });
  it('a hand tick of the same activity and day takes the Strava activity as its numbers, not as a second session', () => {
    const u = run({ log: [tick('h1', 'run', '2026-11-11')], activities: [strava('7', 'Run', '2026-11-11', { km: 8, movingS: 2700 })] });
    expect(u).toHaveLength(1);
    expect(u[0]).toMatchObject({ id: 'h1', quelle: 'hand', min: 45, minQuelle: 'gemessen', km: 8, stravaId: '7' });
  });
  it('a hand tick with own minutes keeps them', () => {
    const u = run({ log: [tick('h1', 'run', '2026-11-11', { min: 30 })], activities: [strava('7', 'Run', '2026-11-11', { movingS: 2700 })] });
    expect(u).toHaveLength(1);
    expect(u[0].min).toBe(30);
  });
  it('a Strava sport without an activity (Hike) is a unit under its own key', () => {
    const u = run({ activities: [strava('9', 'Hike', '2026-11-12', { movingS: 7200, km: 11 })] });
    expect(u[0]).toMatchObject({ actId: null, sport: 'strava:Hike', stravaType: 'Hike', min: 120, minQuelle: 'gemessen', km: 11 });
  });
  it('the choice of the Strava table («no activity») is respected', () => {
    const u = run({ activities: [strava('1', 'Ride', '2026-11-10')], map: { Ride: '' } });
    expect(u[0].actId).toBeNull();
  });
});

describe('time: measured first, else the usual duration marked «ca.»', () => {
  it('a hand tick without minutes counts 60 min «ca.» and uses the usual duration of the sport', () => {
    expect(run({ log: [tick('h1', 'tennis', '2026-11-11')] })[0]).toMatchObject({ min: 60, minQuelle: 'ca.', quelle: 'hand' });
    expect(run({ log: [tick('h1', 'tennis', '2026-11-11')], usual: { tennis: 90 } })[0]).toMatchObject({ min: 90, minQuelle: 'ca.' });
  });
  it('typed or timed minutes are measured', () => {
    const u = run({ log: [tick('h1', 'yoga', '2026-11-11', { min: 25 }), tick('h2', 'meditation', '2026-11-11', { min: 10, via: 'timer' })], usual: { yoga: 90 } });
    expect(u.map((x) => [x.min, x.minQuelle, x.quelle])).toEqual([[25, 'gemessen', 'hand'], [10, 'gemessen', 'timer']]);
  });
  it('push-ups (a counted amount) and the ride to work get no estimate', () => {
    const u = run({ log: [tick('p1', 'pushups', '2026-11-11', { n: 20 }), tick('c1', 'bike', '2026-11-11', { via: 'commute' })] });
    expect(u.map((x) => [x.min, x.minQuelle])).toEqual([[null, null], [null, null]]);
  });
  it('the estimate is never written into the ticks', () => {
    const log = [tick('h1', 'tennis', '2026-11-11')];
    const copy = JSON.stringify(log);
    run({ log });
    expect(JSON.stringify(log)).toBe(copy);
  });
  it('sums keep measured and estimated apart; the list «without a measured time» is newest first', () => {
    const u = run({ log: [tick('a', 'tennis', '2026-11-09'), tick('b', 'tennis', '2026-11-12'), tick('c', 'yoga', '2026-11-10', { min: 30 }), tick('d', 'bike', '2026-11-11', { via: 'commute' })] });
    expect(summe(u)).toEqual({ gemessen: 30, ca: 120, n: 4, nCa: 2, nOhne: 1 });
    expect(ohneMessung(u).map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('order and sources', () => {
  it('oldest first, sources named', () => {
    expect(quelleOf({ via: 'strava' })).toBe('strava');
    expect(quelleOf({ via: 'commute' })).toBe('weg');
    expect(quelleOf({ src: 'tp' })).toBe('tp');
    expect(quelleOf({})).toBe('hand');
    const u = run({ log: [tick('b', 'run', '2026-11-12'), tick('a', 'run', '2026-11-09')] });
    expect(u.map((x) => x.id)).toEqual(['a', 'b']);
  });
});
