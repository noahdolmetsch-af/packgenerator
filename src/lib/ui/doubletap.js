/**
 * «Doppeltipp-Schutz» (Durchklick Etappe 4, Noah 06.11.2026 «5a»): one shared block instead of a guard in every window.
 * A second tap on the same «Save» button within 450 ms does nothing. Before, two quick taps ran the save twice
 * (a to-do or a note twice, «Cannot read properties of null»). One catch in the capture phase covers every window:
 * submit buttons, and the main button («hi») inside a window or a form. Other buttons (+ / − steppers, tabs) are not touched.
 * `once()` in ui/ask.js stays for work that also must not overlap after the 450 ms.
 */
export const GAP_MS = 450;
export const GUARDED = 'button[type="submit"], input[type="submit"], dialog button.hi, form button.hi';

/** true when this click is the second tap on the same button within the gap */
export function isDoubleTap(last, el, time, gap = GAP_MS) {
  return !!last && last.el === el && time - last.time >= 0 && time - last.time < gap;
}

export function installDoubleTapGuard(root = document) {
  let last = null;
  root.addEventListener(
    'click',
    (e) => {
      const el = e.target?.closest?.(GUARDED);
      if (!el) return;
      if (isDoubleTap(last, el, e.timeStamp)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      last = { el, time: e.timeStamp };
    },
    true,
  );
}
