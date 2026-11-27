// «Weisse Flecken in der Nähe» (Träume und Neuland N1): municipalities around home, never visited first by distance.
import { describe, it, expect } from 'vitest';
import { whiteSpots, spotsCfg, directions, SPOT_RADII, SPOT_RADIUS, SPOT_MIN, SPOT_MAX, TRAIN_KM } from '../src/lib/neuland/flecken.js';

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
  it('the radius has five buttons and can be typed between 5 and 200 km', () => {
    expect(SPOT_RADII).toEqual([10, 25, 50, 75, 100]);
    expect(spotsCfg(null).radius).toBe(SPOT_RADIUS);
    expect(spotsCfg({ radius: 10 }).radius).toBe(10);
    expect(spotsCfg({ radius: 100 }).radius).toBe(100);
    expect(spotsCfg({ radius: 13 }).radius).toBe(13); // typed
    expect(spotsCfg({ radius: SPOT_MAX }).radius).toBe(SPOT_MAX);
    expect(spotsCfg({ radius: SPOT_MAX + 1 }).radius).toBe(SPOT_RADIUS);
    expect(spotsCfg({ radius: SPOT_MIN - 1 }).radius).toBe(SPOT_RADIUS);
    expect(spotsCfg({ radius: 12.5 }).radius).toBe(SPOT_RADIUS);
    expect(spotsCfg({ radius: 'x' }).radius).toBe(SPOT_RADIUS);
  });
  it('a far place is where the hint for the train starts', () => {
    expect(TRAIN_KM).toBe(50);
  });
});

describe('directions', () => {
  const h = { lat: 47, lon: 8 };
  const at = (id, lat, lon, been, km) => ({ id, lat, lon, been, km });
  const near = [
    at('n1', 47.2, 8, false, 22), // north
    at('n2', 47.3, 8, true, 33),
    at('w1', 47, 7.7, false, 23), // west
    at('w2', 47, 7.5, false, 36),
    at('w3', 47, 7.4, true, 44),
    at('e1', 47, 8.3, true, 23), // east, all visited
  ];
  it('counts the open and all municipalities per direction, most open first, with the nearest open one', () => {
    const d = directions(near, h);
    expect(d.map((x) => x.sector)).toEqual(['west', 'north']);
    expect(d[0]).toEqual({ sector: 'west', open: 2, all: 3, nearest: 23 });
    expect(d[1]).toEqual({ sector: 'north', open: 1, all: 2, nearest: 22 });
  });
  it('leaves out directions where everything was visited, and needs a home place', () => {
    expect(directions(near, h).some((x) => x.sector === 'east')).toBe(false);
    expect(directions(near, null)).toEqual([]);
    expect(directions([], h)).toEqual([]);
  });
});
