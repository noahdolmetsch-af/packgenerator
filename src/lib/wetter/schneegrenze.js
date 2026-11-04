/**
 * «Schneefallgrenze» (Noah 04.11.2026 «1b 2a 3a 4a 5a»): the snow line in metres above sea level, every day
 * on the weather page and on Heute. No new request: the weather core (kern.js) keeps Open-Meteo's own
 * `snowfall_height` (where a model has it) and the freezing level for every hour.
 *
 * - lineOf: the snow line of one hour. Open-Meteo's own value when it has one («1b»), else the freezing
 *   level minus 300 m (the rule of thumb of the map and the ski tours, «wenn nicht verfügbar wird a angezeigt»).
 *   Rounded to 100 m: it is a forecast, not a measurement.
 * - lineNow, lineRange, lineSlots: the line now, its low and high over the day (6–21 h) and at six times.
 * - lowHint (4a): the line is down to your own height (the height of the place, or the one you set).
 *
 * Everything is a suggestion and switchable: settings 'snowOwnM' (own height, empty = the place) and
 * 'snowHome' (false = no line on Heute). Pure functions, tested in tests/schneegrenze.test.js.
 */
import { hoursBetween, localDate, localHour, atLocal } from './kern.js';

/** How far below the freezing level snow still falls (the same rule as map/wx.js and kern.js snowOnRoute). */
export const BELOW_FREEZING_M = 300;
export const STEP_M = 100;
export const SLOTS = [6, 9, 12, 15, 18, 21];
export const OWN_KEY = 'snowOwnM';
export const HOME_KEY = 'snowHome';

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (m) => Math.max(0, Math.round(m / STEP_M) * STEP_M);

/** One hour → { m, own } (own: Open-Meteo's value, else the rule of thumb) or null without any value. */
export function lineOf(h) {
  if (fin(h?.snowH)) return { m: round(h.snowH), own: true };
  if (fin(h?.frz)) return { m: round(h.frz - BELOW_FREEZING_M), own: false };
  return null;
}

/** The line in the hour that holds `now` → { m, own } or null. */
export function lineNow(core, now = Date.now()) {
  const h = (core?.hours ?? []).find((x) => x.ms <= now && now < x.ms + 36e5);
  return lineOf(h);
}

/** Today's hours of the day (6–21 h at the place). */
const dayHours = (core, now) => {
  const off = core?.offset ?? 0;
  const d = localDate(now, off);
  return hoursBetween(core, atLocal(d, 6, off), atLocal(d, 22, off));
};

/** The low and the high line of today's day (6–21 h) → { min, max, own } or null. */
export function lineRange(core, now = Date.now()) {
  const ls = dayHours(core, now).map(lineOf).filter(Boolean);
  if (!ls.length) return null;
  const ms = ls.map((l) => l.m);
  return { min: Math.min(...ms), max: Math.max(...ms), own: ls.every((l) => l.own) };
}

/** The line at 6, 9, 12, 15, 18 and 21 h today → [{ hour, m }] (an hour without a value is left out). */
export function lineSlots(core, now = Date.now()) {
  return dayHours(core, now)
    .filter((h) => SLOTS.includes(localHour(h.ms, core?.offset ?? 0)))
    .map((h) => ({ hour: localHour(h.ms, core?.offset ?? 0), line: lineOf(h) }))
    .filter((s) => s.line)
    .map((s) => ({ hour: s.hour, m: s.line.m, own: s.line.own }));
}

/** True when every shown value is only the rule of thumb (so the note says «about 300 m below the freezing level»). */
export const allApprox = (items) => items.length > 0 && items.every((x) => x.own === false);

/** The height that counts as «yours»: the one you set, else the height of the place. */
export const ownHeight = (core, set) => (fin(set) && set >= 0 ? Math.round(set) : fin(core?.elev) ? Math.round(core.elev) : null);

/**
 * 4a: the line (the lowest one from now to the end of the day) is down to your height (one step of 100 m
 * above it still counts: the line is rounded). → { m, ownM } or null. A hint, never a warning of danger.
 */
export function lowHint(core, now = Date.now(), ownM = null) {
  if (!fin(ownM)) return null;
  const off = core?.offset ?? 0;
  const ls = hoursBetween(core, now - 36e5 + 1, atLocal(localDate(now, off), 24, off)).map(lineOf).filter(Boolean);
  if (!ls.length) return null;
  const m = Math.min(...ls.map((l) => l.m));
  return m <= ownM + STEP_M ? { m, ownM } : null;
}
