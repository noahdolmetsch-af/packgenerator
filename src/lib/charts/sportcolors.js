/**
 * «Gleiche Farben für gleiche Dinge» (Noah 21.11.2026 «1a»): a sport has the same colour in every chart, not a
 * colour by its rank in the period. The sports you do most are fixed; any other sport gets a colour from its name,
 * so it stays the same from one visit to the next (two such sports may share a colour).
 */
/* fixed colours, the same in every theme (a theme colour changes its hue, so a sport would look different): teal, red-orange, amber, blue, purple, cyan, pink */
export const PALETTE = ['#2a9d8f', '#e4572e', '#e0a526', '#3d85c6', '#9b72cf', '#2fb4d6', '#d6679a'];
export const OTHER = 'var(--ink-3)';

/** Sport (an activity id of the app, or the type of a Strava activity) → place in PALETTE. */
const FIXED = {
  bike: 0, ride: 0, virtualride: 0, ebikeride: 0, gravelride: 0, mountainbikeride: 0, spin: 0,
  run: 1, trailrun: 1, virtualrun: 1,
  hike: 2, walk: 2,
  tennis: 3, padel: 3, squash: 3,
  hockey: 4, iceskate: 4,
  swim: 5,
  alpineski: 6, backcountryski: 6, nordicski: 6, snowboard: 6, ski: 6,
};

/** The plain name of a sport: «strava:Hike» → «hike». */
export const sportName = (sport) => String(sport ?? '').replace(/^strava:/, '').toLowerCase();

export function sportColour(sport) {
  const name = sportName(sport);
  if (name in FIXED) return PALETTE[FIXED[name]];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 1009;
  return PALETTE[h % PALETTE.length];
}
