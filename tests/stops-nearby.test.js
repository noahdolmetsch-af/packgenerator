// «Stopps in der Nähe» (Noah 24.10.2026 «1a 2a 3a 4b 5a»): the helpers of the stops page and the new kinds
// (WC, cash, pharmacy, pump). Fictional data only.
import { describe, it, expect } from 'vitest';
import { STOP_KINDS, kindsOn, flipKind, tripsWithRoute, placeOnRoute, ptsOfTrip, stopsHref } from '../src/lib/stops/nearby.js';
import { kindOf, poiQuery, POI_KIND } from '../src/lib/race/outside.js';
import { aroundQuery } from '../src/lib/live/live-lib.js';

const line = Array.from({ length: 21 }, (_, i) => [47 + i * 0.009, 8.5]); // about 20 km north
const trip = (id, startDate, endDate, withLine = true) => ({ id, title: `test_data_gtp_ ${id}`, startDate, endDate, route: withLine ? { line, km: 20 } : null });

describe('the kinds', () => {
  it('knows the new kinds and asks OpenStreetMap for them', () => {
    expect(kindOf({ amenity: 'atm' })).toBe('atm');
    expect(kindOf({ amenity: 'bank', atm: 'yes' })).toBe('atm');
    expect(kindOf({ amenity: 'pharmacy' })).toBe('pharmacy');
    expect(kindOf({ healthcare: 'pharmacy', shop: 'chemist' })).toBe('pharmacy');
    expect(kindOf({ amenity: 'bicycle_repair_station' })).toBe('repair');
    expect(kindOf({ amenity: 'compressed_air' })).toBe('repair');
    expect(kindOf({ shop: 'bicycle', 'service:bicycle:pump': 'yes' })).toBe('bike');
    for (const k of STOP_KINDS) expect(POI_KIND[k], k).toBeTruthy();
    const pts = line.map(([lat, lon], i) => ({ lat, lon, km: i }));
    for (const q of [poiQuery(pts), aroundQuery({ lat: 47, lon: 8.5 })]) {
      for (const tag of ['"amenity"="atm"', '"amenity"="pharmacy"', '"amenity"="bicycle_repair_station"', '"amenity"="toilets"', '"amenity"="fuel"']) expect(q).toContain(tag);
    }
  });
  it('switches kinds, never all off', () => {
    expect(kindsOn(null)).toEqual(STOP_KINDS);
    let v = flipKind(null, 'water');
    expect(kindsOn(v)).not.toContain('water');
    v = flipKind(v, 'water');
    expect(kindsOn(v)).toEqual(STOP_KINDS);
    for (const k of STOP_KINDS) v = flipKind(v, k);
    expect(kindsOn(v)).toHaveLength(1);
  });
});

describe('the trips and where you are', () => {
  it('lists coming trips with a route first, then past ones', () => {
    const list = tripsWithRoute([trip('old', '2026-09-01', '2026-09-02'), trip('next', '2026-11-01'), trip('now', '2026-10-24', '2026-10-25'), trip('none', '2026-10-30', '', false)], '2026-10-24');
    expect(list.map((x) => x.id)).toEqual(['now', 'next', 'old']);
  });
  it('finds your km on the route only when you are near it', () => {
    const pts = ptsOfTrip(trip('a', '2026-10-24'));
    const at = placeOnRoute(pts, { lat: 47.045, lon: 8.501 });
    expect(at.km).toBeGreaterThan(4);
    expect(at.km).toBeLessThan(6);
    expect(placeOnRoute(pts, { lat: 46.5, lon: 8.5 })).toBeNull();
    expect(placeOnRoute(pts, null)).toBeNull();
  });
  it('links to the page', () => {
    expect(stopsHref()).toBe('#/stopps');
    expect(stopsHref({ id: 't 1' })).toBe('#/stopps?trip=t%201');
  });
});
