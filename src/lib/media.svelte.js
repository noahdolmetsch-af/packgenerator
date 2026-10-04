/**
 * `phone.matches` is true on narrow screens. It is reactive: components that read it
 * update by themselves when the window gets wider or narrower.
 * (A ".svelte.js" file may use $state outside of a component.)
 */
const query = typeof window !== 'undefined' ? window.matchMedia('(max-width: 719px)') : null;

export const phone = $state({ matches: query?.matches ?? false });
query?.addEventListener('change', (e) => (phone.matches = e.matches));
