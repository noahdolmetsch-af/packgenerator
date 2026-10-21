// Paket X «Stopps als Wegpunkte für Garmin»: a route and its stops as one GPX (gpxstops.js).
import { describe, it, expect } from 'vitest';
import { stopsOf, routeGpx, kindsIn, STOP_KINDS_STD } from '../src/lib/gpxstops.js';

const route = { name: 'test_data_gtp_ Runde', line: [[47.1, 8.1], [47.2, 8.2], [47.3, 8.3]] };
const pts = [
  { lat: 47.25, lon: 8.25, name: 'test_data_gtp_ Laden', kind: 'shop', km: 30 },
  { lat: 47.15, lon: 8.15, name: '', kind: 'water', km: 10, note: 'km 10' },
  { lat: 47.15001, lon: 8.15001, name: 'twin', kind: 'water', km: 10.01 },
  { lat: 47.28, lon: 8.28, name: 'test_data_gtp_ Hotel', kind: 'sleep', km: 40 },
  { lat: null, lon: 8, name: 'no place', kind: 'shop' },
  { lat: 47.2, lon: 8.2, name: 'test_data_gtp_ Punkt', kind: 'mystery' },
];

describe('gpxstops.js', () => {
  it('keeps the chosen kinds, a twin once, in km order', () => {
    const s = stopsOf(pts, { kinds: STOP_KINDS_STD });
    expect(s.map((x) => x.kind)).toEqual(['water', 'shop']);
    expect(stopsOf(pts).map((x) => x.kind)).toEqual(['water', 'shop', 'sleep', 'own']);
    expect(kindsIn(pts)).toEqual(['shop', 'water', 'sleep', 'own']);
  });
  it('writes the track and the stops as waypoints with Garmin symbols', () => {
    const g = routeGpx(route, pts, { kinds: ['water', 'shop', 'sleep'], nameOf: (s) => `[${s.kind}]` });
    expect(g).toContain('<trkpt lat="47.1" lon="8.1">');
    expect((g.match(/<wpt /g) ?? []).length).toBe(3);
    expect(g).toContain('<name>[water]</name><desc>km 10</desc><sym>Drinking Water</sym>');
    expect(g).toContain('<name>test_data_gtp_ Laden</name><sym>Shopping Center</sym>');
    expect(g).toContain('<sym>Lodging</sym>');
    expect(g).toContain('<metadata><name>test_data_gtp_ Runde</name></metadata>');
    expect(g.indexOf('[water]')).toBeLessThan(g.indexOf('Laden'));
  });
});
