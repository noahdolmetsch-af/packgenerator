// Paket X «Umweg neu planen» (Noah 20.10.2026): reroute.js and the GPX writer gpxout.js, with made-up places.
import { describe, it, expect, beforeEach } from 'vitest';
import { brouterUrl, parseBrouter, rejoinOf, snapAhead, targetsOf, planDetour, planAlternatives, onDetour, detourDone, detourGpx, saveDetour, loadDetour, DETOUR_KEY, PROFILE_STD, clearRouterCache, ROUTER_TUNING } from '../src/lib/reroute.js';

beforeEach(() => {
  clearRouterCache();
  ROUTER_TUNING.retryMs = 0;
});
import { gpxString, wptName, gpxFileName, WPT_NAME_MAX } from '../src/lib/gpxout.js';

// a straight made-up route east along 47° N, about 0.76 km per 0.01°
const pts = Array.from({ length: 41 }, (_, i) => ({ lat: 47, lon: 8 + i * 0.01 }));
let k = 0;
pts.forEach((p, i) => {
  if (i) k += 0.7585;
  p.km = Math.round(k * 1000) / 1000;
});
const total = pts.at(-1).km;

const geo = (coords, props = {}) => ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords } }] });

describe('brouter', () => {
  it('builds the address with lon,lat pairs and a known profile', () => {
    const u = brouterUrl([{ lat: 47.1, lon: 8.2 }, { lat: 47.2, lon: 8.3 }], 'fastbike');
    expect(u).toContain('lonlats=8.20000,47.10000|8.30000,47.20000');
    expect(u).toContain('profile=fastbike');
    expect(u).toContain('format=geojson');
    expect(brouterUrl([{ lat: 1, lon: 2 }], 'nonsense')).toContain(`profile=${PROFILE_STD}`);
  });
  it('reads the line, km, climb and time', () => {
    const r = parseBrouter(geo([[8, 47, 400], [8.01, 47.01, 420]], { 'track-length': '1534', 'filtered ascend': '22', 'total-time': '300' }));
    expect(r.line).toEqual([[47, 8, 400], [47.01, 8.01, 420]]);
    expect(r.km).toBe(1.5);
    expect(r.gainM).toBe(22);
    expect(r.min).toBe(5);
  });
  it('works out km itself and says null for nothing', () => {
    expect(parseBrouter(geo([[8, 47], [8.01, 47]])).km).toBeGreaterThan(0.7);
    expect(parseBrouter({})).toBeNull();
    expect(parseBrouter(geo([[8, 47]]))).toBeNull();
  });
});

describe('back onto the route', () => {
  it('rejoins 1 km after the place, never behind you', () => {
    const shop = { lat: 47.003, lon: 8.1 }; // beside km ≈ 7.6
    const r = rejoinOf(pts, shop, 2);
    expect(r.km).toBeGreaterThan(8.3);
    expect(r.km).toBeLessThan(8.9);
    const behind = rejoinOf(pts, { lat: 47.003, lon: 8.02 }, 10);
    expect(behind.km).toBe(11);
  });
  it('has no rejoin past the end or without a route', () => {
    expect(rejoinOf(pts, { lat: 47, lon: 8.4 }, 1)).toBeNull();
    expect(rejoinOf([], { lat: 47, lon: 8 }, 0)).toBeNull();
  });
  it('a round tour does not snap back to the start', () => {
    const loop = [...pts, ...pts.slice(0, -1).reverse().map((p) => ({ lat: p.lat + 0.0001, lon: p.lon, km: 2 * total - p.km }))];
    const s = snapAhead(loop, { lat: 47.0002, lon: 8.05 }, total + 5);
    expect(s.km).toBeGreaterThan(total);
  });
});

describe('places to offer', () => {
  const here = { lat: 47, lon: 8.1 };
  const pois = [
    { id: 'a', kind: 'shop', name: 'Laden A', lat: 47.001, lon: 8.11 },
    { id: 'b', kind: 'shop', name: 'Laden B', lat: 47.001, lon: 8.12 },
    { id: 'c', kind: 'shop', name: 'Laden C', lat: 47.001, lon: 8.13 },
    { id: 'd', kind: 'shop', name: 'Laden D', lat: 47.001, lon: 8.14 },
    { id: 'e', kind: 'sleep', name: 'Hotel E', lat: 47.01, lon: 8.1 },
    { id: 'f', kind: 'laundry', name: 'Wäscherei', lat: 47.0, lon: 8.101 },
    { id: 'g', kind: 'station', name: 'Bahnhof weit', lat: 48.5, lon: 8.1 },
  ];
  it('the nearest 3 per kind, kinds in order, own points after', () => {
    const l = targetsOf({ pois, own: [{ id: 'o1', lat: 47.002, lon: 8.1, name: 'Mein Punkt' }], here });
    expect(l.map((p) => p.id)).toEqual(['a', 'b', 'c', 'e', 'o1']);
    expect(l.at(-1).kind).toBe('own');
    expect(l[0].distKm).toBeGreaterThan(0);
  });
  it('nothing without a position', () => expect(targetsOf({ pois })).toEqual([]));
});

describe('planDetour', () => {
  const answer = geo([[8.1, 47], [8.1, 47.003], [8.12, 47]], { 'track-length': '3000', 'filtered ascend': '15', 'total-time': '600' });
  it('asks once with here, the place and the rejoin, and gives the extra km', async () => {
    const urls = [];
    const d = await planDetour({ here: { lat: 47, lon: 8.1 }, target: { lat: 47.003, lon: 8.1, name: 'Laden', kind: 'shop' }, pts, fromKm: 7.6, fetcher: async (u) => (urls.push(u), { ok: true, status: 200, json: async () => answer }), now: 5 });
    expect(urls).toHaveLength(1);
    expect(urls[0].split('lonlats=')[1].split('&')[0].split('|')).toHaveLength(3);
    expect(d.km).toBe(3);
    expect(d.rejoin.km).toBeGreaterThan(8);
    expect(d.extraKm).toBeCloseTo(3 - (d.rejoin.km - 7.6), 1);
    expect(d.target).toMatchObject({ name: 'Laden', kind: 'shop' });
    expect(d.at).toBe(5);
  });
  it('only there (Noah «2a»): here → place, no rejoin; done once you were there and are back on the route', async () => {
    const urls = [];
    const d = await planDetour({ here: { lat: 47, lon: 8.1 }, target: { lat: 47.003, lon: 8.1, name: 'Laden', kind: 'shop' }, pts, fromKm: 7.6, oneWay: true, fetcher: async (u) => (urls.push(u), { ok: true, status: 200, json: async () => answer }) });
    expect(urls[0].split('lonlats=')[1].split('&')[0].split('|')).toHaveLength(2);
    expect(d).toMatchObject({ oneWay: true, rejoin: null, fromKm: 7.6, extraKm: null });
    const far = { lat: 47, lon: 8.1 };
    // not yet at the place: never done, even on the route
    expect(detourDone(d, { km: 7.6, here: far, offM: 5 })).toBe(false);
    // at the place: not done (the app asks how you go back)
    expect(detourDone({ ...d, reached: true }, { km: 7.9, here: d.target, offM: 300 })).toBe(false);
    // back on the route away from the place: done
    expect(detourDone({ ...d, reached: true }, { km: 7.7, here: far, offM: 10 })).toBe(true);
  });
  it('without a route: here → place only', async () => {
    const d = await planDetour({ here: { lat: 47, lon: 8.1 }, target: { lat: 47.003, lon: 8.1 }, fetcher: async (u) => ({ ok: true, status: 200, json: async () => (expect(u.split('lonlats=')[1].split('&')[0].split('|')).toHaveLength(2), answer) }) });
    expect(d.rejoin).toBeNull();
    expect(d.extraKm).toBeNull();
  });
  it('says busy, noroute or failed', async () => {
    const t = { lat: 47.003, lon: 8.1 };
    const h = { lat: 47, lon: 8.1 };
    await expect(planDetour({ here: h, target: t, fetcher: async () => ({ ok: false, status: 429 }) })).rejects.toThrow('busy');
    await expect(planDetour({ here: h, target: t, fetcher: async () => ({ ok: false, status: 400 }) })).rejects.toThrow('noroute');
    await expect(planDetour({ here: h, target: t, fetcher: async () => ({ ok: true, status: 200, json: async () => ({}) }) })).rejects.toThrow('noroute');
    await expect(planDetour({ here: h, target: t, fetcher: async () => Promise.reject(new Error('net')) })).rejects.toThrow('failed');
  });
});

describe('on the detour', () => {
  const d = { line: [[47, 8.1], [47.003, 8.1], [47, 8.12]], target: { lat: 47.003, lon: 8.1, name: 'Laden', kind: 'shop' }, rejoin: { km: 9, lat: 47, lon: 8.118 } };
  it('keeps the off-route warning quiet near the detour line', () => {
    expect(onDetour(d, { lat: 47.0031, lon: 8.1 })).toBe(true);
    expect(onDetour(d, { lat: 47.05, lon: 8.1 })).toBe(false);
    expect(onDetour(null, { lat: 47, lon: 8 })).toBe(false);
  });
  it('is done past the rejoin point', () => {
    expect(detourDone(d, { km: 8 })).toBe(false);
    expect(detourDone(d, { km: 9.4 })).toBe(true);
    expect(detourDone({ ...d, rejoin: null }, { here: { lat: 47.003, lon: 8.1 } })).toBe(true);
  });
  it('the GPX has the detour, the rest of the route and the place', () => {
    const g = detourGpx(d, pts, 'Umweg Laden');
    expect(g).toContain('<name>Laden</name>');
    expect(g).toContain('<sym>Shopping Center</sym>');
    expect((g.match(/<trkpt /g) ?? []).length).toBe(3 + pts.filter((p) => p.km > 9).length);
  });
  it('is kept on the device for a day', () => {
    const m = new Map();
    const store = { getItem: (x) => m.get(x) ?? null, setItem: (x, v) => m.set(x, v), removeItem: (x) => m.delete(x) };
    saveDetour({ ...d, at: 1000 }, store);
    expect(m.has(DETOUR_KEY)).toBe(true);
    expect(loadDetour(store, 2000)?.target.name).toBe('Laden');
    expect(loadDetour(store, 1000 + 864e5 + 1)).toBeNull();
    saveDetour(null, store);
    expect(loadDetour(store, 2000)).toBeNull();
    expect(loadDetour({ getItem: () => { throw new Error('blocked'); } })).toBeNull();
  });
});

describe('gpxout', () => {
  it('escapes names, keeps symbols and leaves out places without coordinates', () => {
    const g = gpxString({ name: 'A & B', line: [[47, 8, 400], { lat: 47.1, lon: 8.1 }], stops: [{ lat: 47, lon: 8, name: 'Café <Ecke>', kind: 'food' }, { name: 'nowhere', kind: 'water' }, { lat: 47.2, lon: 8.2, kind: 'water' }] });
    expect(g).toContain('<name>A &amp; B</name>');
    expect(g).toContain('Café &lt;Ecke&gt;');
    expect((g.match(/<wpt /g) ?? []).length).toBe(2);
    expect(g).toContain('<sym>Drinking Water</sym>');
    expect(g).toContain('<ele>400</ele>');
    expect(g.startsWith('<?xml')).toBe(true);
  });
  it('short names and safe file names', () => {
    expect(wptName('x'.repeat(50))).toHaveLength(WPT_NAME_MAX);
    expect(gpxFileName('Umweg zu Bäckerei «Sonne»')).toBe('Umweg-zu-Backerei-Sonne.gpx');
    expect(gpxFileName('')).toBe('route.gpx');
  });
});

// Umweg und zurück (Noah 27.10.2026 «1a 2b 3a»)
import { returnPoint, returnModeStd, planReturn, shouldReroute, OFF_ROUTE_S, REROUTE_GAP_S } from '../src/lib/reroute.js';

describe('back after a stop', () => {
  it('race mode goes back to the exit point first, otherwise the fast way', () => {
    expect(returnModeStd(true)).toBe('exit');
    expect(returnModeStd(false)).toBe('fast');
  });
  it('exit: the spot where you left; fast: the nearest point ahead, never behind the exit', () => {
    const here = { lat: 47.01, lon: 8.15 }; // north of km ~11.4
    expect(returnPoint('exit', pts, { exitKm: 7.6, here }).km).toBe(7.6);
    const fast = returnPoint('fast', pts, { exitKm: 7.6, here });
    expect(fast.km).toBeGreaterThan(11);
    expect(fast.km).toBeLessThan(12);
    expect(returnPoint('fast', pts, { exitKm: 20, here }).km).toBe(20);
    expect(returnPoint('exit', [], { exitKm: 1 })).toBeNull();
  });
  it('asks the router once and tells the km of the route left out', async () => {
    const urls = [];
    const fetcher = async (u) => (urls.push(u), { ok: true, status: 200, json: async () => geo([[8.15, 47.01], [8.15, 47]], { 'track-length': '1100', 'total-time': '240' }) });
    const r = await planReturn({ here: { lat: 47.01, lon: 8.15 }, mode: 'fast', pts, exitKm: 7.6, fetcher });
    expect(urls).toHaveLength(1);
    expect(r).toMatchObject({ mode: 'fast', km: 1.1, min: 4 });
    expect(r.skippedKm).toBeGreaterThan(3);
    const back = await planReturn({ here: { lat: 47.01, lon: 8.15 }, mode: 'exit', pts, exitKm: 7.6, fetcher });
    expect(back.skippedKm).toBe(0);
    await expect(planReturn({ here: null, pts, exitKm: 1, fetcher })).rejects.toThrow('failed');
  });
});

describe('off the route: plan again by itself', () => {
  const now = 1_000_000_000;
  it('waits a few seconds off the route, then plans, at most once a minute', () => {
    expect(shouldReroute({ offM: 200, offSince: now - (OFF_ROUTE_S - 1) * 1000, now })).toBe(false);
    expect(shouldReroute({ offM: 200, offSince: now - OFF_ROUTE_S * 1000, now })).toBe(true);
    expect(shouldReroute({ offM: 200, offSince: now - 99e3, lastAt: now - (REROUTE_GAP_S - 1) * 1000, now })).toBe(false);
    expect(shouldReroute({ offM: 200, offSince: now - 99e3, lastAt: now - REROUTE_GAP_S * 1000, now })).toBe(true);
  });
  it('stays quiet near the route or on a planned detour', () => {
    expect(shouldReroute({ offM: 40, offSince: now - 99e3, now })).toBe(false);
    expect(shouldReroute({ offM: 200, offSince: now - 99e3, now, onDetour: true })).toBe(false);
    expect(shouldReroute({ offM: 200, offSince: null, now })).toBe(false);
  });
});

import { backtrackOf } from '../src/lib/reroute.js';
describe('the same way back', () => {
  it('reverses your own track since you left the route', () => {
    // on the route at lon 8.10 and 8.11, then north off it
    const track = [{ lat: 47, lon: 8.1 }, { lat: 47, lon: 8.11 }, { lat: 47.003, lon: 8.112 }, { lat: 47.006, lon: 8.114 }];
    const b = backtrackOf(track, pts);
    expect(b.line[0]).toEqual([47.006, 8.114]);
    expect(b.line.at(-1)).toEqual([47, 8.11]);
    expect(b.km).toBeGreaterThan(0.5);
    expect(b.rejoin.km).toBe(8.3); // lon 8.11 = point 11 = 11 × 0.7585 km
  });
  it('says null on the route or without ever being on it', () => {
    expect(backtrackOf([{ lat: 47, lon: 8.1 }, { lat: 47, lon: 8.11 }], pts)).toBeNull();
    expect(backtrackOf([{ lat: 47.05, lon: 8.1 }, { lat: 47.06, lon: 8.11 }], pts)).toBeNull();
  });
});

import { atPlace, returnDetour, backDetour, AT_PLACE_M } from '../src/lib/reroute.js';
describe('at the place and the way back as a detour', () => {
  const place = { lat: 47.01, lon: 8.15, name: 'test_data_gtp_ Beck', kind: 'shop' };
  it('knows when you are at the place of a detour, never on a way back', () => {
    const d = { line: [[47, 8.1], [47.01, 8.15]], target: place };
    expect(atPlace(d, { lat: 47.0102, lon: 8.1502 })).toBe(true);
    expect(atPlace(d, { lat: 47.02, lon: 8.15 })).toBe(false); // about 1.1 km
    expect(atPlace({ ...d, back: 'exit' }, place)).toBe(false);
    expect(atPlace(null, place)).toBe(false);
    expect(AT_PLACE_M).toBe(80);
  });
  it('turns a planned way back into a detour that ends on the route', () => {
    const r = { line: [[47.01, 8.15], [47, 8.1]], km: 4.1, gainM: 12, min: 14, mode: 'exit', rejoin: { km: 7.6, lat: 47, lon: 8.1 }, skippedKm: 0 };
    const d = returnDetour(r, { exitKm: 7.6, back: 'exit', now: 5 });
    expect(d).toMatchObject({ km: 4.1, back: 'exit', fromKm: 7.6, at: 5, skippedKm: 0, target: { lat: 47, lon: 8.1, kind: 'route' } });
    // done only back on the route past the point
    expect(detourDone(d, { km: 8, offM: 10 })).toBe(true);
    expect(detourDone(d, { km: 8, offM: 500 })).toBe(false);
    expect(detourDone(d, { km: 7.7, offM: 10 })).toBe(false);
  });
  it('the same way back needs no router', () => {
    const b = backtrackOf([{ lat: 47, lon: 8.1 }, { lat: 47, lon: 8.11 }, { lat: 47.006, lon: 8.114 }], pts);
    const d = backDetour(b, 9);
    expect(d).toMatchObject({ back: 'same', gainM: 0, min: null, fromKm: 8.3, rejoin: { km: 8.3 } });
    expect(d.line).toEqual(b.line);
  });
});

describe('Wege zur Auswahl', () => {
  const here = { lat: 47, lon: 8 };
  const target = { lat: 47.01, lon: 8.02, name: 'test_data_gtp_ Quelle' };
  const way = (n, mid, props) => geo([[8, 47, 400], [mid, 47.005, 410], [8.02, 47.01, 420]], props);
  const answers = [
    way(1, 8.01, { 'track-length': '3000', 'filtered ascend': '60', 'total-time': '600' }),
    way(2, 8.012, { 'track-length': '3400', 'filtered ascend': '20', 'total-time': '720' }),
    way(3, 8.008, { 'track-length': '3100', 'filtered ascend': '45', 'total-time': '540' }),
  ];
  const fetcherOf = (list) => {
    const asked = [];
    const fetcher = async (url) => {
      asked.push(url);
      const i = Number(new URL(url).searchParams.get('alternativeidx'));
      return list[i] ? { ok: true, status: 200, json: async () => list[i] } : { ok: false, status: 500, json: async () => ({}) };
    };
    return { fetcher, asked };
  };
  it('asks the router one after the other and tags the best way in each point', async () => {
    const { fetcher, asked } = fetcherOf(answers);
    const ways = await planAlternatives({ here, target, fetcher }, 3);
    expect(asked.map((u) => new URL(u).searchParams.get('alternativeidx'))).toEqual(['0', '1', '2']);
    expect(ways).toHaveLength(3);
    expect(ways[0].tags).toEqual(['shortest']);
    expect(ways[1].tags).toEqual(['flattest']);
    expect(ways[2].tags).toEqual(['fastest']);
  });
  it('drops a way that is the same and ends when the router has no more', async () => {
    const { fetcher } = fetcherOf([answers[0], answers[0]]);
    const ways = await planAlternatives({ here, target, fetcher }, 3);
    expect(ways).toHaveLength(1);
    expect(ways[0].tags).toEqual([]);
  });
  it('fails like planDetour when the first answer fails', async () => {
    const { fetcher } = fetcherOf([]);
    await expect(planAlternatives({ here, target, fetcher }, 3)).rejects.toThrow('noroute');
  });
});

/* ---------- Sicherheitsnetz (Noah 05.11.2026 «ok bauen») ---------- */
import { askRouter, routerMsg, longestLegKm, ROUTER_CACHE_MS, ROUTER_TOO_FAR_KM, ROUTER_CACHE_MAX } from '../src/lib/reroute.js';
import DE from '../src/lib/i18n/de/index.js';

describe('askRouter: safety net', () => {
  const A = { lat: 47, lon: 8 };
  const B = { lat: 47.01, lon: 8.02 };
  const ok = (coords = [[8, 47, 400], [8.02, 47.01, 410]]) => ({ ok: true, status: 200, json: async () => geo(coords, { 'track-length': '2000' }) });
  const never = (_u, { signal }) => new Promise((_ok, bad) => signal.addEventListener('abort', () => bad(new Error('aborted'))));

  it('asks once and answers the same question from memory', async () => {
    let n = 0;
    const f = async () => (n++, ok());
    const a = await askRouter([A, B], 'trekking', f);
    const b = await askRouter([A, B], 'trekking', f);
    expect(n).toBe(1);
    expect(b).toEqual(a);
    b.line[0][0] = 0; // a copy: changing it does not change the memory
    expect((await askRouter([A, B], 'trekking', f)).line[0][0]).toBe(47);
    await askRouter([A, B], 'fastbike', f); // another profile is another question
    await askRouter([A, B], 'trekking', f, 1); // another way is another question
    expect(n).toBe(3);
  });
  it('forgets after ROUTER_CACHE_MS and keeps at most ROUTER_CACHE_MAX answers', async () => {
    let n = 0;
    const f = async () => (n++, ok());
    await askRouter([A, B], 'trekking', f, 0, { now: 1000 });
    await askRouter([A, B], 'trekking', f, 0, { now: 1000 + ROUTER_CACHE_MS - 1 });
    expect(n).toBe(1);
    await askRouter([A, B], 'trekking', f, 0, { now: 1000 + ROUTER_CACHE_MS });
    expect(n).toBe(2);
    clearRouterCache();
    for (let i = 0; i < ROUTER_CACHE_MAX + 5; i++) await askRouter([A, { lat: 47.01 + i / 1e4, lon: 8.02 }], 'trekking', f);
    n = 0;
    await askRouter([A, { lat: 47.01, lon: 8.02 }], 'trekking', f); // the oldest is gone
    expect(n).toBe(1);
  });
  it('a failed answer is not kept', async () => {
    await expect(askRouter([A, B], 'trekking', async () => ({ ok: false, status: 400 }))).rejects.toThrow('noroute');
    await expect(askRouter([A, B], 'trekking', async () => ok())).resolves.toBeTruthy();
  });
  it('gives up after the time limit (no endless spinning) and does not ask again', async () => {
    let n = 0;
    const f = (...a) => (n++, never(...a));
    await expect(askRouter([A, B], 'trekking', f, 0, { timeoutMs: 20 })).rejects.toThrow('timeout');
    expect(n).toBe(1);
  });
  it('tries once more after a quick failure, then says failed', async () => {
    let n = 0;
    await expect(askRouter([A, B], 'trekking', async () => (n++, Promise.reject(new Error('net'))))).rejects.toThrow('failed');
    expect(n).toBe(2);
    n = 0;
    const r = await askRouter([A, B], 'trekking', async () => (n++, n === 1 ? { ok: false, status: 502 } : ok()));
    expect(r.km).toBe(2);
    expect(n).toBe(2);
    n = 0;
    await expect(askRouter([A, B], 'fastbike', async () => (n++, { ok: false, status: 504 }))).rejects.toThrow('failed');
    expect(n).toBe(2);
  });
  it('does not repeat «busy» (fair use of the free server)', async () => {
    for (const status of [429, 503]) {
      let n = 0;
      await expect(askRouter([A, B], 'trekking', async () => (n++, { ok: false, status }))).rejects.toThrow('busy');
      expect(n).toBe(1);
    }
  });
  it('does not ask for a way that is too far, and says so', async () => {
    let n = 0;
    const far = { lat: 48.21, lon: 16.37 };
    expect(longestLegKm([A, far])).toBeGreaterThan(ROUTER_TOO_FAR_KM);
    await expect(askRouter([A, far], 'trekking', async () => (n++, ok()))).rejects.toThrow('toofar');
    expect(n).toBe(0);
  });
  it('says offline at once, but still answers from memory', async () => {
    let n = 0;
    const f = async () => (n++, ok());
    await expect(askRouter([A, B], 'trekking', f, 0, { online: false })).rejects.toThrow('offline');
    expect(n).toBe(0);
    await askRouter([A, B], 'trekking', f);
    await expect(askRouter([A, B], 'trekking', f, 0, { online: false })).resolves.toBeTruthy();
    expect(n).toBe(1);
  });
  it('the answers of planDetour and planReturn come through the same door', async () => {
    let n = 0;
    const f = async () => (n++, ok());
    await planDetour({ here: A, target: B, fetcher: f });
    await planDetour({ here: A, target: B, fetcher: f });
    expect(n).toBe(1);
  });
});

describe('routerMsg: clear words for every failure', () => {
  const KINDS = ['busy', 'noroute', 'toofar', 'timeout', 'offline', 'failed'];
  it('has a different text for every failure and has German for all of them', () => {
    for (const round of [false, true]) {
      const texts = KINDS.map((k) => routerMsg(new Error(k), { round, online: true }));
      expect(new Set(texts).size).toBe(KINDS.length);
      for (const t of texts) expect(DE[t], t).toBeTruthy();
    }
  });
  it('knows «offline» from the browser too, and uses the caller\'s text for «no way»', () => {
    expect(routerMsg(new Error('failed'), { online: false })).toBe(routerMsg(new Error('offline'), { online: true }));
    expect(routerMsg(new Error('noroute'), { noroute: 'No round.' })).toBe('No round.');
    expect(routerMsg(undefined, { online: true })).toBe(routerMsg(new Error('failed'), { online: true }));
  });
  it('the note about the position is in German too', () => {
    for (const k of ['To plan a way, the app sends your position and the goal to brouter.de (free, no account). The service keeps such requests for two weeks. Nothing else leaves the device.', 'To plan a round, the app sends your home place and the points of the round to brouter.de (free, no account). The service keeps such requests for two weeks. Nothing else leaves the device.']) expect(DE[k]).toContain('brouter.de');
  });
});
