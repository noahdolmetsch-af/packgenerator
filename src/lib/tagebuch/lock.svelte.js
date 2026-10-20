/**
 * «Tagebuch» lock (Noah 20.10.2026 «4a»): whether the diary is open on this device right now. Kept only in
 * memory: a reload, leaving the diary or the app hidden for more than a minute locks it again. The code
 * itself is never stored, only its hash (journal.js hashCode, settings record 'journal').
 */
export const gate = $state({ open: false });

/** How long the app may be hidden before the diary locks again (ms). */
export const HIDDEN_MS = 60_000;

export const unlock = () => (gate.open = true);
export const lockNow = () => (gate.open = false);

let hiddenAt = 0;
let watching = false;
/** Lock again after the app was hidden for longer than HIDDEN_MS (called once by the page). */
export function watchHidden() {
  if (watching || typeof document === 'undefined') return;
  watching = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > HIDDEN_MS) lockNow();
  });
}
