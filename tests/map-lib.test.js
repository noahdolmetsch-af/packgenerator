// Paket U2 «Karte»: the pure helpers of the map (maplib.js), the own points (ownpoints.js) and the
// weather layers (wx.js). Fictional data: the sample race of the app (src/lib/race/sample.js).
import { describe, it, expect } from 'vitest';
import { sampleRoute, samplePois } from '../src/lib/race/sample.js';
import { lineKm, pointAt } from '../src/lib/race/race.js';
import {
  minZoomOf, ALWAYS, SUPPLY, tokenColours, sectorColour, kindColourExpr, SECTOR_TOKENS, lineFeature, sectorSegments, stretch, segmentsGeo, pointsGeo, zoomSteps,
  pointFeature, boundsOf, middleOf, placeAt, kmNear, tapKm, profileAt, sampleProfile, profileRange, planBeds, nightStretches, loadPrefs, savePrefs, hasWebGL,
} from '../src/lib/map/maplib.js';
import { listOf, newPoint, updatePoint, removePoint, movePoint, ownLabel, ownOnMap, OWN_KINDS } from '../src/lib/map/ownpoints.js';
import { radarFrame, mapWxAt, wxRows, snowStretches, windArrows, windiest, wxPoints, fetchMapWx, fetchRadar, isOld, SNOW_BELOW_FREEZING_M } from '../src/lib/map/wx.js';

const route = sampleRoute();
const pts = lineKm(route);

describe('which points at which zoom', () => {
  it('depot, start/finish, beds and own points always; supply from 10; the rest from 12', () => {
    for (const k of ALWAYS) expect(minZoomOf(k)).toBe(0);
    for (const k of SUPPLY) expect(minZoomOf(k)).toBe(10);
    for (const k of ['station', 'bike', 'shelter', 'sleep', 'other', undefined]) expect(minZoomOf(k)).toBe(12);
  });
  it('the zoom steps of a set of points, sorted', () => {
    expect(zoomSteps([{ kind: 'station' }, { kind: 'shop' }, { kind: 'depot' }, { kind: 'food' }])).toEqual([0, 10, 12]);
    expect(zoomSteps([{ kind: 'station', minZoom: 5 }])).toEqual([5]);
  });
});

describe('colours from tokens', () => {
  it('reads the tokens and falls back to the light palette', () => {
    const style = { getPropertyValue: (n) => (n === '--l1' ? ' #123456 ' : '') };
    const c = tokenColours(style);
    expect(c['--l1']).toBe('#123456');
    expect(c['--l2']).toMatch(/^#/);
    expect(tokenColours(null)['--ink']).toMatch(/^#/);
  });
  it('sector colours repeat after six', () => {
    const c = tokenColours(null);
    expect(sectorColour(c, 0)).toBe(c[SECTOR_TOKENS[0]]);
    expect(sectorColour(c, SECTOR_TOKENS.length)).toBe(sectorColour(c, 0));
    expect(sectorColour(c, 7)).toBe(c[SECTOR_TOKENS[1]]);
  });
  it('a match expression kind → colour with a default at the end', () => {
    const e = kindColourExpr(tokenColours(null));
    expect(e.slice(0, 2)).toEqual(['match', ['get', 'kind']]);
    expect(e.length % 2).toBe(1);
    expect(e).toContain('depot');
  });
});

describe('GeoJSON', () => {
  it('a line as [lon, lat]', () => {
    expect(lineFeature([[46, 7], [46.1, 7.1]]).geometry.coordinates).toEqual([[7, 46], [7.1, 46.1]]);
    expect(lineFeature([[46, 7]])).toBeNull();
    expect(lineFeature([{ lat: 46, lon: 7 }, { lat: 47, lon: 8 }]).geometry.coordinates[1]).toEqual([8, 47]);
  });
  it('the route in its 11 sectors, joined end to end', () => {
    const segs = sectorSegments(pts, route.sectors);
    expect(segs).toHaveLength(11);
    expect(segs.map((s) => s.i)).toEqual([...Array(11).keys()]);
    for (let i = 1; i < segs.length; i++) expect(segs[i].line[0]).toEqual(segs[i - 1].line.at(-1));
    const fc = segmentsGeo(segs);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features[3].properties).toMatchObject({ i: 3, name: 'Sektor 04' });
    expect(segmentsGeo(fc)).toBe(fc);
    expect(sectorSegments(pts, [])).toHaveLength(1);
    expect(sectorSegments([], route.sectors)).toEqual([]);
  });
  it('a stretch between two km starts and ends there', () => {
    const s = stretch(pts, 100, 200);
    const a = pointAt(pts, 100);
    expect(s[0]).toEqual([a.lat, a.lon]);
    expect(s.length).toBeGreaterThan(2);
    expect(stretch(pts, 200, 100)).toEqual([]);
  });
  it('points with their zoom; broken points are left out', () => {
    const g = pointsGeo([{ id: 1, lat: 46, lon: 7, kind: 'shop', name: 'A' }, { id: 2, lat: NaN, lon: 7 }, { id: 3, lat: 46, lon: 7, kind: 'own', minZoom: 4 }]);
    expect(g.features).toHaveLength(2);
    expect(g.features[0].properties).toEqual({ id: '1', kind: 'shop', name: 'A', minZoom: 10, sym: 'sym-shop' });
    expect(g.features[1].properties.minZoom).toBe(4);
    expect(pointFeature({ lat: 46, lon: 7 }).geometry.coordinates).toEqual([7, 46]);
    expect(pointFeature(null)).toBeNull();
  });
  it('bounds and their middle', () => {
    const b = boundsOf(route.line);
    expect(b[0][0]).toBeLessThan(b[1][0]);
    expect(b[0][1]).toBeLessThan(b[1][1]);
    const m = middleOf(b);
    expect(m.lat).toBeGreaterThan(46);
    expect(m.lat).toBeLessThan(48);
    expect(boundsOf([], [])).toBeNull();
    const one = boundsOf([{ lat: 46, lon: 7 }]);
    expect(one[1][0] - one[0][0]).toBeGreaterThan(0);
  });
});

describe('km ↔ place', () => {
  it('km → place → km again', () => {
    const p = placeAt(pts, 333);
    expect(kmNear(pts, p, 1)).toBeCloseTo(333, 0);
    expect(placeAt(pts, 99999).km).toBeCloseTo(pts.at(-1).km, 5);
    expect(placeAt([], 3)).toBeNull();
  });
  it('a tap far from the route is no km', () => {
    expect(kmNear(pts, { lat: 40, lon: 0 }, 2)).toBeNull();
  });
  it('the tap distance shrinks when you zoom in', () => {
    expect(tapKm(8)).toBeGreaterThan(tapKm(14));
    expect(tapKm(8)).toBeGreaterThan(5);
    expect(tapKm(22)).toBe(0.05);
  });
});

describe('the profile', () => {
  const prof = [[0, 500], [1, 550], [2, 550], [4, 450]];
  it('height and gradient at a km', () => {
    expect(profileAt(prof, 0.5)).toEqual({ km: 0.5, m: 525, grade: 5 });
    expect(profileAt(prof, 3)).toEqual({ km: 3, m: 500, grade: -5 });
    expect(profileAt(prof, 10).m).toBe(450);
    expect(profileAt([], 3)).toBeNull();
  });
  it('thinned to a maximum, the pass kept', () => {
    const s = sampleProfile(route.profile, 120);
    expect(s.length).toBeLessThanOrEqual(130);
    expect(s[0].km).toBe(0);
    expect(s.at(-1).km).toBe(route.profile.at(-1)[0]);
    expect(Math.max(...s.map((p) => p.m))).toBe(route.maxM);
    for (let i = 1; i < s.length; i++) expect(s[i].km).toBeGreaterThanOrEqual(s[i - 1].km);
    expect(sampleProfile(prof, 100).map((p) => p.grade)).toEqual([0, 5, 0, -5]);
  });
  it('the range keeps 100 m at least', () => {
    expect(profileRange([[0, 400], [5, 420]])).toEqual({ km: 5, lo: 400, hi: 500 });
    expect(profileRange([])).toEqual({ km: 0, lo: 0, hi: 100 });
  });
});

describe('the plan on the map', () => {
  it('the beds of the stages, not the finish', () => {
    const plan = { stages: [{ n: 1, toKm: 180, place: 'Hotel A', bed: 'hotel' }, { n: 2, toKm: 400, place: '', bed: 'bivy' }, { n: 3, toKm: 1004, place: 'Finish', bed: 'finish' }] };
    const b = planBeds(plan, pts);
    expect(b.map((x) => [x.id, x.kind, x.name, x.km])).toEqual([['bed-1', 'bed', 'Hotel A', 180], ['bed-2', 'bed', '', 400]]);
    expect(Number.isFinite(b[0].lat)).toBe(true);
    expect(planBeds(null, pts)).toEqual([]);
  });
  it('night stretches through kmAt; tiny ones dropped', () => {
    const plan = { kmAt: (ms) => ms / 1000 };
    expect(nightStretches(plan, [{ from: 100000, to: 160000 }, { from: 200000, to: 200100 }])).toEqual([{ fromKm: 100, toKm: 160 }]);
    expect(nightStretches(null, [{ from: 1, to: 2 }])).toEqual([]);
  });
});

describe('choices on this device', () => {
  it('without localStorage the defaults hold and saving does not throw', () => {
    expect(loadPrefs('race', { ground: 'auto', shown: { a: true } })).toEqual({ ground: 'auto', shown: { a: true } });
    expect(() => savePrefs('race', { ground: 'osm' })).not.toThrow();
    expect(hasWebGL(null)).toBe(false);
  });
  it('stored choices win, new switches keep their default', () => {
    const mem = {};
    globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => (mem[k] = v) };
    try {
      savePrefs('race', { ground: 'osm', shown: { a: false } });
      expect(loadPrefs('race', { ground: 'auto', shown: { a: true, b: true } })).toEqual({ ground: 'osm', shown: { a: false, b: true } });
    } finally {
      delete globalThis.localStorage;
    }
  });
});

describe('own points', () => {
  it('a clean list from the stored value', () => {
    const v = { points: [{ id: 'a', lat: 46, lon: 7, name: 'X', kind: 'water' }, { id: 'b', lat: 'x', lon: 7 }, { id: 'c', lat: 46, lon: 7, kind: 'weird' }, null, { lat: 1, lon: 1 }] };
    const l = listOf(v);
    expect(l.map((p) => [p.id, p.kind])).toEqual([['a', 'water'], ['c', 'note']]);
    expect(listOf(null)).toEqual([]);
  });
  it('add, change, move, delete', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    const a = newPoint({ lat: 46.123456789, lon: 7.987654321, name: ' Brunnen ', kind: 'water' }, now);
    expect(a).toMatchObject({ lat: 46.12346, lon: 7.98765, name: 'Brunnen', kind: 'water', createdAt: '2026-10-19T10:00:00.000Z' });
    const b = newPoint({ lat: 46, lon: 7, kind: 'nope' }, now);
    expect(b.kind).toBe('note');
    let l = [a, b];
    l = updatePoint(l, a.id, { name: 'Dorfbrunnen', id: 'hack' });
    expect(l[0]).toMatchObject({ id: a.id, name: 'Dorfbrunnen' });
    expect(movePoint(l, 0, 1).map((p) => p.id)).toEqual([b.id, a.id]);
    expect(movePoint(l, 0, 5)).toBe(l);
    expect(removePoint(l, a.id).map((p) => p.id)).toEqual([b.id]);
  });
  it('the shown name falls back to the kind; on the map as kind «own»', () => {
    expect(ownLabel({ name: '', kind: 'view' })).toBe('View|point');
    expect(ownLabel({ name: 'Aussicht', kind: 'view' })).toBe('Aussicht');
    expect(ownOnMap([{ id: 'a', lat: 46, lon: 7, name: 'A', kind: 'danger' }])).toEqual([{ id: 'a', lat: 46, lon: 7, kind: 'own', sub: 'danger', name: 'A', minZoom: 0 }]);
    expect(OWN_KINDS.map((k) => k.key)).toEqual(['note', 'water', 'food', 'sleep', 'danger', 'view']);
  });
});

describe('weather layers', () => {
  it('the newest radar frame', () => {
    const j = { host: 'https://tilecache.rainviewer.com', radar: { past: [{ time: 100, path: '/v2/radar/100' }, { time: 200, path: '/v2/radar/200' }] } };
    expect(radarFrame(j)).toEqual({ time: 200000, url: 'https://tilecache.rainviewer.com/v2/radar/200/256/{z}/{x}/{y}/2/1_1.png' });
    expect(radarFrame({})).toBeNull();
  });
  it('fetchers ask the free services and fail clearly', async () => {
    const urls = [];
    const ok = (json) => async (u) => (urls.push(u), { ok: true, json: async () => json });
    const points = wxPoints(pts, route.profile);
    expect(points.length).toBeGreaterThan(5);
    expect(points.length).toBeLessThanOrEqual(12);
    expect(points[0].m).toBe(route.profile[0][1]);
    expect(await fetchMapWx(points, ok({ hourly: {} }))).toHaveLength(1);
    expect(urls[0]).toMatch(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
    expect(urls[0]).toMatch(/freezing_level_height/);
    expect(urls[0]).toMatch(/snow_depth/);
    await expect(fetchMapWx(points, async () => ({ ok: false, status: 429 }))).rejects.toThrow('busy');
    await expect(fetchRadar(ok({}))).rejects.toThrow();
    expect(await fetchMapWx([], ok({}))).toEqual([]);
  });
  const t0 = Date.parse('2027-06-19T06:00:00Z') / 1000;
  const series = (freezing, snow, wind = 10) => ({ hourly: { time: [t0, t0 + 3600, t0 + 7200], wind_speed_10m: [wind, wind + 5, wind + 10], wind_direction_10m: [270, 270, 270], freezing_level_height: [freezing, freezing, freezing], snow_depth: [snow, snow, snow] } });
  it('the hour nearest to a moment; outside the forecast nothing', () => {
    expect(mapWxAt(series(3000, 0), (t0 + 3500) * 1000)).toEqual({ at: (t0 + 3600) * 1000, wind: 15, dir: 270, freezing: 3000, snow: 0 });
    expect(mapWxAt(series(3000, 0), (t0 + 99999) * 1000)).toBeNull();
    expect(mapWxAt(null, 1)).toBeNull();
  });
  it('rows for when you are there; snow lies, above the snow line, or nothing', () => {
    const cache = {
      points: [{ km: 0, lat: 46, lon: 7, m: 600 }, { km: 100, lat: 46, lon: 7, m: 2100 }, { km: 200, lat: 46, lon: 7, m: 900 }, { km: 300, lat: 46, lon: 7, m: 800 }],
      series: [series(3000, 0), series(2200, 0), series(3000, 0.2), series(3000, 0, 40)],
    };
    const when = () => (t0 + 3600) * 1000;
    const r = wxRows(cache, when, 0);
    expect(r.map((x) => x.state)).toEqual(['', 'line', 'lies', '']);
    expect(r[1].snowLine).toBe(2200 - SNOW_BELOW_FREEZING_M);
    expect(r.every((x) => x.planned)).toBe(true);
    expect(snowStretches(r, 400)).toEqual([{ fromKm: 50, toKm: 250, state: 'lies' }]);
    expect(windiest(r)).toMatchObject({ km: 300, wind: 45 });
    expect(windArrows(r)[0]).toEqual({ lat: 46, lon: 7, deg: 90, label: '15' });
    // the plan is outside the forecast: the rows are for now
    const r2 = wxRows(cache, () => 0, (t0 + 3600) * 1000);
    expect(r2).toHaveLength(4);
    expect(r2.every((x) => !x.planned)).toBe(true);
    expect(wxRows(null)).toEqual([]);
  });
  it('a cached answer gets old', () => {
    const now = Date.parse('2026-10-19T12:00:00Z');
    expect(isOld('2026-10-19T11:00:00Z', 2, now)).toBe(false);
    expect(isOld('2026-10-19T08:00:00Z', 2, now)).toBe(true);
    expect(isOld(null)).toBe(true);
  });
});

describe('the sample race on the map', () => {
  it('its stops sit on the route', () => {
    for (const p of samplePois(route).slice(0, 40)) expect(kmNear(pts, p, 1), p.name).not.toBeNull();
  });
});
