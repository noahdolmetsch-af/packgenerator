// Paket U «GPX auf der Live-Karte öffnen» (liveroute.js): thinning the line, reading a GPX, cleaning a
import { FINE_MAX, fineLine } from '../src/lib/route/fineline.js';
// stored value, rename, the trip offer, and keeping it in the settings record (fake-indexeddb).
// Synthetic GPX only: made-up coordinates, never a real route.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import 'fake-indexeddb/auto';
import {
  LIVE_ROUTE_KEY, LIVE_LINE_MAX, liveRouteFor, forRide, NAME_MAX, thinLine, cleanName, liveRouteOf, liveRouteFromText, cleanLiveRoute, renameLiveRoute, canSaveToTrip, asTripRoute,
  loadLiveRoute, saveLiveRoute, clearLiveRoute,
} from '../src/lib/live/liveroute.js';
import { createDb } from '../src/lib/db.js';
import { lineKm } from '../src/lib/race/race.js';
import DE from '../src/lib/i18n/de/index.js';
import LIVE_DE from '../src/lib/i18n/de/live-route.js';

/** A made-up GPX: n track points on a gentle zig-zag eastwards, climbing then descending. */
function gpx(n = 400, { name = 'Testrunde', ele = true } = {}) {
  const pts = Array.from({ length: n }, (_, i) => {
    const lat = (10 + Math.sin(i / 20) * 0.01).toFixed(6);
    const lon = (30 + i * 0.001).toFixed(6);
    const e = ele ? `<ele>${Math.round(500 + 200 * Math.sin((i / n) * Math.PI))}</ele>` : '';
    return `<trkpt lat="${lat}" lon="${lon}">${e}</trkpt>`;
  });
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk>${name ? `<name>${name}</name>` : ''}<trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}
const NOW = new Date('2026-06-01T08:00:00Z');

describe('thinning the line', () => {
  it('a straight line keeps only its ends', () => {
    const straight = Array.from({ length: 300 }, (_, i) => ({ lat: 10, lon: 30 + i * 0.0001 }));
    expect(thinLine(straight)).toEqual([[10, 30], [10, 30.0299]]);
    // a long one is cut into windows of 400 points: only their ends stay
    expect(thinLine(Array.from({ length: 1000 }, (_, i) => ({ lat: 10, lon: 30 + i * 0.0001 })))).toHaveLength(4);
  });
  it('the bends stay (Douglas–Peucker), within a few metres', () => {
    const corner = [...Array.from({ length: 50 }, (_, i) => [10, 30 + i * 0.0002]), ...Array.from({ length: 50 }, (_, i) => [10 + (i + 1) * 0.0002, 30 + 49 * 0.0002])];
    const out = thinLine(corner);
    expect(out).toHaveLength(3);
    expect(out[1]).toEqual([10, 30.0098]);
  });
  it('never more than max points, first and last kept', () => {
    const wiggle = Array.from({ length: 20000 }, (_, i) => [10 + (i % 2) * 0.001, 30 + i * 0.0005]);
    const out = thinLine(wiggle);
    expect(out.length).toBe(LIVE_LINE_MAX);
    expect(out[0]).toEqual([10, 30]);
    expect(out.at(-1)).toEqual(wiggle.at(-1).map((v) => Math.round(v * 1e5) / 1e5));
    expect(thinLine(wiggle, 50)).toHaveLength(50);
  });
  it('broken points are left out', () => {
    expect(thinLine([[10, 30], ['x', 1], [999, 1], { lat: 10.1, lon: 30.1 }])).toEqual([[10, 30], [10.1, 30.1]]);
    expect(thinLine([])).toEqual([]);
  });
});

describe('a GPX becomes the live route', () => {
  it('name, km, climbing, profile, a thinned line and when it was loaded', () => {
    const r = liveRouteFromText(gpx(), 'export.gpx', NOW);
    expect(r.name).toBe('Testrunde');
    expect(r.km).toBeGreaterThan(40);
    expect(r.km).toBeLessThan(50);
    expect(r.gainM).toBeGreaterThan(150);
    expect(r.profile.length).toBeGreaterThan(10);
    expect(r.line.length).toBeGreaterThan(10);
    expect(r.line.length).toBeLessThan(400);
    expect(r.loadedAt).toBe('2026-06-01T08:00:00.000Z');
    expect(r.file).toBe('export.gpx');
    // km along the thinned line ≈ the route's km
    const pts = lineKm(r);
    expect(pts.at(-1).km).toBeCloseTo(r.km, 5);
  });
  it('without a name in the file: the file name', () => {
    expect(liveRouteFromText(gpx(50, { name: '' }), 'Abendrunde.gpx', NOW).name).toBe('Abendrunde');
  });
  it('without heights: no profile, still a route', () => {
    const r = liveRouteFromText(gpx(50, { ele: false }), 'x.gpx', NOW);
    expect(r.profile).toEqual([]);
    expect(r.gainM).toBe(0);
    expect(r.km).toBeGreaterThan(0);
  });
  it('not a GPX or an empty track: the plain message of route.js', () => {
    expect(() => liveRouteFromText('<html></html>', 'a.gpx')).toThrow();
    expect(() => liveRouteFromText('<gpx></gpx>', 'a.gpx')).toThrow();
  });
  it('a big file stays small enough for the settings record', () => {
    const r = liveRouteOf({ name: 'Lang', points: Array.from({ length: 60000 }, (_, i) => ({ lat: 10 + Math.sin(i / 7) * 0.002, lon: 30 + i * 0.0003, ele: 400 + (i % 50) })) }, 'lang.gpx', NOW);
    expect(r.line.length).toBeLessThanOrEqual(LIVE_LINE_MAX);
    expect(JSON.stringify({ ...r, profileFine: null }).length).toBeLessThan(60_000);
  });
});

describe('a stored value', () => {
  const r = liveRouteFromText(gpx(), 'export.gpx', NOW);
  it('a good one comes back the same', () => {
    expect(cleanLiveRoute(r)).toEqual(r);
  });
  it('broken ones are null', () => {
    expect(cleanLiveRoute(null)).toBeNull();
    expect(cleanLiveRoute({})).toBeNull();
    expect(cleanLiveRoute({ line: [[10, 30]] })).toBeNull();
    expect(cleanLiveRoute({ line: [[10, 30], [10, 30]] })).toBeNull(); // 0 km
  });
  it('missing km are counted from the line, missing ends taken from it', () => {
    const c = cleanLiveRoute({ name: '  Alte   Runde ', line: [[10, 30], [10, 30.1]] });
    expect(c.name).toBe('Alte Runde');
    expect(c.km).toBeCloseTo(10.9, 0);
    expect(c.start).toEqual({ lat: 10, lon: 30 });
    expect(c.end).toEqual({ lat: 10, lon: 30.1 });
  });
});

// Noah 28.10.2026: a new trip without a route had the GPX of an old ride
describe('the GPX counts only for the ride it was opened for', () => {
  const r = liveRouteFromText(gpx(), 'export.gpx', NOW);
  it('opened without a trip: only for a ride without a trip (also an old one stored before forTrip)', () => {
    expect(liveRouteFor(r, null)).toBe(r);
    expect(liveRouteFor(r, '')).toBe(r);
    expect(liveRouteFor(r, 'trip-1')).toBeNull();
    const old = cleanLiveRoute({ name: 'Alt', line: [[10, 30], [10, 30.1]] });
    expect(old.forTrip).toBe('');
    expect(liveRouteFor(old, 'trip-1')).toBeNull();
  });
  it('opened for a trip: only for that trip; loaded for another ride it moves there', () => {
    const t1 = forRide(r, 'trip-1');
    expect(cleanLiveRoute(t1).forTrip).toBe('trip-1');
    expect(liveRouteFor(t1, 'trip-1')).toBe(t1);
    expect(liveRouteFor(t1, 'trip-2')).toBeNull();
    expect(liveRouteFor(t1, null)).toBeNull();
    expect(liveRouteFor(forRide(t1, null), null)?.name).toBe(r.name);
    expect(liveRouteFor(null, null)).toBeNull();
    expect(renameLiveRoute(t1, 'Neu').forTrip).toBe('trip-1');
  });
});

describe('rename and the trip offer', () => {
  const r = liveRouteFromText(gpx(), 'export.gpx', NOW);
  it('rename: trimmed, at most NAME_MAX; empty keeps the old name', () => {
    expect(renameLiveRoute(r, '  Seerunde  ').name).toBe('Seerunde');
    expect(renameLiveRoute(r, '   ').name).toBe('Testrunde');
    expect(renameLiveRoute(r, 'x'.repeat(200)).name).toHaveLength(NAME_MAX);
    expect(cleanName('a\n b')).toBe('a b');
  });
  it('offered only to a trip without a route of its own', () => {
    expect(canSaveToTrip(null)).toBe(false);
    expect(canSaveToTrip({ id: 't1' })).toBe(true);
    expect(canSaveToTrip({ id: 't1', route: null })).toBe(true);
    expect(canSaveToTrip({ id: 't1', route: { km: 80, line: [[1, 2], [3, 4]] } })).toBe(false);
  });
  it('as trip.route: the line keeps its bends (≤ FINE_MAX), profile ≤ 300, the numbers kept', () => {
    const big = liveRouteOf({ name: 'Lang', points: Array.from({ length: 20000 }, (_, i) => ({ lat: 10 + Math.sin(i / 7) * 0.002, lon: 30 + i * 0.0003, ele: 400 + (i % 50) })) }, 'lang.gpx', NOW);
    const tr = asTripRoute(big);
    expect(tr.line.length).toBeGreaterThan(200);
    expect(tr.line.length).toBeLessThanOrEqual(FINE_MAX);
    expect(tr.profile.length).toBeLessThanOrEqual(300);
    expect(tr).toMatchObject({ name: 'Lang', km: big.km, gainM: big.gainM, start: big.start, end: big.end, file: 'lang.gpx' });
    expect(asTripRoute(null)).toBeNull();
  });
});

describe('kept on this device (settings record)', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`liveroute-${Math.random()}`);
    await db.open();
  });
  it('save, load, replace (returns the one before), clear', async () => {
    expect(await loadLiveRoute(db.settings)).toBeNull();
    const a = liveRouteFromText(gpx(), 'a.gpx', NOW);
    expect(await saveLiveRoute(db.settings, a)).toBeNull();
    expect((await db.settings.get(LIVE_ROUTE_KEY)).value.name).toBe('Testrunde');
    expect(await loadLiveRoute(db.settings)).toEqual(a);
    const b = renameLiveRoute(a, 'Zweite');
    expect((await saveLiveRoute(db.settings, b)).name).toBe('Testrunde');
    expect((await loadLiveRoute(db.settings)).name).toBe('Zweite');
    expect((await clearLiveRoute(db.settings)).name).toBe('Zweite');
    expect(await loadLiveRoute(db.settings)).toBeNull();
    // Undo: put it back
    await saveLiveRoute(db.settings, b);
    expect((await loadLiveRoute(db.settings)).name).toBe('Zweite');
  });
  it('a broken value is refused, a broken stored value reads as none', async () => {
    await expect(saveLiveRoute(db.settings, { line: [] })).rejects.toThrow();
    await db.settings.put({ key: LIVE_ROUTE_KEY, value: { line: 'x' } });
    expect(await loadLiveRoute(db.settings)).toBeNull();
  });
});

describe('German', () => {
  it('every text of LiveRouteBox has German with the same placeholders', () => {
    const de = { ...DE, ...LIVE_DE };
    const text = readFileSync(new URL('../src/lib/live/LiveRouteBox.svelte', import.meta.url), 'utf8');
    const keys = [...text.matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2].replace(/\\'/g, "'"));
    const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    expect(keys.length).toBeGreaterThan(10);
    expect(keys.filter((k) => !de[k] || ph(k) !== ph(de[k]))).toEqual([]);
  });
});
