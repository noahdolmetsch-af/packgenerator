import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { stretches, loadAlong, ALONG_AHEAD_KM } from '../src/lib/live/stops.js';
import { overpassFailed, POI_CACHE } from '../src/lib/race/outside.js';
import { cacheGet, cacheSet } from '../src/lib/race/store.js';

// Noah 22.10.2026: «Stopps entlang der Strecke laden» did nothing on a long route. Fictional route only.
const route = Array.from({ length: 1001 }, (_, i) => ({ lat: 46.9 + i * 0.0009, lon: 7.4, km: i * 0.1 })); // 100 km north
const answer = (elements, extra = {}) => ({ ok: true, status: 200, json: async () => ({ elements, ...extra }) });
const bodyKm = (body) => {
  const lats = [...decodeURIComponent(body.slice(5)).matchAll(/(\d+\.\d+),7\.4000/g)].map((m) => Number(m[1]));
  return [(Math.min(...lats) - 46.9) / 0.009, (Math.max(...lats) - 46.9) / 0.009];
};

describe('stops along the route on the live map', () => {
  it('cuts only the stretch ahead into small pieces with few points', () => {
    const parts = stretches(route, 23, 23 + ALONG_AHEAD_KM, 20);
    expect(parts.length).toBe(3);
    expect(parts[0][0].km).toBeLessThanOrEqual(23);
    expect(parts.at(-1).at(-1).km).toBeGreaterThanOrEqual(83);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(60);
    expect(stretches(route, 95, 155, 20).length).toBe(1);
    expect(stretches([], 0, 60)).toEqual([]);
  });

  it('knows when the free server gave up', () => {
    expect(overpassFailed({ remark: 'runtime error: Query timed out in "query" at line 3 after 61 seconds.' })).toBe(true);
    expect(overpassFailed({ remark: 'runtime error: Query run out of memory using about 2048 MB of RAM.' })).toBe(true);
    expect(overpassFailed({ elements: [] })).toBe(false);
  });

  it('asks piece by piece, keeps the stops elsewhere on the route, and says when the server gave up', async () => {
    const tid = 'test_data_gtp_trip';
    await cacheSet(POI_CACHE + tid, [{ id: 'node/9', kind: 'water', lat: 46.905, lon: 7.4, km: 5 }]);
    const asked = [];
    const fetcher = async (url, init) => {
      asked.push(bodyKm(init.body));
      return answer([{ type: 'node', id: asked.length, lat: 46.9 + (25 + asked.length * 10) * 0.009, lon: 7.4005, tags: { amenity: 'fuel' } }]);
    };
    const list = await loadAlong(tid, route, { fetcher, fromKm: 23 });
    expect(asked.length).toBe(3);
    for (const [a, b] of asked) expect(b - a).toBeLessThanOrEqual(21);
    expect(list.map((p) => p.id)).toEqual(['node/9', 'node/1', 'node/2', 'node/3']);
    expect((await cacheGet(POI_CACHE + tid)).data.length).toBe(4);

    const gaveUp = async () => answer([], { remark: 'runtime error: Query timed out in "query" at line 3 after 61 seconds.' });
    await expect(loadAlong(tid, route, { fetcher: gaveUp, fromKm: 23 })).rejects.toThrow('failed');
    const busy = async () => ({ ok: false, status: 429, json: async () => ({}) });
    await expect(loadAlong(tid, route, { fetcher: busy, fromKm: 23 })).rejects.toThrow('busy');
  });
});
