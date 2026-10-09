/**
 * v0.51.0 «Im Flow»: a tap and a long press on the same button (Noah: one tap ticks, a long press
 * picks place and duration). Right click on a computer and the context-menu key do the long press
 * too. After a long press the click that follows is swallowed.
 */
export function press(node, opts) {
  let o = opts;
  let timer = null;
  let lastLong = 0;
  let sx = 0;
  let sy = 0;
  const fire = () => {
    lastLong = Date.now();
    try {
      navigator.vibrate?.(12);
    } catch {
      /* no vibration */
    }
    o?.long?.();
  };
  const down = (e) => {
    if (e.button) return;
    sx = e.clientX;
    sy = e.clientY;
    clearTimeout(timer);
    timer = setTimeout(fire, 520);
  };
  const move = (e) => {
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clearTimeout(timer);
  };
  const stop = () => clearTimeout(timer);
  const click = (e) => {
    if (Date.now() - lastLong < 900) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    o?.tap?.(e);
  };
  const menu = (e) => {
    e.preventDefault();
    clearTimeout(timer);
    if (Date.now() - lastLong > 900) fire();
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', stop);
  node.addEventListener('pointercancel', stop);
  node.addEventListener('pointerleave', stop);
  node.addEventListener('click', click);
  node.addEventListener('contextmenu', menu);
  return {
    update(next) {
      o = next;
    },
    destroy() {
      clearTimeout(timer);
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', stop);
      node.removeEventListener('pointercancel', stop);
      node.removeEventListener('pointerleave', stop);
      node.removeEventListener('click', click);
      node.removeEventListener('contextmenu', menu);
    },
  };
}
