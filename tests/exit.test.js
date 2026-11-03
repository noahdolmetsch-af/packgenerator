import { describe, it, expect } from 'vitest';
import { nearestExit } from '../src/lib/live/exit.js';

const NOW = Date.UTC(2026, 6, 10, 10, 0);
const st = (km, extra = {}) => ({ kind: 'station', km, name: `Bahnhof ${km}`, lat: 46, lon: 8, ...extra });

describe('nearestExit', () => {
  it('needs a position', () => {
    expect(nearestExit({ pois: [], km: null })).toBeNull();
  });
  it('gives the nearest station ahead and the nearest behind', () => {
    const r = nearestExit({ pois: [st(5), st(30), st(60), { kind: 'shop', km: 41 }], km: 40, now: NOW, pace: { kmh: 20 } });
    expect(r.ahead.poi.km).toBe(60);
    expect(r.ahead.distKm).toBe(20);
    expect(r.ahead.eta).toBe(NOW + 36e5);
    expect(r.behind.poi.km).toBe(30);
    expect(r.behind.distKm).toBe(10);
    expect(r.behind.eta).toBeUndefined();
  });
  it('counts the way off the route and ignores stations out of range', () => {
    const r = nearestExit({ pois: [st(50, { offKm: 6 }), st(55, { offKm: 0.5 }), st(400)], km: 40, now: NOW });
    expect(r.ahead.poi.km).toBe(55);
    const none = nearestExit({ pois: [st(400)], km: 0, now: NOW });
    expect(none.ahead).toBeNull();
    expect(none.behind).toBeNull();
  });
});
