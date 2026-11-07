import { describe, it, expect } from 'vitest';
import { sectionsOf, rate, renameWay, removeWay, restoreWay, changeRating, nameOf, nearBadWays, circlesOf, avoidCircles, nogosParam, goodSigns, cleanMemory, wayId, MAX_CIRCLES, MAX_SECTIONS } from '../src/lib/live/wegegedaechtnis.js';
import { brouterUrl, planDetour, clearRouterCache } from '../src/lib/reroute.js';

const KM = 1 / 111.2;
// a straight ride north: a point every 100 m
const ride = (km) => Array.from({ length: Math.round(km * 10) + 1 }, (_, i) => ({ lat: 46.9 + i * 0.1 * KM, lon: 7.4 }));

describe('Wege-Gedächtnis: the stretches of a ride', () => {
  it('has nothing to rate for a very short ride', () => {
    expect(sectionsOf(ride(1))).toEqual([]);
    expect(sectionsOf([])).toEqual([]);
  });
  it('cuts a ride into stretches of about 3 km that follow each other', () => {
    const s = sectionsOf(ride(9));
    expect(s.length).toBe(3);
    expect(s[0].fromKm).toBe(0);
    expect(s.at(-1).toKm).toBeCloseTo(9, 0);
    expect(s[1].fromKm).toBeCloseTo(s[0].toKm, 0);
    // a point about every 100 m, never thousands
    expect(s[0].line.length).toBeGreaterThan(20);
    expect(s[0].line.length).toBeLessThan(40);
  });
  it('a long ride gets fewer, longer stretches', () => {
    expect(sectionsOf(ride(200)).length).toBe(MAX_SECTIONS);
  });
});

describe('Wege-Gedächtnis: marking, renaming, deleting', () => {
  const [s0, s1] = sectionsOf(ride(6));
  it('marks a stretch, the same mark again takes it back, another mark replaces it', () => {
    let m = rate(null, { rideId: 'r1', day: '2026-11-07', section: s0, rating: 'down', now: 5 });
    expect(m.ways).toHaveLength(1);
    expect(m.ways[0]).toMatchObject({ id: wayId('r1', 0), rating: 'down', fromKm: s0.fromKm });
    m = rate(m, { rideId: 'r1', section: s0, rating: 'up' });
    expect(m.ways[0].rating).toBe('up');
    m = rate(m, { rideId: 'r1', section: s0, rating: 'up' });
    expect(m.ways).toHaveLength(0);
  });
  it('renames, changes the mark, deletes and brings it back', () => {
    let m = rate(null, { rideId: 'r1', section: s1, rating: 'down', now: 1 });
    const id = m.ways[0].id;
    m = renameWay(m, id, '  Baustelle am Fluss  ');
    expect(m.ways[0].name).toBe('Baustelle am Fluss');
    expect(nameOf(m.ways[0])).toBe('Baustelle am Fluss');
    expect(nameOf({ ...m.ways[0], name: '', day: '2026-11-07' }, { date: (d) => d.slice(5) })).toContain('km');
    m = changeRating(m, id, 'up');
    expect(m.ways[0].rating).toBe('up');
    const gone = m.ways[0];
    m = removeWay(m, id);
    expect(m.ways).toHaveLength(0);
    m = restoreWay(m, gone);
    expect(m.ways).toHaveLength(1);
    expect(restoreWay(m, gone).ways).toHaveLength(1);
  });
  it('a broken row is an empty memory', () => {
    expect(cleanMemory(undefined).ways).toEqual([]);
    expect(cleanMemory({ ways: [{ id: 'x', line: [[1, 2]], rating: 'down' }, null, { id: 'y', line: [[1, 2], [3, 4]], rating: 'meh' }] }).ways).toEqual([]);
  });
  it('a good stretch becomes a sign in its middle', () => {
    const m = rate(rate(null, { rideId: 'r', section: s0, rating: 'up' }), { rideId: 'r', section: s1, rating: 'down' });
    const signs = goodSigns(m.ways, () => 'Good');
    expect(signs).toHaveLength(1);
    expect(signs[0]).toMatchObject({ id: `way-${wayId('r', 0)}`, kind: 'view', name: 'Good' });
  });
});

describe('Wege-Gedächtnis: bad stretches are avoided when planning', () => {
  const bad = rate(null, { rideId: 'r', section: sectionsOf(ride(6))[0], rating: 'down' }).ways;
  const nearWay = [{ lat: 46.9, lon: 7.401 }, { lat: 46.92, lon: 7.401 }];
  const farWay = [{ lat: 47.5, lon: 8.5 }, { lat: 47.52, lon: 8.5 }];
  it('only bad stretches near the planned way count', () => {
    expect(nearBadWays(bad, nearWay)).toHaveLength(1);
    expect(nearBadWays(bad, farWay)).toHaveLength(0);
    expect(nearBadWays(bad.map((w) => ({ ...w, rating: 'up' })), nearWay)).toHaveLength(0);
  });
  it('makes circles, at most 60, in the form of BRouter', () => {
    const c = avoidCircles(bad, nearWay);
    expect(c.length).toBeGreaterThan(0);
    expect(c.length).toBeLessThanOrEqual(MAX_CIRCLES);
    expect(c[0].r).toBe(50);
    const many = circlesOf([{ line: Array.from({ length: 500 }, (_, i) => [46 + i / 1000, 7]) }]);
    expect(many).toHaveLength(MAX_CIRCLES);
    expect(nogosParam([{ lat: 46.9, lon: 7.4, r: 50 }, { lat: 46.91, lon: 7.41, r: 50 }])).toBe('7.40000,46.90000,50|7.41000,46.91000,50');
  });
  it('the router address carries the circles only when there are some', () => {
    const pts = [{ lat: 46.9, lon: 7.4 }, { lat: 46.91, lon: 7.4 }];
    expect(brouterUrl(pts)).not.toContain('nogos');
    expect(brouterUrl(pts, 'trekking', 0, [{ lat: 46.905, lon: 7.4, r: 50 }])).toContain('&nogos=7.40000,46.90500,50&');
  });
  const answer = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': '1000', 'filtered ascend': '5', 'total-time': '240' }, geometry: { type: 'LineString', coordinates: [[7.401, 46.9], [7.401, 46.91]] } }] };
  const here = { lat: 46.9, lon: 7.401 };
  const target = { lat: 46.91, lon: 7.401, name: 'Ziel', kind: 'shop' };
  it('plans with the circles and says how many stretches it avoids', async () => {
    clearRouterCache();
    const urls = [];
    const d = await planDetour({ here, target, avoid: bad, fetcher: async (u) => (urls.push(u), { ok: true, status: 200, json: async () => answer }) });
    expect(urls[0]).toContain('nogos=');
    expect(d.avoided).toBe(1);
  });
  it('asks again without the circles when they leave no way', async () => {
    clearRouterCache();
    const urls = [];
    const fetcher = async (u) => (urls.push(u), u.includes('nogos=') ? { ok: false, status: 500 } : { ok: true, status: 200, json: async () => answer });
    const d = await planDetour({ here, target, avoid: bad, fetcher });
    expect(urls).toHaveLength(2);
    expect(urls[1]).not.toContain('nogos=');
    expect(d.avoided).toBeUndefined();
  });
  it('without bad stretches nothing changes', async () => {
    clearRouterCache();
    const urls = [];
    const d = await planDetour({ here, target, avoid: [], fetcher: async (u) => (urls.push(u), { ok: true, status: 200, json: async () => answer }) });
    expect(urls[0]).not.toContain('nogos');
    expect(d.avoided).toBeUndefined();
  });
});
