// Schlafplatz finden, Schritt 1 (Noah 28.10.2026): src/lib/live/schlafplatz.js, made-up places only.
import { describe, it, expect } from 'vitest';
import { sleepAroundQuery, loadSleepAround, findSpots, SLEEP_KIND_KEYS } from '../src/lib/live/schlafplatz.js';

const here = { lat: 46.9, lon: 7.4 };
const el = (type, id, lat, lon, tags) => ({ type, id, lat, lon, tags });
const answer = {
  elements: [
    el('node', 1, 46.905, 7.4, { amenity: 'shelter', name: 'test_data_gtp_ Unterstand' }),
    el('node', 2, 46.91, 7.41, { tourism: 'wilderness_hut', name: 'test_data_gtp_ Biwak' }),
    el('node', 3, 46.9, 7.42, { highway: 'bus_stop', shelter: 'yes' }),
    el('node', 4, 46.9, 7.4001, { shop: 'bakery' }),
    el('node', 5, 47.5, 7.4, { amenity: 'shelter' }),
  ],
};

describe('Schlafplatz finden', () => {
  it('asks only for roofs', () => {
    const q = sleepAroundQuery(here);
    expect(q).toContain('amenity"="shelter');
    expect(q).toContain('wilderness_hut');
    expect(q).toContain('highway"="bus_stop"]["shelter"="yes');
    expect(q).not.toContain('shop');
    expect(q).toContain('46.9000,7.4000');
  });

  it('reads the answer into hut, bivouac and bus; other places are left out', async () => {
    const list = await loadSleepAround(here, { fetcher: async () => ({ ok: true, status: 200, json: async () => answer }) });
    expect(list.map((p) => p.spot).sort()).toEqual(['bivouac', 'bus', 'hut', 'hut']);
    expect(list.some((p) => p.kind === 'shop')).toBe(false);
  });

  it('says why it failed', async () => {
    await expect(loadSleepAround(null)).rejects.toThrow('failed');
  });

  it('shows the nearest first, within 8 km, with the own places', async () => {
    const list = await loadSleepAround(here, { fetcher: async () => ({ ok: true, status: 200, json: async () => answer }) });
    const own = [
      { id: 'a1', kind: 'sleep', name: 'test_data_gtp_ Wiese', lat: 46.9, lon: 7.401 },
      { id: 'a2', kind: 'water', name: 'Brunnen', lat: 46.9, lon: 7.4005 },
    ];
    const out = findSpots({ here, list, own });
    expect(out[0].name).toBe('test_data_gtp_ Wiese');
    expect(out[0].source).toBe('own');
    expect(out.map((p) => p.distKm)).toEqual([...out.map((p) => p.distKm)].sort((a, b) => a - b));
    // the one 67 km away and the water point of the own list are not there
    expect(out.some((p) => p.id === 'node/5' || p.name === 'Brunnen')).toBe(false);
    expect(out).toHaveLength(4);
  });

  it('filters by the chips', async () => {
    const list = await loadSleepAround(here, { fetcher: async () => ({ ok: true, status: 200, json: async () => answer }) });
    expect(findSpots({ here, list, kinds: ['bus'] }).every((p) => p.spot === 'bus')).toBe(true);
    expect(findSpots({ here, list, kinds: [] })).toEqual([]);
    expect(SLEEP_KIND_KEYS).toEqual(['hut', 'bivouac', 'bus', 'own']);
  });
});
