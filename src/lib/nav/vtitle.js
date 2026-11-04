// «Der Titel fliegt mit» (Paket A Seitenwechsel 2, Noah 03.11.2026 «b»): tap a tour's name in the list and the name travels to its
// place at the top of the tour page, so the eye can follow. It is a View Transition (the browser draws the move) that
// only the name takes part in; the rest of the page appears at once, as before.
//
// How it works without touching the router: a link marked `data-vt-title` gets the name «pg-title» when it is tapped. When the
// address changes right after, this file holds the `hashchange` back for one frame (so the browser can take its picture of the
// list first), lets the transition run, and then passes the event on to the app, which draws the new page. The tour
// page's heading takes the same name while `<html data-vt>` is set (app.css). A browser without View Transitions, «Reduce
// motion» and the switch «Bewegung: Aus» leave everything as it was: the event is never held back.

/** True when the device asks for less motion or the app's switch «Bewegung» is on «Aus» (the same test as fadein.js of «Ruhiges Einblenden»). */
function stillWanted(win) {
  try {
    if (win.document?.documentElement?.dataset?.motion === 'off') return true;
    return !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

export const NAME = 'pg-title';
export const TARGET = '[data-tour-page] h1';
const FRESH_MS = 1500; // a tap counts for the address change right after it, not for one much later
const WAIT_MS = 700; // how long the new page may take to draw its heading (its code may load first)

/** Waits (frame by frame) until `find()` gives something, at most `ms`; resolves either way. */
function waitFor(win, find, ms) {
  return new Promise((resolve) => {
    const t0 = win.performance.now();
    const look = () => (find() || win.performance.now() - t0 > ms ? resolve() : win.requestAnimationFrame(look));
    look();
  });
}

/** Installs the flight; returns a function that removes it. Does nothing where there are no View Transitions. */
export function installTitleFlight(win = globalThis.window) {
  const doc = win?.document;
  if (!doc || typeof doc.startViewTransition !== 'function') return () => {};
  let mark = null; // { el, at, timer }
  let busy = false;
  const passed = new WeakSet(); // the events this file sends on itself

  const clear = () => {
    if (!mark) return;
    win.clearTimeout(mark.timer);
    mark.el.style.viewTransitionName = '';
    mark = null;
  };
  const onClick = (e) => {
    clear();
    if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = e.target?.closest?.('a[data-vt-title]');
    if (!a || busy) return;
    a.style.viewTransitionName = NAME;
    mark = { el: a, at: win.performance.now(), timer: win.setTimeout(clear, FRESH_MS) };
  };
  const onHash = (e) => {
    if (passed.has(e) || busy || !mark || win.performance.now() - mark.at > FRESH_MS || stillWanted(win)) return;
    e.stopImmediatePropagation(); // the app hears it in a moment, from the transition
    busy = true;
    doc.documentElement.dataset.vt = '';
    const t = doc.startViewTransition(async () => {
      const again = new win.HashChangeEvent('hashchange', { oldURL: e.oldURL, newURL: e.newURL });
      passed.add(again);
      win.dispatchEvent(again);
      await waitFor(win, () => doc.querySelector(TARGET), WAIT_MS);
    });
    const end = () => {
      clear();
      delete doc.documentElement.dataset.vt;
      busy = false;
    };
    t.finished.then(end, end);
  };
  // capture phase on the window and before the app's own listeners: this file is installed first
  win.addEventListener('click', onClick, true);
  win.addEventListener('hashchange', onHash);
  return () => {
    clear();
    win.removeEventListener('click', onClick, true);
    win.removeEventListener('hashchange', onHash);
  };
}
