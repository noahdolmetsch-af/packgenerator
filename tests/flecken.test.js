// «Weisse Flecken in der Nähe» (Träume und Neuland N1): municipalities around home, never visited first by distance.
import { describe, it, expect } from 'vitest';
import { whiteSpots, spotsCfg, SPOT_RADIUS } from '../src/lib/neuland/flecken.js';

const items = [
  { id: 'g1', name: 'Nahdorf', kt: 'ZH', c: [8.55, 47.38] },
  { id: 'g2', name: 'Mitteldorf', kt: 'ZH', c: [8.7, 47.38] },
  { id: 'g3', name: 'Ferndorf', kt: 'BE', c: [7.45, 46.95] },
  { id: 'g4', name: 'Altdorf am See', kt: 'ZH', c: [8.6, 47.4] },
];
const home = { lat: 47.377, lon: 8.54 };

describe('whiteSpots', () => {
  it('keeps the municipalities within the radius, nearest first, and marks the visited ones', () => {
    const r = whiteSpots(items, new Map([['g4', { day: '2026-09-01' }]]), home, 25);
    expect(r.near.map((x) => x.id)).toEqual(['g1', 'g4', 'g2']);
    expect(r.open.map((x) => x.id)).toEqual(['g1', 'g2']);
    expect(r.been).toBe(1);
    expect(r.near[0].km).toBeLessThan(2);
  });
  it('a bigger radius reaches further', () => {
    expect(whiteSpots(items, new Map(), home, 50).near).toHaveLength(3);
    expect(whiteSpots(items, new Map(), home, 100).near).toHaveLength(4);
  });
  it('without a home place there is nothing to show', () => {
    expect(whiteSpots(items, new Map(), null)).toBeNull();
    expect(whiteSpots(items, new Map(), { lat: 'x', lon: 8 })).toBeNull();
  });
  it('the radius is one of 10, 25, 50 km', () => {
    expect(spotsCfg(null).radius).toBe(SPOT_RADIUS);
    expect(spotsCfg({ radius: 10 }).radius).toBe(10);
    expect(spotsCfg({ radius: 13 }).radius).toBe(SPOT_RADIUS);
  });
});
