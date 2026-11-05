// Tempo-Budget (scripts/size-guard.mjs): the handbook (steps and examples of every function, English and German, about 350 KB) is
// not part of the start. The card «What you can do here» loads it when it first shows. Returns the handbook module (HANDBOOK …).
let loading = null;
export const loadHandbook = () => (loading ??= Promise.all([import('../handbook.js'), import('./late-de.js')]).then(([h]) => h));
