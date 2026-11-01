/**
 * «Wegweiser statt Katalog» PR 2 (Noah 01.11.2026 «1a 2a 3a 4a 5a»): «Fits here», a quiet row of small buttons at the end of
 * a section, with the functions that fit exactly this section and that you would not find here otherwise (a tool of the
 * Toolbox where you need it). A tap jumps to the function and lets it glow (goFeature, as in the catalogue).
 *
 * PASST_HIER: place → feature ids, in the order shown. A place is used as `<PasstHier place="…" />`
 * (src/lib/ui/PasstHier.svelte). tests/absprung.test.js counts these ids as jumps and checks every place is used.
 * Pure; tested in tests/passthier.test.js.
 */
import { FEATURE } from './features.js';

export const PASST_HIER = {
  // Unterwegs › Helfer unterwegs: the small tools of the Toolbox for a day on the bike
  ride: ['f.phrases', 'f.zones', 'f.light', 'f.arrival'],
  // Rückblick einer Tour (saved): looking back further than the packing list
  debrief: ['f.knowhow', 'f.gooddecisions', 'f.meaning', 'f.skillmap'],
};

/** The functions of a place that exist and are not marked «Not for me». */
export function passtHier(place, notForMe = {}) {
  return (PASST_HIER[place] ?? []).map((id) => FEATURE[id]).filter((f) => f && !notForMe[f.id]);
}
