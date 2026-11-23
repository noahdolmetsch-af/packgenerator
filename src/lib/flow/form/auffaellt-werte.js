/**
 * «Was auffällt» for every value (Noah 23.11.2026 «ja»): before, the card looked only at the resting pulse and said
 * «Nothing stands out» while the HRV was 42 % under the normal and the night 3 h 55. Now HRV and sleep are looked at
 * the same way as the resting pulse (auffaellt.js): the mean of the last 3 days with a value (at least 2) against the
 * middle of the 28 values before, marked days (K1) left out. Added: a single newest value that is far off counts too,
 * because one bad night is what the morning shows. Only an observation, never a cause, never advice. Pure;
 * tests/form-antwort.test.js.
 */
import { addDays } from '../../health.js';
import { BASE_DAYS, MAX_LOOK, MIN_BASE, RECENT, MIN_RECENT, MAX_AGE } from './auffaellt.js';

/** HRV: the last days this share under the normal; the newest value this share under it. */
export const HRV_LOW = 0.15;
export const HRV_LOW_NOW = 0.25;
/** Sleep (minutes): the last nights this far under the normal; the newest night this far under it or under SLEEP_MIN. */
export const SLEEP_LOW = 60;
export const SLEEP_LOW_NOW = 120;
export const SLEEP_MIN = 300;

const median = (list) => {
  const v = list.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/**
 * One value over the last days.
 * table: Map day → { hrv, sleep, … }; key: 'hrv' | 'sleep'; marked: Set of days.
 * → { key, state: 'none' | 'low' | 'lowNow' | 'few' | 'old' | 'marked', normal?, mean?, value?, pct?, n?, from?, to? }
 *   low: the last n days with a value are under the normal (pct: share for HRV, minutes for sleep: `gap`);
 *   lowNow: only the newest value is far under it; none: in the normal; few: too few values for a normal;
 *   old: no value in the last days; marked: the newest day carries a marker, nothing is judged.
 */
export function valueAlert({ table, today, key, marked = new Set() }) {
  const val = (d) => {
    const v = table?.get(d)?.[key];
    return Number.isFinite(v) ? v : null;
  };
  let end = null;
  for (let i = 0; i <= MAX_AGE; i++) {
    const d = addDays(today, -i);
    if (val(d) != null) {
      end = d;
      break;
    }
  }
  if (!end) return { key, state: 'old' };
  if (marked.has(end)) return { key, state: 'marked', to: end };
  const recent = Array.from({ length: RECENT }, (_, i) => addDays(end, -i)).filter((d) => val(d) != null && !marked.has(d));
  const base = [];
  for (let i = 0; i < MAX_LOOK && base.length < BASE_DAYS; i++) {
    const d = addDays(end, -RECENT - i);
    if (val(d) != null && !marked.has(d)) base.push(val(d));
  }
  if (base.length < MIN_BASE) return { key, state: 'few' };
  const normal = median(base);
  const mean = recent.reduce((s, d) => s + val(d), 0) / recent.length;
  const value = val(end);
  const hrv = key === 'hrv';
  const gapMean = hrv ? (normal - mean) / normal : normal - mean; // share (HRV) or minutes (sleep) under the normal
  const gapNow = hrv ? (normal - value) / normal : normal - value;
  const lim = hrv ? HRV_LOW : SLEEP_LOW;
  const low = recent.length >= MIN_RECENT && gapMean >= lim;
  const lowNow = gapNow >= (hrv ? HRV_LOW_NOW : SLEEP_LOW_NOW) || (!hrv && value < SLEEP_MIN);
  // one bad newest value after normal days is «lowNow», not a mean of three (the number that matters is the newest)
  const before = recent.slice(1).map(val);
  const beforeLow = before.length > 0 && (hrv ? (normal - before.reduce((s, v) => s + v, 0) / before.length) / normal : normal - before.reduce((s, v) => s + v, 0) / before.length) >= lim;
  const out = { key, normal, mean, value, to: end };
  if (low && !(lowNow && !beforeLow)) {
    // «since N days»: the days in a row up to the newest that lie under the normal by half the limit
    const half = (hrv ? HRV_LOW : SLEEP_LOW) / 2;
    let n = 0;
    for (let d = end; val(d) != null && !marked.has(d) && (hrv ? (normal - val(d)) / normal : normal - val(d)) >= half && n < 60; d = addDays(d, -1)) n++;
    n = Math.max(n, 1);
    return { ...out, state: 'low', pct: Math.round(gapMean * 100), gap: Math.round(gapMean), n, from: addDays(end, -(n - 1)) };
  }
  if (lowNow) return { ...out, state: 'lowNow', pct: Math.round(gapNow * 100), gap: Math.round(gapNow), n: 1, from: end };
  return { ...out, state: 'none' };
}

/** HRV and sleep together: [valueAlert …] (key order: hrv, sleep). */
export const valueAlerts = ({ table, today, marked = new Set() }) => ['hrv', 'sleep'].map((key) => valueAlert({ table, today, key, marked }));
