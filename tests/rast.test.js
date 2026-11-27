import { describe, it, expect } from 'vitest';
import { restStops, REST_RANGE_KM } from '../src/lib/live/rast.js';

const NOW = Date.UTC(2027, 5, 12, 10, 0); // a Saturday, 12:00 in Zurich
const poi = (id, kind, km, offKm = 0, extra = {}) => ({ id, kind, name: id, lat: 47, lon: 8, km, offKm, ...extra });

describe('Rast suchen', () => {
  it('lists the places of the next 20 km, shortest detour first, at most three', () => {
    const pois = [poi('a', 'shop', 5, 0.6), poi('b', 'food', 8, 0.1), poi('c', 'fuel', 12, 0.3), poi('d', 'water', 15, 0.0), poi('e', 'shop', 30, 0)];
    const r = restStops({ pois, km: 2, now: NOW });
    expect(r.rows.map((x) => x.id)).toEqual(['d', 'b', 'c']);
    expect(r.rows[0].detourKm).toBe(0);
    expect(r.rows[1].detourKm).toBe(0.2);
    expect(r.next.id).toBe('e'); // the next place beyond the range
  });
  it('leaves out places behind you, beds, stations and the like', () => {
    const pois = [poi('behind', 'shop', 1), poi('bed', 'sleep', 6), poi('st', 'station', 6), poi('ok', 'shop', 7, 0.2)];
    expect(restStops({ pois, km: 3, now: NOW }).rows.map((x) => x.id)).toEqual(['ok']);
  });
  it('puts a place that is closed when you get there last', () => {
    const pois = [poi('shut', 'shop', 5, 0, { hours: 'Mo-Sa 15:00-18:00' }), poi('far', 'shop', 12, 0.4, { hours: 'Mo-Sa 07:00-20:00' }), poi('unknown', 'food', 14, 0.8)];
    const r = restStops({ pois, km: 4, now: NOW });
    expect(r.rows.map((x) => x.id)).toEqual(['far', 'unknown', 'shut']);
    expect(r.rows[0].open.open).toBe(true);
    expect(r.rows[2].open.open).toBe(false);
  });
  it('has an arrival time and no rows without a place; no km, no answer', () => {
    const r = restStops({ pois: [poi('a', 'shop', 10, 0)], km: 0, now: NOW, pace: { kmh: 20 } });
    expect(r.rows[0].eta).toBeGreaterThan(NOW);
    expect(restStops({ pois: [], km: 0, now: NOW })).toEqual({ rows: [], next: null });
    expect(restStops({ pois: [poi('a', 'shop', 1)], km: null })).toEqual({ rows: [], next: null });
    expect(REST_RANGE_KM).toBe(20);
  });
});
