/**
 * «Anpassen» 1a (Noah 20.10.2026): the parts of any page, found in the page itself, so every page can be
 * changed without each page knowing about it.
 *
 * A part is a block of the page with a heading (h2; h3 when a page has fewer than two h2). The blocks are
 * the children of the smallest element that holds all those headings. What is not a part (a line of text,
 * a button row) stays with the part before it.
 *
 * The page's own code is never touched: hiding sets data-anp-hide (app.css: display none), sorting sets
 * the CSS order of the blocks (the holder becomes a flex column only when you sorted), a new name changes
 * the text of the heading and is put back when the page writes its own text again. Svelte keeps its own
 * nodes where they are, so nothing breaks when the page redraws.
 */
import { byOrder, partKey } from '../anpassen.js';

const SKIP = 'dialog, [inert], [aria-hidden="true"], nav, .top, .anp-foot, .pagehead';

/** The headings that name parts: visible (or hidden by us), not in a window, a menu or the page head. */
function headings(root, tag) {
  return [...root.querySelectorAll(tag)].filter((h) => !h.closest(SKIP) && (h.getClientRects().length || h.closest('[data-anp-hide]')));
}

/** The smallest element holding all the nodes. */
function holderOf(nodes) {
  let c = nodes[0].parentElement;
  while (c && !nodes.every((n) => c.contains(n))) c = c.parentElement;
  return c;
}

/** The text of a heading as the app wrote it (before an own name). */
export function origText(h) {
  return (h.dataset.anpOrig ?? h.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * The parts of the page under root: [{ key, label, el, head }] in the page's own order, and the holder.
 * Two headings with the same text get «#2», «#3» on their key.
 */
export function findParts(root) {
  if (!root) return { holder: null, parts: [] };
  let hs = headings(root, 'h2');
  if (hs.length < 2) hs = headings(root, 'h3');
  if (hs.length < 2) return { holder: null, parts: [] };
  const holder = holderOf(hs);
  if (!holder) return { holder: null, parts: [] };
  const parts = [];
  const seen = new Map();
  for (const el of holder.children) {
    const head = hs.find((h) => el === h || el.contains(h));
    if (!head) continue;
    const label = origText(head);
    const base = partKey(label);
    if (!base) continue;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    parts.push({ key: n > 1 ? `${base}#${n}` : base, label, el, head });
  }
  return parts.length >= 2 ? { holder, parts } : { holder: null, parts: [] };
}

/** Write a text into a heading, into its first text (icons and counts beside it stay). */
function writeName(h, text) {
  const walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
  const first = walk.nextNode();
  if (!first) return;
  if (first.nodeValue !== text) first.nodeValue = text;
}

/**
 * Bring the page in line with the choice cfg = { hide, order, names } (anpassen.js pageCfg).
 * Returns the parts found, for the window.
 */
export function applyParts(root, cfg) {
  const { holder, parts } = findParts(root);
  // a heading that has an own name: keep the app's text, put the own one in; the app wrote a new text → take that as the app's text
  for (const p of parts) {
    const h = p.head;
    const own = cfg.names?.[p.key];
    if (h.dataset.anpName && h.textContent.replace(/\s+/g, ' ').trim() !== h.dataset.anpName) {
      // the page changed its heading itself: that is the app's text now
      delete h.dataset.anpOrig;
      delete h.dataset.anpName;
    }
    if (own) {
      if (h.dataset.anpOrig == null) h.dataset.anpOrig = origText(h);
      writeName(h, own);
      h.dataset.anpName = h.textContent.replace(/\s+/g, ' ').trim();
    } else if (h.dataset.anpOrig != null) {
      writeName(h, h.dataset.anpOrig);
      delete h.dataset.anpOrig;
      delete h.dataset.anpName;
    }
    if (cfg.hide?.includes(p.key)) p.el.setAttribute('data-anp-hide', '');
    else p.el.removeAttribute('data-anp-hide');
  }
  // order: only when you sorted; the blocks without heading follow the part before them
  if (holder) {
    const sorted = byOrder(parts, cfg.order ?? [], (p) => p.key);
    const changed = sorted.some((p, i) => p !== parts[i]);
    if (changed) {
      const rank = new Map(sorted.map((p, i) => [p.el, (i + 1) * 10]));
      let r = 0;
      for (const el of holder.children) {
        if (el.matches('.anp-foot')) {
          el.style.order = '99999'; // «Diese Seite anpassen» stays last
          continue;
        }
        if (rank.has(el)) r = rank.get(el);
        el.style.order = String(rank.get(el) ?? r + 1);
      }
      if (!holder.hasAttribute('data-anp-sorted')) {
        holder.setAttribute('data-anp-sorted', '');
        // CSS order works in a flex or grid holder; a plain block holder becomes a flex column (app.css)
        const d = getComputedStyle(holder).display;
        if (!/flex|grid/.test(d)) holder.setAttribute('data-anp-flex', '');
      }
    } else if (holder.hasAttribute('data-anp-sorted')) {
      unsort(holder);
    }
  }
  return parts;
}

/** Take every change back off the page (when the page has no choice left). */
export function clearParts(root) {
  if (!root) return;
  for (const el of root.querySelectorAll('[data-anp-hide]')) el.removeAttribute('data-anp-hide');
  for (const h of root.querySelectorAll('[data-anp-orig]')) {
    writeName(h, h.dataset.anpOrig);
    delete h.dataset.anpOrig;
    delete h.dataset.anpName;
  }
  for (const holder of root.querySelectorAll('[data-anp-sorted]')) unsort(holder);
}

function unsort(holder) {
  for (const el of holder.children) el.style.order = '';
  holder.removeAttribute('data-anp-sorted');
  holder.removeAttribute('data-anp-flex');
}

/**
 * Keep the page in line while it loads and redraws: a MutationObserver on root, at most once per frame.
 * onparts(parts) hears the parts found each time. Returns stop().
 */
export function watchParts(root, getCfg, onparts = null) {
  if (!root || typeof MutationObserver === 'undefined') return () => {};
  let queued = 0;
  let busy = false;
  const run = () => {
    queued = 0;
    busy = true;
    try {
      const parts = applyParts(root, getCfg());
      onparts?.(parts);
    } finally {
      // our own writes come back as records; let them pass before listening again
      obs.takeRecords();
      busy = false;
    }
  };
  const obs = new MutationObserver(() => {
    if (busy || queued) return;
    queued = requestAnimationFrame(run);
  });
  // style: a page that writes its own style attribute takes our order away; it is put back
  obs.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style'] });
  run();
  return () => {
    obs.disconnect();
    if (queued) cancelAnimationFrame(queued);
  };
}
