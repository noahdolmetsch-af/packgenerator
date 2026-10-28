/**
 * «Form und Erholung» (Noah 20.10.2026 «1a 2b 3a 4a 5a»): a daily readiness value 0–100 with one
 * sentence what today suits, from
 * - the load of every activity (1a, all sports): power ÷ FTP where a power meter recorded the ride,
 *   else Strava's relative effort, else pulse and time (a TRIMP after Banister);
 * - fitness (the load of 42 days, «chronic»), fatigue (7 days, «acute») and form = fitness − fatigue,
 *   as cyclists count it (exponential means, day by day);
 * - recovery from Fitbit against your own normal: resting pulse, HRV, the last night's sleep;
 * - the morning check (5a): felt sleep and energy (1–10).
 * Only to look at, no diagnosis. Pure functions; tests/form.test.js.
 */
import { addDays } from './health.js';
import { powerLoad, isoWeek } from './training.js';

export const FIT_DAYS = 42;
export const FAT_DAYS = 7;
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * The load of one activity and where it comes from: { load, how: 'power' | 'effort' | 'pulse' } or null.
 * ftp: watts (estimated FTP); rest/max: resting and highest pulse for the pulse formula.
 */
export function loadOf(a, { ftp = null, rest = 55, max = 190 } = {}) {
  if (!a || a.hidden) return null;
  // «TSS vom Gerät» (Noah 28.10.2026 «1a»): the training stress the bike computer wrote into the FIT file
  if (fin(a.tssDevice) > 0) return { load: Math.round(a.tssDevice), how: 'device' };
  const p = a.wDevice ? powerLoad(a, ftp) : null;
  if (p?.load > 0) return { load: p.load, how: 'power' };
  if (fin(a.effort) > 0) return { load: Math.round(a.effort), how: 'effort' };
  const min = (fin(a.movingS) ?? 0) / 60;
  if (fin(a.hrAvg) > 0 && min > 0 && max > rest) {
    const hrr = clamp((a.hrAvg - rest) / (max - rest), 0, 1);
    return { load: Math.round(min * hrr * 0.64 * Math.exp(1.92 * hrr)), how: 'pulse' };
  }
  return null;
}

/**
 * The load per day: Map day → sum of the loads. table (optional): the day table, whose rows add the TSS of
 * FIT rides without a Strava twin (row.fitTss, messwerte-data.js).
 */
export function dayLoads(acts = [], opts = {}, table = null) {
  const out = new Map();
  for (const a of acts) {
    const l = loadOf(a, opts);
    if (!l || !a.day) continue;
    out.set(a.day, (out.get(a.day) ?? 0) + l.load);
  }
  for (const row of table?.values?.() ?? []) if (fin(row?.fitTss) > 0) out.set(row.day, (out.get(row.day) ?? 0) + Math.round(row.fitTss));
  return out;
}

/**
 * Fitness, fatigue and form for every day from..to: [{ day, load, fit, fat, form }]. The means start
 * `warm` days before «from», so the first days already carry the weeks before.
 * UI-Test 26.10.2026 T3 (G3-01): they start at the first load when that is earlier, so every page (Form,
 * Training, Wochenrückblick) gets the same numbers for the same day, whatever span it shows.
 */
export function formSeries(loads, from, to, warm = 120) {
  const kFit = 1 - Math.exp(-1 / FIT_DAYS);
  const kFat = 1 - Math.exp(-1 / FAT_DAYS);
  let fit = 0;
  let fat = 0;
  const out = [];
  const first = [...loads.keys()].filter((d) => typeof d === 'string' && d <= to).sort()[0];
  const start = first && first < addDays(from, -warm) ? first : addDays(from, -warm);
  for (let d = start; d <= to; d = addDays(d, 1)) {
    const load = loads.get(d) ?? 0;
    fit += (load - fit) * kFit;
    fat += (load - fat) * kFat;
    if (d >= from) out.push({ day: d, load, fit: Math.round(fit * 10) / 10, fat: Math.round(fat * 10) / 10, form: Math.round((fit - fat) * 10) / 10 });
  }
  return out;
}

const median = (vals) => {
  const s = vals.filter((v) => fin(v) != null).sort((a, b) => a - b);
  if (s.length < 7) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Recovery of one day against the own normal (median of the 30 days before): the parts that count,
 * each { key, v, normal, delta, points } (points: + helps, − holds back).
 * day: a row of messwerte.js dayTable (rhr, hrv, sleep in minutes); felt: { sleep, energy } 1–10 or null.
 */
export function recoveryParts(table, today, felt = null) {
  const row = table.get(today) ?? {};
  const before = Array.from({ length: 30 }, (_, i) => table.get(addDays(today, -1 - i)) ?? {});
  const parts = [];
  const rhrN = median(before.map((r) => r.rhr));
  if (fin(row.rhr) != null && rhrN != null) parts.push({ key: 'rhr', v: row.rhr, normal: rhrN, delta: Math.round(row.rhr - rhrN), points: clamp(-(row.rhr - rhrN) * 4, -25, 12) });
  const hrvN = median(before.map((r) => r.hrv));
  if (fin(row.hrv) != null && hrvN) {
    const pct = Math.round(((row.hrv - hrvN) / hrvN) * 100);
    parts.push({ key: 'hrv', v: row.hrv, normal: hrvN, delta: pct, points: clamp(pct * 0.6, -20, 12) });
  }
  if (fin(row.sleep) != null) {
    const h = row.sleep / 60;
    parts.push({ key: 'sleep', v: row.sleep, normal: 450, delta: Math.round(row.sleep - 450), points: clamp((h - 7.5) * 6, -18, 8) });
  }
  if (fin(felt?.sleep) != null) parts.push({ key: 'feltSleep', v: felt.sleep, normal: 6, delta: felt.sleep - 6, points: clamp((felt.sleep - 6) * 2.5, -10, 8) });
  if (fin(felt?.energy) != null) parts.push({ key: 'energy', v: felt.energy, normal: 6, delta: felt.energy - 6, points: clamp((felt.energy - 6) * 3, -12, 10) });
  return parts;
}

/**
 * The readiness of today: { score 0–100, level 'rest'|'easy'|'normal'|'hard', form, fit, fat, parts,
 * reason (the part that moved the score most), ramp (fitness up per week) } or null without any data.
 */
export function readiness({ series, parts = [] }) {
  const last = series?.at(-1);
  const hasLoad = !!series?.some((s) => s.load > 0);
  if (!hasLoad && !parts.length) return null;
  // form: −30 (very tired) … +20 (fresh), relative to the fitness so small and big trainers compare
  const formPts = hasLoad ? clamp((last.form / Math.max(10, last.fit)) * 60, -30, 20) : 0;
  const recPts = parts.reduce((s, p) => s + p.points, 0);
  const score = Math.round(clamp(60 + formPts + recPts, 0, 100));
  const level = score < 35 ? 'rest' : score < 55 ? 'easy' : score < 75 ? 'normal' : 'hard';
  const all = [...parts, ...(hasLoad ? [{ key: 'form', v: last.form, delta: last.form, points: formPts }] : [])];
  const reason = all.length ? all.reduce((a, b) => (Math.abs(b.points) > Math.abs(a.points) ? b : a)) : null;
  const weekAgo = series.length > 7 ? series.at(-8) : null;
  const ramp = weekAgo ? Math.round((last.fit - weekAgo.fit) * 10) / 10 : null;
  return { score, level, formPts: hasLoad ? formPts : null, form: last?.form ?? 0, fit: last?.fit ?? 0, fat: last?.fat ?? 0, parts, reason, ramp };
}

/** Fitness rising faster than this per week: a calm hint (an assumption from training practice). */
export const RAMP_MAX = 8;

/**
 * The recovery hint: resting pulse at least 5 above the normal AND HRV at least 15 % under it, on the
 * last two days. Observation only.
 */
export function recoveryAlarm(table, today) {
  const hit = (d) => {
    const p = recoveryParts(table, d);
    const r = p.find((x) => x.key === 'rhr');
    const h = p.find((x) => x.key === 'hrv');
    return !!(r && h && r.delta >= 5 && h.delta <= -15);
  };
  return hit(today) && hit(addDays(today, -1));
}

/**
 * Tour readiness (4a): the next trip within 7 days, or the trip running today, with its days.
 * → { trip, phase: 'before'|'during', inDays, dayNo, days: [{ day, rhr, sleep }] } or null.
 */
export function tourOf(trips = [], table, today) {
  const ok = trips.filter((t) => t?.startDate && !t.skipped && !t.idea && !t.archivedAt);
  const span = (t) => {
    const n = Math.max(1, Number(t.days) || 1);
    const s = t.startDate.slice(0, 10);
    return { s, e: addDays(s, n - 1), n };
  };
  const now = ok.find((t) => {
    const { s, e } = span(t);
    return s <= today && today <= e;
  });
  const days = (t) => {
    const { s, n } = span(t);
    return Array.from({ length: n }, (_, i) => addDays(s, i)).map((day) => ({ day, rhr: table.get(day)?.rhr ?? null, sleep: table.get(day)?.sleep ?? null, future: day > today }));
  };
  if (now) {
    const { s } = span(now);
    let dayNo = 1;
    for (let d = s; d < today; d = addDays(d, 1)) dayNo++;
    return { trip: now, phase: 'during', dayNo, inDays: 0, days: days(now) };
  }
  const next = ok
    .filter((t) => span(t).s > today && span(t).s <= addDays(today, 7))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (!next) return null;
  let inDays = 0;
  for (let d = today; d < span(next).s; d = addDays(d, 1)) inDays++;
  return { trip: next, phase: 'before', inDays, dayNo: 0, days: days(next) };
}

/** The resting pulse per day of the last finished multi-day trips (newest first, at most n). */
export function pastTours(trips = [], table, today, n = 3) {
  return trips
    .filter((t) => t?.startDate && !t.skipped && !t.idea && !t.archivedAt && (Number(t.days) || 1) > 1)
    .map((t) => {
      const s = t.startDate.slice(0, 10);
      const k = Math.max(1, Number(t.days) || 1);
      const days = Array.from({ length: k }, (_, i) => addDays(s, i)).map((day) => ({ day, rhr: table.get(day)?.rhr ?? null }));
      return { trip: t, end: addDays(s, k - 1), days };
    })
    .filter((x) => x.end < today && x.days.some((d) => d.rhr != null))
    .sort((a, b) => b.end.localeCompare(a.end))
    .slice(0, n);
}

/**
 * UI-Test 26.10.2026 T3 (G3-01): the shown numbers of a day, rounded so the sum adds up on screen:
 * form = fitness − fatigue of the rounded values («Form 7 = Fitness 23 − Müdigkeit 16»). → { fit, fat, form }
 */
export const shownForm = (x) => {
  const fit = Math.round(x?.fit ?? 0);
  const fat = Math.round(x?.fat ?? 0);
  return { fit, fat, form: fit - fat };
};

/**
 * Training «Fitness, Müdigkeit und Form» (UI-Test T3): one point per week (the value of the week's Sunday,
 * or today for this week) for n weeks from the same series as the page «Form». → { weeks: [{ monday, kw,
 * fit, fat, form }], now } or null without any load. mondays: the Mondays of the weeks, oldest first.
 */
export function formWeeksOf(series, today, mondays) {
  if (!series?.some((s) => s.load > 0)) return null;
  const at = new Map(series.map((s) => [s.day, s]));
  const pick = (d) => shownForm(at.get(d) ?? series.filter((s) => s.day <= d).at(-1));
  const weeks = mondays.map((m) => {
    const end = addDays(m, 6) < today ? addDays(m, 6) : today;
    return { monday: m, kw: isoWeek(m), ...pick(end) };
  });
  return { weeks, now: pick(today) };
}

/**
 * The line of the Wochenrückblick: fitness and form at the end of the week («end») and the change of
 * the fitness against the week before. → { fit, form, delta } or null without any load.
 */
export function weekForm(series, end) {
  const i = series.findIndex((s) => s.day === end);
  if (i < 0 || !series.slice(0, i + 1).some((s) => s.load > 0)) return null;
  const a = series[i];
  const b = series[i - 7];
  const s = shownForm(a); // UI-Test T3: the same rounding as the page «Form»
  return { fit: s.fit, form: s.form, delta: b ? Math.round(a.fit - b.fit) : null };
}

/**
 * The readiness of every day from..to: Map day → 0–100 (days without any value stay out). checks: Map
 * day → { sleep, energy } of the morning check.
 */
export function readinessOf(loads, table, checks, from, to) {
  const series = formSeries(loads, addDays(from, -7), to);
  const out = new Map();
  series.forEach((s, i) => {
    if (s.day < from) return;
    const c = checks.get(s.day);
    const r = readiness({ series: series.slice(0, i + 1), parts: recoveryParts(table, s.day, c ? { sleep: c.sleep, energy: c.energy } : null) });
    if (r) out.set(s.day, r.score);
  });
  return out;
}
