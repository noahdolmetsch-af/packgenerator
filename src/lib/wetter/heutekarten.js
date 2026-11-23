/**
 * «Wetter oben» W2 (Noah 23.11.2026 «b»): three small cards under the weather card on Today, made from the weather answer
 * the app already keeps (kern.js). Pure functions, tested in tests/heutekarten.test.js.
 *  - weekBest: the best day to ride in the next 7 days («Wetter der Woche»)
 *  - afterRain: it rained in the last 24 hours, so the chain wants oil («Nach dem Regen: Kette ölen»)
 *  - rideWindow: how long it stays dry today and how long the light lasts («Fahrfenster»)
 */
import { bestWindows, costWord, hoursBetween, localDate, wet } from './kern.js';
import { lightDay } from './licht.js';

/** Rain in the last 24 hours (mm) from which the chain wants oil. */
export const RAIN_MM_CHAIN = 1;
/** A dry stretch shorter than this (minutes) is no window. */
export const MIN_WINDOW_MIN = 45;

/** The best day of the next 7 for a ride of 2 hours: { date, day: 'today' | 'tomorrow' | null, start, end, tmin, tmax, rainMm, word } or null. */
export function weekBest(core, now = Date.now()) {
  const best = bestWindows(core, { durH: 2, days: 7, now }).best;
  if (!best || !best.line) return null;
  const off = core.offset ?? 0;
  const today = localDate(now, off);
  const tomorrow = localDate(now + 24 * 36e5, off);
  return {
    date: best.date,
    day: best.date === today ? 'today' : best.date === tomorrow ? 'tomorrow' : null,
    start: best.start,
    end: best.end,
    tmin: best.line.tmin,
    tmax: best.line.tmax,
    rainMm: best.line.rainMm,
    word: costWord(best.cost),
  };
}

/** Rain of the last 24 hours: { mm, lastMs } or null when it stayed dry (or the answer has no past hours). */
export function afterRain(core, now = Date.now()) {
  const past = hoursBetween(core, now - 24 * 36e5, now);
  if (past.length < 6) return null;
  const rainy = past.filter((h) => typeof h.rainMm === 'number' && h.rainMm >= 0.1);
  const mm = Math.round(rainy.reduce((s, h) => s + h.rainMm, 0) * 10) / 10;
  if (mm < RAIN_MM_CHAIN) return null;
  return { mm, lastMs: rainy.at(-1).ms };
}

/**
 * The window for a ride today: from now until the first wet hour or until sunset. → { until (ms), by: 'rain' | 'dark',
 * set (ms), lampOn (ms) } or null (it rains now, the sun has set, or the dry stretch is shorter than MIN_WINDOW_MIN).
 */
export function rideWindow(core, now = Date.now()) {
  const light = lightDay(core, localDate(now, core?.offset ?? 0));
  if (!light || now >= light.set) return null;
  const hs = hoursBetween(core, now - 36e5 + 1, light.set);
  if (!hs.length || wet(hs[0])) return null;
  const rain = hs.find(wet);
  const until = rain ? rain.ms : light.set;
  if (until - now < MIN_WINDOW_MIN * 6e4) return null;
  return { until, by: rain ? 'rain' : 'dark', set: light.set, lampOn: light.lampOn };
}
