import { describe, it, expect } from 'vitest';
import { nextHours } from '../src/lib/live/next3h.js';

const T0 = Date.UTC(2026, 6, 10, 10, 0) / 1000; // a made-up day, 10:00 UTC
// one sample point at km 0; hourly values for 6 hours
const series = (temp, rain = 0, wind = 5) => ({
  hourly: {
    time: [0, 1, 2, 3, 4, 5].map((i) => T0 + i * 3600),
    temperature_2m: temp,
    apparent_temperature: temp,
    wind_speed_10m: [0, 1, 2, 3, 4, 5].map(() => wind),
    wind_direction_10m: [0, 1, 2, 3, 4, 5].map(() => 180),
    precipitation_probability: Array.isArray(rain) ? rain : [0, 1, 2, 3, 4, 5].map(() => rain),
    uv_index: [0, 1, 2, 3, 4, 5].map(() => 1),
  },
});
const wx = (s) => ({ points: [{ km: 0 }], series: [s] });
const NOW = T0 * 1000;
const pace = { kmh: 20 };

describe('nextHours', () => {
  it('needs a forecast and a position', () => {
    expect(nextHours({ wx: null, km: 0, now: NOW })).toBeNull();
    expect(nextHours({ wx: wx(series([18, 18, 18, 18, 18, 18])), km: null, now: NOW })).toBeNull();
    expect(nextHours({ wx: wx(series([18, 18, 18, 18, 18, 18])), km: 0, now: NOW + 40 * 36e5 })).toBeNull();
  });
  it('says rain first, with the hour it starts', () => {
    const r = nextHours({ wx: wx(series([12, 12, 12, 5, 5, 5], [0, 10, 70, 80, 80, 80])), km: 0, now: NOW, pace });
    expect(r.verdict).toBe('rain');
    expect(r.h).toBe(2);
    expect(r.value).toBe(70);
    expect(r.rows).toHaveLength(4);
  });
  it('says cold when it feels below 8 degrees, with the lowest value', () => {
    const r = nextHours({ wx: wx(series([12, 9, 6, 3, 3, 3])), km: 0, now: NOW, pace });
    expect(r.verdict).toBe('cold');
    expect(r.h).toBe(2);
    expect(r.value).toBe(3);
  });
  it('says cool, then wind, then fine', () => {
    expect(nextHours({ wx: wx(series([14, 14, 14, 14, 14, 14])), km: 0, now: NOW, pace }).verdict).toBe('cool');
    expect(nextHours({ wx: wx(series([20, 20, 20, 20, 20, 20], 0, 40)), km: 0, now: NOW, pace }).verdict).toBe('wind');
    const ok = nextHours({ wx: wx(series([20, 20, 20, 20, 20, 20])), km: 0, now: NOW, pace });
    expect(ok.verdict).toBe('ok');
    expect(ok.h).toBeNull();
  });
  it('stops at the end of the route', () => {
    const r = nextHours({ wx: wx(series([20, 20, 20, 20, 20, 20])), km: 90, now: NOW, pace, totalKm: 100 });
    expect(r.rows.at(-1).km).toBe(100);
  });
});
