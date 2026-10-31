/**
 * «Eigenes Diagramm» (Noah 27.10.2026 «1a 2a 3a und b möglich 4a 5a», mockups D1–D6): up to 6 values from
 * every area on one time axis, at the top of Analyse. Pure rules: days are 'YYYY-MM-DD', nothing reads the
 * clock or the database. Only to look at: no grades.
 */
import { addDays } from '../analyse.js';

export const MAX_VALUES = 6;
/** The values a new diagram starts with (mockup D1); the ones you do not have are left out. */
export const DEFAULT_KEYS = ['sleep', 'rhr', 'azm', 'km:bike', 'felt:energy'];
/** One colour per row, in order (light and dark mode have their own tones of these tokens). */
export const SERIES_COLORS = ['var(--l3)', 'var(--pz6)', 'var(--pz3)', 'var(--pz5)', 'var(--pz4)', 'var(--l4)'];

export const DPERIODS = [
  { key: '30', days: 30 },
  { key: '90', days: 90 },
  { key: '365', days: 365 },
  { key: 'own', days: 0 },
];
export const DEFAULT_DPERIOD = '90';
export const STEPS = ['day', 'week', 'month'];
export const MODES = ['rows', 'over'];

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const span = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const listDays = (from, to) => Array.from({ length: Math.max(0, span(from, to)) + 1 }, (_, i) => addDays(from, i));
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

/**
 * The days of the diagram, oldest first. A fixed period ends `back` periods before today; «own» uses
 * own = { from, to } (swapped when the wrong way round, at most 3 years, never after today).
 */
export function diagramWindow(period, today, back = 0, own = null) {
  const p = DPERIODS.find((x) => x.key === period) ?? DPERIODS[1];
  if (!p.days) {
    let from = isDay(own?.from) ? own.from : addDays(today, -89);
    let to = isDay(own?.to) ? own.to : today;
    if (to > today) to = today;
    if (from > to) [from, to] = [to, from];
    if (span(from, to) > 1095) from = addDays(to, -1095);
    return { from, to, days: listDays(from, to) };
  }
  const to = addDays(today, -p.days * Math.max(0, back));
  const from = addDays(to, -(p.days - 1));
  return { from, to, days: listDays(from, to) };
}

/** Monday of the week of a day. */
export const mondayOf = (d) => addDays(d, -((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7));

/** The points of the time axis: one per day, per week (Monday to Sunday) or per month. → [{ key, days }] */
export function stepBuckets(days, step = 'day') {
  if (step !== 'week' && step !== 'month') return days.map((d) => ({ key: d, days: [d] }));
  const out = [];
  for (const d of days) {
    const key = step === 'week' ? mondayOf(d) : d.slice(0, 7);
    if (out.at(-1)?.key === key) out.at(-1).days.push(d);
    else out.push({ key, days: [d] });
  }
  return out;
}

/**
 * The values of one row: per point the mean of its days, or the total for values that add up. A day that
 * `keep(day)` says no to stays a gap, so the time stays true (D4).
 */
export function seriesOf(buckets, get, { sum = false, keep = null } = {}) {
  return buckets.map((b) => {
    const vals = b.days.filter((d) => !keep || keep(d)).map((d) => fin(get(d))).filter((v) => v != null);
    if (!vals.length) return null;
    const total = vals.reduce((a, c) => a + c, 0);
    return sum ? total : total / vals.length;
  });
}

/** The mean of the last 7 points (at least 3 with a value), for the smooth line. */
export function rolling7(values) {
  return values.map((_, i) => {
    const part = values.slice(Math.max(0, i - 6), i + 1).filter((v) => v != null);
    return part.length >= 3 ? part.reduce((a, b) => a + b, 0) / part.length : null;
  });
}

/** The lowest and highest value of a row (bars from 0), with a little room; never an empty range. */
export function rangeOf(values, fromZero = false) {
  const vals = values.filter((v) => v != null);
  if (!vals.length) return { lo: 0, hi: 1 };
  let lo = fromZero ? 0 : Math.min(...vals);
  let hi = Math.max(...vals);
  if (hi === lo) {
    hi += 1;
    if (!fromZero) lo -= 1;
  }
  return { lo, hi };
}

/**
 * «Übereinander» (D2): every value measured from its own mean, in percent, so hours, beats and points fit
 * into one picture. null stays null; a row without a mean (all 0) stays at 0.
 */
export function fromMean(values) {
  const vals = values.filter((v) => v != null);
  if (!vals.length) return values.map(() => null);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return values.map((v) => (v == null ? null : mean ? ((v - mean) / Math.abs(mean)) * 100 : 0));
}

/** Adds a value (at most MAX_VALUES, no doubles); removes it when it is there already. */
export function toggleKey(keys, key) {
  if (keys.includes(key)) return keys.filter((k) => k !== key);
  return keys.length >= MAX_VALUES ? keys : [...keys, key];
}

/** Moves the value at place `from` to place `to`. */
export function moveKey(keys, from, to) {
  if (from === to || from < 0 || from >= keys.length) return keys;
  const next = [...keys];
  const [k] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, k);
  return next;
}

/** The latest keys you picked, newest first, at most n, without the ones in the diagram now. */
export function recentKeys(recent = [], keys = [], n = 4) {
  return [...new Set(recent)].filter((k) => !keys.includes(k)).slice(0, n);
}

/** Matches a search text against a name (case, accents and «ä/ae» do not count). */
export function matches(name, q) {
  const norm = (s) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ae/g, 'a')
      .replace(/oe/g, 'o')
      .replace(/ue/g, 'u');
  const want = norm(q).trim();
  return !want || norm(name).includes(want);
}
