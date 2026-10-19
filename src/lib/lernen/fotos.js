/**
 * Paket M «Aus Touren lernen»: the photos of a trip for the Tour-Tagebuch and «Dein Jahr als Bildgeschichte».
 * Noah 19.10.2026: «Fotos bleiben auf dem Handy». So they live in the «meta» table: never in a backup
 * file and never synced to the other device. They are made smaller first (about 150 KB each).
 *
 * One record per trip: { key: 'tagebuchFotos:<tripId>', tripId, list: [{ id, day, at, data }] }
 *   day: YYYY-MM-DD the photo was taken (from the file date), at: when it was added, data: JPEG data URL.
 */
import { db as appDb } from '../db.js';

export const FOTO_PREFIX = 'tagebuchFotos:';
export const FOTO_MAX = 1280;
export const FOTOS_PER_TRIP = 24;

const keyOf = (tripId) => `${FOTO_PREFIX}${tripId}`;

/** The photos of one trip, oldest first. */
export async function tripPhotos(tripId, db = appDb) {
  if (!tripId) return [];
  const rec = await db.meta.get(keyOf(tripId));
  return Array.isArray(rec?.list) ? [...rec.list].sort((a, b) => (a.day + a.at).localeCompare(b.day + b.at)) : [];
}

/** Every trip's photos: { tripId: [photo …] }. For the year story. */
export async function allTripPhotos(db = appDb) {
  const out = {};
  const recs = await db.meta.where('key').startsWith(FOTO_PREFIX).toArray();
  for (const r of recs) if (r.tripId && Array.isArray(r.list) && r.list.length) out[r.tripId] = r.list;
  return out;
}

/** Add photos (already made smaller: [{ day, data }]); at most FOTOS_PER_TRIP stay. Returns the new list. */
export async function addTripPhotos(tripId, photos, db = appDb, now = new Date()) {
  const list = await tripPhotos(tripId, db);
  const at = now.toISOString();
  const add = photos.map((p, i) => ({ id: `ph-${now.getTime().toString(36)}-${i}`, day: p.day ?? at.slice(0, 10), at, data: p.data }));
  const next = [...list, ...add].slice(0, FOTOS_PER_TRIP);
  await db.meta.put({ key: keyOf(tripId), tripId, list: next });
  return next;
}

/** Remove one photo of a trip. */
export async function removeTripPhoto(tripId, photoId, db = appDb) {
  const next = (await tripPhotos(tripId, db)).filter((p) => p.id !== photoId);
  if (next.length) await db.meta.put({ key: keyOf(tripId), tripId, list: next });
  else await db.meta.delete(keyOf(tripId));
  return next;
}

/** The local day (Europe/Zurich) of a file's date, for «photos of those days». */
export function fileDay(file) {
  const ms = Number(file?.lastModified);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

/** Only the files whose day lies in [from, to] (both YYYY-MM-DD); files without a date stay in. */
export function filesOfDays(files, from, to) {
  return [...files].filter((f) => {
    const d = fileDay(f);
    return !d || !from || !to || (d >= from && d <= to);
  });
}
