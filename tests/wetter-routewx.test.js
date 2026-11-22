// «Wetter entlang der Route» (Wetter-Ausbau A und G, Noah 22.11.2026 «a»): headwind share, coldest point, extra pack hints, webcams on the route.
import { describe, it, expect } from 'vitest';
import { headShare, coldest, routeHints, camsAlong, dayRows, tripPace, rowBefore, stageWeather } from '../src/lib/wetter/routewx.js';
import { linePoints } from '../src/lib/map/wxline.js';
import { lineKm } from '../src/lib/race/race.js';

const row = (km, temp, kind, extra = {}) => ({ km, temp, kind, w: true, rainP: 10, rainMm: 0, wind: 10, gust: 15, eta: 1000 + km, ...extra });
const rows = [row(0, 4, 'tail'), row(28, 3, 'head'), row(55, -1, 'head'), row(80, 6, 'tail', { rainP: 70, rainMm: 0.8 }), row(104, 7, 'tail')];

describe('headShare', () => {
  it('counts the points with headwind in percent', () => expect(headShare(rows)).toBe(40));
  it('ignores points without a forecast and gives null without any', () => {
    expect(headShare([{ km: 0, w: false }])).toBeNull();
    expect(headShare([])).toBeNull();
    expect(headShare([...rows, { km: 120, w: false }])).toBe(40);
  });
});

describe('coldest', () => {
  it('finds the coldest point', () => expect(coldest(rows)).toEqual({ km: 55, temp: -1, eta: 1055 }));
  it('is null without a forecast', () => expect(coldest([{ km: 0, w: false }])).toBeNull());
});

describe('routeHints', () => {
  it('adds what the cold pass asks for beyond the start', () => {
    const keys = routeHints(rows, ['longgloves']).map((h) => h.key);
    expect(keys).not.toContain('longgloves');
    expect(keys).toContain('overshoes');
    expect(keys).toContain('rainjacket');
  });
  it('never adds the layer to take off', () => expect(routeHints(rows).map((h) => h.key)).not.toContain('layer'));
  it('says nothing without a forecast', () => expect(routeHints([{ km: 0, w: false }])).toEqual([]));
});

describe('dayRows and tripPace', () => {
  it('cuts a route of several days to its first day', () => expect(dayRows(rows, 60).map((r) => r.km)).toEqual([0, 28, 55]));
  it('keeps all rows without a day length', () => expect(dayRows(rows, null)).toHaveLength(5));
  it('works out the km of a day and a pace', () => {
    const p = tripPace({ days: 2, route: { km: 200, gainM: 1200 } });
    expect(p.dayKm).toBe(100);
    expect(p.kmh).toBeGreaterThan(8);
    expect(p.kmh).toBeLessThan(25);
    expect(tripPace({ route: null })).toEqual({ dayKm: null, kmh: null });
  });
});

describe('camsAlong', () => {
  // a line running east along 47.0 N, 1 km per 0.0132 degrees of longitude
  const pts = Array.from({ length: 11 }, (_, i) => ({ lat: 47, lon: 7 + i * 0.0132 * 10, km: i * 10 }));
  const cam = (id, lat, lon) => ({ id, name: id, url: 'https://example.org/' + id, place: { name: id, lat, lon } });
  it('finds the cams near the line, in route order, each once', () => {
    const r = camsAlong([cam('pass', 47.005, 7 + 0.132 * 7), cam('lake', 47.001, 7 + 0.132 * 2), cam('far', 47.2, 7.5), { id: 'noplace', name: 'x', url: '' }], pts);
    expect(r.map((x) => x.cam.id)).toEqual(['lake', 'pass']);
    expect(r[0].km).toBe(20);
    expect(r[1].offKm).toBeLessThan(2);
  });
  it('can look only at one stretch', () => {
    const r = camsAlong([cam('lake', 47.001, 7 + 0.132 * 2), cam('pass', 47.005, 7 + 0.132 * 7)], pts, 2, 50, 100);
    expect(r.map((x) => x.cam.id)).toEqual(['pass']);
  });
  it('is empty without a line or cams', () => {
    expect(camsAlong([cam('a', 47, 7)], [])).toEqual([]);
    expect(camsAlong([], pts)).toEqual([]);
  });
});

describe('rowBefore', () => {
  it('gives the last point at or before the km', () => {
    expect(rowBefore(rows, 60).km).toBe(55);
    expect(rowBefore(rows, 28).km).toBe(28);
    expect(rowBefore(rows, -5)).toBeNull();
  });
});

// C «Wetter pro Etappe»: three days along the equator, the second day wet and cold
describe('stageWeather', () => {
  const east = { km: 0, line: Array.from({ length: 31 }, (_, i) => [0, 20 + i * 0.1]) };
  const pts = lineKm(east);
  const route = { line: east.line, km: pts.at(-1).km, profile: [] };
  const T0 = Date.UTC(2026, 5, 1, 0, 0);
  const H = 36e5;
  const hourly = () => {
    const time = Array.from({ length: 24 * 4 }, (_, i) => (T0 + i * H) / 1000);
    const day = (i) => Math.floor(i / 24);
    return {
      hourly: {
        time,
        temperature_2m: time.map((_, i) => (day(i) === 1 ? 4 : 14)),
        precipitation_probability: time.map((_, i) => (day(i) === 1 ? 80 : 5)),
        precipitation: time.map((_, i) => (day(i) === 1 ? 1.2 : 0)),
        wind_speed_10m: time.map(() => 12),
        wind_gusts_10m: time.map(() => 20),
        wind_direction_10m: time.map(() => 90),
      },
    };
  };
  const points = linePoints(pts);
  const cache = { points, series: points.map(() => hourly()) };
  const trip = { startDate: '2026-06-01', days: 3, route };

  it('gives one row per day with its own date and km range', () => {
    const r = stageWeather(cache, trip, { kmh: 20, startHour: 8 });
    expect(r.map((d) => d.date)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03']);
    expect(r[0].fromKm).toBe(0);
    expect(r[2].toKm).toBeCloseTo(route.km, 0);
  });
  it('finds the wet and cold day', () => {
    const r = stageWeather(cache, trip, { kmh: 20, startHour: 8 });
    expect(r[0].rainShare).toBe(0);
    expect(r[1].rainShare).toBe(100);
    expect(r[1].tmax).toBe(4);
    expect(r[1].rainAt).toBeGreaterThan(0);
    expect(r[2].tmin).toBe(14);
    expect(r[0].windMax).toBe(12);
  });
  it('says nothing for a one-day trip, without a date, a pace or a kept strip', () => {
    expect(stageWeather(cache, { ...trip, days: 1 }, { kmh: 20 })).toEqual([]);
    expect(stageWeather(cache, { ...trip, startDate: '' }, { kmh: 20 })).toEqual([]);
    expect(stageWeather(cache, trip, { kmh: null })).toEqual([]);
    expect(stageWeather(null, trip, { kmh: 20 })).toEqual([]);
  });
  it('marks a day outside the forecast', () => {
    const r = stageWeather(cache, { ...trip, startDate: '2026-06-20' }, { kmh: 20 });
    expect(r.every((d) => d.ok === false && d.tmin === null)).toBe(true);
  });
});
