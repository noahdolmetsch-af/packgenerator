/**
 * «Eine Fundliste» (Träume und Neuland N10, Noah 27.10.2026 «1-5 a»): Neuland, the Gipfelbuch and «Neuland des
 * Jahres» read from one list, so nothing is ticked twice.
 *   - bookTracks: the places of the Gipfelbuch (with a position) count for Neuland like a ride there; a summit
 *     entered by hand ticks the peak, a pass by bike ticks the pass.
 *   - findsOfYear: «Neuland des Jahres» shows your own entries, the evenings with «New», what Neuland found
 *     for the first time this year and the Gipfelbuch places first reached this year; one line per name.
 * Pure; tested in tests/neuland-funde.test.js.
 */
import { bookOf, placeRows } from '../gipfelbuch.js';
import { neulandYear } from '../wohl.js';
import { itemLabel } from './neuland.js';

/** The Gipfelbuch visits of places with a position, as Neuland tracks (one point each). */
export function bookTracks(value, today = null) {
  const book = bookOf(value);
  const at = new Map(book.places.filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon)).map((p) => [p.id, [p.lat, p.lon]]));
  return book.visits
    .filter((v) => at.has(v?.placeId) && /^\d{4}-\d{2}-\d{2}$/.test(v.day ?? '') && (!today || v.day <= today))
    .map((v) => ({ day: v.day, tripId: null, rideId: null, src: 'gipfelbuch', pts: [at.get(v.placeId)] }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/** A name to compare: lower case, no accents, no «test_data_…» spacing differences. */
export const sameName = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * The one list of a year. collections: from computeFrom (with items and visited), or [] while loading.
 * → [{ id, name, day, from: 'own' | 'evening' | 'neuland' | 'gipfelbuch', what?, href? }], newest first.
 * Own entries win over the same name found elsewhere; then Neuland, then the Gipfelbuch, then evenings.
 */
export function findsOfYear({ own = [], rows = [], collections = [], book = null, year }) {
  const y = String(year);
  const mine = neulandYear(own, rows, year);
  const out = [];
  const seen = new Set();
  // also = more names of the same thing (a canton is «Uri» and «Kanton Uri»)
  const add = (x, also = []) => {
    const keys = [x.name, ...also].map(sameName).filter(Boolean);
    if (!keys.length || keys.some((k) => seen.has(k))) return;
    for (const k of keys) seen.add(k);
    out.push(x);
  };
  for (const x of mine.filter((m) => !m.auto)) add({ id: x.id, name: x.name, day: x.day, from: 'own' });
  for (const c of collections) {
    for (const it of c.items ?? []) {
      const v = c.visited?.get?.(it.id);
      if (v?.day?.startsWith(y)) add({ id: `nl-${c.id}-${it.id}`, name: itemLabel(c.id, it), day: v.day, from: 'neuland', what: c.id, href: `#/neuland?c=${encodeURIComponent(c.id)}` }, [it.name]);
    }
  }
  for (const r of placeRows(bookOf(book))) if (r.first?.startsWith(y)) add({ id: `gb-${r.place.id}`, name: r.place.name, day: r.first, from: 'gipfelbuch', href: '#/flow/gipfelbuch' });
  for (const x of mine.filter((m) => m.auto)) add({ id: x.id, name: x.name, day: x.day, from: 'evening' });
  return out.sort((a, b) => b.day.localeCompare(a.day) || a.name.localeCompare(b.name));
}
