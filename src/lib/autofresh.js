// Einmal frisch laden beim Start (Noah 27.10.2026 «1-5 a», question 4): when the app starts and a newer version
// is online that has still not arrived after 30 seconds (the normal update had its time), the app loads itself
// fresh from the internet once (freshreload.js; the data stays). At most once per online version, so a server
// that still hands out old files can never make it load again and again. Never while a ride is recorded
// (holdreload.js) or while the person types, and only when the app is on the screen.
import { onlineVersion, newer } from './behind.js';
import { freshReload } from './freshreload.js';
import { held as heldNow } from './holdreload.js';

export const KEY = 'pg-autofresh';
export const AFTER = 30_000;

const typing = (d) => {
  const el = d?.activeElement;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

/**
 * Loads fresh once when a newer version is online. Returns true when it started loading.
 * `reload` and `held` are for the tests.
 */
export async function autoFresh(w = globalThis, { running = __APP_VERSION__, base = import.meta.env.BASE_URL, reload = freshReload, held = heldNow } = {}) {
  const live = await onlineVersion(w, { base });
  if (!live || !newer(live, running)) return false;
  if (held() || typing(w.document) || w.document?.visibilityState === 'hidden') return false;
  let ls = null;
  try { ls = w.localStorage ?? null; } catch { /* none */ }
  if (!ls) return false; // without a place to remember it, it could load again and again
  try {
    if (ls.getItem(KEY) === live) return false;
    ls.setItem(KEY, live);
  } catch {
    return false;
  }
  await reload(w);
  return true;
}
