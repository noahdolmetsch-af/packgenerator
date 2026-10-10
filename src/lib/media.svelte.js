/**
 * `phone.matches` is true on narrow screens. It is reactive: components that read it
 * update by themselves when the window gets wider or narrower.
 * (A ".svelte.js" file may use $state outside of a component.)
 */
const query = typeof window !== 'undefined' ? window.matchMedia('(max-width: 719px)') : null;

export const phone = $state({ matches: query?.matches ?? false });
query?.addEventListener('change', (e) => (phone.matches = e.matches));

/**
 * v0.76.0 «Fünf Orte» 1: `wide.matches` is true where the sidebar fits: a computer or a tablet held
 * wide (from 900 px, and not a phone turned sideways, at most 500 px high). Narrower screens get the
 * top bar with «Ich», the five places at the bottom and the round + (also between 720 and 899 px).
 */
const wideQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 900px) and (min-height: 501px)') : null;

export const wide = $state({ matches: wideQuery?.matches ?? false });
wideQuery?.addEventListener('change', (e) => (wide.matches = e.matches));
