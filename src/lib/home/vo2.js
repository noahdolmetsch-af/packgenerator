/**
 * «VO2max auf Heute» (Noah 28.10.2026 «2 a und b»): the last VO2max of the health days (healthDays.vo2max, from
 * Fitbit or the Apple Health export) and the value about four weeks before it, only to look at. A value older
 * than 90 days counts as none: the tile stays away until a new one comes. Pure, tested in tests/vo2.test.js.
 */
import { addDays } from '../health.js';

export const VO2_DAYS = 90; // the oldest value the tile still shows
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const one = (v) => Math.round(v * 10) / 10;

/**
 * health: healthDays rows { date, vo2max? }; today: the local day.
 * → null without a value in the last 90 days, else { v, day, before: { v, day } | null, diff | null }
 * before: the last value on or before 28 days ahead of `day` (within the 90 days before it).
 */
export function vo2Of(health = [], today) {
  const rows = (health ?? []).filter((r) => r?.date && r.date <= today && fin(r.vo2max) != null).sort((a, b) => b.date.localeCompare(a.date));
  const last = rows[0];
  if (!last || last.date < addDays(today, -VO2_DAYS)) return null;
  const edge = addDays(last.date, -28);
  const prev = rows.find((r) => r.date <= edge && r.date >= addDays(last.date, -VO2_DAYS));
  const v = one(last.vo2max);
  const before = prev ? { v: one(prev.vo2max), day: prev.date } : null;
  return { v, day: last.date, before, diff: before ? one(v - before.v) : null };
}
