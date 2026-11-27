/**
 * «Von selbst» (Noah 21.11.2026, Thread «Training erfassen vereinfachen», T3, «auch auf Aktivitäten von Health anwenden»): a workout
 * the watch recorded (Fitbit via Google Health, kept in healthDays.exercises) asks «How was it?» like a Strava activity: the same
 * three words, or «Later». Pure functions; the card is src/lib/training/plans/FeelAsk.svelte.
 * The answers live in ONE setting (training.healthfeel, in the backups) because a Fitbit workout has no row of its own:
 * { v: 1, map: { '<day>|<start>|<type>': { w: 'light'|'good'|'hard' } | { skip: true } } }. No new table, no schema change.
 * A workout that Strava has as well (rule: dieselbe.js, Garmin via Strava wins) is not asked twice: Strava's card asks. A plain walk of the
 * watch is never asked (Noah 27.11.2026), pieces of one workout are asked once.
 */
import { WORD_FEEL } from '../training.js';
import { coveredBy, fitFamily, isWalk, joinPieces } from './dieselbe.js';

export const HEALTH_FEEL_KEY = 'training.healthfeel';
const MAX = 200;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The key of one workout of a day row. */
export const exKey = (date, e) => `${date}|${e?.start ?? ''}|${e?.type ?? ''}`;

/** The answers map of the stored setting value (anything else reads as none). */
export function mapOf(value) {
  const m = value && typeof value === 'object' && value.map && typeof value.map === 'object' ? value.map : {};
  return Object.fromEntries(Object.entries(m).filter(([, v]) => v && typeof v === 'object' && (v.w in WORD_FEEL || v.skip === true)));
}

/** The word kept for a workout, or null. */
export const wordOfEx = (value, date, e) => mapOf(value)[exKey(date, e)]?.w ?? null;

/**
 * True when Strava has the same workout (rule: dieselbe.js): the same day and the times touch, or the same sport a little before or after
 * (up to 30 minutes), or, without a time, the same length within 10 %. The watch may have started late or cut the ride into pieces.
 */
export const onStrava = (date, e, acts = []) => !!coveredBy(date, e, acts);

/**
 * The workouts of the last 3 days without an answer and not on Strava, newest first (Noah 27.11.2026 «3b»: the open ones stand as a small list).
 * → [{ key, date, ...workout }]
 */
export function healthAllToAsk(rows = [], acts = [], value = null, today = '', shift = (d) => d) {
  const from = shift(today, -3);
  const map = mapOf(value);
  const list = [];
  for (const r of rows) {
    if (!r || !DAY_RE.test(String(r.date)) || r.date < from || r.date > today || !Array.isArray(r.exercises)) continue;
    for (const e of joinPieces(r.exercises)) {
      if (!e || !(e.min > 0) || isWalk(e)) continue;
      const key = exKey(r.date, e);
      if (map[key] || onStrava(r.date, e, acts)) continue;
      list.push({ key, date: r.date, ...e });
    }
  }
  return list.sort((a, b) => `${b.date} ${b.start ?? ''}`.localeCompare(`${a.date} ${a.start ?? ''}`));
}

/** The newest of them, or null. */
export const healthToAsk = (rows, acts, value, today, shift) => healthAllToAsk(rows, acts, value, today, shift)[0] ?? null;

/**
 * The new setting value after a tap: a word is kept; the same word again takes it back; 'later' asks no more.
 * The oldest answers go when there are more than 200.
 */
export function withAnswer(value, key, answer) {
  const map = mapOf(value);
  if (answer === 'later') map[key] = { skip: true };
  else if (answer in WORD_FEEL) {
    if (map[key]?.w === answer) delete map[key];
    else map[key] = { w: answer };
  } else delete map[key];
  const keys = Object.keys(map).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX))) delete map[k];
  return { v: 1, map };
}

/**
 * The answers to the bike workouts of the watch as numbers per day (Noah 27.11.2026 «1a»: Fitbit answers count like Strava's, here in the
 * «felt effort of rides» of Auswerten; a word counts as the middle of its numbers, training.js WORD_FEEL).
 * rows: [{ date, exercises }] (the days of the table). → Map day → number[]
 */
export function fitFeelByDay(rows = [], value = null) {
  const out = new Map();
  for (const r of rows) {
    if (!r?.date || !Array.isArray(r.exercises)) continue;
    for (const e of joinPieces(r.exercises)) {
      if (fitFamily(e) !== 'bike') continue;
      const w = wordOfEx(value, r.date, e);
      if (w) out.set(r.date, [...(out.get(r.date) ?? []), WORD_FEEL[w]]);
    }
  }
  return out;
}
