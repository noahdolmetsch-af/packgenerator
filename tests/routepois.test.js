// «Brunnen und Velo-Werkstätten an der Strecke» (Noah 19.10.2026): the Overpass query, parsing a
// fictional answer, km along the route, sort and dedupe, the cache per trip. Fictional data only; no
// network (the fetcher is a fake).
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import {
  thinLine, buildQuery, kindOf, projectKm, parsePois, lineHash, fetchOverpass, loadPois, readPois, fitsRoute,
  countKinds, osmUrl, cacheKey, OVERPASS_URLS, MAX_PTS, MAX_POIS, AROUND_M,
} from '../src/lib/route/pois.js';
import { distKm } from '../src/lib/route.js';
import de from '../src/lib/i18n/de/routepois.js';
import DE from '../src/lib/i18n/de/index.js';
import { readFileSync } from 'node:fs';

// a straight fictional line going north: 47.0 → 47.1 (≈ 11.1 km), 11 points
const LINE = Array.from({ length: 11 }, (_, i) => [47 + i * 0.01, 7.5]);
const SUM = distKm({ lat: 47, lon: 7.5 }, { lat: 47.1, lon: 7.5 });
const trip = (over = {}) => ({ id: 'test_data_gtp_trip', title: 'test_data_gtp_ Tour', route: { line: LINE, km: 22, ...over } });

// a fictional Overpass answer
const ANSWER = {
  elements: [
    { type: 'node', id: 3, lat: 47.05, lon: 7.501, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Dorfbrunnen' } },
    { type: 'node', id: 1, lat: 47.001, lon: 7.5, tags: { amenity: 'drinking_water' } },
    { type: 'way', id: 7, center: { lat: 47.08, lon: 7.502 }, tags: { shop: 'bicycle', name: 'test_data_gtp_ Velo', opening_hours: 'Mo-Fr 08:00-18:00', 'service:bicycle:pump': 'yes' } },
    { type: 'node', id: 8, lat: 47.08001, lon: 7.50201, tags: { shop: 'bicycle', name: 'test_data_gtp_ Velo' } }, // the same shop as a point
    { type: 'node', id: 9, lat: 47.03, lon: 7.499, tags: { amenity: 'bicycle_repair_station' } },
    { type: 'node', id: 10, lat: 47.09, lon: 7.5, tags: { 'service:bicycle:pump': 'yes' } },
    { type: 'node', id: 11, lat: 47.095, lon: 7.5, tags: { amenity: 'compressed_air' } },
    { type: 'node', id: 3, lat: 47.05, lon: 7.501, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Dorfbrunnen' } }, // twice in the answer
    { type: 'node', id: 12, lat: 47.02, lon: 7.5, tags: { amenity: 'bench' } }, // not asked for
    { type: 'node', id: 13, tags: { amenity: 'drinking_water' } }, // no position
  ],
};
const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status = 504) => ({ ok: false, status, json: async () => ({}) });

describe('query', () => {
  it('thins the line to at most MAX_PTS points, keeping start and end', () => {
    const long = Array.from({ length: 1000 }, (_, i) => [47 + i * 1e-4, 7.5]);
    const t = thinLine(long);
    expect(t.length).toBe(MAX_PTS);
    expect(t[0]).toEqual(long[0]);
    expect(t.at(-1)).toEqual(long.at(-1));
    expect(thinLine(LINE)).toEqual(LINE);
  });
  it('asks every tag with around:250 along the line and gives JSON with centres', () => {
    const q = buildQuery(LINE);
    expect(q.startsWith('[out:json][timeout:25];')).toBe(true);
    for (const tag of ['["amenity"="drinking_water"]', '["shop"="bicycle"]', '["amenity"="bicycle_repair_station"]', '["service:bicycle:pump"="yes"]', '["amenity"="compressed_air"]'])
      expect(q).toContain(tag);
    expect(q).toContain(`nwr(around:${AROUND_M},47,7.5,47.01,7.5,`);
    expect(q.match(/nwr\(around/g)).toHaveLength(5);
    expect(q).toMatch(/out center tags \d+;$/);
    expect(buildQuery([[47, 7]])).toBe('');
    expect(buildQuery(null)).toBe('');
  });
  it('the kind by the tags: a shop with a pump stays a shop', () => {
    expect(kindOf({ amenity: 'drinking_water' })).toBe('water');
    expect(kindOf({ shop: 'bicycle', 'service:bicycle:pump': 'yes' })).toBe('shop');
    expect(kindOf({ 'service:bicycle:pump': 'yes' })).toBe('repair');
    expect(kindOf({ amenity: 'compressed_air' })).toBe('repair');
    expect(kindOf({ amenity: 'bench' })).toBeNull();
  });
});

describe('km along the route', () => {
  it('projects onto the nearest segment, scaled to the route km, with metres beside it', () => {
    const half = projectKm(LINE, 47.05, 7.501);
    expect(half.km).toBeCloseTo(SUM / 2, 1);
    expect(half.off).toBeGreaterThan(60);
    expect(half.off).toBeLessThan(90); // 0.001° east at 47° N ≈ 76 m
    expect(projectKm(LINE, 47.05, 7.5, 22).km).toBeCloseTo(11, 1);
    expect(projectKm(LINE, 46.9, 7.5).km).toBe(0); // before the start: km 0
    expect(projectKm(LINE, 47.2, 7.5, 22).km).toBeCloseTo(22, 1); // after the end: the end
  });
});

describe('parsing the answer', () => {
  it('only asked kinds with a position, sorted by km, each element once, twins within 30 m dropped', () => {
    const list = parsePois(ANSWER, LINE, 22);
    expect(list.map((p) => p.id)).toEqual(['node/1', 'node/9', 'node/3', 'way/7', 'node/10', 'node/11']);
    expect(list.map((p) => p.kind)).toEqual(['water', 'repair', 'water', 'shop', 'repair', 'repair']);
    const shop = list.find((p) => p.id === 'way/7');
    expect(shop).toMatchObject({ name: 'test_data_gtp_ Velo', open: 'Mo-Fr 08:00-18:00', lat: 47.08, lon: 7.502 });
    expect(shop.km).toBeCloseTo(17.6, 0);
    expect(list.find((p) => p.id === 'node/1')).toMatchObject({ name: '', open: '' });
    expect(countKinds(list)).toEqual({ water: 2, shop: 1, repair: 3 });
    expect(osmUrl('node/1')).toBe('https://www.openstreetmap.org/node/1');
  });
  it('at most max, the nearest km first; nothing for a broken answer', () => {
    const many = { elements: Array.from({ length: 400 }, (_, i) => ({ type: 'node', id: i + 1, lat: 47 + (i % 100) * 0.001, lon: 7.5 + Math.floor(i / 100) * 0.0005, tags: { amenity: 'drinking_water' } })) };
    const list = parsePois(many, LINE, 22);
    expect(list).toHaveLength(MAX_POIS);
    expect(list.every((p, i) => !i || list[i - 1].km <= p.km)).toBe(true);
    expect(parsePois(null, LINE)).toEqual([]);
    expect(parsePois({ remark: 'runtime error' }, LINE)).toEqual([]);
  });
});

describe('fetching', () => {
  it('POSTs data= to the main server; on a failure the mirror', async () => {
    const calls = [];
    const fetcher = async (url, init) => {
      calls.push({ url, init });
      return calls.length === 1 ? fail(429) : ok(ANSWER);
    };
    const json = await fetchOverpass('Q [x]', { fetcher });
    expect(json.elements).toHaveLength(ANSWER.elements.length);
    expect(calls.map((c) => c.url)).toEqual(OVERPASS_URLS.slice(0, 2)); // the second server answered, the third is not asked
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe(`data=${encodeURIComponent('Q [x]')}`);
    expect(calls[0].init.headers['Content-Type']).toMatch(/x-www-form-urlencoded/);
  });
  it('throws when both fail or the answer has no elements', async () => {
    await expect(fetchOverpass('Q', { fetcher: async () => fail() })).rejects.toThrow();
    await expect(fetchOverpass('Q', { fetcher: async () => ok({ remark: 'x' }) })).rejects.toThrow();
    await expect(fetchOverpass('Q', { fetcher: async () => { throw new TypeError('offline'); } })).rejects.toThrow();
  });
});

describe('cache per trip', () => {
  it('stores the answer with the line hash; the next call needs no network; force and a new line ask again', async () => {
    const db = createDb(`routepois-${Math.random()}`);
    let n = 0;
    const fetcher = async () => (n++, ok(ANSWER));
    const now = new Date('2026-07-14T08:00:00Z');
    const first = await loadPois(db, trip(), { fetcher, now });
    expect(n).toBe(1);
    expect(first.items).toHaveLength(6);
    expect(first.fetchedAt).toBe(now.toISOString());
    const stored = await readPois(db, trip().id);
    expect(stored.hash).toBe(lineHash(LINE, 22));
    expect(fitsRoute(stored, trip())).toBe(true);
    expect((await db.meta.get(cacheKey(trip().id))).value.items).toHaveLength(6);

    // again: from the cache, even offline
    const offline = async () => { throw new TypeError('offline'); };
    expect((await loadPois(db, trip(), { fetcher: offline })).items).toHaveLength(6);
    // «Neu laden» offline: the stored list with error set
    const again = await loadPois(db, trip(), { fetcher: offline, force: true });
    expect(again.error).toBe(true);
    expect(again.items).toHaveLength(6);
    // force online: asks again
    await loadPois(db, trip(), { fetcher, force: true });
    expect(n).toBe(2);

    // the route changed: the old list does not fit, a new search asks again
    const moved = trip({ line: LINE.map(([a, b]) => [a, b + 0.01]) });
    expect(fitsRoute(stored, moved)).toBe(false);
    const failed = await loadPois(db, moved, { fetcher: offline });
    expect(failed).toEqual({ error: true, items: null });
    await loadPois(db, moved, { fetcher });
    expect(n).toBe(3);
    expect(lineHash(LINE, 22)).not.toBe(lineHash(LINE, 23));
    db.close();
  });
  it('stores at most MAX_POIS and says it cut', async () => {
    const db = createDb(`routepois-${Math.random()}`);
    const many = { elements: Array.from({ length: 350 }, (_, i) => ({ type: 'node', id: i + 1, lat: 47 + (i % 100) * 0.001, lon: 7.5 + Math.floor(i / 100) * 0.0005, tags: { amenity: 'drinking_water' } })) };
    const r = await loadPois(db, trip(), { fetcher: async () => ok(many) });
    expect(r.items).toHaveLength(MAX_POIS);
    expect(r.cut).toBe(true);
    db.close();
  });
});

describe('texts', () => {
  it('every t() text of the card has German, and the index carries them', () => {
    const src = readFileSync(new URL('../src/lib/route/RoutePois.svelte', import.meta.url), 'utf8');
    const keys = [...src.matchAll(/\bt\('([^']+)'/g), ...src.matchAll(/tn\([^,]+, '([^']+)', '([^']+)'/g)].flatMap((m) => m.slice(1));
    expect(keys.length).toBeGreaterThan(15);
    for (const k of keys) expect(DE[k], k).toBeTruthy();
    for (const [k, v] of Object.entries(de)) expect(DE[k], k).toBe(v);
  });
});
