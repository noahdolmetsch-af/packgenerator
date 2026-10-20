// Tempo «Seiten später laden» (Noah 19.10.2026, idea #1045): a page's code is loaded the first time it opens,
// not at the start. The app file stays small (the offline store keeps files up to 6 MiB each, vite.config.js),
// and the start reads less. The service worker still stores every part at install, so all pages open offline.
//
// A new page: add it to PAGES in App.svelte as `Name: () => import('./pages/Name.svelte')` and show it with
// <LazyPage load={PAGES.Name} />. Only Heute (Home) is loaded at the start.

import { held } from '../holdreload.js';

const done = new Map(); // loader → component, once loaded
const RELOAD_KEY = 'lazy.reloadedAt';

/** The component of a loader once it is loaded (else null), so a second visit draws at once. */
export const loadedOf = (load) => done.get(load) ?? null;

/**
 * Loads a page. After a new version went live, an open app may ask for a part whose old name is gone:
 * then the page reloads once to fetch the new version (at most once a minute, so it can never loop).
 */
export async function loadPage(load, { reload = () => location.reload(), store = globalThis.sessionStorage, now = Date.now() } = {}) {
  if (done.has(load)) return done.get(load);
  try {
    const m = await load();
    done.set(load, m.default);
    return m.default;
  } catch (err) {
    let last = 0;
    try {
      last = Number(store?.getItem(RELOAD_KEY)) || 0;
    } catch {
      /* private mode */
    }
    // never in the middle of a recorded ride (holdreload.js): then the error page shows, the ride goes on
    if (now - last > 60_000 && !held()) {
      try {
        store?.setItem(RELOAD_KEY, String(now));
      } catch {
        /* private mode */
      }
      reload();
      return new Promise(() => {}); // the page reloads; nothing to draw meanwhile
    }
    throw err; // the error page shows (App.svelte svelte:boundary)
  }
}

/** Loads pages in the background when the browser is idle, so a later first visit is instant too. */
export function warmUp(loaders, idle = globalThis.requestIdleCallback ?? ((f) => setTimeout(f, 1500))) {
  const list = [...loaders];
  const next = () => {
    const load = list.shift();
    if (!load) return;
    loadPage(load, { reload: () => {} })
      .catch(() => {})
      .finally(() => idle(next));
  };
  idle(next);
}
