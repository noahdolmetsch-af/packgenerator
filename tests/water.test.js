import { describe, it, expect } from 'vitest';
import { nextWater, drinkPerH, BOTTLE_ML } from '../src/lib/live/water.js';

const NOW = Date.UTC(2026, 6, 10, 10, 0); // a made-up day
const pace = { kmh: 20 };
const spot = (kind, km, extra = {}) => ({ kind, km, name: `${kind} ${km}`, lat: 46, lon: 8, ...extra });

describe('nextWater', () => {
  it('needs a position', () => {
    expect(nextWater({ pois: [], km: null })).toBeNull();
  });
  it('picks the nearest water ahead and says the bottle is enough', () => {
    const r = nextWater({ pois: [spot('water', 5), spot('water', 30)], km: 10, now: NOW, pace, haveMl: 1000, rateMlH: 500 });
    expect(r.next.poi.km).toBe(30);
    expect(r.next.distKm).toBe(20);
    expect(r.needMl).toBe(500); // 1 h at 20 km/h
    expect(r.state).toBe('ok');
  });
  it('is tight when the bottle only just lasts, and short when it does not', () => {
    const tight = nextWater({ pois: [spot('water', 40)], km: 0, now: NOW, pace, haveMl: 1100, rateMlH: 500 });
    expect(tight.needMl).toBe(1000);
    expect(tight.state).toBe('tight');
    const short = nextWater({ pois: [spot('water', 40)], km: 0, now: NOW, pace, haveMl: 600, rateMlH: 500 });
    expect(short.state).toBe('short');
  });
  it('counts a shop only when it is open when you get there', () => {
    const closed = nextWater({ pois: [spot('shop', 10, { hours: 'Mo-Su 00:00-00:01' }), spot('water', 50)], km: 0, now: NOW, pace });
    expect(closed.next.poi.kind).toBe('water');
  });
  it('without a place ahead it says how far the bottle lasts', () => {
    const r = nextWater({ pois: [spot('water', 2)], km: 10, now: NOW, pace, haveMl: 1000, rateMlH: 500 });
    expect(r.state).toBe('none');
    expect(r.lastsKm).toBe(40);
  });
  it('drinks more on a warm day', () => {
    expect(drinkPerH(30)).toBeGreaterThan(drinkPerH(15));
    expect(BOTTLE_ML).toBeGreaterThan(0);
  });
});
