// «Neue Sammlungen» (Träume und Neuland N18): places from OpenStreetMap, parsed, kept and turned into items.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { OSM_KEY, OVERPASS, OSM_SETS, isOsm, osmQuery, parseOsm, osmItems, osmLoadedAt, fetchOsm, osmDue, refreshDue, OSM_EVERY_DAYS, OSM_RETRY_MS } from '../src/lib/neuland/osm.js';
import { COLLECTIONS } from '../src/lib/neuland/neuland.js';

const P = 'test_data_gtp_';
const ANSWER = {
  elements: [
    { type: 'node', id: 1, lat: 46.9, lon: 8.1, tags: { waterway: 'waterfall', name: `${P}Fall A`, ele: '812.4' } },
    { type: 'way', id: 2, center: { lat: 47.2, lon: 8.3 }, tags: { waterway: 'waterfall', name: `${P}Fall B` } },
    { type: 'way', id: 3, center: { lat: 47.2005, lon: 8.3005 }, tags: { waterway: 'waterfall', name: `${P}Fall B` } }, // the same place, drawn twice
    { type: 'node', id: 4, lat: 46.5, lon: 9.0, tags: { waterway: 'waterfall', name: `${P}Fall B` } }, // same name, far away
    { type: 'node', id: 5, lat: 46.7, lon: 8.5, tags: { waterway: 'waterfall' } }, // no name
    { type: 'node', id: 6, tags: { name: `${P}No place` } },
  ],
};

function memDb() {
  const db = new Dexie(`${P}osm-${Math.random()}`);
  db.version(1).stores({ meta: 'key' });
  return db;
}

describe('neuland osm', () => {
  it('knows the three collections and asks Switzerland only', () => {
    for (const id of Object.keys(OSM_SETS)) {
      expect(isOsm(id)).toBe(true);
      expect(COLLECTIONS.find((c) => c.id === id)?.osm).toBe(true);
      expect(osmQuery(id)).toContain('"ISO3166-1"="CH"');
    }
    expect(isOsm('passes')).toBe(false);
  });

  it('keeps named places once, sorted north to south', () => {
    const list = parseOsm(ANSWER);
    expect(list).toEqual([
      [`${P}Fall B`, 47.2, 8.3, null],
      [`${P}Fall A`, 46.9, 8.1, 812],
      [`${P}Fall B`, 46.5, 9, null],
    ]);
    expect(parseOsm(null)).toEqual([]);
  });

  it('turns kept places into items with unique ids', () => {
    const rec = { waterfalls: { at: '2026-10-28T10:00:00.000Z', list: parseOsm(ANSWER) } };
    const items = osmItems(rec, 'waterfalls');
    expect(items.every((i) => i.id.startsWith('w-'))).toBe(true);
    expect(new Set(items.map((i) => i.id)).size).toBe(3);
    expect(items[2].id).toBe(`${items[0].id}-2`);
    expect(items[1]).toMatchObject({ name: `${P}Fall A`, kind: 'point', lat: 46.9, lon: 8.1, alt: 812 });
    expect(osmItems(rec, 'towers')).toEqual([]);
    expect(osmItems(rec, 'passes')).toEqual([]);
    expect(osmLoadedAt(rec, 'waterfalls')).toBe('2026-10-28T10:00:00.000Z');
    expect(osmLoadedAt(rec, 'towers')).toBe(null);
  });

  it('loads one collection and keeps the others', async () => {
    const db = memDb();
    await db.meta.put({ key: OSM_KEY, towers: { at: 'x', list: [[`${P}Turm`, 47, 8, null]] } });
    const calls = [];
    const fetcher = async (url, opt) => (calls.push([url, opt]), { ok: true, status: 200, json: async () => ANSWER });
    const rec = await fetchOsm(db, 'waterfalls', { fetcher, now: Date.parse('2026-10-28T10:00:00Z') });
    expect(calls[0][0]).toBe(OVERPASS);
    expect(calls[0][1].method).toBe('POST');
    expect(decodeURIComponent(calls[0][1].body)).toContain('waterfall');
    expect(rec.waterfalls.list).toHaveLength(3);
    const kept = await db.meta.get(OSM_KEY);
    expect(kept.towers.list).toHaveLength(1);
    expect(kept.waterfalls.at).toBe('2026-10-28T10:00:00.000Z');
  });

  it('says busy or failed', async () => {
    const db = memDb();
    await expect(fetchOsm(db, 'towers', { fetcher: async () => ({ ok: false, status: 429 }) })).rejects.toThrow('busy');
    await expect(fetchOsm(db, 'towers', { fetcher: async () => ({ ok: false, status: 500 }) })).rejects.toThrow('failed');
    await expect(fetchOsm(db, 'towers', { fetcher: async () => { throw new Error('net'); } })).rejects.toThrow('failed');
    await expect(fetchOsm(db, 'passes', { fetcher: async () => ({ ok: true }) })).rejects.toThrow('failed');
    expect(await db.meta.get(OSM_KEY)).toBeUndefined();
  });
});

// Noah 28.10.2026 «5b»: the switched-on collections load by themselves, and once a week again
describe('neuland osm by itself', () => {
  const NOW = Date.parse('2026-10-28T12:00:00Z');
  const ago = (ms) => new Date(NOW - ms).toISOString();
  it('due: never loaded, or a week old; not right after a failed try', () => {
    expect(osmDue(null, ['waterfalls', 'towers', 'cantons'], NOW)).toEqual(['waterfalls', 'towers']);
    const rec = { waterfalls: { at: ago(2 * 864e5), list: [] }, towers: { at: ago(OSM_EVERY_DAYS * 864e5), list: [] } };
    expect(osmDue(rec, ['waterfalls', 'towers'], NOW)).toEqual(['towers']);
    expect(osmDue({ tried: { bridges: ago(3600e3) } }, ['bridges'], NOW)).toEqual([]);
    expect(osmDue({ tried: { bridges: ago(OSM_RETRY_MS + 1) } }, ['bridges'], NOW)).toEqual(['bridges']);
    // a try before the last load does not hold back the weekly one
    expect(osmDue({ towers: { at: ago(8 * 864e5), list: [] }, tried: { towers: ago(9 * 864e5) } }, ['towers'], NOW)).toEqual(['towers']);
  });
  it('loads the due ones one after the other and keeps going after an error', async () => {
    const db = memDb();
    const asked = [];
    const fetcher = async (url, init) => {
      const q = decodeURIComponent(init.body);
      asked.push(q);
      if (q.includes('tower')) throw new TypeError('Failed to fetch');
      return { ok: true, status: 200, json: async () => ANSWER };
    };
    const done = await refreshDue(db, ['towers', 'waterfalls'], { fetcher, now: NOW });
    expect(done).toEqual(['waterfalls']);
    expect(asked).toHaveLength(2);
    const rec = await db.meta.get(OSM_KEY);
    expect(rec.waterfalls.list.length).toBeGreaterThan(0);
    expect(rec.tried.towers).toBe(new Date(NOW).toISOString());
    // right after: nothing is asked again
    expect(await refreshDue(db, ['towers', 'waterfalls'], { fetcher, now: NOW + 60e3 })).toEqual([]);
    expect(asked).toHaveLength(2);
  });
});
