/**
 * SN6+ «SN6 plus» (mockups SN6p-funktionen and SN6p-so-gehts, Noah 13.10.2026 «freigabe SN6p», answers
 * 1b 2b 3b 4a 5b): more on «What the app can do» (Features.svelte), as pure functions:
 * - K1 progress: «15 of 91 used · 2 more than a month ago» (a small day-by-day record of the count);
 * - K2 «Your top 5»: the functions you opened most since the start (the counts of wasneu.js, this device);
 * - K3 «Fits right now»: tips from the situation (a trip soon, an avalanche bulletin before a ski tour,
 *   chain care due, a trip waiting for its debrief, the playground never tried);
 * - K6 «New since your last visit»: the functions newer than the version of the PREVIOUS app opening
 *   (answer 5b: the app, not the page), replacing «New for you» (answer 1b);
 * - the order of the blocks (answer 3b).
 * Everything is a suggestion; without data each block says so in one quiet line. Tested in tests/sn6plus.test.js.
 */
import { WHATS_NEW } from '../whatsnew.js';
import { rowsOf, sortRows, newSince, daysBetween } from './wasneu.js';
import { toDebrief, nextTrip } from '../debrief.js';
import { quickHints } from '../quickcare.js';

/** SN6+ answer 3b: the blocks of the page from the top (the six cards last). */
export const BLOCKS = ['progress', 'fits', 'top', 'search', 'news', 'groups'];

/* ---------- K1 progress ---------- */

/** Keep the day records this many days (enough to look a month back). */
export const KEEP_DAYS = 62;
/** «More than a month ago»: the newest record at least this many days old. */
export const MONTH_DAYS = 30;

/** A stored list made safe: [{ at: 'YYYY-MM-DD', n }], oldest first. */
export function snapsOf(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(x.at) && Number.isInteger(x.n) && x.n >= 0)
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** Today's count into the records (one per day, the last of the day wins), old ones dropped. */
export function addSnap(value, n, today) {
  const keep = snapsOf(value).filter((x) => x.at !== today && daysBetween(x.at, today) <= KEEP_DAYS);
  return [...keep, { at: today, n }];
}

/** How many more are used than a month ago, or null when there is no record that old. */
export function moreThanMonth(value, n, today) {
  const old = snapsOf(value).filter((x) => daysBetween(x.at, today) >= MONTH_DAYS).at(-1);
  return old ? n - old.n : null;
}

/** The share of a bar in % (0 … 100). */
export const share = (n, total) => (total > 0 ? Math.round((Math.min(n, total) / total) * 100) : 0);

/* ---------- K2 «Your top 5» ---------- */

/** The 5 functions opened most since the start (answer 2b), most first: rows of wasneu.js with n. */
export const topFive = (uses = {}, used = new Set()) => sortRows(rowsOf(used, uses), 'top').slice(0, 5);

/* ---------- K6 «New since your last visit» ---------- */

/** The stored openings made safe: { last, prev } each { at (ISO time), v (version) } or null. */
export function opensOf(value) {
  const one = (x) => (x && typeof x.at === 'string' && !Number.isNaN(Date.parse(x.at)) ? { at: x.at, v: typeof x.v === 'string' ? x.v : null } : null);
  const v = value && typeof value === 'object' ? value : {};
  return { last: one(v.last), prev: one(v.prev) };
}

/** One more opening of the app: the last one becomes the previous one. */
export const openApp = (value, at, v) => ({ prev: opensOf(value).last, last: { at, v } });

/** The version the app had on a day (the newest entry of the list on or before it). */
export const versionOn = (day, list = WHATS_NEW) => list.find((e) => String(e.date) <= day)?.version ?? null;

/**
 * The functions newer than the previous opening, newest first: { from, rows } (from: the ISO time of
 * that opening), or { from: null, rows: [] } on the first opening. The version stored with the opening
 * counts; an opening without one takes the version of its day.
 */
export function newSinceOpen(prev, rows) {
  if (!prev?.at) return { from: null, rows: [] };
  const v = prev.v ?? versionOn(prev.at.slice(0, 10));
  return { from: prev.at, rows: v ? newSince(rows, v) : [] };
}

/* ---------- K3 «Fits right now» ---------- */

/** A trip starting within this many days is «soon» (as the weather card of Today: 3 days). */
export const SOON_DAYS = 3;
/** At most this many tips. */
export const FITS_MAX = 3;

/**
 * The tips that fit right now, in this order, at most FITS_MAX:
 * trip: the next trip starts within SOON_DAYS (check its packing list);
 * bulletin: that trip is a ski tour (the avalanche bulletin);
 * chain: a bike's chain is due by km (quickHints: nothing left until the next lube);
 * rate: a finished trip waits for its debrief (what «New for you» showed, answer 1b);
 * play: the playground was never tried and no demo runs (also from «New for you»).
 * → [{ key, kind, ... }]: trip { trip, days } (days < 0: it runs already), bulletin { trip }, chain { bike, since }, rate { trip }, play {}.
 */
export function fitsNow({ trips = [], bikes = [], debriefs = [], used = new Set(), demo = null, today } = {}) {
  const out = [];
  const next = nextTrip(trips, today);
  const days = next?.startDate ? daysBetween(today, next.startDate) : null;
  if (next && days != null && days <= SOON_DAYS) {
    out.push({ key: `trip-${next.id}`, kind: 'trip', trip: next, days });
    if (next.domain === 'ski') out.push({ key: `bulletin-${next.id}`, kind: 'bulletin', trip: next });
  }
  const chain = bikes
    .map((bike) => ({ bike, c: quickHints(bike, { today }).chain }))
    .filter((x) => x.c && x.c.left <= 0)
    .sort((a, b) => a.c.left - b.c.left)[0];
  if (chain) out.push({ key: `chain-${chain.bike.id}`, kind: 'chain', bike: chain.bike, since: chain.c.every - chain.c.left });
  const wait = toDebrief(trips, debriefs, today)[0];
  if (wait) out.push({ key: `rate-${wait.id}`, kind: 'rate', trip: wait });
  if (!used.has('f.playground') && !demo) out.push({ key: 'play', kind: 'play' });
  return out.slice(0, FITS_MAX);
}
