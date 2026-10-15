/**
 * v0.134.0 «Listen und Typen»: counts up once the person's own lists are in place after the start
 * (only when there are changes). App.svelte draws the page again then, so the app never waits for the
 * database before its first picture: it starts with the Standard and updates a moment later.
 */
export const listsReady = $state({ v: 0 });
