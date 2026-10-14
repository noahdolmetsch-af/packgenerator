/**
 * Four usability items (Noah 13.10.2026: FE1 «b», FE13/FE14/FE16 «a»), the logic they share. Plain
 * functions without Svelte, so tests/daumen.test.js can call them.
 *
 * FE13 «Farbe nie allein»: a status in colour also carries a sign. The pills of app.css (.pill.ok,
 *   .pill.warn, .pill.bad) and the dots (.udot) get theirs in CSS; other places put `data-sign` on the
 *   coloured element (ui/fe-seiten.css shows it, with an empty alternative text, so the words stay
 *   the accessible name).
 * FE14 «? an Ort und Stelle»: the one sentence of a difficult field (FIELD_HELP), shown by ui/Help.svelte.
 * FE16 «Passende Handy-Tastatur»: `use:weiter` on a form: number fields open the number keyboard,
 *   the keyboard's Enter says «Weiter» and jumps to the next field, the last field says «Fertig».
 */

/** FE13: the sign of each tone (✓ ok, ! warn or bad). The CSS in app.css and trip.css uses the same. */
export const SIGN = { ok: '✓', warn: '!', bad: '!' };

/** FE13: the sign for a tone, '' for a tone without one (neutral). */
export const signFor = (tone) => SIGN[tone] ?? '';

/**
 * FE14: one plain sentence per difficult field or value, keyed by the field. English source text,
 * translated at the call site with t() (German in i18n/de/daumen.js).
 */
export const FIELD_HELP = {
  moving: 'Moving time counts only the minutes the bike was rolling; stops are left out.',
  elapsed: 'Elapsed time runs from the start to the end of the ride, stops included.',
  np: 'NP (normalised power) weighs hard efforts more than the plain average, so it tells how tiring the ride was.',
  ftp: 'FTP is the power you could hold for about an hour; the app estimates it from your best 20 minutes.',
  load: 'Load compares the ride’s NP with your FTP: 1.0 means the whole ride at your hour limit.',
  hours: 'How long you ride per day, without breaks; the app uses it for food, water and charging.',
  grams: 'Weigh one piece in grams; the app multiplies it by the quantity.',
  pressure: 'The pressure you want in the tyre, in bar; what you measure goes into the tyre history.',
  limit: 'The value at which this part is worn; once a measurement reaches it, the part shows as due.',
  sag: 'Sag is how far the suspension sinks when you sit on the bike, in percent of its travel.',
};

/** FE16: input types a person types into (the keyboard opens), so Enter can move on. */
const TYPED = new Set(['text', 'number', 'tel', 'email', 'url', 'search', 'password', '']);

/**
 * FE16: is this element a field the keyboard types into? Pure apart from reading attributes and
 * whether it is shown, so a test can pass a stub { tagName, type, disabled, readOnly, checkVisibility }.
 */
export function isTypingField(el) {
  if (!el || String(el.tagName).toUpperCase() !== 'INPUT') return false;
  if (!TYPED.has(String(el.type ?? '').toLowerCase())) return false;
  if (el.disabled || el.readOnly) return false;
  if (el.closest?.('[data-weiter="off"]')) return false;
  // shown: checkVisibility also sees a field inside a closed <details>; older browsers: its boxes
  if (typeof el.checkVisibility === 'function') return el.checkVisibility();
  return !el.getClientRects || el.getClientRects().length > 0;
}

/** FE16: the field after `el` in `fields`, or null when `el` is the last one (or not in the list). */
export function nextField(fields, el) {
  const i = fields.indexOf(el);
  return i >= 0 && i < fields.length - 1 ? fields[i + 1] : null;
}

/** FE16: what the keyboard's Enter key says on each field: «next», the last one «done». */
export const hintsFor = (n) => Array.from({ length: n }, (_, i) => (i < n - 1 ? 'next' : 'done'));

/**
 * FE16: the keyboard for a number field (type="number" without its own inputmode): 'numeric' for
 * whole numbers, 'decimal' when the step allows parts; null when it may be below zero (the phone's
 * number pad has no minus key, so the normal keyboard stays).
 */
export function numberMode(el) {
  if (String(el?.type ?? '').toLowerCase() !== 'number') return null;
  const min = el.getAttribute?.('min');
  if (min == null || min === '' || Number(min) < 0) return null;
  const step = el.getAttribute?.('step');
  return step && (step === 'any' || !Number.isInteger(Number(step))) ? 'decimal' : 'numeric';
}

/**
 * FE16: a Svelte action for a form (or any box of fields). The fields it sees when one gets focus are
 * the shown, typed ones in order. With two or more: Enter on a field that is not the last moves to the
 * next one (instead of sending the form) and the keyboard says «Weiter» there, «Fertig» on the last.
 * A field whose own Enter does something (e.preventDefault()) keeps it; `data-weiter="off"` leaves a
 * field or a part out. Number fields without an inputmode get the number keyboard (numberMode).
 */
export function weiter(node) {
  const fields = () => [...node.querySelectorAll('input')].filter(isTypingField);
  const prepare = () => {
    const list = fields();
    for (const el of list) {
      const mode = !el.hasAttribute('inputmode') && numberMode(el);
      if (mode) el.setAttribute('inputmode', mode);
    }
    if (list.length < 2) return list;
    hintsFor(list.length).forEach((h, i) => list[i].setAttribute('enterkeyhint', h));
    return list;
  };
  const onfocus = (e) => {
    if (isTypingField(e.target)) prepare();
  };
  // On the document, not the form: Svelte runs a field's own onkeydown at the app root, after the form.
  const onkey = (e) => {
    if (!node.contains(e.target)) return;
    if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!isTypingField(e.target)) return;
    const list = prepare();
    if (list.length < 2) return;
    const next = nextField(list, e.target);
    if (!next) return; // the last field: Enter sends the form as before
    e.preventDefault();
    next.focus();
  };
  prepare();
  node.addEventListener('focusin', onfocus);
  const doc = node.ownerDocument;
  doc.addEventListener('keydown', onkey);
  return {
    destroy() {
      node.removeEventListener('focusin', onfocus);
      doc.removeEventListener('keydown', onkey);
    },
  };
}
