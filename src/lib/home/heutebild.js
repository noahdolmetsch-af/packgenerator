/**
 * «Paket G» (Noah 03.11.2026 «a»): the drawn landscape at the top of Today, with the next trip and its countdown.
 * The rules are pure and tested in tests/heutebild.test.js; HeuteBild.svelte only draws.
 *
 * - bildOf: what the picture says about a trip on a day: { kind, n, m }, or null (no date, or the trip is over).
 * - moodOf: the colours of the sky: 'morning' | 'day' | 'evening' | 'night' by the one day clock (dayclock.js),
 *   'rain' when the weather line of Today expects rain (never at night, the night sky stays).
 */
import { countdownOf } from '../touren/tourstep.js';
import { partOfDay } from '../dayclock.js';

/**
 * kind: 'days' (n days to go), 'tomorrow', 'today' (a one-day trip today), 'under' (day n of m).
 * The days come from countdownOf, the one source of every countdown in the app.
 */
export function bildOf(trip, today) {
  const c = countdownOf(trip, today, { byDate: true });
  if (!c) return null;
  if (c.key === 'In {n} days|tour') return { kind: 'days', n: c.vars.n, m: 1 };
  if (c.key === 'Tomorrow|tour') return { kind: 'tomorrow', n: 1, m: 1 };
  if (c.key === 'Today|tour') return { kind: 'today', n: 1, m: 1 };
  if (c.key === 'Day {n} of {m}|tour') return { kind: 'under', n: c.vars.n, m: c.vars.m };
  return null; // no date yet, or over
}

/** The sky: the part of the day (hour 0–23), rain when `wet` and not night. */
export function moodOf(hour, wet = false) {
  const part = partOfDay(hour);
  if (part === 'night') return 'night';
  return wet ? 'rain' : part;
}
