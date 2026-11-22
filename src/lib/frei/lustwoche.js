/**
 * «Worauf hab ich Lust?» + your week (Noah 05.11.2026 «Touren 2a und b»): the weather of the next hours at
 * the home place and the free minutes before the next appointment, taken from the same copies as the card
 * «Free time and good weather» (weather core, db.gEvents). Pure functions, tested in tests/frei.test.js.
 */
import { hoursBetween, wet, thundery } from '../wetter/kern.js';
import { busySpans } from '../freiezeit/slots.js';
import { TIMES } from '../frei.js';

export const WEEK_CAP = 240; // minutes: beyond four hours «free» just means «no limit»
export const AHEAD_H = 3;

/** Minutes from `now` until the next busy appointment (0 when one is on now), at most WEEK_CAP. */
export function freeMinutes(events = [], now = Date.now(), cap = WEEK_CAP) {
  const spans = busySpans(events);
  if (spans.some(([a, b]) => a <= now && b > now)) return 0;
  const next = Math.min(...spans.filter(([a]) => a > now).map(([a]) => a), Infinity);
  return next === Infinity ? cap : Math.min(cap, Math.floor((next - now) / 6e4));
}
/** The biggest «time I have» chip that fits into the free minutes; null under 15 minutes. */
export const timeChoice = (minutes) => [...TIMES].reverse().find((m) => m <= minutes) ?? null;
/** 'good' (dry), 'bad' (rain or thunder) in the next hours, or null without a forecast. */
export function weatherAhead(core, now = Date.now(), hours = AHEAD_H) {
  const hs = hoursBetween(core, now - 36e5 + 1, now + hours * 36e5);
  if (!hs.length) return null;
  return hs.some((h) => wet(h) || thundery(h)) ? 'bad' : 'good';
}
