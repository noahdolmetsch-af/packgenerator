// «Sonnen-Ausfahrt» (Noah 06.11.2026 «1-5a»): the ride above the fog and its time window, made-up fog and rides.
import { describe, it, expect } from 'vitest';
import { fits, rides, suggest, minutesTo, minutesOf, minuteOfDay, clock, NEAR_KM, MIN_SUN_MIN, END_STAYS_H } from '../src/lib/wetter/sonnenfahrt.js';

const OFF = 3600;
const at = (h, m = 0) => Date.UTC(2026, 10, 6, h - 1, m); // local time at +1 h
const HOME = { lat: 47.37, lon: 8.54 };
const fog = (over = {}) => ({ now: { top: 800, ground: true }, above: 'sun', own: { m: 410, in: true }, clearing: { kind: 'clears', hour: 13 }, ...over });
// 42 km loop from 420 m up to 1120 m and back; the fog (800 m) ends near km 8.7
const PROFILE = [[0, 420], [3, 430], [9, 820], [15, 1120], [30, 700], [42, 420]];
const trip = (o = {}) => ({ id: 't1', title: 'Hochplateau-Runde', route: { start: { lat: 47.4, lon: 8.55 }, km: 42, profile: PROFILE }, ...o });

describe('the time', () => {
  it('riding time is the formula of «Surprise round»: km at 19 km/h plus 1 h per 600 m', () => {
    expect(minutesOf(19, 0)).toBe(60);
    expect(minutesOf(19, 600)).toBe(120);
  });
  it('the time to a km counts the climb up to there', () => {
    const flat = minutesTo([[0, 400], [10, 400]], 5);
    expect(flat).toBe(minutesOf(5, 0));
    const up = minutesTo([[0, 400], [10, 700]], 5); // 150 m climbed by km 5
    expect(up).toBe(minutesOf(5, 150));
    expect(minutesTo(PROFILE, 8.7)).toBeGreaterThan(minutesTo(PROFILE, 3));
  });
  it('minutes of the local day and the clock', () => {
    expect(minuteOfDay(at(8, 20), OFF)).toBe(8 * 60 + 20);
    expect(minuteOfDay(Date.UTC(2026, 10, 6, 23, 30), OFF)).toBe(30); // 00:30 the next day
    expect(clock(570)).toBe('09:30');
  });
});

describe('when the card shows (2a)', () => {
  const now = at(8, 20);
  it('sun above, your place in the fog, the fog holds 2 more hours: it fits', () => {
    expect(fits(fog(), now, OFF)).toMatchObject({ nowMin: 500, endMin: 780, clearsAt: 13 });
  });
  it('not with clouds above, a place above the fog, no fog, or fog that comes later', () => {
    expect(fits(fog({ above: 'cloud' }), now, OFF)).toBeNull();
    expect(fits(fog({ own: { m: 1200, in: false } }), now, OFF)).toBeNull();
    expect(fits(fog({ now: { top: null } }), now, OFF)).toBeNull();
    expect(fits(fog({ clearing: { kind: 'comes', hour: 15 } }), now, OFF)).toBeNull();
    expect(fits(null, now, OFF)).toBeNull();
  });
  it('not when the fog clears in less than 2 hours', () => {
    expect(fits(fog({ clearing: { kind: 'clears', hour: 10 } }), now, OFF)).toBeNull();
    expect(fits(fog({ clearing: { kind: 'clears', hour: 10 } }), at(7, 30), OFF)).not.toBeNull(); // 2.5 h left
  });
  it('fog that stays: the window ends at the end of the short winter day', () => {
    expect(fits(fog({ clearing: { kind: 'stays' } }), now, OFF).endMin).toBe(END_STAYS_H * 60);
    expect(fits(fog({ clearing: { kind: 'stays' } }), at(15, 0), OFF)).toBeNull();
  });
});

describe('the rides', () => {
  const now = at(8, 20);
  const win = (s = fog()) => fits(s, now, OFF);
  it('a ride that climbs above the fog: km of the sun, latest start with an hour of sun left', () => {
    const [r] = rides([trip()], HOME, fog(), win());
    expect(r).toMatchObject({ title: 'Hochplateau-Runde', km: 42, topM: 1120, late: false });
    expect(r.aboveKm).toBeCloseTo(9, 0);
    // the fog clears at 13:00: the latest start leaves MIN_SUN_MIN of sun after the minutes to the sun
    expect(r.lastStartMin).toBe(Math.floor((780 - MIN_SUN_MIN - r.toSunMin) / 5) * 5);
    expect(r.lastStartMin % 5).toBe(0);
    expect(r.startMin).toBe(r.lastStartMin);
  });
  it('without a clearing there is no deadline: the start is in 15 minutes, rounded up to 5', () => {
    const s = fog({ clearing: { kind: 'stays' } });
    const [r] = rides([trip()], HOME, s, win(s));
    expect(r.lastStartMin).toBeNull();
    expect(r.startMin).toBe(515); // 08:20 + 15 min = 08:35
  });
  it('a ride that stays under the fog, starts above it, lies too far, has no route or is skipped is left out', () => {
    const low = trip({ id: 'low', title: 'Low', route: { start: { lat: 47.4, lon: 8.55 }, profile: [[0, 420], [20, 700], [40, 420]] } });
    const high = trip({ id: 'hi', title: 'High', route: { start: { lat: 47.4, lon: 8.55 }, profile: [[0, 900], [20, 1200]] } });
    const far = trip({ id: 'far', title: 'Far', route: { start: { lat: 48.6, lon: 8.54 }, profile: PROFILE } });
    const none = trip({ id: 'none', title: 'None', route: { start: { lat: 47.4, lon: 8.55 } } });
    const skipped = trip({ id: 'sk', title: 'Skipped', skipped: true });
    expect(rides([low, high, far, none, skipped], HOME, fog(), win())).toEqual([]);
    expect(NEAR_KM).toBe(60);
  });
  it('a ride only just over the fog top (less than 100 m) does not count', () => {
    const near = trip({ id: 'near', title: 'Near', route: { start: { lat: 47.4, lon: 8.55 }, profile: [[0, 420], [10, 880], [20, 420]] } });
    expect(rides([near], HOME, fog(), win())).toEqual([]);
  });
  it('a ride of more than 5 hours is left out', () => {
    const long = trip({ id: 'long', title: 'Long', route: { start: { lat: 47.4, lon: 8.55 }, profile: [[0, 420], [9, 820], [15, 1120], [150, 420]] } });
    expect(rides([long], HOME, fog(), win())).toEqual([]);
  });
  it('nearest start first, one per name', () => {
    const a = trip({ id: 'a', title: 'A', route: { start: { lat: 47.6, lon: 8.54 }, profile: PROFILE } });
    const b = trip({ id: 'b', title: 'B', route: { start: { lat: 47.38, lon: 8.54 }, profile: PROFILE } });
    const b2 = trip({ id: 'b2', title: 'B', route: { start: { lat: 47.5, lon: 8.54 }, profile: PROFILE } });
    expect(rides([a, b2, b], HOME, fog(), win()).map((r) => r.id)).toEqual(['b', 'a']);
  });
  it('marks a ride as late when its latest start is gone', () => {
    const s = fog({ clearing: { kind: 'clears', hour: 11 } });
    const w = fits(s, at(7, 0), OFF); // 4 h left, but the ride needs the time to the sun plus an hour of sun
    const [r] = rides([trip()], HOME, s, w);
    expect(r.late).toBe(r.lastStartMin < w.nowMin + 15);
  });
});

describe('what Today shows', () => {
  const now = at(8, 20);
  const base = { now, offset: OFF, home: HOME };
  it('a ride when one reaches above the fog', () => {
    const r = suggest({ ...base, s: fog(), trips: [trip()] });
    expect(r.kind).toBe('rides');
    expect(r.clearsAt).toBe(13);
    expect(r.list).toHaveLength(1);
  });
  it('«none» when sun is above but no ride reaches it, and nothing without the fitting day', () => {
    expect(suggest({ ...base, s: fog(), trips: [] })).toEqual({ kind: 'none' });
    expect(suggest({ ...base, s: fog({ above: 'cloud' }), trips: [trip()] })).toBeNull();
  });
  it('nothing when every ride is already too late', () => {
    const s = fog({ clearing: { kind: 'clears', hour: 10 } });
    expect(suggest({ ...base, now: at(7, 45), s, trips: [trip()] })).toBeNull();
  });
});
