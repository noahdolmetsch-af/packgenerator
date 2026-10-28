// Nachprüfung Bikepacking (27.10.2026): after a ride without a route the GPS heights give Hm and a profile;
// laps get their own Ø pulse and power; a Strava/Garmin ride at the same time fills what the phone missed.
import { describe, it, expect } from 'vitest';
import { gpsGainOf, heightCurve, heightProfile, twinActivity, rideSummary, rideRowOf, lapRows, fixesOf } from '../src/lib/live/after.js';
import { lapsOf } from '../src/lib/live/laps.js';

const T0 = Date.parse('2026-10-09T08:00:00+02:00');
// 61 points, one a minute, 300 m apart going north; height up 0..30 then down
const pts = Array.from({ length: 61 }, (_, i) => [46.9 + i * 0.0027, 7.4, i * 60, 500 + (i <= 30 ? i * 10 : (60 - i) * 10)]);
const ride = { id: 'rec-test', kind: 'rec', startAt: T0, endAt: T0 + 3600e3, pts, km: 18, breaks: [] };

describe('GPS heights', () => {
  it('fixes carry the height, old 3-value points have none', () => {
    expect(fixesOf(ride)[1].alt).toBe(510);
    expect(fixesOf({ startAt: T0, pts: [[46.9, 7.4, 0]] })[0].alt).toBeNull();
  });
  it('the gain counts only real rises (4 m steps)', () => {
    expect(gpsGainOf(fixesOf(ride))).toBe(300);
    expect(gpsGainOf([{ alt: 500 }, { alt: 502 }, { alt: 501 }, { alt: 503 }])).toBe(0);
    expect(gpsGainOf([{ alt: null }])).toBeNull();
  });
  it('the summary takes the GPS gain when there is no route', () => {
    const s = rideSummary(ride, null);
    expect(s.hm).toBe(300);
    expect(s.hmFrom).toBe('gps');
  });
  it('a curve over time and a profile over km', () => {
    const c = heightCurve(ride);
    expect(c[0]).toEqual([0, 500]);
    expect(c.at(-1)).toEqual([3600, 500]);
    const p = heightProfile(ride);
    expect(p.length).toBe(61);
    expect(p.at(-1)[0]).toBeGreaterThan(17);
    expect(heightCurve({ pts: [[1, 2, 0]] })).toEqual([]);
  });
});

describe('laps with their own pulse and power', () => {
  it('averages the samples inside each lap', () => {
    const sensors = { hr: [[0, 100], [600, 120], [1200, 140], [1800, 160]], power: [[0, 0], [600, 200], [1200, 300]] };
    const l = lapsOf([{ at: T0 + 1000e3, km: 5, movingS: 1000 }], { km: 9, movingS: 1900, now: T0 + 1900e3, startAt: T0, sensors });
    expect(l[0]).toMatchObject({ n: 1, hrAvg: 110, wAvg: 200 });
    expect(l[1]).toMatchObject({ n: 2, km: 4, hrAvg: 150, wAvg: 300 });
    expect(lapsOf([], { startAt: T0 })[0].hrAvg).toBeNull();
  });
  it('a closed recording lists its laps', () => {
    expect(lapRows(ride)).toBeNull();
    const r = lapRows({ ...ride, laps: [{ at: T0 + 1800e3, km: 9, movingS: 1800 }] });
    expect(r.length).toBe(2);
    expect(r[1].km).toBe(9);
  });
});

describe('a Strava or Garmin ride at the same time', () => {
  const act = { id: 77, kind: 'bike', name: 'test_data_gtp_ Morgenrunde', start: new Date(T0 - 5 * 60e3).toISOString(), elapsedS: 3700, hm: 320, hrAvg: 131.4, wAvg: 180 };
  it('is found when it overlaps most of the ride', () => {
    expect(twinActivity(ride, [act])?.id).toBe(77);
    expect(twinActivity(ride, [{ ...act, start: new Date(T0 + 3500e3).toISOString() }])).toBeNull();
    expect(twinActivity(ride, [{ ...act, kind: 'run' }])).toBeNull();
  });
  it('the ride row keeps the profile, the laps and fills pulse and power from it', () => {
    const row = rideRowOf({ ...ride, pts: pts.map((p) => p.slice(0, 3)) }, { twin: act, now: new Date(T0) });
    expect(row.gainM).toBe(320);
    expect(row.sensors).toEqual({ hrAvg: 131, hrMax: null, wAvg: 180, wMax: null });
    expect(row.twinId).toBe('77');
    const own = rideRowOf(ride, { now: new Date(T0) });
    expect(own.gainM).toBe(300);
    expect(own.profile.length).toBeGreaterThan(10);
    expect(own.sensors).toBeNull();
  });
});
