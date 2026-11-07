/**
 * «Eine Fundliste» (Träume und Neuland N10, Noah 07.11.2026 «ok N10»): one list of finds. Neuland, the summit book
 * (Gipfelbuch) and «Neuland des Jahres» in the year review read from the same list, so nothing is ticked twice.
 *   - A place of the summit book with a visit is a line for Neuland (a single point on that day), so a pass entered by
 *     hand there is ticked in Neuland too (visitLines → computeFrom's `lines`).
 *   - findsOf() lists what was reached for the first time: the Neuland items, and the summit-book places that Neuland
 *     does not already hold (no coordinates, or no collection near them).
 *   - Nothing new is stored: the list is worked out from what is already there (no change of the backup).
 * Pure; tested in tests/funde.test.js.
 */
import { distKm } from '../route.js';
import { itemLabel, whatOf } from './neuland.js';

/** A summit-book place counts as the Neuland item when it lies this close (km), like the pass radius. */
export const SAME_PLACE_KM = 0.6;

const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const okPos = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
const pos = (p) => {
  if (p?.lat == null || p?.lon == null || p.lat === '' || p.lon === '') return null;
  const lat = +p.lat;
  const lon = +p.lon;
  return okPos(lat, lon) ? [lat, lon] : null;
};

/**
 * The visits of the summit book as lines for Neuland ([{ day, source, pts }], one point each): a place with
 * coordinates, visited on a day. book: bookOf() of gipfelbuch.js.
 */
export function visitLines(book) {
  const at = new Map((book?.places ?? []).map((p) => [p.id, pos(p)]).filter(([, q]) => q));
  return (book?.visits ?? [])
    .filter((v) => isDay(v?.day) && at.has(v.placeId))
    .map((v) => ({ day: v.day, source: 'gipfelbuch', pts: [at.get(v.placeId)] }));
}

/**
 * What was reached for the first time, newest first: [{ id, name, day, auto: true, from: 'neuland'|'gipfelbuch', what, cid? }].
 * result: computeFrom() of store.js (the collections switched on); book: bookOf(); year: only that year (or null = all).
 */
export function findsOf({ result, book, year = null } = {}) {
  const y = year == null ? '' : String(year);
  const out = [];
  const held = []; // the points of Neuland that were reached: [lat, lon]
  for (const c of result?.collections ?? []) {
    if (!c.on) continue;
    const what = whatOf(c);
    for (const it of c.items) {
      const v = c.visited.get(it.id);
      if (!v?.day) continue;
      const q = pos(it);
      if (q) held.push(q);
      if (!v.day.startsWith(y)) continue;
      out.push({ id: `fund-${c.id}-${it.id}`, name: itemLabel(c.id, it), day: v.day, auto: true, from: 'neuland', cid: c.id, what });
    }
  }
  // the summit book: the first visit of each place; one that Neuland already holds is not listed twice
  const first = new Map();
  for (const v of [...(book?.visits ?? [])].filter((x) => isDay(x?.day)).sort((a, b) => a.day.localeCompare(b.day))) if (!first.has(v.placeId)) first.set(v.placeId, v.day);
  for (const p of book?.places ?? []) {
    const day = first.get(p.id);
    if (!day || !day.startsWith(y) || !String(p.name ?? '').trim()) continue;
    const q = pos(p);
    if (q && held.some((h) => distKm({ lat: h[0], lon: h[1] }, { lat: q[0], lon: q[1] }) <= SAME_PLACE_KM)) continue;
    out.push({ id: `fund-gb-${p.id}`, name: String(p.name).trim().slice(0, 80), day, auto: true, from: 'gipfelbuch', what: '' });
  }
  return out.sort((a, b) => b.day.localeCompare(a.day) || a.name.localeCompare(b.name));
}
