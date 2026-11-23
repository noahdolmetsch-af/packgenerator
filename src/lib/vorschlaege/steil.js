/**
 * The profile of a suggested tour for the shared profile block (Noah 23.11.2026 «1-5a»: one profile block for the whole app, with
 * steepness colours): the heights per sample (data/netz.js `ele`, evenly spread over the length of the tour) become the fine profile
 * of map/fineprofile.js. The steep pieces come from map/steilste.js (re-exported here). Pure; tests in tests/vorschlaege.test.js.
 */
import { fineFromSeries } from '../map/fineprofile.js';
export { steepest, stretchOf, STEEP_PCT, STEEP_COUNT } from '../map/steilste.js';

/** The km of each height sample: evenly over the length of the tour. */
export const kmsOf = (ele = [], km = 0) => ele.map((_, i) => (ele.length < 2 ? 0 : (i * km) / (ele.length - 1)));

/** The fine profile for ProfileStrip (null when there are too few heights). */
export function fineOfTour(t) {
  const ele = t?.ele ?? [];
  if (ele.length < 2) return null;
  return fineFromSeries(kmsOf(ele, t.km), ele, t.km);
}

/** The coarse profile [[km, m]] (ProfileStrip uses it when there is no fine one). */
export const coarseOfTour = (t) => kmsOf(t?.ele ?? [], t?.km ?? 0).map((k, i) => [k, t.ele[i]]);
