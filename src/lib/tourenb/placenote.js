/**
 * Idee 55 «Notiz an einen späteren Ort» (Touren b, mockup B55, Noah 26.10.2026 «freigabe», answer a: on the live map
 * with a short tone and vibration). A note (db.notes) can come at a point of a tour's route instead of at a time:
 *   note.at2 = { tripId, km, lat, lon, name?, done? , later? }   (later: ms, «Später nochmals» until then)
 * On the live map of that tour the note shows when you are within AHEAD_M of the point.
 * Pure functions, tested in tests/touren-b.test.js.
 */
import { lineKm } from '../race/race.js';

export const AHEAD_M = 500;
/** «Später nochmals»: the note waits this long, then comes again when you are still near. */
export const LATER_MIN = 15;

const fin = Number.isFinite;

/** The place reminder of a note made safe, or null. */
export function placeOf(note) {
  const p = note?.at2;
  if (!p || typeof p !== 'object' || !p.tripId || !fin(p.lat) || !fin(p.lon)) return null;
  return { tripId: String(p.tripId), km: fin(p.km) ? p.km : null, lat: p.lat, lon: p.lon, ...(p.name ? { name: String(p.name) } : {}), ...(p.done ? { done: true } : {}), ...(fin(p.later) ? { later: p.later } : {}) };
}

/** The point of a route at a km: { km, lat, lon } (the nearest line point), or null without a line. */
export function pointAtKm(route, km) {
  const pts = lineKm(route);
  if (!pts.length) return null;
  const k = Math.max(0, Math.min(Number(km) || 0, pts.at(-1).km));
  let best = pts[0];
  for (const p of pts) if (Math.abs(p.km - k) < Math.abs(best.km - k)) best = p;
  return { km: Math.round(k * 10) / 10, lat: best.lat, lon: best.lon };
}

const metres = (a, b) => {
  const dLat = (a.lat - b.lat) * 111320;
  const dLon = (a.lon - b.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
};

/** The notes of a tour that are due now at `me` ({ lat, lon }), nearest first: [{ note, m }]. */
export function notesHere(notes = [], tripId, me, now = Date.now(), ahead = AHEAD_M) {
  if (!tripId || !fin(me?.lat) || !fin(me?.lon)) return [];
  return notes
    .map((note) => ({ note, p: placeOf(note) }))
    .filter(({ note, p }) => p && p.tripId === tripId && !p.done && note.status !== 'deleted' && !note.deletedAt && !(fin(p.later) && p.later > now))
    .map(({ note, p }) => ({ note, m: Math.round(metres(me, p)) }))
    .filter((x) => x.m <= ahead)
    .sort((a, b) => a.m - b.m);
}

/** The open place notes of a tour (for the list under the live map and the trip): [{ note, place }] by km. */
export const placeNotes = (notes = [], tripId) =>
  notes
    .map((note) => ({ note, place: placeOf(note) }))
    .filter((x) => x.place && x.place.tripId === tripId && !x.place.done && !x.note.deletedAt)
    .sort((a, b) => (a.place.km ?? 0) - (b.place.km ?? 0));
