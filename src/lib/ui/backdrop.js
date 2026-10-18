/**
 * P3b «Daten sicher», app rule 3a (Noah 15.10.2026 «3a»): a tap beside a window closes it, in every
 * window the same way as Escape (the window's own `cancel` handling runs first, so what was typed
 * stays: ui/keeptyped.js, or the window's own «keep»). One listener for the whole app (main.js).
 *
 * Only a tap that starts AND ends outside the window's box counts (a text selection that ends outside
 * does not close it). Windows with their own tap-beside rule carry data-backdrop="own".
 */
function outside(dlg, e) {
  const r = dlg.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

export function installBackdropClose(doc = globalThis.document) {
  if (!doc) return () => {};
  let downOn = null;
  const down = (e) => {
    const d = e.target;
    downOn = d?.tagName === 'DIALOG' && d.open && outside(d, e) ? d : null;
  };
  const click = (e) => {
    const d = e.target;
    const start = downOn;
    downOn = null;
    if (!d || d !== start || d.tagName !== 'DIALOG' || !d.open || d.dataset.backdrop === 'own') return;
    if (!d.matches(':modal') || !outside(d, e)) return;
    const ev = new Event('cancel', { cancelable: true });
    d.dispatchEvent(ev);
    if (!ev.defaultPrevented && d.open) d.close();
  };
  doc.addEventListener('pointerdown', down, true);
  doc.addEventListener('click', click);
  return () => {
    doc.removeEventListener('pointerdown', down, true);
    doc.removeEventListener('click', click);
  };
}
