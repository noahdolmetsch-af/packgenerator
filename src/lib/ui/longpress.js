/**
 * P3b «Bedienregeln», R2a (Noah 15.10.2026 «5a»): a long press (or a right click on a computer) does a
 * second thing on a button, for example «Kaputt» on an item in the debrief. The click that ends a
 * long press is swallowed, so the button's own tap does not run too.
 * Use: `<button use:longPress={() => …}>`.
 */
export const HOLD_MS = 550;
const SLOP = 10;

export function longPress(node, fn) {
  let run = fn;
  let timer = null;
  let at = null;
  let fired = false;
  const clear = () => {
    clearTimeout(timer);
    timer = null;
    at = null;
  };
  const down = (e) => {
    if (e.button > 0) return;
    fired = false;
    at = { x: e.clientX, y: e.clientY };
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fired = true;
      navigator.vibrate?.(15);
      run?.();
    }, HOLD_MS);
  };
  const move = (e) => {
    if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > SLOP) clear();
  };
  const click = (e) => {
    if (!fired) return;
    fired = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const menu = (e) => {
    e.preventDefault();
    clear();
    if (fired) return; // a touch long press also opens the menu: done once
    run?.();
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', clear);
  node.addEventListener('pointercancel', clear);
  node.addEventListener('pointerleave', clear);
  node.addEventListener('click', click, true);
  node.addEventListener('contextmenu', menu);
  return {
    update(next) {
      run = next;
    },
    destroy() {
      clear();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', clear);
      node.removeEventListener('pointercancel', clear);
      node.removeEventListener('pointerleave', clear);
      node.removeEventListener('click', click, true);
      node.removeEventListener('contextmenu', menu);
    },
  };
}
