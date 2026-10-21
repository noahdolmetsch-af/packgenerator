/**
 * Paket U2 «Karte» › Eigene Punkte (Noah 19.10.2026 «eigene Notizen/Punkte für alle Touren»): places you
 * mark yourself (a good fountain, a dangerous descent, a view). They belong to no trip: every map shows
 * them. One settings record (OWN_KEY), so they travel with every backup:
 *   { points: [{ id, lat, lon, name, note, kind, createdAt, src? }] }
 * src: the file a point was loaded from (Orte auf der Karte › own places, placefiles.js), so a whole
 * file can be renamed or removed at once; a point set by hand has none.
 * The list order is yours (sort with arrows and dragging). Pure helpers are tested in
 * tests/map-lib.test.js; ownQuery/saveOwn talk to the db.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { isPointKind, pointKindName } from './ownkinds.js';

export const OWN_KEY = 'own-points';
// the kinds live in ownkinds.js (light, so «Listen und Typen» can read them; own kinds come from there)
export { OWN_KINDS, OWN_KIND_KEYS } from './ownkinds.js';

/** A file name as a source label (trimmed, at most 80 characters; '' for none). */
export const srcOf = (v) => String(v ?? '').trim().slice(0, 80);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
/** The stored value → a clean list (broken rows dropped, a missing kind becomes 'note'). */
export function listOf(value) {
  const raw = Array.isArray(value?.points) ? value.points : [];
  return raw
    .filter((p) => p && typeof p === 'object' && num(p.lat) != null && num(p.lon) != null && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180)
    .map((p) => ({ id: String(p.id ?? ''), lat: num(p.lat), lon: num(p.lon), name: String(p.name ?? ''), note: String(p.note ?? ''), kind: isPointKind(p.kind) ? p.kind : 'note', createdAt: p.createdAt ?? '', ...(srcOf(p.src) ? { src: srcOf(p.src) } : {}) }))
    .filter((p) => p.id);
}

/** A new point at a place (rounded to about 1 m). */
export function newPoint({ lat, lon, name = '', note = '', kind = 'note', src = '' }, now = new Date()) {
  return {
    id: `op${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    lat: Math.round(Number(lat) * 1e5) / 1e5,
    lon: Math.round(Number(lon) * 1e5) / 1e5,
    name: String(name).trim(),
    note: String(note).trim(),
    kind: isPointKind(kind) ? kind : 'note',
    createdAt: now.toISOString(),
    ...(srcOf(src) ? { src: srcOf(src) } : {}),
  };
}

/* ---------- loaded files (sources) ---------- */

/** The files points came from, in the order they first appear: [{ src, n }]. */
export function sourcesOf(list = []) {
  const m = new Map();
  for (const p of list) if (p.src) m.set(p.src, (m.get(p.src) ?? 0) + 1);
  return [...m].map(([src, n]) => ({ src, n }));
}
/** Without the points of one file. */
export const removeSource = (list, src) => list.filter((p) => p.src !== src);
/** Another name for a file's points ('' keeps the old one). */
export function renameSource(list, src, to) {
  const name = srcOf(to);
  return name ? list.map((p) => (p.src === src ? { ...p, src: name } : p)) : list;
}
export const updatePoint = (list, id, patch) => list.map((p) => (p.id === id ? { ...p, ...patch, id } : p));
export const removePoint = (list, id) => list.filter((p) => p.id !== id);
export function movePoint(list, from, to) {
  if (to < 0 || to >= list.length || from === to || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
/** The shown name: your name, else the kind (as an English key for t()). */
export const ownLabel = (p, t = (s) => s) => p.name || pointKindName(p.kind, t);

/** The points as map points ({ kind: 'own', sub: their kind }). */
export const ownOnMap = (list = [], t = (s) => s) => list.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, kind: 'own', sub: p.kind, name: ownLabel(p, t), minZoom: 0 }));

/* ---------- db ---------- */

/** All own points, live. */
export const ownQuery = () => liveQuery(async () => listOf((await db.settings.get(OWN_KEY))?.value));

/** Change the list: fn(list) → new list. Returns the list before (for Undo with putOwn). */
export async function saveOwn(fn) {
  let before = [];
  await db.transaction('rw', db.settings, async () => {
    const rec = await db.settings.get(OWN_KEY);
    before = listOf(rec?.value);
    await db.settings.put({ key: OWN_KEY, value: { ...(rec?.value ?? {}), points: fn(before) } });
  });
  return before;
}
/** Put the list back as it was (Undo). */
export const putOwn = (points) => saveOwn(() => points);
