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
 *
 * v0.72.0 «Feinschliff» (Umbenennen 2a): on a real Android phone Chrome closes a modal <dialog> on
 * back by itself (CloseWatcher → `cancel` → close), without a popstate, so onBack never ran there and
 * the typed name was lost (tests used history.back(), which goes the popstate way). With onBack the
 * `cancel` event (Android back, Escape) now runs onBack too, like NoteSheet's oncancel: back keeps.
 */
let seq = 0;
/** Tokens of the dialogs open now, with their <dialog>. An entry whose dialog closed is stale and may be reused. */
const live = new Map();

export function backClose(node, onBack = null) {
  let back = onBack;
  let token = null; // our entry while the dialog is open
  let url = '';
  let leaving = false; // we call history.back() ourselves
  let tapped = true; // our entry was added in a tap (user activation)

  const push = () => {
    if (token) return;
    token = `d${++seq}`;
    url = location.href;
    const state = { ...(history.state ?? {}), pgDialog: token };
    // one dialog closes and the next opens in the same tap («Neu» → «Tour planen»): the closed one's
    // entry is still there (its history.back() waits), so this one takes it over instead of a second.
    // Paket 3: the closed one may still count as live, because its `close` event comes a task later
    // («Neu» → «Werkstattbesuch»); a dialog that is no longer open gives its entry up too.
    const cur = history.state?.pgDialog;
    const owner = cur ? live.get(cur) : null;
    // Fix 27.10.2026 (AB3): a dialog that opens by itself (Heute's check window, no tap) adds its entry without
    // user activation. Chrome then marks the page's own entry as skippable, and history.back() skips it too:
    // closing the dialog left Heute. Such an entry is not taken back with history.back() but cleared in place.
    // An entry taken over from before a reload counts as one without a tap as well.
    if (cur && (!owner || !owner.open)) {
      live.delete(cur);
      tapped = !!owner && (navigator.userActivation?.isActive ?? true);
      history.replaceState(state, '', url);
    } else {
      tapped = navigator.userActivation?.isActive ?? true;
      history.pushState(state, '', url);
    }
    live.set(token, node);
  };
  const drop = () => {
    const mine = token;
    token = null;
    if (!mine) return;
    live.delete(mine);
    if (leaving) return;
    // wait for the rest of the tap: a link in the dialog changes the address, a next dialog takes the
    // entry over; only when we are still on our own entry, it is taken away
    setTimeout(() => {
      if (history.state?.pgDialog === mine && location.href === url) {
        if (!tapped) {
          const { pgDialog: _, ...rest } = history.state ?? {};
          history.replaceState(Object.keys(rest).length ? rest : null, '', url);
          return;
        }
        leaving = true;
        history.back();
      }
    }, 0);
  };
  const onPop = () => {
    if (leaving) {
      leaving = false;
      return;
    }
    if (!token || !node.open) return;
    // still on (or above) our entry: nothing to do
    const cur = history.state?.pgDialog;
    if (cur === token) return;
    // Paket NE 1146 (three dialogs: setup photos › big photo › drawing): the top one closed and its entry
    // went back to the middle one, which is still open above ours, so ours stays as well
    if (cur && live.get(cur)?.open && Number(cur.slice(1)) > Number(token.slice(1))) return;
    live.delete(token);
    token = null; // the entry is gone already
    if (back) back();
    else {
      const ev = new Event('cancel', { cancelable: true });
      node.dispatchEvent(ev);
      if (!ev.defaultPrevented && node.open) node.close();
    }
  };
  // Fix 14.10.2026 (flaky «Liste anpassen» on the phone): dialog.close() fires its `close` event in a
  // later task, and the page opens the next dialog from that event. Dropping right away (from the
  // observer) let our history.back() run before the next dialog took the entry over; the back then
  // landed under the next dialog and closed it too. So the entry is dropped from the `close` event;
  // only when the `open` attribute goes away without one, a short fallback drops it.
  let fallback = null;
  const watch = new MutationObserver(() => {
    if (node.open) {
      clearTimeout(fallback);
      fallback = null;
      push();
    } else if (token && fallback == null) fallback = setTimeout(() => ((fallback = null), drop()), 50);
  });
  watch.observe(node, { attributes: true, attributeFilter: ['open'] });
  const onClose = () => {
    clearTimeout(fallback);
    fallback = null;
    drop();
  };
  // Android back (CloseWatcher) and Escape: keep what was typed instead of closing without it
  const onCancel = (e) => {
    if (!back || e.defaultPrevented) return;
    e.preventDefault();
    back();
  };
  node.addEventListener('close', onClose);
  node.addEventListener('cancel', onCancel);
  window.addEventListener('popstate', onPop);
  if (node.open) push();
  return {
    update(fn) {
      back = fn;
    },
    destroy() {
      watch.disconnect();
      clearTimeout(fallback);
      node.removeEventListener('close', onClose);
      node.removeEventListener('cancel', onCancel);
      window.removeEventListener('popstate', onPop);
      // the dialog leaves the page while open (its component closed): take the entry away too
      if (token) drop();
    },
  };
}
