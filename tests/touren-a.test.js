// Touren-Ideen 41–49 (996 Ideen, Noah 25.10.2026), the small ones: 41 Route prüfen, 42 Wartezeit,
// 43 Was hätte gefehlt, 46 Plan B mit Auslöser, 48 Offline-Karte mit Reserve. Fictional data only.
import { describe, it, expect } from 'vitest';
import { routeCheck, checkLines, JUMP_KM } from '../src/lib/route/check.js';
import { routeFromGpx, splitRoute } from '../src/lib/route/fromgpx.js';
import { parseGpx } from '../src/lib/route.js';
import { waitChill, WAIT_CHOICES, onionCheck } from '../src/lib/wardrobe.js';
import { leftOutPatch, leftOutToAsk, LEFT_MAX } from '../src/lib/pack/leftout.js';
import { badWeather, triggerOf, triggerText, planBOf } from '../src/lib/haustuer/haustuer.js';
import { reserveOf, planStrip, RESERVE_MAX } from '../src/lib/map/offline.js';
import de from '../src/lib/i18n/de/tourena.js';
import DE from '../src/lib/i18n/de/index.js';

const tr = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m);

// a straight line going east, a point every ~76 m (0.001° lon at 46.9°)
const east = (n, lat = 46.9, lon0 = 7.4, step = 0.001, ele = (i) => 500 + i) => Array.from({ length: n }, (_, i) => ({ lat, lon: lon0 + i * step, ele: ele(i) }));
const gpxOf = (pts, tag = 'trkpt') =>
  `<gpx><trk><name>test_data_gtp_Route</name><trkseg>${pts.map((p) => `<${tag} lat="${p.lat}" lon="${p.lon}">${p.ele == null ? '' : `<ele>${p.ele}</ele>`}</${tag}>`).join('')}</trkseg></trk></gpx>`;

describe('41 Route prüfen', () => {
  it('a clean route has no hints', () => {
    const c = routeCheck({ points: east(100), kind: 'trk' });
    expect(c.ok).toBe(true);
    expect(c.count).toBe(0);
    expect(checkLines(c, tr)).toEqual([]);
  });

  it('finds a jump between two track points, not between route points', () => {
    const pts = [...east(50), ...east(50, 46.9, 7.5)]; // 0.451° → about 34 km gap
    const c = routeCheck({ points: pts, kind: 'trk' });
    expect(c.jumps).toHaveLength(1);
    expect(c.jumps[0].gapKm).toBeGreaterThan(JUMP_KM);
    expect(c.jumps[0].km).toBeCloseTo(3.7, 0);
    expect(routeCheck({ points: pts, kind: 'rte' }).jumps).toEqual([]);
    expect(checkLines(c, tr)[0]).toEqual({ key: 'jumps', text: expect.stringContaining('A jump of') });
  });

  it('finds a there-and-back piece as one loop, but not a round trip back to the start', () => {
    const out = east(60);
    const back = [...out].reverse().slice(1).map((p) => ({ ...p, lat: p.lat + 0.0001 }));
    const there = routeCheck({ points: [...out, ...back, ...east(60, 46.95, 7.4).slice(0, 1)], kind: 'trk' });
    // out and back again 4.5 km: passes the same places twice, one stretch
    const c = routeCheck({ points: [...out, ...back.slice(0, 40)], kind: 'trk' });
    expect(c.loops).toHaveLength(1);
    expect(c.loops[0].againKm).toBeGreaterThan(c.loops[0].km);
    expect(there.loops.length).toBeGreaterThanOrEqual(1);
    // a round trip: a square back to its start
    const sq = [...east(30), ...Array.from({ length: 30 }, (_, i) => ({ lat: 46.9 + i * 0.0007, lon: 7.429 })), ...Array.from({ length: 30 }, (_, i) => ({ lat: 46.9203, lon: 7.429 - i * 0.001 })), ...Array.from({ length: 30 }, (_, i) => ({ lat: 46.9203 - i * 0.0007, lon: 7.4 }))].map((p) => ({ ...p, ele: 600 }));
    expect(routeCheck({ points: sq, kind: 'trk' }).loops).toEqual([]);
  });

  it('missing heights: none at all, or on a part of the route', () => {
    expect(routeCheck({ points: east(50, 46.9, 7.4, 0.001, () => null), kind: 'trk' }).ele).toBe('none');
    const part = routeCheck({ points: east(50, 46.9, 7.4, 0.001, (i) => (i % 3 ? 500 : null)), kind: 'trk' });
    expect(part.ele).toBe('part');
    expect(part.elePct).toBe(34);
    expect(checkLines(part, tr).map((l) => l.key)).toEqual(['ele']);
    expect(routeCheck({ points: east(50, 46.9, 7.4, 0.001, (i) => (i === 3 ? null : 500)), kind: 'trk' }).ele).toBe('ok');
  });

  it('parseGpx tells track from route points; routeFromGpx carries the check, splitRoute keeps it out of the trip', () => {
    expect(parseGpx(gpxOf(east(3))).kind).toBe('trk');
    expect(parseGpx(gpxOf(east(3), 'rtept').replace(/<trkseg>|<\/trkseg>/g, '').replace('<trk>', '<rte>').replace('</trk>', '</rte>')).kind).toBe('rte');
    const r = routeFromGpx(gpxOf(east(50, 46.9, 7.4, 0.001, () => null)), 'test.gpx');
    expect(r.check.ele).toBe('none');
    const { route, check } = splitRoute(r);
    expect(check.ok).toBe(false);
    expect(route).not.toHaveProperty('check');
    expect(route.km).toBe(r.km);
  });
});

describe('42 Kleider für Wartezeiten', () => {
  it('standing still counts colder: 0, 1, 2 or 3 degrees', () => {
    expect(WAIT_CHOICES).toEqual([0, 15, 30, 60]);
    expect([undefined, 0, 15, 30, 60, 90].map((m) => waitChill({ waitMin: m }))).toEqual([0, 0, 1, 2, 3, 3]);
  });
  it('the onion check needs warmer layers with the wait added', () => {
    const items = [{ id: 'b', name: 'test_data_gtp_Shirt', layer: 'base', ownership: 'owned' }, { id: 'm', name: 'test_data_gtp_Fleece', layer: 'mid', tempMin: 14, ownership: 'owned' }];
    const trip = { wx: { min: 15 }, entries: [{ itemId: 'b' }] };
    expect(onionCheck(trip, items, 0).rows.find((r) => r.key === 'mid')).toBeUndefined();
    const cold = onionCheck(trip, items, waitChill({ waitMin: 30 }));
    expect(cold.c).toBe(13);
    expect(cold.rows.find((r) => r.key === 'mid').ok).toBe(false);
  });
});

describe('43 Was hätte gefehlt?', () => {
  const at = '2026-10-26T10:00:00.000Z';
  it('remembers what leaves the list, forgets what comes back', () => {
    const before = { entries: [{ itemId: 'a' }, { itemId: 'b' }] };
    const p = leftOutPatch(before, { entries: [{ itemId: 'a' }] }, at);
    expect(p).toEqual({ leftOut: [{ itemId: 'b', at }] });
    expect(leftOutPatch({ ...before, ...p, entries: [{ itemId: 'a' }] }, { entries: [{ itemId: 'a' }, { itemId: 'b' }] }, at)).toEqual({ leftOut: [] });
    expect(leftOutPatch(before, { title: 'x' })).toEqual({});
    expect(leftOutPatch(before, { entries: [...before.entries, { itemId: 'c' }] })).toEqual({});
  });
  it('keeps at most LEFT_MAX', () => {
    const entries = Array.from({ length: LEFT_MAX + 5 }, (_, i) => ({ itemId: `i${i}` }));
    expect(leftOutPatch({ entries }, { entries: [] }, at).leftOut).toHaveLength(LEFT_MAX);
  });
  it('asks about items still in the gear, not on the list and not named yet, newest first', () => {
    const items = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C', ownership: 'gone' }, { id: 'd', name: 'D' }];
    const trip = { entries: [{ itemId: 'd' }], leftOut: [{ itemId: 'a' }, { itemId: 'b' }, { itemId: 'c' }, { itemId: 'd' }, { itemId: 'x' }] };
    expect(leftOutToAsk(trip, items, []).map((i) => i.id)).toEqual(['b', 'a']);
    expect(leftOutToAsk(trip, items, [{ itemId: 'b' }]).map((i) => i.id)).toEqual(['a']);
    expect(leftOutToAsk({}, items)).toEqual([]);
  });
});

describe('46 Plan B mit Auslöser', () => {
  const hours = (mm, gust = 20) => Array.from({ length: 10 }, () => ({ rainMm: mm / 10, rainPct: 40, gust }));
  it('without a trigger the app rule stays', () => {
    expect(badWeather(hours(6))).toBe(null);
    expect(badWeather(hours(9))).toMatchObject({ rain: true, own: false });
  });
  it('your own rain trigger replaces the rule (both ways)', () => {
    expect(badWeather(hours(6), { mm: 5 })).toMatchObject({ rain: true, own: true });
    expect(badWeather(hours(9), { mm: 10 })).toBe(null);
    expect(badWeather(hours(0, 45), { gust: 40 })).toMatchObject({ storm: true, own: true });
    expect(badWeather(hours(0, 55), { gust: 70 })).toBe(null);
  });
  it('triggerOf and the words', () => {
    expect(triggerOf(null)).toEqual({ mm: null, gust: null });
    expect(triggerOf({ mm: '10', gust: '' })).toEqual({ mm: 10, gust: null });
    expect(triggerText({ mm: 10, gust: 50 }, tr)).toBe('from 10 mm of rain a day · from gusts of 50 km/h');
    expect(triggerText({}, tr)).toBe('');
    expect(planBOf({ planB: { kind: 'train', trigger: { mm: 20 } } }).trigger).toEqual({ mm: 20, gust: null });
  });
});

describe('48 Offline-Karte mit Reserve', () => {
  const line = Array.from({ length: 20 }, (_, i) => [46.9, 7.4 + i * 0.01]);
  it('the reserve: plan B line and the fallback places of the GPX', () => {
    expect(reserveOf({ route: { line } })).toBe(null);
    const trip = { route: { line, wpts: [{ kind: 'station', lat: 46.95, lon: 7.45 }, { kind: 'water', lat: 46.9, lon: 7.41 }, { kind: 'sleep', lat: 46.85, lon: 7.5 }] }, planB: { route: { line: [[46.9, 7.4], [46.8, 7.4]] } } };
    const r = reserveOf(trip);
    expect(r.planB).toBe(true);
    expect(r.places).toBe(2);
    expect(r.spots).toEqual([[46.95, 7.45], [46.85, 7.5]]);
    const many = { route: { line, wpts: Array.from({ length: 20 }, (_, i) => ({ kind: 'hospital', lat: 46.9, lon: 7.4 + i * 0.01 })) } };
    expect(reserveOf(many).places).toBe(RESERVE_MAX);
  });
  it('a strip with reserve has more tiles, none twice', () => {
    const trip = { route: { line, wpts: [{ kind: 'station', lat: 47.0, lon: 7.45 }] }, planB: { route: { line: [[46.9, 7.4], [46.8, 7.4]] } } };
    const plain = planStrip(line, { ground: 'vector', bufferKm: 1, cap: 1e9 });
    const more = planStrip(line, { ground: 'vector', bufferKm: 1, cap: 1e9, reserve: reserveOf(trip) });
    expect(more.count).toBeGreaterThan(plain.count);
    expect(new Set(more.tiles.map((x) => `${x.z}/${x.x}/${x.y}`)).size).toBe(more.count);
  });
});

describe('German texts', () => {
  it('every key is in the German dictionary, with its placeholders', () => {
    for (const [k, v] of Object.entries(de)) {
      expect(DE[k]).toBe(v);
      for (const ph of k.match(/\{\w+\}/g) ?? []) expect(v).toContain(ph);
      expect(v).not.toContain('ß');
    }
  });
});
