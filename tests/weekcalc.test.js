// «Eine gemeinsame Rechnung» (Noah 22.11.2026 «1a 2a 3a 4a 5a»): one week calculated one way for the Heute card,
// the review and the comparisons. Fictional data only (test_data_gtp_); calendar days, never «now + n × 24 h».
import { describe, it, expect } from 'vitest';
import { weekCalc } from '../src/lib/weekcalc.js';
import { weekSums, weekFive } from '../src/lib/weekreview.js';
import { onePerStravaId, withStravaRides } from '../src/lib/kmbook.js';
import { normAct } from '../src/lib/flow.js';

const P = 'test_data_gtp_';
const MON = '2026-10-12';
const act = (id, day, f = {}) => ({ id: `${P}${id}`, day, time: '08:00', name: `${P}Runde ${id}`, type: 'Ride', kind: 'bike', km: 40, hm: 500, movingS: 3600, ...f });
const ride = (id, date, f = {}) => ({ id: `${P}e${id}`, date, kind: 'ride', source: 'strava', state: 'counted', bikeId: `${P}bike`, km: 40, hm: 500, stravaId: `${P}${id}`, ...f });
const FLOW = [
  normAct({ id: 'yoga', name: 'Yoga', icon: 'yoga', ring: 'move', goals: [{ id: 'g', count: 1, days: 7 }] }),
  normAct({ id: 'sauna', name: 'Sauna', icon: 'sauna', ring: 'rest', goals: [{ id: 'g', count: 1, days: 7 }] }),
  normAct({ id: 'meditation', name: 'Meditation', icon: 'lotus', ring: 'mind', goals: [{ id: 'g', count: 1, days: 1 }] }),
];
const tick = (actId, day, f = {}) => ({ id: `${P}${actId}-${day}`, actId, day, at: `${day}T10:00:00.000Z`, n: 1, ...f });

describe('the Strava ledger: a ride that stands twice counts once', () => {
  const twice = [ride('a', '2026-10-13'), ride('a', '2026-10-13', { id: `${P}e-copy` })];
  it('onePerStravaId keeps one entry per Strava id, a counted one first', () => {
    expect(onePerStravaId(twice)).toHaveLength(1);
    const open = ride('b', '2026-10-14', { state: 'open', bikeId: null });
    const counted = ride('b', '2026-10-14', { id: `${P}e-counted` });
    expect(onePerStravaId([open, counted])).toEqual([counted]);
    expect(onePerStravaId([ride('x', '2026-10-14', { source: 'hand', stravaId: undefined }), ride('x', '2026-10-14', { source: 'hand', stravaId: undefined, id: 'z' })])).toHaveLength(2);
  });
  it('withStravaRides lists it once', () => {
    expect(withStravaRides([], twice, [])).toHaveLength(1);
  });
  it('the week shows 40 km, not 80', () => {
    expect(weekCalc({ acts: [act('a', '2026-10-13')], book: twice }, MON)).toMatchObject({ km: 40, hm: 500 });
  });
});

describe('the rides of the week: file rides, counted rides, rides that wait', () => {
  it('a ride that waits in «Zum Prüfen» counts and is named (Noah «1a»)', () => {
    const waiting = ride('w', '2026-10-15', { state: 'open', bikeId: null, km: 25, hm: 300 });
    const r = weekCalc({ acts: [], book: [waiting, ride('c', '2026-10-13')] }, MON);
    expect(r).toMatchObject({ km: 65, hm: 800, waiting: 1 });
  });
  it('a waiting ride that is also a Strava activity counts once', () => {
    const waiting = ride('w', '2026-10-15', { state: 'open', bikeId: null, km: 25, hm: 300 });
    const r = weekCalc({ acts: [act('w', '2026-10-15', { km: 25, hm: 300 })], book: [waiting] }, MON);
    expect(r.km).toBe(25);
  });
  it('a ridden Strava activity without any ledger entry counts, an ignored bike does not', () => {
    const acts = [act('a', '2026-10-13', { gearId: 'g1' }), act('b', '2026-10-14', { gearId: 'g2', km: 10, hm: 0 })];
    expect(weekCalc({ acts }, MON).km).toBe(50);
    expect(weekCalc({ acts, ignore: ['g2'] }, MON).km).toBe(40);
  });
  it('days outside the week and after «up to» stay out', () => {
    const acts = [act('a', '2026-10-11'), act('b', '2026-10-13'), act('c', '2026-10-16'), act('d', '2026-10-19')];
    expect(weekCalc({ acts }, MON).km).toBe(80);
    expect(weekCalc({ acts }, MON, '2026-10-14').km).toBe(40);
  });
});

describe('time: measured and «ca.» kept apart', () => {
  it('a typed duration is measured, a tick without minutes takes its usual duration «ca.»', () => {
    const r = weekCalc({ acts: [], flowActs: FLOW, log: [tick('yoga', MON, { min: 45 }), tick('yoga', '2026-10-14')] }, MON);
    expect(r).toMatchObject({ measuredSecs: 2700, caSecs: 3600, secs: 6300, nCa: 1, noTime: 0, n: 2 });
  });
  it('the usual duration of the person wins over the standard', () => {
    const r = weekCalc({ acts: [], flowActs: FLOW, usual: { yoga: 30 }, log: [tick('yoga', MON)] }, MON);
    expect(r).toMatchObject({ caSecs: 1800, nCa: 1 });
  });
  it('daily habits and trip days stay out; a Strava ride and its tick count once', () => {
    const log = [tick('meditation', MON), tick('yoga', '2026-10-14', { via: 'trip' }), tick('yoga', '2026-10-15', { min: 30 })];
    const r = weekCalc({ acts: [], flowActs: FLOW, log }, MON);
    expect(r.n).toBe(1);
    expect(r.secs).toBe(1800);
  });
  it('recovery (Sauna) is not sport time', () => {
    const r = weekCalc({ acts: [], flowActs: FLOW, log: [tick('sauna', MON), tick('yoga', MON, { min: 20 })] }, MON);
    expect(r).toMatchObject({ n: 1, secs: 1200 });
  });
});

describe('other sports: their own small number, never «Velo»', () => {
  it('a run counts as a session and in «other», not in the Velo km', () => {
    const acts = [act('a', '2026-10-13'), act('r', '2026-10-14', { type: 'Run', kind: 'run', km: 8.4, hm: 60, movingS: 2700 })];
    const r = weekCalc({ acts, flowActs: [] }, MON);
    expect(r.km).toBe(40);
    expect(r.other).toEqual({ km: 8.4, n: 1 });
    expect(r.n).toBe(2);
    expect(r.measuredSecs).toBe(6300);
  });
});

describe('the watch: only a hint', () => {
  const health = [{ date: '2026-10-14', exercises: [{ type: 'OTHER', name: 'Tennis', start: '18:00', end: '19:00', min: 60 }] }];
  const flowActs = [normAct({ id: 'tennis', name: 'Tennis', icon: 'heart', ring: 'move', goals: [] })];
  it('a workout without a tick is told with its minutes, never counted', () => {
    const r = weekCalc({ acts: [], flowActs, health }, MON);
    expect(r.watch).toEqual({ n: 1, min: 60 });
    expect(r.n).toBe(0);
    expect(r.secs).toBe(0);
  });
  it('a ticked workout is no hint any more', () => {
    const r = weekCalc({ acts: [], flowActs, health, log: [tick('tennis', '2026-10-14', { min: 60 })] }, MON);
    expect(r.watch.n).toBe(0);
    expect(r.n).toBe(1);
  });
  it('a handled one is gone', () => {
    const r = weekCalc({ acts: [], flowActs, health, handled: ['fl-fbl-2026-10-14-1800'] }, MON);
    expect(r.watch.n).toBe(0);
  });
});

describe('F1: the same week gives the same numbers on every page', () => {
  const data = {
    acts: [act('a', '2026-10-13'), act('r', '2026-10-14', { type: 'Run', kind: 'run', km: 8, hm: 40, movingS: 2400 })],
    book: [ride('a', '2026-10-13'), ride('a', '2026-10-13', { id: `${P}e-copy` }), ride('w', '2026-10-16', { state: 'open', bikeId: null, km: 20, hm: 200 })],
    flowActs: FLOW,
    log: [tick('yoga', '2026-10-15')],
  };
  it('the review sums, the five numbers and the calculation agree', () => {
    const calc = weekCalc(data, MON);
    const sums = weekSums(data, MON);
    const five = weekFive(data, MON, '2026-10-18');
    expect(sums).toEqual(calc);
    expect(five.find((f) => f.key === 'km').value).toBe(calc.km);
    expect(five.find((f) => f.key === 'hours').value).toBe(calc.secs);
    expect(five.find((f) => f.key === 'n').value).toBe(calc.n);
    expect(calc.km).toBe(60);
    expect(calc.waiting).toBe(1);
  });
});
