/**
 * «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): «Dein Körper heute» on top of Heute. Four values of the Fitbit
 * days (healthDays, health.js), today next to yesterday: resting pulse, sleep in hours, the sleep score and the
 * active zone minutes. Observation only: an arrow says up or down, never good or bad.
 * The sleep score: Fitbit's own score when a day carries one (sleep.score), else the sleep efficiency
 * (time asleep of the time in bed, sleep.efficiency), which the Google interface delivers.
 * Pure functions, tested in tests/body.test.js.
 */
import { addDays } from '../health.js';

/** The four values, in their order on Heute. */
export const BODY_KEYS = ['pulse', 'sleep', 'score', 'azm'];

const num = (x) => (Number.isFinite(Number(x)) && x !== null && x !== '' ? Number(x) : null);

/** One value of a day row. → number or null */
export function valueOf(row, key) {
  if (!row) return null;
  if (key === 'pulse') return num(row.restingHr);
  if (key === 'sleep') return num(row.sleep?.asleepMin) > 0 ? Math.round((row.sleep.asleepMin / 60) * 10) / 10 : null;
  if (key === 'score') return num(row.sleep?.score) ?? num(row.sleep?.efficiency);
  if (key === 'azm') return num(row.azm);
  return null;
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
    const row = { key, now, before, dir: dirOf(now, before) };
    if (key === 'score') row.kind = num(a?.sleep?.score) != null || (now == null && num(b?.sleep?.score) != null) ? 'score' : 'efficiency';
    return row;
  });
  return { rows, any: rows.some((r) => r.now != null || r.before != null) };
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
