// «Strava-Fahrt vollständig» (Noah 19.10.2026 «1a 2a 3a 4a 5b»): more from Strava (laps, splits, «How hard?»,
// kind, bests, temperature, steepest bit), the sensor values of an uploaded GPX, the older details in the
// background, every list opens the activity page, and the two fixes (Verlauf name, «Dein Tempo» bike only).
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { trimActivity, trimLaps, trimSplits, rpeOf, trimExtra } from '../api/strava.js';
import { sensorsOf, rideSensors, analyseRide, addToPace } from '../src/lib/gpx.js';
import { actRecord, KEEP } from '../src/lib/training.js';
import { actHref } from '../src/lib/strava/acthref.js';
import { actOf } from '../src/lib/review/actdata.js';
import { tempoRides } from '../src/lib/review/werte.js';
import { stravaTwin } from '../src/lib/kmbook.js';
import { stravaOfTrip } from '../src/lib/touren/aktivitaeten.js';
import { createDb } from '../src/lib/db.js';
import { keepActivities, fetchTraining } from '../src/lib/strava/client.svelte.js';
import { ANALYSES } from '../src/lib/training/analyses.js';

describe('the server sends more about an activity, never the route', () => {
  it('kind, bests, highest and lowest point', () => {
    const a = trimActivity({ id: 7, type: 'Ride', workout_type: 11, pr_count: 3, achievement_count: 5, elev_high: 1421.6, elev_low: 402.2, map: { summary_polyline: 'x' }, start_latlng: [47, 8] });
    expect(a).toMatchObject({ workout: 'race', prs: 3, achv: 5, elevHigh: 1422, elevLow: 402 });
    expect(JSON.stringify(a)).not.toMatch(/polyline|latlng/);
    expect(trimActivity({ id: 8, workout_type: 10 })).toMatchObject({ workout: null, prs: 0, achv: 0, elevHigh: null });
  });
  it('laps (two or more), splits per km, «How hard?»', () => {
    const laps = trimLaps([{ name: 'Lap 1', distance: 10230, moving_time: 1500, total_elevation_gain: 120.4, average_heartrate: 141.2, average_watts: 201, average_speed: 6.82 }, { name: 'test_data_gtp_ Anstieg', distance: 5000, moving_time: 900, total_elevation_gain: 300 }], true);
    expect(laps).toEqual([
      { n: 1, name: 'Lap 1', km: 10.2, s: 1500, hm: 120, hr: 141, w: 201, kmh: 24.6 },
      { n: 2, name: 'test_data_gtp_ Anstieg', km: 5, s: 900, hm: 300, hr: null, w: null, kmh: null },
    ]);
    expect(trimLaps([{ distance: 1 }])).toEqual([]);
    expect(trimLaps([{ distance: 1000, moving_time: 100, average_watts: 300 }, { distance: 1000, moving_time: 100 }], false)[0].w).toBe(null);
    expect(trimSplits([{ split: 1, distance: 1000, moving_time: 150, elevation_difference: -4.2, average_heartrate: 130, average_speed: 6.67 }, { split: 2, distance: 1000, moving_time: 200, elevation_difference: 18 }])).toEqual([
      { k: 1, km: 1, s: 150, hm: -4, hr: 130, kmh: 24 },
      { k: 2, km: 1, s: 200, hm: 18, hr: null, kmh: null },
    ]);
    expect(rpeOf({ perceived_exertion: 7 })).toBe(7);
    expect(rpeOf({ perceived_exertion: null })).toBe(null);
    expect(rpeOf({ perceived_exertion: 14 })).toBe(null);
  });
  it('temperature low/high and the steepest 200 m', () => {
    const n = 101;
    const time = Array.from({ length: n }, (_, i) => i * 10);
    const distance = time.map((_, i) => i * 20); // 2 km, a point every 20 m
    const altitude = distance.map((d) => (d >= 1000 && d <= 1400 ? (d - 1000) * 0.12 : d > 1400 ? 48 : 0));
    const temp = time.map((_, i) => 8 + (i % 7));
    const x = trimExtra({ time: { data: time }, distance: { data: distance }, altitude: { data: altitude }, temp: { data: temp } });
    expect(x).toEqual({ tempMin: 8, tempMax: 14, steep: 12 });
    expect(trimExtra(null)).toEqual({ tempMin: null, tempMax: null, steep: null });
  });
});

describe('the app keeps the new values', () => {
  it('actRecord and KEEP', () => {
    const r = actRecord({ id: 1, type: 'Ride', startLocal: '2026-10-12T07:00:00Z', workout: 'workout', prs: 2, achv: 4, elevHigh: 900, elevLow: 400, device: 'test_data_gtp_ Computer' });
    expect(r).toMatchObject({ workout: 'workout', prs: 2, achv: 4, elevHigh: 900, elevLow: 400, device: 'test_data_gtp_ Computer' });
    for (const k of ['laps', 'splits', 'rpe', 'tempMin', 'tempMax', 'steep', 'noDetail']) expect(KEEP).toContain(k);
    expect(ANALYSES.act.map((a) => a.key)).toEqual(expect.arrayContaining(['laps', 'splits', 'segs']));
  });
  it('older details in the background; an activity Strava has no details for is skipped, busy stops', async () => {
    const db = createDb(`strava-fahrt-${Math.random()}`);
    await keepActivities(db, [
      { id: '31', type: 'Ride', startLocal: '2026-10-12T07:00:00Z', km: 40, movingS: 5000, hrAvg: 140 },
      { id: '32', type: 'Ride', startLocal: '2024-05-01T07:00:00Z', km: 60, movingS: 9000 },
      { id: '33', type: 'Ride', startLocal: '2023-05-01T07:00:00Z', km: 30, movingS: 4000 },
    ]);
    await db.settings.put({ key: 'strava.zones', value: { hr: [], at: '2026-10-13T07:30:00Z' } });
    const log = [];
    const c = async (step, { params = {} } = {}) => {
      log.push(params.id);
      if (params.id === '32') throw Object.assign(new Error('x'), { code: 'strava_error' });
      return { ok: true, laps: [{ n: 1, km: 20, s: 2500 }, { n: 2, km: 20, s: 2500 }], splits: [], rpe: 6, tempMin: 9, tempMax: 15, steep: 8.4, dv: 4 };
    };
    const now = new Date('2026-10-13T08:00:00Z');
    await fetchTraining(db, c, now);
    expect(log).toEqual(['31', '32', '33']);
    expect(await db.activities.get('31')).toMatchObject({ rpe: 6, tempMin: 9, tempMax: 15, steep: 8.4, dv: 4 });
    expect((await db.activities.get('33')).laps).toHaveLength(2);
    expect((await db.activities.get('32')).noDetail).toBe(now.toISOString());
    await fetchTraining(db, c, new Date('2026-10-13T09:00:00Z'));
    expect(log).toHaveLength(3);
  });
});

describe('an uploaded GPX: heart rate, cadence, power and temperature from the file', () => {
  it('reads Garmin extensions and TCX', () => {
    expect(sensorsOf('<ele>3</ele><extensions><gpxtpx:TrackPointExtension><gpxtpx:atemp>12.5</gpxtpx:atemp><gpxtpx:hr>142</gpxtpx:hr><gpxtpx:cad>88</gpxtpx:cad></gpxtpx:TrackPointExtension><power>210</power></extensions>')).toEqual({ hr: 142, cad: 88, w: 210, temp: 12.5 });
    expect(sensorsOf('<HeartRateBpm><Value>130</Value></HeartRateBpm><Cadence>80</Cadence><Extensions><ns3:TPX><ns3:Watts>190</ns3:Watts></ns3:TPX></Extensions>', true)).toEqual({ hr: 130, cad: 80, w: 190 });
    expect(sensorsOf('<ele>3</ele><time>2026-10-12T07:00:00Z</time>')).toEqual({});
  });
  it('Ø and max while moving, seconds per beat; null without sensors', () => {
    const pts = [0, 10, 20, 30, 400].map((s, i) => ({ t: s * 1000, hr: 120 + i * 10, cad: i === 1 ? 0 : 90, w: 200, temp: 10 + i }));
    const x = rideSensors(pts);
    // the last gap (370 s) is a pause: its point does not count
    expect(x).toMatchObject({ hrAvg: 130, hrMax: 140, cad: 90, wAvg: 200, wMax: 200, tempAvg: 11, tempMin: 10, tempMax: 12 });
    expect(x.hist).toEqual({ 120: 10, 130: 10, 140: 10 });
    expect(rideSensors([{ t: 0 }, { t: 1000 }])).toBe(null);
  });
  it('analyseRide keeps them, and «Dein Tempo» gets the heart rate', () => {
    const start = Date.parse('2026-10-12T07:00:00Z');
    const trk = Array.from({ length: 200 }, (_, i) => `<trkpt lat="${(47 + i * 0.0009).toFixed(5)}" lon="8.00000"><ele>${400 + i}</ele><time>${new Date(start + i * 10000).toISOString()}</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>${130 + (i % 20)}</gpxtpx:hr><gpxtpx:cad>85</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>`).join('');
    const r = analyseRide(`<gpx><trk><name>test_data_gtp_ Runde</name><trkseg>${trk}</trkseg></trk></gpx>`, 'test_data_gtp_runde.gpx');
    expect(r.sensors).toMatchObject({ cad: 85, hrMax: 149 });
    expect(r.sensors.hrAvg).toBeGreaterThan(130);
    const pace = addToPace(null, r);
    expect(pace.rides[0].sensors.hrAvg).toBe(r.sensors.hrAvg);
    const rows = tempoRides({ paceRides: pace.rides });
    expect(rows[0]).toMatchObject({ from: 'pace', hrAvg: r.sensors.hrAvg, hrMax: 149 });
  });
});

describe('every list opens the activity page; the two fixes', () => {
  it('actHref', () => {
    expect(actHref('123')).toBe('#/flow/training/a/123');
    expect(actHref(null)).toBe(null);
    expect(actHref('')).toBe(null);
  });
  it('the Packmodus row lists each activity with its id', () => {
    const trip = { id: 't1', startDate: '2026-10-06', days: 1 };
    const acts = [{ id: '1', day: '2026-10-06', name: 'test_data_gtp_ Napf', km: 50, kind: 'bike', type: 'Ride' }];
    expect(stravaOfTrip(trip, acts).list).toEqual([{ id: '1', name: 'test_data_gtp_ Napf', day: '2026-10-06' }]);
  });
  it('the uploaded ride finds its Strava twin', () => {
    const ride = { date: '2026-10-12', km: 40, startAt: '2026-10-12T07:00:00Z' };
    const e = { source: 'strava', stravaId: '55', date: '2026-10-12', km: 40.2, time: '2026-10-12T07:01:00Z', state: 'counted', kind: 'ride' };
    expect(stravaTwin([e], ride)).toBe('55');
    expect(stravaTwin([e, { ...e, stravaId: '56' }], ride)).toBe(null);
    expect(stravaTwin([{ ...e, state: 'removed' }], ride)).toBe(null);
  });
  it('Ich › Verlauf keeps the name of the activity', () => {
    expect(actOf({ id: 1, day: '2026-10-06', name: 'test_data_gtp_ Abendrunde' }).name).toBe('test_data_gtp_ Abendrunde');
  });
  it('«Dein Tempo»: bike rides only', () => {
    const acts = [
      { id: '1', day: '2026-10-06', km: 40, movingS: 5400, type: 'Ride', kind: 'bike' },
      { id: '2', day: '2026-10-07', km: 10, movingS: 3000, type: 'Run', kind: 'run' },
      { id: '3', day: '2026-10-08', km: 8, movingS: 7000, type: 'Hike' },
    ];
    expect(tempoRides({ acts }).map((r) => r.id)).toEqual(['act:1']);
  });
});
