// The ride-against-ride look back of a try (Noah 05.11.2026 «a», Persönliches Lernen Idee 2): only similar rides,
// every ride a dot, a verdict only from MIN_RIDES rides on each side.
import { describe, it, expect } from 'vitest';
import { newExp } from '../src/lib/ruhig/versuche.js';
import { MIN_RIDES, rideValue, ridesIn, similarRides, rideResult } from '../src/lib/ruhig/versuch-fahrt.js';

const FROM = '2026-10-10';
const exp = (days = 7) => newExp({ q: 'Easier?', from: FROM, days, metric: 'rideFeel' }, 'x');
const ride = (day, extra = {}) => ({ kind: 'bike', movingS: 3600, km: 25, hm: 200, ...extra });
/** a table with one ride per listed day */
const tableOf = (rows) => new Map(Object.entries(rows).map(([d, a]) => [d, { acts: [].concat(a).map((x) => ride(d, x)) }]));

describe('ride value', () => {
  it('feel before Strava’s answer, cadence, speed, watts per kilo', () => {
    expect(rideValue({ feel: 4, rpe: 8 }, 'rideFeel')).toBe(4);
    expect(rideValue({ rpe: 8 }, 'rideFeel')).toBe(8);
    expect(rideValue({}, 'rideFeel')).toBeNull();
    expect(rideValue({ cad: 85 }, 'cad')).toBe(85);
    expect(rideValue({ cad: 0 }, 'cad')).toBeNull();
    expect(rideValue({ km: 30, movingS: 3600 }, 'spd')).toBe(30);
    expect(rideValue({ wDevice: true, wAvg: 200 }, 'wkg', 80)).toBe(2.5);
    expect(rideValue({ wDevice: true, wAvg: 200 }, 'wkg', null)).toBeNull();
    expect(rideValue({ wAvg: 200 }, 'wkg', 80)).toBeNull();
    expect(rideValue({ cad: 85 }, 'nope')).toBeNull();
  });
});

describe('rides in a span', () => {
  it('takes the bike rides with a moving time, day by day', () => {
    const t = tableOf({ '2026-10-10': {}, '2026-10-11': [{}, { kind: 'run' }, { movingS: 0 }] });
    expect(ridesIn(t, '2026-10-09', '2026-10-12').map((r) => r.day)).toEqual(['2026-10-10', '2026-10-11']);
  });
});

describe('similar rides', () => {
  it('keeps rides near the middle one in length and climb; without km never', () => {
    const rs = [20, 22, 25, 26, 28, 60, 8, null].map((km, i) => ({ day: `d${i}`, km, hm: km ? km * 8 : null, s: 3600, act: {} }));
    expect(similarRides(rs).map((r) => r.km)).toEqual([20, 22, 25, 26, 28]);
  });
  it('a ride with a much bigger climb at the same length drops out; unknown climb stays', () => {
    const rs = [24, 25, 25, 26, 25].map((km, i) => ({ day: `d${i}`, km, hm: 200, s: 3600, act: {} }));
    rs.push({ day: 'hill', km: 25, hm: 900, s: 3600, act: {} }, { day: 'nohm', km: 25, hm: null, s: 3600, act: {} });
    const days = similarRides(rs).map((r) => r.day);
    expect(days).not.toContain('hill');
    expect(days).toContain('nohm');
  });
  it('is empty without any ride with km', () => {
    expect(similarRides([])).toEqual([]);
    expect(similarRides([{ day: 'a', km: null, hm: null, s: 1, act: {} }])).toEqual([]);
  });
});

describe('result', () => {
  // 7 days from FROM; 7 days before. one ride a day, felt effort by day
  const days = (from, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${from}T12:00:00Z`) + i * 864e5).toISOString().slice(0, 10));
  const beforeDays = days('2026-10-03', 7);
  const duringDays = days(FROM, 7);
  const feels = (list, base) => Object.fromEntries(list.map((d, i) => [d, { feel: base + (i % 3) * 0.5 }]));
  it('is null before the first day', () => {
    expect(rideResult(exp(), tableOf({}), 'rideFeel', '2026-10-09')).toBeNull();
  });
  it('says «few» under MIN_RIDES on a side and gives the dots anyway', () => {
    const t = tableOf({ ...feels(beforeDays.slice(0, 3), 7), ...feels(duringDays.slice(0, 3), 5) });
    const r = rideResult(exp(), t, 'rideFeel', '2026-10-16');
    expect(r.verdict).toBe('few');
    expect(r.diff).toBeNull();
    expect(r.during.n).toBe(3);
    expect(r.before.dots).toHaveLength(3);
    expect(MIN_RIDES).toBe(5);
  });
  it('a clear fall is «down», a clear rise «up»', () => {
    const t = tableOf({ ...feels(beforeDays, 7), ...feels(duringDays, 5) });
    const r = rideResult(exp(), t, 'rideFeel', '2026-10-16');
    expect(r.verdict).toBe('down');
    expect(r.diff).toBeCloseTo(-2, 5);
    expect(r.rides).toEqual({ all: 14, similar: 14 });
    const up = rideResult(exp(), tableOf({ ...feels(beforeDays, 5), ...feels(duringDays, 7) }), 'rideFeel', '2026-10-16');
    expect(up.verdict).toBe('up');
  });
  it('a difference inside the spread is «unclear»', () => {
    const wob = (list, base) => Object.fromEntries(list.map((d, i) => [d, { feel: base + ((i * 7) % 5) }]));
    const r = rideResult(exp(), tableOf({ ...wob(beforeDays, 3), ...wob(duringDays, 3.2) }), 'rideFeel', '2026-10-16');
    expect(r.verdict).toBe('unclear');
  });
  it('rides of a very different length are left out and counted', () => {
    const t = tableOf({ ...feels(beforeDays, 7), ...feels(duringDays, 5) });
    t.get(beforeDays[0]).acts[0].km = 90; // a long ride before the try
    t.get(duringDays[0]).acts[0].km = 5; // a short spin during it
    const r = rideResult(exp(), t, 'rideFeel', '2026-10-16');
    expect(r.rides).toEqual({ all: 14, similar: 12 });
    expect(r.before.n).toBe(6);
    expect(r.during.n).toBe(6);
  });
  it('rides without the value do not count; the days before are as many as the days so far', () => {
    const t = tableOf({ ...feels(beforeDays, 7), ...feels(duringDays, 5), '2026-10-02': { feel: 1 } });
    const r = rideResult(exp(), t, 'rideFeel', '2026-10-16');
    expect(r.rides.all).toBe(14); // 2 Oct is outside the 7 days before
    expect(rideResult(exp(), tableOf({ ...feels(beforeDays, 7), ...feels(duringDays, 5), '2026-10-09': { feel: 2 } }), 'rideFeel', '2026-10-16').before.n).toBe(7);
    const noFeel = tableOf(Object.fromEntries([...beforeDays, ...duringDays].map((d) => [d, {}])));
    expect(rideResult(exp(), noFeel, 'rideFeel', '2026-10-16').rides).toEqual({ all: 0, similar: 0 });
  });
  it('watts per kilo use the weight of the day', () => {
    const rows = Object.fromEntries([...beforeDays.map((d) => [d, { wDevice: true, wAvg: 160 }]), ...duringDays.map((d, i) => [d, { wDevice: true, wAvg: 200 + (i % 2) * 2 }])]);
    const r = rideResult({ ...exp(), metric: 'wkg' }, tableOf(rows), 'wkg', '2026-10-16', () => 80);
    expect(r.before.mean).toBe(2);
    expect(r.verdict).toBe('up');
    expect(rideResult({ ...exp(), metric: 'wkg' }, tableOf(rows), 'wkg', '2026-10-16', () => null).verdict).toBe('few');
  });
});
