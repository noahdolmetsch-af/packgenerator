/**
 * «Freie Zeit plus gutes Wetter gibt einen Vorschlag» (idea A3, Noah 27.10.2026 «alle umsetzen 1a 2a 3a 4a 5a»):
 * the next free window in your Google calendar (the copy on this device, db.gEvents) where the weather at
 * your home place is good for a ride. → «Thursday 17:00–19:00 free and dry: a round of about 40 km?»
 *
 * - The window: RIDE_H hours (the own value, standard 2) between `earliest` and `latest` local hours, in the
 *   next DAYS days, starting at the earliest in 30 minutes; never over a busy appointment (all-day ones and
 *   ones marked «free» in Google do not block).
 * - Good weather: every hour dry, no thunderstorm, the mean «cost» of the weather core (wetter/kern.js
 *   hourCost) below GOOD (the word «Good» of the core).
 * - The nearest good window wins; a later one only when clearly better (like kern.js bestWindows).
 * - km: the hours × your own speed (pace.js), else the standard speed; rounded to 5 km.
 * - «Not now» hides that one window (setting HIDE_KEY, the start times, the newest 20).
 * Everything is a suggestion. Pure functions, tested in tests/freiezeit.test.js.
 */
import { hoursBetween, hourCost, wet, thundery, atLocal, localDate } from '../wetter/kern.js';

export const HIDE_KEY = 'freiezeit.hide';
export const DAYS = 3;
export const RIDE_H = 2;
export const GOOD = 1.5;
export const EARLIEST = 7;
export const LATEST = 21;

const fin = Number.isFinite;

/** The busy spans (ms) of the appointments: not all-day, not marked free. */
export function busySpans(events = []) {
  const out = [];
  for (const e of events) {
    if (!e || e.allDay || e.busy === false) continue;
    const s = Date.parse(String(e.start ?? ''));
    const en = Date.parse(String(e.end ?? e.start ?? ''));
    if (fin(s) && fin(en) && en > s) out.push([s, en]);
  }
  return out;
}

/**
 * The next free and good window. core: the weather core (hours, days, offset); events: db.gEvents rows;
 * opts: { now, durH, kmh, hidden: [start ms] }. → { date, start, end, cost, km } or null.
 */
export function freeSlot(core, events = [], { now = Date.now(), durH = RIDE_H, kmh = 16, hidden = [], days = DAYS, earliest = EARLIEST, latest = LATEST } = {}) {
  if (!core?.hours?.length) return null;
  const off = core.offset ?? 0;
  const dur = Math.max(1, Math.min(8, Math.round(durH)));
  const busy = busySpans(events);
  const hide = new Set(hidden);
  const first = localDate(now, off);
  const found = [];
  for (let n = 0; n < days; n++) {
    const date = localDate(Date.parse(`${first}T12:00:00Z`) + n * 864e5, 0);
    const sun = core.days?.find((d) => d.date === date) ?? null;
    let best = null;
    for (let s = earliest; s + dur <= latest; s++) {
      const start = atLocal(date, s, off);
      const end = start + dur * 36e5;
      if (start < now + 30 * 6e4 || hide.has(start)) continue;
      if (busy.some(([a, b]) => a < end && b > start)) continue;
      const hs = hoursBetween(core, start, end);
      if (hs.length < dur || hs.some((h) => wet(h) || thundery(h))) continue;
      const cost = Math.round((hs.reduce((sum, h) => sum + hourCost(h, sun), 0) / dur) * 10) / 10;
      if (cost >= GOOD) continue;
      if (!best || cost < best.cost) best = { date, start, end, cost };
    }
    if (best) found.push({ ...best, n });
  }
  // a later day must be clearly better to win (0.5 per day further away)
  const pick = found.reduce((a, b) => (!a || b.cost + b.n * 0.5 < a.cost + a.n * 0.5 ? b : a), null);
  if (!pick) return null;
  const km = Math.max(5, Math.round((dur * (fin(kmh) && kmh > 0 ? kmh : 16)) / 5) * 5);
  return { date: pick.date, start: pick.start, end: pick.end, cost: pick.cost, km };
}

/** «Not now»: the window's start is kept so it does not come again (the newest 20). */
export const hideSlot = (hidden = [], start) => [...(Array.isArray(hidden) ? hidden : []).filter((x) => x !== start), start].slice(-20);
