/**
 * Paket Q #361: the live switches of suggest.js. `suggest.on.weather` etc. are true until the user
 * switches an area off (Ich › Darstellung › Vorschläge).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { SUGGEST_AREAS, SUGGEST_KEY, offOf, toggleArea } from './suggest.js';

const all = () => Object.fromEntries(SUGGEST_AREAS.map((a) => [a.key, true]));
export const suggest = $state({ on: all(), value: [] });

let started = false;
/** Start watching the record (once; components call it when they first need a switch). */
export function watchSuggest() {
  if (started || typeof indexedDB === 'undefined') return;
  started = true;
  liveQuery(() => db.settings.get(SUGGEST_KEY)).subscribe({
    next: (rec) => {
      const off = offOf(rec?.value);
      suggest.value = [...off];
      suggest.on = Object.fromEntries(SUGGEST_AREAS.map((a) => [a.key, !off.has(a.key)]));
    },
    error: () => {},
  });
}

export const setArea = (key, on) => db.settings.put({ key: SUGGEST_KEY, value: toggleArea(suggest.value, key, on) });
