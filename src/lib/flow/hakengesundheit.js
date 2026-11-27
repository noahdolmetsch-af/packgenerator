/**
 * «Was Bewegung mit dir macht» (Noah 27.11.2026 «aktivzonenminuten pro woche vgl mit ruheherzfrequenz pro woche», «4a», Paket B):
 * the active zone minutes of a week against the resting pulse, the HRV and the sleep of the same and of the next week. Pure rules over
 * the day table of the app (messwerte.js dayTable: day → { azm, rhr, hrv, sleep (min) }). Observation only: it says where the weeks lie
 * and never why, a «pattern, not a cause».
 */
import { addDays } from '../flow.js';
import { mondayOf } from './hakenverlauf.js';
import { weekCount } from './hakenzahlen.js';

/** The values that are set against the active zone minutes. unit: shown after the number; min: the least difference worth a sentence. */
export const METRICS = {
  rhr: { key: 'rhr', better: 'lower', min: 0.3 },
  hrv: { key: 'hrv', better: 'higher', min: 1 },
  sleep: { key: 'sleep', better: 'higher', min: 5 },
};
export const METRIC_KEYS = Object.keys(METRICS);
/** A week needs this many days with a value to count (the active zone minutes add up, the others are a mean). */
export const MIN_AZM_DAYS = 4;
export const MIN_DAYS = 3;
/** Fewer weeks than this (with both values): no sentence. */
export const MIN_PAIRS = 20;
/** The smallest correlation (absolute) worth a sentence. */
export const MIN_R = 0.2;

const fin = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);

/** Every week the table knows: monday → { azm (sum, or null under 4 days), rhr, hrv, sleep (means, or null under 3 days) }. */
export function weeksOf(table = new Map()) {
  const by = new Map();
  for (const [day, row] of table) {
    const m = mondayOf(day);
    const w = by.get(m) ?? { azm: [], rhr: [], hrv: [], sleep: [] };
    for (const k of ['azm', ...METRIC_KEYS]) {
      const v = fin(row?.[k]);
      if (v != null) w[k].push(v);
    }
    by.set(m, w);
  }
  const out = new Map();
  for (const [m, w] of by) {
    const mean = (xs) => (xs.length >= MIN_DAYS ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    out.set(m, { azm: w.azm.length >= MIN_AZM_DAYS ? w.azm.reduce((a, b) => a + b, 0) : null, rhr: mean(w.rhr), hrv: mean(w.hrv), sleep: mean(w.sleep) });
  }
  return out;
}

/** The weeks shown for a span (as in «Wochenpensum»), the running week last: [{ key (the Monday), azm, rhr, hrv, sleep, current }]. */
export function shownWeeks(table, today, span = 10) {
  const all = weeksOf(table);
  const monday = mondayOf(today);
  const n = weekCount(span);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = addDays(monday, -7 * i);
    out.push({ key, ...(all.get(key) ?? { azm: null, rhr: null, hrv: null, sleep: null }), current: i === 0 });
  }
  return out;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
function pearson(xs, ys) {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i] - my);
    sxx += (x - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

/**
 * The weeks with more active zone minutes against the metric of the week AFTER: the full weeks are split at the median of the active zone minutes.
 * → null without 20 weeks, else { n, since (the year of the first week), high, low (means of the metric in the week after), r, verdict }
 * verdict: 'better' | 'worse' | 'none' ('none': the difference or the correlation is too small to say anything).
 */
export function relation(table, today, key = 'rhr') {
  const m = METRICS[key];
  if (!m) return null;
  const all = weeksOf(table);
  const monday = mondayOf(today);
  const pairs = [];
  for (const [w, row] of [...all].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const next = addDays(w, 7);
    if (w >= monday || next >= monday || row.azm == null) continue; // only full weeks, the week after must be full too
    const v = all.get(next)?.[key];
    if (v != null) pairs.push({ w, azm: row.azm, v });
  }
  if (pairs.length < MIN_PAIRS) return null;
  const mid = median(pairs.map((p) => p.azm));
  const hi = pairs.filter((p) => p.azm > mid).map((p) => p.v);
  const lo = pairs.filter((p) => p.azm <= mid).map((p) => p.v);
  if (hi.length < 8 || lo.length < 8) return null;
  const high = mean(hi);
  const low = mean(lo);
  const r = pearson(pairs.map((p) => p.azm), pairs.map((p) => p.v));
  const diff = high - low;
  const verdict = Math.abs(diff) < m.min || Math.abs(r) < MIN_R ? 'none' : (diff < 0) === (m.better === 'lower') ? 'better' : 'worse';
  return { n: pairs.length, since: pairs[0].w.slice(0, 4), high, low, r, verdict, direction: diff < 0 ? 'lower' : 'higher' };
}
