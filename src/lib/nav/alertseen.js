// Durchklick Etappe 2, Design a (Noah 05.11.2026): a message stands where you caused it. Many forms write their red message
// ABOVE the form while the button you tapped is far below (a long list, a sheet that scrolls): it looked as if nothing happened
// (Befund E2-005, «Ausgeliehen»). Now every message that shows up right after a tap or a key (`role="alert"`) is brought
// into view when it is not fully in sight. Only the page moves, as little as needed ('nearest'); the focus stays where it is.
import { stillWanted } from './fadein.js';

/** How long after the last tap or key a new message counts as «caused by you». */
export const SINCE_TAP_MS = 6000;

/** The message is cut off or outside the screen (a box with no size is not on the screen at all: leave it). */
export function outOfSight(rect, vh) {
  if (!rect || (!rect.height && !rect.width)) return false;
  return rect.top < 0 || rect.bottom > vh;
}

/** The messages in a node that was just added: itself and what it holds. */
export function alertsIn(node) {
  if (!node || node.nodeType !== 1) return [];
  const out = node.matches?.('[role="alert"]') ? [node] : [];
  return out.concat([...(node.querySelectorAll?.('[role="alert"]') ?? [])]);
}

/** Installed once at the start. Returns a function that takes it away again. */
export function installAlertSeen(doc = document, win = window, now = () => performance.now()) {
  let last = -Infinity;
  const mark = () => (last = now());
  const evs = ['pointerdown', 'keydown', 'click'];
  for (const e of evs) doc.addEventListener(e, mark, true);
  const look = (el) => {
    if (!el.isConnected || now() - last > SINCE_TAP_MS) return;
    if (el.closest('[data-error-page]')) return; // the page that tells the app broke is not a message to a form
    if (!outOfSight(el.getBoundingClientRect(), win.innerHeight)) return;
    el.scrollIntoView({ block: 'nearest', behavior: stillWanted(win) ? 'auto' : 'smooth' });
  };
  const watch = new MutationObserver((list) => {
    const found = list.flatMap((m) => [...m.addedNodes].flatMap(alertsIn));
    // after the layout of this frame: the message has its place by then
    if (found.length) win.requestAnimationFrame(() => found.forEach(look));
  });
  watch.observe(doc.body, { childList: true, subtree: true });
  return () => {
    watch.disconnect();
    for (const e of evs) doc.removeEventListener(e, mark, true);
  };
}
