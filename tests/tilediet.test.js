import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { slimTiles, opaqueKeys } from '../src/lib/tilediet.js';

const mkCache = (entries) => ({
  entries,
  keys: async () => Object.keys(entries).map((url) => ({ url })),
  match: async (r) => entries[r.url ?? r],
  put: async (url, res) => { entries[url] = res; },
  delete: async (r) => delete entries[r.url ?? r],
});
const store = (caches) => ({ keys: async () => Object.keys(caches), open: async (n) => caches[n] });
const ok = (type = 'cors') => ({ ok: true, status: 200, type });

describe('tilediet', () => {
  it('finds only the opaque answers', async () => {
    const c = mkCache({ a: { type: 'opaque' }, b: { type: 'cors' } });
    expect((await opaqueKeys(c)).map((r) => r.url)).toEqual(['a']);
  });
  it('replaces opaque tiles by readable ones and keeps the rest', async () => {
    const c = mkCache({ a: { type: 'opaque' }, b: { type: 'cors' } });
    const calls = [];
    const r = await slimTiles({ store: store({ 'swisstopo-tiles': c }), fetchFn: async (u, o) => (calls.push([u, o.mode]), ok()), pauseMs: 0 });
    expect(r).toMatchObject({ total: 1, done: 1, failed: 0 });
    expect(calls).toEqual([['a', 'cors']]);
    expect(c.entries.a.type).toBe('cors');
    expect(c.entries.b.type).toBe('cors');
  });
  it('drops a tile the server no longer has, keeps it on other errors', async () => {
    const c = mkCache({ a: { type: 'opaque' }, b: { type: 'opaque' } });
    const r = await slimTiles({ store: store({ 'osm-tiles': c }), fetchFn: async (u) => (u === 'a' ? { ok: false, status: 404 } : { ok: false, status: 503 }), pauseMs: 0 });
    expect(r).toMatchObject({ gone: 1, failed: 1 });
    expect(Object.keys(c.entries)).toEqual(['b']);
  });
  it('stops when offline and loses nothing', async () => {
    const c = mkCache({ a: { type: 'opaque' }, b: { type: 'opaque' } });
    const r = await slimTiles({ store: store({ 'osm-tiles': c }), fetchFn: async () => ok(), online: () => false, pauseMs: 0 });
    expect(r).toMatchObject({ stopped: true, done: 0 });
    expect(Object.keys(c.entries)).toEqual(['a', 'b']);
  });
  it('stops after five failures in a row', async () => {
    const c = mkCache(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`t${i}`, { type: 'opaque' }])));
    const r = await slimTiles({ store: store({ 'osm-tiles': c }), fetchFn: async () => { throw new Error('x'); }, pauseMs: 0, concurrency: 1 });
    expect(r.stopped).toBe(true);
    expect(r.failed).toBe(5);
    expect(Object.keys(c.entries)).toHaveLength(12);
  });
});

// Guard: every map picture from swisstopo or OpenStreetMap is loaded with CORS, else Chrome counts ~8 MB for each kept tile.
describe('map pictures are loaded with CORS', () => {
  const files = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.svelte$/.test(f)) files.push(p); } };
  walk('src');
  it('Leaflet tile layers and tile images say crossOrigin', () => {
    const bad = [];
    for (const f of files) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/L\.tileLayer\([^;\n]*/g)) if (!/crossOrigin: 'anonymous'/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 60)}`);
      for (const m of s.matchAll(/<(img|image)\b[^>]*(tileUrl\(|href=\{tl\.url\})[^>]*>/g)) if (!/crossorigin="anonymous"/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 60)}`);
    }
    expect(bad).toEqual([]);
  });
});
