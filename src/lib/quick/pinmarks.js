/**
 * «Quick Links» step 2 (Noah 28.10.2026 «1a 2a», ideas 19): a small pin at the top right of every card,
 * table and tab that is a function of the catalogue. A tap pins it into Quick Links; a second tap unpins.
 *
 * Which cards: every function has one home page (know/heimat.js HOME) where it can be seen under its
 * catalogue name (tests/e2e/heimat.spec.js checks that). So on a page the app looks for the functions whose
 * home it is and finds their title there, the same way the robot test does. No page needs its own code.
 * Pure helpers here (tests/pinmarks.test.js); lib/quick/PinMarks.svelte places the pins.
 */
import { HOME, GAPS } from '../know/heimat.js';
import { FEATURE } from '../features.js';

/** Settings keys: pins on or off (on unless switched off), the first-time hint seen, the short tour closed. */
export const MARK_KEYS = { on: 'quickLinks.marks', hint: 'quickLinks.hint', tour: 'quickLinks.tour' };

/** The part of a hash before «?» and the query (as a string, '' when none). */
function split(hash) {
  const h = String(hash ?? '').replace(/^#?/, '#');
  const i = h.indexOf('?');
  const path = (i < 0 ? h : h.slice(0, i)).replace(/\/+$/, '') || '#';
  return { path: path === '#' ? '#/' : path, query: i < 0 ? '' : h.slice(i + 1) };
}

/**
 * Does a home page (as in HOME: «:trip», «:race», «:note», «:entry» stand for any one id) match the
 * shown address? A home with «?open=…» needs that query; a home without a query matches any query.
 */
export function homeMatches(home, hash) {
  const a = split(home);
  const b = split(hash);
  const re = new RegExp('^' + a.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(trip|race|note|entry)/g, '[^/]+') + '$');
  if (!re.test(b.path)) return false;
  if (!a.query) return true;
  const want = new URLSearchParams(a.query);
  const have = new URLSearchParams(b.query);
  return [...want].every(([k, v]) => have.get(k) === v);
}

/** The functions whose home is this address and that the page shows (not in GAPS), as catalogue ids. */
export function featuresOn(hash, home = HOME, gaps = GAPS, known = FEATURE) {
  return Object.keys(home).filter((id) => known[id] && !gaps[id] && homeMatches(home[id], hash));
}

/** A shown name made comparable: without brackets, «», ★ and extra spaces, in lower case. */
export const cleanName = (s) =>
  String(s ?? '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/[«»★›]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Does an element's shown text start with a function's name? (Short names must match whole words.) */
export function textFits(text, name) {
  const t = cleanName(text);
  const n = cleanName(name);
  if (!n || !t.startsWith(n)) return false;
  return t.length === n.length || !/[\p{L}\p{N}]/u.test(t[n.length]);
}

/**
 * Where a pin sits on a card (document coordinates, 44 px box): first straddling the card's top right
 * corner, else at the end of the title. `free(box)` says whether the box covers nothing to tap; the first
 * free candidate wins, none: null. The box never leaves the page (width w).
 */
export function placePin(card, title, w, free = () => true, size = 44) {
  const clamp = (x) => Math.max(0, Math.min(x, w - size));
  const cands = [
    { x: clamp(card.right - size + 10), y: card.top - 14 },
    { x: clamp(title.right + 2), y: title.top + (title.height - size) / 2 },
  ];
  return cands.find((b) => free({ ...b, w: size, h: size })) ?? null;
}
