// v0.77.0: Svelte's `animate:flip`, plus one repair at the end of every move.
//
// When a moved row has finished, Svelte cancels the transform animation and drops its effect
// (`animation.cancel(); animation.effect = null`). Chromium then sometimes keeps the row's old hit-test
// geometry: the row is drawn in its place but clicks fall through to the list behind it, so a button
// like «Ablegen» in the Inbox did nothing (seen in e2e list047, about one run in four). Touching the
// row's transform once after the cancel makes the browser recompute it; a plain style write without a
// layout read in between is coalesced away, so the read is needed.
import { flip as svelteFlip } from 'svelte/animate';

/** Re-validate an element's transform after a cancelled animation (see above). */
export function refreshTransform(node) {
  const style = node.style;
  const before = style.transform;
  style.transform = before ? `${before} translateZ(0)` : 'translateZ(0)';
  void node.getBoundingClientRect();
  style.transform = before;
}

/** Drop-in for `flip` from 'svelte/animate'. */
export function flip(node, rects, params) {
  const anim = svelteFlip(node, rects, params);
  return {
    ...anim,
    // tick(1) runs in the animation's onfinish, just before Svelte cancels it: repair right after.
    tick: (t) => {
      if (t === 1) queueMicrotask(() => node.isConnected && refreshTransform(node));
    },
  };
}
