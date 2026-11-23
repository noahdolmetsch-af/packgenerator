/**
 * «Position merken» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja», point 5): after «Zurück» you are at the same place on the
 * page you left, not at the top. Before, the app jumped to the top on every change of address, also back to a long list.
 *   - While a page is shown, its scroll position is kept per address (this tab only: sessionStorage, 60 addresses).
 *   - A step forward (a link) opens at the top, as before. A step back or forward in the history (the entry was shown before and
 *     carries the mark `pgv` in its history state) goes back to the kept position, as soon as the page is long enough
 *     (pages load later; it waits up to 1.5 s and gives up the moment you scroll yourself).
 * `remember` is pure and tested in tests/scrollmem.test.js; the rest touches the window and is tested in tests/e2e/zurueck-position.spec.js.
 */
const KEY = 'pg.scrollmem';
const MAX = 60;
const WAIT_MS = 1500;

/** The kept positions with one more: newest last, at most `max` addresses, a position of 0 is dropped. Pure. */
export function remember(mem, key, y, max = MAX) {
  const out = { ...mem };
  delete out[key];
  if (y > 0) out[key] = Math.round(y);
  const keys = Object.keys(out);
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) delete out[k];
  return out;
}

const read = () => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};
let mem = read();
const write = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    /* private window: the positions last until the page is closed */
  }
};

let current = null; // the address whose position is being kept now (null: not now, e.g. while a position is restored)
let raf = 0;
let cancelRestore = null;

function keep() {
  raf = 0;
  if (current) mem = remember(mem, current, window.scrollY);
}

/** Start keeping the position of the page shown (call once). Returns a function that stops it. */
export function trackScroll() {
  const onScroll = () => {
    if (current && !raf) raf = requestAnimationFrame(keep);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', write);
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pagehide', write);
  };
}

/** The address is about to change: keep the position of the page that goes. */
export function leavePage() {
  if (cancelRestore) cancelRestore();
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  keep();
  write();
  current = null;
}

/** Mark the entry of the history that shows this page, so a later step back to it restores the position. */
const mark = () => {
  try {
    if (!history.state?.pgv) history.replaceState({ ...(history.state ?? {}), pgv: 1 }, '', location.href);
  } catch {
    /* no history: nothing to restore */
  }
};

/**
 * A page opened. back: the entry was shown before (a step in the history). Forward: to the top. Back: to the kept position.
 * hash: the address shown (the key). Returns nothing.
 */
export function arrivePage(hash, back) {
  const y = back ? mem[hash] ?? 0 : 0;
  mark();
  if (!(y > 0)) {
    window.scrollTo(0, 0);
    current = hash;
    return;
  }
  current = null; // while the page is still short, the browser clamps the position: do not keep that
  let done = false;
  const start = performance.now();
  const stop = () => {
    done = true;
    cancelRestore = null;
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  cancelRestore = () => {
    stop();
  };
  const finish = (go) => {
    if (go) window.scrollTo(0, y);
    stop();
    current = hash;
  };
  window.addEventListener('wheel', stop, { passive: true, once: true });
  window.addEventListener('touchstart', stop, { passive: true, once: true });
  window.addEventListener('keydown', stop, { once: true });
  const step = () => {
    if (done) {
      current = hash; // the person scrolled by hand: keep from now on
      return;
    }
    const long = document.documentElement.scrollHeight >= y + window.innerHeight;
    if (long || performance.now() - start > WAIT_MS) return finish(true);
    requestAnimationFrame(step);
  };
  window.scrollTo(0, 0);
  requestAnimationFrame(step);
}

/** The first page of the visit: mark its entry and start keeping; the browser restores a reload itself. */
export function startPage(hash) {
  mark();
  current = hash;
}

/** For the tests: forget everything. */
export function resetScrollMemory() {
  mem = {};
  current = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to forget */
  }
}
