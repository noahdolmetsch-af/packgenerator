/*
 * v0.41.0 (Noah 5): "Share to Pack Generator" on Android with a file. The web app manifest's
 * share_target sends a POST (multipart/form-data) to <base>share-target; there is no server, so
 * the service worker answers it here. It is loaded into the generated worker with importScripts
 * (vite.config.js workbox.importScripts), before Workbox's own routes, which only handle GET.
 *
 * - A GPX or TCX file: kept in the Cache "pg-shared-ride" (key "shared-ride", with its name),
 *   then the app opens #/debrief/ride/shared, which reads it, shows the ride and lets you save it.
 * - Text, a title or a link (no file): the app opens with ?title=…&text=…&url=… as before
 *   (the Inbox quick note, App.svelte), so text sharing keeps working.
 * The names must match src/lib/gpx.js (SHARE_CACHE, SHARE_KEY).
 */
const SHARE_CACHE = 'pg-shared-ride';
const SHARE_KEY = 'shared-ride';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'POST') return;
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/share-target')) return;
  const base = url.pathname.replace(/share-target$/, '');
  const go = (path) => Response.redirect(new URL(path, url.origin).href, 303);
  event.respondWith(
    (async () => {
      let form;
      try {
        form = await req.formData();
      } catch {
        return go(`${base}#/inbox`);
      }
      const file = form.getAll('ride').find((f) => f && typeof f === 'object' && f.size > 0);
      if (file) {
        const cache = await caches.open(SHARE_CACHE);
        await cache.put(
          `${base}${SHARE_KEY}`,
          new Response(file, { headers: { 'Content-Type': file.type || 'application/gpx+xml', 'X-File-Name': encodeURIComponent(file.name || 'ride.gpx') } }),
        );
        return go(`${base}#/debrief/ride/shared`);
      }
      const q = new URLSearchParams();
      for (const k of ['title', 'text', 'url']) {
        const v = form.get(k);
        if (typeof v === 'string' && v.trim()) q.set(k, v);
      }
      return go(`${base}${q.toString() ? `?${q}` : '#/inbox'}`);
    })(),
  );
});
