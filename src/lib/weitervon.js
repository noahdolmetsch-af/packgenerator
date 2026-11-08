/**
 * «Weiter von hier» (UI-Prüfung 07.11.2026, Befund Q1; Noah «alle Vorschläge»): ONE quiet block with the ways on from a
 * place, instead of «Fits here» (passthier.js) and «As next» (alsnaechstes.js) as separate rows. It only joins what
 * these two lists already say, so nothing is lost and no list is kept twice: first what fits right after an action
 * (`moment`, ALS_NAECHSTES), then what fits this section (`place`, PASST_HIER), then ids the page names itself (`also`).
 * Only a suggestion: a function marked «Not for me» stays out; every function appears once; at most `max` are shown.
 * Pure; the block is src/lib/ui/WeiterVon.svelte; tested in tests/weitervon.test.js. Used by no page yet.
 */
import { FEATURE } from './features.js';
import { PASST_HIER } from './passthier.js';
import { ALS_NAECHSTES } from './alsnaechstes.js';

/** How many ways the block shows at most: more than six is a catalogue again. */
export const MAX_WEGE = 6;

/**
 * { place, moment, also } → [{ f, why }]: f is the entry of features.js, why is 'next' (after an action), 'fits'
 * (fits this section) or 'also' (named by the page). `notForMe`: the ids marked «Not for me».
 */
export function weiterVon({ place = '', moment = '', also = [] } = {}, notForMe = {}, max = MAX_WEGE) {
  const seen = new Set();
  const out = [];
  const add = (ids, why) => {
    for (const id of ids ?? []) {
      const f = FEATURE[id];
      if (!f || notForMe[id] || seen.has(id)) continue;
      seen.add(id);
      out.push({ f, why });
    }
  };
  add(ALS_NAECHSTES[moment], 'next');
  add(PASST_HIER[place], 'fits');
  add(also, 'also');
  return out.slice(0, Math.max(0, max));
}
