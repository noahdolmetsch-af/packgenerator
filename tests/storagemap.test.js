import { describe, it, expect } from 'vitest';
import { approxBytes, cacheKind, readCache, readCaches, readTables, readCopies, verdict, countedBytes, OPAQUE_PAD } from '../src/lib/storagemap.js';

const res = (type, len) => ({ type, headers: { get: (k) => (k === 'content-length' ? len : null) }, clone() { return this; }, blob: async () => ({ size: 5 }) });
const fakeCaches = (map) => ({
  keys: async () => Object.keys(map),
  open: async (name) => ({ keys: async () => Object.keys(map[name]).map((u) => ({ url: u })), match: async (r) => map[name][r.url] }),
});

describe('storagemap', () => {
  it('names the known caches and keeps unknown ones', () => {
    expect(cacheKind('swisstopo-tiles')).toMatchObject({ kind: 'map', known: true });
    expect(cacheKind('workbox-precache-v2-https://x/')).toMatchObject({ kind: 'app' });
    expect(cacheKind('foo')).toEqual({ label: 'foo', kind: 'other', known: false });
  });
  it('counts blobs and text by size', () => {
    expect(approxBytes({ a: 'abc', p: new Blob(['x'.repeat(100)]) })).toBe(1 + 3 + 1 + 100);
    expect(approxBytes(null)).toBe(0);
  });
  it('counts opaque answers apart from real bytes', async () => {
    const caches = fakeCaches({ 'osm-tiles': { a: res('opaque', null), b: res('cors', '25000'), c: res('basic', null) } });
    const c = await readCache('osm-tiles', caches);
    expect(c).toMatchObject({ entries: 3, opaque: 1, bytes: 25005 });
    expect(countedBytes(c)).toBe(25005 + OPAQUE_PAD);
  });
  it('sorts the caches by what the browser counts', async () => {
    const caches = fakeCaches({ small: { a: res('cors', '10') }, 'osm-tiles': { a: res('opaque', null) } });
    expect((await readCaches(caches)).map((c) => c.name)).toEqual(['osm-tiles', 'small']);
  });
  it('reads data tables and skips empty or missing ones', async () => {
    const db = { table: (n) => { if (n === 'nope') throw new Error('x'); return { each: async (fn) => (n === 'items' ? [{ n: 'ab' }, { n: 'cd' }] : []).forEach(fn) }; } };
    expect(await readTables(db, ['items', 'empty', 'nope'])).toEqual([{ name: 'items', rows: 2, bytes: 2 * 3 }]);
  });
  it('says padding when opaque entries make most of the number', () => {
    const caches = [{ kind: 'map', opaque: 1000, bytes: 0 }];
    expect(verdict({ usage: 8e9, caches, tables: [] }).kind).toBe('padding');
    expect(verdict({ usage: 5e7, caches: [{ kind: 'app', opaque: 0, bytes: 4e7 }], tables: [] }).kind).toBe('ok');
    expect(verdict({ usage: 2e9, caches: [{ kind: 'ai', opaque: 0, bytes: 1.5e9 }], tables: [] }).kind).toBe('ai');
  });

  it('counts the safety copies one by one (own database)', async () => {
    const sdb = { snaps: { toCollection: () => ({ primaryKeys: async () => [1, 2, 3] }), get: async (id) => (id === 2 ? null : id === 3 ? Promise.reject(new Error('x')) : { data: { a: 'xxxx' } }) } };
    const out = await readCopies(sdb);
    expect(out.n).toBe(1);
    expect(out.bytes).toBeGreaterThan(0);
  });
});
