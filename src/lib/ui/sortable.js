/**
 * v0.163.x «Pfeile und Ziehen» (Noah 15.10.2026 «2a und b möglich - gilt überall für alles»): every
 * list you can sort has both the arrows ↑↓ (one place up or down) and a handle to drag the row with
 * the finger, the mouse or a pen. The arrows stay the way for the keyboard and for small steps.
 *
 * Use as an action on the list: `<ul use:sortable={{ onmove: (from, to) => … }}>`. Every row is a
 * direct child `li` (or `row`, a selector) and has a handle with `data-sort-grip` (SortGrip.svelte).
 * While a row is dragged it follows the pointer and the rows it passes make room; the new order is
 * given once, on letting go (onmove(from, to), indices in the list as shown). Escape or a cancelled
 * pointer puts everything back.
 */
import { uiZoom } from '../uizoom.js'; // «Grösse»: moves in the page's own pixels

/** The new place of row `from` when its middle sits at `y`: how many of the other rows have their middle above it. */
export function dropIndex(mids, from, y) {
  let to = 0;
  mids.forEach((m, i) => {
    if (i !== from && y > m) to++;
  });
  return to;
}

/** How far row i moves to make room while row `from` is held at place `to` (in units of the held row's height). */
export function shiftOf(i, from, to) {
  if (i === from) return 0;
  if (from < to && i > from && i <= to) return -1;
  if (to < from && i >= to && i < from) return 1;
  return 0;
}

export function sortable(node, opts = {}) {
  let o = opts;
  let st = null;
  const rowsOf = () => [...node.querySelectorAll(o.row ?? ':scope > li')];

  function reset() {
    if (!st) return;
    for (const r of st.rows) {
      r.style.transform = '';
      r.style.transition = '';
      r.classList.remove('sort-moving');
    }
    node.classList.remove('sort-active');
    st = null;
  }
  function down(e) {
    const grip = e.target.closest?.('[data-sort-grip]');
    if (!grip || !node.contains(grip) || e.button || o.off) return;
    const rows = rowsOf();
    const row = rows.find((r) => r.contains(grip));
    if (!row) return;
    e.preventDefault();
    grip.setPointerCapture?.(e.pointerId);
    const boxes = rows.map((r) => r.getBoundingClientRect());
    const from = rows.indexOf(row);
    st = { rows, row, from, to: from, y0: e.clientY, h: boxes[from].height, z: uiZoom(), mids: boxes.map((b) => b.top + b.height / 2) };
    row.classList.add('sort-moving');
    node.classList.add('sort-active');
  }
  function move(e) {
    if (!st) return;
    const dy = e.clientY - st.y0;
    st.to = dropIndex(st.mids, st.from, st.mids[st.from] + dy);
    st.rows.forEach((r, i) => {
      if (i === st.from) r.style.transform = `translateY(${dy / st.z}px)`;
      else {
        r.style.transition = 'transform 120ms ease';
        r.style.transform = `translateY(${(shiftOf(i, st.from, st.to) * st.h) / st.z}px)`;
      }
    });
  }
  function up() {
    if (!st) return;
    const { from, to } = st;
    reset();
    if (to !== from) o.onmove?.(from, to);
  }
  const key = (e) => e.key === 'Escape' && st && (e.preventDefault(), reset());

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', reset);
  node.addEventListener('keydown', key);
  return {
    update(next) {
      o = next ?? {};
    },
    destroy() {
      reset();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', reset);
      node.removeEventListener('keydown', key);
    },
  };
}
