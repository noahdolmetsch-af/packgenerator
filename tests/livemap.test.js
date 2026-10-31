// Paket U3 «Live-Karte» neu (Noah 19.10.2026 «1a und b 2b 3b 4b 5a»): the pure parts of the full-screen
// live map (src/lib/live/livemap.js) and the map symbols (src/lib/map/symbols.js). Fictional data only.
import { describe, it, expect } from 'vitest';
import * as L from '../src/lib/live/livemap.js';
import { KIND_ICON, ICON_SVG, SEARCH_KINDS, SYMBOL_KINDS, symbolId, symbolSvg } from '../src/lib/map/symbols.js';
import { KIND_TOKEN } from '../src/lib/map/maplib.js';
import { lineKm } from '../src/lib/race/race.js';
import { sampleRoute } from '../src/lib/race/sample.js';

describe('the numbers on top', () => {
  it('three at the start, up to six, known keys only, no doubles', () => {
    expect(L.tilesOf(undefined)).toEqual(['done', 'left', 'arrive']);
    expect(L.tilesOf(['clock', 'x', 'clock', 'speed'])).toEqual(['clock', 'speed']);
    expect(L.tilesOf(L.LIVE_TILES.map((x) => x.key))).toHaveLength(L.MAX_TILES);
    let list = L.tilesOf(null);
    for (const k of ['clock', 'speed', 'height', 'grade']) list = L.toggleTile(list, k);
    expect(list).toHaveLength(6);
    expect(L.toggleTile(['done'], 'done')).toEqual(['done']);
    expect(L.moveTile(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(L.moveTile(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });
  it('the values: km, left, arrival, riding time, gradient, plan', () => {
    const now = new Date('2026-06-20T10:00:00').getTime();
    const v = L.tileValues({ now, km: 412.34, left: 591.7, eta: now + 3 * 36e5, movingS: 3 * 3600 + 5 * 60, kmh: 21.37, speed: 5, height: 1230.4, grade: 7.6, top: { distKm: 2.44 }, stop: null, lightMin: 95, delta: -75 });
    expect(v.done.value).toBe('412.3');
    expect(v.left.value).toBe('592');
    expect(v.arrive.value).toBe('13:00');
    expect(v.moving.value).toBe('3:05');
    expect(v.speed.value).toBe('18');
    expect(v.avg.value).toBe('21.4');
    expect(v.height.value).toBe('1230');
    expect(v.grade.value).toBe('+8');
    expect(v.top.value).toBe('2.4');
    expect(v.stop.value).toBe('–');
    expect(v.light.value).toBe('1:35');
    expect(v.plan.value).toBe('−1:15');
    expect(L.tileValues({ ridden: 3.217 }).done).toMatchObject({ value: '3.21', unit: 'km' });
  });
  it('the distance in metres up to 1 km, then km with 2 decimals; the time since the start as a timer (Noah 28.10.2026)', () => {
    expect(L.tileValues({ ridden: 0.4567 }).done).toMatchObject({ value: '457', unit: 'm' });
    expect(L.tileValues({ ridden: 1 }).done).toMatchObject({ value: '1.00', unit: 'km' });
    expect(L.tileValues({ ridden: 99.999 }).done.value).toBe('99.99');
    expect(L.tileValues({ totalS: 5 }).total.value).toBe('0:05');
    expect(L.tileValues({ totalS: 12 * 60 + 34 }).total.value).toBe('12:34');
    expect(L.tileValues({ totalS: 3600 + 2 * 60 + 3 }).total.value).toBe('1:02:03');
  });
});

describe('direction and view', () => {
  it('the bearing and your heading (from the fixes, none while standing)', () => {
    expect(L.bearing({ lat: 47, lon: 8 }, { lat: 48, lon: 8 })).toBe(0);
    expect(Math.round(L.bearing({ lat: 47, lon: 8 }, { lat: 47, lon: 7 }))).toBe(270);
    const a = { lat: 47, lon: 8 };
    expect(L.headingOf({ lat: 47.001, lon: 8 }, a)).toBe(0);
    expect(L.headingOf({ lat: 47.00001, lon: 8 }, a)).toBeNull();
    expect(L.headingOf({ lat: 47, lon: 8, heading: 90, speed: 5 }, a)).toBe(90);
    expect(L.headingOf(null, a)).toBeNull();
  });
  it('the start view: the next 20 km', () => {
    const pts = lineKm(sampleRoute());
    const l = L.aheadLine(pts, 410, 20);
    expect(l.length).toBeGreaterThan(2);
    expect(L.aheadLine([], 0)).toEqual([]);
  });
  it('the climbs ahead coloured, the rest plain; neighbours joined', () => {
    const r = sampleRoute();
    const pts = lineKm(r);
    const g = L.gradeLines(pts, r.profileFine, 600, 700);
    expect(g.length).toBeGreaterThan(5);
    for (const x of g) {
      expect(x.key).toMatch(/^u[1-5]$/);
      expect(x.colour).toMatch(/^#[0-9a-f]{6}$/);
      expect(x.line.length).toBeGreaterThan(1);
    }
    expect(L.gradeLines(pts, null, 0, 10)).toEqual([]);
  });
  it('the sheet: three heights and the nearest one', () => {
    const s = L.sheetSnaps(800);
    expect(s.peek).toBeLessThan(s.half);
    expect(s.half).toBeLessThan(s.full);
    expect(L.nearestSnap(150, s)).toBe('peek');
    expect(L.nearestSnap(700, s)).toBe('full');
  });
});

describe('the map symbols', () => {
  it('every kind of the place search, of the stops and of the plan has a symbol and a colour', () => {
    for (const k of [...SEARCH_KINDS, 'bed', 'depot', 'startfinish', 'own', 'other']) {
      expect(KIND_ICON[k], k).toBeTruthy();
      expect(ICON_SVG[KIND_ICON[k]], k).toMatch(/<(path|circle|rect|line|polyline)/);
      expect(KIND_TOKEN[k], k).toBeTruthy();
    }
    expect(KIND_ICON.shop).toBe('shopping-cart');
    expect(KIND_ICON.water).toBe('droplet');
    expect(KIND_ICON.station).toBe('train-front');
    expect(symbolId('nothing')).toBe('sym-other');
    expect(SYMBOL_KINDS).toContain('view');
    const svg = symbolSvg('water', '#3f7fbf', '#fbfbf8');
    expect(svg).toMatch(/^<svg xmlns/);
    expect(svg).toContain('#3f7fbf');
  });
});
