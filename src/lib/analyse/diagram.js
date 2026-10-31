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

/*
 * Filters (D4, Noah «3a und b möglich»): one filter for the whole diagram, and on wish one more for a single
 * value. A day the filter does not keep stays a gap, so the time stays true.
 * { wd: [0…6] the weekdays kept (empty = all), act: { id, mode: 'with'|'without' } | null,
 *   trip: 'all'|'only'|'without', felt: { part: 'energy'|'mood', op: 'hi'|'lo' } | null, outliers: bool }
 * Only for the whole diagram: mark (an activity whose days get a dot under every row), band (trips as a band).
 */
export const EMPTY_FILTER = { wd: [], act: null, trip: 'all', felt: null, outliers: false };
export const FELT_HI = 7;
export const FELT_LO = 4;

/** A filter read from storage: unknown parts fall back to «all». */
export function cleanFilter(f) {
  const o = f && typeof f === 'object' ? f : {};
  const wd = Array.isArray(o.wd) ? [...new Set(o.wd.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6))].sort() : [];
  const act = o.act && typeof o.act.id === 'string' && (o.act.mode === 'with' || o.act.mode === 'without') ? { id: o.act.id, mode: o.act.mode } : null;
  const trip = ['only', 'without'].includes(o.trip) ? o.trip : 'all';
  const felt = o.felt && ['energy', 'mood'].includes(o.felt.part) && ['hi', 'lo'].includes(o.felt.op) ? { part: o.felt.part, op: o.felt.op } : null;
  return { wd: wd.length === 7 ? [] : wd, act, trip, felt, outliers: o.outliers === true };
}

/** How many parts of a filter are set (the number on the «Filter» button). */
export const filterCount = (f) => (f.wd.length ? 1 : 0) + (f.act ? 1 : 0) + (f.trip !== 'all' ? 1 : 0) + (f.felt ? 1 : 0) + (f.outliers ? 1 : 0);

const wdOf = (d) => (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;

/**
 * keep(day) for a filter. ctx: { ticks: Map actId → Set of days, tripDays: Set of days,
 * felt(part, day) → number|null }. A felt filter drops the days without an answer.
 */
export function keepOf(f, { ticks = new Map(), tripDays = new Set(), felt = () => null } = {}) {
  return (d) => {
    if (f.wd.length && !f.wd.includes(wdOf(d))) return false;
    if (f.act) {
      const has = ticks.get(f.act.id)?.has(d) ?? false;
      if (f.act.mode === 'with' ? !has : has) return false;
    }
    if (f.trip === 'only' && !tripDays.has(d)) return false;
    if (f.trip === 'without' && tripDays.has(d)) return false;
    if (f.felt) {
      const v = felt(f.felt.part, d);
      if (v == null) return false;
      if (f.felt.op === 'hi' ? v < FELT_HI : v > FELT_LO) return false;
    }
    return true;
  };
}

/** Both filters together: a day counts when the whole-diagram filter and the value's own filter keep it. */
export const bothKeep = (a, b) => (b ? (d) => a(d) && b(d) : a);

/** The values outside 1.5 × the middle half (Tukey) become gaps; under 8 values nothing is dropped. */
export function dropOutliers(values) {
  const vals = values.filter((v) => v != null).sort((a, b) => a - b);
  if (vals.length < 8) return values;
  const q = (p) => {
    const pos = (vals.length - 1) * p;
    const a = Math.floor(pos);
    return vals[a] + (vals[Math.ceil(pos)] - vals[a]) * (pos - a);
  };
  const lo = q(0.25);
  const hi = q(0.75);
  const pad = (hi - lo) * 1.5;
  return values.map((v) => (v == null || v < lo - pad || v > hi + pad ? null : v));
}

/** All days of the trips as a set (trip end from endOf). */
export function tripDaySet(trips = [], endOf) {
  const out = new Set();
  for (const tr of trips) {
    const s = tr?.startDate;
    const e = endOf?.(tr) ?? s;
    if (!s || !e || e < s) continue;
    for (let d = s, i = 0; d <= e && i < 400; d = addDays(d, 1), i++) out.add(d);
  }
  return out;
}

/** The ticked days of every activity: Map actId → Set of days. */
export function tickDays(log = []) {
  const out = new Map();
  for (const e of log) {
    if (!e?.actId || !e.day) continue;
    if (!out.has(e.actId)) out.set(e.actId, new Set());
    out.get(e.actId).add(e.day);
  }
  return out;
}
