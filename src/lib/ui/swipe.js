/**
 * «Neuer Schwung» Packen 2, block B6 (Noah 26.10.2026 Stil S2, 27.10.2026 «1a 2a 3a»: page by page with motion):
 * swipe a row to the right to do its tap (tick an item). The tap stays: swiping is only a second way.
 * Only for touch and pen, only sideways: an up or down move scrolls the page as always (touch-action: pan-y).
 * While the finger moves, the row follows (CSS variable --sx in px, --sp from 0 to 1, class «swiping»);
 * past the line it is done, and the click that ends the swipe is swallowed.
 * Use: `<button use:swipeRight={() => …}>`.
 */
const SLOP = 8;

/** How far a row must go: 30 % of its width, at most 96 px, at least 48 px. */
export const swipeLine = (width) => Math.max(48, Math.min(96, Math.round((width || 0) * 0.3)));

/** Done: far enough to the right and more sideways than up or down. */
export const swipeDone = (dx, dy, width) => dx >= swipeLine(width) && Math.abs(dy) < dx / 2;

export function swipeRight(node, fn) {
  let run = fn;
  let at = null;
  let axis = null;
  let swallow = false;
  const set = (dx) => {
    const line = swipeLine(node.offsetWidth);
    node.style.setProperty('--sx', `${Math.round(dx)}px`);
    node.style.setProperty('--sp', String(Math.min(1, dx / line)));
  };
  const reset = () => {
    at = null;
    axis = null;
    node.classList.remove('swiping');
    node.style.removeProperty('--sx');
    node.style.removeProperty('--sp');
  };
  const down = (e) => {
    swallow = false; // only the click that ends a swipe is swallowed, never the next tap
    if (e.pointerType === 'mouse' || node.disabled || !run) return;
    at = { x: e.clientX, y: e.clientY, id: e.pointerId };
    axis = null;
  };
  const move = (e) => {
    if (!at || e.pointerId !== at.id) return;
    const dx = e.clientX - at.x;
    const dy = e.clientY - at.y;
    if (!axis) {
      if (Math.hypot(dx, dy) < SLOP) return;
      axis = Math.abs(dx) > Math.abs(dy) * 1.5 && dx > 0 ? 'x' : 'y';
      if (axis === 'y') return reset();
      node.classList.add('swiping');
      try {
        node.setPointerCapture(e.pointerId);
      } catch {
        // an old browser: the row still follows while the finger stays on it
      }
    }
    set(Math.max(0, dx));
  };
  const up = (e) => {
    if (!at || e.pointerId !== at.id) return;
    const dx = e.clientX - at.x;
    const dy = e.clientY - at.y;
    const was = axis;
    reset();
    if (was !== 'x') return;
    swallow = true;
    setTimeout(() => (swallow = false), 400);
    if (swipeDone(dx, dy, node.offsetWidth)) run?.();
  };
  const click = (e) => {
    if (!swallow) return;
    swallow = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', reset);
  node.addEventListener('click', click, true);
  return {
    update(next) {
      run = next;
    },
    destroy() {
      reset();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', reset);
      node.removeEventListener('click', click, true);
    },
  };
}
