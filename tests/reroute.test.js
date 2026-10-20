// Paket X «Umweg neu planen» (Noah 20.10.2026): reroute.js and the GPX writer gpxout.js, with made-up places.
import { describe, it, expect } from 'vitest';
import { brouterUrl, parseBrouter, rejoinOf, snapAhead, targetsOf, planDetour, onDetour, detourDone, detourGpx, saveDetour, loadDetour, DETOUR_KEY, PROFILE_STD } from '../src/lib/reroute.js';
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
