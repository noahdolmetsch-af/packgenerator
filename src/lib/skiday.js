/**
 * Skitour «Planen und Unterwegs» (Noah 15.10.2026 «1a 2a», brainstorm SKB1–SKB3, SKB5, SKB6; built without
 * mockups since 18.10.2026): what the ski tour pages know about the day itself. Pure, tested
 * (tests/skiday.test.js). The app never rates avalanches or weather: only times, places and your notes.
 *   SKB1 «Letztes Mal hier»: the last past tour to the same peak or place, with its time and note.
 *   SKB2 «Letzter Zug zurück»: the train time back minus the way down and a buffer → a turnaround time.
 *   SKB3 «Tageslicht»: sunrise and sunset at the place (offline, NOAA formula), only as times.
 *   SKB5/SKB6 «Unterwegs»: the time left to the turnaround, the decision points ticked with their time.
 */
import { isPastSki, skiTrips, turnTime } from './ski.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();
const placeOf = (trip) => norm(trip?.ski?.place || trip?.place?.name);
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const minOf = (s) => {
  const at = turnTime(s);
  return at ? Number(at.slice(0, 2)) * 60 + Number(at.slice(3)) : null;
};

/* ---------- SKB1 «Letztes Mal hier» ---------- */

/**
 * The last past ski tour to the same peak (else the same place) as this one, or null.
 * → { trip, day, activeMin, note } (note: what was good, else the change, else the learning).
 */
export function lastHere(trip, trips, today) {
  const peak = norm(trip?.ski?.peak);
  const place = placeOf(trip);
  if (!peak && !place) return null;
  const same = (x) => (peak && norm(x.ski?.peak) === peak) || (!peak && place && placeOf(x) === place);
  const hit = skiTrips(trips).find((x) => x.id !== trip.id && !x.skipped && isPastSki(x, today) && (x.startDate ?? '') < (trip.startDate ?? '9999') && same(x));
  if (!hit) return null;
  const s = hit.ski ?? {};
  return { trip: hit, day: hit.startDate, activeMin: Number.isFinite(s.activeMin) ? s.activeMin : null, note: (s.good || s.change || s.learning || '').trim() };
}

/* ---------- SKB2 «Letzter Zug zurück» ---------- */

/** The default way down from the turnaround point to the train (minutes) and the buffer on top. */
export const DESCENT_MIN = 120;
export const BUFFER_MIN = 30;

/** A turnaround time «HH:MM» from the last train back, the way down and a buffer; '' when there is no train time. */
export function turnFromTrain(trainAt, descentMin = DESCENT_MIN, bufferMin = BUFFER_MIN) {
  const train = minOf(trainAt);
  if (train == null) return '';
  const down = Number.isFinite(Number(descentMin)) && Number(descentMin) > 0 ? Math.round(Number(descentMin)) : DESCENT_MIN;
  const at = train - down - Math.max(0, Math.round(Number(bufferMin) || 0));
  return at > 0 ? hhmm(at) : '';
}

/* ---------- SKB3 «Tageslicht» ---------- */

/** Switzerland, roughly in the middle: the place when a tour has none. */
export const SWISS = { lat: 46.8, lon: 8.2 };

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Minutes after UTC midnight of sunrise or sunset (NOAA), or null in polar day or night. */
function sunUtc(day, lat, lon, rise) {
  const d = new Date(`${day}T12:00:00Z`);
  const n = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5); // day of the year
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl);
  if (cosH < -1 || cosH > 1) return null;
  const ha = deg(Math.acos(cosH));
  return 720 - 4 * (lon + (rise ? ha : -ha)) - eq;
}

/** «HH:MM» in Europe/Zurich for minutes after UTC midnight of a day. */
function zurich(day, utcMin) {
  const at = new Date(Date.parse(`${day}T00:00:00Z`) + Math.round(utcMin) * 60000);
  return new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' }).format(at);
}

/**
 * Sunrise and sunset of a day at a place, as Zurich times. place: { lat, lon }; without one the middle
 * of Switzerland (rough: true). → { rise, set, rough } or null for a day it cannot compute.
 */
export function daylight(day, place) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day ?? ''))) return null;
  const has = Number.isFinite(place?.lat) && Number.isFinite(place?.lon);
  const { lat, lon } = has ? place : SWISS;
  const r = sunUtc(day, lat, lon, true);
  const s = sunUtc(day, lat, lon, false);
  if (r == null || s == null) return null;
  return { rise: zurich(day, r), set: zurich(day, s), rough: !has };
}

/* ---------- SKB5 / SKB6 «Unterwegs» ---------- */

/** The decision points of a tour: [{ id, name, at }] (at: «HH:MM» when reached, else ''). */
export const pointsOf = (trip) => (Array.isArray(trip?.ski?.points) ? trip.ski.points.filter((p) => p && String(p.name ?? '').trim()) : []);

/** The points with one more (a trimmed name); unchanged for an empty name. */
export function addPoint(points, name, id = null) {
  const n = String(name ?? '').trim().slice(0, 60);
  if (!n) return points ?? [];
  const list = points ?? [];
  const taken = new Set(list.map((p) => p.id));
  let key = id ?? `p${Date.now().toString(36)}`;
  for (let i = 2; taken.has(key); i++) key = `${id ?? 'p'}${Date.now().toString(36)}-${i}`; // two in the same moment
  return [...list, { id: key, name: n, at: '' }];
}
export const dropPoint = (points, id) => (points ?? []).filter((p) => p.id !== id);

/** The points with one reached at «HH:MM» (or undone again when it was reached). */
export const reachPoint = (points, id, at) => (points ?? []).map((p) => (p.id === id ? { ...p, at: p.at ? '' : at } : p));

/** «HH:MM» of a Date (local clock). */
export const clockOf = (now) => `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

/**
 * The tour as it stands now, on its day once started: { turnAt, left (minutes to the turnaround, < 0 past
 * it), points, reached }; null when the tour is not under way.
 */
export function underWay(trip, today, now) {
  if (!trip || trip.skipped || trip.finished || trip.startDate !== today || !trip.ski?.startedAt) return null;
  const turnAt = turnTime(trip.ski?.turnAt);
  const t = minOf(turnAt);
  const points = pointsOf(trip);
  return { turnAt, left: t == null ? null : t - (now.getHours() * 60 + now.getMinutes()), points, reached: points.filter((p) => p.at).length };
}

/** «1:20» for minutes (also for a negative number: the time past). */
export const leftText = (min) => `${Math.floor(Math.abs(min) / 60)}:${String(Math.abs(min) % 60).padStart(2, '0')}`;
