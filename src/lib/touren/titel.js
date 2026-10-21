/**
 * A readable name instead of a file name (tour critique 21.10.2026, Noah «2b und änderbar»): a trip made
 * from a GPX file was called like the file («COURSE_2026-10-12_143022», «Tour_Zuerich_Uetliberg.gpx»).
 * Such a name is replaced once by the Strava name of the trip's ride, or else by «Ride on Sat, 12.10.2026».
 * The old name stays on the trip as `fileTitle` (shown under «…» › «File»); the user can rename at any time,
 * and a name the user typed is never replaced (`titleOwn`).
 * Plain module (no runes): the words come in as `t` and `fmtDay`.
 */
import { activitiesForTrip } from '../training.js';
import { loadActs } from '../review/actdata.js';

/** True when the text looks like a file name, not like a name a person gives. */
export function looksLikeFile(s) {
  const v = String(s ?? '').trim();
  if (!v) return false;
  if (/\.(gpx|fit|tcx|kml|kmz)$/i.test(v)) return true;
  if (/\s/.test(v)) return false;
  if (/\d{6,}/.test(v)) return true;
  // no spaces: underscores or several dashes join the words, or words run together in CamelCase
  if ((v.match(/_/g) ?? []).length >= 1 && /[A-Za-z]/.test(v)) return true;
  if ((v.match(/-/g) ?? []).length >= 2 && (v === v.toLowerCase() || /\d/.test(v))) return true;
  if ((v.match(/[a-zäöü][A-ZÄÖÜ]/g) ?? []).length >= 2) return true;
  return false;
}

const actName = (a) => String(a?.own?.name ?? a?.name ?? '').trim();

/**
 * The readable name for a trip: the first ride's own or Strava name (when that is no file name either), else
 * t('Ride on {day}') with the first day. `fmtDay(iso)` writes the day («Sa, 12.10.2026»).
 */
export function readableTitle(trip, acts = [], { t = (s, v) => s.replace(/\|[a-z]+$/, '').replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? ''), fmtDay = (d) => d } = {}) {
  const named = acts.map(actName).find((n) => n && !looksLikeFile(n));
  if (named) return named;
  const day = trip?.startDate ?? acts[0]?.day ?? null;
  return day ? t('Ride on {day}', { day: fmtDay(day) }) : t('Ride|title');
}

/** The trips whose name should be replaced: a file name the user did not type. */
export const needsTitle = (trip) => !!trip && !trip.titleOwn && looksLikeFile(trip.title);

/**
 * Replace every file-like trip name once (idempotent; nothing to do → no write).
 * → the number of trips renamed.
 */
export async function tidyTitles(db, { acts = [], kmBook = [], t, fmtDay, now = () => new Date().toISOString() } = {}) {
  const trips = (await db.trips.toArray()).filter(needsTitle);
  for (const trip of trips) {
    const title = readableTitle(trip, activitiesForTrip(trip, acts, kmBook), { t, fmtDay });
    await db.trips.update(trip.id, { title, fileTitle: trip.title, updatedAt: now() });
  }
  return trips.length;
}

/** The file name shown under «…» › «File»: the old name, else the route's file. */
export const fileOf = (trip) => trip?.fileTitle || trip?.route?.file || null;

/** «Sa., 12.10.2026» in the given locale. */
export const dayText = (iso, loc = 'de-CH') => new Date(`${iso}T12:00:00`).toLocaleDateString(loc, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

/** The sweep the trip pages run when they open: loads the rides itself. */
export async function tidyAllTitles(db, { t, loc } = {}) {
  if (!(await db.trips.toArray()).some(needsTitle)) return 0;
  const [acts, kmBook] = await Promise.all([loadActs(db), db.kmBook.toArray().catch(() => [])]);
  return tidyTitles(db, { acts, kmBook, t, fmtDay: (d) => dayText(d, loc) });
}
