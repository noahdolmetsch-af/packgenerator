/**
 * The look back of a try that measures a ride value (Noah 05.11.2026 «a», Persönliches Lernen Idee 2, second part):
 * ride against ride instead of day against day. Only rides of a similar length and climb are compared, every
 * ride is one dot, and nothing is said before each side has MIN_RIDES rides. Never a proof: it only says «higher»,
 * «lower» or «no clear difference», never why. Pure (the rides are passed in), tested in tests/versuch-fahrt.test.js.
 */
import { addDays } from './base.js';
import { expDaysSoFar, CLEAR_AT } from './versuch-wert.js';
import { feelOf } from '../training.js';

/** At least this many rides with a value on each side before anything is said. */
export const MIN_RIDES = 5;
/** A ride is «similar» when its km are within this factor (up and down) of the middle one of all rides compared. */
export const KM_FACTOR = 1.5;
/** … and its climb within this many metres, or this share of the middle climb, whichever is more. */
export const HM_FLOOR = 150;
export const HM_SHARE = 0.6;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The ride values a try can measure (the same keys as in versuch-wert.js RIDE_METRICS). */
export function rideValue(a, key, kg = null) {
  if (key === 'rideFeel') return feelOf(a);
  if (key === 'cad') return fin(a.cad) > 0 ? a.cad : null;
  if (key === 'spd') return fin(a.km) > 0 && fin(a.movingS) > 0 ? a.km / (a.movingS / 3600) : null;
  if (key === 'wkg') return a.wDevice && fin(a.wAvg) > 0 && kg > 0 ? a.wAvg / kg : null;
  return null;
}

/**
 * The bike rides of the days from `from` to `to` out of the day table (Map day → { acts }): [{ day, km, hm, s, act }].
 * `kgOn(day)` is only needed for watts per kilo.
 */
export function ridesIn(table, from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const a of table.get(d)?.acts ?? []) if (a.kind === 'bike' && fin(a.movingS) > 0) out.push({ day: d, km: fin(a.km), hm: fin(a.hm), s: a.movingS, act: a });
  }
  return out;
}

/** The rides that lie close to the middle ride of the group in length and climb (rides without km never do). */
export function similarRides(rides) {
  const withKm = rides.filter((r) => r.km > 0);
  const refKm = median(withKm.map((r) => r.km));
  if (!refKm) return [];
  const refHm = median(withKm.map((r) => r.hm));
  return withKm.filter((r) => {
    const f = r.km / refKm;
    if (f > KM_FACTOR || f < 1 / KM_FACTOR) return false;
    if (refHm != null && r.hm != null) return Math.abs(r.hm - refHm) <= Math.max(HM_FLOOR, HM_SHARE * refHm);
    return true;
  });
}

const sideOf = (rides, key, kgOn) => {
  const dots = rides.map((r) => ({ day: r.day, v: rideValue(r.act, key, kgOn?.(r.day) ?? null) })).filter((x) => x.v != null);
  const n = dots.length;
  const mean = n ? dots.reduce((s, x) => s + x.v, 0) / n : null;
  const sd = n > 1 ? Math.sqrt(dots.reduce((s, x) => s + (x.v - mean) ** 2, 0) / (n - 1)) : 0;
  return { n, mean, sd, dots };
};

/**
 * The comparison of a try on one ride value: null before the first day.
 * → { days, during, before, rides: { all, similar }, diff, verdict: 'few' | 'up' | 'down' | 'unclear' }
 * during / before: { n, mean, sd, dots: [{ day, v }] } of the similar rides with a value.
 * `rides` counts the rides of both sides with a value (all) and how many of those are similar to each other.
 */
export function rideResult(e, table, key, today, kgOn) {
  const days = expDaysSoFar(e, today);
  if (!days.length) return null;
  const from = days[0];
  const last = days[days.length - 1];
  const beforeFrom = addDays(from, -days.length);
  const all = ridesIn(table, beforeFrom, last);
  const valued = all.filter((r) => rideValue(r.act, key, kgOn?.(r.day) ?? null) != null);
  const sim = similarRides(valued);
  const during = sideOf(sim.filter((r) => r.day >= from), key, kgOn);
  const before = sideOf(sim.filter((r) => r.day < from), key, kgOn);
  const out = { days: days.length, during, before, rides: { all: valued.length, similar: sim.length }, diff: null, verdict: 'few' };
  if (during.n < MIN_RIDES || before.n < MIN_RIDES) return out;
  out.diff = during.mean - before.mean;
  const se = Math.sqrt(during.sd ** 2 / during.n + before.sd ** 2 / before.n);
  out.verdict = out.diff !== 0 && Math.abs(out.diff) > CLEAR_AT * se ? (out.diff > 0 ? 'up' : 'down') : 'unclear';
  return out;
}
