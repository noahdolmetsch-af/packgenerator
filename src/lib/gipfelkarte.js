/**
 * «Gipfel-Karte mit Lücken» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, idea 2): the places of the catalogue
 * as dots on the map of the app, the ones you have in the summit book strong, the ones near you that you do not have yet
 * (the gaps) lighter, and a tour toward each from the tour suggestions. Pure, tested in tests/gipfelkarte.test.js.
 */
import { distKm } from './route.js';
import { passHitsOnLine } from './paesse/katalog.js';
import { placeFor } from './gipfelkatalog.js';

/** How many gaps near you are named. */
export const NEAR_N = 6;
/** A tour leads «toward» a place when its line comes this close (km). */
export const TOUR_KM = 1;
export const TOUR_MAX = 3;

/** The filters of the map: 'all', 'peak', 'pass' or the id of a collection. */
export function filterCatalog(catalog, filter) {
  if (!filter || filter === 'all') return catalog;
  if (filter === 'peak' || filter === 'pass') return catalog.filter((c) => c.kind === filter);
  return catalog.filter((c) => c.coll.includes(filter));
}

/**
 * The rows of the map: every item of the catalogue with the place of the book (or null), its distance from home in km
 * (or null without a home), and its state: 'have' | 'near' (one of the NEAR_N nearest gaps) | 'gap'.
 * Places of the book with a position that the catalogue does not hold come along as 'have' with `own: true`.
 * → { rows: [{ id, it, place, km, st }], have, total }
 */
export function mapRows(catalog, book, home = null, { n = NEAR_N, withOwn = true } = {}) {
  const rows = catalog.map((it) => {
    const place = placeFor(book, it);
    return { id: it.key, it, place, km: home ? distKm(home, it) : null, st: place ? 'have' : 'gap' };
  });
  const gaps = rows.filter((r) => r.st === 'gap' && r.km != null).sort((a, b) => a.km - b.km).slice(0, n);
  for (const r of gaps) r.st = 'near';
  if (withOwn) {
    const known = new Set(rows.filter((r) => r.place).map((r) => r.place.id));
    for (const p of book.places) {
      if (known.has(p.id) || p.lat == null || p.lon == null) continue;
      rows.push({ id: `own:${p.id}`, it: { key: `own:${p.id}`, name: p.name, m: p.ele, lat: p.lat, lon: p.lon, kind: 'own', coll: [] }, place: p, km: home ? distKm(home, p) : null, st: 'have', own: true });
    }
  }
  return { rows, have: rows.filter((r) => r.st === 'have').length, total: rows.length };
}

/** The gaps nearest to home first (the list under the map); without a home the highest first. */
export function gapsList(rows, n = NEAR_N) {
  const gaps = rows.filter((r) => r.st !== 'have');
  return (gaps.some((r) => r.km != null) ? gaps.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9)) : gaps.sort((a, b) => (b.it.m ?? 0) - (a.it.m ?? 0))).slice(0, n);
}

/**
 * The tours of the suggestions that lead toward a place: their line comes within TOUR_KM of it, the closest first.
 * tours: [{ id, title, km, up, line: [[lat, lon], …] }] → [{ tour, away }] (away: km from the line to the place).
 */
export function toursToward(it, tours, { km = TOUR_KM, max = TOUR_MAX } = {}) {
  const one = [{ key: it.key, lat: it.lat, lon: it.lon }];
  return (tours ?? [])
    .map((tour) => ({ tour, away: passHitsOnLine(tour.line, km, one)[0]?.km }))
    .filter((x) => x.away != null)
    .sort((a, b) => Math.round(a.away * 10) - Math.round(b.away * 10) || (a.tour.km ?? 0) - (b.tour.km ?? 0))
    .slice(0, max);
}
