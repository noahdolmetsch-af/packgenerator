/**
 * Touren c 67 «Alte Reise ohne GPS ergänzen»: a trip from long ago, from memory: name, first day, days, where,
 * what you remember and a photo. No route, no km, no times: the app never makes numbers up (the look back
 * shows its calm «–»). It is a finished trip (status 'done') with trip.memory = { place }, a finished debrief whose
 * sentence is the memory, and (with a photo) a kept note on the trip, so the photo is in the album.
 * Pure, tested in tests/touren-c.test.js.
 */
import { newDebrief } from '../debrief.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The last day of a trip from its first day and its number of days (calendar days, UTC noon). */
export function lastDay(start, days = 1) {
  const n = Math.max(1, Math.round(Number(days) || 1));
  const d = new Date(`${start}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n - 1);
  return d.toISOString().slice(0, 10);
}

/** What is wrong with the form, as a text key, or ''. today: YYYY-MM-DD. */
export function memoryError({ title = '', startDate = '', days = 1 } = {}, today) {
  if (!String(title).trim()) return 'Give it a name.';
  if (!DAY.test(String(startDate))) return 'Choose the first day.';
  const n = Number(days);
  if (!Number.isFinite(n) || n < 1 || n > 365) return 'Days: 1 to 365.';
  if (lastDay(startDate, n) >= today) return 'Only for trips that are over.';
  return '';
}

/**
 * The records for a memory trip: { trip, debrief, note } (note null without a photo).
 * bike: { id, name } or null. now: ms.
 */
export function memoryTrip({ title, startDate, days = 1, place = '', text = '', photo = null, bike = null }, now = Date.now()) {
  const n = Math.max(1, Math.round(Number(days) || 1));
  const iso = new Date(now).toISOString();
  const end = lastDay(startDate, n);
  const trip = {
    id: `trip-${now.toString(36)}`,
    domain: 'bikepacking',
    title: String(title).trim(),
    startDate,
    days: n,
    bikeId: bike?.id ?? null,
    bike: bike?.name ?? null,
    setup: {},
    entries: [],
    ready: [],
    status: 'done',
    finished: end,
    memory: { place: String(place ?? '').trim().slice(0, 120) },
    createdAt: iso,
  };
  const memo = String(text ?? '').trim().slice(0, 2000);
  const debrief = { ...newDebrief(trip, iso), status: 'done', note: memo, weather: 'planned', amount: 'right', bags: 'fine' };
  const note = photo ? { id: `note-mem-${now.toString(36)}`, kind: 'note', status: 'kept', at: `${end}T18:00:00.000Z`, editedAt: iso, title: trip.title, text: memo, topic: 'trip', pinned: false, photo, tripId: trip.id } : null;
  return { trip, debrief, note };
}
