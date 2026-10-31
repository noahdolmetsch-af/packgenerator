// «Neu laden» holt die neueste Version (Noah 20.10.2026: his phone stayed on 0.157, and «Neu laden» on the
// error page only loaded the same old version again from the app's offline copy).
// With network: the offline copy of the app (the service worker and its stored files) is removed, then
// the page loads straight from the internet, so the newest version comes, and it is stored anew.
// Without network: a plain reload, so the app still starts from its offline copy.
// The data is never touched: it lives in IndexedDB and localStorage, which stay as they are. Other
// stored things (offline maps, the cut-out model) stay too: only the app's own file store goes.

/** Caches of the app's own files (Workbox precache); offline maps and other runtime caches stay. */
export const isAppCache = (name) => /^workbox-precache/.test(name);

/** Waits for a step at most `ms`: a step that hangs (Android sometimes never answers) must not stop the reload. */
const within = (p, ms = 3000) => Promise.race([Promise.resolve(p).catch(() => {}), new Promise((ok) => setTimeout(ok, ms))]);

/** The address with a changing `?fresh=` in front of the #: a plain reload() may be answered by a stale copy at the edge (GitHub Pages keeps pages 10 minutes). */
export function freshUrl(loc, now = Date.now()) {
  return `${loc.origin}${loc.pathname}?fresh=${now}${loc.hash || ''}`;
}

export async function freshReload(w = globalThis) {
  if (w.navigator?.onLine !== false) {
    await within(
      (async () => {
        const regs = (await w.navigator?.serviceWorker?.getRegistrations?.()) ?? [];
        await Promise.all(regs.map((r) => r.unregister()));
      })(),
    );
    await within(
      (async () => {
        const names = (await w.caches?.keys?.()) ?? [];
        await Promise.all(names.filter(isAppCache).map((n) => w.caches.delete(n)));
      })(),
    );
    // 30.10.2026 (Noah: «Jetzt laden» did nothing on the phone): a new address so the page is really fetched anew
    if (w.location.replace && w.location.origin) return w.location.replace(freshUrl(w.location));
  }
  w.location.reload();
}

/** Takes the `?fresh=` marker off the address again after a fresh load (the data and the # place stay). */
export function cleanFreshMarker(w = globalThis) {
  try {
    const u = new URL(w.location.href);
    if (!u.searchParams.has('fresh')) return;
    u.searchParams.delete('fresh');
    w.history.replaceState(w.history.state, '', u.pathname + u.search + u.hash);
  } catch {
    /* the marker may stay */
  }
}

/** Asks for a newer version right away (src/lib/swupdate.js reloads once it has taken over). */
export async function askForUpdate(w = globalThis) {
  try {
    await (await w.navigator?.serviceWorker?.getRegistration?.())?.update();
  } catch {
    /* offline: later */
  }
}
