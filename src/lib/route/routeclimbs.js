/**
 * «Tour planen mit GPX» (Noah 20.10.2026 «3a und b»): the climbs of a planned tour, from the GPX route of
 * the trip. The numbers come from the race code (race/climbs-lib.js, map/fineprofile.js); this file only
 * holds what the plan view adds: the view of the profile around a climb, the colour of a 100 m bar (the
 * komoot colours of the profile) and the short list on the phone.
 * Pure functions, tested in tests/routeclimbs.test.js.
 */
import { STEEPNESS, steepKey } from '../map/fineprofile.js';

/** The climbs shown before «Show all» (long lists fold on the phone, Noah 20.10.2026). */
export const SHORT_LIST = 5;

/** Minimum gain chips for a tour (smaller than a race: day tours have short climbs). */
export const PLAN_MIN_GAINS = [30, 50, 100, 200, 300];
export const PLAN_DEFAULT_MIN = 50;

/** The stored minimum of a trip, else the default (20…3000 m). */
export function minOf(trip) {
  const n = Math.round(Number(trip?.climbMin));
  return n >= 20 && n <= 3000 ? n : PLAN_DEFAULT_MIN;
}

/**
 * The view of the profile for a climb: the climb plus a quarter of its length on each side (at least
 * 300 m), kept inside the route. → { from, to }
 */
export function viewFor(climb, totalKm) {
  const len = Math.max(0, climb.toKm - climb.fromKm);
  const pad = Math.max(0.3, len / 4);
  const total = Math.max(0, Number(totalKm) || climb.toKm);
  const from = Math.max(0, climb.fromKm - pad);
  const to = Math.min(total || climb.toKm + pad, climb.toKm + pad);
  return { from: Math.round(from * 1000) / 1000, to: Math.round(Math.max(to, from + 0.3) * 1000) / 1000 };
}

const COLOUR = Object.fromEntries(STEEPNESS.map((s) => [s.key, s.colour]));
/** The colour of a gradient (the same as the profile above). */
export const colourOf = (pct) => COLOUR[steepKey(Number(pct) || 0)];

/** The note key of a climb (its foot in km, one decimal), the same as on the race page. */
export const noteKey = (climb) => String(climb.key);

/** The notes of a trip: { [key]: text } (nothing else). */
export function notesOf(trip) {
  const n = trip?.climbNotes;
  if (!n || typeof n !== 'object' || Array.isArray(n)) return {};
  return Object.fromEntries(Object.entries(n).filter(([, v]) => typeof v === 'string' && v.trim()));
}

/** The notes with one changed: text '' removes it. */
export function withNote(notes, key, text) {
  const all = { ...notesOf({ climbNotes: notes }) };
  const v = String(text ?? '').trim().slice(0, 1000);
  if (v) all[key] = v;
  else delete all[key];
  return all;
}
