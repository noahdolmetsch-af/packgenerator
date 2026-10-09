/**
 * v0.38.0 (Noah 3a, 4a): swiping a gear row on a phone. Pure, tested in tests/swipe.test.js.
 * - right: Favourite and Assign … show on the left;
 * - left: Delete (an item never on a trip) or Archive (an item already used on trips) shows on the
 *   right; a long swipe left does it at once, always with Undo. A real delete of a used item is only
 *   the red button in the item itself.
 * A row moves only when the finger goes clearly sideways: up and down stays the page's scroll.
 */

/** px the finger must move before the row decides between sideways and scrolling. */
export const SLOP = 10;
/** How much more sideways than up or down a move must be to count as a swipe. */
export const RATIO = 1.3;
/** px of one revealed action button. */
export const ACTION_W = 88;
/** A swipe further than this share of the row width does the first action at once. */
export const LONG = 0.55;

/** 'swipe' (sideways), 'scroll' (up or down) or null (not decided yet) for a move of dx, dy. */
export function direction(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < SLOP && ay < SLOP) return null;
  return ax > ay * RATIO ? 'swipe' : 'scroll';
}

/** What the left swipe offers: used on a trip → archive; else delete (Noah 4a). */
export const leftActions = (used) => (used ? ['archive'] : ['delete']);
/** What the right swipe offers (Noah 3a). */
export const RIGHT_ACTIONS = ['favourite', 'assign'];

/**
 * Where the row rests after the finger lets go. offset: px the row is moved (+ right, − left);
 * width: the row's width. → { state: 'closed' | 'right' | 'left' | 'long', offset }.
 * 'long': the first left action is done at once (archive or delete), the row snaps back.
 */
export function release(offset, width, { used = false } = {}) {
  const leftW = leftActions(used).length * ACTION_W;
  const rightW = RIGHT_ACTIONS.length * ACTION_W;
  if (offset <= -Math.max(width * LONG, leftW + 40)) return { state: 'long', offset: 0 };
  if (offset <= -leftW / 2) return { state: 'left', offset: -leftW };
  if (offset >= rightW / 2) return { state: 'right', offset: rightW };
  return { state: 'closed', offset: 0 };
}

/** The row's offset while the finger moves: start + dx, kept within the actions (and the long swipe). */
export function drag(start, dx, width) {
  const rightW = RIGHT_ACTIONS.length * ACTION_W;
  return Math.max(-width, Math.min(rightW + 24, start + dx));
}

/** Is the item on at least one trip (then it is archived, not deleted)? */
export const usedOnTrips = (itemId, trips = []) => trips.some((t) => (t.entries ?? []).some((e) => e.itemId === itemId));
/** How many trips an item was on. */
export const tripCount = (itemId, trips = []) => trips.filter((t) => (t.entries ?? []).some((e) => e.itemId === itemId)).length;
