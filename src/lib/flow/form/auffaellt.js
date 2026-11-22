/**
 * «Was auffällt» (Noah 21.11.2026, Klügere Auswertungen K3): the resting pulse of the last days against your normal.
 * Rule: the mean of the last 3 days with a value (at least 2) lies at least `delta` beats (usual 3, changeable) above the middle of the
 * 28 values before (marked days skipped). Marked days (K1) count neither into the normal nor as a trigger. The result is only an observation and a question
 * («Set a marker?»): never a cause, never «trained too much», no advice. Always «Tendency», because a few days are no proof.
 * Pure; tests/form-auffaellt.test.js.
 */
import { addDays } from '../../health.js';

export const SETTINGS_KEY = 'training.auffaellt';
export const DEFAULTS = { delta: 3 };
/** Values that make the normal (the newest 28 days with a value, unmarked). */
export const BASE_DAYS = 28;
/** How far back the normal may look to find them. */
export const MAX_LOOK = 120;
/** At least so many days with a value for the normal. */
export const MIN_BASE = 14;
/** The days looked at. */
export const RECENT = 3;
export const MIN_RECENT = 2;
/** The newest value may be at most this many days old. */
export const MAX_AGE = 3;

export function cleanSettings(v) {
  const d = v?.delta;
  return { delta: Number.isFinite(d) && d >= 1 && d <= 10 ? Math.round(d) : DEFAULTS.delta };
}

const median = (list) => {
  const v = list.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/**
 * table: Map day → { rhr }; marked: Set of days; today: YYYY-MM-DD.
 * → { state: 'up' | 'none' | 'marked' | 'few' | 'old', normal?, mean?, above?, n?, from?, to? }
 *   up: stands out (n days in a row, `above` beats over the normal, from..to the days); none: nothing stands out;
 *   marked: the newest day carries a marker, nothing is judged; few: too few values; old: no value in the last days.
 */
export function restingAlert({ table, today, marked = new Set(), settings = DEFAULTS }) {
  const { delta } = cleanSettings(settings);
  const rhr = (d) => {
    const v = table?.get(d)?.rhr;
    return Number.isFinite(v) ? v : null;
  };
  let end = null;
  for (let i = 0; i <= MAX_AGE; i++) {
    const d = addDays(today, -i);
    if (rhr(d) != null) {
      end = d;
      break;
    }
  }
  if (!end) return { state: 'old' };
  if (marked.has(end)) return { state: 'marked', to: end };
  const recent = Array.from({ length: RECENT }, (_, i) => addDays(end, -i)).filter((d) => rhr(d) != null && !marked.has(d));
  // the normal: the newest 28 days with a value before the last 3, marked days skipped (looking further back, up to MAX_LOOK days)
  const base = [];
  for (let i = 0; i < MAX_LOOK && base.length < BASE_DAYS; i++) {
    const d = addDays(end, -RECENT - i);
    if (rhr(d) != null && !marked.has(d)) base.push(rhr(d));
  }
  if (recent.length < MIN_RECENT || base.length < MIN_BASE) return { state: 'few' };
  const normal = median(base);
  const mean = recent.reduce((s, d) => s + rhr(d), 0) / recent.length;
  const diff = mean - normal;
  if (diff < delta) return { state: 'none', normal, mean };
  // «since N days»: the days in a row up to the newest that lie at least half the limit above the normal
  let n = 0;
  for (let d = end; rhr(d) != null && !marked.has(d) && rhr(d) >= normal + delta / 2 && n < 60; d = addDays(d, -1)) n++;
  return { state: 'up', normal, mean, above: Math.round(diff), n: Math.max(n, 1), from: addDays(end, -(Math.max(n, 1) - 1)), to: end };
}
