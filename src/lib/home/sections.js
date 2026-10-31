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
/**
 * «Bereiche anpassen» (Noah 27.10.2026 «1a 2a»): the person's own setup of the areas, one settings row
 * { order: [keys], names: { key: own name }, off: { key: where its tiles go, '' = «Without area» } }.
 * Nothing stored: the areas as the app has them.
 */
export const AREAS_KEY = 'homeAreas';
/** The area at the end that takes the tiles of a hidden area (GroupDeleteSheet «Ohne Bereich»). */
export const NONE = 'none';
const NONE_AREA = { key: NONE, name: 'Without area', sub: '' };

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
  moment: 'now', // «Heute als Begleiter» PR 4: the moment card sits in the first area, under the habits
  discover: 'now', // PR 5: «Discover» sits under the moment card
  daycard: 'now',
  important: 'now',
  trip: 'now',
  suggest: 'now',
  body: 'body',
  acts: 'body',
  weighin: 'now', // a question for this week: it stays in the first area, found on the phone without long scrolling
  vitals: 'body',
  vo2max: 'body',
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

/** A tile that stands right after another one of its area: the weekly weight under the trip card (on a trip day the trip comes first). */
const AFTER = { weighin: 'trip' };

function after(list) {
  const out = [...list];
  for (const [id, prev] of Object.entries(AFTER)) {
    const i = out.findIndex((x) => x.id === id);
    const j = out.findIndex((x) => x.id === prev);
    if (i < 0 || j < 0 || i === j + 1) continue;
    const [x] = out.splice(i, 1);
    out.splice(out.findIndex((y) => y.id === prev) + 1, 0, x);
  }
  return out;
}

/** The area a tile shows in: every small tile in «Schnell öffnen». */
export const sectionOf = (x) => (x.size === 's' ? 'quick' : (SECTION_OF[x.id] ?? AREA_OF[TILE[x.id]?.area] ?? 'discover'));

const KEYS = SECTIONS.map((s) => s.key);

/** The stored setup, cleaned: unknown keys and empty names left out. */
export function normAreas(v) {
  const order = Array.isArray(v?.order) ? v.order.filter((k, i, a) => KEYS.includes(k) && a.indexOf(k) === i) : [];
  const names = Object.fromEntries(Object.entries(v?.names ?? {}).filter(([k, n]) => KEYS.includes(k) && typeof n === 'string' && n.trim()).map(([k, n]) => [k, n.trim()]));
  const off = Object.fromEntries(Object.entries(v?.off ?? {}).filter(([k]) => KEYS.includes(k)).map(([k, to]) => [k, KEYS.includes(to) && to !== k ? to : '']));
  return { order, names, off };
}

/** All six areas in the person's order: [{ ...section, own: own name or null, off: hidden }]. */
export function areasOf(cfg) {
  const c = normAreas(cfg);
  const keys = [...c.order, ...KEYS.filter((k) => !c.order.includes(k))];
  return keys.map((k) => ({ ...SECTIONS.find((s) => s.key === k), own: c.names[k] ?? null, off: k in c.off }));
}

/** Where a tile shows with the setup: its area, or where a hidden area sends it (a hidden target: «Without area»). */
function homeOf(x, c) {
  const k = sectionOf(x);
  if (!(k in c.off)) return k;
  const to = c.off[k];
  return to && !(to in c.off) ? to : NONE;
}

/** The wall in areas, each with its tiles in the order of the wall; empty areas are left out. → [{ ...section, own, tiles }] */
export function sectionsOf(tiles = [], cfg = null) {
  const c = normAreas(cfg);
  const shown = [...areasOf(c).filter((a) => !a.off), { ...NONE_AREA, own: null, off: false }];
  return shown.map((s) => ({ ...s, tiles: after(tiles.filter((x) => homeOf(x, c) === s.key)) })).filter((s) => s.tiles.length);
}

/** The tiles in the order Heute shows them (areas on): area by area, inside an area the order of the wall. */
export const inAreas = (tiles = [], cfg = null) => sectionsOf(tiles, cfg).flatMap((s) => s.tiles);

/** The shown areas moved: from and to are places in the list of shown areas; hidden ones keep their place at the end. */
export function moveArea(cfg, from, to) {
  const c = normAreas(cfg);
  const all = areasOf(c);
  const shown = all.filter((a) => !a.off).map((a) => a.key);
  if (from < 0 || to < 0 || from >= shown.length || to >= shown.length || from === to) return c;
  const [k] = shown.splice(from, 1);
  shown.splice(to, 0, k);
  return { ...c, order: [...shown, ...all.filter((a) => a.off).map((a) => a.key)] };
}

/** An own name for an area; an empty name brings back the app's name. */
export function renameArea(cfg, key, name) {
  const c = normAreas(cfg);
  const names = { ...c.names };
  const n = String(name ?? '').trim();
  if (n) names[key] = n;
  else delete names[key];
  return { ...c, names };
}

/** Hides an area; its tiles go to the area `to`, or with '' to «Without area» at the end. The tiles stay on Heute. */
export function hideArea(cfg, key, to = '') {
  const c = normAreas(cfg);
  return normAreas({ ...c, off: { ...c.off, [key]: to || '' } });
}

/** Shows a hidden area again, with its tiles. */
export function showArea(cfg, key) {
  const c = normAreas(cfg);
  const off = { ...c.off };
  delete off[key];
  return { ...c, off };
}

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
