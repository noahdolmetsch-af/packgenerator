import { describe, it, expect } from 'vitest';
import { dhms, clock } from '../src/lib/touren/strava/fmt.js';
import { rideWxOf, rideWxUrl, dirOf, skyOf, needsRideWx, DIRS, RIDE_WX_V } from '../src/lib/touren/ridewx.js';
import { withActs } from '../src/lib/review/rueckblick.js';
import DE from '../src/lib/i18n/de/index.js';

// «Wie Strava» (Noah 21.10.2026). Fictional rides only.
describe('elapsed time and pauses as dd:hh:mm:ss', () => {
  it('always with days and hours', () => {
    expect(dhms(1605)).toBe('00:00:26:45');
    expect(dhms(34289)).toBe('00:09:31:29');
    expect(dhms(94500)).toBe('01:02:15:00');
    expect(dhms(null)).toBe('–');
    expect(clock(1179)).toBe('19:39');
  });
});

describe('the weather at the start of a ride', () => {
  const data = { hourly: { time: ['2026-10-20T15:00', '2026-10-20T16:00'], temperature_2m: [18, 17.2], apparent_temperature: [17, 16], relative_humidity_2m: [60, 66], wind_speed_10m: [5, 6.8], wind_direction_10m: [20, 25], weather_code: [2, 3] } };
  it('the hour the ride started', () => {
    expect(rideWxOf(data, '16:05')).toEqual({ v: RIDE_WX_V, t: 17.2, feel: 16, hum: 66, wind: 6.8, dir: 25, code: 3 });
    expect(rideWxOf(data, '03:00')).toBeNull();
  });
  it('sky and compass point; the archive for older days', () => {
    expect(skyOf(3).key).toBe('Cloudy|sky');
    expect(dirOf(25)).toBe('NNE|wind');
    expect(dirOf(359)).toBe('N|wind');
    expect(rideWxUrl({ lat: 47.37, lon: 8.54 }, '2026-01-02', '2026-10-21')).toMatch(/^https:\/\/archive-api/);
    expect(needsRideWx({ line: 'abc', day: '2026-10-20' })).toBe(true);
    expect(needsRideWx({ line: 'abc', day: '2026-10-20', wxRide: { v: RIDE_WX_V } })).toBe(false);
  });
  it('every word has a German entry', () => {
    const keys = [...DIRS, 'Clear|sky', 'Mostly clear|sky', 'Partly cloudy|sky', 'Cloudy|sky', 'Fog|sky', 'Drizzle|sky', 'Rain|sky', 'Snow|sky', 'Thunderstorm|sky', 'Feels like', 'Wind speed', 'Humidity', 'Wind direction', 'Overview like Strava', 'Show more|strava', 'Show less|strava'];
    expect(keys.filter((k) => !DE[k])).toEqual([]);
  });
});

describe('the tiles of a tour ridden with Strava only («2 leere Kacheln»)', () => {
  const row = { id: 't1', rides: [], km: null, gainM: null, movingH: null, totalH: null, kmh: null, pauses: null };
  const acts = [
    { id: 'a1', kind: 'bike', km: 20.7, hm: 255, movingS: 4091, elapsedS: 34289, pauses: { n: 9, secs: 30000 } },
    { id: 'a2', kind: 'bike', km: 5.55, hm: 41, movingS: 1179, elapsedS: 1605, pauses: { n: 2, secs: 426 } },
    { id: 'w1', kind: 'walk', km: 3, movingS: 2000 },
  ];
  it('takes the numbers of the Strava rides', () => {
    const r = withActs(row, acts);
    expect(r).toMatchObject({ km: 26.3, gainM: 296, movingH: 1.46, kmh: 17.9, pauses: { n: 11, secs: 30426 }, fromActs: true });
  });
  it('keeps a row with uploaded rides and a row without Strava rides', () => {
    const up = { ...row, rides: [{ id: 'r1' }], km: 12 };
    expect(withActs(up, acts)).toBe(up);
    expect(withActs(row, [])).toBe(row);
  });
});
