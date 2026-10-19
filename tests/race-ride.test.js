// Paket U «Rennen»: helpers of Race mode, After the race and the briefing sheet (src/lib/race/ride-lib.js).
// Fictional data only ('Testhotel', 'Testladen').
import { describe, it, expect } from 'vitest';
import { etaFrom, ahead, nextCheckpoint, nextGoal, wxNear, sleptMin, awakeH, toBed, stageOf, tripDays, rideTimes, gainBetween, sundays } from '../src/lib/race/ride-lib.js';
import { msOf } from '../src/lib/race/race.js';

const pois = [
  { id: 'a', kind: 'shop', name: 'Testladen', km: 30 },
  { id: 'b', kind: 'water', name: '', km: 12 },
  { id: 'c', kind: 'sleep', name: 'Testhotel', km: 168 },
  { id: 'd', kind: 'shelter', name: '', km: 25 },
];

describe('race mode helpers', () => {
  it('etaFrom moves the plan to now', () => {
    const plan = { etaOf: (k) => k * 1000 };
    const eta = etaFrom(plan, 10, 50_000);
    expect(eta(20)).toBe(60_000);
    expect(etaFrom(null, 10, 0)).toBeNull();
  });
  it('ahead finds places of a kind ahead, nearest first, within a range', () => {
    expect(ahead(pois, 10, ['water', 'shop']).map((p) => p.id)).toEqual(['b', 'a']);
    expect(ahead(pois, 10, ['shelter', 'shop'], 15).map((p) => p.id)).toEqual(['d']);
    expect(ahead(pois, 13, ['water'])).toEqual([]);
  });
  it('nextCheckpoint is the first one after km', () => {
    expect(nextCheckpoint([{ km: 50 }, { km: 120 }], 60)).toEqual({ km: 120 });
    expect(nextCheckpoint([{ km: 50 }], 60)).toBeNull();
  });
  it('nextGoal takes the nearer of the next goal and the next food or water', () => {
    const goals = [{ key: 'km:50', km: 50, name: '' }, { key: 'finish', km: 200, name: 'Finish' }];
    expect(nextGoal(goals, [], pois, 0)).toMatchObject({ key: null, km: 12, kind: 'water' });
    expect(nextGoal(goals, [], pois, 31)).toMatchObject({ key: 'km:50', kind: 'goal' });
    expect(nextGoal(goals, ['km:50'], [], 31)).toMatchObject({ key: 'finish' });
  });
  it('wxNear picks the series nearest to km', () => {
    expect(wxNear({ points: [{ km: 0 }, { km: 100 }], series: [{ id: 0 }, { id: 1 }] }, [], 80)).toEqual({ id: 1 });
    expect(wxNear([{ km: 0, id: 0 }, { km: 50, id: 1 }], [], 10)).toMatchObject({ id: 0 });
    expect(wxNear(null, [], 10)).toBeNull();
  });
  it('sleep so far and hours awake', () => {
    const log = [{ at: '2026-07-01T04:00:00Z', min: 90 }, { at: '2026-07-02T03:00:00Z', min: 120 }];
    expect(sleptMin(log)).toBe(210);
    expect(awakeH(log, 0, Date.parse('2026-07-02T13:00:00Z'))).toBe(10);
    expect(awakeH([], Date.parse('2026-07-02T10:00:00Z'), Date.parse('2026-07-02T13:00:00Z'))).toBe(3);
  });
  it('toBed: km 140 at 19:40, the hotel at km 168 at 8.2 km/h = 3.4 h more', () => {
    const now = msOf('2026-07-01T19:40');
    const r = toBed({ km: 168 }, 140, now, 28 / 3.4);
    expect(r.km).toBe(28);
    expect(r.h).toBeCloseTo(3.4, 5);
    expect(new Date(r.at).getHours()).toBe(23);
    expect(toBed(null, 1, now, 10)).toBeNull();
  });
  it('stageOf counts calendar days from the start', () => {
    expect(stageOf(msOf('2026-07-01T06:00'), msOf('2026-07-01T23:00'))).toBe(1);
    expect(stageOf(msOf('2026-07-01T06:00'), msOf('2026-07-03T01:00'))).toBe(3);
  });
});

describe('after the race helpers', () => {
  it('tripDays and sundays', () => {
    const days = tripDays({ startDate: '2026-07-03', days: 4 });
    expect(days).toEqual(['2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06']);
    expect(sundays(days)).toEqual(['2026-07-05']);
    expect(tripDays({})).toEqual([]);
  });
  it('rideTimes joins uploaded rides and Strava rides without counting a day twice', () => {
    const rides = [{ date: '2026-07-03', km: 300, movingH: 14, totalH: 18, pauses: [{ min: 30 }] }];
    const acts = [
      { day: '2026-07-03', kind: 'bike', km: 300, movingS: 50_000, elapsedS: 64_000 },
      { day: '2026-07-04', kind: 'bike', km: 250, movingS: 36_000, elapsedS: 54_000 },
      { day: '2026-07-04', kind: 'run', km: 5, movingS: 1800, elapsedS: 1800 },
      { day: '2026-08-01', kind: 'bike', km: 50, movingS: 7200, elapsedS: 7200 },
    ];
    const out = rideTimes(rides, acts, ['2026-07-03', '2026-07-04']);
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ movingH: 10, totalH: 15 });
  });
  it('gainBetween sums the metres up between two km', () => {
    const profile = [[0, 400], [10, 900], [20, 600], [30, 1000]];
    expect(gainBetween(profile, 0, 30)).toBe(900);
    expect(gainBetween(profile, 10, 30)).toBe(400);
    expect(gainBetween([], 0, 10)).toBeNull();
  });
});
