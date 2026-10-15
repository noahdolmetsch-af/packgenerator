/**
 * KT «Kacheln antippbar» (Noah 14.10.2026, 3a, mockup KT3): the short intro on Today, the pure rules.
 * Three steps, each pointing at one element of Today: the first small tile, the first activity in
 * «Im Flow» (left out when there is none) and «Customise the start page». It comes once after an
 * update (settings «homeIntroKT»: true = seen; false = «show it again» from Me), never while editing,
 * over a sheet, in the playground or while Today keeps its tips back (hush).
 * The words are English keys for t(); the component (IntroKT.svelte) translates them.
 */

/** settings key: true once the intro was finished or skipped; false asks for it again (Me). */
export const INTRO_KEY = 'homeIntroKT';

/** The three steps; `sel` finds the element on Today, `key` + `more` are the bold part and the rest. */
export const STEPS = [
  { id: 'tile', sel: '.wall [data-opens]', title: 'Open tiles', text: 'Tap a tile to open its page.', key: 'Long press:', more: 'change its size or move it.' },
  { id: 'tick', sel: '[data-section="flow"] [data-act]', title: 'Tick off', text: 'A tap ticks, a second tap takes it back.', key: '••• or a long press:', more: 'duration, place, stopwatch.' },
  { id: 'custom', sel: '[data-intro="custom"]', title: 'Your start page', text: 'Here you choose, move and resize tiles.', key: '', more: '' },
];

/** The steps whose element is there (has(sel) → boolean); the order stays. */
export const introSteps = (has) => STEPS.filter((s) => has(s.sel));

/**
 * Should the intro start now? value: the stored settings value; updated: an update was seen on this
 * device (wasneuStore). Not while editing, over a sheet, in the playground or with hush.
 */
export function introDue({ value, updated = false, editing = false, sheet = false, play = false, hush = false }) {
  if (value === true || editing || sheet || play || hush) return false;
  return value === false || (value == null && !!updated);
}

/** The step after i of n, or null when the intro is done. */
export const nextStep = (i, n) => (i + 1 < n ? i + 1 : null);

/** The main button: «Next 1/3» … and «Done» on the last step (an English key and its numbers). */
export const mainLabel = (i, n) => (i + 1 < n ? { key: 'Next {i}/{n}|intro', vars: { i: i + 1, n } } : { key: 'Done|intro', vars: {} });

/**
 * Where the bubble goes: under the element when there is room, else above it; kept inside the screen.
 * r: the element's rect; vw, vh: the screen; bw, bh: the bubble's size; gap: space to the element.
 */
export function bubblePlace(r, { vw, vh, bw, bh, gap = 14, edge = 12 }) {
  const below = r.bottom + gap + bh <= vh - edge || r.top - gap - bh < edge;
  const top = below ? Math.min(r.bottom + gap, Math.max(edge, vh - edge - bh)) : Math.max(edge, r.top - gap - bh);
  const left = Math.min(Math.max(edge, r.left), Math.max(edge, vw - edge - bw));
  // the little arrow points at the element's middle (or near it when the bubble is pushed aside)
  const arrow = Math.min(Math.max(18, r.left + Math.min(r.width, 120) / 2 - left), bw - 18);
  return { top, left, below, arrow };
}
