/**
 * «Kursblick» (Noah 22.11.2026): the client of api/lake.js ?action=kurse. The server first (Vercel's cache keeps an
 * answer six hours); the last answer stays on the device in the browser's cache (Cache API), so the small app also
 * shows prices offline, with the day of the close and when they were fetched. Yahoo and Stooq send no CORS headers,
 * so the app cannot ask them itself. Nothing private goes out: only the name of the asset.
 * No database table (no schema change): the series are a cache, not the user's data. Tested in tests/kurse.test.js.
 */
import { isKursAnswer } from '../../../api/_lib/kurse.js';

export { isKursAnswer };
export const KURSE_URL = 'https://packgen-three.vercel.app/api/lake';
export const CACHE_NAME = 'kursblick-v1';
/** An answer younger than this is not fetched again (the server closes once a day). */
export const FRISCH_MS = 6 * 3600 * 1000;

/** The device's own store for the last answers: the Cache API, or nothing where it does not exist. */
export function cacheStore() {
  const open = () => (typeof caches === 'undefined' ? null : caches.open(CACHE_NAME));
  const key = (id) => `https://kursblick.invalid/${id}`;
  return {
    async get(id) {
      try {
        const c = await open();
        const r = c && (await c.match(key(id)));
        return r ? await r.json() : null;
      } catch {
        return null;
      }
    },
    async put(id, body) {
      try {
        const c = await open();
        if (c) await c.put(key(id), new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }));
      } catch {
        /* no room or no cache: the next start fetches again */
      }
    },
  };
}

/**
 * One series. → { ...answer, via: 'server' | 'cache', alt: boolean } (alt: older than FRISCH_MS and the server did
 * not answer: the cached one is shown with its own day). Throws when there is neither.
 */
export async function ladeReihe(id, { fetcher = (...a) => fetch(...a), store = cacheStore(), now = Date.now(), force = false } = {}) {
  const cached = await store.get(id);
  const good = isKursAnswer(cached) ? cached : null;
  if (good && !force && now - Date.parse(good.fetchedAt) < FRISCH_MS) return { ...good, via: 'cache', alt: false };
  try {
    const res = await fetcher(`${KURSE_URL}?action=kurse&id=${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const body = await res.json();
      if (isKursAnswer(body) && body.id === id) {
        await store.put(id, body);
        return { ...body, via: 'server', alt: false };
      }
    }
  } catch {
    /* offline or the server is down: the cache below */
  }
  if (good) return { ...good, via: 'cache', alt: true };
  throw new Error('unreachable');
}
