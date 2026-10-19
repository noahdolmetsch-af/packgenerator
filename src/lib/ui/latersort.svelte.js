/**
 * «Bewegung» + «Gestaltungsregeln» §5.3/§5.6 (Noah 19.10.2026 «1a»: ticked items slide down, everywhere).
 * A tick list shows the open rows first and the done ones below. After a tap the order stays as it is
 * for SORT_MS (more taps in a row restart the wait), so a quick second tap still hits the row under the
 * finger (Noah's phone test B3/B4, v0.30.2); then the done rows slide down. With animate:flip and
 * glide() the rows glide 250 ms; with reduced motion they move at once.
 *
 *   const sort = laterSort((r) => r.id, (r) => r.done);
 *   {#each sort.order(list) as r (r.id)}<li animate:flip={glide()}> … onclick={() => (sort.tap(list), tick(r.id))}
 */
import { cubicOut } from 'svelte/easing';

export const SORT_MS = 1000;

/** True when the person asked the device for less motion. */
export const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The parameters for animate:flip on a sorting row. */
export const glide = () => ({ duration: still() ? 0 : 250, easing: cubicOut });

export function laterSort(idOf, doneOf, ms = SORT_MS) {
  let frozen = $state.raw(null);
  let timer = null;
  const settled = (rows) => [...rows.filter((r) => !doneOf(r)), ...rows.filter((r) => doneOf(r))];
  const order = (rows) => {
    if (!frozen) return settled(rows);
    const at = (r) => {
      const i = frozen.indexOf(idOf(r));
      return i < 0 ? frozen.length : i;
    };
    return [...rows].sort((a, b) => at(a) - at(b));
  };
  return {
    order,
    /** Call before the tick is saved: keeps the order as shown, then lets the done rows slide down. */
    tap(rows) {
      if (!frozen) frozen = order(rows).map(idOf);
      clearTimeout(timer);
      timer = setTimeout(() => (frozen = null), ms);
    },
    stop() {
      clearTimeout(timer);
    },
  };
}
