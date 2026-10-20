/**
 * Garmin-Übersicht (Noah 20.10.2026 «Schau: genau so kann es aussehen … baue sie 1:1 nach»): the
 * numbers of Aktiv's overview in the shape of Garmin Connect, from the day table of messwerte.js.
 * - todayActs: the activities of today;
 * - focus: per sport the last 7 days (sum km and time, one bar per day) and the 28 days as dots;
 * - lastWeek: the list «Letzte 7 Tage» (activities per sport with km, mean resting pulse, mean calories);
 * - calories: today's calories, active and at rest;
 * - stats: the sport page (7 days / 4 weeks / 1 year; distance, time, climbing, calories);
 * - hrStats: the heart rate page (resting and highest pulse per day).
 * Pure functions; tests/uebersicht.test.js. Only to look at.
 */
import { addDays } from './health.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const sum = (xs) => xs.reduce((s, v) => s + (v ?? 0), 0);
const mean = (xs) => {
  const v = xs.filter((x) => fin(x) != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

export const KIND_ORDER = ['bike', 'run', 'hike', 'other'];
/** The values of the sport page, in the order of its tabs. */
export const STAT_KEYS = ['km', 'time', 'hm', 'kcal'];
/** The ranges: 7 days, 4 weeks, 1 year (Garmin «7 Ta. / 4 Wo. / 1 J»). */
export const RANGES = { d7: 7, w4: 28, y1: 365 };

/** The days from..to (both included). */
export function daysOf(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** One sport's value of one day: km, time (s), hm (m), kcal, n (activities). */
export function kindDay(row, kind) {
  const acts = (row?.acts ?? []).filter((a) => a.kind === kind);
  let km = sum(acts.map((a) => fin(a.km)));
  let hm = sum(acts.map((a) => fin(a.hm)));
  // the bike counts the rides of the app too (the day table's km and hm minus the other sports)
  if (kind === 'bike' && row) {
    const others = (row.acts ?? []).filter((a) => a.kind !== 'bike');
    km = Math.max(km, (row.km ?? 0) - sum(others.map((a) => fin(a.km))));
    hm = Math.max(hm, (row.hm ?? 0) - sum(others.map((a) => fin(a.hm))));
  }
  return {
    km: Math.round(km * 100) / 100,
    time: sum(acts.map((a) => fin(a.movingS))),
    hm: Math.round(hm),
    kcal: Math.round(sum(acts.map((a) => fin(a.kcal) ?? fin(a.kj)))),
    n: acts.length || (kind === 'bike' && km > 0 ? 1 : 0),
  };
}

/** The sports with an activity in the 28 days up to today, the most active first (ties: bike, run, hike, other). */
export function kindsOf(table, today, days = 28) {
  const n = new Map();
  for (const d of daysOf(addDays(today, -(days - 1)), today)) {
    for (const k of KIND_ORDER) {
      const v = kindDay(table.get(d), k);
      if (v.n) n.set(k, (n.get(k) ?? 0) + v.n);
    }
  }
  return [...n.keys()].sort((a, b) => n.get(b) - n.get(a) || KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b));
}

/**
 * «Im Fokus»: one sport over the last 7 days (today on the right) and the 28 days as dots.
 * → { kind, from, to, km, time, bars: [{ day, km }], dots: [{ day, size 0–3 }] }
 */
export function focus(table, today, kind) {
  const from = addDays(today, -6);
  const bars = daysOf(from, today).map((day) => ({ day, km: kindDay(table.get(day), kind).km, time: kindDay(table.get(day), kind).time }));
  const days28 = daysOf(addDays(today, -27), today).map((day) => ({ day, ...kindDay(table.get(day), kind) }));
  const top = Math.max(1, ...days28.map((d) => d.km || d.time / 1800));
  const dots = days28.map((d) => {
    const v = d.km || d.time / 1800;
    return { day: d.day, size: !d.n ? 0 : v >= top * 0.66 ? 3 : v >= top * 0.33 ? 2 : 1 };
  });
  return { kind, from, to: today, km: Math.round(sum(bars.map((b) => b.km)) * 100) / 100, time: sum(bars.map((b) => b.time)), bars, dots };
}

/** «Letzte 7 Tage»: per sport the count and km, the mean resting pulse and the mean calories of the days. */
export function lastWeek(table, today) {
  const days = daysOf(addDays(today, -6), today);
  const kinds = KIND_ORDER.map((kind) => {
    const v = days.map((d) => kindDay(table.get(d), kind));
    return { kind, n: sum(v.map((x) => x.n)), km: Math.round(sum(v.map((x) => x.km)) * 10) / 10, time: sum(v.map((x) => x.time)) };
  }).filter((k) => k.n);
  const rhr = mean(days.map((d) => table.get(d)?.rhr));
  const kcal = mean(days.map((d) => caloriesOf(table.get(d)).total));
  return { kinds, rhr: rhr == null ? null : Math.round(rhr), kcal: kcal == null ? null : Math.round(kcal) };
}

/**
 * The calories of a day: total and active from Fitbit; without Fitbit the active ones of the Strava
 * activities. rest = total − active. → { total, active, rest, src: 'fitbit' | 'strava' | null }
 */
export function caloriesOf(row) {
  const total = fin(row?.kcal);
  const active = fin(row?.kcalActive) ?? (fin(row?.kcalAct) || null);
  if (total != null) return { total, active, rest: active != null ? Math.max(0, total - active) : null, src: 'fitbit' };
  if (active != null) return { total: null, active, rest: null, src: 'strava' };
  return { total: null, active: null, rest: null, src: null };
}

/** The window of a range: 7 days or 4 weeks end today (minus `back` windows); a year is 12 months. */
export function windowOf(range, today, back = 0) {
  if (range === 'y1') {
    const end = monthStart(today, -12 * back);
    const months = Array.from({ length: 12 }, (_, i) => monthStart(end, i - 11));
    const to = back ? addDays(monthStart(end, 1), -1) : today;
    return { from: months[0], to, months };
  }
  const n = RANGES[range] ?? 7;
  const to = addDays(today, -n * back);
  return { from: addDays(to, -(n - 1)), to };
}
/** The first of the month of `day`, moved by n months. */
export function monthStart(day, n = 0) {
  const [y, m] = day.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/**
 * The sport page: the bars of one value in a range (per day; per month for a year), the total, the
 * daily mean and the activities. → { from, to, bars: [{ key, v }], total, perDay, acts }
 */
export function stats(table, today, kind, key, range = 'd7', back = 0) {
  const w = windowOf(range, today, back);
  const days = daysOf(w.from, w.to);
  const val = (d) => kindDay(table.get(d), kind)[key] ?? 0;
  const bars = w.months
    ? w.months.map((m) => ({ key: m, v: sum(days.filter((d) => d.startsWith(m.slice(0, 7))).map(val)) }))
    : days.map((d) => ({ key: d, v: val(d) }));
  const total = sum(days.map(val));
  const acts = days
    .flatMap((d) => (table.get(d)?.acts ?? []).filter((a) => a.kind === kind))
    .sort((a, b) => `${b.day} ${b.time ?? ''}`.localeCompare(`${a.day} ${a.time ?? ''}`));
  return { from: w.from, to: w.to, bars, total, perDay: days.length ? total / days.length : 0, acts };
}

/**
 * The heart rate page: per day (per month for a year) the resting and the highest pulse, their means
 * and the days with a value, the newest first. → { from, to, points: [{ key, rest, high }], rest, high, days }
 */
export function hrStats(table, today, range = 'd7', back = 0) {
  const w = windowOf(range, today, back);
  const days = daysOf(w.from, w.to);
  const rowOf = (d) => ({ key: d, rest: fin(table.get(d)?.rhr), high: fin(table.get(d)?.hrMax) });
  const per = days.map(rowOf);
  const points = w.months
    ? w.months.map((m) => {
        const inM = per.filter((p) => p.key.startsWith(m.slice(0, 7)));
        const r = mean(inM.map((p) => p.rest));
        const h = mean(inM.map((p) => p.high));
        return { key: m, rest: r == null ? null : Math.round(r), high: h == null ? null : Math.round(h) };
      })
    : per;
  const r = mean(per.map((p) => p.rest));
  const h = mean(per.map((p) => p.high));
  return { from: w.from, to: w.to, points, rest: r == null ? null : Math.round(r), high: h == null ? null : Math.round(h), days: [...per].reverse() };
}

/** The resting pulse of the last days for the small curve of the tile (oldest first, n days). */
export function rhrLine(table, today, n = 14) {
  return daysOf(addDays(today, -(n - 1)), today).map((d) => fin(table.get(d)?.rhr));
}

/** The latest day (up to today, within 7 days) that has value k; → { day, v } or null. */
export function latestOf(table, today, k) {
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const v = fin(table.get(d)?.[k]);
    if (v != null) return { day: d, v };
  }
  return null;
}
