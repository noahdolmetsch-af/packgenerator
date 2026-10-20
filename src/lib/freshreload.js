// «Neu laden» holt die neueste Version (Noah 20.10.2026: his phone stayed on 0.157, and «Neu laden» on the
// error page only loaded the same old version again from the app's offline copy).
// With network: the offline copy of the app (the service worker and its stored files) is removed, then
// the page loads straight from the internet, so the newest version comes, and it is stored anew.
// Without network: a plain reload, so the app still starts from its offline copy.
// The data is never touched: it lives in IndexedDB and localStorage, which stay as they are. Other
// stored things (offline maps, the cut-out model) stay too: only the app's own file store goes.

/** Caches of the app's own files (Workbox precache); offline maps and other runtime caches stay. */
export const isAppCache = (name) => /^workbox-precache/.test(name);

export async function freshReload(w = globalThis) {
  if (w.navigator?.onLine !== false) {
    try {
      const regs = (await w.navigator?.serviceWorker?.getRegistrations?.()) ?? [];
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* nothing to remove */
    }
    try {
      const names = (await w.caches?.keys?.()) ?? [];
      await Promise.all(names.filter(isAppCache).map((n) => w.caches.delete(n)));
    } catch {
      /* nothing to remove */
    }
  }
  w.location.reload();
}

/** Asks for a newer version right away (src/lib/swupdate.js reloads once it has taken over). */
export async function askForUpdate(w = globalThis) {
  try {
    await (await w.navigator?.serviceWorker?.getRegistration?.())?.update();
  } catch {
    /* offline: later */
  }
}
