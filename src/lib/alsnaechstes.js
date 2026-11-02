/**
 * «Wegweiser statt Katalog» PR 9 (Noah 01.11.2026 «1a 2a 3a 4a 5a», answer 3a: «As next» in the confirmation right after
 * an action): one quiet line with 1–2 functions that fit right after you did something. A tap jumps to the function and
 * lets it glow (goFeature), as «Fits here» does. Only a suggestion: «Not for me» stays out.
 *
 * ALS_NAECHSTES: moment → feature ids, in the order shown. Used as `<AlsNaechstes moment="…" />`
 * (src/lib/ui/AlsNaechstes.svelte) in the confirmation of that action. Pure; tested in tests/alsnaechstes.test.js.
 */
import { FEATURE } from './features.js';

export const ALS_NAECHSTES = {
  // Rides › «Ride saved»: what the km did to the parts, and the diary of all trips
  ride: ['f.partwear', 'f.logbook'],
  // Pack › «All packed»: the weather for the day, the one page for the tour day
  packed: ['f.weather', 'f.departsheet'],
  // Bike care › «Saved: …, done»: write down what you changed, count the spare parts at home
  care: ['f.setuplog', 'f.sparestock'],
};

/** The functions of a moment that exist and are not marked «Not for me». */
export function alsNaechstes(moment, notForMe = {}) {
  return (ALS_NAECHSTES[moment] ?? []).map((id) => FEATURE[id]).filter((f) => f && !notForMe[f.id]);
}
