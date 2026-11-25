/**
 * «Wann schaffe ich meine 90 Minuten?» (Noah 25.11.2026 «1-3», Idee 1): for a day of «Mein Tag», the best window for the daily
 * goal of the challenge «Draussen»: free in your calendar and your own dates, dry, before sunset. One suggestion, never a block.
 * Pure rules; the page is src/pages/Tag.svelte (a dashed block in the timeline with «Plan it»).
 *
 * - need: the minutes still missing (today: goal minus what is done, other days: the whole goal), rounded up to 15 minutes.
 * - The window starts at the earliest at 07:00 (today: in 30 minutes), ends at the latest at 21:00 or at sunset, on a quarter hour.
 * - Dry: no hour of the window is wet or thundery; the mean «cost» of the weather core (wetter/kern.js hourCost) stays below MAX_COST.
 * - The cheapest window wins, the earlier one when they are alike. Without a full window: the longest dry free stretch (`short`).
 */
import { atLocal, hourCost, localDate, thundery, wet } from '../wetter/kern.js';
import { busySpans, ownBusy } from '../freiezeit/slots.js';

export const STEP_MIN = 15;
export const EARLIEST_H = 7;
export const LATEST_H = 21;
export const READY_MIN = 30;
export const MAX_COST = 4;
/** The ref of an own date made from a suggestion: the page does not suggest a second window for that day. */
export const planRef = (day) => `outdoor:${day}`;

const up = (n, step) => Math.ceil(n / step) * step;
const round1 = (n) => Math.round(n * 10) / 10;

/** Minutes still to go on `day`: the whole goal on a later day, goal minus done today; 0 when nothing is missing. */
export const needOf = (goalMin, doneMin, day, today) => Math.max(0, Math.round(Number(goalMin) || 0) - (day === today ? Math.round(Number(doneMin) || 0) : 0));

/**
 * `busy` is a list of more [start, end] spans (ms), the timed entries of the day. → { start, end, mins, cost, temp } (ms) for a window that fits, { short: { start, end, mins } } for the longest stretch when none does,
 *   null when the weather does not reach the day or no time is left.
 */
export function outdoorWindow(core, { events = [], items = [], busy: extra = [], need = 90, day, now = Date.now() } = {}) {
  if (!core?.hours?.length || !day || need < STEP_MIN) return null;
  const off = core.offset ?? 0;
  if (!core.hours.some((h) => localDate(h.ms, off) === day)) return null;
  const mins = up(need, STEP_MIN);
  const sun = core.days?.find((d) => d.date === day) ?? null;
  const lo = atLocal(day, EARLIEST_H, off);
  const hi = Math.min(atLocal(day, LATEST_H, off), sun?.set ?? Infinity);
  const begin = Math.max(lo, up(now + READY_MIN * 6e4, STEP_MIN * 6e4));
  const busy = [...extra, ...busySpans(events), ...ownBusy(items.filter((x) => !String(x.ref ?? '').startsWith('outdoor:')), off)];
  const hourAt = (s, e) => core.hours.filter((h) => h.ms < e && h.ms + 36e5 > s);
  const okSpan = (s, e) => {
    if (busy.some(([a, b]) => a < e && b > s)) return null;
    const hs = hourAt(s, e);
    if (!hs.length || hs.some((h) => wet(h) || thundery(h))) return null;
    const cost = hs.reduce((n, h) => n + hourCost(h, sun), 0) / hs.length;
    if (cost >= MAX_COST) return null;
    const temps = hs.map((h) => h.temp).filter(Number.isFinite);
    return { cost: round1(cost), temp: temps.length ? Math.round(temps.reduce((n, x) => n + x, 0) / temps.length) : null };
  };
  let best = null;
  for (let s = begin; s + mins * 6e4 <= hi; s += STEP_MIN * 6e4) {
    const r = okSpan(s, s + mins * 6e4);
    if (r && (!best || r.cost < best.cost - 0.05)) best = { start: s, end: s + mins * 6e4, mins, ...r };
  }
  if (best) return best;
  // no full window: the longest stretch that is free and dry
  let short = null;
  for (let s = begin; s + STEP_MIN * 6e4 <= hi; s += STEP_MIN * 6e4) {
    let e = s;
    while (e + STEP_MIN * 6e4 <= hi && okSpan(s, e + STEP_MIN * 6e4)) e += STEP_MIN * 6e4;
    if (e > s && (!short || e - s > short.end - short.start)) short = { start: s, end: e, mins: Math.round((e - s) / 6e4) };
  }
  return short && short.mins >= 30 ? { short } : { short: null };
}
