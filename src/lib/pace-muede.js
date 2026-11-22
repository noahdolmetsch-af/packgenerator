/**
 * «Lange Tage» (S1, Noah 21.11.2026 «1a»): how much slower you are on long rides. Tempo per bike and surface
 * already exists (review/werte.js); this is the missing part, tiredness. It is only worked out from your rides
 * (no new data is stored): the standard guess (16 km/h, 600 m per hour) is compared with what your rides took,
 * once for the long rides (from LONG_KM) and once for the shorter ones (from 20 km). The ratio is the slowdown.
 * Used only as a guess for the riding hours of a long day; the hours stay yours to change.
 */
import { SPEED_KMH, CLIMB_MH } from './route.js';
import { countsForPace } from './review/werte.js';

export const LONG_KM = 80;
export const MIN_LONG = 3;
export const MIN_SHORT = 5;
/** Under 5 % is noise; over 40 % is not believed. */
export const MIN_SLOWDOWN = 1.05;
export const MAX_SLOWDOWN = 1.4;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
/** How many times the standard guess this ride took (1 = as guessed, 1.2 = a fifth longer). */
const factorOf = (r) => r.movingH / (r.km / SPEED_KMH + (r.gainM ?? 0) / CLIMB_MH);

/**
 * rides: the tempo rides (review/werte.js tempoRides). → { fromKm, factor, pct, nLong, nShort } or null.
 * factor: how many times as long a long day takes compared with your shorter rides (1.05 … 1.4).
 */
export function tiredness(rides = []) {
  const ok = rides.filter((r) => countsForPace(r) && r.km > 0);
  const long = ok.filter((r) => r.km >= LONG_KM);
  const short = ok.filter((r) => r.km < LONG_KM);
  if (long.length < MIN_LONG || short.length < MIN_SHORT) return null;
  const f = median(long.map(factorOf)) / median(short.map(factorOf));
  if (!Number.isFinite(f) || f < MIN_SLOWDOWN) return null;
  const factor = Math.min(MAX_SLOWDOWN, Math.round(f * 100) / 100);
  return { fromKm: LONG_KM, factor, pct: Math.round((factor - 1) * 100), nLong: long.length, nShort: short.length };
}

/** A day of this many km counts as a long day. */
export const isLongDay = (tired, dayKm) => !!tired && dayKm >= tired.fromKm;
