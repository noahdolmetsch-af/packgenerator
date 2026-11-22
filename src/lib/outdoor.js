/**
 * «Draussen» (Noah 21.11.2026, Thread «Challenges in den Vordergrund stellen»): a challenge with a daily goal in
 * minutes, the first one «90 minutes outdoors every day until 31.12.2026». A day counts when the minutes of that day
 * reach the goal. The minutes come from two places that add up: Strava activities of an outdoor kind (walking, hiking,
 * running, a ride that is not on the trainer, skiing …, read from the saved activities) and the minutes the person
 * adds by hand (+15, +30, +60 or their own). Everything else (tennis, swimming …) is added by hand.
 *
 * The record (settings key `outdoor`, travels in every backup and in the device sync):
 *   { name, goalMin, from, until, hand: { 'YYYY-MM-DD': [minutes, …] }, stopped: bool, closed: bool, no: day | null, remindAt: 'HH:MM' }
 * remindAt: the time of the phone reminder (the switch «Outdoors» in the push settings turns it on, default 16:00).
 * no: «Not now» on the start offer (asked again after OFFER_AGAIN_DAYS). Pure functions, tested in tests/outdoor.test.js.
 */
import { addDays, daysBetween } from './flow.js';
import { sunTimes, offsetFor } from './blockplan.js';

export const OUTDOOR_KEY = 'outdoor';
export const DEFAULT_GOAL_MIN = 90;
export const MAX_GOAL_MIN = 1440;
export const CHIPS = [15, 30, 60];
export const OFFER_AGAIN_DAYS = 30;
/** The phone reminder (Noah 21.11.2026 «2b»): every day at this time while the challenge runs. */
export const REMIND_AT = '16:00';
export const okHm = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
/** Strava kinds that count as outdoors (a ride on the trainer never does). */
export const OUTDOOR_TYPES = ['Walk', 'Hike', 'Run', 'TrailRun', 'Ride', 'GravelRide', 'MountainBikeRide', 'EBikeRide', 'EMountainBikeRide', 'BackcountrySki', 'AlpineSki', 'NordicSki', 'Snowboard', 'Snowshoe', 'Kayaking', 'Canoeing', 'StandUpPaddling'];

const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const whole = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

/** A stored record made safe; null without a valid one. */
export function outdoorOf(v) {
  if (!v || typeof v !== 'object' || !isDay(v.from) || !isDay(v.until) || v.until < v.from) {
    return v && typeof v === 'object' && isDay(v.no) ? { no: v.no } : null;
  }
  const hand = {};
  for (const [d, list] of Object.entries(v.hand && typeof v.hand === 'object' ? v.hand : {})) {
    if (!isDay(d) || !Array.isArray(list)) continue;
    const l = list.map((n) => whole(n, 0, 1440)).filter((n) => n > 0);
    if (l.length) hand[d] = l;
  }
  return {
    name: String(v.name ?? '').trim().slice(0, 40) || 'Outdoors',
    goalMin: Number(v.goalMin) >= 1 ? whole(v.goalMin, 1, MAX_GOAL_MIN) : DEFAULT_GOAL_MIN,
    from: v.from,
    until: v.until,
    hand,
    stopped: !!v.stopped,
    closed: !!v.closed,
    no: isDay(v.no) ? v.no : null,
    remindAt: okHm(v.remindAt) ? v.remindAt : REMIND_AT,
  };
}

/** The challenge of 90 minutes: from a day (default today) until a day (default the end of the year). */
export const startOutdoor = ({ today, from = today, until, goalMin = DEFAULT_GOAL_MIN, name = 'Outdoors' } = {}) =>
  outdoorOf({ name, goalMin, from, until: until && until >= from ? until : `${from.slice(0, 4)}-12-31`, hand: {}, stopped: false, closed: false, no: null, remindAt: REMIND_AT });

/** Whether a Strava activity counts as time outdoors. */
export const isOutdoor = (a) => !!a && OUTDOOR_TYPES.includes(a.type) && !a.trainer;

/** The minutes of Strava outdoor activities of a day. */
export function stravaMin(activities = [], day) {
  const s = activities.filter((a) => a.day === day && isOutdoor(a)).reduce((n, a) => n + (Number(a.movingS) > 0 ? Number(a.movingS) : 0), 0);
  return Math.round(s / 60);
}
/** The minutes added by hand on a day. */
export const handMin = (rec, day) => (rec?.hand?.[day] ?? []).reduce((n, m) => n + m, 0);
/** One day: { strava, hand, total, done }. */
export function dayOf(rec, activities, day) {
  const strava = stravaMin(activities, day);
  const hand = handMin(rec, day);
  const total = strava + hand;
  return { day, strava, hand, total, done: !!rec && total >= rec.goalMin };
}

/** Add minutes by hand to a day (whole minutes, 1 to 1440 a day in all). */
export function addMin(rec, day, n) {
  const m = whole(n, 0, 1440);
  if (!rec || !m) return rec;
  const cur = rec.hand[day] ?? [];
  return { ...rec, hand: { ...rec.hand, [day]: [...cur, Math.min(m, 1440 - handMin(rec, day))].filter((x) => x > 0) } };
}
/** Take the last added minutes of a day back (Undo). */
export function undoMin(rec, day) {
  const cur = rec?.hand?.[day] ?? [];
  if (!cur.length) return rec;
  const hand = { ...rec.hand };
  if (cur.length > 1) hand[day] = cur.slice(0, -1);
  else delete hand[day];
  return { ...rec, hand };
}

/** «Tick off» (Noah 22.11.2026 «a»): the minutes that are missing to the goal today, counting Strava (0 when it is reached). */
export const missingMin = (rec, activities, day) => Math.max(0, (rec?.goalMin ?? 0) - dayOf(rec, activities, day).total);
/** Take a ticked day back: the minutes added by hand go, last first, until the day is under the goal again (Strava stays). */
export function untickMin(rec, activities, day) {
  let next = rec;
  while (next && (next.hand[day] ?? []).length && dayOf(next, activities, day).done) next = undoMin(next, day);
  return next;
}

/**
 * Where the challenge stands today.
 * → null without a challenge; else { phase: 'soon'|'running'|'over'|'stopped', dayNo, total, today, doneN, missed, streak, left, days }
 * days: every day of the challenge up to the end as 'ok' | 'miss' | 'today' | 'todo'.
 */
export function standing(rec, activities, today) {
  if (!rec?.from) return null;
  const total = daysBetween(rec.from, rec.until) + 1;
  const phase = rec.stopped ? 'stopped' : today < rec.from ? 'soon' : today > rec.until ? 'over' : 'running';
  const last = today > rec.until ? rec.until : today;
  let doneN = 0;
  let missed = 0;
  const days = [];
  for (let i = 0; i < total; i++) {
    const d = addDays(rec.from, i);
    const x = dayOf(rec, activities, d);
    if (d > last || phase === 'soon') {
      days.push({ day: d, state: 'todo' });
      continue;
    }
    if (x.done) {
      doneN++;
      days.push({ day: d, state: 'ok', min: x.total });
    } else if (d === today && phase === 'running') {
      days.push({ day: d, state: 'today', min: x.total });
    } else {
      missed++;
      days.push({ day: d, state: 'miss', min: x.total });
    }
  }
  // days in a row: back from today when today is done, else back from yesterday
  let streak = 0;
  for (let d = last, first = true; d >= rec.from; d = addDays(d, -1), first = false) {
    if (dayOf(rec, activities, d).done) streak++;
    else if (!(first && d === today && phase === 'running')) break;
  }
  const now = dayOf(rec, activities, today);
  return {
    phase,
    dayNo: phase === 'soon' ? 0 : Math.min(total, daysBetween(rec.from, last) + 1),
    total,
    today: { ...now, left: Math.max(0, rec.goalMin - now.total) },
    doneN,
    missed,
    streak,
    days,
  };
}

/** Hours and minutes of a total as «1 h 30 min» parts. */
export const hm = (min) => ({ h: Math.floor(min / 60), m: min % 60 });
/** All minutes of the challenge so far (Strava and by hand), for the end. */
export function allMin(rec, activities, today) {
  if (!rec?.from) return 0;
  const last = today > rec.until ? rec.until : today;
  let n = 0;
  for (let d = rec.from; d <= last; d = addDays(d, 1)) n += dayOf(rec, activities, d).total;
  return n;
}

/**
 * The light line: when the sun goes down at the home place and the latest start that still fits the minutes left
 * in daylight. null without a home place, with nothing left, or when it is already too late. now: a Date.
 * → { set: 'HH:MM', latest: 'HH:MM' | null }
 */
export function lightLine(place, day, left, now = new Date()) {
  const lat = Number(place?.lat);
  const lon = Number(place?.lon);
  if (!place || !Number.isFinite(lat) || !Number.isFinite(lon) || left <= 0) return null;
  const sun = sunTimes(day, lat, lon);
  if (!sun) return null;
  const off = offsetFor(day) * 60000;
  const clock = (ms) => new Date(ms + off).toISOString().slice(11, 16);
  const latest = sun.set - left * 60000;
  return { set: clock(sun.set), latest: latest > now.getTime() ? clock(latest) : null };
}

/** «Not now» on the start offer: asked again after OFFER_AGAIN_DAYS. */
export const offerOpen = (rec, today) => !rec || (!rec.from && (!rec.no || daysBetween(rec.no, today) >= OFFER_AGAIN_DAYS));

/**
 * The days of the phone reminder: from today (or the first day) up to `ahead` days, while the challenge runs.
 * Today is left out when its minutes (Strava and by hand) already reach the goal. → [{ day, left }]
 * left: the minutes still to go on that day (the whole goal for a day in the future).
 */
export function remindDays(rec, activities, today, ahead = 14) {
  if (!rec?.from || rec.stopped || rec.closed) return [];
  const out = [];
  for (let i = 0; i <= ahead; i++) {
    const d = addDays(today, i);
    if (d < rec.from) continue;
    if (d > rec.until) break;
    const x = dayOf(rec, activities, d);
    if (x.done) continue;
    out.push({ day: d, left: Math.max(1, rec.goalMin - x.total) });
  }
  return out;
}
