// «Route kennt deine Erfahrung» (S3, Noah 21.11.2026): fictional roads only.
import { describe, it, expect } from 'vitest';
import { waysOnRoute, experience, experienceLines, ON_ROUTE_M } from '../src/lib/route/erfahrung.js';
import { newKmOfRoute } from '../src/lib/neuland/neuekm.js';

// 0.01° latitude ≈ 1.11 km; a route going north along lon 8.3 from 47.0 to 47.05 (about 5.6 km)
const north = (lat0, lat1, lon = 8.3) => [[lat0, lon], [lat1, lon]];
const route = north(47.0, 47.05);
const eastM = (m, lat = 47) => m / (111320 * Math.cos((lat * Math.PI) / 180));
const way = (id, rating, line) => ({ id, rating, line });
const t = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`);
const tn = (n, one, many, v = {}) => t(n === 1 ? one : many, { n, ...v });

describe('stretches on a route', () => {
  it('finds a bad stretch on the route and says where (km)', () => {
    const w = [way('a:0', 'down', north(47.02, 47.025))];
    const r = waysOnRoute(w, route, 'down');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('a:0');
    expect(r[0].km).toBeGreaterThan(2.1);
    expect(r[0].km).toBeLessThan(2.4);
  });

  it('ignores a stretch 300 m away, keeps one 30 m away (GPS jitter)', () => {
    const far = way('f', 'down', north(47.02, 47.025, 8.3 + eastM(300)));
    const near = way('n', 'down', north(47.03, 47.035, 8.3 + eastM(30)));
    expect(waysOnRoute([far, near], route, 'down').map((x) => x.id)).toEqual(['n']);
  });

  it('keeps ratings apart and sorts by km', () => {
    const w = [way('late', 'down', north(47.04, 47.042)), way('good', 'up', north(47.01, 47.012)), way('early', 'down', north(47.005, 47.007))];
    expect(waysOnRoute(w, route, 'down').map((x) => x.id)).toEqual(['early', 'late']);
    expect(waysOnRoute(w, route, 'up').map((x) => x.id)).toEqual(['good']);
  });

  it('is empty for no ways, a broken way or a route without a line', () => {
    expect(waysOnRoute([], route)).toEqual([]);
    expect(waysOnRoute([{ id: 'x', rating: 'down' }, null], route)).toEqual([]);
    expect(waysOnRoute([way('a', 'down', north(47.0, 47.01))], [[47, 8.3]])).toEqual([]);
    expect(ON_ROUTE_M).toBe(60);
  });
});

describe('how new a route is', () => {
  const ride = (id, pts) => ({ id, day: '2026-05-01', kind: 'bike', pts });

  it('is all new without earlier rides and known where an earlier ride went', () => {
    const none = newKmOfRoute(route, []);
    expect(none.km).toBeCloseTo(5.6, 0);
    expect(none.newKm).toBeCloseTo(none.km, 1);
    const half = newKmOfRoute(route, [ride('a', north(47.0, 47.025))]);
    expect(half.newKm).toBeGreaterThan(2.5);
    expect(half.newKm).toBeLessThan(3.1);
  });

  it('counts only bike lines and does not treat the route as its own earlier ride', () => {
    const run = { id: 'r', day: '2026-05-01', kind: 'run', pts: north(47.0, 47.05) };
    expect(newKmOfRoute(route, [run]).newKm).toBeCloseTo(5.6, 0);
    expect(newKmOfRoute([], [])).toBeNull();
  });
});

describe('the lines', () => {
  const ways = [way('b1', 'down', north(47.02, 47.025)), way('b2', 'down', north(47.04, 47.042)), way('g', 'up', north(47.01, 47.012))];
  const lines = [{ id: 'a', day: '2026-05-01', kind: 'bike', pts: north(47.0, 47.025) }];

  it('names bad stretches with km, good ones and the new share', () => {
    const exp = experience({ line: route, ways, lines });
    const rows = experienceLines(exp, { t, tn });
    expect(rows.map((r) => r.key)).toEqual(['bad', 'good', 'fresh']);
    expect(rows[0].text).toMatch(/^2 stretches you marked as bad are on this route, first at km 2\.\d, 4\.\d\.$/);
    expect(rows[1].text).toBe('One stretch you marked as good is on this route.');
    expect(rows[2].text).toMatch(/^(49|50|51) % of this route is new for you/);
  });

  it('says «you know it all» for a route fully ridden, and stays silent without data', () => {
    const exp = experience({ line: route, ways: [], lines: [{ id: 'a', day: '2026-05-01', kind: 'bike', pts: route }] });
    expect(experienceLines(exp, { t, tn }).map((r) => r.text)).toEqual(['You know this whole route from your earlier rides.']);
    expect(experienceLines(experience({ line: route, ways: [], lines: null }), { t, tn })).toEqual([]);
    expect(experienceLines(null, { t, tn })).toEqual([]);
  });
});
