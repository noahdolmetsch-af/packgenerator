/**
 * «Verbesserungs-Logbuch» step 2 (Noah 21.11.2026): which block of the page was tapped. No page is prepared one by one:
 * the block is the smallest card, section or fold around the tap that has a title, and its name is that title
 * (the same way «Quick Links» finds the cards, quick/findcard.js).
 */

// [data-no-improve]: the button, its banner and the window never count as a block
const SKIP = 'dialog, [role=dialog], [data-no-improve]';
const BLOCK = 'section, article, details, fieldset, .card, [class*="card"], [class*="tile"], [class*="surf"], [class*="panel"]';
const TITLE = 'h1, h2, h3, h4, summary, legend, [class*="title"]';

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** The title of a block: its first heading (the block itself when it is a heading). */
export function titleOf(block) {
  const own = block.matches?.('h1, h2, h3, h4') ? block : block.querySelector(TITLE);
  const text = clean(own?.innerText ?? own?.textContent ?? '');
  return text.slice(0, 80);
}

/** The shown title of the page: the first h1 of main. */
export function pageTitleOf(doc = document) {
  return clean(doc.querySelector('main h1')?.textContent).slice(0, 80);
}

/**
 * The block around a tapped element: { el, title } or null (a tap on the button, a window, the bar or the empty page).
 * Climbs from the tap and takes the first block that has a title; a block that is the whole page (bigger than the
 * main area) does not count.
 */
export function blockAt(target, main = document.querySelector('main')) {
  if (!target || !main || !main.contains(target) || target.closest(SKIP)) return null;
  for (let el = target; el && el !== main; el = el.parentElement) {
    if (!el.matches(BLOCK)) continue;
    const title = titleOf(el);
    if (title) return { el, title };
  }
  // a tap on a heading itself, or on a loose line: the nearest heading above is the block's name
  const own = target.closest(TITLE);
  if (own && main.contains(own)) return { el: own, title: clean(own.textContent).slice(0, 80) };
  return null;
}

/** The place and size of an element for the orange frame (page coordinates are not needed: the frame is fixed). */
export function frameOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
