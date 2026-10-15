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
 *
 * SN1b «Tour aus komoot» (Noah 13.10.2026): a GPX WITHOUT times is a planned route (komoot shares its
 * tours like that): the app opens #/komoot/shared, the sheet «Tour aus komoot übernehmen». A GPX with
 * times (or a TCX) stays a ride, as before. What was shared with the file (title, text, a link) is kept
 * with it (header X-Share-Text), so the komoot link comes along. The rule is the same as
 * src/lib/komoot.js sharedKind (tests/komoot.test.js runs this worker against it).
 */
/*
 * Dokumente-PDF (Noah 15.10.2026 «normale Fotos aus dem Galerie-Ordner senden»): photos and PDFs shared to
 * the app (field "doc") are kept in the Cache "pg-shared-docs", one entry per file, then the app opens
 * #/me/docs/scan?shared=1 (src/lib/docs/share.js uses the same names).
 */
const SHARE_DOCS_CACHE = 'pg-shared-docs';
const SHARE_CACHE = 'pg-shared-ride';
const SHARE_KEY = 'shared-ride';
// SN1b: the same limit as the ride upload (gpx.js RIDE_MAX_MB): a bigger file goes to the upload, which says why
const ROUTE_CHECK_MB = 40;

/** SN1b: a GPX whose track has fewer than two points with a time: a planned route, not a ride. */
function plannedRoute(text) {
  if (/<TrainingCenterDatabase/i.test(text) || !/<gpx[\s>]/i.test(text)) return false;
  let timed = 0;
  for (const m of text.matchAll(/<trkpt\b[^>]*?(?:\/>|>([\s\S]*?)<\/trkpt>)/gi)) {
    const at = Date.parse((m[1] ?? '').match(/<time>\s*([^<]+?)\s*<\/time>/i)?.[1] ?? '');
    if (Number.isFinite(at) && ++timed >= 2) return false;
  }
  return true;
}

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
      const docs = form.getAll('doc').filter((f) => f && typeof f === 'object' && f.size > 0);
      if (docs.length) {
        const cache = await caches.open(SHARE_DOCS_CACHE);
        for (const old of await cache.keys()) await cache.delete(old);
        for (const [i, f] of docs.slice(0, 30).entries()) {
          await cache.put(`${base}shared-doc-${i}`, new Response(f, { headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(f.name || `shared-${i}`) } }));
        }
        return go(`${base}#/me/docs/scan?shared=1`);
      }
      const file = form.getAll('ride').find((f) => f && typeof f === 'object' && f.size > 0);
      if (file) {
        const cache = await caches.open(SHARE_CACHE);
        // SN1b: the text and link shared with the file (komoot sends its tour link along)
        const said = ['title', 'text', 'url'].map((k) => form.get(k)).filter((v) => typeof v === 'string' && v.trim()).join('\n').slice(0, 2000);
        await cache.put(
          `${base}${SHARE_KEY}`,
          new Response(file, { headers: { 'Content-Type': file.type || 'application/gpx+xml', 'X-File-Name': encodeURIComponent(file.name || 'ride.gpx'), 'X-Share-Text': encodeURIComponent(said) } }),
        );
        let route = false;
        try {
          route = file.size <= ROUTE_CHECK_MB * 1024 * 1024 && plannedRoute(await file.text());
        } catch {
          /* not readable here: the ride upload reads it and says why */
        }
        return go(`${base}#/${route ? 'komoot' : 'debrief/ride'}/shared`);
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
