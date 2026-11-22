/**
 * «Marker» (Noah 21.11.2026, «Klügere Auswertungen» K1): a day or a stretch of days you mark as «krank», «verletzt», «Stress» or «Ferien».
 * The evaluations use them to explain what stands out (a resting pulse that is up during an illness) and to leave these days out of
 * comparisons with earlier times (K2, K3). Nothing is judged; a marker is only a note on the calendar that you can change or delete at any time.
 *
 * Setting (db.settings, in the backup, no schema change): MARKER_KEY = [{ id, kind, from, to }], days as YYYY-MM-DD, from <= to.
 * Pure functions plus three small writers. Tested in tests/marker.test.js.
 */
import { addDays } from '../flow.js';

export const MARKER_KEY = 'training.marker';
/** The kinds, in the order they are offered. */
export const KINDS = ['sick', 'injured', 'stress', 'holiday'];
/** The longest stretch one marker may cover, in days (a calendar year). */
export const MAX_DAYS = 366;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A valid calendar day (YYYY-MM-DD, no 31 February), else ''. */
export const cleanDay = (v) => {
  const s = String(v ?? '').trim();
  if (!DAY.test(s)) return '';
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? '' : s;
};

/** One marker made whole, or null when kind or day are not valid. A missing end is the same day; a stretch is cut at MAX_DAYS. */
export function cleanMarker(m) {
  if (!m || typeof m !== 'object') return null;
  const kind = KINDS.includes(m.kind) ? m.kind : '';
  const from = cleanDay(m.from);
  if (!kind || !from || !m.id) return null;
  let to = cleanDay(m.to) || from;
  if (to < from) to = from;
  const last = addDays(from, MAX_DAYS - 1);
  if (to > last) to = last;
  return { id: String(m.id), kind, from, to };
}

/** The stored value made whole: only valid markers, newest first. */
export function markerList(value) {
  const list = Array.isArray(value) ? value.map(cleanMarker).filter(Boolean) : [];
  return list.sort((a, b) => b.from.localeCompare(a.from) || a.id.localeCompare(b.id));
}

/** The list with a marker added (id from the clock unless given). An invalid marker changes nothing. Never changes the input. */
export function withMarker(list, m, id = `mk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`) {
  const next = cleanMarker({ ...m, id: m?.id ?? id });
  return next ? markerList([...markerList(list).filter((x) => x.id !== next.id), next]) : markerList(list);
}

/** The list without one marker. */
export const withoutMarker = (list, id) => markerList(list).filter((m) => m.id !== id);

/** Every marked day as a Set of YYYY-MM-DD (all kinds, or only `kinds`). */
export function markedDays(list, kinds = KINDS) {
  const out = new Set();
  for (const m of markerList(list)) {
    if (!kinds.includes(m.kind)) continue;
    for (let d = m.from; d <= m.to; d = addDays(d, 1)) out.add(d);
  }
  return out;
}

/** The marker that covers a day, or null (the first one when several overlap). */
export const markerOn = (list, day) => markerList(list).find((m) => day >= m.from && day <= m.to) ?? null;

/** How many days a marker covers. */
export const daysOf = (m) => Math.round((new Date(`${m.to}T00:00:00Z`) - new Date(`${m.from}T00:00:00Z`)) / 864e5) + 1;

/** Read the setting. */
export async function readMarkers(db) {
  return markerList((await db.settings.get(MARKER_KEY))?.value);
}

async function write(db, list) {
  if (list.length) await db.settings.put({ key: MARKER_KEY, value: JSON.parse(JSON.stringify(list)) });
  else await db.settings.delete(MARKER_KEY);
}

/** Save the whole list; returns the list before, for «Undo». */
export async function saveMarkers(db, list) {
  const before = await readMarkers(db);
  await write(db, markerList(list));
  return before;
}

/** Put a whole list back («Undo»). */
export async function restoreMarkers(db, before) {
  await write(db, markerList(before));
}
