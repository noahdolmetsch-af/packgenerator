/**
 * «Heute ruhiger» (Noah 26.10.2026 «1a 2a 3a 4a 5a», mockup H3 on «Offene Mockups 3»): Heute shows its tiles in
 * areas with a heading (3a): Jetzt, Dein Körper, Deine Woche, Unterwegs und Velos, Schnell öffnen, Entdecken.
 * Every small tile goes into the one calm list «Schnell öffnen» (1a); «Neu», «Schon probiert?» and «Tipp der
 * Woche» stand side by side under «Entdecken» (4a). Inside an area the tiles keep the order of the wall, so
 * reordering under «Customise the start page» still works; switched off (setting homeSections = false) the wall
 * shows without headings, the small tiles still as one list (quick.js). Pure functions, tested in tests/home-sections.test.js.
 */
import { TILE } from './tiles.js';

export const SECTIONS_KEY = 'homeSections';

/** The areas in their order: key, heading (English for t()), a quiet line or ''. */
export const SECTIONS = [
  { key: 'now', name: 'Now|home', sub: 'What is up today' },
  { key: 'body', name: 'Your body|home', sub: 'Only to look at, no rating' },
  { key: 'week', name: 'Your week|home', sub: '' },
  { key: 'away', name: 'On the road and bikes', sub: '' },
  { key: 'quick', name: 'Open quickly', sub: '' },
  { key: 'discover', name: 'Discover|home', sub: 'New in the app and a tip each week' },
];

/** The area of each tile that is not small; a tile not named here goes by its catalog area (AREA_OF). */
export const SECTION_OF = {
  meditation: 'now',
  daycard: 'now',
  important: 'now',
  trip: 'now',
  suggest: 'now',
  body: 'body',
  acts: 'body',
  weighin: 'body',
  vitals: 'body',
  values: 'body',
  du: 'body',
  aktiv: 'body',
  flow: 'body',
  questions: 'body',
  morningcheck: 'body',
  week: 'week',
  balance: 'week',
  routine: 'now', // «Was mir gut tut» can go to the very top (Noah 18.10.2026 «1a»): it lives in the first area
  series: 'week',
  nextms: 'week',
  strava: 'away',
  month: 'away',
  bikes: 'away',
  yearago: 'away',
  year: 'away',
  news: 'discover',
  try: 'discover',
  tipweek: 'discover',
};
const AREA_OF = { today: 'now', flow: 'body', trips: 'away', bikes: 'away', gear: 'away', app: 'discover' };

/** The area a tile shows in: every small tile in «Schnell öffnen». */
export const sectionOf = (x) => (x.size === 's' ? 'quick' : (SECTION_OF[x.id] ?? AREA_OF[TILE[x.id]?.area] ?? 'discover'));

/** The wall in areas, each with its tiles in the order of the wall; empty areas are left out. → [{ ...section, tiles }] */
export function sectionsOf(tiles = []) {
  return SECTIONS.map((s) => ({ ...s, tiles: tiles.filter((x) => sectionOf(x) === s.key) })).filter((s) => s.tiles.length);
}

/** The tiles in the order Heute shows them (areas on): area by area, inside an area the order of the wall. */
export const inAreas = (tiles = []) => sectionsOf(tiles).flatMap((s) => s.tiles);

/**
 * On a computer (8 columns) a card that would leave the rest of its row empty (the next card does not fit beside it,
 * or it is the last of its area) stretches to the end of the row, so no area shows a half-empty row.
 * → Map of id → the columns it then spans (from where it starts to the end of the row)
 */
export function fillers(tiles = []) {
  const span = (x) => (x.size === 'l' ? 4 : x.size === 'w' ? 2 : x.size === 's' ? 1 : 8);
  const out = new Map();
  let col = 0;
  tiles.forEach((x, i) => {
    const n = span(x);
    if (col + n > 8) col = 0;
    col += n;
    const next = tiles[i + 1];
    if (col < 8 && (!next || col + span(next) > 8)) {
      out.set(x.id, 8 - (col - n));
      col = 8;
    }
    if (col >= 8) col = 0;
  });
  return out;
}
