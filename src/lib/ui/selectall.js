/**
 * v0.119.0 «Schnellstart» (mockup Q3, Noah 13.10.2026 «Q1–Q3 freigegeben»): a trip name field marks
 * its whole text when it gets the focus (tap, click or Tab), so typing writes over the automatic name
 * («202610130000»). A click into the field that already has the focus places the caret as usual.
 *
 *   <input use:selectAll bind:value={draft.title} />
 *
 * The browser places the caret on the mouseup after a click (a tap sends one too) and so takes the selection away
 * again; that one release after the focusing press is held back (preventDefault), the next is not.
 */
export function selectAll(el) {
  let fresh = false; // the press that is giving the focus right now
  const down = () => {
    fresh = document.activeElement !== el;
  };
  const focus = () => {
    try {
      el.select();
    } catch {
      /* a field type without a selection */
    }
  };
  const up = (e) => {
    if (!fresh) return;
    fresh = false;
    e.preventDefault();
    focus();
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('focus', focus);
  el.addEventListener('mouseup', up);
  return {
    destroy() {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('focus', focus);
      el.removeEventListener('mouseup', up);
    },
  };
}
