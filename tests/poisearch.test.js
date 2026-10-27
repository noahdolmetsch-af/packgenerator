// «Orte auf der Karte» (Noah 19.10.2026): the pure search rules of src/lib/map/poisearch.js. Fictional
// places only (test_data_gtp_ names), no network: the fetcher is a fake.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as S from '../src/lib/map/poisearch.js';
import { lineHash, OVERPASS_CH, overpassUrls, whyFailed } from '../src/lib/route/pois.js';
import { distKm } from '../src/lib/live/live-lib.js';
import { NO_FILTER } from '../src/lib/map/poifilter.js';

const {
  CATEGORIES,
  CATEGORY,
  KEYS,
  kindOf,
  aroundQuery,
  bboxQuery,
  corridorQuery,
  parsePlaces,
  distanceOf,
  withDistance,
  ptsOf,
  fresh,
  fitting,
  loadPlaces,
  cacheKeyOf,
  prefsOf,
  toggleStar,
  corridorChunks,
  keepAlong,
  keptAlong,
  detourOf,
  heightAt,
  shareText,
  shareOrCopy,
  mergeRoute,
  viewMoved,
  MAX_PLACES,
  DAY_MS,
} = S;

const HERE = { lat: 46.95, lon: 7.45 };
// a straight made-up line going east, about 0.76 km per 0.01° lon at this latitude
const LINE = Array.from({ length: 41 }, (_, i) => [46.95, 7.4 + i * 0.01]);
const el = (id, lat, lon, tags) => ({ type: 'node', id, lat, lon, tags });
const json = (els) => ({ elements: els });
const memStore = () => {
  const m = new Map();
  return { m, get: async (k) => m.get(k), put: async (r) => void m.set(r.key, r) };
};
const okFetch = (answer, calls = []) => async (url, init) => {
  calls.push({ url, body: decodeURIComponent(String(init?.body ?? '').replace(/^data=/, '')) });
  return { ok: true, status: 200, json: async () => answer };
};

describe('categories', () => {
  it('has the 16 promised kinds, each with name, icon and selectors', () => {
    expect(KEYS).toEqual(['water', 'shop', 'food', 'fuel', 'bike', 'repair', 'sleep', 'camp', 'shelter', 'toilet', 'pharmacy', 'hospital', 'atm', 'station', 'laundry', 'view']);
    for (const c of CATEGORIES) {
      expect(c.name, c.key).toBeTruthy();
      expect(c.icon, c.key).toMatch(/^[a-z-]+$/);
      expect(c.tags.length, c.key).toBeGreaterThan(0);
      for (const s of c.tags) expect(S.partsOf(s).length, s).toBeGreaterThan(0);
      expect(c.widthM).toBeGreaterThan(0);
    }
  });
  it('the icon file has a component for every kind', () => {
    const src = readFileSync(new URL('../src/lib/map/poiicons.js', import.meta.url), 'utf8');
    for (const k of KEYS) expect(src, k).toMatch(new RegExp(`\\b${k}: [A-Z]`));
  });
  it('every kind name and sub name has a German entry', async () => {
    // orte-karte.js is imported in de/index.js by the coordinator; read both until then
    const de = { ...(await import('../src/lib/i18n/de/index.js')).default, ...(await import('../src/lib/i18n/de/orte-karte.js')).default };
    for (const c of CATEGORIES) expect(de[c.name], c.name).toBeTruthy();
    for (const k of Object.values(S.SUB_NAMES)) expect(de[k], k).toBeTruthy();
  });
});

describe('kindOf', () => {
  it('finds the kind from the tags', () => {
    expect(kindOf({ amenity: 'drinking_water' })).toBe('water');
    expect(kindOf({ amenity: 'fountain', drinking_water: 'yes' })).toBe('water');
    expect(kindOf({ amenity: 'fountain' })).toBe(null);
    expect(kindOf({ man_made: 'water_tap', drinking_water: 'no' })).toBe(null);
    expect(kindOf({ shop: 'bakery' })).toBe('shop');
    expect(kindOf({ shop: 'bicycle', 'service:bicycle:pump': 'yes' })).toBe('bike');
    expect(kindOf({ amenity: 'bicycle_repair_station' })).toBe('repair');
    expect(kindOf({ tourism: 'camp_site' })).toBe('camp');
    expect(kindOf({ tourism: 'guest_house' })).toBe('sleep');
    expect(kindOf({ amenity: 'toilets' })).toBe('toilet');
    expect(kindOf({ railway: 'halt' })).toBe('station');
    expect(kindOf({ tourism: 'viewpoint' })).toBe('view');
    expect(kindOf({ amenity: 'bank', atm: 'yes' })).toBe('atm');
  });
  it('only among the asked kinds', () => {
    expect(kindOf({ shop: 'bakery' }, ['water'])).toBe(null);
  });
});

describe('queries', () => {
  it('around a point: the radius in metres, only the switched-on kinds', () => {
    const q = aroundQuery(['water', 'toilet'], HERE, 10);
    expect(q).toContain('[out:json][timeout:25]');
    expect(q).toContain('nwr["amenity"="drinking_water"](around:10000,46.95,7.45);');
    expect(q).toContain('nwr["amenity"="toilets"](around:10000,46.95,7.45);');
    expect(q).not.toContain('"shop"');
    expect(aroundQuery([], HERE, 10)).toBe('');
    expect(aroundQuery(['water'], null, 10)).toBe('');
  });
  it('a map area: s,w,n,e; too big gives nothing', () => {
    const b = { s: 46.9, w: 7.4, n: 47.0, e: 7.5 };
    expect(bboxQuery(['fuel'], b)).toContain('nwr["amenity"="fuel"](46.9,7.4,47,7.5);');
    expect(bboxQuery(['fuel'], { s: 46, w: 7, n: 47, e: 8 })).toBe('');
    expect(S.queryOf({ mode: 'here', keys: ['fuel'], bounds: { s: 46, w: 7, n: 47, e: 8 } })).toEqual({ error: 'zoom' });
  });
  it('a corridor: thinned line, each kind with its own width', () => {
    const long = Array.from({ length: 500 }, (_, i) => [46.9, 7 + i * 0.001]);
    const q = corridorQuery(['water', 'bike'], long);
    expect(q).toContain(`(around:${CATEGORY.water.widthM},`);
    expect(q).toContain(`(around:${CATEGORY.bike.widthM},`);
    const coords = q.match(/\(around:\d+,([^)]+)\)/)[1].split(',');
    expect(coords.length / 2).toBe(S.CORRIDOR_PTS);
    expect(corridorQuery(['water'], [[46.9, 7]])).toBe('');
  });
});

describe('parsing', () => {
  const answer = json([
    el(1, 46.951, 7.451, { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen' }),
    el(2, 46.952, 7.452, { shop: 'bakery', name: 'test_data_gtp_ Beck', opening_hours: 'Mo-Sa 07:00-18:00', phone: '+41 00 000 00 00', website: 'example.org' }),
    { type: 'way', id: 3, center: { lat: 46.96, lon: 7.46 }, tags: { tourism: 'camp_site', fee: 'yes', ele: '612.4' } },
    el(4, 46.953, 7.45, { amenity: 'toilets', access: 'private' }),
    el(5, 46.954, 7.45, { amenity: 'parking' }),
    el(1, 46.951, 7.451, { amenity: 'drinking_water' }),
    el(6, 46.95201, 7.45201, { shop: 'bakery', name: 'test_data_gtp_ Beck' }),
  ]);
  it('gives the fields, drops private, unknown and doubles', () => {
    const { list, cut } = parsePlaces(answer, KEYS);
    expect(cut).toBe(false);
    expect(list.map((p) => p.id).sort()).toEqual(['node/1', 'node/2', 'way/3']);
    const beck = list.find((p) => p.id === 'node/2');
    expect(beck).toMatchObject({ kind: 'shop', name: 'test_data_gtp_ Beck', hours: 'Mo-Sa 07:00-18:00', phone: '+41 00 000 00 00', website: 'example.org', sub: 'bakery', fee: '', access: '' });
    expect(list.find((p) => p.id === 'way/3')).toMatchObject({ kind: 'camp', lat: 46.96, lon: 7.46, fee: 'yes', ele: 612, name: '' });
  });
  it('keeps at most max places, the nearest', () => {
    const many = json(Array.from({ length: 450 }, (_, i) => el(i + 10, 46.95 + i * 0.001, 7.45, { amenity: 'drinking_water' })));
    const { list, cut } = parsePlaces(many, KEYS, { near: (p) => distKm(HERE, p) });
    expect(list).toHaveLength(MAX_PLACES);
    expect(cut).toBe(true);
    expect(list[0].id).toBe('node/10');
    expect(list.some((p) => p.id === 'node/459')).toBe(false);
  });
});

describe('distances', () => {
  it('straight line without a route', () => {
    const d = distanceOf({ lat: 46.95, lon: 7.46 }, HERE);
    expect(d.km).toBeCloseTo(0.76, 1);
    expect(d.along).toBe(null);
  });
  it('along the route, ahead and behind', () => {
    const pts = ptsOf(LINE);
    const me = { lat: 46.95, lon: 7.5 };
    const ahead = distanceOf({ lat: 46.951, lon: 7.55 }, me, pts);
    const behind = distanceOf({ lat: 46.95, lon: 7.45 }, me, pts);
    expect(ahead.along).toBeGreaterThan(3.5);
    expect(ahead.offKm).toBeCloseTo(0.11, 1);
    expect(behind.along).toBeLessThan(0);
    const sorted = withDistance([{ id: 'b', lat: 46.95, lon: 7.45 }, { id: 'a', lat: 46.95, lon: 7.6 }, { id: 'c', lat: 46.95, lon: 7.52 }], me, LINE);
    expect(sorted.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('cache rules', () => {
  const now = Date.parse('2026-10-19T12:00:00Z');
  const rec = { at: now - 3600e3, keys: ['water', 'shop'], list: [], center: HERE, radiusKm: 10 };
  it('around: 24 h, same kinds, radius, moved less than a quarter', () => {
    const q = { mode: 'around', keys: ['water'], center: HERE, radiusKm: 10 };
    expect(fresh(rec, q, now)).toBe(true);
    expect(fresh(rec, { ...q, keys: ['fuel'] }, now)).toBe(false);
    expect(fresh(rec, { ...q, radiusKm: 20 }, now)).toBe(false);
    expect(fresh(rec, { ...q, radiusKm: 5 }, now)).toBe(true);
    expect(fresh(rec, { ...q, center: { lat: 46.95, lon: 7.48 } }, now)).toBe(true); // ~2.3 km < 2.5
    expect(fresh(rec, { ...q, center: { lat: 46.95, lon: 7.5 } }, now)).toBe(false); // ~3.8 km
    expect(fresh({ ...rec, at: now - DAY_MS - 1 }, q, now)).toBe(false);
    expect(fresh({ ...rec, at: now - DAY_MS - 1 }, q, now, { stale: true })).toBe(true);
  });
  it('here: 24 h and the area inside the kept one', () => {
    const r = { at: now, keys: ['fuel'], list: [], bounds: { s: 46.9, w: 7.4, n: 47, e: 7.5 } };
    expect(fresh(r, { mode: 'here', keys: ['fuel'], bounds: { s: 46.92, w: 7.42, n: 46.98, e: 7.48 } }, now)).toBe(true);
    expect(fresh(r, { mode: 'here', keys: ['fuel'], bounds: { s: 46.92, w: 7.42, n: 47.1, e: 7.48 } }, now)).toBe(false);
    expect(viewMoved(r.bounds, { s: 46.92, w: 7.42, n: 46.98, e: 7.48 })).toBe(false);
    expect(viewMoved(r.bounds, { s: 47.1, w: 7.42, n: 47.2, e: 7.48 })).toBe(true);
    // a tiny shift after a resize does not count as moved
    expect(viewMoved({ s: 46.9, w: 7.4, n: 47.0, e: 7.5 }, { s: 46.9001, w: 7.4, n: 47.0001, e: 7.5 })).toBe(false);
    expect(viewMoved(null, { s: 46.9, w: 7.4, n: 47.0, e: 7.5 })).toBe(true);
  });
  it('route: kept until reloaded, any age, same line', () => {
    const r = { at: now - 400 * DAY_MS, keys: KEYS, list: [], hash: lineHash(LINE) };
    expect(fresh(r, { mode: 'route', keys: ['water'], line: LINE }, now)).toBe(true);
    expect(fresh(r, { mode: 'route', keys: ['water'], line: LINE.slice(1) }, now)).toBe(false);
  });
  it('fitting: the asked kinds within the radius', () => {
    const r = { list: [{ id: 'a', kind: 'water', lat: 46.95, lon: 7.45 }, { id: 'b', kind: 'shop', lat: 46.95, lon: 7.45 }, { id: 'c', kind: 'water', lat: 47.2, lon: 7.45 }] };
    expect(fitting(r, { mode: 'around', keys: ['water'], center: HERE, radiusKm: 10 }).map((p) => p.id)).toEqual(['a']);
  });
  it('the keys of the store', () => {
    expect(cacheKeyOf('around')).toBe('poi-search:around');
    expect(cacheKeyOf('route', 't1')).toBe('poi-search:route:t1');
  });
});

describe('loadPlaces', () => {
  const now = Date.parse('2026-10-19T12:00:00Z');
  const answer = json([el(1, 46.951, 7.451, { amenity: 'drinking_water' }), el(2, 46.952, 7.452, { shop: 'bakery' })]);
  it('asks once, keeps the answer, reuses it', async () => {
    const store = memStore();
    const calls = [];
    const q = { mode: 'around', keys: ['water', 'shop'], center: HERE, radiusKm: 5 };
    const a = await loadPlaces(q, { store, fetcher: okFetch(answer, calls), now });
    expect(a.list).toHaveLength(2);
    expect(a.cached).toBe(false);
    expect(calls).toHaveLength(1);
    expect(store.m.get('poi-search:around').value).toMatchObject({ at: now, keys: ['water', 'shop'], radiusKm: 5 });
    const b = await loadPlaces({ ...q, keys: ['water'] }, { store, fetcher: okFetch(answer, calls), now: now + 1000 });
    expect(b.cached).toBe(true);
    expect(b.list.map((p) => p.kind)).toEqual(['water']);
    expect(calls).toHaveLength(1);
  });
  it('tries the second mirror, then says busy and shows the kept answer', async () => {
    const store = memStore();
    const urls = [];
    const fetcher = async (url) => {
      urls.push(url);
      return { ok: false, status: 429 };
    };
    const q = { mode: 'around', keys: ['water'], center: HERE, radiusKm: 5 };
    const r = await loadPlaces(q, { store, fetcher, now });
    expect(urls).toEqual([OVERPASS_CH, ...S.OVERPASS_URLS]); // in Switzerland the Swiss server first
    expect(r).toMatchObject({ error: 'busy', list: [] });
    await store.put({ key: 'poi-search:around', value: { at: now - 2 * DAY_MS, keys: ['water'], list: [{ id: 'node/1', kind: 'water', lat: 46.95, lon: 7.45 }], center: HERE, radiusKm: 5 } });
    const old = await loadPlaces(q, { store, fetcher, now });
    expect(old).toMatchObject({ error: 'busy', stale: true });
    expect(old.list).toHaveLength(1);
    const off = await loadPlaces(q, { store, fetcher, now, online: false });
    expect(off).toMatchObject({ error: 'offline', stale: true });
  });
  it('along the route: a new kind is added to the kept ones', async () => {
    const store = memStore();
    await store.put({ key: cacheKeyOf('route', 't1'), value: { at: now, keys: ['water'], list: [{ id: 'node/9', kind: 'water', lat: 46.95, lon: 7.45 }], hash: lineHash(LINE) } });
    const r = await loadPlaces({ mode: 'route', keys: ['shop'], line: LINE, tripId: 't1' }, { store, fetcher: okFetch(answer), now });
    expect(r.list.map((p) => p.id)).toEqual(['node/2']);
    const kept = store.m.get(cacheKeyOf('route', 't1')).value;
    expect(kept.keys).toEqual(['water', 'shop']);
    expect(kept.list.map((p) => p.id).sort()).toEqual(['node/2', 'node/9']);
    expect(mergeRoute({ keys: ['water'], list: [] }, { keys: ['water'], list: [], cut: true }).cut).toBe(true);
  });
});

describe('prefs and stars', () => {
  it('cleans the record', () => {
    // «Weitere Quellen» 20.10.2026: the record also has the chip row, your names and your own kinds; any radius of 1–50 km
    expect(prefsOf(null)).toEqual({ on: [], mode: 'around', radiusKm: 10, starred: [], row: KEYS, names: {}, own: [], filter: { ...NO_FILTER }, presets: [], visited: [] });
    expect(prefsOf({ on: ['water', 'nope', 'water'], mode: 'x', radiusKm: 70 })).toEqual({ on: ['water'], mode: 'around', radiusKm: 10, starred: [], row: KEYS, names: {}, own: [], filter: { ...NO_FILTER }, presets: [], visited: [] });
    expect(prefsOf({ radiusKm: 7 }).radiusKm).toBe(7);
  });
  it('stars and unstars a place', () => {
    const p = { id: 'node/1', kind: 'water', name: 'test_data_gtp_ Brunnen', lat: 46.95, lon: 7.45, hours: '', sub: 'drinking_water' };
    const a = toggleStar({}, p);
    expect(a.starred).toEqual([{ id: 'node/1', kind: 'water', name: 'test_data_gtp_ Brunnen', lat: 46.95, lon: 7.45, sub: 'drinking_water' }]);
    expect(toggleStar(a, p).starred).toEqual([]);
  });
});

describe('1a · along the route in chunks', () => {
  it('cuts the thinned line into overlapping chunks', () => {
    const long = Array.from({ length: 1000 }, (_, i) => [46.9, 7 + i * 0.001]);
    const ch = corridorChunks(long, { size: 30, total: 240 });
    expect(ch.length).toBe(Math.ceil(239 / 29));
    for (let i = 1; i < ch.length; i++) expect(ch[i][0]).toEqual(ch[i - 1].at(-1));
    expect(ch.every((c) => c.length >= 2 && c.length <= 30)).toBe(true);
    expect(ch.flat().length - (ch.length - 1)).toBe(240);
    expect(corridorChunks([[46.9, 7]])).toEqual([]);
  });
  it('keeps all kinds along the route with a pause between chunks; a failed chunk is skipped', async () => {
    const store = memStore();
    const waits = [];
    let n = 0;
    const fetcher = async (url, init) => {
      n++;
      if (n >= 3 && n < 3 + S.OVERPASS_URLS.length) return { ok: false, status: 504 }; // chunk 2: every server fails
      const k = n;
      return { ok: true, json: async () => json([el(k, 46.95, 7.4 + k * 0.01, { amenity: 'drinking_water' }), el(100, 46.95, 7.45, { shop: 'bakery' })]) };
    };
    const long = Array.from({ length: 100 }, (_, i) => [46.95, 7.4 + i * 0.004]);
    const r = await keepAlong(long, 't1', { store, fetcher, wait: async (ms) => void waits.push(ms), now: 5 });
    const chunks = corridorChunks(long).length;
    expect(r.chunks).toBe(chunks);
    expect(r.failed).toBe(1);
    expect(waits).toEqual(Array(chunks - 1).fill(S.CHUNK_PAUSE_MS));
    const kept = store.m.get(cacheKeyOf('route', 't1')).value;
    expect(kept.keys).toEqual(KEYS);
    expect(kept.hash).toBe(lineHash(long));
    expect(kept.list.filter((p) => p.id === 'node/100')).toHaveLength(1);
    expect(r.count).toBe(kept.list.length);
    expect(await keptAlong(store, 't1', long)).toBe(kept.list.length);
    expect(await keptAlong(store, 't1', LINE)).toBe(0);
    // afterwards «Along the route» is served from the store, any kind, offline
    const off = await loadPlaces({ mode: 'route', keys: ['shop'], line: long, tripId: 't1' }, { store, online: false });
    expect(off).toMatchObject({ cached: true, error: null });
    expect(off.list.map((p) => p.id)).toEqual(['node/100']);
  });
});

describe('3a · detour', () => {
  const pts = ptsOf(LINE);
  it('there and back from the nearest route point', () => {
    const p = { lat: 46.96, lon: 7.5 }; // ~1.11 km north of the line
    const d = detourOf(p, pts);
    expect(d.km).toBeCloseTo(2.2, 1);
    expect(d.hm).toBe(0);
    expect(d.atKm).toBeCloseTo(7.6, 0);
    expect(detourOf(p, [])).toBe(null);
  });
  it('the climb when OSM knows the height and the route has a profile', () => {
    const profile = [[0, 500], [10, 600], [30, 600]];
    expect(heightAt(profile, 5)).toBe(550);
    expect(heightAt(profile, 50)).toBe(600);
    expect(detourOf({ lat: 46.96, lon: 7.5, ele: 700 }, pts, profile).hm).toBe(124);
    expect(detourOf({ lat: 46.96, lon: 7.5, ele: 400 }, pts, profile).hm).toBe(0);
  });
});

describe('5a · share', () => {
  it('a text with names and map links', () => {
    const text = shareText([{ name: 'test_data_gtp_ Brunnen', kind: 'water', lat: 46.95, lon: 7.45 }, { name: '', kind: 'toilet', lat: 46.96, lon: 7.46 }], (p) => p.kind, 'My places');
    expect(text).toBe('My places\n\ntest_data_gtp_ Brunnen (water)\nhttps://www.google.com/maps/search/?api=1&query=46.95000,7.45000\n\ntoilet\nhttps://www.google.com/maps/search/?api=1&query=46.96000,7.46000');
  });
  it('shares, or copies when the phone cannot share', async () => {
    const shared = [];
    expect(await shareOrCopy({ text: 'x' }, { share: async (d) => void shared.push(d) })).toBe('shared');
    expect(shared).toEqual([{ title: '', text: 'x' }]);
    const copied = [];
    expect(await shareOrCopy({ text: 'y' }, { clipboard: { writeText: async (s) => void copied.push(s) } })).toBe('copied');
    expect(copied).toEqual(['y']);
    expect(await shareOrCopy({ text: 'z' }, { share: async () => { throw Object.assign(new Error('no'), { name: 'AbortError' }); } })).toBe('cancelled');
    expect(await shareOrCopy({ text: 'z' }, {})).toBe('failed');
  });
});

describe('«Weitere Quellen» · own radius', () => {
  it('1 to 50 km, whole or half, also typed with a comma', () => {
    expect(S.radiusOf(7)).toBe(7);
    expect(S.radiusOf('7,5')).toBe(7.5);
    expect(S.radiusOf(' 12.3 ')).toBe(12.5);
    expect(S.radiusOf(1)).toBe(1);
    expect(S.radiusOf(50)).toBe(50);
    for (const bad of [0, 0.5, 51, -3, 'x', '', null, undefined, NaN]) expect(S.radiusOf(bad), String(bad)).toBe(null);
    expect(prefsOf({ radiusKm: 33.5 }).radiusKm).toBe(33.5);
    expect(prefsOf({ radiusKm: 0.2 }).radiusKm).toBe(10);
  });
  it('an own radius: the query in metres, a kept bigger answer is reused', async () => {
    expect(aroundQuery(['water'], HERE, 7.5)).toContain('(around:7500,46.95,7.45)');
    const now = 1_800_000_000_000;
    const store = memStore();
    const calls = [];
    const answer = json([el(1, 46.951, 7.451, { amenity: 'drinking_water' }), el(2, 46.95, 7.55, { amenity: 'drinking_water' })]);
    const q = { mode: 'around', keys: ['water'], center: HERE, radiusKm: 15 };
    const a = await loadPlaces(q, { store, fetcher: okFetch(answer, calls), now });
    expect(a.list).toHaveLength(2);
    const b = await loadPlaces({ ...q, radiusKm: 3.5 }, { store, fetcher: okFetch(answer, calls), now: now + 1000 });
    expect(b.cached).toBe(true);
    expect(b.list.map((p) => p.id)).toEqual(['node/1']);
    expect(calls).toHaveLength(1);
    await loadPlaces({ ...q, radiusKm: 22.5 }, { store, fetcher: okFetch(answer, calls), now: now + 2000 });
    expect(calls).toHaveLength(2);
  });
});

describe('«Weitere Quellen» · more kinds', () => {
  it('each more kind has name, icon, selectors, a German name, an icon component and a map symbol', async () => {
    const de = (await import('../src/lib/i18n/de/index.js')).default;
    const icons = readFileSync(new URL('../src/lib/map/poiicons.js', import.meta.url), 'utf8');
    const { KIND_ICON, SEARCH_KINDS } = await import('../src/lib/map/symbols.js');
    expect(S.MORE.length).toBeGreaterThanOrEqual(15);
    for (const c of S.MORE) {
      expect(KEYS).not.toContain(c.key);
      expect(de[c.name], c.name).toBeTruthy();
      expect(icons, c.key).toMatch(new RegExp(`\\b${c.key}: [A-Z]`));
      expect(KIND_ICON[c.key], c.key).toBe(c.icon);
      expect(SEARCH_KINDS).toContain(c.key);
      for (const sel of c.tags) expect(S.checkSelector(sel).sel, sel).toBe(sel);
    }
    expect(new Set(S.ALL_KEYS).size).toBe(S.ALL_KEYS.length);
  });
  it('the more specific kind wins, and a kept answer still gives the general kind', () => {
    expect(kindOf({ shop: 'bakery' }, ['shop', 'bakery'])).toBe('bakery');
    expect(kindOf({ amenity: 'bench' }, S.ALL_KEYS)).toBe('bench');
    expect(kindOf({ amenity: 'charging_station', bicycle: 'yes' }, ['charge'])).toBe('charge');
    expect(kindOf({ amenity: 'charging_station' }, ['charge'])).toBe(null);
    const { list } = parsePlaces(json([el(1, 46.95, 7.45, { shop: 'bakery' })]), ['shop', 'bakery']);
    expect(list[0]).toMatchObject({ kind: 'bakery', also: ['shop'] });
    const rec = { at: 1, keys: ['shop', 'bakery'], list, center: HERE, radiusKm: 10 };
    expect(fitting(rec, { mode: 'around', keys: ['shop'], center: HERE, radiusKm: 10 })[0].kind).toBe('shop');
  });
});

describe('«Weitere Quellen» · OpenStreetMap tags typed by you', () => {
  it('takes the four allowed forms (and plain key=value)', () => {
    expect(S.checkSelector('["amenity"="bench"]')).toEqual({ sel: '["amenity"="bench"]' });
    expect(S.checkSelector(' [ "cuisine" ~ "pizza|pasta" ] ')).toEqual({ sel: '["cuisine"~"pizza|pasta"]' });
    expect(S.checkSelector('["amenity"="bench"]["backrest"!="no"]')).toEqual({ sel: '["amenity"="bench"]["backrest"!="no"]' });
    expect(S.checkSelector('["wheelchair"]')).toEqual({ sel: '["wheelchair"]' });
    expect(S.checkSelector('amenity=bench')).toEqual({ sel: '["amenity"="bench"]' });
    expect(S.checkSelector('service:bicycle:pump = yes')).toEqual({ sel: '["service:bicycle:pump"="yes"]' });
    expect(S.checkSelector('amenity')).toEqual({ sel: '["amenity"]' });
  });
  it('refuses anything else, so nothing else reaches Overpass', () => {
    const bad = {
      '': 'empty',
      '["amenity"="bench"](around:99999,0,0);out;': 'form',
      '["amenity"="bench"];node(1)': 'form',
      '["amenity"="be"nch"]': 'form',
      '["amenity"="be\\"nch"]': 'form',
      '["am enity"="bench"]': 'key',
      '["amenity"=""]': 'value',
      '["name"~"("]': 'regex',
      '["fee"!="yes"]': 'positive',
      'amenity="bench"]': 'value',
      '["a"="1"]["b"="2"]["c"="3"]["d"="4"]["e"="5"]': 'long',
      '[out:json];': 'form',
      'nwr["amenity"="bench"]': 'form',
      'amenity=bench\\': 'value',
    };
    for (const [line, error] of Object.entries(bad)) expect(S.checkSelector(line), line).toEqual({ error });
  });
  it('several lines: errors with their line, at most MAX_SELECTORS', () => {
    expect(S.checkSelectors('["amenity"="bench"]\n\nleisure=picnic_table\n["x"=]')).toEqual({ tags: ['["amenity"="bench"]', '["leisure"="picnic_table"]'], errors: [{ line: 4, error: 'form' }] });
    expect(S.checkSelectors('  ').errors).toEqual([{ line: 0, error: 'none' }]);
    const many = Array.from({ length: S.MAX_SELECTORS + 1 }, (_, i) => `["k${i}"="v"]`).join('\n');
    expect(S.checkSelectors(many).errors).toEqual([{ line: 0, error: 'many' }]);
  });
  it('an own kind: name, icon, tags; queried, matched and kept with its tags', async () => {
    expect(S.newOwnCat({ name: '', text: 'amenity=bench' }).errors).toEqual([{ line: 0, error: 'name' }]);
    const { cat } = S.newOwnCat({ name: 'test_data_gtp_ Bänke', icon: 'bench', text: '["amenity"="bench"]\n["leisure"="picnic_table"]' }, () => 0.123456);
    expect(cat).toMatchObject({ name: 'test_data_gtp_ Bänke', icon: 'bench', tags: ['["amenity"="bench"]', '["leisure"="picnic_table"]'], own: true });
    expect(cat.key).toMatch(/^my-[a-z0-9]{2,16}$/);
    expect(S.ownCatOf({ ...cat, icon: 'nope' }).icon).toBe(S.OWN_ICONS[0]);
    expect(S.ownCatOf({ ...cat, tags: ['out;'] })).toBe(null);
    expect(S.ownCatOf({ ...cat, key: 'water' })).toBe(null);
    const own = [cat];
    const q = aroundQuery([cat.key, 'water'], HERE, 5, own);
    expect(q).toContain('nwr["amenity"="bench"](around:5000,46.95,7.45);');
    expect(q).toContain('nwr["leisure"="picnic_table"](around:5000,46.95,7.45);');
    expect(q).toContain('"drinking_water"');
    expect(kindOf({ amenity: 'bench' }, [cat.key], own)).toBe(cat.key);
    // kept: a change of its tags asks again
    const store = memStore();
    const calls = [];
    const answer = json([el(5, 46.951, 7.451, { amenity: 'bench' })]);
    const base = { mode: 'around', keys: [cat.key], own, center: HERE, radiusKm: 5 };
    const a = await loadPlaces(base, { store, fetcher: okFetch(answer, calls), now: 10 });
    expect(a.list.map((p) => [p.id, p.kind])).toEqual([['node/5', cat.key]]);
    await loadPlaces(base, { store, fetcher: okFetch(answer, calls), now: 20 });
    expect(calls).toHaveLength(1);
    const changed = [{ ...cat, tags: ['["amenity"="bench"]["backrest"="yes"]'] }];
    await loadPlaces({ ...base, own: changed }, { store, fetcher: okFetch(answer, calls), now: 30 });
    expect(calls).toHaveLength(2);
    expect(calls[1].body).toContain('["backrest"="yes"]');
  });
  it('the chip row: sort, rename, take out, put back, own kinds in and out', () => {
    let p = prefsOf({ on: ['water', 'shop'] });
    p = S.moveChip(p, 0, 2);
    expect(p.row.slice(0, 3)).toEqual(['shop', 'food', 'water']);
    expect(S.moveChip(p, 0, 99)).toEqual(p);
    p = S.renameChip(p, 'water', 'test_data_gtp_ Brünneli', 'Wasser');
    expect(p.names).toEqual({ water: 'test_data_gtp_ Brünneli' });
    expect(S.renameChip(p, 'water', 'Wasser', 'Wasser').names).toEqual({});
    p = S.hideChip(p, 'water');
    expect(p.row).not.toContain('water');
    expect(p.on).toEqual(['shop']);
    expect(prefsOf({ ...p, on: ['water', 'shop'] }).on).toEqual(['shop']); // only kinds in the row are on
    p = S.showChip(p, 'bench');
    expect(p.row.at(-1)).toBe('bench');
    expect(S.showChip(p, 'nope')).toEqual(prefsOf(p));
    const { cat } = S.newOwnCat({ name: 'test_data_gtp_ Glace', icon: 'food', text: 'amenity=ice_cream' });
    p = S.putOwnCat(p, cat);
    expect(p.own.map((c) => c.key)).toEqual([cat.key]);
    expect(p.row.at(-1)).toBe(cat.key);
    expect(p.on).toContain(cat.key);
    p = S.renameChip(p, cat.key, 'test_data_gtp_ Gelati');
    expect(p.own[0].name).toBe('test_data_gtp_ Gelati');
    expect(p.names[cat.key]).toBeUndefined();
    p = S.putOwnCat(p, { ...p.own[0], tags: ['["shop"="ice_cream"]'] });
    expect(p.own[0].tags).toEqual(['["shop"="ice_cream"]']);
    p = S.removeOwnCat(p, cat.key);
    expect(p.own).toEqual([]);
    expect(p.row).not.toContain(cat.key);
    expect(p.on).not.toContain(cat.key);
    // the record survives a round trip
    expect(prefsOf(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
  it('a starred place of an own kind keeps the name of the kind', () => {
    const s = S.starOf({ id: 'node/5', kind: 'bench', name: '', lat: 46.95, lon: 7.45, sub: 'bench', catName: 'test_data_gtp_ Bänke' });
    expect(s).toEqual({ id: 'node/5', kind: 'bench', name: '', lat: 46.95, lon: 7.45, sub: 'bench', catName: 'test_data_gtp_ Bänke' });
  });
});

describe('Live Navigation PR 2: servers and the true reason', () => {
  it('asks the Swiss server first only for a search in Switzerland', () => {
    expect(overpassUrls([{ lat: 46.95, lon: 7.45 }])[0]).toBe(OVERPASS_CH);
    expect(overpassUrls([{ lat: 46.95, lon: 7.45 }, { lat: 48.5, lon: 7.7 }])).toEqual(S.OVERPASS_URLS);
    expect(overpassUrls([])).toEqual(S.OVERPASS_URLS);
    expect(S.OVERPASS_URLS.length).toBeGreaterThanOrEqual(3);
  });
  it('tells busy, unreachable and other errors apart', () => {
    expect(whyFailed([new Error('overpass 504'), new TypeError('Failed to fetch')])).toBe('busy');
    expect(whyFailed([new TypeError('Failed to fetch'), new TypeError('Failed to fetch')])).toBe('net');
    expect(whyFailed([new Error('overpass 400')])).toBe('failed');
    expect(S.errorOf(new Error('x'), false)).toBe('offline');
    expect(S.errorOf(Object.assign(new Error('x'), { why: 'net' }), true)).toBe('net');
  });
  it('a search where no server is reachable says so, not «busy»', async () => {
    const fetcher = async () => {
      throw new TypeError('Failed to fetch');
    };
    const r = await loadPlaces({ mode: 'around', keys: ['water'], center: HERE, radiusKm: 5 }, { store: memStore(), fetcher, now: 1 });
    expect(r.error).toBe('net');
  });
});
