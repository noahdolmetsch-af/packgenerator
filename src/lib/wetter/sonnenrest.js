/**
 * «Sonnen-Ausfahrt» step C (Noah 06.11.2026 «1-5a», answer 3a «Ja, leise»): the card on Today stays quiet about your
 * body. It only adds two things next to the ride, never advice and never a cause:
 * - the week line: the active zone minutes of this week against your weekly goal (when Fitbit values exist);
 * - when last night's sleep was clearly under your normal: the shortest ride that still reaches above the fog,
 *   as a second option next to the first.
 * Pure; the rows are the healthDays rows (health.js), the rides come from sonnenfahrt.js rides().
 * Tested in tests/sonnenrest.test.js.
 */
import { addDays, latest, normalOf, azmWeekOf } from '../health.js';

/** Sleep counts as clearly short under this share of your normal (30 days, median). */
export const WEAK_SLEEP = 0.85;
/** The other ride must be at least this many minutes shorter than the one shown. */
export const SHORTER_MIN = 15;

/**
 * Was last night's sleep clearly under your normal? Last night = the sleep value of «today» or yesterday.
 * Without a normal (fewer than 7 values) or without last night's value: false.
 */
export function weakSleep(rows, today) {
  const last = latest(rows ?? [], 'sleep', today);
  const min = last?.sleep?.asleepMin;
  if (!Number.isFinite(min) || last.date < addDays(today, -1)) return false;
  const normal = normalOf(rows, 'sleep', today);
  return normal != null && min < normal * WEAK_SLEEP;
}

/**
 * The week line: { sum, of, left, reached } for Monday to «today», or null without a single zone-minute value
 * this week. `goal` is the record of db.settings AZM_WEEK_KEY ({ of }) or undefined for the standard 150.
 */
export function weekLine(rows, today, goal) {
  const wd = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today, -wd);
  const mine = (rows ?? []).filter((r) => r.date >= monday && r.date <= today && Number.isFinite(r.azm));
  if (!mine.length) return null;
  const sum = mine.reduce((s, r) => s + r.azm, 0);
  const of = azmWeekOf(goal);
  return { sum, of, left: Math.max(0, of - sum), reached: sum >= of };
}

/**
 * The shortest ride of `list` (sonnenfahrt.js rides(), not late) that is at least SHORTER_MIN minutes shorter than
 * `current`; → { ride, index } or null.
 */
export function shorter(list, current) {
  if (!current || !list?.length) return null;
  let best = null;
  list.forEach((r, index) => {
    if (r.id !== current.id && r.totalMin <= current.totalMin - SHORTER_MIN && (!best || r.totalMin < best.ride.totalMin)) best = { ride: r, index };
  });
  return best;
}

/** Minutes → "1:20" (hours and minutes, no seconds). */
export const hours = (min) => `${Math.floor(min / 60)}:${String(Math.round(min) % 60).padStart(2, '0')}`;
