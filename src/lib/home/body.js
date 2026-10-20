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
