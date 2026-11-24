/**
 * «Bewegung» (Noah 24.11.2026 «4a»): the two small moves of the daily handgrips.
 * - rowOut: a row that goes away (ticked off, deleted with «Rückgängig») folds its height away while it fades, and the rows below
 *   move up (use with `animate:flip` on the same keyed row). `out:rowOut` plays only when the list itself changes, not when the
 *   whole page goes.
 * - tickPop: the tick mark of what you just ticked grows a little and settles (one time, never on a page that opens with ticks).
 * Both are still with «Bewegung: Aus» and with «reduce motion» (theme.svelte.js motionStill). The times are the tokens of app.css
 * (--t-fast, --t-base, --t-sheet); tests/bewegung.test.js keeps the two in step.
 */
import { slide } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';
import { motionStill } from '../theme.svelte.js';

export const MOVE = { fast: 120, base: 200, sheet: 320 };

/** Svelte transition: the row's height folds to 0 and it fades. */
export function rowOut(node, { duration = MOVE.base } = {}) {
  if (motionStill()) return { duration: 0 };
  const s = slide(node, { duration, easing: cubicOut });
  return { ...s, css: (t, u) => `${s.css(t, u)}opacity:${t};` };
}

/** The `animate:flip` options for the rows that move up (200 ms, none when still). */
export const flipOpts = () => ({ duration: motionStill() ? 0 : MOVE.base, easing: cubicOut });

/** Let the tick mark pop once: `el` is the box that now shows the tick. */
export function tickPop(el) {
  if (!el || motionStill()) return;
  el.classList.remove('tick-pop');
  void el.offsetWidth; // start again when it is tapped twice quickly
  el.classList.add('tick-pop');
  el.addEventListener('animationend', () => el.classList.remove('tick-pop'), { once: true });
}
