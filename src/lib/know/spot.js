// «332 sichtbar», Frage 1 (Noah 27.10.2026 «c»): a function that sits inside a window, behind a tab or
// further down keeps its page as it is; a tap on it in «What the app can do» goes to the exact spot and
// lights it up for a moment. Each entry is a list of steps: every step but the last is tapped (a tab, a
// fold, a row that opens a window), the last one is the spot. A step is { sel } (a CSS selector),
// { text } (an English text: the first visible element whose text starts with it in the shown language;
// «{n}» and other placeholders match anything) or { aria } (the same for the element's aria-label).
// { …, unless: 'CSS' } skips a step when that is already on screen (a fold that is open already).
// heimat.js marks the same functions in GAPS with 'spot'; tests/e2e/spot.spec.js taps each one.
import { t } from '../i18n.svelte.js';

export const SPOT = {
  'f.switch': [{ text: '{n} more trips open' }],
  'f.starters': [{ text: 'Suggestion list {sport}' }],
  'f.tripbike': [{ aria: 'Bike: {value}. Change' }, { text: 'Compare bikes' }],
  'f.namesde': [{ sel: '#names-h' }],
  'f.fitbitold': [{ sel: '#fi-h' }],
  'f.merge': [{ sel: 'main h2 > button', unless: 'main li[data-item] button.main' }, { sel: 'main li[data-item] button.main' }, { sel: 'details[data-fold="more"] > summary' }, { text: 'Merge with …' }],
  'f.noteformats': [{ text: 'New note' }],
};

const WAIT = 6000;
const STEP = 150;

/** Is the element on screen: not hidden, not inside a closed fold (its summary counts as open). */
function visible(el) {
  for (let e = el; e; e = e.parentElement) {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
  }
  return el.getClientRects().length > 0;
}

/** A shown text as a pattern for the start of an element's text: placeholders such as {n} match anything. */
const pattern = (s) => new RegExp('^' + s.split(/\{[^}]+\}/).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+?'), 'i');

/** The element of a step, or null. Windows (dialogs) first, then the page. */
function find(step) {
  const roots = [...document.querySelectorAll('dialog[open], [role=dialog]'), document];
  for (const root of roots) {
    if (step.sel) {
      const el = [...root.querySelectorAll(step.sel)].find(visible);
      if (el) return el;
    } else {
      const want = pattern(t(step.text ?? step.aria));
      const said = (e) => (step.aria ? e.getAttribute('aria-label') : e.innerText) || '';
      const el = [...root.querySelectorAll('button, a, summary, h1, h2, h3, label, [role=tab]')].find((e) => visible(e) && want.test(said(e).trim().replace(/\s+/g, ' ')));
      if (el) return el;
    }
  }
  return null;
}

/** Wait for a step's element, up to WAIT ms. */
async function wait(step) {
  for (let n = 0; n < WAIT / STEP; n++) {
    const el = find(step);
    if (el) return el;
    await new Promise((ok) => setTimeout(ok, STEP));
  }
  return null;
}

/** Light the spot up for a moment (a calm ring; without motion when the device asks for less). */
export function light(el, id = '') {
  for (let e = el.parentElement; e; e = e.parentElement) if (e.tagName === 'DETAILS' && !e.open) e.open = true;
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  el.dataset.spotOn = id || '1';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ring = '0 0 0 4px color-mix(in srgb, var(--accent, #276a43) 55%, transparent)';
  if (calm || !el.animate) {
    const old = el.style.boxShadow;
    el.style.boxShadow = ring;
    setTimeout(() => ((el.style.boxShadow = old), delete el.dataset.spotOn), 2600);
  } else {
    el.animate([{ boxShadow: '0 0 0 0 transparent' }, { boxShadow: ring, offset: 0.25 }, { boxShadow: ring, offset: 0.75 }, { boxShadow: '0 0 0 0 transparent' }], { duration: 1300, iterations: 2 }).finished.finally(() => delete el.dataset.spotOn);
  }
}

/** Go to the spot of a function (any key of SPOT, also one that is not in the catalogue). False when a step is missing. */
export const showSpot = (id) => (SPOT[id] ? showSteps(SPOT[id], id) : Promise.resolve(false));

/** Tap the steps in turn, then light up the last one. id marks it (data-spot-on). False when a step is missing. */
export async function showSteps(steps, id = '') {
  // the new page first: the page the tap came from may show the same words
  await new Promise((ok) => setTimeout(ok, 300));
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].unless && find({ sel: steps[i].unless })) continue;
    const el = await wait(steps[i]);
    if (!el) return false;
    if (i < steps.length - 1) el.click();
    else light(el, id);
  }
  return true;
}
