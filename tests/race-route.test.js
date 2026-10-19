// Paket U «Rennen» › Entlang der Strecke: the small helpers of AlongRoute.svelte (fictional data only).
import { describe, it, expect } from 'vitest';
import { seriesNear, wxNear, openLabel, rideHoursAcross, sleepStops, comfortOf, uvByDay, sundayDays, darkAt, forecastFrom } from '../src/lib/race/route-lib.js';
import { schedule, raceOf, msOf, addDay } from '../src/lib/race/race.js';

const sec = (local) => msOf(local) / 1000;
const hourly = (from, n, temp) => {
  const t0 = sec(from);
  return { time: Array.from({ length: n }, (_, i) => t0 + i * 3600), temperature_2m: Array.from({ length: n }, (_, i) => temp(i)), uv_index: Array.from({ length: n }, (_, i) => (i % 24 === 12 ? 7 : 1)) };
};

describe('seriesNear and wxNear', () => {
  const wx = { points: [{ km: 0 }, { km: 50 }, { km: 100 }], series: [{ id: 'a' }, { id: 'b', hourly: hourly('2026-07-04T00:00', 48, (i) => 10 + i) }, { id: 'c' }] };
  it('takes the nearest sample', () => {
    expect(seriesNear(wx, 60).id).toBe('b');
    expect(seriesNear(wx, 90).id).toBe('c');
    expect(seriesNear(null, 10)).toBe(null);
  });
  it('gives the hour you are there, null without a time', () => {
    expect(wxNear(wx, 55, msOf('2026-07-04T03:00')).temp).toBe(13);
    expect(wxNear(wx, 55, null)).toBe(null);
  });
});

describe('openLabel', () => {
  // 2026-07-04 is a Saturday
  const at = (hm) => msOf(`2026-07-04T${hm}`);
  it('says open, closes, closed then, unknown', () => {
    expect(openLabel('Mo-Sa 08:00-18:30', at('12:00'))).toMatchObject({ key: 'Open, closes {at}', vars: { at: '18:30' }, tone: 'ok' });
    expect(openLabel('Mo-Sa 08:00-18:30', at('06:00'))).toMatchObject({ key: 'Closed then, opens {at}', vars: { at: '08:00' }, tone: 'warn' });
    expect(openLabel('24/7', at('03:00')).key).toBe('Open|now');
    expect(openLabel('', at('12:00')).key).toBe('Hours unknown');
    expect(openLabel('Mo-Fr 08:00-12:00', null).key).toBe('Hours: {h}');
  });
});

describe('plan helpers', () => {
  const trip = { startDate: '2026-07-04', days: 3 };
  const race = raceOf({ start: '2026-07-04T06:00', targetH: 60, sleepAt: '23:00', sleepH: 4 }, trip);
  const plan = schedule(race, 600);
  it('rideHoursAcross leaves the sleep out', () => {
    expect(rideHoursAcross(null, 0, 10)).toBe(null);
    const h = rideHoursAcross(plan, 0, 600);
    expect(Math.round(h)).toBe(Math.round(plan.rideH));
  });
  it('sleepStops: the nights, or the day ends without sleep', () => {
    const nights = [{ n: 0, i: 0, km: 180, from: 1, to: 2, kind: 'bivy' }];
    expect(sleepStops(nights, plan)).toEqual([{ key: 'n0', i: 0, km: 180, from: 1, to: 2, kind: 'bivy' }]);
    const stops = sleepStops([], plan);
    expect(stops.length).toBe(plan.days.length - 1);
    expect(stops[0].km).toBe(Math.round(plan.days[0].to));
  });
  it('sundayDays marks the plan days on a Sunday with the shops in range', () => {
    const d1 = plan.days[1]; // 2026-07-05 is a Sunday
    const pois = [{ kind: 'shop', km: d1.from + 5 }, { kind: 'water', km: d1.from + 6 }, { kind: 'shop', km: 1 }];
    const s = sundayDays(plan, pois);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ n: 2, day: '2026-07-05', shops: 1 });
  });
  it('uvByDay takes the daily maximum, else the hourly one while riding', () => {
    const day0 = plan.days[0].day;
    const wx = { points: [{ km: 0 }], series: [{ hourly: hourly(`${day0}T00:00`, 72, () => 20), daily: { time: [Date.parse(`${day0}T00:00:00Z`) / 1000], uv_index_max: [8.24] } }] };
    const uv = uvByDay(plan, wx);
    expect(uv[0]).toMatchObject({ n: 1, day: day0 });
    expect(uv[0].uv).toBe(8.2);
    expect(uv[1].uv).toBe(7); // no daily value: the highest hour while riding
    expect(uvByDay(null, wx)).toEqual([]);
  });
});

describe('comfortOf, darkAt, forecastFrom', () => {
  it('compares the low with the bag', () => {
    expect(comfortOf(8, 5)).toBe('warm');
    expect(comfortOf(2, 5)).toBe('layer');
    expect(comfortOf(-3, 5)).toBe('cold');
    expect(comfortOf(null, 5)).toBe(null);
  });
  it('is dark at midnight and light at noon (mid Europe in summer)', () => {
    const dark = darkAt(46.9, 7.4);
    expect(dark(msOf('2026-07-04T00:30'))).toBe(true);
    expect(dark(msOf('2026-07-04T12:00'))).toBe(false);
  });
  it('says from when the forecast reaches the start', () => {
    expect(forecastFrom('2026-12-01', '2026-10-19')).toBe(addDay('2026-12-01', -15));
    expect(forecastFrom('2026-10-25', '2026-10-19')).toBe(null);
    expect(forecastFrom('', '2026-10-19')).toBe(null);
  });
});
