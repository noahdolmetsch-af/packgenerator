/**
 * Paket Y extra 6 «Prognose gegen Wirklichkeit» (Noah 20.10.2026 «1-8 alle»): what the forecast said for a
 * day (kept the day before, at home) against what came (the hours of yesterday that the next answer brings).
 * Kept on this device in db.meta 'wx-said' for 14 days. Pure functions. Tested in tests/wetter-kern.test.js.
 */
import { dayLine, hoursBetween, atLocal, localDate } from './kern.js';

export const SAID_KEY = 'wx-said';
export const KEEP = 14;

/** The day line of a date in a core answer. */
export const lineOn = (core, date) => dayLine(hoursBetween(core, atLocal(date, 0, core.offset ?? 0), atLocal(date, 24, core.offset ?? 0)));

/**
 * After a new answer: keep what it says for tomorrow (once; the first saying counts) and fill in what came
 * for yesterday. said: { [date]: { said: line, had: line | null } } → the new map (at most KEEP days).
 */
export function noteSaid(said = {}, core, now = Date.now()) {
  if (!core?.hours?.length) return said;
  const off = core.offset ?? 0;
  const today = localDate(now, off);
  const tomorrow = localDate(Date.parse(`${today}T12:00:00Z`) + 864e5, 0);
  const yesterday = localDate(Date.parse(`${today}T12:00:00Z`) - 864e5, 0);
  const out = { ...said };
  if (!out[tomorrow]) {
    const l = lineOn(core, tomorrow);
    if (l) out[tomorrow] = { said: l, had: null };
  }
  if (out[yesterday] && !out[yesterday].had) {
    const l = lineOn(core, yesterday);
    if (l) out[yesterday] = { ...out[yesterday], had: l };
  }
  const keep = Object.keys(out).sort().slice(-KEEP);
  return Object.fromEntries(keep.map((k) => [k, out[k]]));
}

/** The compared days, newest first: [{ date, said, had, dT (had − said high), rainHit (bool) }]. */
export function hits(said = {}) {
  return Object.entries(said)
    .filter(([, v]) => v?.said && v?.had)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, v]) => ({ date, said: v.said, had: v.had, dT: v.had.tmax - v.said.tmax, rainHit: (v.said.rainMm >= 1) === (v.had.rainMm >= 1) }));
}
