/**
 * Paket U3 «Karte offline» (Noah 19.10.2026 «3a und b möglich»): keep a narrow strip of the map along a
 * route on this device, so the map works without the internet.
 *
 * - Grounds: swisstopo (inside Switzerland; free OGD under fair use: fetched slowly, max 4 at a time,
 *   capped at MAX_TILES) and the free vector map OpenFreeMap (all countries; no request limits,
 *   attribution required). OSM and OpenTopoMap forbid bulk/offline download: never offered here.
 * - Where: Cache Storage OFFLINE_CACHE ('pg-offline-map'). public/offline-map-sw.js answers the map's
 *   normal tile requests from there when a strip holds them.
 * - Index: db.settings 'offline-strips' = { strips: [{ id, name, ground, tripId, zooms, bufferKm, tiles,
 *   bytes, createdAt }] } (small: it goes into the backup). The URL list of each strip lives in the cache
 *   itself, as a small JSON «manifest» (manifestUrl(id)); a strip whose manifest is missing is «not on
 *   this device» (e.g. a backup restored on another phone).
 * - Delete: a URL goes only when no other strip uses it (reference count by strip).
 *
 * The pure parts (tile maths, plan, size, the style's URLs, refcount, runner) are tested in
 * tests/map-offline.test.js.
 */
import { OFFLINE_CACHE, OFM_STYLE, groundOf, tileUrl, inSwitzerland } from './sources.js';

export const STRIPS_KEY = 'offline-strips';
/** The strip width choices: km on each side of the route. */
export const WIDTHS = [1, 2];
/** At most this many map tiles in one strip (swisstopo fair use; the free map: storage on the phone). */
export const MAX_TILES = { raster: 4000, vector: 6000 };
/** Overview zooms (the whole region) and corridor zooms (the strip along the route). */
export const OVERVIEW_ZOOMS = [6, 7, 8];
export const CORRIDOR_ZOOMS = { raster: [9, 10, 11, 12, 13, 14, 15], vector: [9, 10, 11, 12, 13, 14] };
/** Never drop the corridor below this zoom to fit the cap (a 1 km strip needs about zoom 13). */
export const MIN_TOP_ZOOM = 12;
/** The overview zooms use at least this buffer (km), so the tiles beside the route come too. */
export const OVERVIEW_KM = 10;
/** Average size of one tile in KB (swisstopo jpeg about 25 KB, aerial photo more, vector pbf about 30 KB). */
export const AVG_KB = { swisstopo: 25, swisstopoWinter: 25, swissimage: 45, vector: 30 };
/** The free map's style, sprites and fonts in KB (once per strip in the estimate). */
export const VECTOR_EXTRA_KB = 900;
/** The Latin glyph ranges kept for the free map's labels. */
export const GLYPH_RANGES = ['0-255', '256-511', '8192-8447'];
/** Fetch gently: at most this many at a time, and a pause (ms) between batches. */
export const CONCURRENCY = 4;
export const BATCH_PAUSE_MS = 250;
/** The grounds a strip can be kept of. */
export const OFFLINE_GROUNDS = ['swisstopo', 'swisstopoWinter', 'swissimage', 'vector'];

const R = 6378.137; // km, Web Mercator sphere
const MAX_LAT = 85.05112878;

/* ---------- tile maths (slippy XYZ, Web Mercator) ---------- */

export function lonToX(lon, z) {
  const n = 2 ** z;
  return Math.min(n - 1, Math.max(0, Math.floor(((lon + 180) / 360) * n)));
}
export function latToY(lat, z) {
  const n = 2 ** z;
  const r = (Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI) / 180;
  return Math.min(n - 1, Math.max(0, Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)));
}
/** The tile that holds a point. */
export const tileOf = (lat, lon, z) => ({ z, x: lonToX(lon, z), y: latToY(lat, z) });

const finite = (p) => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]));
const distKm = (a, b) => {
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r;
  const dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Points along the line at most stepKm apart (the line's own points included). */
export function densify(line, stepKm) {
  const pts = (line ?? []).filter(finite).map((p) => [Number(p[0]), Number(p[1])]);
  if (pts.length < 2 || !(stepKm > 0)) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const n = Math.ceil(distKm(a, b) / stepKm);
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

/**
 * The unique tiles {z, x, y} within bufferKm of the line ([[lat, lon]…]), for each zoom, sorted by z, x, y.
 * Each point along the line (bufferKm/2 apart) adds the tiles of the box ±bufferKm around it.
 */
export function tilesAlong(line, { zooms = [], bufferKm = 1 } = {}) {
  const buf = Math.max(0.05, Number(bufferKm) || 0);
  const pts = densify(line, buf / 2);
  const seen = new Set();
  const out = [];
  for (const z of [...new Set(zooms)].sort((a, b) => a - b)) {
    for (const [lat, lon] of pts) {
      const dLat = buf / 111.32;
      const dLon = buf / (111.32 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
      const x0 = lonToX(lon - dLon, z);
      const x1 = lonToX(lon + dLon, z);
      const y0 = latToY(lat + dLat, z);
      const y1 = latToY(lat - dLat, z);
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const k = `${z}/${x}/${y}`;
          if (seen.has(k)) continue;
          seen.add(k);
          out.push({ z, x, y });
        }
      }
    }
  }
  return out.sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y);
}

/* ---------- the plan of one strip ---------- */

export const kindOfGround = (ground) => (groundOf(ground).kind === 'vector' ? 'vector' : 'raster');
/** True when a point of the line lies in Switzerland (then swisstopo can be offered). */
export const lineInSwitzerland = (line) => (line ?? []).some((p) => finite(p) && inSwitzerland(Number(p[0]), Number(p[1])));
/** The grounds to offer for this line: swisstopo only when the route touches Switzerland. */
export const groundsFor = (line) => OFFLINE_GROUNDS.filter((k) => !groundOf(k).swiss || lineInSwitzerland(line));

/**
 * The tiles of a strip: overview zooms (≥ OVERVIEW_KM around the route) plus corridor zooms (bufferKm).
 * When the strip passes the cap, the top corridor zooms are dropped (down to MIN_TOP_ZOOM).
 * → { ground, bufferKm, zooms, tiles: [{z,x,y}], count, maxZoom, cut (zooms were dropped), tooBig, cap }
 */
export function planStrip(line, { ground = 'vector', bufferKm = 1, cap, reserve = null } = {}) {
  const kind = kindOfGround(ground);
  const limit = cap ?? MAX_TILES[kind];
  let corridor = [...CORRIDOR_ZOOMS[kind]];
  const over = tilesAlong(line, { zooms: OVERVIEW_ZOOMS, bufferKm: Math.max(OVERVIEW_KM, bufferKm) });
  let tiles;
  for (;;) {
    tiles = uniqTiles([...over, ...tilesAlong(line, { zooms: corridor, bufferKm }), ...reserveTiles(reserve, corridor, bufferKm)]);
    if (tiles.length <= limit || corridor.at(-1) <= MIN_TOP_ZOOM) break;
    corridor = corridor.slice(0, -1);
  }
  const zooms = [...OVERVIEW_ZOOMS, ...corridor];
  return {
    ground,
    bufferKm,
    zooms,
    tiles,
    count: tiles.length,
    maxZoom: zooms.at(-1),
    cut: corridor.length < CORRIDOR_ZOOMS[kind].length,
    tooBig: tiles.length > limit,
    cap: limit,
  };
}

/* ---------- Touren-Ideen 48 «Offline-Karte mit Reserve» ---------- */

/** Around each fallback place this many km of map come along. */
export const RESERVE_KM = 3;
/** At most this many fallback places (each one is a few dozen tiles). */
export const RESERVE_MAX = 12;
/** The waypoint kinds of a GPX route (route/fromgpx.js) that are places to fall back on. */
export const RESERVE_KINDS = ['station', 'sleep', 'camp', 'hospital', 'repair', 'bike'];

/**
 * The reserve of a trip: the line of plan B (a shorter variant) and the fallback places along the
 * route (stations, beds, hospitals, bike shops from the GPX waypoints).
 * → { lines: [[[lat, lon]…]], spots: [[lat, lon]…], planB: bool, places: n } or null when there is none.
 */
export function reserveOf(trip) {
  const planB = trip?.planB?.route?.line;
  const lines = Array.isArray(planB) && planB.filter(finite).length > 1 && !trip?.planB?.on ? [planB] : [];
  // while plan B is the route (planB.on), the planned route waits in planB.route: that one is the reserve then
  if (trip?.planB?.on && Array.isArray(trip?.planB?.route?.line)) lines.push(trip.planB.route.line);
  const wpts = Array.isArray(trip?.route?.wpts) ? trip.route.wpts : [];
  const spots = wpts
    .filter((w) => RESERVE_KINDS.includes(w?.kind) && Number.isFinite(Number(w.lat)) && Number.isFinite(Number(w.lon)))
    .slice(0, RESERVE_MAX)
    .map((w) => [Number(w.lat), Number(w.lon)]);
  if (!lines.length && !spots.length) return null;
  return { lines, spots, planB: lines.length > 0, places: spots.length };
}

/** The corridor tiles of a reserve: its lines as wide as the strip, its places RESERVE_KM around. */
function reserveTiles(reserve, zooms, bufferKm) {
  if (!reserve) return [];
  const out = [];
  for (const l of reserve.lines ?? []) out.push(...tilesAlong(l, { zooms, bufferKm }));
  for (const p of reserve.spots ?? []) if (finite(p)) out.push(...tilesAlong([p], { zooms, bufferKm: RESERVE_KM }));
  return out;
}

const uniqTiles = (list) => {
  const seen = new Set();
  return list.filter((x) => {
    const k = `${x.z}/${x.x}/${x.y}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
};

/** The size estimate in bytes: tiles × the ground's average, plus the free map's style and fonts. */
export function estimateBytes(count, ground) {
  const kb = AVG_KB[ground] ?? 30;
  return Math.round(count * kb * 1024 + (kindOfGround(ground) === 'vector' ? VECTOR_EXTRA_KB * 1024 : 0));
}

/** «850 KB», «12 MB», «1.4 GB» (decimal point; numbers are no words). */
export function fmtBytes(n) {
  const b = Math.max(0, Number(n) || 0);
  if (b < 1000 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  if (b < 1000 * 1024 * 1024) {
    const mb = b / 1024 / 1024;
    return `${mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)} MB`;
  }
  return `${Math.round((b / 1024 / 1024 / 1024) * 10) / 10} GB`;
}

/* ---------- the URLs of a strip ---------- */

/** One URL in the form the Cache API and the service worker see it. */
export const norm = (u, base) => {
  try {
    return new URL(u, base).href;
  } catch {
    return null;
  }
};

/** Fill a tile template ({z} {x} {y}, {-y} or scheme 'tms'). */
export function fillTile(template, { z, x, y }, scheme = 'xyz') {
  const yy = scheme === 'tms' ? 2 ** z - 1 - y : y;
  return template
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{-y}', 2 ** z - 1 - y)
    .replace('{y}', yy);
}

/** The raster ground's tile URLs. */
export const rasterUrls = (ground, tiles) => tiles.map((t) => norm(tileUrl(groundOf(ground), t.z, t.x, t.y))).filter(Boolean);

/** Every font stack the style's labels use (text-font: an array, or an expression holding arrays). */
export function fontStacks(style) {
  const out = new Set();
  const walk = (v) => {
    if (!Array.isArray(v)) return;
    if (v.length && v.every((s) => typeof s === 'string') && !/^[a-z-]+$/.test(v[0])) return void out.add(v.join(','));
    if (v[0] === 'literal' && Array.isArray(v[1]) && v[1].every((s) => typeof s === 'string')) return void out.add(v[1].join(','));
    v.forEach(walk);
  };
  for (const l of style?.layers ?? []) {
    const f = l?.layout?.['text-font'];
    if (Array.isArray(f)) walk(f);
    else if (f && Array.isArray(f.stops)) f.stops.forEach((s) => walk(s?.[1]));
  }
  return [...out];
}

/** The glyph URLs: each font stack × each range. */
export function glyphUrls(style, base = OFM_STYLE, ranges = GLYPH_RANGES) {
  const tpl = typeof style?.glyphs === 'string' ? style.glyphs : '';
  if (!tpl) return [];
  return fontStacks(style).flatMap((stack) => ranges.map((r) => norm(tpl.replace('{fontstack}', stack).replace('{range}', r), base))).filter(Boolean);
}

/** The sprite URLs: json and png, plain and @2x (as maplibre asks for them). */
export function spriteUrls(style, base = OFM_STYLE) {
  const s = style?.sprite;
  const list = typeof s === 'string' ? [s] : Array.isArray(s) ? s.map((x) => x?.url).filter((x) => typeof x === 'string') : [];
  const out = [];
  for (const u of list) {
    let p;
    try {
      p = new URL(u, base);
    } catch {
      continue;
    }
    for (const f of ['', '@2x']) {
      for (const ext of ['.json', '.png']) {
        const q = new URL(p.href);
        q.pathname += `${f}${ext}`;
        out.push(q.href);
      }
    }
  }
  return out;
}

/** The style's sources that have tiles: { id, url (TileJSON, or null), tiles?, minzoom?, maxzoom?, scheme? }. */
export function tileSources(style) {
  return Object.entries(style?.sources ?? {})
    .filter(([, s]) => s && ['vector', 'raster', 'raster-dem'].includes(s.type) && (typeof s.url === 'string' || Array.isArray(s.tiles)))
    .map(([id, s]) => ({ id, url: typeof s.url === 'string' ? s.url : null, tiles: s.tiles, minzoom: s.minzoom, maxzoom: s.maxzoom, scheme: s.scheme }));
}

/**
 * The tile URLs of one source (its TileJSON or inline tiles) for the strip's tiles. Zooms above the
 * source's maxzoom take the parent tile (the map overzooms); zooms below its minzoom are skipped.
 */
export function sourceTileUrls(src, tiles, base = OFM_STYLE) {
  const tpl = (src?.tiles ?? [])[0];
  if (typeof tpl !== 'string') return [];
  const min = Number.isFinite(src.minzoom) ? src.minzoom : 0;
  const max = Number.isFinite(src.maxzoom) ? src.maxzoom : 22;
  const out = new Set();
  for (const t of tiles) {
    if (t.z < min) continue;
    const z = Math.min(t.z, max);
    const f = 2 ** (t.z - z);
    const u = norm(fillTile(tpl, { z, x: Math.floor(t.x / f), y: Math.floor(t.y / f) }, src.scheme), base);
    if (u) out.add(u);
  }
  return [...out];
}

/* ---------- reference count ---------- */

/** The URLs of one strip that no other strip uses (those may leave the cache). */
export function urlsToDrop(urls, otherLists = []) {
  const keep = new Set(otherLists.flat());
  return [...new Set(urls)].filter((u) => !keep.has(u));
}

/* ---------- the runner: gentle, with pause and cancel ---------- */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch and keep a list of URLs, CONCURRENCY at a time with a pause between batches.
 * fetchOne(url) → { bytes } (throws on failure; tried twice); known(url) → bytes or null (already
 * kept by another strip: not fetched again). onProgress({ done, total, failed, bytes, state }).
 * → { start(): Promise<{ done, total, failed: [urls], bytes, state: 'done' | 'cancelled' }>, pause(), resume(), cancel() }
 */
export function createRunner(urls, { fetchOne, known = async () => null, onProgress = () => {}, concurrency = CONCURRENCY, pauseMs = BATCH_PAUSE_MS } = {}) {
  const list = [...new Set(urls)];
  const st = { done: 0, total: list.length, failed: [], bytes: 0, state: 'idle' };
  let resumeNow = null;
  const tell = () => onProgress({ ...st, failed: st.failed.length });
  const one = async (u) => {
    const had = await known(u).catch(() => null);
    if (had != null) return void (st.bytes += had);
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetchOne(u);
        st.bytes += r?.bytes ?? 0;
        return;
      } catch {
        if (st.state === 'cancelled') return;
        if (i === 0) await wait(pauseMs * 2);
      }
    }
    st.failed.push(u);
  };
  return {
    get state() {
      return st.state;
    },
    async start() {
      st.state = 'running';
      tell();
      for (let i = 0; i < list.length; i += concurrency) {
        while (st.state === 'paused') await new Promise((r) => (resumeNow = r));
        if (st.state === 'cancelled') break;
        const batch = list.slice(i, i + concurrency);
        await Promise.all(batch.map(one));
        st.done += batch.length;
        tell();
        if (i + concurrency < list.length && pauseMs) await wait(pauseMs);
      }
      if (st.state !== 'cancelled') st.state = 'done';
      tell();
      return { ...st };
    },
    pause() {
      if (st.state === 'running') (st.state = 'paused'), tell();
    },
    resume() {
      if (st.state !== 'paused') return;
      st.state = 'running';
      tell();
      resumeNow?.();
    },
    cancel() {
      const was = st.state;
      st.state = 'cancelled';
      tell();
      if (was === 'paused') resumeNow?.();
    },
  };
}

/* ---------- on the device: cache, index, storage ---------- */

/** The cache key of a strip's URL list (in the cache, so the settings stay small). */
export const manifestUrl = (id) => norm(`/__pg-offline-map/strip/${encodeURIComponent(id)}.json`, globalThis.location?.href ?? 'https://app.invalid/');

const openCache = () => globalThis.caches.open(OFFLINE_CACHE);
const hasCaches = () => typeof globalThis.caches?.open === 'function';

async function readManifest(cache, id) {
  const r = await cache.match(manifestUrl(id));
  if (!r) return null;
  try {
    return await r.json();
  } catch {
    return null;
  }
}

/** The strips in the index. */
export async function readStrips(db) {
  const v = (await db.settings.get(STRIPS_KEY))?.value;
  return Array.isArray(v?.strips) ? v.strips : [];
}
export const writeStrips = (db, strips) => db.settings.put({ key: STRIPS_KEY, value: { strips: strips.map((s) => ({ ...s })) } });

/** The ids of the strips whose tiles are on this device. */
export async function presentIds(strips) {
  if (!hasCaches()) return new Set();
  const cache = await openCache();
  const out = new Set();
  for (const s of strips) if (await cache.match(manifestUrl(s.id))) out.add(s.id);
  return out;
}

/** Tell the service worker that the cache changed (it keeps a list of what it can answer). */
function tellWorker() {
  try {
    globalThis.navigator?.serviceWorker?.controller?.postMessage({ type: 'pg-offline-map' });
  } catch {
    /* no worker: nothing to tell */
  }
}

const sizeOf = async (res) => {
  const n = Number(res.headers.get('content-length'));
  if (Number.isFinite(n) && n > 0) return n;
  return (await res.clone().blob()).size;
};

/** Fetch one URL and keep it in the cache. → { bytes } */
async function fetchKeep(cache, url, fetchFn) {
  const res = await fetchFn(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  await cache.put(url, new Response(blob, { status: 200, headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream', 'content-length': String(blob.size) } }));
  return { bytes: blob.size, blob };
}

/** Keep (or reuse, when a strip has it already) one JSON resource of the free map; → its object. */
async function keepJson(cache, url, fetchFn, urls) {
  urls.push(url);
  const had = await cache.match(url);
  if (had) {
    try {
      return await had.clone().json();
    } catch {
      /* broken copy: fetch it again */
    }
  }
  const { blob } = await fetchKeep(cache, url, fetchFn);
  return JSON.parse(await blob.text());
}

/**
 * All URLs of a strip. Raster: the tiles. Vector: the style, its TileJSONs, sprites, glyphs and tiles;
 * the style and the TileJSONs are kept here already (they are needed to know the tile URLs). An older
 * strip's style and TileJSON are reused, so all free-map strips point at the same tiles.
 */
export async function stripUrls(plan, { cache, fetchFn = globalThis.fetch } = {}) {
  if (kindOfGround(plan.ground) === 'raster') return rasterUrls(plan.ground, plan.tiles);
  const urls = [];
  const styleUrl = norm(groundOf(plan.ground).style ?? OFM_STYLE);
  const style = await keepJson(cache, styleUrl, fetchFn, urls);
  for (const src of tileSources(style)) {
    let s = src;
    if (src.url) {
      const tj = await keepJson(cache, norm(src.url, styleUrl), fetchFn, urls);
      s = { ...src, tiles: tj?.tiles, minzoom: src.minzoom ?? tj?.minzoom, maxzoom: src.maxzoom ?? tj?.maxzoom, scheme: src.scheme ?? tj?.scheme };
    }
    urls.push(...sourceTileUrls(s, plan.tiles, styleUrl));
  }
  urls.push(...spriteUrls(style, styleUrl), ...glyphUrls(style, styleUrl));
  return [...new Set(urls)];
}

/**
 * Download a strip and add it to the index. control: { onProgress, onRunner(runner) } (the runner
 * gives pause/resume/cancel). → { strip, failed } or { cancelled: true } (what was fetched stays only
 * if another strip uses it).
 */
export async function keepStrip(db, { line, name, tripId = null, ground, bufferKm, reserve = null }, { onProgress, onRunner, fetchFn = globalThis.fetch.bind(globalThis), pauseMs } = {}) {
  const plan = planStrip(line, { ground, bufferKm, reserve });
  if (plan.tooBig) throw new Error('too-big');
  const cache = await openCache();
  const urls = await stripUrls(plan, { cache, fetchFn });
  const runner = createRunner(urls, {
    fetchOne: (u) => fetchKeep(cache, u, fetchFn),
    known: async (u) => {
      const r = await cache.match(u);
      return r ? sizeOf(r) : null;
    },
    onProgress,
    ...(pauseMs != null ? { pauseMs } : {}),
  });
  onRunner?.(runner);
  const res = await runner.start();
  const id = `strip-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  if (res.state === 'cancelled') {
    const others = await otherLists(cache, await readStrips(db), id);
    for (const u of urlsToDrop(urls, others)) await cache.delete(u);
    tellWorker();
    return { cancelled: true };
  }
  const kept = urls.filter((u) => !res.failed.includes(u));
  await cache.put(manifestUrl(id), new Response(JSON.stringify({ id, urls: kept }), { headers: { 'content-type': 'application/json' } }));
  const strip = { id, name, ground, tripId, zooms: plan.zooms, bufferKm, tiles: plan.count, bytes: res.bytes, createdAt: new Date().toISOString(), ...(reserve ? { reserve: true } : {}) };
  await writeStrips(db, [...(await readStrips(db)), strip]);
  tellWorker();
  return { strip, failed: res.failed.length };
}

async function otherLists(cache, strips, exceptId) {
  const out = [];
  for (const s of strips) if (s.id !== exceptId) out.push((await readManifest(cache, s.id))?.urls ?? []);
  return out;
}

/** Remove a strip's URLs that no other strip in `strips` uses, and its manifest. */
async function purge(cache, id, strips) {
  const own = (await readManifest(cache, id))?.urls ?? [];
  for (const u of urlsToDrop(own, await otherLists(cache, strips, id))) await cache.delete(u);
  await cache.delete(manifestUrl(id));
}

/**
 * Take a strip out of the index (its tiles stay until purgeLater runs, so Undo can bring it back).
 * → the strip and its place, for undoRemove.
 */
export async function removeStrip(db, id) {
  const strips = await readStrips(db);
  const at = strips.findIndex((s) => s.id === id);
  if (at < 0) throw new Error('not found');
  await writeStrips(db, strips.filter((s) => s.id !== id));
  return { strip: strips[at], at };
}
export async function undoRemove(db, { strip, at }) {
  const strips = await readStrips(db);
  if (strips.some((s) => s.id === strip.id)) return;
  strips.splice(Math.min(at, strips.length), 0, strip);
  await writeStrips(db, strips);
}

/**
 * Remove from the cache every strip that is no longer in the index (deleted, after the undo window),
 * keeping URLs another strip still uses. Runs after a delete and when the box opens.
 */
export async function sweep(db) {
  if (!hasCaches()) return 0;
  const cache = await openCache();
  const strips = await readStrips(db);
  const ids = new Set(strips.map((s) => s.id));
  const prefix = manifestUrl('').replace(/\.json$/, '');
  const orphans = (await cache.keys()).map((r) => r.url).filter((u) => u.startsWith(prefix) && u.endsWith('.json'));
  let n = 0;
  for (const u of orphans) {
    const id = decodeURIComponent(u.slice(prefix.length, -'.json'.length));
    if (ids.has(id)) continue;
    await purge(cache, id, strips);
    n++;
  }
  if (n) tellWorker();
  return n;
}

/** Rename a strip (the name the user typed; never through t()). */
export async function renameStrip(db, id, name) {
  const strips = await readStrips(db);
  await writeStrips(
    db,
    strips.map((s) => (s.id === id ? { ...s, name } : s)),
  );
}

/** The device storage: { used, free, quota } in bytes, or null when the browser does not say. */
export async function storageInfo(nav = globalThis.navigator) {
  try {
    const e = await nav?.storage?.estimate?.();
    if (!e?.quota) return null;
    const used = e.usage ?? 0;
    return { used, quota: e.quota, free: Math.max(0, e.quota - used) };
  } catch {
    return null;
  }
}
