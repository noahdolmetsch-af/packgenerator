/**
 * Photos (Noah, 4.10.2026, answer 13b: a photo of the own bike in Pack).
 * A phone photo is several MB; it is made smaller on the device before it is stored, so the
 * database and backup files stay small (about 100–250 KB per photo).
 */
import { t } from './i18n.svelte.js';

/** Longest side in pixels after shrinking. */
export const PHOTO_MAX = 1400;

/** Size (w, h) that fits into max × max and keeps the shape. */
export function fitSize(w, h, max = PHOTO_MAX) {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/** Read an image file, shrink it and return a JPEG data URL. Needs a browser. */
export async function shrinkImage(file, max = PHOTO_MAX, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new Error(t('Please choose a photo (JPG, PNG or HEIC as JPG).'));
  // v0.27.0 (Noah 1a, AP22): a broken or unreadable image (or a format this browser cannot open)
  // gives a plain message instead of the browser's English error text.
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(t('This photo could not be read. Please choose a JPG or PNG.'));
  }
  const { w, h } = fitSize(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', quality);
}

/* ---------- setup photos of a bike (Noah, 4.10.2026, answers 1a-6a) ---------- */

/**
 * All photos of a bike for the gallery, the main photo first:
 * the photos table plus the older single bike.photo (from Edit bike).
 * Each: { id, src, name, main, tripId, stored } (stored: false for bike.photo).
 */
export function bikePhotos(bike, photos = []) {
  if (!bike) return [];
  // Paket VG: wear and packing photos stay on their own pages (griff.js ownShot)
  const own = photos.filter((p) => p.bikeId === bike.id && !p.wear && !p.pack).map((p) => ({ id: p.id, src: p.data, name: p.name || t('Photo'), main: !!p.main, tripId: p.tripId ?? null, stored: true, day: photoDay(p) }));
  const list = bike.photo ? [{ id: `bike-${bike.id}`, src: bike.photo, name: t('Bike photo'), main: !own.some((p) => p.main), tripId: null, stored: false, day: null }, ...own] : own;
  return list.sort((a, b) => Number(b.main) - Number(a.main));
}

/** The photo behind the bags in Pack: the trip's own setup photo, else the bike's main photo (answer 4a). */
export function packPhoto(trip, bike, photos = []) {
  const list = bikePhotos(bike, photos);
  return (trip && list.find((p) => p.tripId === trip.id)) ?? list.find((p) => p.main) ?? list[0] ?? null;
}

/* ---------- «Bilder in der App» (Noah 20.10.2026 «1b 2a 3a 4a 5a») ---------- */

/** The day a setup photo belongs to: the day set by hand, else the day it was added (YYYY-MM-DD) or null. */
export function photoDay(p) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(p?.day ?? '')) return p.day;
  return /^\d{4}-\d{2}-\d{2}/.test(p?.addedAt ?? '') ? p.addedAt.slice(0, 10) : null;
}

/**
 * 2a: the setup photos of a bike as a timeline, newest first, grouped by month ('YYYY-MM'; photos
 * without a day at the end under ''). → [{ month, items: [photo …] }] with the items of bikePhotos.
 */
export function setupTimeline(bike, photos = []) {
  const list = bikePhotos(bike, photos).sort((a, b) => (b.day ?? '').localeCompare(a.day ?? '') || a.name.localeCompare(b.name));
  const out = [];
  for (const p of list) {
    const month = p.day ? p.day.slice(0, 7) : '';
    const last = out.at(-1);
    if (last && last.month === month) last.items.push(p);
    else out.push({ month, items: [p] });
  }
  return out;
}

/** 1b: the photo pale behind the head of a bike page: the main photo, else the newest one. */
export function headPhoto(bike, photos = []) {
  const list = bikePhotos(bike, photos);
  return list.find((p) => p.main) ?? [...list].sort((a, b) => (b.day ?? '').localeCompare(a.day ?? ''))[0] ?? null;
}

/** 3a: the photos of a problem (the older rows have one photo in `photo`). */
export const problemPhotos = (row) => (Array.isArray(row?.photos) && row.photos.length ? row.photos : row?.photo ? [row.photo] : []);

/** 3a: at most this many photos per problem (each about 150 KB). */
export const PROBLEM_PHOTOS = 6;
