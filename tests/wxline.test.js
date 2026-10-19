// Paket U «Wetter entlang der Strecke als Zeitleiste» (wxline.js): riding direction, headwind maths,
// sample points, expected times from a plan or a pace, the rows and the summary. Synthetic coordinates
// only (a made-up straight line), a fake fetcher, times as fixed UTC hours.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  bearing, routeBearingAt, windParts, windKind, WIND_KIND, routeKey, linePoints, fetchWxLine, wxLineAt, startMs, kmhOf, etaFn, timelineRows, lineSummary,
  cacheFits, wxLineKey, WXLINE_CACHE, WXLINE_MAX, CALM_KMH,
} from '../src/lib/map/wxline.js';
import { lineKm } from '../src/lib/race/race.js';
import DE from '../src/lib/i18n/de/index.js';
import LIVE_DE from '../src/lib/i18n/de/live-route.js';

// a made-up route going due east along the equator: 1° of longitude ≈ 111.2 km
const east = { km: 0, line: Array.from({ length: 21 }, (_, i) => [0, 20 + i * 0.05]) };
const pts = lineKm(east);
const T0 = Date.UTC(2026, 5, 1, 6, 0); // 1 June 2026, 06:00 UTC
const H = 36e5;

/** A forecast series: 48 hours from T0, values from functions of the hour. */
const series = (f = {}) => {
  const time = Array.from({ length: 48 }, (_, i) => (T0 + i * H) / 1000);
  const col = (fn, d) => time.map((_, i) => (fn ? fn(i) : d));
  return {
    hourly: {
      time,
      temperature_2m: col(f.temp, 15),
      precipitation_probability: col(f.rainP, 10),
      precipitation: col(f.rainMm, 0),
      wind_speed_10m: col(f.wind, 20),
      wind_gusts_10m: col(f.gust, 30),
      wind_direction_10m: col(f.dir, 90),
    },
  };
};

describe('riding direction', () => {
  it('bearing: north, east, south, west', () => {
    expect(Math.round(bearing({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }))).toBe(0);
    expect(Math.round(bearing({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }))).toBe(90);
    expect(Math.round(bearing({ lat: 1, lon: 0 }, { lat: 0, lon: 0 }))).toBe(180);
    expect(Math.round(bearing({ lat: 0, lon: 1 }, { lat: 0, lon: 0 }))).toBe(270);
  });
  it('the route direction at a km of the line', () => {
    expect(routeBearingAt(pts, 30)).toBe(90);
    expect(routeBearingAt(pts, 0)).toBe(90);
    expect(routeBearingAt(pts, pts.at(-1).km)).toBe(90);
    expect(routeBearingAt([], 3)).toBeNull();
    // a route back west
    const west = lineKm({ line: [...east.line].reverse() });
    expect(routeBearingAt(west, 40)).toBe(270);
  });
});

describe('headwind and tailwind', () => {
  it('wind from where you ride to is all headwind, from behind all tailwind', () => {
    expect(windParts(20, 90, 90)).toEqual({ head: 20, cross: 0 });
    expect(windParts(20, 270, 90)).toEqual({ head: -20, cross: 0 });
  });
  it('wind from the side is crosswind, 45° splits it', () => {
    expect(windParts(20, 0, 90)).toEqual({ head: 0, cross: 20 });
    expect(windParts(20, 180, 90)).toEqual({ head: 0, cross: 20 });
    const p = windParts(20, 45, 90);
    expect(p.head).toBeCloseTo(14.1, 1);
    expect(p.cross).toBeCloseTo(14.1, 1);
    // across north: wind from 350°, riding 10°
    expect(windParts(10, 350, 10).head).toBeCloseTo(9.4, 1);
  });
  it('missing numbers give nulls', () => {
    expect(windParts(null, 90, 90)).toEqual({ head: null, cross: null });
    expect(windParts(10, 90, null)).toEqual({ head: null, cross: null });
  });
  it('what you feel', () => {
    expect(windKind(20, 18, 5)).toBe('head');
    expect(windKind(20, -18, 5)).toBe('tail');
    expect(windKind(20, 5, 18)).toBe('cross');
    expect(windKind(CALM_KMH - 1, 3, 0)).toBe('calm');
    expect(windKind(null, null, null)).toBe('');
    expect(Object.keys(WIND_KIND).sort()).toEqual(['calm', 'cross', 'head', 'tail']);
  });
});

describe('sample points', () => {
  it('about every 25 km, start and end included, each with its direction', () => {
    const p = linePoints(pts);
    const total = pts.at(-1).km;
    expect(p[0].km).toBe(0);
    expect(p.at(-1).km).toBeCloseTo(total, 0);
    expect(p.map((x) => x.km).slice(0, 4)).toEqual([0, 25, 50, 75]);
    expect(p.every((x) => x.deg === 90)).toBe(true);
    // no tiny last step: the end is never closer than a quarter step to the point before
    expect(p.at(-1).km - p.at(-2).km).toBeGreaterThan(25 * 0.25);
  });
  it('a long route gets wider steps, at most WXLINE_MAX points', () => {
    const long = lineKm({ km: 1200, line: east.line });
    const p = linePoints(long);
    expect(p.length).toBeLessThanOrEqual(WXLINE_MAX);
    expect(p[1].km).toBeCloseTo(1200 / (WXLINE_MAX - 1), 0);
  });
  it('nothing without a line', () => {
    expect(linePoints([])).toEqual([]);
  });
  it('the route key changes with another route', () => {
    expect(routeKey(pts)).toBe(routeKey(lineKm(east)));
    expect(routeKey(pts)).not.toBe(routeKey(lineKm({ line: [...east.line].reverse() })));
    expect(cacheFits({ key: routeKey(pts), points: [{ km: 0 }] }, pts)).toBe(true);
    expect(cacheFits({ key: 'other', points: [{ km: 0 }] }, pts)).toBe(false);
    expect(cacheFits(null, pts)).toBe(false);
    expect(wxLineKey('t1')).toBe(`${WXLINE_CACHE}t1`);
    expect(wxLineKey('')).toBe(`${WXLINE_CACHE}live`);
  });
});

describe('the forecast', () => {
  it('one request for all points, without a key', async () => {
    let url = '';
    const fetcher = async (u) => ((url = u), { ok: true, json: async () => [series(), series()] });
    const out = await fetchWxLine([{ lat: 0, lon: 20 }, { lat: 0, lon: 20.5 }], fetcher);
    expect(out).toHaveLength(2);
    expect(url).toMatch(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
    expect(url).toContain('latitude=0.000%2C0.000');
    expect(url).toContain('precipitation_probability');
    expect(url).not.toMatch(/apikey|key=/i);
    await expect(fetchWxLine([{ lat: 0, lon: 20 }], async () => ({ ok: false, status: 429 }))).rejects.toThrow('busy');
    expect(await fetchWxLine([], fetcher)).toEqual([]);
  });
  it('the nearest hour, nothing outside the forecast', () => {
    const s = series({ temp: (i) => 10 + i });
    expect(wxLineAt(s, T0 + 2 * H + 20 * 6e4)).toMatchObject({ at: T0 + 2 * H, temp: 12, rainP: 10, wind: 20, gust: 30, dir: 90 });
    expect(wxLineAt(s, T0 + 2 * H + 40 * 6e4).temp).toBe(13);
    expect(wxLineAt(s, T0 - 3 * H)).toBeNull();
    expect(wxLineAt(s, T0 + 60 * H)).toBeNull();
    expect(wxLineAt(null, T0)).toBeNull();
  });
});

describe('when you are where', () => {
  it('a start as ms or local time', () => {
    expect(startMs(T0)).toBe(T0);
    expect(startMs('2026-06-01T08:00')).toBe(new Date('2026-06-01T08:00').getTime());
    expect(startMs('')).toBeNull();
    expect(startMs('nonsense')).toBeNull();
    expect(kmhOf(20)).toBe(20);
    expect(kmhOf({ kmh: 18 })).toBe(18);
    expect(kmhOf(0)).toBeNull();
  });
  it('a plan wins: its etaOf', () => {
    const plan = { etaOf: (km) => T0 + km * 6e4 };
    expect(etaFn({ plan, pace: 30 })(50)).toBe(T0 + 50 * 6e4);
  });
  it('a pace from the start (flat)', () => {
    const eta = etaFn({ pace: 20, startAt: T0 });
    expect(eta(0)).toBe(T0);
    expect(eta(50)).toBe(T0 + 2.5 * H);
  });
  it('a pace from where you are on the live map: from now at fromKm', () => {
    const eta = etaFn({ pace: 25, fromKm: 40, now: T0 });
    expect(eta(40)).toBe(T0);
    expect(eta(90)).toBe(T0 + 2 * H);
    expect(eta(10)).toBe(T0); // behind you: now
  });
  it('climbing slows you down (600 m up ≈ 16 km flat)', () => {
    const profile = [[0, 400], [10, 1000], [20, 1000]];
    const eta = etaFn({ pace: 16, startAt: T0, profile, totalKm: 20 });
    expect((eta(20) - T0) / H).toBeCloseTo(20 / 16 + 1, 1);
  });
  it('no plan and no pace: null', () => {
    expect(etaFn({})).toBeNull();
  });
});

describe('the rows of the timeline', () => {
  const points = [
    { km: 0, lat: 0, lon: 20, deg: 90 },
    { km: 25, lat: 0, lon: 20.225, deg: 90 },
    { km: 50, lat: 0, lon: 20.45, deg: 90 },
    { km: 75, lat: 0, lon: 20.674, deg: 90 },
  ];
  // wind from the east (against you) in the morning, from the west (behind you) from 09:00, rain at 08:00
  const s = series({ dir: (i) => (i >= 3 ? 270 : 90), rainP: (i) => (i === 2 ? 80 : 10), rainMm: (i) => (i === 2 ? 1.2 : 0), temp: (i) => 10 + i });
  const cache = { key: 'k', points, series: points.map(() => s) };
  const eta = etaFn({ pace: 25, startAt: T0 }); // km 25 at 07:00, 50 at 08:00, 75 at 09:00

  it('each point at its hour, with headwind or tailwind there', () => {
    const rows = timelineRows(cache, { eta, now: T0 });
    expect(rows.map((r) => r.eta)).toEqual([T0, T0 + H, T0 + 2 * H, T0 + 3 * H]);
    expect(rows.map((r) => r.temp)).toEqual([10, 11, 12, 13]);
    expect(rows.map((r) => r.kind)).toEqual(['head', 'head', 'head', 'tail']);
    expect(rows[0].head).toBe(20);
    expect(rows[3].head).toBe(-20);
    expect(rows.map((r) => r.rain)).toEqual([false, false, true, false]);
  });
  it('the strip starts where you are; a time already past counts as now', () => {
    const rows = timelineRows(cache, { eta, fromKm: 40, now: T0 + 2.5 * H });
    expect(rows.map((r) => r.km)).toEqual([50, 75]);
    expect(rows[0].eta).toBe(T0 + 2.5 * H);
  });
  it('without a plan: the weather of now everywhere', () => {
    const rows = timelineRows(cache, { now: T0 + H });
    expect(rows.every((r) => r.eta === T0 + H)).toBe(true);
  });
  it('a point outside the forecast is kept, marked w: false', () => {
    const far = etaFn({ pace: 1, startAt: T0 }); // km 75 after 75 h
    const rows = timelineRows(cache, { eta: far, now: T0 });
    expect(rows[0].w).toBe(true);
    expect(rows.at(-1).w).toBe(false);
  });
  it('the summary: first rain, strongest headwind, low and high', () => {
    const sum = lineSummary(timelineRows(cache, { eta, now: T0 }));
    expect(sum.rain.km).toBe(50);
    expect(sum.head.km).toBe(0);
    expect(sum.head.head).toBe(20);
    expect([sum.low, sum.high]).toEqual([10, 13]);
    expect(lineSummary([])).toEqual({ rain: null, head: null, low: null, high: null });
  });
});

describe('German', () => {
  it('every text of the weather timeline has German with the same placeholders', () => {
    const de = { ...DE, ...LIVE_DE };
    const text = readFileSync(new URL('../src/lib/map/WxTimeline.svelte', import.meta.url), 'utf8');
    const keys = [...text.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
    const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    expect(keys.length).toBeGreaterThan(10);
    expect(keys.filter((k) => !de[k] || ph(k) !== ph(de[k]))).toEqual([]);
    expect(Object.values(WIND_KIND).filter((k) => !de[k])).toEqual([]);
  });
});
