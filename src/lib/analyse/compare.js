/**
 * «Analyse» M3 «Vergleichen» (Noah 27.10.2026 «alle Mockups 1:1» and idea «Woche vor gegen Woche nach einer
 * Tour»): this month against the last one, activity against activity per week, and the days before a trip
 * against the days after it. Pure: days are 'YYYY-MM-DD'. Only to look at: no grades.
 */
import { addDays } from '../analyse.js';
import { mondayOf } from './diagram.js';

export const UNITS = ['week', 'month', 'year'];
export const MAX_ACTS = 4;
export const AROUND = 7;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const span = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const listDays = (from, to) => Array.from({ length: Math.max(0, span(from, to) + 1) }, (_, i) => addDays(from, i));

/**
 * The running period up to today and the whole one before: week (Monday on), month (1st on), year (1 Jan on).
 * → { now: { from, to, days }, prev: { from, to, days } }
 */
export function compareWindows(today, unit = 'month') {
  let from;
  let prevFrom;
  if (unit === 'week') {
    from = mondayOf(today);
    prevFrom = addDays(from, -7);
  } else if (unit === 'year') {
    from = `${today.slice(0, 4)}-01-01`;
    prevFrom = `${Number(today.slice(0, 4)) - 1}-01-01`;
  } else {
    from = `${today.slice(0, 7)}-01`;
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    prevFrom = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
  }
  const prevTo = addDays(from, -1);
  return { now: { from, to: today, days: listDays(from, today) }, prev: { from: prevFrom, to: prevTo, days: listDays(prevFrom, prevTo) } };
}

/**
 * The line of one period: for values that add up the running total (a day without a value adds 0), for the
 * others the running mean (null until the first value).
 */
export function running(days, get, sum = false) {
  let total = 0;
  let n = 0;
  return days.map((d) => {
    const v = fin(get(d));
    if (v != null) {
      total += v;
      n += 1;
    }
    return sum ? total : n ? total / n : null;
  });
}

/** Today against the same day of the period before (or its last day when it was shorter). */
export function sameDay(now, prev) {
  const i = now.length - 1;
  if (i < 0 || !prev.length) return null;
  const a = now[i];
  const b = prev[Math.min(i, prev.length - 1)];
  if (a == null || b == null) return null;
  return { now: a, prev: b, diff: a - b, at: Math.min(i, prev.length - 1) };
}

/** How often each activity per week (Monday to Sunday), the last `weeks` weeks up to today. → [{ key, n: { id: count } }] */
export function weeklyCounts(log = [], ids = [], today, weeks = 12) {
  const last = mondayOf(today);
  const out = Array.from({ length: weeks }, (_, i) => ({ key: addDays(last, -7 * (weeks - 1 - i)), n: Object.fromEntries(ids.map((id) => [id, 0])) }));
  const at = new Map(out.map((w) => [w.key, w]));
  const want = new Set(ids);
  for (const e of log) {
    if (!e?.day || !want.has(e.actId) || e.day > today) continue;
    const w = at.get(mondayOf(e.day));
    if (w) w.n[e.actId] += 1;
  }
  return out;
}

/** The mean per week of each activity over these weeks. */
export const meanPerWeek = (weeks, id) => (weeks.length ? weeks.reduce((s, w) => s + (w.n[id] ?? 0), 0) / weeks.length : 0);

/**
 * The days before a trip against the days after it: the mean of a value in the `n` days before the start and
 * the `n` days after the end (null when a side has no value). The after-days not lived yet are left out.
 */
export function aroundTrip(trip, end, get, today, n = AROUND) {
  if (!trip?.startDate || !end) return null;
  const before = Array.from({ length: n }, (_, i) => addDays(trip.startDate, -(i + 1)));
  const after = Array.from({ length: n }, (_, i) => addDays(end, i + 1)).filter((d) => d <= today);
  const mean = (ds) => {
    const vals = ds.map((d) => fin(get(d))).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const b = mean(before);
  const a = mean(after);
  return { before: b, after: a, diff: a != null && b != null ? a - b : null, afterDays: after.length };
}

/** The trips that are over (end before today), newest first. */
export const pastTrips = (trips = [], endOf, today) =>
  trips
    .filter((tr) => tr?.startDate && (endOf?.(tr) ?? tr.startDate) < today)
    .sort((a, b) => (b.startDate < a.startDate ? -1 : b.startDate > a.startDate ? 1 : 0));
