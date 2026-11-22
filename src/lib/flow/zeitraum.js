/**
 * «Zeitraum» on Auswerten (Noah 05.11.2026 «Idee B: 1a 2b 3a 4a»): one switch on top that every group of the
 * place follows: Woche, Monat, Jahr, Alles and an own range. The first three can be paged back with ‹ ›.
 * Pure: a period is { mode, back, from, to } (from/to only for 'custom'); rangeOf() gives the days it covers.
 * The week is the rolling 7 days up to today (the same as «Letzte 7 Tage» before), the month and the year are
 * calendar ones. Tests: tests/zeitraum.test.js.
 */
import { addDays } from '../health.js';

export const MODES = ['week', 'month', 'year', 'all', 'custom'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Modes that can be paged back (‹ ›). */
export const STEPPED = ['week', 'month', 'year'];

export const DEFAULT_PERIOD = Object.freeze({ mode: 'week', back: 0, from: null, to: null });

/** A safe period from anything (stored text, a half-filled form). */
export function normalize(p) {
  const mode = MODES.includes(p?.mode) ? p.mode : 'week';
  const back = STEPPED.includes(mode) && Number.isInteger(p?.back) && p.back > 0 ? Math.min(p.back, 400) : 0;
  const from = DAY.test(p?.from ?? '') ? p.from : null;
  const to = DAY.test(p?.to ?? '') ? p.to : null;
  return { mode, back, from: mode === 'custom' ? from : null, to: mode === 'custom' ? to : null };
}

const parts = (day) => day.split('-').map(Number);
const monthStart = (day, n = 0) => new Date(Date.UTC(parts(day)[0], parts(day)[1] - 1 + n, 1)).toISOString().slice(0, 10);

/**
 * The days a period covers, up to `today` at most. → { from, to, now } where now = the current window
 * (back 0, no range of its own): the switch then shows no extra title.
 */
export function rangeOf(period, today) {
  const p = normalize(period);
  if (p.mode === 'week') {
    const to = addDays(today, -7 * p.back);
    return { from: addDays(to, -6), to, now: p.back === 0 };
  }
  if (p.mode === 'month') {
    const from = monthStart(today, -p.back);
    const end = addDays(monthStart(from, 1), -1);
    return { from, to: end > today ? today : end, now: p.back === 0 };
  }
  if (p.mode === 'year') {
    const y = parts(today)[0] - p.back;
    const end = `${y}-12-31`;
    return { from: `${y}-01-01`, to: end > today ? today : end, now: p.back === 0 };
  }
  if (p.mode === 'all') return { from: '1970-01-01', to: today, now: false };
  // custom: an incomplete or upside-down range falls back to the last 7 days
  let { from, to } = p;
  if (!from || !to) return { from: addDays(today, -6), to: today, now: false, incomplete: true };
  if (from > to) [from, to] = [to, from];
  return { from, to: to > today ? today : to, now: false };
}

/** The period one step earlier (-1) or later (+1); a later step never goes past the present. */
export function step(period, dir) {
  const p = normalize(period);
  if (!STEPPED.includes(p.mode)) return p;
  return { ...p, back: Math.max(0, p.back - dir) };
}
export const canStep = (period, dir) => {
  const p = normalize(period);
  return STEPPED.includes(p.mode) && (dir < 0 || p.back > 0);
};

/** Switch the mode; paging starts at the present again. */
export function withMode(period, mode) {
  const p = normalize(period);
  return normalize({ ...p, mode, back: 0 });
}

/** The first of the days that have a value, or null (for «Alles»: nothing before it is counted). */
export function firstOf(days = []) {
  let first = null;
  for (const d of days) if (DAY.test(d ?? '') && (first === null || d < first)) first = d;
  return first;
}

/** The words for a period («November 2026», «2026», «26. Okt. – 1. Nov.»); null for «Alles». tag = 'de-DE' / 'en-GB'. */
export function labelOf(period, today, tag = 'en-GB') {
  const p = normalize(period);
  if (p.mode === 'all') return null;
  const r = rangeOf(p, today);
  const f = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(tag, { ...o, timeZone: 'UTC' });
  if (p.mode === 'month') return f(r.from, { month: 'long', year: 'numeric' });
  if (p.mode === 'year') return String(parts(r.from)[0]);
  const sameYear = parts(r.from)[0] === parts(r.to)[0];
  return `${f(r.from, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })} – ${f(r.to, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
