/**
 * v0.47.3 (Noah: the phone ••• menu of the packing list was cut off at the left edge at 390 px):
 * a small menu that opens next to its ••• stays inside the screen. Its CSS places it as before
 * (below the button, right-aligned); when that runs over an edge it is moved sideways, and when it
 * runs under the bottom of the screen (or the bottom bar) it flips above its button. Never shrunk.
 * (care/MoreMenu had its own "open upwards" from v0.46.1; it now uses this one.)
 *
 * Use as an action on the menu box: `<div class="menu" use:inView>`. It fits once when shown (a menu
 * under {#if open}) and every time its <details> opens (a menu inside <details>), and on resize.
 */
export const EDGE = 8;
/** Room kept free under the sticky top bar when a menu flips up outside a dialog. */
export const TOP_BAR = 64;

/** How far a box must move sideways to stay inside [edge, width − edge]; 0 when it fits. Pure. */
export function shiftX(left, right, width, edge = EDGE) {
  let dx = 0;
  if (right > width - edge) dx = width - edge - right;
  if (left + dx < edge) dx = edge - left;
  return dx;
}

/**
 * How far a box below its button must move up. 0 when it fits above `floor`; else it flips above the
 * button (gap kept) when there is room under `ceiling`. Without that room it stays (0): a long menu
 * in the page scrolls with it, and it never covers its own ••• . Pure.
 * box { top, bottom }, button { top, bottom }.
 */
export function shiftY(box, button, floor, ceiling = EDGE, edge = EDGE) {
  if (box.bottom <= floor - edge) return 0;
  const height = box.bottom - box.top;
  const gap = button ? Math.max(0, box.top - button.bottom) : 0;
  if (button && button.top - gap - height >= ceiling) return button.top - gap - height - box.top;
  return 0;
}

function fit(node) {
  node.style.translate = '';
  const r = node.getBoundingClientRect();
  if (!r.width) return;
  const button = node.parentElement?.querySelector(':scope > button, :scope > summary')?.getBoundingClientRect();
  const inDialog = !!node.closest('dialog, [role=dialog]');
  const bar = inDialog ? null : document.querySelector('nav.bottom')?.getBoundingClientRect();
  const floor = bar && bar.height ? Math.min(bar.top, window.innerHeight) : window.innerHeight;
  const dx = shiftX(r.left, r.right, document.documentElement.clientWidth);
  const dy = shiftY(r, button, floor, inDialog ? EDGE : TOP_BAR);
  if (dx || dy) node.style.translate = `${Math.round(dx)}px ${Math.round(dy)}px`;
}

export function inView(node) {
  const details = node.closest('details');
  const run = () => fit(node);
  run();
  details?.addEventListener('toggle', run);
  window.addEventListener('resize', run);
  return {
    destroy() {
      details?.removeEventListener('toggle', run);
      window.removeEventListener('resize', run);
    },
  };
}
