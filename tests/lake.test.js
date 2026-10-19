// Paket G #9 «Seetemperatur Zürichsee» (Noah 19.10.2026): measurement (Stadt Zürich, Mythenquai,
// Tecdottir), preview (Eawag Alplakes), the server /api/lake and the app's cache. Fictional values only;
// days by calendar-day arithmetic in Europe/Zurich.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import {
  parseTime, zurichDay, addDays, tecdottirUrl, parseTecdottir, latest, dailyStats,
  alplakesStamp, alplakesUrl, parseAlplakes, forecastDays, lakeNow, isLakeAnswer, PAST_DAYS, PAGE,
} from '../api/_lib/lake.js';
import { makeHandler, CACHE } from '../api/lake.js';
import { createDb } from '../src/lib/db.js';
import {
  LAKE_URL, LAKE_CACHE_KEY, LAKE_SET_KEY, lakeSetOf, readLakeSet, saveLakeSet, fetchLake, loadLake,
  isFresh, swimTone, isStale, trend, sparkline, WARM_DEFAULT, REFRESH_MS,
} from '../src/lib/lake.js';
import de from '../src/lib/i18n/de/seetemperatur.js';

// a Tecdottir row: at is UTC ISO, cet the wall clock as the city writes it
const row = (at, water, air = 12.3, status = 'ok') => ({
  station: 'mythenquai',
  timestamp: at,
  values: {
    timestamp_cet: { value: at, unit: '' },
    water_temperature: { value: water, unit: '°C', status },
    air_temperature: { value: air, unit: '°C', status: 'ok' },
  },
});
const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status = 503) => ({ ok: false, status, json: async () => ({}) });

describe('time and days (Europe/Zurich)', () => {
  it('a moment late in the UTC evening is already the next Zurich day', () => {
    expect(zurichDay('2026-07-14T22:30:00Z')).toBe('2026-07-15'); // summer +2
    expect(zurichDay('2026-12-14T22:30:00Z')).toBe('2026-12-14'); // winter +1
    expect(zurichDay('2026-12-14T23:30:00Z')).toBe('2026-12-15');
  });
  it('calendar-day arithmetic over month ends and the clock change', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('reads ISO with zone, Zurich wall clock without zone, the Swiss form and epoch numbers', () => {
    expect(parseTime('2026-08-01T10:00:00.000Z')).toBe('2026-08-01T10:00:00.000Z');
    expect(parseTime('2026-08-01T12:00:00+02:00')).toBe('2026-08-01T10:00:00.000Z');
    expect(parseTime('2026-08-01 12:00:00')).toBe('2026-08-01T10:00:00.000Z');
    expect(parseTime('01.12.2026 12:00:00')).toBe('2026-12-01T11:00:00.000Z');
    expect(parseTime(1785578400)).toBe('2026-08-01T10:00:00.000Z');
    expect(parseTime(1785578400000)).toBe('2026-08-01T10:00:00.000Z');
    expect(parseTime('nonsense')).toBeNull();
    expect(parseTime(null)).toBeNull();
  });
});

describe('Tecdottir (Stadt Zürich, Mythenquai)', () => {
  it('builds the documented address', () => {
    const u = tecdottirUrl({ from: '2026-09-20', to: '2026-10-19', offset: 1000 });
    expect(u).toBe('https://tecdottir.metaodi.ch/measurements/mythenquai?startDate=2026-09-20&endDate=2026-10-19&sort=timestamp_cet%20desc&limit=1000&offset=1000');
  });
  it('parses rows newest first and drops gaps, broken sensors and odd values', () => {
    const rows = parseTecdottir({
      ok: true,
      total_count: 6,
      result: [
        row('2026-08-01T09:50:00.000Z', 21.4),
        row('2026-08-01T10:00:00.000Z', 21.6, 24.1),
        row('2026-08-01T09:40:00.000Z', null, null),
        row('2026-08-01T09:30:00.000Z', -999),
        row('2026-08-01T09:20:00.000Z', 21.0, 22, 'broken'),
        { values: { water_temperature: { value: 20 } } }, // no time
      ],
    });
    expect(rows.map((r) => r.at)).toEqual(['2026-08-01T10:00:00.000Z', '2026-08-01T09:50:00.000Z', '2026-08-01T09:30:00.000Z', '2026-08-01T09:20:00.000Z']);
    expect(rows[2].water).toBeNull();
    expect(rows[3].water).toBeNull(); // broken: only the air stays
    expect(latest(rows)).toEqual({ at: '2026-08-01T10:00:00.000Z', water: 21.6, air: 24.1 });
  });
  it('takes the time from timestamp_cet when the row has no timestamp, values as text with a comma', () => {
    const rows = parseTecdottir({ result: [{ values: { timestamp_cet: { value: '01.08.2026 12:00:00' }, water_temperature: { value: '21,5' } } }] });
    expect(rows).toEqual([{ at: '2026-08-01T10:00:00.000Z', water: 21.5, air: null }]);
  });
  it('anything else gives no rows', () => {
    expect(parseTecdottir(null)).toEqual([]);
    expect(parseTecdottir({ ok: false, message: 'x' })).toEqual([]);
    expect(latest([])).toBeNull();
  });
  it('sums up per Zurich day: min, max, mean, count', () => {
    const rows = parseTecdottir({
      result: [
        row('2026-07-14T21:50:00.000Z', 22.0), // 14 July 23:50 in Zurich
        row('2026-07-14T22:10:00.000Z', 23.0), // 15 July 00:10 in Zurich
        row('2026-07-15T12:00:00.000Z', 24.0),
        row('2026-07-15T13:00:00.000Z', 24.5),
      ],
    });
    expect(dailyStats(rows)).toEqual([
      { day: '2026-07-14', min: 22, max: 22, mean: 22, n: 1 },
      { day: '2026-07-15', min: 23, max: 24.5, mean: 23.8, n: 3 },
    ]);
    expect(dailyStats(rows, { from: '2026-07-15' })).toHaveLength(1);
  });
});

describe('Alplakes (Eawag, Simstrat 1D)', () => {
  it('builds the address with UTC stamps and the depth', () => {
    expect(alplakesStamp(new Date('2026-10-19T00:00:00Z'))).toBe('202610190000');
    expect(alplakesUrl({ start: new Date('2026-10-19T00:00:00Z'), end: new Date('2026-10-24T00:00:00Z') }))
      .toBe('https://alplakes-api.eawag.ch/simulations/1d/point/simstrat/zurich/202610190000/202610240000/1');
  });
  it('reads { time, variables: { T: { data } } }', () => {
    const pts = parseAlplakes({ time: ['2026-10-20T00:00:00+00:00', '2026-10-20T12:00:00+00:00'], variables: { T: { data: [15.2, 15.6], unit: 'degC' } } });
    expect(pts).toEqual([{ at: '2026-10-20T00:00:00.000Z', water: 15.2 }, { at: '2026-10-20T12:00:00.000Z', water: 15.6 }]);
  });
  it('reads other shapes tolerantly: temperature key, nested lists, epoch seconds, a list of points', () => {
    expect(parseAlplakes({ time: [Date.parse('2026-10-20T00:00:00Z') / 1000], variables: { temperature: { data: [[14.9]] } } })).toEqual([{ at: '2026-10-20T00:00:00.000Z', water: 14.9 }]);
    expect(parseAlplakes({ date: ['2026-10-20T00:00:00Z'], T: [15] })).toHaveLength(1);
    expect(parseAlplakes([{ time: '2026-10-20T00:00:00Z', temperature: 15.1 }])).toEqual([{ at: '2026-10-20T00:00:00.000Z', water: 15.1 }]);
  });
  it('anything it cannot read gives an empty preview', () => {
    expect(parseAlplakes(null)).toEqual([]);
    expect(parseAlplakes({ detail: 'Not found' })).toEqual([]);
    expect(parseAlplakes({ time: ['x'], variables: { u: { data: [1] } } })).toEqual([]);
  });
  it('the next days from today on, mean per Zurich day, at most 4 days ahead', () => {
    const today = '2026-10-19';
    const pts = [];
    for (let k = -1; k <= 6; k++) {
      const day = addDays(today, k);
      pts.push({ at: `${day}T06:00:00.000Z`, water: 15 + k / 10 }, { at: `${day}T14:00:00.000Z`, water: 15.2 + k / 10 });
    }
    const f = forecastDays(pts, today);
    expect(f.map((d) => d.day)).toEqual([today, addDays(today, 1), addDays(today, 2), addDays(today, 3), addDays(today, 4)]);
    expect(f[1]).toEqual({ day: addDays(today, 1), water: 15.2, min: 15.1, max: 15.3 });
  });
});

/** A fake internet: the city (one page per call, paged by offset) and the model. */
function fakeNet({ city = 'ok', model = 'ok', today = '2026-10-19', calls = [] } = {}) {
  const rows = [];
  for (let k = 0; k < 3; k++) {
    const day = addDays(today, -k);
    rows.push(row(`${day}T08:00:00.000Z`, 16 - k), row(`${day}T12:00:00.000Z`, 17 - k));
  }
  return async (url) => {
    calls.push(url);
    if (url.includes('tecdottir')) {
      if (city === 'down' || (city === 'first-down' && url.includes('metaodi'))) return fail();
      return ok({ ok: true, total_count: rows.length, result: rows });
    }
    if (url.includes('alplakes')) {
      if (model === 'down') return fail(400);
      const time = [addDays(today, 1), addDays(today, 2)].map((d) => `${d}T10:00:00Z`);
      return ok({ time, variables: { T: { data: [15.5, 15.3], unit: 'degC' } } });
    }
    if (url === LAKE_URL) return fail(404);
    return fail(404);
  };
}
const NOW = new Date('2026-10-19T13:00:00Z');

describe('lakeNow: the whole answer', () => {
  it('measurement now, the past days and the preview', async () => {
    const r = await lakeNow({ doFetch: fakeNet(), now: NOW });
    expect(r.now).toEqual({ at: '2026-10-19T12:00:00.000Z', water: 17, air: 12.3 });
    expect(r.days.map((d) => d.day)).toEqual(['2026-10-17', '2026-10-18', '2026-10-19']);
    expect(r.days[2]).toMatchObject({ min: 16, max: 17, mean: 16.5 });
    expect(r.forecast.map((d) => d.day)).toEqual(['2026-10-20', '2026-10-21']);
    expect(r.sources).toEqual({ measurement: true, forecast: true });
    expect(isLakeAnswer(r)).toBe(true);
  });
  it('asks the city for the last 30 days', async () => {
    const calls = [];
    await lakeNow({ doFetch: fakeNet({ calls }), now: NOW });
    const city = calls.find((u) => u.includes('tecdottir'));
    expect(city).toContain(`startDate=${addDays('2026-10-19', -(PAST_DAYS - 1))}`);
    expect(city).toContain('endDate=2026-10-19');
  });
  it('the older host when the first does not answer', async () => {
    const calls = [];
    const r = await lakeNow({ doFetch: fakeNet({ city: 'first-down', calls }), now: NOW });
    expect(r.now.water).toBe(17);
    expect(calls.some((u) => u.startsWith('https://tecdottir.herokuapp.com/'))).toBe(true);
  });
  it('pages through the city data until all rows are there', async () => {
    const calls = [];
    const doFetch = async (url) => {
      calls.push(url);
      if (!url.includes('tecdottir')) return fail();
      const offset = Number(new URL(url).searchParams.get('offset'));
      const n = offset === 0 ? PAGE : 3;
      const result = Array.from({ length: n }, (_, i) => row(new Date(Date.parse('2026-10-19T12:00:00Z') - (offset + i) * 600000).toISOString(), 16));
      return ok({ ok: true, total_count: PAGE + 3, result });
    };
    const r = await lakeNow({ doFetch, now: NOW });
    expect(calls.filter((u) => u.includes('tecdottir'))).toHaveLength(2);
    expect(r.days.reduce((s, d) => s + d.n, 0)).toBe(PAGE + 3);
  });
  it('without the model the preview is empty, without the city only the preview is there', async () => {
    const a = await lakeNow({ doFetch: fakeNet({ model: 'down' }), now: NOW });
    expect(a.forecast).toEqual([]);
    expect(a.now.water).toBe(17);
    const b = await lakeNow({ doFetch: fakeNet({ city: 'down' }), now: NOW });
    expect(b.now).toBeNull();
    expect(b.days).toEqual([]);
    expect(b.forecast).toHaveLength(2);
  });
  it('throws when neither answers', async () => {
    await expect(lakeNow({ doFetch: fakeNet({ city: 'down', model: 'down' }), now: NOW })).rejects.toThrow();
  });
});

describe('GET /api/lake', () => {
  const req = (q = '?step=now', origin = 'https://noahdolmetsch-af.github.io') => new Request(`https://packgen-three.vercel.app/api/lake${q}`, { headers: { origin } });
  it('answers with the data, a 30-minute cache and CORS for the app', async () => {
    const h = makeHandler({ doFetch: fakeNet(), clock: () => NOW });
    const res = await h(req());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(CACHE);
    expect(CACHE).toContain('s-maxage=1800');
    expect(res.headers.get('access-control-allow-origin')).toBe('https://noahdolmetsch-af.github.io');
    const body = await res.json();
    expect(body.now.water).toBe(17);
    expect(body.forecast).toHaveLength(2);
  });
  it('step defaults to now; another step is 400; POST is 405', async () => {
    const h = makeHandler({ doFetch: fakeNet(), clock: () => NOW });
    expect((await h(req(''))).status).toBe(200);
    expect((await h(req('?step=x'))).status).toBe(400);
    expect((await h(new Request('https://packgen-three.vercel.app/api/lake', { method: 'POST' }))).status).toBe(405);
  });
  it('502 with a clear code when no source answers', async () => {
    const h = makeHandler({ doFetch: fakeNet({ city: 'down', model: 'down' }), clock: () => NOW });
    const res = await h(req());
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe('source_unreachable');
  });
  it('the server stays within the 12 functions of the free Vercel plan', () => {
    const dir = new URL('../api/', import.meta.url);
    const fns = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.js') && !String(f).startsWith('_lib'));
    expect(fns).toContain('lake.js');
    expect(fns.length).toBeLessThanOrEqual(12);
  });
});

describe('the app: cache, fallback, settings', () => {
  let n = 0;
  let db;
  beforeEach(() => {
    n += 1;
    db = createDb(`lake-${n}`);
  });

  it('the server first; when it fails, the sources directly with one page', async () => {
    const serverAnswer = { at: NOW.toISOString(), now: { at: '2026-10-19T12:00:00.000Z', water: 16.4 }, days: [], forecast: [] };
    const viaServer = await fetchLake({ fetcher: async (u) => (u === LAKE_URL ? ok(serverAnswer) : fail()), now: NOW });
    expect(viaServer.via).toBe('server');
    expect(viaServer.data.now.water).toBe(16.4);
    const calls = [];
    const direct = await fetchLake({ fetcher: fakeNet({ calls }), now: NOW });
    expect(direct.via).toBe('direct');
    expect(direct.data.now.water).toBe(17);
    expect(calls[0]).toBe(LAKE_URL);
  });
  it('a wrong server answer counts as no answer', async () => {
    const r = await fetchLake({ fetcher: async (u) => (u === LAKE_URL ? ok({ hello: 1 }) : fakeNet()(u)), now: NOW });
    expect(r.via).toBe('direct');
  });
  it('keeps the answer on the device, asks again only after 30 minutes, offline gives the old one', async () => {
    let count = 0;
    const net = fakeNet();
    const fetcher = async (u) => {
      count += 1;
      return net(u);
    };
    const a = await loadLake(db, { fetcher, now: NOW });
    expect(a.data.now.water).toBe(17);
    expect((await db.meta.get(LAKE_CACHE_KEY)).value.fetchedAt).toBe(NOW.toISOString());
    const before = count;
    const later = new Date(NOW.getTime() + 10 * 60000);
    await loadLake(db, { fetcher, now: later });
    expect(count).toBe(before); // still fresh
    expect(isFresh(a, new Date(NOW.getTime() + REFRESH_MS + 1))).toBe(false);
    const off = await loadLake(db, { fetcher: async () => { throw new Error('offline'); }, now: new Date(NOW.getTime() + REFRESH_MS + 60000) });
    expect(off.error).toBe(true);
    expect(off.data.now.water).toBe(17);
  });
  it('nothing stored and offline: an error without data', async () => {
    const r = await loadLake(db, { fetcher: async () => { throw new Error('offline'); }, now: NOW });
    expect(r).toEqual({ error: true, data: null });
  });
  it('the swim threshold: default 20, kept between 10 and 30, half degrees', async () => {
    expect(lakeSetOf(undefined)).toEqual({ warm: WARM_DEFAULT });
    expect(lakeSetOf({ warm: 45 }).warm).toBe(30);
    expect(lakeSetOf({ warm: 18.3 }).warm).toBe(18.5);
    await saveLakeSet(db, { warm: 22 });
    expect(await readLakeSet(db)).toEqual({ warm: 22 });
    expect((await db.settings.get(LAKE_SET_KEY)).value.warm).toBe(22);
  });
  it('swim tone, stale, trend', () => {
    expect(swimTone(20, 20)).toBe('warm');
    expect(swimTone(19.9, 20)).toBe('cool');
    expect(swimTone(undefined)).toBeNull();
    expect(isStale('2026-10-19T12:00:00Z', NOW)).toBe(false);
    expect(isStale('2026-10-19T09:00:00Z', NOW)).toBe(true);
    const days = Array.from({ length: 10 }, (_, k) => ({ day: addDays('2026-10-10', k), mean: 18 - k * 0.2 }));
    expect(trend(days)).toBe(-1.4);
    expect(trend(days.slice(0, 1))).toBeNull();
  });
  it('the line: by calendar day, the preview joined dashed, the threshold inside the box', () => {
    const days = [{ day: '2026-10-17', mean: 16 }, { day: '2026-10-19', mean: 17 }];
    const s = sparkline(days, [{ day: '2026-10-19', water: 17 }, { day: '2026-10-20', water: 18 }], { w: 100, h: 20, pad: 0, warm: 17 });
    expect(s.points.map((p) => p.x)).toEqual([0, 66.7, 100]); // the gap on the 18th stays a gap
    expect(s.past.startsWith('M0 ')).toBe(true);
    expect(s.ahead.startsWith('M66.7 ')).toBe(true);
    expect(s.lo).toBe(16);
    expect(s.hi).toBe(18);
    expect(s.warmY).toBe(10);
    expect(sparkline([{ day: '2026-10-19', mean: 17 }])).toBeNull();
  });
});

describe('German texts', () => {
  it('every text of the card has German, without ß', () => {
    const src = readFileSync(new URL('../src/lib/lake/LakeCard.svelte', import.meta.url), 'utf8');
    const keys = [...src.matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(10);
    for (const k of keys) expect(de[k], k).toBeTruthy();
    for (const v of Object.values(de)) expect(v).not.toContain('ß');
  });
});
