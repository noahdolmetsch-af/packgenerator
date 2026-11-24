/**
 * «Anreise» of the tour suggestions (Noah 23.11.2026 «alles umsetzen», «5a»: first an estimate from home, the real timetable later):
 * how long it takes to get to the start and back from the end, so that «a tour of 5 h» becomes «9 h 40 with the journey».
 *
 * - From where: your home place, else Zurich main station (the same fallback as «nearer first»).
 * - The way is the straight line (a tour of a loop ends where it started; a one-way tour ends at its end and you come back from there).
 * - Public transport with the bike: 30 min fixed (walk, wait, change) + 0.75 min per km. By car: 10 min + 0.95 min per km. Rounded to 5 min.
 *   This is a rough guess, shown as «about». It never looks at a timetable and sends nothing anywhere.
 * - A half day: the whole day (ride + journey) is at most HALF_DAY_H hours.
 * Pure functions, tested in tests/vorschlaege.test.js.
 */
export const ZURICH_HB = { lat: 47.3779, lon: 8.5403 };
export const MODES = ['pt', 'car'];
/** The filter choices: the longest journey one way, in minutes; null = any. */
export const TRAVELS = [60, 120, 180];
export const HALF_DAY_H = 5;

const rad = (d) => (d * Math.PI) / 180;
/** Km as the crow flies between [lat, lon] points. */
export function crowKm(a, b) {
  const dy = (b[0] - a[0]) * 111.32;
  const dx = (b[1] - a[1]) * 111.32 * Math.cos(rad((a[0] + b[0]) / 2));
  return Math.hypot(dx, dy);
}

/** The minutes for a way of this many crow km, by public transport with the bike ('pt') or by car ('car'). */
export function travelMin(km, mode = 'pt') {
  const m = mode === 'car' ? 10 + km * 0.95 : 30 + km * 0.75;
  return Math.max(5, Math.round(m / 5) * 5);
}

const placeOf = (home) => (home && Number.isFinite(Number(home.lat)) && Number.isFinite(Number(home.lon)) ? [Number(home.lat), Number(home.lon)] : [ZURICH_HB.lat, ZURICH_HB.lon]);

/** { out, back, outKm, backKm, mode, fromHome }: the journey minutes there and back (back from the end of a one-way tour). */
export function anreiseOf(t, home, mode = 'pt') {
  const from = placeOf(home);
  const line = t?.line ?? [];
  if (!line.length) return null;
  const outKm = crowKm(from, line[0]);
  const backKm = t.kind === 'oneway' ? crowKm(from, line[line.length - 1]) : outKm;
  return { out: travelMin(outKm, mode), back: travelMin(backKm, mode), outKm: Math.round(outKm), backKm: Math.round(backKm), mode, fromHome: !!home && Number.isFinite(Number(home.lat)) };
}

/** The whole day in hours: the ride (hours) plus the journey there and back. */
export const dayHours = (rideHours, a) => (a ? rideHours + (a.out + a.back) / 60 : rideHours);

/** Fits into a half day: the whole day is at most HALF_DAY_H hours. */
export const fitsHalfDay = (rideHours, a) => dayHours(rideHours, a) <= HALF_DAY_H + 1e-9;

/** Journey passes the filter: the longest way (there or back) is within `max` minutes; null = any. */
export const withinTravel = (a, max) => !max || !a || Math.max(a.out, a.back) <= max;
