/** «Zurück zu Heute» (Noah «4a»): the address you left when you stepped onto a value of Analyse; rules in herkunft.js. */
import { noteMove } from './herkunft.js';

const KEY = 'pg.herkunft';
const read = () => {
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
};
export const herkunft = $state({ from: read() });

/** Called on every address change (App.svelte). */
export function noteHashMove(from, to) {
  const next = noteMove(herkunft.from, from, to);
  if (next === herkunft.from) return;
  herkunft.from = next;
  try {
    if (next) sessionStorage.setItem(KEY, next);
  } catch {
    /* private window: only for now */
  }
}
