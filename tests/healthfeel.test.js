import { describe, it, expect } from 'vitest';
import { exKey, mapOf, wordOfEx, onStrava, healthToAsk, healthAllToAsk, fitFeelByDay, withAnswer, HEALTH_FEEL_KEY } from '../src/lib/flow/healthfeel.js';
import { feelAllToAsk, feelToAsk } from '../src/lib/training/plans.js';
import { feelDay } from '../src/lib/analyse/catalog.js';
import { stravaFacts, healthFacts, clock } from '../src/lib/flow/actfacts.js';
import { shiftDay } from '../src/lib/training.js';

const today = '2026-11-18';
const run = { type: 'RUNNING', name: 'Morgenlauf', start: '07:10', end: '07:58', min: 48, km: 8.4, hr: 150, kcal: 520, azm: 41 };
const rows = (ex, date = today) => [{ date, exercises: ex }];

describe('Fitbit workouts ask «How was it?»', () => {
  it('asks about the newest workout of the last 3 days that has no answer', () => {
    const old = { ...run, start: '06:00', type: 'WALKING' };
    const r = [...rows([old], '2026-11-16'), ...rows([run])];
    expect(healthToAsk(r, [], null, today, shiftDay)).toMatchObject({ key: exKey(today, run), date: today, name: 'Morgenlauf' });
  });
  it('does not ask about workouts older than 3 days, in the future or without minutes', () => {
    expect(healthToAsk(rows([run], '2026-11-14'), [], null, today, shiftDay)).toBeNull();
    expect(healthToAsk(rows([run], '2026-11-19'), [], null, today, shiftDay)).toBeNull();
    expect(healthToAsk(rows([{ ...run, min: 0 }]), [], null, today, shiftDay)).toBeNull();
    expect(healthToAsk([{ date: today }], [], null, today, shiftDay)).toBeNull();
  });
  it('does not ask twice about one that Strava has as well (same day, start within 20 minutes)', () => {
    const strava = { id: '1', day: today, time: '07:20', movingS: 2800 };
    expect(onStrava(today, run, [strava])).toBe(true);
    expect(healthToAsk(rows([run]), [strava], null, today, shiftDay)).toBeNull();
    expect(onStrava(today, run, [{ ...strava, time: '09:00' }])).toBe(false);
    expect(onStrava(today, run, [{ ...strava, day: '2026-11-17' }])).toBe(false);
  });
  it('without a start time the same length (within 10 %) counts as the same workout', () => {
    const noStart = { ...run, start: undefined };
    expect(onStrava(today, noStart, [{ id: '1', day: today, movingS: 2880 }])).toBe(true);
    expect(onStrava(today, noStart, [{ id: '1', day: today, movingS: 1800 }])).toBe(false);
  });
  it('keeps a word, takes it back with the same word again, and «Later» asks no more', () => {
    const key = exKey(today, run);
    let v = withAnswer(null, key, 'good');
    expect(v).toEqual({ v: 1, map: { [key]: { w: 'good' } } });
    expect(wordOfEx(v, today, run)).toBe('good');
    expect(healthToAsk(rows([run]), [], v, today, shiftDay)).toBeNull();
    v = withAnswer(v, key, 'good');
    expect(mapOf(v)).toEqual({});
    expect(healthToAsk(rows([run]), [], v, today, shiftDay)).not.toBeNull();
    v = withAnswer(v, key, 'later');
    expect(mapOf(v)[key]).toEqual({ skip: true });
    expect(healthToAsk(rows([run]), [], v, today, shiftDay)).toBeNull();
  });
  it('a word replaces another word; unknown words and bad values are ignored', () => {
    const key = exKey(today, run);
    const v = withAnswer(withAnswer(null, key, 'light'), key, 'hard');
    expect(mapOf(v)[key]).toEqual({ w: 'hard' });
    expect(mapOf({ map: { a: { w: 'great' }, b: 5, c: { w: 'good' } } })).toEqual({ c: { w: 'good' } });
    expect(mapOf(null)).toEqual({});
    expect(mapOf('x')).toEqual({});
  });
  it('keeps at most 200 answers, the oldest go', () => {
    let v = null;
    for (let i = 0; i < 205; i++) v = withAnswer(v, `2026-01-${String(1 + (i % 28)).padStart(2, '0')}|${String(i).padStart(4, '0')}|X`, 'good');
    expect(Object.keys(mapOf(v)).length).toBe(200);
  });
  it('the setting key is a plain settings row', () => {
    expect(HEALTH_FEEL_KEY).toBe('training.healthfeel');
  });
});

describe('more facts about an activity', () => {
  const t = (k, o = {}) => k.replace(/\{(\w+)\}/g, (_, n) => String(o[n]));
  const num = (n) => String(n);
  it('a run shows distance, time, pace, climb, heart rate, kcal', () => {
    const a = { type: 'Run', km: 8.2, movingS: 2760, hm: 60.4, hrAvg: 148, hrMax: 171, kcal: 530 };
    expect(stravaFacts(a, t, num)).toEqual(['8.2 km', '46 min', 'Pace 5:37 min/km', '60 m up', 'Heart rate avg 148', 'Heart rate max 171', '530 kcal']);
  });
  it('a ride shows km/h and power instead of the pace; only what is there', () => {
    const a = { type: 'Ride', km: 40, movingS: 5400, wAvg: 180.4 };
    expect(stravaFacts(a, t, num)).toEqual(['40 km', '90 min', '26.7 km/h', 'Power avg 180 W']);
    expect(stravaFacts({ type: 'Yoga', km: 0, movingS: 0 }, t, num)).toEqual([]);
    expect(stravaFacts(null, t, num)).toEqual([]);
  });
  it('a watch workout shows distance, time, pace for foot sports, heart rate, zone minutes, kcal, steps', () => {
    expect(healthFacts(run, t, num)).toEqual(['8.4 km', '48 min', 'Pace 5:43 min/km', 'Heart rate avg 150', '41 zone minutes', '520 kcal']);
    expect(healthFacts({ type: 'BIKING', min: 60, km: 25, steps: 0 }, t, num)).toEqual(['25 km', '60 min']);
    expect(healthFacts({ type: 'WEIGHTS', min: 30, steps: 120 }, t, num)).toEqual(['30 min', '120 steps']);
  });
  it('the clock shows minutes and seconds', () => {
    expect(clock(312)).toBe('5:12');
    expect(clock(305)).toBe('5:05');
  });
});

// Noah 27.11.2026 «1a 3b»: the open ones as a list; answers of the watch count in the felt effort
describe('the open ones as a list and the answers of the watch', () => {
  const tennis = { type: 'TENNIS', name: 'Tennis', start: '18:00', end: '19:00', min: 60 };
  const bike = { type: 'OUTDOOR_BIKE', name: 'Radfahren', start: '07:10', end: '07:58', min: 48 };
  it('lists all of them newest first, the first one is what the single call gives', () => {
    const r = rows([bike, tennis]);
    expect(healthAllToAsk(r, [], null, today, shiftDay).map((x) => x.start)).toEqual(['18:00', '07:10']);
    expect(healthToAsk(r, [], null, today, shiftDay).start).toBe('18:00');
    const acts = [{ id: 'a', day: today, time: '09:00', type: 'Run', movingS: 100 }, { id: 'b', day: today, time: '08:00', type: 'Run', movingS: 100, feelSkip: true }, { id: 'c', day: today, time: '10:00', type: 'Run', movingS: 100, feelWord: 'good' }];
    expect(feelAllToAsk(acts, today).map((a) => a.id)).toEqual(['a']);
    expect(feelToAsk(acts, today).id).toBe('a');
  });
  it('the answers to bike workouts of the watch become numbers per day (a word is the middle of its numbers)', () => {
    let v = withAnswer(null, exKey(today, bike), 'hard');
    v = withAnswer(v, exKey(today, tennis), 'good');
    const m = fitFeelByDay(rows([bike, tennis]), v);
    expect([...m]).toEqual([[today, [8]]]); // tennis is no bike workout
    expect(fitFeelByDay(rows([bike]), null).size).toBe(0);
  });
  it('the felt effort of a day mixes the rides of Strava and the bike workouts of the watch', () => {
    expect(feelDay([{ kind: 'bike', feelWord: 'light' }], [8])).toBe(5);
    expect(feelDay([], [8])).toBe(8);
    expect(feelDay([], [])).toBeNull();
    expect(feelDay([{ kind: 'run', feelWord: 'hard' }], undefined)).toBeNull();
  });
});
