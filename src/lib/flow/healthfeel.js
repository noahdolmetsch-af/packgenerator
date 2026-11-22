/**
 * «Von selbst» (Noah 21.11.2026, Thread «Training erfassen vereinfachen», T3, «auch auf Aktivitäten von Health anwenden»): a workout
 * the watch recorded (Fitbit via Google Health, kept in healthDays.exercises) asks «How was it?» like a Strava activity: the same
 * three words, or «Later». Pure functions; the card is src/lib/training/plans/FeelAsk.svelte.
 * The answers live in ONE setting (training.healthfeel, in the backups) because a Fitbit workout has no row of its own:
 * { v: 1, map: { '<day>|<start>|<type>': { w: 'light'|'good'|'hard' } | { skip: true } } }. No new table, no schema change.
 * A workout that Strava has as well (same day, start within 20 minutes) is not asked twice: Strava's card asks.
 */
import { WORD_FEEL } from '../training.js';

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

const minutesOf = (hhmm) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** True when Strava has the same workout: the same day and a start within 20 minutes (or, without a start, the same length within 10 %). */
export function onStrava(date, e, acts = []) {
  const s = minutesOf(e?.start);
  return acts.some((a) => {
    if (!a || a.day !== date) return false;
    const as = minutesOf(a.time);
    if (s != null && as != null) return Math.abs(as - s) <= 20;
    const am = (a.movingS || 0) / 60;
    return am > 0 && e?.min > 0 && Math.abs(am - e.min) / e.min <= 0.1;
  });
}

/**
 * The newest workout of the last 3 days without an answer and not on Strava, or null.
 * → { key, date, ...workout }
 */
export function healthToAsk(rows = [], acts = [], value = null, today = '', shift = (d) => d) {
  const from = shift(today, -3);
  const map = mapOf(value);
  const list = [];
  for (const r of rows) {
    if (!r || !DAY_RE.test(String(r.date)) || r.date < from || r.date > today || !Array.isArray(r.exercises)) continue;
    for (const e of r.exercises) {
      if (!e || !(e.min > 0)) continue;
      const key = exKey(r.date, e);
      if (map[key] || onStrava(r.date, e, acts)) continue;
      list.push({ key, date: r.date, ...e });
    }
  }
  return list.sort((a, b) => `${b.date} ${b.start ?? ''}`.localeCompare(`${a.date} ${a.start ?? ''}`))[0] ?? null;
}

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
