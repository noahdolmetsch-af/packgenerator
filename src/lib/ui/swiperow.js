/**
 * B13 «Wischen in Listen» (Noah 27.10.2026 «4a»): one swipe for every list. Right shows the
 * «done» side (done, packed, pin), left the «away» side (move, delete). Pure, tested in tests/swiperow.test.js.
 * The gear rows (gear/swipe.js) work the same way; this takes any number of actions per side.
 */
import { direction, ACTION_W, LONG } from '../gear/swipe.js';

export { direction, ACTION_W, LONG };

/**
 * Where the row rests after the finger lets go. offset: px the row is moved (+ right, − left);
 * width: the row's width; right / left: how many actions each side has.
 * → { state: 'closed' | 'right' | 'left' | 'long-right' | 'long-left', offset }.
 * A long swipe does the first action of that side at once (with Undo), the row snaps back.
 */
export function settle(offset, width, { right = 0, left = 0 } = {}) {
  const rw = right * ACTION_W;
  const lw = left * ACTION_W;
  const long = (w) => Math.max(width * LONG, w + 40);
  if (left && offset <= -long(lw)) return { state: 'long-left', offset: 0 };
  if (right && offset >= long(rw)) return { state: 'long-right', offset: 0 };
  if (left && offset <= -lw / 2) return { state: 'left', offset: -lw };
  if (right && offset >= rw / 2) return { state: 'right', offset: rw };
  return { state: 'closed', offset: 0 };
}

/** The row's offset while the finger moves: a side without actions does not open at all. */
export function follow(start, dx, width, { right = 0, left = 0 } = {}) {
  const max = right ? width : 0;
  const min = left ? -width : 0;
  return Math.max(min, Math.min(max, start + dx));
}
