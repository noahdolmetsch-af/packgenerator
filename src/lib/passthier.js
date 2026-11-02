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
  // Touren › Träume › Your dreams: what you long for, what you are up for, what matters (PR 6)
  dreams: ['f.freireise', 'f.freilust', 'f.freiwesentlich'],
  // Neuland: a first night outside, a bingo of your own fields (PR 6)
  neuland: ['f.freinacht', 'f.ownbingo'],
  // Packen › Gewicht (bike trips): how sure the total is, lighter things from your own gear, the weight per bag
  weight: ['f.weightsure', 'f.lighter', 'f.bagplan'],
  // Packen › Route without a GPX yet: draw the line on the map and save it as GPX, or take a komoot tour
  route: ['f.mapmeasure', 'f.komoot'],
  // Packen of a ski tour: the same list as a backpack check in the five ski groups, the plan, the car park check
  ski: ['f.skicheck', 'f.skiplan', 'f.skistart'],
  // Rennen › Places to sleep from lists: which places you know yourself and which are only imported; rate your own
  sleeplists: ['f.sleeporigin', 'f.sleepspots'],
  // Velos › Setup › Setup log: the tools you need when you change something on the bike
  rig: ['f.gears', 'f.level'],
  // Rückblick einer Tour (saved): looking back further than the packing list
  debrief: ['f.knowhow', 'f.gooddecisions', 'f.meaning', 'f.skillmap'],
};

/** The functions of a place that exist and are not marked «Not for me». */
export function passtHier(place, notForMe = {}) {
  return (PASST_HIER[place] ?? []).map((id) => FEATURE[id]).filter((f) => f && !notForMe[f.id]);
}
