// «Nebelgrenze» (Noah 05.11.2026): the fog top from the air layers, made-up weather.
import { describe, it, expect } from 'vitest';
import { atLocal } from '../src/lib/wetter/kern.js';
import { fogOf, slots, clearing, sightParts, summary } from '../src/lib/wetter/nebelgrenze.js';
import { profilUrl as fogUrl, parseProfil as parseFog, tempAt, loadProfil as loadFog, cacheKey, LEVELS } from '../src/lib/wetter/profil.js';

const OFF = 3600;
const DAY = '2026-11-05';
const at = (h) => atLocal(DAY, h, OFF);
const t0 = Date.parse(`${DAY}T00:00:00Z`) - OFF * 1000;

// layers (m above sea level): 1000 hPa ≈ 110, 975 ≈ 330, 950 ≈ 550, 925 ≈ 780, 900 ≈ 1000, 850 ≈ 1500
const Z = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500 };
// A classic high-fog day: damp up to ~900 m, warm and dry above (an inversion).
const FOG = { rh: { 1000: 98, 975: 98, 950: 97, 925: 96, 900: 40, 850: 30 }, t: { 1000: 3, 975: 2.5, 950: 2, 925: 1, 900: 9, 850: 8 } };
const CLEAR = { rh: { 1000: 60, 975: 55, 950: 50, 925: 45, 900: 40, 850: 30 }, t: { 1000: 6, 975: 4, 950: 3, 925: 1, 900: -1, 850: -4 } };

function api(hours) {
  // hours: [{ low, mid, high, vis, t2, rh2, air }]
  const col = (f) => hours.map(f);
  const hourly = {
    time: hours.map((_, i) => (t0 + i * 36e5) / 1000),
    temperature_2m: col((h) => h.t2 ?? 3.5),
    relative_humidity_2m: col((h) => h.rh2 ?? 98),
    cloud_cover_low: col((h) => h.low),
    cloud_cover_mid: col((h) => h.mid ?? 0),
    cloud_cover_high: col((h) => h.high ?? 0),
    visibility: col((h) => h.vis ?? 24000),
  };
  for (const l of LEVELS) {
    hourly[`geopotential_height_${l}hPa`] = col(() => Z[l]);
    hourly[`temperature_${l}hPa`] = col((h) => h.air.t[l]);
    hourly[`relative_humidity_${l}hPa`] = col((h) => h.air.rh[l]);
  }
  return { latitude: 47.37, longitude: 8.54, elevation: 410, utc_offset_seconds: OFF, hourly };
}
// a day: fog until 10 h (low cloud 100 %), clear from 11 h
const day = (n) => Array.from({ length: n }, (_, h) => (h <= 10 ? { low: 100, vis: 600, air: FOG } : { low: 5, t2: 9, rh2: 55, air: CLEAR }));
const fog = parseFog(api(day(24)));

describe('the request and the answer', () => {
  it('asks for the layers, the clouds and the sight, 3 days', () => {
    const u = fogUrl({ lat: 47.37, lon: 8.54 });
    for (const k of ['cloud_cover_low', 'visibility', 'temperature_925hPa', 'relative_humidity_850hPa', 'geopotential_height_1000hPa', 'temperature_600hPa']) expect(u).toContain(k);
    expect(u).toContain('forecast_days=3');
  });
  it('keeps the layers of an hour from low to high; a layer without a value is left out', () => {
    expect(fog.elev).toBe(410);
    expect(fog.hours[0].lay.map((p) => p[0])).toEqual([110, 330, 550, 780, 1000, 1500]); // the levels the test day fills; 800/700/600 hPa are not in it
    const j = api(day(2));
    j.hourly.temperature_925hPa[0] = null;
    expect(parseFog(j).hours[0].lay).toHaveLength(5);
    expect(parseFog(null).hours).toEqual([]);
  });
});

describe('the fog top of one hour', () => {
  it('a damp deck under a warm dry layer: the top where the humidity falls through 85 %', () => {
    const f = fogOf(fog.hours[8], fog.elev);
    expect(f.top).toBe(800); // 925 hPa (780 m, 96 %) → 900 hPa (1000 m, 40 %): 85 % at 780 + 0.2·220 = 823 m → rounded to 100 m
    expect(f.ground).toBe(true);
  });
  it('no low cloud: no deck', () => {
    expect(fogOf(fog.hours[14], fog.elev)).toEqual({ top: null });
  });
  it('damp all the way up (a rain cloud) and an uncapped layer are no fog deck', () => {
    const deep = { rh: { 1000: 98, 975: 98, 950: 97, 925: 96, 900: 95, 850: 95 }, t: FOG.t };
    expect(fogOf(parseFog(api([{ low: 100, air: deep }])).hours[0], 410)).toEqual({ top: null });
    const uncapped = { rh: FOG.rh, t: { 1000: 3, 975: 2, 950: 1, 925: 0, 900: -3, 850: -6 } }; // cooling on up: no inversion
    expect(fogOf(parseFog(api([{ low: 100, air: uncapped }])).hours[0], 410)).toEqual({ top: null });
  });
  it('layers under the ground do not count; a deck that starts above the ground does', () => {
    // the place is at 410 m: 1000 hPa (110 m) and 975 hPa (330 m) lie under it
    const j = api([{ low: 100, rh2: 60, air: FOG }]);
    const f = fogOf(parseFog(j).hours[0], 410);
    expect(f.top).toBe(800);
    expect(f.ground).toBe(false); // dry at the ground, damp from 550 m
  });
  it('says nothing without cloud or layer values', () => {
    expect(fogOf(null, 410)).toBeNull();
    expect(fogOf({ low: null, lay: [] }, 410)).toBeNull();
    expect(fogOf({ low: 100, t: 3, rh: 98, lay: [] }, 410)).toBeNull();
  });
});

describe('through the day', () => {
  it('six times from 6 to 21 h', () => {
    const s = slots(fog, at(8));
    expect(s.map((x) => x.hour)).toEqual([6, 9, 12, 15, 18, 21]);
    expect(s.map((x) => x.top)).toEqual([800, 800, null, null, null, null]);
  });
  it('fog now, clear from 11 h: it clears at 11', () => {
    expect(clearing(fog, at(8) + 60_000)).toEqual({ kind: 'clears', hour: 11 });
  });
  it('fog until 21 h: it stays', () => {
    const all = parseFog(api(Array.from({ length: 24 }, () => ({ low: 100, air: FOG }))));
    expect(clearing(all, at(8))).toEqual({ kind: 'stays' });
  });
  it('clear now and fog later: it comes', () => {
    const later = parseFog(api(Array.from({ length: 24 }, (_, h) => (h >= 17 ? { low: 100, air: FOG } : { low: 0, air: CLEAR }))));
    expect(clearing(later, at(10))).toEqual({ kind: 'comes', hour: 17 });
  });
  it('clear all day: nothing to say', () => {
    const none = parseFog(api(Array.from({ length: 24 }, () => ({ low: 0, air: CLEAR }))));
    expect(clearing(none, at(10))).toBeNull();
  });
});

describe('temperature above and sight', () => {
  it('between the layers it is interpolated; outside it is unknown', () => {
    const pts = [{ z: 0, t: 0 }, { z: 1000, t: 10 }];
    expect(tempAt(pts, 500)).toBe(5);
    expect(tempAt(pts, 2000)).toBeNull();
  });
  it('sight: metres below 1 km, km up to 20, then «20+»', () => {
    expect(sightParts(620)).toEqual({ v: 600, unit: 'm' });
    expect(sightParts(4380)).toEqual({ v: 4.4, unit: 'km' });
    expect(sightParts(12400)).toEqual({ v: 12, unit: 'km' });
    expect(sightParts(24100)).toEqual({ v: 20, unit: 'km', over: true });
    expect(sightParts(null)).toBeNull();
  });
});

describe('the summary', () => {
  it('fog: the top, sun above, your place, warmer above, the clearing time, the sight', () => {
    const s = summary(fog, at(8) + 60_000, null);
    expect(s.now.top).toBe(800);
    expect(s.above).toBe('sun');
    expect(s.own).toEqual({ m: 410, in: true });
    expect(s.up).toEqual({ h: 900, diff: 2 }); // ~5.4 °C at 900 m against 3.5 °C below
    expect(s.clearing).toEqual({ kind: 'clears', hour: 11 });
    expect(s.sight).toEqual({ v: 600, unit: 'm' });
  });
  it('cloud above the deck is said so, a higher place is above the fog', () => {
    const cloudy = parseFog(api([{ low: 100, mid: 80, air: FOG }]));
    expect(summary(cloudy, at(0) + 60_000, 1200).above).toBe('cloud');
    expect(summary(cloudy, at(0) + 60_000, 1200).own).toEqual({ m: 1200, in: false });
  });
  it('no fog: still a summary (the page says «no fog line»), the temperature at 1000 m, no sun sentence', () => {
    const s = summary(fog, at(14) + 60_000, null);
    expect(s.now).toEqual({ top: null });
    expect(s.above).toBeNull();
    expect(s.own).toBeNull();
    expect(s.up).toEqual({ h: 1000, diff: -10 }); // without fog the height is 1000 m: -1 °C there against 9 °C below
  });
  it('no hour for the time: nothing', () => {
    expect(summary(fog, at(-5), null)).toBeNull();
  });
});

describe('loading', () => {
  const place = { lat: 47.37, lon: 8.54 };
  const mem = () => {
    const rows = new Map();
    return { meta: { get: async (k) => rows.get(k), put: async (r) => rows.set(r.key, r) }, rows };
  };
  it('asks once, keeps the answer 3 hours and shows the kept one when the service fails', async () => {
    const db = mem();
    let calls = 0;
    const fetcher = async () => (++calls, { ok: true, json: async () => api(day(2)) });
    const a = await loadFog(db, place, { fetcher, now: 1000 });
    expect(a.old).toBe(false);
    await loadFog(db, place, { fetcher, now: 1000 + 36e5 });
    expect(calls).toBe(1);
    const b = await loadFog(db, place, { fetcher: async () => ({ ok: false }), now: 1000 + 4 * 36e5 });
    expect(b.old).toBe(true);
    expect(db.rows.has(cacheKey(place))).toBe(true);
    expect(await loadFog(db, null)).toBeNull();
  });
});

describe('the route against the fog (nebelroute.js)', () => {
  const route = [[0, 400], [10, 600], [20, 900], [30, 1100], [40, 700]];
  it('starts in the fog, goes above it where the profile crosses the top, and counts the km in the fog', async () => {
    const { routeFog } = await import('../src/lib/wetter/nebelroute.js');
    const r = routeFog(route, 800);
    expect(r).toMatchObject({ startM: 400, startIn: true, aboveKm: 16.7, km: 40, topM: 1100 });
    expect(r.kmIn).toBe(19.2); // 10 km + 6.7 km up to the crossing + 2.5 km on the way down
  });
  it('starts above the fog: no «above from km», only the km that dip into it', async () => {
    const { routeFog } = await import('../src/lib/wetter/nebelroute.js');
    const r = routeFog([[0, 1000], [10, 700], [20, 1000]], 800);
    expect(r.startIn).toBe(false);
    expect(r.aboveKm).toBeNull();
    expect(r.kmIn).toBeCloseTo(6.7, 1);
  });
  it('a route that never leaves the fog, and no profile or no top', async () => {
    const { routeFog } = await import('../src/lib/wetter/nebelroute.js');
    const r = routeFog([[0, 400], [20, 650]], 800);
    expect(r).toMatchObject({ startIn: true, aboveKm: null, kmIn: 20, topM: 650 });
    expect(routeFog([[0, 400]], 800)).toBeNull();
    expect(routeFog(route, null)).toBeNull();
    expect(routeFog(null, 800)).toBeNull();
  });
  it('the fog of a trip at its start time; 9 h by default; nothing outside the 3 days or without a place', async () => {
    const { tripFog, startOf } = await import('../src/lib/wetter/nebelroute.js');
    const loader = async () => fog;
    const trip = { startDate: DAY, route: { start: { lat: 47.37, lon: 8.54 } } };
    const f = await tripFog(null, trip, { loader });
    expect(f).toMatchObject({ top: 800, ground: true, clears: 11, old: false });
    expect(f.at).toBe(startOf(DAY, 9, OFF));
    expect((await tripFog(null, trip, { loader, startMs: startOf(DAY, 14, OFF) })).top).toBeNull(); // clear in the afternoon
    expect(await tripFog(null, { ...trip, startDate: '2026-12-24' }, { loader })).toBeNull(); // not in the 3 days
    expect(await tripFog(null, { startDate: DAY }, { loader })).toBeNull(); // no place
    expect(await tripFog(null, trip, { loader: async () => null })).toBeNull();
  });
});
