/**
 * «Passt zu dir» of the tour suggestions (Noah 23.11.2026 «alles umsetzen»): what fits YOU today, from what the app already knows.
 * Only suggestions: every line can be switched off and the filter «Doable today» starts switched off.
 *
 * - Form today: the one answer of «Form und Erholung» (rest, easy, normal, hard; flow/form/tagesantwort.js). Rest: «better rest today»;
 *   easy: a long or steep tour is a warning; normal and hard: fine (a very long one only on «hard»).
 * - Free time: the free window today, from now (or the earliest start) to the next appointment (your Google calendar and your own
 *   dates in Mein Tag) or to sunset. The tour needs the ride at your own pace plus the journey (anreise.js).
 * - Bike: «Mountain bike» is what the tours need; with bikes but no mountain bike the line says so (never a block).
 * Pure functions, tested in tests/vorschlaege.test.js. The data is read by pages/Vorschlaege.svelte.
 */
import { localDate, atLocal } from '../wetter/kern.js';
import { busySpans, ownBusy } from '../freiezeit/slots.js';
import { kindOf } from '../bikekind.js';
import { activeBikes } from '../bikeretire.js';
import { hoursOf } from './regeln.js';
import { anreiseOf, dayHours } from './anreise.js';

/** The earliest start of a ride today (local hour) and the latest end without a sunset in the data. */
export const EARLIEST_H = 7;
export const LATEST_H = 17;
/** A start takes this many minutes from now (to get ready). */
export const READY_MIN = 30;
/** A tour above this many hours or metres of climb is too much for an «easy» day. */
export const EASY_MAX_H = 3;
export const EASY_MAX_UP = 1200;
/** Above this many hours a tour is a warning on a «normal» day. */
export const NORMAL_MAX_H = 7;

/**
 * The free window today: { start, end, hours, until: 'sunset' | 'date' | 'late' } or null without weather data (no place).
 * core: the weather core (offset, days with sunset); events: the Google calendar rows; items: your own dates (week.items).
 */
export function freeToday(core, events = [], items = [], now = Date.now()) {
  if (!core) return null;
  const off = core.offset ?? 0;
  const date = localDate(now, off);
  const sun = core.days?.find((d) => d.date === date) ?? null;
  let start = Math.max(now + READY_MIN * 6e4, atLocal(date, EARLIEST_H, off));
  let end = sun?.set ?? atLocal(date, LATEST_H, off);
  let until = sun?.set ? 'sunset' : 'late';
  const busy = [...busySpans(events), ...ownBusy(items, off)].sort((a, b) => a[0] - b[0]);
  for (const [a, b] of busy) {
    if (b <= start) continue;
    if (a <= start) {
      start = b; // an appointment covers the start: the window begins after it
      continue;
    }
    if (a < end) {
      end = a;
      until = 'date';
    }
    break;
  }
  return { start, end, hours: Math.max(0, (end - start) / 36e5), until };
}

/** How the form of today meets a tour: { tone: 'ok' | 'warn', key: 'rest' | 'easy' | 'long' | 'fit' } or null without a form answer. */
export function formFit(t, level, pace = null) {
  if (!level) return null;
  const h = hoursOf(t, pace);
  if (level === 'rest') return { tone: 'warn', key: 'rest' };
  if (level === 'easy' && (h > EASY_MAX_H || (t.up ?? 0) > EASY_MAX_UP)) return { tone: 'warn', key: 'easy' };
  if (level === 'normal' && h > NORMAL_MAX_H) return { tone: 'warn', key: 'long' };
  return { tone: 'ok', key: 'fit' };
}

/** The free window against the tour with its journey: { tone, ride, day, free } (hours) or null without a window. */
export function freeFit(t, win, { pace = null, home = null, mode = 'pt' } = {}) {
  if (!win) return null;
  const ride = hoursOf(t, pace);
  const day = dayHours(ride, anreiseOf(t, home, mode));
  return { tone: day <= win.hours + 1e-9 ? 'ok' : 'warn', ride, day, free: win.hours, until: win.end, why: win.until };
}

/** The bike: { tone, key: 'mtb' | 'nomtb' } from the bikes (retired ones do not count); null without bikes. */
export function bikeFit(bikes = []) {
  const act = activeBikes(bikes);
  if (!act.length) return null;
  return act.some((b) => kindOf(b) === 'mtb') ? { tone: 'ok', key: 'mtb' } : { tone: 'warn', key: 'nomtb' };
}

/** Doable today: the form does not say rest, and, with a free window, the whole day fits into it. */
export function doableToday(t, { level = null, win = null, pace = null, home = null, mode = 'pt' } = {}) {
  if (level === 'rest') return false;
  const f = freeFit(t, win, { pace, home, mode });
  return !f || f.tone === 'ok';
}
