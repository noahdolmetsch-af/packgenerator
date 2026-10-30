/**
 * «Analyse» M6 (Noah 27.10.2026 «alle Mockups 1:1»): the rules of the page of one value. Pure: days are
 * 'YYYY-MM-DD', nothing reads the clock or the database. Only to look at: no grades.
 */
import { addDays } from '../analyse.js';

/** The ranges of the page: day, week, month, 3 months, year, everything (days; 0 = from the first value). */
export const RANGES = [
  { key: 'd', days: 1 },
  { key: 'w', days: 7 },
  { key: 'm', days: 30 },
  { key: 'm3', days: 91 },
  { key: 'y', days: 365 },
  { key: 'all', days: 0 },
];
export const DEFAULT_RANGE = 'm3';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const span = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/** The days of a range that ends `back` ranges before today, oldest first. first: the first day with a value. */
export function windowOf(range, today, back = 0, first = null) {
  const r = RANGES.find((x) => x.key === range) ?? RANGES[3];
  if (!r.days) {
    const from = first && first < today ? first : addDays(today, -29);
    return { from, to: today, days: Array.from({ length: span(from, today) + 1 }, (_, i) => addDays(from, i)) };
  }
  const to = addDays(today, -r.days * Math.max(0, back));
  const from = addDays(to, -(r.days - 1));
  return { from, to, days: Array.from({ length: r.days }, (_, i) => addDays(from, i)) };
}

/**
 * The points of the chart: one per day, or per week when the range is longer than `max` days (the mean,
 * or the total for values that add up). → [{ key: first day, days, v }]
 */
export function bucketsOf(days, get, sum = false, max = 120) {
  const size = days.length > max ? 7 : 1;
  const out = [];
  for (let i = 0; i < days.length; i += size) {
    const part = days.slice(i, i + size);
    const vals = part.map((d) => fin(get(d))).filter((v) => v != null);
    out.push({ key: part[0], days: part, v: vals.length ? (sum ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length) : null });
  }
  return out;
}

/** The numbers of the boxes: mean (or total), lowest and highest with their day, how many days. */
export function statsOf(days, get, sum = false) {
  let n = 0;
  let total = 0;
  let lo = null;
  let hi = null;
  for (const d of days) {
    const v = fin(get(d));
    if (v == null) continue;
    n++;
    total += v;
    if (!lo || v < lo.v) lo = { v, day: d };
    if (!hi || v > hi.v) hi = { v, day: d };
  }
  return { n, total: n ? total : null, avg: n ? total / n : null, lo, hi, sum };
}

/** The value at share q (0…1) of the sorted list, linear between two. */
export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const a = Math.floor(pos);
  const b = Math.ceil(pos);
  return sorted[a] + (sorted[b] - sorted[a]) * (pos - a);
}

/** «Dein typischer Bereich»: the middle half of your days (from the quarter to three quarters); null under 7 days. */
export function typicalOf(days, get) {
  const vals = days.map((d) => fin(get(d))).filter((v) => v != null).sort((a, b) => a - b);
  if (vals.length < 7) return null;
  return [quantile(vals, 0.25), quantile(vals, 0.75)];
}

/** The mean of the 7 days up to each point (only points with a value count). */
export function mean7(points) {
  return points.map((p, i) => {
    const part = points.slice(Math.max(0, i - 6), i + 1).map((x) => x.v).filter((v) => v != null);
    return part.length >= 3 ? part.reduce((a, b) => a + b, 0) / part.length : null;
  });
}

/** Weekday of a day, Monday 0 … Sunday 6. */
export const weekdayOf = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;

/** Per weekday (Monday first) the mean of the days with a value; → [{ wd, v, n }]. */
export function weekdays(days, get) {
  const sum = Array(7).fill(0);
  const n = Array(7).fill(0);
  for (const d of days) {
    const v = fin(get(d));
    if (v == null) continue;
    sum[weekdayOf(d)] += v;
    n[weekdayOf(d)]++;
  }
  return sum.map((s, wd) => ({ wd, v: n[wd] ? s / n[wd] : null, n: n[wd] }));
}

/** The weekday with the highest and the lowest mean (null with fewer than 2 weekdays). */
export function weekdayExtremes(list) {
  const has = list.filter((x) => x.v != null);
  if (has.length < 2) return null;
  const hi = has.reduce((a, b) => (b.v > a.v ? b : a));
  const lo = has.reduce((a, b) => (b.v < a.v ? b : a));
  return hi.v === lo.v ? null : { hi: hi.wd, lo: lo.wd };
}

/** The trips inside the days as bands: [{ name, from, to, a, b }] with a/b the index of the first and last day. */
export function tripBands(trips = [], days = [], endOf) {
  if (!days.length) return [];
  const first = days[0];
  const last = days.at(-1);
  const out = [];
  for (const tr of trips) {
    const s = tr?.startDate;
    const e = endOf?.(tr) ?? s;
    if (!s || !e || e < first || s > last) continue;
    const from = s < first ? first : s;
    const to = e > last ? last : e;
    out.push({ name: tr.name ?? '', from, to, a: days.indexOf(from), b: days.indexOf(to) });
  }
  return out.filter((x) => x.a >= 0 && x.b >= 0);
}

/** The same days one year earlier (for «Vorjahr daneben»). */
export const yearBefore = (days) => days.map((d) => addDays(d, -364));

/** The first day with a value of the item (searching the given days, oldest first), or null. */
export function firstDay(days, get) {
  for (const d of days) if (fin(get(d)) != null) return d;
  return null;
}
