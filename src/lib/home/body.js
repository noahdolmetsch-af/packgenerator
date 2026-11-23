/**
 * «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): «Dein Körper heute» on top of Heute. Four values of the Fitbit
 * days (healthDays, health.js), today next to yesterday: resting pulse, sleep in hours, the sleep score and the
 * active zone minutes. Observation only: an arrow says up or down, never good or bad.
 * The sleep score: Fitbit's own score when a day carries one (sleep.score), else the sleep efficiency
 * (time asleep of the time in bed, sleep.efficiency), which the Google interface delivers.
 * Pure functions, tested in tests/body.test.js.
 */
import { addDays, normalOf } from '../health.js';

/** The values of a day, in their order in the «Details» sheet (HRV since the banner, 23.11.2026). */
export const BODY_KEYS = ['pulse', 'sleep', 'score', 'azm', 'hrv'];
/**
 * «Dein Körper heute» as a banner (Noah 23.11.2026 «1-4a»): the values in its order. The sleep score is not in the banner,
 * it stays in the «Details» sheet. More fields (steps, outdoors, today's level) come in the next steps.
 */
export const BANNER_KEYS = ['pulse', 'azm', 'sleep', 'hrv'];
/** A value is marked «lower/higher than usual» from this share away from the usual (sleep, HRV). Only a quiet arrow, never good or bad. */
export const OFF_SHARE = 0.15;

const num = (x) => (Number.isFinite(Number(x)) && x !== null && x !== '' ? Number(x) : null);

/** One value of a day row. → number or null */
export function valueOf(row, key) {
  if (!row) return null;
  if (key === 'pulse') return num(row.restingHr);
  if (key === 'sleep') return num(row.sleep?.asleepMin) > 0 ? Math.round((row.sleep.asleepMin / 60) * 10) / 10 : null;
  if (key === 'score') return num(row.sleep?.score) ?? num(row.sleep?.efficiency);
  if (key === 'azm') return num(row.azm);
  if (key === 'hrv') return num(row.hrvMs) > 0 ? Math.round(num(row.hrvMs)) : null;
  return null;
}

/** Your usual value (median of the 30 days before today, at least 7 values) in the unit of valueOf(), or null. Only sleep and HRV have one in the banner. */
export function usualOf(health = [], key, today) {
  if (key !== 'sleep' && key !== 'hrv') return null;
  const m = normalOf(health ?? [], key === 'sleep' ? 'sleep' : 'hrvMs', today);
  if (m == null) return null;
  return key === 'sleep' ? Math.round((m / 60) * 10) / 10 : Math.round(m);
}

/** Lower (−1), higher (1) or about the usual (0) — null without a usual value. */
export function offOf(now, usual) {
  if (now == null || usual == null || !(usual > 0)) return null;
  const d = (now - usual) / usual;
  return d <= -OFF_SHARE ? -1 : d >= OFF_SHARE ? 1 : 0;
}

/** «geholt …» of a day row: the time it came from Fitbit (row.at) as { day: 'today' | 'yesterday' | ISO day, hm }, or null. */
export function fetchedOf(at, today, tz = undefined) {
  const d = new Date(at ?? '');
  if (!Number.isFinite(d.getTime())) return null;
  const part = (o) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, ...o }).format(d);
  const day = part({ year: 'numeric', month: '2-digit', day: '2-digit' });
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  return { day: day === today ? 'today' : day === addDays(today, -1) ? 'yesterday' : day, hm };
}

/** Up (1), down (−1), the same (0) or nothing to compare (null). */
export function dirOf(now, before) {
  if (now == null || before == null) return null;
  return now > before ? 1 : now < before ? -1 : 0;
}

/**
 * The values of today and yesterday. health: rows of healthDays; today: the local day.
 * → { rows: [{ key, now, before, dir, kind }], any } — kind 'score' or 'efficiency' for the sleep score
 */
export function bodyToday(health = [], today) {
  const by = new Map((health ?? []).filter((r) => r?.date).map((r) => [r.date, r]));
  const a = by.get(today) ?? null;
  const b = by.get(addDays(today, -1)) ?? null;
  const rows = BODY_KEYS.map((key) => {
    const now = valueOf(a, key);
    const before = valueOf(b, key);
    const row = { key, now, before, dir: dirOf(now, before), last: now == null ? lastOf(by, key, today) : null };
    // the banner (Noah 23.11.2026): the usual value, a quiet mark when far from it, and when Fitbit delivered the day
    row.usual = usualOf(health, key, today);
    row.off = offOf(row.last ? row.last.value : now, row.usual);
    row.fetched = fetchedOf((now != null ? a : by.get(row.last?.day))?.at, today);
    if (key === 'score') row.kind = num(a?.sleep?.score) != null || (now == null && num(b?.sleep?.score) != null) ? 'score' : 'efficiency';
    // the efficiency is shown with a %, Fitbit's own score without: the kind follows the day that is shown
    if (key === 'score' && row.last) row.kind = num(by.get(row.last.day)?.sleep?.score) != null ? 'score' : 'efficiency';
    return row;
  });
  return { rows, any: rows.some((r) => r.now != null || r.before != null) };
}

/** How far back a value still stands in for today's (Noah 7.11.2026 «1a»). */
export const LAST_DAYS = 7;

/**
 * Noah 7.11.2026 «1a»: a value without a reading today shows the last one of the last 7 days, with its day,
 * never an empty dash. → { value, day } or null (nothing in 7 days)
 */
function lastOf(by, key, today) {
  for (let i = 1; i <= LAST_DAYS; i++) {
    const day = addDays(today, -i);
    const value = valueOf(by.get(day), key);
    if (value != null) return { value, day };
  }
  return null;
}

const mean = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/**
 * «Neuer Schwung» Blatt von unten (Noah 27.10.2026 «a»): the sheet behind «Dein Körper heute» on a phone.
 * Per value: today (or the last day with a value in the last 7 days), where it stands in the range of the
 * last 28 days (0–1, for the ring; null without a range), and the mean of the last 7 days next to the 7 before.
 * health: rows of healthDays; today: the local day.
 * → { rows: [{ key, now, day, min, max, share, week, prev, dir, kind }], any }
 */
export function bodyWeek(health = [], today) {
  const by = new Map((health ?? []).filter((r) => r?.date).map((r) => [r.date, r]));
  const days = (from, n) => Array.from({ length: n }, (_, i) => addDays(today, -(from + i)));
  const vals = (key, list) => list.map((d) => valueOf(by.get(d), key)).filter((x) => x != null);
  const rows = BODY_KEYS.map((key) => {
    const last = days(0, 7).find((d) => valueOf(by.get(d), key) != null) ?? null;
    const now = last ? valueOf(by.get(last), key) : null;
    const range = vals(key, days(0, 28));
    const min = range.length ? Math.min(...range) : null;
    const max = range.length ? Math.max(...range) : null;
    const share = now == null || min == null ? null : max === min ? 1 : (now - min) / (max - min);
    const week = mean(vals(key, days(0, 7)));
    const prev = mean(vals(key, days(7, 7)));
    const row = { key, now, day: last, min, max, share, week, prev, dir: dirOf(week, prev) };
    if (key === 'score') row.kind = last && num(by.get(last)?.sleep?.score) != null ? 'score' : 'efficiency';
    return row;
  });
  return { rows, any: rows.some((r) => r.now != null || r.week != null || r.prev != null) };
}
