// «Leere Seiten mit Velo-Szenen» (Noah 03.11.2026 «b», Paket D, Idee 19): which small drawn scene an empty view shows.
// 'wall' a bike on the wall (default: gear, notes, lists), 'tent' a tent under stars (trips and everything about being out),
// 'rack' an empty bike rack (bikes and their care). A page can force one with <Empty scene="…">.
export const SCENES = ['wall', 'tent', 'rack'];

const TENT = new Set(['trips', 'pack', 'dreams', 'ski', 'ride', 'debrief', 'travel', 'race', 'live', 'week', 'neuland']);
const RACK = new Set(['bikes', 'care']);

/** The scene for the page in a hash like '#/trips/rides' (the first part after '#/' counts). */
export function sceneFor(hash = '') {
  const first = String(hash).replace(/^#\/?/, '').split(/[/?]/)[0];
  if (TENT.has(first)) return 'tent';
  if (RACK.has(first)) return 'rack';
  return 'wall';
}
