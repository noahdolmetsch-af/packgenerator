// Updates kommen auch aufs offene Handy (20.10.2026): Noah's Samsung stayed on 0.157 while 0.163 was live.
// The browser looks for a new service worker only when a page is loaded anew. An installed app that
// stays open in the background (Android keeps it for days) is only brought back, never loaded anew,
// so it never asked. And when a new worker took over anyway, the open page kept running the old code.
// Now:
// - when the app comes back to the screen, and every hour while it is open, it asks for a new version;
// - 27.11.2026 (Noah: «die App lädt von alleine immer wieder neu», mitten in der Arbeit): a new version waits
//   quietly (vite.config.js: no skipWaiting). It is switched on and the page loads anew ONLY while the app is in the
//   background (screen off, other app, other tab), so the person never sees it. A visible page is never reloaded.
// - never while a ride is recorded (holdreload.js): then after the ride, when the app goes to the background.
// - when the new version still has not arrived 15 minutes after it went online, a bar says so (behind.js).
// 27.10.2026 (Noah «1-5 a»): the bar comes after 2 minutes; and 30 seconds after a start the app loads itself
// fresh once when a newer version is online but has not arrived (autofresh.js).

import { warnIfBehind, verifyFresh } from './behind.js';
import { held as heldNow } from './holdreload.js';
import { autoFresh, AFTER } from './autofresh.js';
import { cleanFreshMarker } from './freshreload.js';

const HOUR = 60 * 60 * 1000;

/**
 * Starts the watcher. `w` is the window (tests pass a fake one).
 * Returns { check, reloadPending } for the tests.
 */
export function watchUpdates(w = globalThis, { every = HOUR, behind = warnIfBehind, held = heldNow, fresh = autoFresh, verify = verifyFresh } = {}) {
  // true when this start came from «load fresh» (the button, the error page or autofresh.js)
  const triedFresh = cleanFreshMarker(w);
  const sw = w.navigator?.serviceWorker;
  if (!sw) return null;
  const d = w.document;
  let hadController = !!sw.controller;
  let pending = false;
  let last = 0;

  const check = async () => {
    last = Date.now();
    try {
      const reg = await sw.getRegistration();
      await reg?.update();
    } catch {
      /* offline or no worker: next time */
    }
    try {
      // a new version that is stored and waits for the background is no «stuck» case: no bar (behind.js)
      const reg = await sw.getRegistration();
      if (!reg?.waiting) await behind(w);
    } catch {
      /* next time */
    }
  };
  const check2 = async () => {
    const reg = await sw.getRegistration().catch(() => null);
    if (!reg?.waiting) await behind(w);
  };
  const reloadNow = () => {
    pending = false;
    w.location.reload();
  };
  const reloadWhenSafe = () => {
    // a ride is being recorded (holdreload.js): the new version waits until it has stopped
    // a visible page is never reloaded (27.11.2026): it waits until the app goes to the background
    if (held() || d.visibilityState !== 'hidden') return void (pending = true);
    reloadNow();
  };
  /** In the background: switch a waiting new version on (its taking over then loads the page anew, unseen). */
  const applyWaiting = async () => {
    try {
      const reg = await sw.getRegistration();
      if (!reg?.waiting || held()) return false;
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch {
      return false;
    }
  };

  sw.addEventListener('controllerchange', () => {
    // the very first worker taking over (first visit) is no update: nothing to reload
    if (!hadController) return void (hadController = true);
    reloadWhenSafe();
  });
  d.addEventListener('visibilitychange', () => {
    if (d.visibilityState === 'hidden') {
      if (pending && !held()) return reloadNow();
      // the app is out of sight: the quiet moment for a new version (stored and waiting, or online but not yet arrived)
      applyWaiting().then((started) => started || fresh(w)).catch(() => {});
      return;
    }
    if (Date.now() - last > 60_000) check();
  });
  w.setInterval(() => d.visibilityState === 'visible' && check(), every);
  // on start too (the browser itself looks for a new worker on a start; this only asks for the version):
  // 27.11.2026: a newer version that has not arrived after 30 seconds no longer loads the page by itself (autofresh.js
  // waits for the background); only the bar may come, when nothing is waiting
  // 07.11.2026: a start that came from «load fresh» checks after 5 seconds that the newest version really arrived;
  // if not, the bar says so honestly (behind.js verifyFresh) instead of the button looking as if nothing happened
  w.setTimeout?.(
    () => (triedFresh ? verify(w).then((late) => late || check2()) : check2()).catch(() => {}),
    triedFresh ? 5000 : AFTER,
  );
  return { check, reloadPending: () => pending };
}
