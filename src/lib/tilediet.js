/**
 * «Kacheln schlank» (Noah 23.11.2026 «App 8 GB gross, ohne Verluste»): Chrome counts every map tile kept as an
 * «opaque» answer (loaded without CORS) with about 8 MB, although it is about 25 KB. The tiles are now loaded with
 * CORS (real size). The ones kept before are loaded once again the same way and put in the place of the old copy,
 * so no tile is lost; only the count shrinks. Nothing but the two tile caches is touched, never your data.
 *
 * Gentle: at most 2 at a time with a pause (swisstopo asks for fair use), only when online, not on «data saver»,
 * and it stops at the first sign of no internet (the next start goes on; done tiles are not opaque any more).
 */
export const TILE_CACHES = ['swisstopo-tiles', 'osm-tiles'];
export const CONCURRENCY = 2;
export const PAUSE_MS = 150;
/** Stop after this many failures in a row (the host does not answer with CORS or is down); the old copies stay. */
export const MAX_FAILS = 5;
/**
 * The server answers «no tile here» (404/410; swisstopo says 400 for a place outside its map). An opaque copy of such an
 * answer is only an error page that was kept as a picture (the cache kept every opaque answer, whatever it said), so it
 * goes. Without this, the first five of them stopped the whole run at every start and the rest never became small.
 */
export const NO_TILE = [400, 404, 410];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The requests of a cache whose kept answer is opaque. */
export async function opaqueKeys(cache) {
  const out = [];
  for (const req of await cache.keys()) {
    let res = null;
    try {
      res = await cache.match(req);
    } catch {
      /* skip */
    }
    if (res && res.type === 'opaque') out.push(req);
  }
  return out;
}

/**
 * Load the opaque tiles again with CORS and keep the new copy. Returns { total, done, gone, failed, stopped }.
 * A tile the server has no picture for (404, 410, swisstopo's 400 outside its map) is dropped: what was kept is an error page.
 */
export async function slimTiles({ store = globalThis.caches, fetchFn = globalThis.fetch?.bind(globalThis), online = () => globalThis.navigator?.onLine !== false, pauseMs = PAUSE_MS, concurrency = CONCURRENCY, names = TILE_CACHES } = {}) {
  const out = { total: 0, done: 0, gone: 0, failed: 0, stopped: false };
  if (!store?.open || !fetchFn) return out;
  const todo = [];
  // only caches that exist (open() would make an empty one)
  const have = typeof store.keys === 'function' ? await store.keys() : names;
  for (const name of names.filter((n) => have.includes(n))) {
    let cache;
    try {
      cache = await store.open(name);
    } catch {
      continue;
    }
    for (const req of await opaqueKeys(cache)) todo.push({ cache, req });
  }
  out.total = todo.length;
  let streak = 0;
  let next = 0;
  async function worker() {
    while (!out.stopped) {
      const job = todo[next++];
      if (!job) return;
      if (!online()) {
        out.stopped = true;
        return;
      }
      try {
        const res = await fetchFn(job.req.url, { mode: 'cors', credentials: 'omit' });
        if (res.ok && res.type !== 'opaque') {
          await job.cache.put(job.req.url, res);
          out.done++;
          streak = 0;
        } else if (NO_TILE.includes(res.status)) {
          await job.cache.delete(job.req);
          out.gone++;
          streak = 0;
        } else {
          out.failed++;
          if (++streak >= MAX_FAILS) out.stopped = true;
        }
      } catch {
        out.failed++;
        if (++streak >= MAX_FAILS) out.stopped = true;
      }
      if (pauseMs) await sleep(pauseMs);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

/** Start it once the app is idle after the start (never holds up the start). */
export function slimTilesLater({ delayMs = 20000 } = {}) {
  try {
    if (!globalThis.caches || globalThis.navigator?.connection?.saveData) return;
    setTimeout(() => {
      const run = () => slimTiles().catch(() => {});
      if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 30000 });
      else run();
    }, delayMs);
  } catch {
    /* no cache storage: nothing to do */
  }
}
