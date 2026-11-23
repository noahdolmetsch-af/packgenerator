/**
 * «Dein Körper heute»: the one quiet line under the banner (Noah 23.11.2026 «1-4a», point 3). Three observations, only one
 * at a time and only when something stands out; the first that does wins:
 *   1. pulse: the resting pulse of the last days is above the usual (rule and changeable limit of «Was auffällt», auffaellt.js)
 *   2. load:  the active zone minutes of the last 7 days are far from your usual week (the 4 weeks before)
 *   3. light: the daylight left is getting short for the minutes of the outdoors challenge still missing
 * Observation only: never a cause, never advice, never good or bad. «Not today» hides a hint for the day (setting NO_KEY).
 * Pure; tests/body.test.js.
 */
import { addDays } from '../health.js';
import { restingAlert, DEFAULTS } from '../flow/form/auffaellt.js';
import { lightLine, missingMin } from '../outdoor.js';
import { offsetFor } from '../blockplan.js';
import { valueOf } from './body.js';

/** The setting with the days a hint was sent away: { pulse: 'YYYY-MM-DD', load: …, light: … }. */
export const NO_KEY = 'body.hint.no';
export const KINDS = ['pulse', 'load', 'light'];
/** The week counts as «far from usual» from this share away from the weeks before. */
export const LOAD_SHARE = 0.3;
/** At least so many zone minutes a week in the weeks before, so small numbers do not make a «+300 %». */
export const LOAD_MIN_BASE = 60;
/** At least so many days with a value: this week (of 7) and the 4 weeks before (of 28). */
export const LOAD_MIN_RECENT = 5;
export const LOAD_MIN_BASE_DAYS = 21;
/** The light hint shows from this many minutes before the latest start. */
export const LIGHT_AHEAD_MIN = 60;

const rowsOf = (health) => new Map((health ?? []).filter((r) => r?.date).map((r) => [r.date, r]));
const hmMin = (s) => (/^\d{2}:\d{2}$/.test(String(s)) ? Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5)) : null);

/** The days a hint was sent away for → a clean { kind: day } object. */
export function noOf(v) {
  const out = {};
  if (v && typeof v === 'object') for (const k of KINDS) if (typeof v[k] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v[k])) out[k] = v[k];
  return out;
}

/** Resting pulse above the usual. → { kind: 'pulse', n, above } | null */
export function pulseHint({ health, today, marked = new Set(), settings = DEFAULTS }) {
  const table = new Map();
  for (const r of health ?? []) {
    const v = valueOf(r, 'pulse');
    if (r?.date && v != null) table.set(r.date, { rhr: v });
  }
  const r = restingAlert({ table, today, marked, settings });
  return r.state === 'up' ? { kind: 'pulse', n: r.n, above: r.above } : null;
}

/**
 * The zone minutes of the last 7 days (today and the 6 before) against the mean of the 28 days before, both made a week of
 * 7 days (days without a value do not count as zero). → { kind: 'load', recent, base, pct, dir: 1 | -1 } | null
 */
export function loadHint({ health, today }) {
  const by = rowsOf(health);
  const take = (from, to) => {
    const v = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const x = valueOf(by.get(d), 'azm');
      if (x != null) v.push(x);
    }
    return v;
  };
  const recent = take(addDays(today, -6), today);
  const base = take(addDays(today, -34), addDays(today, -7));
  if (recent.length < LOAD_MIN_RECENT || base.length < LOAD_MIN_BASE_DAYS) return null;
  const week = (v) => (v.reduce((s, x) => s + x, 0) / v.length) * 7;
  const r = week(recent);
  const b = week(base);
  if (b < LOAD_MIN_BASE) return null;
  const diff = r / b - 1;
  if (Math.abs(diff) < LOAD_SHARE) return null;
  return { kind: 'load', recent: Math.round(r), base: Math.round(b), pct: Math.round(Math.abs(diff) * 100), dir: diff > 0 ? 1 : -1 };
}

/**
 * The outdoors challenge runs, minutes are still missing today and the daylight at home gets short: the hint shows from
 * LIGHT_AHEAD_MIN before the latest start until sunset. now: a Date. → { kind: 'light', set, latest | null, missing } | null
 */
export function lightHint({ rec, activities = [], today, place, now = new Date() }) {
  if (!rec?.from || rec.stopped || rec.closed || today < rec.from || today > rec.until) return null;
  const missing = missingMin(rec, activities, today);
  if (missing <= 0) return null;
  const line = lightLine(place, today, missing, now);
  if (!line) return null;
  // the clock of now in the day's own zone, the way lightLine writes the times
  const clock = new Date(now.getTime() + offsetFor(today) * 60000).toISOString().slice(11, 16);
  const at = hmMin(clock);
  const set = hmMin(line.set);
  if (at == null || set == null || at >= set) return null;
  const latest = hmMin(line.latest);
  if (latest != null && at < latest - LIGHT_AHEAD_MIN) return null;
  return { kind: 'light', set: line.set, latest: line.latest, missing };
}

/** The one hint to show: the first of pulse, load, light that stands out and was not sent away today. → hint | null */
export function bodyHint({ health, today, marked, settings, rec, activities, place, now, no = {} }) {
  const gone = (k) => no?.[k] === today;
  if (!gone('pulse')) {
    const h = pulseHint({ health, today, marked, settings });
    if (h) return h;
  }
  if (!gone('load')) {
    const h = loadHint({ health, today });
    if (h) return h;
  }
  if (!gone('light')) {
    const h = lightHint({ rec, activities, today, place, now });
    if (h) return h;
  }
  return null;
}
