/**
 * «Speicher auf diesem Gerät» (Noah 23.11.2026 «Die App ist 8 GB gross»): where the browser's storage of this app goes.
 *
 * Chrome counts every cached answer it could not read (an <img> tile from another website, an «opaque» answer)
 * with a padding of about 8 MB, even when the tile itself is 25 KB. A few hundred map tiles therefore show up as
 * gigabytes in «navigator.storage.estimate()» and in Android's site settings, while the real files are small.
 * This file reads the Cache Storage (per cache: entries, opaque entries, real bytes) and the data tables
 * (approximate bytes) and turns them into rows the page can show. Read only: it never changes or deletes anything.
 */

/** Known caches: [test, label (English, goes through t()), kind]. kind: 'app' | 'map' | 'ai' | 'tmp' | 'other'. */
export const CACHE_KINDS = [
  [/^workbox-precache/, 'App files (for offline use)', 'app'],
  [/^swisstopo-tiles$/, 'Map tiles Switzerland (looked at)', 'map'],
  [/^osm-tiles$/, 'Map tiles OpenStreetMap (looked at)', 'map'],
  [/^pg-offline-map$/, 'Offline map strips (saved by you)', 'map'],
  [/^transformers-cache$/, 'AI models on this device', 'ai'],
  [/^vision-models$/, 'Picture recognition', 'ai'],
  [/^pg-cutout-lib$/, 'Cut-out tool', 'ai'],
  [/^google-fonts$/, 'Fonts', 'app'],
  [/^pg-shared-(ride|backup|docs)$/, 'Files shared to the app, not opened yet', 'tmp'],
  [/^kursblick-/, 'Kursblick prices', 'other'],
];

/** The label and kind of a cache by its name; unknown caches keep their own name. */
export function cacheKind(name) {
  const hit = CACHE_KINDS.find(([re]) => re.test(name));
  return hit ? { label: hit[1], kind: hit[2], known: true } : { label: name, kind: 'other', known: false };
}

/** Chrome's padding for one answer it could not read: about this many bytes (it differs per URL, 0 to 14 MB). */
export const OPAQUE_PAD = 8 * 1048576;

/** Approximate bytes of any stored value: blobs and buffers by size, text by length, the rest by shape. */
export function approxBytes(v, depth = 0) {
  if (v == null) return 0;
  if (typeof v === 'string') return v.length;
  if (typeof v === 'number') return 8;
  if (typeof v === 'boolean') return 4;
  if (typeof Blob !== 'undefined' && v instanceof Blob) return v.size;
  if (v instanceof ArrayBuffer || ArrayBuffer.isView?.(v)) return v.byteLength;
  if (depth > 8) return 0;
  if (Array.isArray(v)) return v.reduce((n, x) => n + approxBytes(x, depth + 1), 0);
  if (typeof v === 'object') return Object.entries(v).reduce((n, [k, x]) => n + k.length + approxBytes(x, depth + 1), 0);
  return 0;
}

/** One cache: how many answers, how many opaque ones, and the real bytes of the readable ones. */
export async function readCache(name, store = globalThis.caches) {
  const cache = await store.open(name);
  const reqs = await cache.keys();
  let opaque = 0;
  let bytes = 0;
  let unknown = 0;
  for (const req of reqs) {
    let res;
    try {
      res = await cache.match(req);
    } catch {
      res = null;
    }
    if (!res) continue;
    if (res.type === 'opaque') {
      opaque++;
      continue;
    }
    const len = Number(res.headers.get('content-length'));
    if (Number.isFinite(len) && len > 0) bytes += len;
    else {
      try {
        bytes += (await res.clone().blob()).size;
      } catch {
        unknown++;
      }
    }
  }
  return { name, ...cacheKind(name), entries: reqs.length, opaque, bytes, unknown };
}

/** Every cache of this site, biggest first (by what Chrome would count: real bytes plus the opaque padding). */
export async function readCaches(store = globalThis.caches) {
  if (!store?.keys) return [];
  const names = await store.keys();
  const out = [];
  for (const n of names) {
    try {
      out.push(await readCache(n, store));
    } catch {
      /* one unreadable cache must not hide the others */
    }
  }
  return out.sort((a, b) => countedBytes(b) - countedBytes(a));
}

/** What Chrome most likely counts for a cache. */
export const countedBytes = (c) => c.bytes + c.opaque * OPAQUE_PAD;

/** The data tables of the app (IndexedDB): approximate bytes per table, only tables that hold something. */
export async function readTables(db, names) {
  const out = [];
  for (const name of names) {
    try {
      let n = 0;
      let bytes = 0;
      await db.table(name).each((row) => {
        n++;
        bytes += approxBytes(row);
      });
      if (n) out.push({ name, rows: n, bytes });
    } catch {
      /* a table this version does not have */
    }
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

/** Does the picture add up? Says in one word where most of the browser's number comes from. */
export function verdict({ usage, caches, tables }) {
  const opaquePad = caches.reduce((n, c) => n + c.opaque * OPAQUE_PAD, 0);
  const real = caches.reduce((n, c) => n + c.bytes, 0) + tables.reduce((n, x) => n + x.bytes, 0);
  const opaqueCount = caches.reduce((n, c) => n + c.opaque, 0);
  if (usage && opaquePad > usage * 0.3) return { kind: 'padding', opaqueCount, opaquePad, real };
  const ai = caches.filter((c) => c.kind === 'ai').reduce((n, c) => n + c.bytes, 0);
  if (usage && ai > usage * 0.3) return { kind: 'ai', opaqueCount, opaquePad, real };
  return { kind: 'ok', opaqueCount, opaquePad, real };
}
