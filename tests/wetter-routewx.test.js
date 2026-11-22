// «Wetter entlang der Route» (Wetter-Ausbau A und G, Noah 22.11.2026 «a»): headwind share, coldest point, extra pack hints, webcams on the route.
import { describe, it, expect } from 'vitest';
import { headShare, coldest, routeHints, camsAlong, dayRows, tripPace, rowBefore } from '../src/lib/wetter/routewx.js';

const row = (km, temp, kind, extra = {}) => ({ km, temp, kind, w: true, rainP: 10, rainMm: 0, wind: 10, gust: 15, eta: 1000 + km, ...extra });
const rows = [row(0, 4, 'tail'), row(28, 3, 'head'), row(55, -1, 'head'), row(80, 6, 'tail', { rainP: 70, rainMm: 0.8 }), row(104, 7, 'tail')];

describe('headShare', () => {
  it('counts the points with headwind in percent', () => expect(headShare(rows)).toBe(40));
  it('ignores points without a forecast and gives null without any', () => {
    expect(headShare([{ km: 0, w: false }])).toBeNull();
    expect(headShare([])).toBeNull();
    expect(headShare([...rows, { km: 120, w: false }])).toBe(40);
  });
});

describe('coldest', () => {
  it('finds the coldest point', () => expect(coldest(rows)).toEqual({ km: 55, temp: -1, eta: 1055 }));
  it('is null without a forecast', () => expect(coldest([{ km: 0, w: false }])).toBeNull());
});

describe('routeHints', () => {
  it('adds what the cold pass asks for beyond the start', () => {
    const keys = routeHints(rows, ['longgloves']).map((h) => h.key);
    expect(keys).not.toContain('longgloves');
    expect(keys).toContain('overshoes');
    expect(keys).toContain('rainjacket');
  });
  it('never adds the layer to take off', () => expect(routeHints(rows).map((h) => h.key)).not.toContain('layer'));
  it('says nothing without a forecast', () => expect(routeHints([{ km: 0, w: false }])).toEqual([]));
});

describe('dayRows and tripPace', () => {
  it('cuts a route of several days to its first day', () => expect(dayRows(rows, 60).map((r) => r.km)).toEqual([0, 28, 55]));
  it('keeps all rows without a day length', () => expect(dayRows(rows, null)).toHaveLength(5));
  it('works out the km of a day and a pace', () => {
    const p = tripPace({ days: 2, route: { km: 200, gainM: 1200 } });
    expect(p.dayKm).toBe(100);
    expect(p.kmh).toBeGreaterThan(8);
    expect(p.kmh).toBeLessThan(25);
    expect(tripPace({ route: null })).toEqual({ dayKm: null, kmh: null });
  });
});

describe('camsAlong', () => {
  // a line running east along 47.0 N, 1 km per 0.0132 degrees of longitude
  const pts = Array.from({ length: 11 }, (_, i) => ({ lat: 47, lon: 7 + i * 0.0132 * 10, km: i * 10 }));
  const cam = (id, lat, lon) => ({ id, name: id, url: 'https://example.org/' + id, place: { name: id, lat, lon } });
  it('finds the cams near the line, in route order, each once', () => {
    const r = camsAlong([cam('pass', 47.005, 7 + 0.132 * 7), cam('lake', 47.001, 7 + 0.132 * 2), cam('far', 47.2, 7.5), { id: 'noplace', name: 'x', url: '' }], pts);
    expect(r.map((x) => x.cam.id)).toEqual(['lake', 'pass']);
    expect(r[0].km).toBe(20);
    expect(r[1].offKm).toBeLessThan(2);
  });
  it('can look only at one stretch', () => {
    const r = camsAlong([cam('lake', 47.001, 7 + 0.132 * 2), cam('pass', 47.005, 7 + 0.132 * 7)], pts, 2, 50, 100);
    expect(r.map((x) => x.cam.id)).toEqual(['pass']);
  });
  it('is empty without a line or cams', () => {
    expect(camsAlong([cam('a', 47, 7)], [])).toEqual([]);
    expect(camsAlong([], pts)).toEqual([]);
  });
});

describe('rowBefore', () => {
  it('gives the last point at or before the km', () => {
    expect(rowBefore(rows, 60).km).toBe(55);
    expect(rowBefore(rows, 28).km).toBe(28);
    expect(rowBefore(rows, -5)).toBeNull();
  });
});
