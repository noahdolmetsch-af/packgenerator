/**
 * «Hilfe-Karte nach dem Titel» (Noah 08.11.2026 «A»): the card «What you can do here» is drawn by App.svelte before the page, but
 * a page starts with its title (UX-Test 08.11.2026, 1-01 / 2b-01). This action, set on the card's host element, moves the host to
 * just behind the page's title (the first visible h1 in <main>, with its subtitle or its button row), and keeps it there when the page
 * draws again (a tab, a list that loads). Nothing is removed or hidden: the card and its line only change their place.
 * A page without an h1, or one that has not drawn its title after a moment, keeps the card where App.svelte puts it (on top).
 * The host stays hidden until it has its place, so the card does not jump from the top to the title.
 */

/** How long a page may take to draw its title before the card shows on top (a page that has no h1 at all). */
export const WAIT_MS = 900;

const OUT = 'dialog, [hidden], [aria-hidden="true"], [data-pathline], [data-place-switch], [data-seiteninhalt-host]';
/** A class that names a head block: .pagehead, .head, .hero, .titel, .title. */
const HEADISH = /head|hero|titel|title/i;

/** The first h1 of the page that is on screen (not in a window, not hidden, not a 1-pixel screen-reader title), or null. */
export function titleOf(main, host) {
  for (const h of main.querySelectorAll('h1')) {
    if (host.contains(h) || h.closest(OUT)) continue;
    const r = h.getBoundingClientRect();
    if (!h.getClientRects().length || r.height < 6) continue;
    return h;
  }
  return null;
}

/**
 * The element after which the card goes: the title; when the title sits in a row with buttons or in a head block (.pagehead,
 * <header>), that whole row or block; behind one short subtitle paragraph.
 */
export function placeAfter(h1, main, win = window) {
  let a = h1;
  for (let i = 0; i < 3; i++) {
    const p = a.parentElement;
    if (!p || p === main || p.offsetHeight > 420) break;
    const st = win.getComputedStyle(p);
    const row = /flex/.test(st.display) && !/column/.test(st.flexDirection);
    const cls = typeof p.className === 'string' ? p.className : '';
    if (!(row || p.tagName === 'HEADER' || HEADISH.test(cls))) break;
    a = p;
  }
  if (a === h1) {
    const n = a.nextElementSibling;
    if (n && n.tagName === 'P' && n.textContent.length < 300 && !n.querySelector('button, a, input')) a = n;
  }
  return a;
}

/** Svelte action for the host element of the card. */
export function afterTitle(host) {
  const main = host.closest('main');
  if (!main) return {};
  const home = document.createComment('si-home'); // where App.svelte put the card: the fallback and the way back
  host.before(home);
  let raf = 0;
  let late = false;
  let timer = 0;

  const run = () => {
    raf = 0;
    if (!main.isConnected) return;
    // nothing to show on this page: it needs no place
    if (!host.firstElementChild) {
      if (!host.isConnected) home.after(host);
      return;
    }
    const h1 = titleOf(main, host);
    if (h1) {
      const a = placeAfter(h1, main);
      if (!host.isConnected || host.previousElementSibling !== a) a.after(host);
      host.dataset.placed = 'title';
    } else if (late) {
      if (!host.isConnected || host.previousSibling !== home) home.after(host);
      host.dataset.placed = 'top';
    } else {
      if (!host.isConnected) home.after(host);
      delete host.dataset.placed;
    }
  };
  const soon = () => {
    if (!raf) raf = requestAnimationFrame(run);
  };
  const wait = () => {
    late = false;
    delete host.dataset.placed; // a new page: hidden until the card has its place behind the new title
    clearTimeout(timer);
    timer = setTimeout(() => {
      late = true;
      soon();
    }, WAIT_MS);
  };

  const mo = new MutationObserver(soon);
  mo.observe(main, { childList: true, subtree: true });
  const onHash = () => {
    wait();
    soon();
  };
  window.addEventListener('hashchange', onHash);
  wait();
  soon();

  return {
    destroy() {
      mo.disconnect();
      window.removeEventListener('hashchange', onHash);
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      home.remove();
    },
  };
}
