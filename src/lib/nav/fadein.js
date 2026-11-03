// «Ruhiges Einblenden» (Paket A Seitenwechsel 4, Noah 03.11.2026 «b»): a page that took longer than 0.3 s to load showed the grey
// placeholders (LazyPage + Skeleton, which already shimmer); its content used to replace them with one blink. Now the
// content fades in softly over them. A page that loads at once shows nothing and fades nothing (it never was a blink).
// The page has no wrapper of its own (its parts are direct children of <main>, the styles rely on that), so the nodes are
// found by their place: whatever stands between the two neighbours of the placeholder once the page is drawn.

/** The elements that stand between `prev` and `next` inside `parent` (prev null: from the start; next null: to the end). */
export function between({ parent, prev, next }) {
  if (!parent || (prev && prev.parentNode !== parent) || (next && next.parentNode !== parent)) return []; // the neighbours moved: better no fade than a wrong one
  const out = [];
  for (let n = prev ? prev.nextSibling : parent.firstChild; n && n !== next; n = n.nextSibling) if (n.nodeType === 1) out.push(n);
  return out;
}

/** True when the device asks for less motion or the app's switch «Bewegung» is on «Aus». */
export function stillWanted(win = globalThis) {
  try {
    if (win.document?.documentElement?.dataset?.motion === 'off') return true;
    return !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

/** Fades the elements from clear to shown (about a quarter of a second, an even ease so it reads as a fade and not as a blink); returns how many were faded. */
export function fadeIn(els, { ms = 260, still = stillWanted() } = {}) {
  if (still) return 0;
  let n = 0;
  for (const el of els) {
    if (typeof el.animate !== 'function') continue;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-out' });
    n++;
  }
  return n;
}
