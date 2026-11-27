/**
 * «Haken-Analysen an einem Ort» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Paket A):
 * the numbers behind the cards «Tagestotal» and «Wochenpensum» on Auswerten › Woche. Pure rules over the shared units
 * (flow/einheiten.js, filtered by flow/sportjahr.js training()), so the hours are the same as in the report below and in the
 * Sports year. Minutes are «gemessen» (Strava, timer, typed) or «ca.» (the usual duration of the sport); both are kept apart.
 * Observation only: nothing is graded, a typical day is where YOUR days usually lie.
 */
import { addDays } from '../flow.js';
import { mondayOf } from './hakenverlauf.js';

/** The days a «typical training day» and «the longest day» are taken from. */
export const DAY_WINDOW = 90;
/** The weeks the mean is taken from. */
export const MEAN_WEEKS = 12;
/** Fewer weeks with movement than this: no mean. */
export const MIN_MEAN_WEEKS = 4;
/** Fewer training days than this: no typical day. */
export const MIN_TYPICAL_DAYS = 5;
/** A week within this share of the mean counts as «right on it». */
export const ON_MEAN = 0.1;
/** The most weeks the chart shows. */
export const MAX_WEEKS = 52;

const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
const minOf = (u) => (Number(u.min) > 0 ? Number(u.min) : 0);

/** day → { min, ca } (ca: the part of min that is estimated). */
export function perDay(units = []) {
  const by = new Map();
  for (const u of units) {
    const m = minOf(u);
    if (!m) continue;
    const r = by.get(u.day) ?? { min: 0, ca: 0 };
    r.min += m;
    if (u.minQuelle === 'ca.') r.ca += m;
    by.set(u.day, r);
  }
  return by;
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** The days shown for a span: up to DAY_WINDOW days (a longer span still shows these, the weeks are in «Wochenpensum»). */
export const dayCount = (span) => Math.min(Math.max(1, Number(span) || 10), DAY_WINDOW);

/**
 * «Tagestotal»: the minutes of movement per day, all activities together.
 * → { days: [{ day, min, ca, today, weekend }] (oldest first, ending today), trained (days with movement in the last 90),
 *     typical (median of those days, or null under 5), longest: { day, min } | null (of the last 90), todayMin, free: days in a row
 *     without movement up to yesterday }
 */
export function dayTotals(units = [], today, span = 10) {
  const by = perDay(units);
  const n = dayCount(span);
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const r = by.get(day);
    days.push({ day, min: r?.min ?? 0, ca: r?.ca ?? 0, today: day === today, weekend: dow(day) >= 5 });
  }
  const from = addDays(today, -(DAY_WINDOW - 1));
  const real = [...by.entries()].filter(([d]) => d >= from && d <= today);
  const mins = real.map(([, r]) => r.min);
  const longest = real.reduce((m, [day, r]) => (!m || r.min > m.min ? { day, min: r.min } : m), null);
  let free = 0;
  for (let d = addDays(today, -1); d >= from && !by.get(d)?.min; d = addDays(d, -1)) free += 1;
  return { days, trained: mins.length, typical: mins.length >= MIN_TYPICAL_DAYS ? median(mins) : null, longest, todayMin: by.get(today)?.min ?? 0, free };
}

/** The number of weeks the chart shows for a span (at least the 12 of the mean, at most a year). */
export const weekCount = (span) => Math.min(MAX_WEEKS, Math.max(MEAN_WEEKS, Math.ceil((Number(span) || 10) / 7)));

/**
 * «Wochenpensum»: the minutes of movement per week (Monday to Sunday), the running week last.
 * → { weeks: [{ key (the Monday), min, ca, current }], mean (of the last 12 full weeks, or null), cur (the running week so far),
 *     prevSame (last week up to the same weekday), prev (the whole week before), prev2 (the one before that), dayIdx (0 = Monday) }
 */
export function weekTotals(units = [], today, span = 10) {
  const by = perDay(units);
  const monday = mondayOf(today);
  const dayIdx = dow(today);
  const sum = (from, to) => {
    let min = 0;
    let ca = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const r = by.get(d);
      if (r) {
        min += r.min;
        ca += r.ca;
      }
    }
    return { min, ca };
  };
  const n = weekCount(span);
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = addDays(monday, -7 * i);
    weeks.push({ key, ...sum(key, addDays(key, 6)), current: i === 0 });
  }
  const full = weeks.filter((w) => !w.current).slice(-MEAN_WEEKS);
  const withMove = full.filter((w) => w.min > 0).length;
  const mean = withMove >= MIN_MEAN_WEEKS ? Math.round(full.reduce((s, w) => s + w.min, 0) / MEAN_WEEKS) : null;
  const lastMonday = addDays(monday, -7);
  return {
    weeks,
    mean,
    cur: sum(monday, today).min,
    prevSame: sum(lastMonday, addDays(lastMonday, dayIdx)).min,
    prev: sum(lastMonday, addDays(lastMonday, 6)).min,
    prev2: sum(addDays(monday, -14), addDays(monday, -8)).min,
    dayIdx,
  };
}

/** How a number stands against a mean: 'on' (within 10 %), 'above' or 'below'; null without a mean. */
export function placeOf(value, mean) {
  if (!(mean > 0)) return null;
  const r = value / mean;
  return r > 1 + ON_MEAN ? 'above' : r < 1 - ON_MEAN ? 'below' : 'on';
}

/** The change in whole percent against a base (null: no base). */
export const percent = (value, base) => (base > 0 ? Math.round(((value - base) / base) * 100) : null);
