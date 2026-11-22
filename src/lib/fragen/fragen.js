/**
 * «Fragen» (Plan «ganze App», Schritt 4a, Noah 08.11.2026 «D b»): the first tab of Auswerten asks six questions about your
 * data and answers each in one sentence, with the number and its limit. Nothing new is calculated: every answer reads the
 * rules that exist (the personal range of signals.js, the periods of compare.js, the care of care.js).
 * Pure: days are 'YYYY-MM-DD'; nothing reads the clock, the database or a text. The page puts the numbers into words.
 *
 *   QUESTIONS            the six questions in order: { key, group }
 *   answerOf(key, ctx)   → { state: 'ok' | 'few', ... } (the numbers of the answer) — `few` never guesses
 *
 * ctx: { today, get(key) → (day) → number | null, trips, endOf(trip), bikes, dueOf(bike) → [names] }
 * Observation only: no answer says «because» and none gives advice on health.
 */
import { bandOf, runsOutside, MIN_VALUES } from '../analyse/signals.js';
import { compareWindows, running, sameDay, aroundTrip, pastTrips, AROUND } from '../analyse/compare.js';
import { addDays } from '../analyse.js';

/** The six questions, one per group of the draft «Tour von A bis Z und Datencenter». */
export const QUESTIONS = [
  { key: 'koerper', group: 'body' },
  { key: 'tempo', group: 'ride' },
  { key: 'tour', group: 'tour' },
  { key: 'zusammen', group: 'together' },
  { key: 'velo', group: 'bike' },
  { key: 'jahr', group: 'develop' },
];

/** The least days (or nights) on each side before a comparison is said at all. */
export const MIN_SIDE = 5;
export const MIN_NIGHTS = 8;
/** The least days after a tour before «before and after» is said. */
export const MIN_AFTER = 3;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** The `n` days up to and including `end`, oldest first. */
const lastDays = (end, n) => Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
const meanOf = (days, get) => {
  const v = days.map((d) => fin(get(d))).filter((x) => x != null);
  return { mean: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, n: v.length };
};

/** Is my resting pulse in my usual range? Reads the personal range (middle 80 % of 60 days) and a run outside it. */
function koerper({ today, get }) {
  const rhr = get('rhr');
  const days = lastDays(today, 60);
  const have = days.filter((d) => fin(rhr(d)) != null).length;
  const band = bandOf(days, rhr);
  if (!band) return { state: 'few', n: have, need: MIN_VALUES };
  const run = runsOutside(days, rhr, band)[0];
  // a run counts as «now» when it reaches yesterday or today
  const now = run && run.to >= addDays(today, -1) ? { side: run.side, n: run.n } : null;
  return { state: 'ok', n: have, low: band[0], high: band[1], run: now, mean7: meanOf(lastDays(today, 7), rhr).mean, sleep7: meanOf(lastDays(today, 7), get('sleep')).mean };
}

/** Am I getting faster? The mean speed of the last 90 days against the 90 before. */
function tempo({ today, get }) {
  const spd = get('spd');
  const a = meanOf(lastDays(today, 90), spd);
  const b = meanOf(lastDays(addDays(today, -90), 90), spd);
  if (a.n < MIN_SIDE || b.n < MIN_SIDE) return { state: 'few', nNow: a.n, nPrev: b.n, need: MIN_SIDE };
  return { state: 'ok', now: a.mean, prev: b.mean, diff: a.mean - b.mean, nNow: a.n, nPrev: b.n };
}

/** How was I before and after my last tour? Sleep and resting pulse: the 7 days before the start, the days after the end. */
function tour({ today, get, trips = [], endOf }) {
  const past = pastTrips(trips, endOf, today);
  if (!past.length) return { state: 'few', why: 'none', tours: 0 };
  const last = past[0];
  const end = endOf?.(last) ?? last.startDate;
  const sleep = aroundTrip(last, end, get('sleep'), today);
  const rhr = aroundTrip(last, end, get('rhr'), today);
  const name = last.title ?? last.name ?? '';
  if (!sleep || sleep.afterDays < MIN_AFTER) return { state: 'few', why: 'recent', tours: past.length, name, id: last.id ?? null };
  const pair = (x) => (x && x.before != null && x.after != null ? { before: x.before, after: x.after } : null);
  const s = pair(sleep);
  const r = pair(rhr);
  if (!s && !r) return { state: 'few', why: 'values', tours: past.length, name, id: last.id ?? null };
  return { state: 'ok', id: last.id ?? null, name, tours: past.length, days: AROUND, afterDays: sleep.afterDays, sleep: s, rhr: r };
}

/** Do I sleep shorter after days with a ride? The night after a day with distance against the night after the other days. */
function zusammen({ today, get }) {
  const km = get('kmAll');
  const sleep = get('sleep');
  const after = [];
  const other = [];
  for (const d of lastDays(addDays(today, -1), 120)) {
    const s = fin(sleep(addDays(d, 1)));
    if (s == null) continue;
    (fin(km(d)) > 0 ? after : other).push(s);
  }
  if (after.length < MIN_NIGHTS || other.length < MIN_NIGHTS) return { state: 'few', nAfter: after.length, nOther: other.length, need: MIN_NIGHTS };
  const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  return { state: 'ok', after: mean(after), other: mean(other), diff: mean(after) - mean(other), nAfter: after.length, nOther: other.length };
}

/** What is due on my bikes? The care points whose km are used up, per bike (names the page puts into words). */
function velo({ bikes = [], dueOf }) {
  if (!bikes.length) return { state: 'few', n: 0 };
  const list = bikes.map((b) => ({ id: b.id, name: b.name ?? '', due: dueOf ? dueOf(b) : [] }));
  const due = list.filter((b) => b.due.length);
  return { state: 'ok', n: bikes.length, due, total: due.reduce((s, b) => s + b.due.length, 0) };
}

/** How is this year against last? The distance up to today's date against the same date a year ago. */
function jahr({ today, get }) {
  const km = get('kmAll');
  const w = compareWindows(today, 'year');
  const withKm = (days) => days.filter((d) => (fin(km(d)) ?? 0) > 0).length;
  const nNow = withKm(w.now.days);
  const nPrev = withKm(w.prev.days.slice(0, w.now.days.length));
  if (nNow < MIN_SIDE || nPrev < MIN_SIDE) return { state: 'few', nNow, nPrev, need: MIN_SIDE };
  const same = sameDay(running(w.now.days, km, true), running(w.prev.days, km, true));
  if (!same) return { state: 'few', nNow, nPrev, need: MIN_SIDE };
  return { state: 'ok', now: same.now, prev: same.prev, diff: same.diff, nNow, nPrev, year: Number(today.slice(0, 4)) };
}

const RULES = { koerper, tempo, tour, zusammen, velo, jahr };

/** The answer of one question: { state: 'ok' | 'few', ... }. An unknown key is `few`. */
export function answerOf(key, ctx) {
  try {
    return RULES[key]?.(ctx) ?? { state: 'few' };
  } catch {
    return { state: 'few' };
  }
}

/** True when not one question has data to answer (the page then says why and where to start). */
export const allFew = (answers) => answers.every((a) => a.state === 'few');
