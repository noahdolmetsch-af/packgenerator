// Paket Y «Wetter-Kern» (Noah 20.10.2026): the one weather core (src/lib/wetter/kern.js), made-up weather.
import { describe, it, expect } from 'vitest';
import { coreUrl, coreKey, parseCore, loadCore, dayLine, warningsOf, bestWindows, hourCost, packHints, foehnBise, trainInstead, outdoorOk, rainWithin, atLocal, localDate, costWord, LIMITS } from '../src/lib/wetter/kern.js';

const OFF = 7200; // Zurich summer time
const DAY0 = '2026-07-10';
const t0 = Date.parse(`${DAY0}T00:00:00Z`) - OFF * 1000; // local midnight
// 3 days of hours; fill(fn) gives each hour its values from (day, hour)
function answer(fn = () => ({})) {
  const n = 72;
  const time = Array.from({ length: n }, (_, i) => (t0 + i * 36e5) / 1000);
  const rows = time.map((s, i) => ({ temp: 18, feels: 18, rainP: 0, rainMm: 0, code: 1, wind: 8, gust: 15, dir: 270, cape: 0, frz: 3500, vis: 20000, snow: 0, depth: 0, ...fn(Math.floor(i / 24), i % 24) }));
  const col = (k) => rows.map((r) => r[k]);
  return {
    latitude: 47.37,
    longitude: 8.54,
    elevation: 410,
    utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: col('temp'), apparent_temperature: col('feels'), precipitation_probability: col('rainP'), precipitation: col('rainMm'), weather_code: col('code'), wind_speed_10m: col('wind'), wind_gusts_10m: col('gust'), wind_direction_10m: col('dir'), cape: col('cape'), freezing_level_height: col('frz'), visibility: col('vis'), snowfall: col('snow'), snow_depth: col('depth') },
    daily: { time: [0, 1, 2].map((d) => (t0 + d * 864e5) / 1000), sunrise: [0, 1, 2].map((d) => (t0 + d * 864e5 + 6 * 36e5) / 1000), sunset: [0, 1, 2].map((d) => (t0 + d * 864e5 + 21 * 36e5) / 1000), uv_index_max: [6, 5, 4] },
  };
}
const at = (d, h) => t0 + (d * 24 + h) * 36e5;

describe('reading the answer', () => {
  it('asks once for hours and days in local time', () => {
    const u = coreUrl({ lat: 47.3712, lon: 8.5432 });
    expect(u).toContain('latitude=47.371');
    expect(u).toContain('timezone=auto');
    expect(u).toContain('cape');
    expect(coreKey({ lat: 47.371, lon: 8.5432 })).toBe('wx-core:47.37,8.54');
  });
  it('keeps hours and days', () => {
    const c = parseCore(answer());
    expect(c.hours).toHaveLength(72);
    expect(c.hours[0]).toMatchObject({ ms: t0, temp: 18, dir: 270 });
    expect(c.days[0].date).toBe(DAY0);
    expect(c.days[0].rise).toBe(t0 + 6 * 36e5);
    expect(localDate(t0, OFF)).toBe(DAY0);
    expect(atLocal(DAY0, 9, OFF)).toBe(t0 + 9 * 36e5);
  });
});

describe('loadCore', () => {
  const meta = () => {
    const m = new Map();
    return { m, meta: { get: async (k) => m.get(k), put: async (r) => m.set(r.key, r) } };
  };
  it('asks once, then keeps it 3 hours, offline shows the old one', async () => {
    const db = meta();
    let n = 0;
    const fetcher = async () => (n++, { ok: true, json: async () => answer() });
    const place = { lat: 47.37, lon: 8.54 };
    const a = await loadCore(db, place, { fetcher, now: 1e12 });
    expect(a.hours).toHaveLength(72);
    await loadCore(db, place, { fetcher, now: 1e12 + 36e5 });
    expect(n).toBe(1);
    const c = await loadCore(db, place, { fetcher, now: 1e12 + 4 * 36e5, online: false });
    expect(c.old).toBe(true);
    expect(n).toBe(1);
    expect(await loadCore(db, place, { fetcher: async () => ({ ok: false }), now: 1e12 + 30 * 36e5 })).toBeNull();
    expect(await loadCore(db, null)).toBeNull();
  });
});

describe('what the day brings', () => {
  const c = parseCore(answer((d, h) => (d === 0 && h >= 15 ? { rainP: 80, rainMm: 1.2, wind: 30, dir: 250, temp: 14 } : d === 0 ? { temp: 8 + h / 2 } : {})));
  it('one line: low, high, first rain, wind', () => {
    const l = dayLine(c.hours.slice(6, 20));
    expect(l.tmin).toBe(11);
    expect(l.rainFrom).toBe(at(0, 15));
    expect(l.windMax).toBe(30);
    expect(l.dir).toBe(250);
    expect(dayLine([])).toBeNull();
  });
  it('the best window avoids the rainy afternoon; tomorrow wins when today is wet all day', () => {
    const w = bestWindows(c, { durH: 4, days: 2, fromDate: DAY0, now: t0 });
    expect(w.days).toHaveLength(2);
    expect(new Date(w.days[0].end).getTime()).toBeLessThanOrEqual(at(0, 15));
    const wet = parseCore(answer((d) => (d === 0 ? { rainP: 90, rainMm: 3 } : {})));
    const b = bestWindows(wet, { durH: 3, days: 2, fromDate: DAY0, now: t0 }).best;
    expect(b.date).toBe('2026-07-11');
    expect(costWord(b.cost)).toBe('good');
  });
  it('the dark costs', () => {
    const sun = { rise: at(0, 6), set: at(0, 21) };
    const h = c.hours[at(1, 12) / 36e5 - t0 / 36e5];
    expect(hourCost({ ...h, ms: at(0, 22) }, sun)).toBeGreaterThan(hourCost({ ...h, ms: at(0, 12) }, sun));
  });
});

describe('warnings', () => {
  it('thunder, storm, ice, heat, fog, snow: each once, in time order', () => {
    const c = parseCore(answer((d, h) => (h === 1 ? { temp: 0, rainMm: 0.5, rainP: 70 } : h === 3 ? { vis: 300 } : h === 14 ? { temp: 33 } : h === 16 ? { code: 95 } : h === 17 ? { gust: 75 } : h === 22 ? { snow: 1 } : {})));
    const w = warningsOf(c.hours.slice(0, 24));
    expect(w.map((x) => x.kind)).toEqual(['ice', 'fog', 'heat', 'thunder', 'storm', 'snow']);
    expect(w.find((x) => x.kind === 'storm').value).toBe(75);
  });
  it('ice after rain on a dry cold hour', () => {
    const c = parseCore(answer((d, h) => (h === 4 ? { temp: 0.5 } : {})));
    expect(warningsOf(c.hours.slice(0, 6)).length).toBe(0);
    expect(warningsOf(c.hours.slice(0, 6), { wasWet: true })[0].kind).toBe('ice');
  });
});

describe('packing, Föhn and Bise, train, outdoor', () => {
  it('clothes for a cold windy morning with rain later', () => {
    const c = parseCore(answer((d, h) => ({ temp: h * 1.5 - 6, feels: h * 1.5 - 8, wind: 28, ...(h >= 12 ? { rainP: 70 } : {}) })));
    const keys = packHints(c.hours.slice(7, 14)).map((x) => x.key);
    expect(keys).toEqual(expect.arrayContaining(['rainjacket', 'windjacket', 'layer', 'armwarmers', 'longgloves']));
    expect(packHints([])).toEqual([]);
  });
  it('Bise from the north-east, Föhn from the south and dry', () => {
    expect(foehnBise(parseCore(answer(() => ({ dir: 50, wind: 25 }))).hours.slice(0, 6))).toBe('bise');
    expect(foehnBise(parseCore(answer(() => ({ dir: 180, gust: 55 }))).hours.slice(0, 6))).toBe('foehn');
    expect(foehnBise(parseCore(answer()).hours.slice(0, 6))).toBeNull();
  });
  it('«Heute lieber Zug?» with heavy rain on the way home', () => {
    const c = parseCore(answer((d, h) => (d === 0 && h === 17 ? { rainMm: 4, rainP: 90 } : {})));
    expect(trainInstead(c, DAY0)).toEqual({ why: ['rain'], at: at(0, 17) });
    expect(trainInstead(c, '2026-07-11')).toBeNull();
  });
  it('the next good hour outside, and rain within 3 hours', () => {
    const c = parseCore(answer((d, h) => (h < 10 ? { rainP: 80 } : {})));
    expect(outdoorOk(c, at(0, 8)).at).toBe(at(0, 10));
    expect(rainWithin(c, at(0, 8))).toBe(at(0, 8));
    expect(rainWithin(c, at(0, 11))).toBeNull();
    expect(LIMITS.storm).toBe(60);
  });
});

import { snowOnRoute, routeTop, darkAfter } from '../src/lib/wetter/kern.js';
describe('snow where the route goes high, and the dark', () => {
  it('snow line from the freezing level against the top of the route', () => {
    const hs = [{ frz: 2200, snowCm: 0, depth: 0 }, { frz: 2100, snowCm: 0.4, depth: 0.1 }];
    expect(snowOnRoute(hs, 2400)).toEqual({ line: 1800, top: 2400, above: true, newCm: 0.4, depthCm: 10 });
    expect(snowOnRoute([{ frz: 3500, snowCm: 0, depth: 0 }], 600)).toBeNull();
    expect(routeTop([[0, 400], [10, 2100], [20, 800]])).toBe(2100);
    expect(routeTop([])).toBeNull();
  });
  it('minutes after sunset', () => {
    const c = parseCore(answer());
    expect(darkAfter(c, at(0, 22))).toBe(60);
    expect(darkAfter(c, at(0, 20))).toBe(0);
  });
});
