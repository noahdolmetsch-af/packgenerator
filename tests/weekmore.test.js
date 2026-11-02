// «Wochenrückblick mit mehr Daten» (Noah 01.11.2026 «3c 5c»): the pure rules of lib/weekmore.js.
// Fictional data only (test_data_gtp_); calendar days, never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { bodyTiles, zonesWeek, bikesWeek, outdoorWeek, noteOf, putNote, notesOf, weekCourse, COURSE, COURSE_WEEKS, BODY } from '../src/lib/weekmore.js';
import { DEFAULT_BOUNDS, shiftDay } from '../src/lib/training.js';

const P = 'test_data_gtp_';
const MON = '2026-10-12';
const SUN = '2026-10-18';
const day = (i, f = {}) => ({ date: shiftDay(MON, i), restingHr: 50 + i, hrvMs: 60, sleep: { asleepMin: 420 }, steps: 8000, azm: 10, ...f });

describe('body tiles', () => {
  it('mean per day, sum for active minutes, each against the same days of the week before', () => {
    const health = [day(0), day(1), day(2), day(-7, { restingHr: 55 }), day(-6, { restingHr: 55 }), day(-5, { restingHr: 55 })];
    const t = bodyTiles(health, MON, shiftDay(MON, 2));
    const rhr = t.find((x) => x.key === 'restingHr');
    expect(rhr).toMatchObject({ value: 51, prev: 55, diff: -4, n: 3 });
    expect(t.find((x) => x.key === 'azm')).toMatchObject({ value: 30, prev: 30, diff: 0, how: 'sum' });
    expect(t.find((x) => x.key === 'sleep').value).toBe(420);
    expect(rhr.days).toHaveLength(3);
  });
  it('a value with no day in the week is left out, nothing is invented', () => {
    expect(bodyTiles([], MON, SUN)).toEqual([]);
    expect(bodyTiles([day(0, { hrvMs: null })], MON, SUN).some((x) => x.key === 'hrvMs')).toBe(false);
    expect(BODY.map((b) => b.key)).toEqual(['restingHr', 'hrvMs', 'sleep', 'steps', 'azm']);
  });
  it('the week before is missing → no change', () => {
    expect(bodyTiles([day(0)], MON, SUN)[0].diff).toBeNull();
  });
});

describe('zones, bikes, weather', () => {
  const act = (id, d, f = {}) => ({ id: `${P}${id}`, day: d, kind: 'bike', km: 30, movingS: 3600, gearId: 'b1', hist: { 100: 600, 150: 300 }, ...f });
  it('seconds per zone from the heart rate histograms of the week; none without a histogram', () => {
    const z = zonesWeek([act('a', MON), act('b', shiftDay(MON, 9))], MON, SUN, DEFAULT_BOUNDS);
    expect(z.total).toBe(900);
    expect(zonesWeek([act('a', MON, { hist: null })], MON, SUN, DEFAULT_BOUNDS)).toBeNull();
  });
  it('km and rides per bike, biggest first; unknown gear is «without a bike»', () => {
    const rows = bikesWeek([act('a', MON), act('b', shiftDay(MON, 1), { km: 12.34 }), act('c', shiftDay(MON, 2), { gearId: null, km: 5 }), act('d', shiftDay(MON, 3), { kind: 'run', km: 9 })], MON, SUN, [{ id: 'b1', name: 'Gravel' }]);
    expect(rows).toEqual([{ id: 'b1', name: 'Gravel', km: 42.3, n: 2 }, { id: '', name: '', km: 5, n: 1 }]);
  });
  it('weather and appointments per day up to a day; empty days stay null', () => {
    const o = outdoorWeek({ [MON]: { tmax: 14, rainMm: 0, sunH: 5 } }, { [MON]: 2 }, MON, shiftDay(MON, 2));
    expect(o.days).toHaveLength(3);
    expect(o).toMatchObject({ hasWeather: true, hasEvents: true });
    expect(o.days[1]).toMatchObject({ tmax: null, events: null });
    expect(outdoorWeek({}, {}, MON, SUN)).toMatchObject({ hasWeather: false, hasEvents: false });
  });
});

describe('note and goal of a week', () => {
  it('stores per ISO week, trims, caps, removes an empty week', () => {
    let v = putNote(null, MON, { note: '  Gute Woche  ' });
    expect(noteOf(v, MON)).toEqual({ note: 'Gute Woche', goal: '', goalDone: false });
    v = putNote(v, shiftDay(MON, 7), { goal: 'Zwei Fahrten' });
    expect(Object.keys(v.weeks)).toEqual(['2026-W42', '2026-W43']);
    v = putNote(v, shiftDay(MON, 7), { goalDone: true });
    expect(noteOf(v, shiftDay(MON, 7)).goalDone).toBe(true);
    v = putNote(v, shiftDay(MON, 7), { goal: '' }); // removing the goal also clears «done»
    expect(noteOf(v, shiftDay(MON, 7))).toEqual({ note: '', goal: '', goalDone: false });
    v = putNote(v, MON, { note: '' });
    expect(v.weeks).toEqual({});
    expect(putNote(null, MON, { note: 'x'.repeat(900) }).weeks['2026-W42'].note).toHaveLength(600);
  });
  it('a broken record is cleaned, never trusted', () => {
    expect(notesOf({ weeks: { kaputt: { note: 'x' }, '2026-W42': 5, '2026-W43': { note: 7, goal: 'ok' } } }).weeks).toEqual({ '2026-W43': { note: '', goal: 'ok', goalDone: false } });
    expect(notesOf(null)).toEqual({ weeks: {} });
  });
});

describe('the course over eight weeks (Noah 02.11.2026 «1a 3a»)', () => {
  const act = (id, d, f = {}) => ({ id: `${P}${id}`, day: d, kind: 'bike', km: 30, movingS: 3600, hist: { 100: 600 }, ...f });
  const data = () => ({
    acts: [act('a', shiftDay(MON, -7)), act('b', shiftDay(MON, -14), { km: 50 }), act('c', MON, { km: 20 })],
    health: Array.from({ length: 70 }, (_, i) => ({ date: shiftDay(MON, i - 63), restingHr: i < 63 ? 50 : 56 })),
    weather: { [MON]: { tmax: 10, rainMm: 2 }, [shiftDay(MON, 1)]: { tmax: 14, rainMm: 0 } },
    log: [],
    flowActs: [],
  });
  it('eight points, the shown week last and highlighted, each counted for the same days', () => {
    const c = weekCourse('restingHr', data(), MON, shiftDay(MON, 2), DEFAULT_BOUNDS);
    expect(c.points).toHaveLength(COURSE_WEEKS);
    expect(c.points.at(-1)).toMatchObject({ monday: MON, hi: true, value: 56 });
    expect(c.points[0].monday).toBe(shiftDay(MON, -49));
    expect(c.usual).toBe(50);
    expect(c.unit).toBe('bpm');
  });
  it('km per week, hours, weather: weeks without a value stay null, never 0', () => {
    const km = weekCourse('bikes', data(), MON, SUN, DEFAULT_BOUNDS);
    expect(km.points.map((p) => p.value).slice(-3)).toEqual([50, 30, 20]);
    expect(km.points[0].value).toBeNull();
    expect(weekCourse('hours', data(), MON, SUN, DEFAULT_BOUNDS).now).toBe(1);
    const tmax = weekCourse('tmax', data(), MON, SUN, DEFAULT_BOUNDS);
    expect(tmax.now).toBe(12);
    expect(weekCourse('rain', data(), MON, SUN, DEFAULT_BOUNDS).now).toBe(2);
  });
  it('an unknown key is nothing; every key has a unit', () => {
    expect(weekCourse('kaputt', data(), MON, SUN, DEFAULT_BOUNDS)).toBeNull();
    for (const k of Object.keys(COURSE)) expect(weekCourse(k, data(), MON, SUN, DEFAULT_BOUNDS).points).toHaveLength(8);
  });
});
