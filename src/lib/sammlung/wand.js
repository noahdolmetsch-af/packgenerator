/**
 * «Sammel-Wand» (Neuer Schwung, Idee F, Noah 05.11.2026): everything the person has collected on one page, only to look at.
 * Stamps (Tourenpass), passes (Pässe sammeln), places (Gipfelbuch), new ground (Neuland) and stars (Meilensteine) stay
 * where they are; the wall reads them and shows a few of each, with a link to the full list.
 * No goals, no percentages, no streaks, no «missing» counts: the wall shows what is there. Pure, tested in tests/sammelwand.test.js.
 */
import { placeRows } from '../gipfelbuch.js';

/** How many items each shelf shows before «All». */
export const SHELF_SHOWN = { stamps: 4, passes: 6, places: 3 };
/** How many items «Added lately» lists. */
export const RECENT_SHOWN = 5;

const byDayDesc = (a, b) => (b.date || '').localeCompare(a.date || '') || a.name.localeCompare(b.name);

/**
 * The newest things across the shelves, newest first (without a day last).
 * stamps: tourenpass stateOf().stamps · passes: paesse stateOf().list · book: gipfelbuch bookOf().
 * → [{ kind: 'stamp'|'pass'|'place', id, name, date, m, href }]
 */
export function recent({ stamps = [], passes = [], book = null } = {}, limit = RECENT_SHOWN) {
  const out = [
    ...stamps.map((s) => ({ kind: 'stamp', id: s.id, name: s.place, date: s.date || '', m: null, href: '#/debrief/tourenpass' })),
    ...passes.map((p) => ({ kind: 'pass', id: p.id, name: p.name, date: p.date || '', m: p.m ?? null, href: '#/debrief/paesse' })),
    ...(book ? placeRows(book) : []).map((r) => ({ kind: 'place', id: r.place.id, name: r.place.name, date: r.last || '', m: r.place.ele ?? null, href: '#/flow/gipfelbuch' })),
  ];
  return out.sort(byDayDesc).slice(0, limit);
}

/** The places of the book with the highest first (only those with a height), at most `limit`. */
export function highestPlaces(book, limit = SHELF_SHOWN.places) {
  return placeRows(book)
    .filter((r) => r.place.ele != null)
    .sort((a, b) => b.place.ele - a.place.ele || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((r) => ({ id: r.place.id, name: r.place.name, ele: r.place.ele, last: r.last, n: r.n }));
}

/** The numbers on top: how many of each. `neuland` is null while it is still counted. */
export function totals({ stamps = [], passes = [], book = null, neuland = null, stars = 0 } = {}) {
  return {
    stamps: stamps.length,
    passes: passes.length,
    places: book ? placeRows(book).length : 0,
    neuland: neuland == null ? null : neuland,
    stars,
  };
}

/** Is anything collected at all (the wall shows its own empty page otherwise)? A still-counting Neuland does not count as something. */
export const isEmpty = (tot) => !tot.stamps && !tot.passes && !tot.places && !(tot.neuland > 0) && !tot.stars;
