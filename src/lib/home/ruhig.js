/**
 * v0.73.0 «Ruhige Startseite + Fotoband» (Noah 10.10.2026, Heute ruhiger 1–5 a, Foto auf Heute 1–4 a):
 * the pure rules of the calmer Today page.
 * - «Weitermachen» is hidden when it would show the trip the trip card already leads with (2a).
 * - With a trip today the suggestion of the day is one slim row under the trip card; without one it
 *   stays big beside the greeting (1a, 3a).
 * - The photo: the trip's own photos, else the photos of its bike; one of them per app start (4a),
 *   with place (the photo's name) and month.
 */
import { onTripDay } from '../ride.js';
import { bikePhotos } from '../photo.js';

/** Is a trip (not skipped, not finished) on one of its days today? */
export const tripToday = (trips = [], today) => trips.some((x) => !x.skipped && !x.finished && !!x.startDate && onTripDay(x, today));

/** «Weitermachen» for the same trip as the trip card is a double: hide it (Noah 2a). */
export const sameAsCard = (leadId, cardId) => !!leadId && leadId === cardId;

/**
 * The photos Today may show for a trip: the trip's own (a setup photo kept for it), else every photo
 * of its bike (the main photo first). Each: { id, src, name, at, bikeId }.
 */
export function bandPhotos(trip, bike, photos = []) {
  if (!trip) return [];
  const own = photos.filter((p) => p.tripId === trip.id && p.data).map((p) => ({ id: p.id, src: p.data, name: p.name ?? '', at: p.addedAt ?? null, bikeId: p.bikeId ?? trip.bikeId ?? null }));
  if (own.length) return own;
  const byId = Object.fromEntries(photos.map((p) => [p.id, p]));
  return bikePhotos(bike, photos).filter((p) => p.src).map((p) => ({ id: p.id, src: p.src, name: p.stored ? p.name ?? '' : '', at: byId[p.id]?.addedAt ?? null, bikeId: bike?.id ?? null }));
}

/** One photo of the list for a number r in [0, 1): the same r gives the same photo (one per app start). */
export const pickPhoto = (list = [], r = 0) => (list.length ? list[Math.min(list.length - 1, Math.floor(Math.max(0, r) * list.length))] : null);

// a name the camera gave (IMG_1234, DSC01234, PXL_2025…, «Setup») says nothing about the place
const CAMERA = /^(img|dsc|dscn|dcim|pxl|photo|foto|image|bild|setup|screenshot)?[\s_-]*[\d_-]*$/i;

/** «Klöntalersee · Juli 2025»: the photo's name as the place (else the fallback), and the month. */
export function photoCaption(p, { fallback = '', locale = 'de-CH' } = {}) {
  if (!p) return '';
  const name = (p.name ?? '').trim();
  const place = name && !CAMERA.test(name) ? name : fallback;
  const d = p.at ? new Date(p.at) : null;
  const month = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : '';
  return [place, month].filter(Boolean).join(' · ');
}

/**
 * A phone shows the 8 buttons right after the trip card (the rule of 0.46: greeting, trip card and the
 * buttons in the first screen, now with the photo band): «Im Flow» directly before «What do you
 * want to do?» moves behind it. Any other order the user chose stays as it is.
 */
export function actionsFirst(order = []) {
  const f = order.indexOf('flow');
  if (f < 0 || order[f + 1] !== 'actions') return order;
  const out = [...order];
  [out[f], out[f + 1]] = [out[f + 1], out[f]];
  return out;
}
