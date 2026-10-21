// «Training» TR1–TR4 (Noah 13.10.2026 «1-5a», «tr1-4 ok»): the rules of lib/training.js, the server's
// zones and heart rate per beat (api/strava.js), and the fetch keeping every activity. Fictional only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { DETAIL_V, ftpEstimate, powerBounds, powerZoneSecs, powerLoad, wkg, activitiesForTrip, isoWeek, mondayOf, weekOf, cleanSession, planOf, goalOf, weeksTo, doneBy, copyWeek, prunePlan, weekNumbers, kindOf, actRecord, zonesOf, zoneSecs, mainZone, shares, hmm, speed, sameRoute, kindCounts, monthsOf, needDetail, boundsOfStrava, validBounds, DEFAULT_BOUNDS, zoneRange, typeKey } from '../src/lib/training.js';
import { trimZones, trimStreams, best20, trimActivity, trimPower, pausesOf, trimEfforts } from '../api/strava.js';
import { createDb } from '../src/lib/db.js';
import { keepActivities, fetchTraining, loadDetail } from '../src/lib/strava/client.svelte.js';

const STRAVA_Z = { hr: [{ min: 0, max: 115 }, { min: 115, max: 135 }, { min: 135, max: 150 }, { min: 150, max: 165 }, { min: 165, max: -1 }] };
const rec = (id, f = {}) => ({ ...actRecord({ id, name: 'Testrunde', type: 'GravelRide', startLocal: '2026-10-10T08:30:00Z', km: 30, hm: 300, movingS: 3600, hrAvg: 130, ...f }), ...f.extra });

describe('the kinds', () => {
  it('rides, runs and hikes; anything else is «other»', () => {
    expect(['GravelRide', 'MountainBikeRide', 'EBikeRide', 'VirtualRide', 'Ride'].map(kindOf)).toEqual(['bike', 'bike', 'bike', 'bike', 'bike']);
    expect(['Run', 'TrailRun', 'Hike', 'Walk', 'Swim', ''].map(kindOf)).toEqual(['run', 'run', 'hike', 'hike', 'other', 'other']);
    expect(typeKey('Swim')).toBe('Swim');
    expect(typeKey('Kitesurf')).toBe('Other|kind');
  });
  it('an activity keeps day and time as Strava gives them locally', () => {
    expect(actRecord({ id: 7, type: 'Run', startLocal: '2026-10-11T09:20:00Z', km: 9.1, movingS: 2880, elapsedS: 3000 })).toMatchObject({ id: '7', day: '2026-10-11', time: '09:20', kind: 'run', km: 9.1, elapsedS: 3000, hrAvg: null });
    expect(actRecord({ id: 8, start: '2026-10-11T22:30:00Z' }).day).toBe('2026-10-12'); // Zurich
  });
});

describe('the zones', () => {
  it('Strava’s, own ones when changed, else the standard', () => {
    expect(boundsOfStrava(STRAVA_Z)).toEqual([115, 135, 150, 165]);
    expect(zonesOf(STRAVA_Z, null)).toEqual({ bounds: [115, 135, 150, 165], source: 'strava' });
    expect(zonesOf(STRAVA_Z, { own: [110, 130, 148, 162] }).source).toBe('own');
    expect(zonesOf(null, { own: [140, 130, 150, 160] })).toEqual({ bounds: DEFAULT_BOUNDS, source: 'default' });
    expect(validBounds([100, 120, 140, 160])).toBe(true);
    expect(validBounds([100, 120, 140])).toBe(false);
    expect(zoneRange(0, [115, 135, 150, 165])).toEqual({ from: null, to: 114 });
    expect(zoneRange(4, [115, 135, 150, 165])).toEqual({ from: 165, to: null });
  });
  it('seconds per zone from the beats; a changed zone needs no new call', () => {
    const hist = { 100: 600, 120: 1800, 140: 900, 155: 300, 170: 60 };
    expect(zoneSecs(hist, [115, 135, 150, 165])).toEqual([600, 1800, 900, 300, 60]);
    expect(zoneSecs(hist, [125, 145, 160, 175])).toEqual([2400, 900, 300, 60, 0]);
    expect(zoneSecs(null, DEFAULT_BOUNDS)).toBe(null);
    expect(mainZone([600, 1800, 900, 300, 60])).toBe(1);
    expect(shares([600, 1800, 900, 300, 60])).toEqual({ base: 66, intense: 10 });
  });
});

describe('numbers and lists', () => {
  it('h:mm and the speed', () => {
    expect(hmm(6120)).toBe('1:42');
    expect(hmm(2880)).toBe('0:48');
    expect(speed({ km: 42.3, movingS: 6120 })).toBe(24.9);
    expect(speed({ km: 0, movingS: 100 })).toBe(null);
  });
  it('same route: same name and kind, distance within 10 %, the fastest marked', () => {
    const a = rec('1', { movingS: 6120 });
    const b = rec('2', { startLocal: '2026-09-22T17:00:00Z', movingS: 6500, km: 31 });
    const c = rec('3', { startLocal: '2026-08-30T17:00:00Z', km: 45 });
    const d = rec('4', { type: 'Run' });
    expect(sameRoute([a, b, c, d], a)).toEqual({ list: [a, b], fastest: '1' });
    expect(sameRoute([a], a).fastest).toBe(null);
  });
  it('chips per kind and the months, newest first', () => {
    const list = [rec('1'), rec('2', { type: 'Run', startLocal: '2026-09-01T07:00:00Z' }), rec('3', { type: 'Hike' })];
    expect(kindCounts(list)).toEqual([{ key: 'all', n: 3 }, { key: 'bike', n: 1 }, { key: 'run', n: 1 }, { key: 'hike', n: 1 }]);
    expect(monthsOf(list)).toEqual(['2026-10', '2026-09']);
  });
  it('details: the newest with heart rate, recent, at most a few', () => {
    const list = [rec('1'), rec('2', { hrAvg: null }), rec('3', { startLocal: '2026-01-01T07:00:00Z' }), rec('4', { extra: { detail: '2026-10-11', dv: 2 } }), rec('5', { startLocal: '2026-10-12T07:00:00Z' })];
    // recent with heart rate first; then (19.10.2026 «4a») the older ones and the ones without heart rate, newest first;
    // '4' has the details of an older kind (dv 2) and is fetched once more
    expect(needDetail(list, '2026-10-13').map((a) => a.id)).toEqual(['5', '1', '4', '2', '3']);
    expect(needDetail([...list.slice(0, 4).map((a) => ({ ...a, detail: 'x', dv: DETAIL_V })), list[4]], '2026-10-13').map((a) => a.id)).toEqual(['5']);
    expect(needDetail([{ ...list[2], noDetail: '2026-10-12' }], '2026-10-13')).toEqual([]);
    expect(needDetail(list, '2026-10-13', { max: 1 }).map((a) => a.id)).toEqual(['5']);
  });
});

describe('the server', () => {
  it('zones: the five ranges, nothing else', () => {
    expect(trimZones({ heart_rate: { custom_zones: true, zones: STRAVA_Z.hr }, power: { zones: [1] } })).toEqual({ hr: STRAVA_Z.hr, custom: true });
    expect(trimZones({})).toEqual({ hr: [], custom: false });
  });
  it('heart rate: seconds per beat (pauses not counted) and a short curve, no route', () => {
    const time = Array.from({ length: 400 }, (_, i) => (i < 200 ? i : i + 600));
    const heartrate = time.map((_, i) => (i < 200 ? 120 : 150));
    const { hist, curve } = trimStreams({ time: { data: time }, heartrate: { data: heartrate }, latlng: { data: [[47, 8]] } });
    expect(hist).toEqual({ 120: 199, 150: 199 });
    expect(curve.length).toBe(120);
    expect(curve[0]).toEqual([0, 120]);
    expect(curve.at(-1)[1]).toBe(150);
    expect(trimStreams(null)).toEqual({ hist: null, curve: [], w20: null, pHist: null, p25: null, pCurve: null, np: null, pauses: null, hCurve: null });
  });
  it('power: Ø and max from Strava, the best 20 minutes from a power meter', () => {
    expect(trimActivity({ id: 1, average_watts: 187.6, max_watts: 612, device_watts: true })).toMatchObject({ wAvg: 188, wMax: 612, wDevice: true });
    expect(trimActivity({ id: 2, average_watts: 150.2, device_watts: false })).toMatchObject({ wAvg: 150, wMax: null, wDevice: false });
    // 40 min at 200 W with 20 min at 260 W in the middle, a 10 min pause before
    const time = [];
    const watts = [];
    for (let s = 0; s < 3000; s++) {
      time.push(s < 600 ? s : s + 600);
      watts.push(s >= 1000 && s < 2200 ? 260 : 200);
    }
    expect(best20(time, watts)).toBe(260);
    expect(best20(time.slice(0, 600), watts.slice(0, 600))).toBe(null);
    expect(trimStreams({ time: { data: time }, watts: { data: watts } }).w20).toBe(260);
  });
  it('tour look back: speed, cadence, temperature, NP, kJ and Relative Effort from the list', () => {
    expect(trimActivity({ id: 3, average_speed: 6.25, max_speed: 15.1, average_cadence: 84.6, average_temp: 14.4, weighted_average_watts: 211.4, kilojoules: 1520.6, device_watts: true, suffer_score: 87 }))
      .toMatchObject({ spdAvg: 22.5, spdMax: 54.4, cad: 85, tempAvg: 14, wNorm: 211, kj: 1521, effort: 87 });
    expect(trimActivity({ id: 4, weighted_average_watts: 180, kilojoules: 900, device_watts: false, average_temp: 0 }))
      .toMatchObject({ spdAvg: null, cad: null, tempAvg: 0, wNorm: null, kj: null, effort: null });
  });
  it('power curve and seconds per 10 W; breaks; own segment times, records first', () => {
    const time = Array.from({ length: 400 }, (_, i) => i);
    const watts = time.map((i) => (i < 300 ? 204 : 316));
    const { pHist, p25, pCurve } = trimPower(time, watts);
    expect(pHist).toEqual({ 200: 300, 310: 99 });
    // seconds per 25 W for the «25 W Leistungsverteilung» of the analysis
    expect(p25).toEqual({ 200: 300, 300: 99 });
    // Peak Power of the analysis: 1 s to 6 h
    expect(pCurve).toEqual([[1, 316], [5, 316], [15, 316], [30, 316], [60, 316], [120, 296], [300, 241], [600, null], [1200, null], [1800, null], [2700, null], [3600, null], [5400, null], [7200, null], [10800, null], [14400, null], [21600, null]]);
    expect(trimPower([], [])).toEqual({ pHist: null, p25: null, pCurve: null });
    // a stop of 90 s (moving false), a short one of 20 s (not a break), a gap of 5 min in the data
    const t = Array.from({ length: 600 }, (_, i) => (i < 500 ? i : i + 300));
    const moving = t.map((_, i) => !((i >= 100 && i < 190) || (i >= 300 && i < 320)));
    expect(pausesOf(t, moving)).toEqual({ n: 2, secs: 90 + 301 });
    expect(pausesOf(null, null)).toBe(null);
    const segs = trimEfforts([{ name: 'test_data_gtp_ Anstieg', moving_time: 412, pr_rank: null }, { name: 'test_data_gtp_ Sprint', elapsed_time: 31, pr_rank: 1, segment: { start_latlng: [47, 8] } }, { name: '', moving_time: 5 }]);
    expect(segs).toEqual([{ name: 'test_data_gtp_ Sprint', s: 31, pr: 1 }, { name: 'test_data_gtp_ Anstieg', s: 412, pr: null }]);
    expect(trimEfforts(undefined)).toEqual([]);
  });
});

describe('the fetch keeps every activity', () => {
  it('runs and hikes too; details and the note stay when fetched again; zones once a day', async () => {
    const db = createDb(`training-${Math.random()}`);
    const acts = [{ id: '11', name: 'Lauf', type: 'Run', startLocal: '2026-10-12T07:00:00Z', km: 9, movingS: 2900, hrAvg: 150 }, { id: '12', name: 'Runde', type: 'GravelRide', startLocal: '2026-10-11T07:00:00Z', km: 40, movingS: 6000, hrAvg: null }];
    await keepActivities(db, acts);
    expect((await db.activities.toArray()).map((a) => [a.id, a.kind])).toEqual([['11', 'run'], ['12', 'bike']]);
    const log = [];
    const c = async (step, { params = {} } = {}) => {
      log.push([step, params.id]);
      if (step === 'zones') return { ok: true, hr: STRAVA_Z.hr, custom: false };
      if (step === 'detail') return { ok: true, id: params.id, kcal: 512, desc: 'test_data_gtp_ lockere Runde', hist: { 150: 2800 }, curve: [[0, 140], [48, 152]], pauses: { n: 1, secs: 240 }, segs: [{ name: 'test_data_gtp_ Seeweg', s: 300, pr: 2 }], dv: DETAIL_V };
      return { ok: true };
    };
    const now = new Date('2026-10-13T08:00:00Z');
    await fetchTraining(db, c, now);
    // 19.10.2026 «4a»: the ride without heart rate gets its details too (laps, splits, climbs)
    expect(log).toEqual([['zones', undefined], ['detail', '11'], ['detail', '12']]);
    expect((await db.activities.get('11')).kcal).toBe(512);
    await db.activities.update('11', { note: 'Beine gut' });
    await keepActivities(db, [{ ...acts[0], name: 'Lauf am See' }]);
    expect(await db.activities.get('11')).toMatchObject({ name: 'Lauf am See', kcal: 512, desc: 'test_data_gtp_ lockere Runde', pauses: { n: 1, secs: 240 }, segs: [{ name: 'test_data_gtp_ Seeweg', s: 300, pr: 2 }], note: 'Beine gut', hist: { 150: 2800 } });
    await fetchTraining(db, c, new Date('2026-10-13T09:00:00Z'));
    expect(log.length).toBe(3); // zones fresh, details there
    await loadDetail(db, '12', { call: c, now });
    expect((await db.activities.get('12')).detail).toBe(now.toISOString());
  });
  it('an error (Strava busy) never spoils the fetch', async () => {
    const db = createDb(`training-${Math.random()}`);
    await keepActivities(db, [{ id: '21', type: 'Ride', startLocal: '2026-10-12T07:00:00Z', hrAvg: 140 }]);
    await expect(fetchTraining(db, async () => { throw Object.assign(new Error('x'), { code: 'strava_busy' }); }, new Date('2026-10-13T08:00:00Z'))).resolves.toBeUndefined();
  });
});

describe('TR4: the week plan', () => {
  it('Monday, the seven days, a clean session', () => {
    expect(mondayOf('2026-10-13')).toBe('2026-10-12');
    expect(['2026-10-12', '2026-01-01', '2025-12-29', '2027-01-03'].map(isoWeek)).toEqual([42, 1, 1, 53]);
    expect(mondayOf('2026-10-18')).toBe('2026-10-12');
    expect(weekOf('2026-10-12')).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
    expect(cleanSession({ id: 'a', day: '2026-10-14', kind: 'swim', name: ' Locker ', mins: '30', zone: 9 })).toEqual({ id: 'a', day: '2026-10-14', kind: 'bike', name: 'Locker', mins: 30, zone: null });
    expect(cleanSession({ day: 'x', mins: 30 })).toBe(null);
    expect(cleanSession({ day: '2026-10-14', mins: 0 })).toBe(null);
    expect(planOf({ sessions: [{ id: 'a', day: '2026-10-14', mins: 30, zone: 2 }, { day: 'nope' }] }).length).toBe(1);
    expect(planOf(null)).toEqual([]);
  });
  it('the goal is optional in every part', () => {
    expect(goalOf({ name: 'Jura', hours: '8', base: '80', until: '2027-06-01' })).toEqual({ name: 'Jura', hours: 8, base: 80, until: '2027-06-01' });
    expect(goalOf({ hours: 100 })).toBe(null);
    expect(goalOf({ name: '', hours: '', base: '', until: '' })).toBe(null);
    expect(goalOf({ base: '0' })).toEqual({ name: '', hours: null, base: 0, until: null });
    expect(goalOf(null)).toBe(null);
    expect(weeksTo('2026-10-27', '2026-10-13')).toBe(2);
    expect(weeksTo('2026-01-01', '2026-10-13')).toBe(0);
  });
  it('done by an activity of its kind that day; «Wie letzte Woche»; old ones go', () => {
    const s = { id: 'a', day: '2026-10-07', kind: 'bike', name: 'Intervalle', mins: 75, zone: 4 };
    const run = rec('9', { type: 'Run', startLocal: '2026-10-07T07:00:00Z' });
    const ride = rec('8', { startLocal: '2026-10-07T17:00:00Z' });
    expect(doneBy(s, [run])).toBe(null);
    expect(doneBy(s, [run, ride])?.id).toBe('8');
    const next = copyWeek([s, { ...s, id: 'b', day: '2026-09-30' }], '2026-10-12');
    expect(next.map((x) => [x.day, x.name, x.mins, x.zone])).toEqual([['2026-10-14', 'Intervalle', 75, 4]]);
    expect(next[0].id).not.toBe('a');
    expect(prunePlan([s, { ...s, day: '2026-01-01' }], '2026-10-13')).toEqual([s]);
  });
  it('a week in numbers: zones share the moving time, the rest unknown, the plan in minutes', () => {
    const a = rec('1', { startLocal: '2026-10-13T07:00:00Z', movingS: 3600, extra: { hist: { 120: 1800, 140: 1800 } } });
    const b = rec('2', { startLocal: '2026-10-14T07:00:00Z', movingS: 1200 });
    const c = rec('3', { startLocal: '2026-10-05T07:00:00Z', movingS: 999 });
    const n = weekNumbers([a, b, c], [{ day: '2026-10-15', mins: 90 }, { day: '2026-10-20', mins: 30 }], '2026-10-12', [115, 135, 150, 165]);
    expect(n).toEqual({ zones: [0, 1800, 1800, 0, 0], unknown: 1200, secs: 4800, planned: 90 });
  });
});

describe('the activities of a trip', () => {
  it('the rides booked to the trip and every bike activity of its days, in order', () => {
    const trip = { id: 't1', startDate: '2026-10-10', days: 2 };
    const a = rec('1', { startLocal: '2026-10-10T08:00:00Z' });
    const b = rec('2', { startLocal: '2026-10-11T08:00:00Z' });
    const c = rec('3', { type: 'Run', startLocal: '2026-10-11T07:00:00Z' });
    const d = rec('4', { startLocal: '2026-10-12T08:00:00Z' });
    const e = rec('5', { startLocal: '2026-10-09T18:00:00Z' });
    expect(activitiesForTrip(trip, [d, c, b, a, e], [{ tripId: 't1', stravaId: '5' }]).map((x) => x.id)).toEqual(['5', '1', '2']);
    expect(activitiesForTrip({ id: 'x' }, [a])).toEqual([]);
  });
});

describe('power: FTP, zones, load, W/kg (Noah 13.10.2026 «a und b», «a»)', () => {
  it('estimated FTP is 95 % of the best 20 minutes of the last 90 days', () => {
    const acts = [{ day: '2026-10-01', w20: 250 }, { day: '2026-06-01', w20: 300 }, { day: '2026-10-10', w20: null }];
    expect(ftpEstimate(acts, '2026-10-13')).toBe(238);
    expect(ftpEstimate([], '2026-10-13')).toBe(null);
  });
  it('seven power zones from the 10 W histogram', () => {
    expect(powerBounds(200)).toEqual([110, 150, 180, 210, 240, 300]);
    expect(powerZoneSecs({ 100: 10, 140: 20, 200: 30, 400: 5 }, 200)).toEqual([10, 20, 0, 30, 0, 0, 5]);
    expect(powerZoneSecs(null, 200)).toBe(null);
    expect(powerZoneSecs({ 100: 1 }, null)).toBe(null);
  });
  it('load from NP and FTP; W/kg', () => {
    expect(powerLoad({ wNorm: 200, movingS: 7200 }, 250)).toEqual({ intensity: 0.8, load: 128 });
    expect(powerLoad({ wNorm: null, movingS: 7200 }, 250)).toBe(null);
    expect(wkg(238, 72)).toBe(3.3);
    expect(wkg(238, null)).toBe(null);
  });
});
