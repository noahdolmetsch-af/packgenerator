// Strecke genau (Noah 27.10.2026): a trip route keeps its bends instead of 200 evenly picked points.
import { describe, it, expect } from 'vitest';
import { fineLine, FINE_MAX } from '../src/lib/route/fineline.js';
import { routeStats } from '../src/lib/route.js';

// a fictional 60 km zig-zag: a bend every 300 m
const KM_LAT = 1 / 111.2;
const zig = Array.from({ length: 12000 }, (_, i) => ({ lat: 46.5 + i * 0.005 * KM_LAT, lon: 7.5 + (Math.floor(i / 60) % 2 ? 1 : -1) * ((i % 60) / 60) * 0.002, ele: 500 }));

// metres from p to the nearest segment of line (flat frame)
const offM = (p, line) => {
  const k = 111200 * Math.cos((p.lat * Math.PI) / 180);
  const xy = ([la, lo]) => [(lo - p.lon) * k, (la - p.lat) * 111200];
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = xy(line[i - 1]);
    const [bx, by] = xy(line[i]);
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const f = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(ax + dx * f, ay + dy * f));
  }
  return best;
};

describe('fineLine', () => {
  it('keeps every bend within about 5 m and stays under FINE_MAX points', () => {
    const line = fineLine(zig);
    expect(line.length).toBeLessThanOrEqual(FINE_MAX);
    expect(line.length).toBeGreaterThan(200);
    for (let i = 0; i < zig.length; i += 97) expect(offM(zig[i], line)).toBeLessThan(8);
  });
  it('a straight line needs only its ends', () => {
    expect(fineLine([{ lat: 47, lon: 8 }, { lat: 47.001, lon: 8 }, { lat: 47.002, lon: 8 }])).toHaveLength(2);
  });
  it('routeStats (a trip route from a GPX) keeps the bends too', () => {
    const r = routeStats({ name: 'test_ Zickzack', points: zig }, 'zz.gpx');
    expect(r.line.length).toBeGreaterThan(200);
    expect(offM(zig[6030], r.line)).toBeLessThan(8);
  });
});
