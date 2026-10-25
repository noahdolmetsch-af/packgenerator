/**
 * Paket C › Teilen mit Vorschau (996 Ideen UC-146-I1, UC-100-I2; 35 ideas in one):
 *
 *   Vorschau wie beim Empfänger: before a packing list leaves as a link, the page shows exactly what the
 *     other person sees without an account (the same view as the link, Share.svelte). You choose what
 *     goes in (title, date, bike, weights); a changed choice has to be confirmed once before the link.
 *   Ankunft ohne genauen Ort (PLACE_KEY): a short message «I have arrived» with as much place as fits the
 *     person: only arrived, a rough region, or the exact position. A default per person.
 *     { people: [{ id, name, level }] }
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, uid } from './base.js';

export const SCOPE_STD = { title: '', date: true, bike: true, weights: true };
/** The packing list payload (share.js sharePayload) cut down to the chosen scope. */
export function scoped(payload, scope = SCOPE_STD) {
  const s = { ...SCOPE_STD, ...scope };
  return {
    ...payload,
    t: clean(s.title, 80) || payload.t,
    d: s.date ? payload.d : null,
    n: s.date ? payload.n : 1,
    b: s.bike ? payload.b : null,
    w: s.weights ? payload.w : null,
    g: payload.g.map(([bag, its]) => [bag, its.map(([name, qty, g]) => [name, qty, s.weights ? g : null])]),
  };
}
/** What the other person can read, as lines (English keys with values) for the confirm step. */
export function scopeLines(payload, scope) {
  const p = scoped(payload, scope);
  const n = p.g.reduce((a, [, its]) => a + its.length, 0);
  return [
    { key: 'Title', v: p.t },
    { key: 'Date', v: p.d ?? null },
    { key: 'Bike', v: p.b ?? null },
    { key: 'Weights', v: p.w != null ? 'yes' : null },
    { key: 'Items', v: String(n) },
  ];
}
export const sameScope = (a, b) => JSON.stringify({ ...SCOPE_STD, ...a }) === JSON.stringify({ ...SCOPE_STD, ...b });

/* ---------- Ankunft ohne genauen Ort ---------- */

export const PLACE_KEY = 'ruhig.arrive';
export const LEVELS = [
  { key: 'arrived', label: 'Only: arrived' },
  { key: 'region', label: 'A rough region' },
  { key: 'exact', label: 'The exact position' },
];
const lv = (x) => (LEVELS.some((l) => l.key === x) ? x : 'arrived');
export function arriveOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  return { people: (Array.isArray(v.people) ? v.people : []).filter((p) => p && p.id && clean(p.name, 40)).map((p) => ({ id: String(p.id), name: clean(p.name, 40), level: lv(p.level) })) };
}
export const addPerson = (a, name, level = 'arrived', id = uid('p')) => (clean(name, 40) ? { people: [...a.people, { id, name: clean(name, 40), level: lv(level) }] } : a);
export const setPerson = (a, id, patch) => ({ people: a.people.map((p) => (p.id === id ? { ...p, ...patch, level: lv(patch.level ?? p.level) } : p)) });
export const dropPerson = (a, id) => ({ people: a.people.filter((p) => p.id !== id) });
/** The rough region from a reverse geocoding answer (Nominatim, zoom 8): county, state or country. */
export function regionOf(addr = {}) {
  return clean(addr.county || addr.state_district || addr.region || addr.state || addr.country || '', 60);
}
/**
 * The message: texts are already translated (arrived: «I have arrived.»; near: «Near {region}.»).
 * level arrived: only the sentence; region: plus the region; exact: plus a map link to the point.
 */
export function arriveMessage(level, { arrived, near = '', region = '', lat = null, lon = null }) {
  if (level === 'exact' && Number.isFinite(lat) && Number.isFinite(lon)) return `${arrived} https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lon.toFixed(5)}#map=15/${lat.toFixed(5)}/${lon.toFixed(5)}`;
  if (level !== 'arrived' && region) return `${arrived} ${near.replace('{region}', region)}`;
  return arrived;
}
