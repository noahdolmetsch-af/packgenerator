// «Training» TR1–TR3 (Noah 13.10.2026 «1-5a», «tr1-4 ok»): the rules of lib/training.js, the server's
// zones and heart rate per beat (api/strava.js), and the fetch keeping every activity. Fictional only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { kindOf, actRecord, zonesOf, zoneSecs, mainZone, shares, hmm, speed, sameRoute, kindCounts, monthsOf, needDetail, boundsOfStrava, validBounds, DEFAULT_BOUNDS, zoneRange, typeKey } from '../src/lib/training.js';
import { trimZones, trimStreams } from '../api/strava.js';
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
    const list = [rec('1'), rec('2', { hrAvg: null }), rec('3', { startLocal: '2026-01-01T07:00:00Z' }), rec('4', { extra: { detail: '2026-10-11' } }), rec('5', { startLocal: '2026-10-12T07:00:00Z' })];
    expect(needDetail(list, '2026-10-13').map((a) => a.id)).toEqual(['5', '1']);
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
    expect(trimStreams(null)).toEqual({ hist: null, curve: [] });
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
      if (step === 'detail') return { ok: true, id: params.id, kcal: 512, hist: { 150: 2800 }, curve: [[0, 140], [48, 152]] };
      return { ok: true };
    };
    const now = new Date('2026-10-13T08:00:00Z');
    await fetchTraining(db, c, now);
    expect(log).toEqual([['zones', undefined], ['detail', '11']]);
    expect((await db.activities.get('11')).kcal).toBe(512);
    await db.activities.update('11', { note: 'Beine gut' });
    await keepActivities(db, [{ ...acts[0], name: 'Lauf am See' }]);
    expect(await db.activities.get('11')).toMatchObject({ name: 'Lauf am See', kcal: 512, note: 'Beine gut', hist: { 150: 2800 } });
    await fetchTraining(db, c, new Date('2026-10-13T09:00:00Z'));
    expect(log.length).toBe(2); // zones fresh, details there
    await loadDetail(db, '12', { call: c, now });
    expect((await db.activities.get('12')).detail).toBe(now.toISOString());
  });
  it('an error (Strava busy) never spoils the fetch', async () => {
    const db = createDb(`training-${Math.random()}`);
    await keepActivities(db, [{ id: '21', type: 'Ride', startLocal: '2026-10-12T07:00:00Z', hrAvg: 140 }]);
    await expect(fetchTraining(db, async () => { throw Object.assign(new Error('x'), { code: 'strava_busy' }); }, new Date('2026-10-13T08:00:00Z'))).resolves.toBeUndefined();
  });
});
