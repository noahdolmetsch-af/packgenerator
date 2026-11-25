/**
 * «Dein Normal über die Jahre» (Noah 24.11.2026 «eigenes normal», «über die Jahre verteilt»; «Auswerten neu», Thread
 * «Auswerten völlig neu entwerfen»): what is usual for YOU, never a comparison with other people or an age group.
 * Pure functions over the day table (messwerte.js dayTable: rows with hrv, rhr, sleep in minutes …).
 *
 *   - normalOf: the usual range of one value in the last 12 months: the middle half of the days (q1–q3) and the middle.
 *   - normalYears: the same per year, and for all years together: the middle half, nearly all days (10 %–90 %) and the middle.
 *   - shareBelow: how many of 100 days of your history were lower than a value (shows how unusual a day is).
 * Under MIN days a value says nothing («no guessing»); the callers then show no band.
 */
import { addDays } from '../health.js';

/** The days that make «the usual»: the last 12 months. */
export const NORMAL_DAYS = 365;
/** Fewer days than this: no usual range, no guess. */
export const MIN = 30;
/** The values with a usual range: key of the day table → label key. */
export const NORMAL_KEYS = ['hrv', 'rhr', 'sleep'];

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The value p (0..1) of a sorted list (nearest rank, no interpolation: a real day of yours). */
const at = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];

/** The values of one key over the days from..to (both included), sorted. */
export function valuesOf(table, key, from, to) {
  const out = [];
  for (const [day, row] of table) {
    if (day < from || day > to) continue;
    const v = fin(row?.[key]);
    if (v != null) out.push(v);
  }
  return out.sort((a, b) => a - b);
}

/**
 * The usual range of one value in the 12 months up to today (today itself not counted):
 * { median, q1, q3, p10, p90, n, from, to } or null under MIN days.
 */
export function normalOf(table, key, today, days = NORMAL_DAYS) {
  const to = addDays(today, -1);
  const from = addDays(today, -days);
  const v = valuesOf(table, key, from, to);
  if (v.length < MIN) return null;
  return { median: at(v, 0.5), q1: at(v, 0.25), q3: at(v, 0.75), p10: at(v, 0.1), p90: at(v, 0.9), n: v.length, from, to };
}

/** The usual range of the last 4 weeks (the second number next to the 12-month usual): { median, n } or null under 7 days. */
export function normal28(table, key, today) {
  const v = valuesOf(table, key, addDays(today, -28), addDays(today, -1));
  return v.length < 7 ? null : { median: at(v, 0.5), n: v.length };
}

const rowOf = (v) => ({ p10: at(v, 0.1), q1: at(v, 0.25), median: at(v, 0.5), q3: at(v, 0.75), p90: at(v, 0.9), n: v.length });

/**
 * The usual range per year of one value, oldest first, and for all years together:
 * { all: row|null, years: [{ year, p10, q1, median, q3, p90, n }] }. A year with under MIN days is left out.
 */
export function normalYears(table, key) {
  const by = new Map();
  const all = [];
  for (const [day, row] of table) {
    const v = fin(row?.[key]);
    if (v == null) continue;
    const y = day.slice(0, 4);
    if (!by.has(y)) by.set(y, []);
    by.get(y).push(v);
    all.push(v);
  }
  const years = [...by.entries()]
    .filter(([, v]) => v.length >= MIN)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, v]) => ({ year, ...rowOf(v.sort((a, b) => a - b)) }));
  all.sort((a, b) => a - b);
  return { all: all.length >= MIN ? rowOf(all) : null, years };
}

/** How many of 100 days of the history were lower than value (0–100, whole number); null under 100 days (too few to say). */
export function shareBelow(table, key, value, to = null) {
  const v = [];
  for (const [day, row] of table) {
    if (to && day >= to) continue;
    const x = fin(row?.[key]);
    if (x != null) v.push(x);
  }
  if (v.length < 100 || !Number.isFinite(value)) return null;
  return Math.round((v.filter((x) => x < value).length / v.length) * 100);
}

/**
 * How far a value stands from its usual range, in words for the code (not for the screen):
 * 'below' under q1, 'above' over q3, else 'usual'. null without a range or value.
 */
export function placeIn(normal, value) {
  if (!normal || !Number.isFinite(value)) return null;
  return value < normal.q1 ? 'below' : value > normal.q3 ? 'above' : 'usual';
}
