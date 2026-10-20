// Updates kommen auch aufs offene Handy (20.10.2026): Noah's Samsung stayed on 0.157 while 0.163 was live.
// The browser looks for a new service worker only when a page is loaded anew. An installed app that
// stays open in the background (Android keeps it for days) is only brought back, never loaded anew,
// so it never asked. And when a new worker took over anyway, the open page kept running the old code.
// Now:
// - when the app comes back to the screen, and every hour while it is open, it asks for a new version;
// - when a new version has taken over, the page loads anew, but never while the person types: then it
//   waits until the app goes to the background or the field is left.
// - when the new version still has not arrived 15 minutes after it went online, a bar says so (behind.js).

import { warnIfBehind } from './behind.js';

const HOUR = 60 * 60 * 1000;

/** Typing in a field right now? Then a reload would lose the text. */
const typing = (d) => {
  const el = d.activeElement;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

/**
 * Starts the watcher. `w` is the window (tests pass a fake one).
 * Returns { check, reloadPending } for the tests.
 */
export function watchUpdates(w = globalThis, { every = HOUR, behind = warnIfBehind } = {}) {
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
      await behind(w);
    } catch {
      /* next time */
    }
  };
  const reloadNow = () => {
    pending = false;
    w.location.reload();
  };
  const reloadWhenSafe = () => {
    if (d.visibilityState === 'hidden' || !typing(d)) return reloadNow();
    pending = true;
  };

  sw.addEventListener('controllerchange', () => {
    // the very first worker taking over (first visit) is no update: nothing to reload
    if (!hadController) return void (hadController = true);
    reloadWhenSafe();
  });
  d.addEventListener('visibilitychange', () => {
    if (d.visibilityState === 'hidden') {
      if (pending) reloadNow();
      return;
    }
    if (Date.now() - last > 60_000) check();
  });
  d.addEventListener('focusout', () => {
    if (pending) w.setTimeout(() => pending && !typing(d) && reloadNow(), 0);
  });
  w.setInterval(() => d.visibilityState === 'visible' && check(), every);
  // on start too (the browser itself looks for a new worker on a start; this only asks for the version)
  w.setTimeout?.(() => behind(w).catch(() => {}), 20_000);
  return { check, reloadPending: () => pending };
}
