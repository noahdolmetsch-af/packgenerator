/** «Zurück zu Heute» (Noah «4a»): the address you left when you stepped onto a value of Analyse; rules in herkunft.js. */
import { noteMove } from './herkunft.js';
import { prevMove, backCrumbs } from './zurueck.js';
import { ALL_PLACES } from '../nav.js';
import { placeLabel } from '../anpassen.svelte.js';

const KEY = 'pg.herkunft';
const read = () => {
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
};
export const herkunft = $state({ from: read() });
// Durchklick-Fund 3: the last move onto another page and the address you are on, in memory only (a reload or a link has no way you came)
export const weg = $state({ prev: null, now: typeof location === 'undefined' ? '' : location.hash });

const placeOfKey = (key) => ALL_PLACES.find((x) => x.key === key);
/** The crumbs of a head with its first step turned into «where you came from» (rules in zurueck.js). */
export const backCrumbsOf = (crumbs) =>
  backCrumbs(crumbs, weg.prev, weg.now, (key) => (placeOfKey(key) ? placeLabel(placeOfKey(key)) : null), (key) => placeOfKey(key)?.href ?? null);

/** Called on every address change (App.svelte). */
export function noteHashMove(from, to) {
  weg.prev = prevMove(weg.prev, from, to);
  weg.now = to ?? '';
  const next = noteMove(herkunft.from, from, to);
  if (next === herkunft.from) return;
  herkunft.from = next;
  try {
    if (next) sessionStorage.setItem(KEY, next);
  } catch {
    /* private window: only for now */
  }
}
