/**
 * v0.67.0 «Übergänge 1» (Ü7a, flow audit U070, rule U8): the back key (Android back, the browser's
 * back button, a swipe back) closes an open dialog or sheet FIRST, and the page under it stays.
 *
 * Use on a <dialog>: `<dialog use:backClose>` or `use:backClose={onBack}`.
 * When the dialog opens, one history entry is added (same address, so no page changes). Back then
 * leaves only that entry: the dialog closes the way it closes on Escape (its own close handler keeps
 * what was typed), or onBack() runs instead (BikeDialog: keep the inputs by saving them).
 * When the dialog closes in another way (a button, Escape), the entry is taken away again, unless
 * the address changed meanwhile (a link inside the dialog went to another page).
 * Each open dialog has its own entry, so a dialog opened over another one closes first.
 */
let seq = 0;

export function backClose(node, onBack = null) {
  let back = onBack;
  let token = null; // our entry while the dialog is open
  let url = '';
  let leaving = false; // we call history.back() ourselves

  const push = () => {
    if (token) return;
    token = `d${++seq}`;
    url = location.href;
    history.pushState({ ...(history.state ?? {}), pgDialog: token }, '', url);
  };
  const drop = () => {
    const mine = token;
    token = null;
    if (!mine || leaving) return;
    if (history.state?.pgDialog === mine && location.href === url) {
      leaving = true;
      history.back();
    }
  };
  const onPop = () => {
    if (leaving) {
      leaving = false;
      return;
    }
    if (!token || !node.open) return;
    // still on (or above) our entry: nothing to do
    if (history.state?.pgDialog === token) return;
    token = null; // the entry is gone already
    if (back) back();
    else {
      const ev = new Event('cancel', { cancelable: true });
      node.dispatchEvent(ev);
      if (!ev.defaultPrevented && node.open) node.close();
    }
  };
  const watch = new MutationObserver(() => (node.open ? push() : drop()));
  watch.observe(node, { attributes: true, attributeFilter: ['open'] });
  const onClose = () => drop();
  node.addEventListener('close', onClose);
  window.addEventListener('popstate', onPop);
  if (node.open) push();
  return {
    update(fn) {
      back = fn;
    },
    destroy() {
      watch.disconnect();
      node.removeEventListener('close', onClose);
      window.removeEventListener('popstate', onPop);
      // the dialog leaves the page while open (its component closed): take the entry away too
      if (token) drop();
    },
  };
}
