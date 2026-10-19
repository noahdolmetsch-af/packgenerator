/**
 * v0.117.0 «Knöpfe neu» (mockups N1–N4, Noah 12.10.2026 22:47 «n1-n4 freigeben», answers 1a 2a 3a 4a 5b):
 * every button explains what it does.
 *
 * - Computer: the explanation shows as a dark bubble under the button on mouse hover and on keyboard
 *   focus (a short delay for the mouse, at once for the keyboard). Escape, leaving or a click hides it.
 * - Phone: a long press (~450 ms) shows the same bubble; the press then does NOT run the button (the
 *   click that follows is swallowed). A normal tap works as before.
 *
 * One listener for the whole app (installExplain, called once in main.js); no per-page code. A button
 * says what to show with two attributes, which ui/Btn.svelte and ui/MoreActions.svelte set for you:
 *
 *   data-explain="Als erledigt markieren"           the bubble's title (already translated)
 *   data-explain-sub="Gabel-Service · heute · 4’120 km"   an optional context line
 *   data-explain="off"                              no bubble (e.g. a chip whose text says it all)
 *
 * A button with only a symbol (×, «…», a pencil) and an aria-label explains itself with its
 * aria-label: rule 5 of N3 («Nur Symbol gibt es nur mit Erklärung»), for every page at once.
 * A control with its own `title` keeps the browser's tooltip on a computer; on a phone the long press
 * shows that title.
 *
 * The texts of N4 live in ui/explaintexts.js (EXPLAIN, keyed by the button's English label key) and are translated
 * through t() at the call site: `data-explain={explain('Done|task')}`.
 */
import { uiZoom, unzoomRect } from '../uizoom.js';
import { t } from '../i18n.svelte.js';
import { EXPLAIN } from './explaintexts.js';

export { EXPLAIN };

/** The translated explanation of a button key ('' when there is none). */
export const explain = (key) => (EXPLAIN[key] ? t(EXPLAIN[key]) : '');

/** How long a finger must stay on a button before its explanation shows (N1: «lange drücken»). */
export const PRESS_MS = 450;
/** A finger that moves farther than this is scrolling, not pressing. */
const SLOP = 10;
const HOVER_MS = 350;
const SEL = 'button, summary, a[href], [role="button"], [role="menuitem"], [data-explain]';

/** Does this element have visible words of its own? (A symbol, «•••» or «×» does not count.) */
export const hasWords = (text) => /\p{L}{2}/u.test(String(text ?? ''));

/**
 * What the bubble shows for an element: { title, sub } or null. Pure apart from reading attributes,
 * so a unit test can call it with a stub ({ getAttribute, textContent }).
 * `touch` is true for a long press (then a `title` attribute counts too).
 */
export function explainFor(el, touch = false) {
  if (!el?.getAttribute) return null;
  const own = el.getAttribute('data-explain');
  if (own === 'off') return null;
  const sub = el.getAttribute('data-explain-sub') || '';
  if (own) return { title: own, sub };
  if (!hasWords(el.textContent)) {
    const label = el.getAttribute('aria-label');
    if (label) return { title: label, sub };
  }
  if (touch) {
    const title = el.getAttribute('title');
    if (title) return { title, sub };
  }
  return null;
}

/**
 * Where the bubble goes for a button box: below it (above when there is no room), its right edge at
 * the button's right edge on a computer, centred on a phone; always inside the screen. Pure.
 * Returns { left, top, above, arrow } (arrow: x of the little tip inside the bubble).
 */
export function place(btn, bubble, vw, vh, centre = false, edge = 8, gap = 10) {
  let left = centre ? btn.left + btn.width / 2 - bubble.width / 2 : btn.right - bubble.width;
  left = Math.max(edge, Math.min(left, vw - edge - bubble.width));
  let top = btn.bottom + gap;
  const above = top + bubble.height > vh - edge && btn.top - gap - bubble.height >= edge;
  if (above) top = btn.top - gap - bubble.height;
  const arrow = Math.max(14, Math.min(bubble.width - 14, btn.left + btn.width / 2 - left));
  return { left: Math.round(left), top: Math.round(top), above, arrow: Math.round(arrow) };
}

let tip = null; // the one bubble element
let anchor = null; // the element it belongs to
let hoverTimer = 0;
let pressTimer = 0;
let hideTimer = 0;
let press = null; // { el, x, y }
let swallow = 0; // time until which the next click is swallowed (after a long press)
let ownDesc = null; // the anchor's own aria-describedby, given back on hide

function bubble() {
  if (tip?.isConnected) return tip;
  tip = document.createElement('div');
  tip.className = 'xtip';
  tip.id = 'xtip-bubble';
  tip.setAttribute('role', 'tooltip');
  if ('popover' in tip) tip.setAttribute('popover', 'manual'); // above an open modal window (top layer)
  document.body.append(tip);
  return tip;
}

function show(el, touch) {
  const what = explainFor(el, touch);
  if (!what) return;
  const b = bubble();
  clearTimeout(hideTimer);
  b.replaceChildren();
  const h = document.createElement('b');
  h.textContent = what.title;
  b.append(h);
  if (what.sub) {
    const s = document.createElement('small');
    s.textContent = what.sub;
    b.append(s);
  }
  if (b.popover) {
    try {
      if (b.matches(':popover-open')) b.hidePopover();
      b.showPopover(); // again on top of a window opened since
    } catch {
      /* not supported: it stays a fixed box in the page */
    }
  }
  b.classList.add('on');
  const narrow = window.innerWidth < 720;
  const z = uiZoom(); // «Grösse»: in the page's own pixels
  const p = place(unzoomRect(el.getBoundingClientRect(), z), unzoomRect(b.getBoundingClientRect(), z), document.documentElement.clientWidth, window.innerHeight / z, narrow || touch);
  b.style.left = `${p.left}px`;
  b.style.top = `${p.top}px`;
  b.style.setProperty('--ax', `${p.arrow}px`);
  b.classList.toggle('up', p.above);
  if (anchor && anchor !== el) giveBack();
  if (anchor !== el && what.title !== el.getAttribute('aria-label')) {
    ownDesc = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', ownDesc ? `${ownDesc} ${b.id}` : b.id);
  }
  anchor = el;
  if (touch) hideTimer = setTimeout(hide, 4000);
}

/** The anchor gets its own description back (or none). */
function giveBack() {
  if (anchor?.getAttribute('aria-describedby')?.includes('xtip-bubble')) {
    if (ownDesc) anchor.setAttribute('aria-describedby', ownDesc);
    else anchor.removeAttribute('aria-describedby');
  }
  ownDesc = null;
}

export function hide() {
  clearTimeout(hoverTimer);
  clearTimeout(hideTimer);
  giveBack();
  anchor = null;
  if (!tip) return;
  tip.classList.remove('on');
  try {
    if (tip.popover && tip.matches(':popover-open')) tip.hidePopover();
  } catch {
    /* nothing to hide */
  }
}

const target = (e) => (e.target instanceof Element ? e.target.closest(SEL) : null);

/** Install the one listener for the whole app. Returns a function that removes it again (tests). */
export function installExplain(doc = document) {
  const over = (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = target(e);
    if (el === anchor) return;
    clearTimeout(hoverTimer);
    if (!el || el.hasAttribute('title') || !explainFor(el)) return hide();
    hoverTimer = setTimeout(() => el.isConnected && el.matches(':hover') && show(el, false), anchor ? 0 : HOVER_MS);
  };
  const out = (e) => {
    if (e.pointerType !== 'mouse' || !anchor) return;
    const to = e.relatedTarget instanceof Element ? e.relatedTarget.closest(SEL) : null;
    if (to !== anchor) hide();
  };
  const focusIn = (e) => {
    const el = target(e);
    if (el && el === anchor) return; // the pressed button takes the focus after a long press: keep it
    if (el && el.matches(':focus-visible') && !el.hasAttribute('title') && explainFor(el)) show(el, false);
    else if (anchor) hide();
  };
  const down = (e) => {
    if (e.pointerType === 'mouse') return hide();
    hide();
    const el = target(e);
    if (!el || !explainFor(el, true)) return;
    press = { el, x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      if (!press || press.el !== el) return;
      swallow = Date.now() + 1500;
      show(el, true);
    }, PRESS_MS);
  };
  const move = (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP) {
      clearTimeout(pressTimer);
      press = null;
    }
  };
  const up = () => {
    clearTimeout(pressTimer);
    press = null;
  };
  const click = (e) => {
    if (swallow && Date.now() < swallow) {
      // the long press only explained: the button does not run (N1/N2, answer 2a)
      e.preventDefault();
      e.stopImmediatePropagation();
      swallow = 0;
      return;
    }
    swallow = 0;
    if (anchor) hide();
  };
  const menu = (e) => {
    if (press || (swallow && Date.now() < swallow)) e.preventDefault(); // no context menu on a long press
  };
  const key = (e) => e.key === 'Escape' && anchor && hide();
  const away = () => anchor && hide();
  const blur = (e) => anchor && e.target === anchor && hide();
  const opts = { capture: true };
  doc.addEventListener('pointerover', over, opts);
  doc.addEventListener('pointerout', out, opts);
  doc.addEventListener('focusin', focusIn, opts);
  doc.addEventListener('focusout', blur, opts);
  doc.addEventListener('pointerdown', down, opts);
  doc.addEventListener('pointermove', move, { capture: true, passive: true });
  doc.addEventListener('pointerup', up, opts);
  doc.addEventListener('pointercancel', up, opts);
  doc.addEventListener('click', click, opts);
  doc.addEventListener('contextmenu', menu, opts);
  doc.addEventListener('keydown', key, opts);
  window.addEventListener('scroll', away, { capture: true, passive: true });
  window.addEventListener('resize', away);
  return () => {
    doc.removeEventListener('pointerover', over, opts);
    doc.removeEventListener('pointerout', out, opts);
    doc.removeEventListener('focusin', focusIn, opts);
    doc.removeEventListener('focusout', blur, opts);
    doc.removeEventListener('pointerdown', down, opts);
    doc.removeEventListener('pointermove', move, { capture: true });
    doc.removeEventListener('pointerup', up, opts);
    doc.removeEventListener('pointercancel', up, opts);
    doc.removeEventListener('click', click, opts);
    doc.removeEventListener('contextmenu', menu, opts);
    doc.removeEventListener('keydown', key, opts);
    window.removeEventListener('scroll', away, { capture: true });
    window.removeEventListener('resize', away);
    hide();
  };
}
