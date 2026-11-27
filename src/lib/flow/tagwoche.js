/**
 * «Dein Tag und deine Woche» (Noah 27.11.2026 «1b 2a 3b 4a 5b», Thread «Abhaken auf einen Blick verbessern», Fragen 8 bis 12, 18 und 22 der 22):
 * the lines of the card on Auswerten › Woche: the day (lighter, usual or stronger than YOUR typical day), the week against the last four,
 * the mix of the kinds of sport, the activity that rests longest, the days without movement, your active weekdays and hours, and this month
 * against the same days of last year. Pure rules over the shared units (flow/einheiten.js, filtered by flow/sportjahr.js training());
 * no database, no clock. Observation only: nothing is graded, a line appears only with enough behind it.
 * Noah 27.11.2026: without minutes the NUMBER of ticks is counted. Minutes are only compared when measured (Strava, timer, typed); the
 * estimate «ca.» is never compared.
 */
import { addDays, daysBetween } from '../flow.js';
import { mondayOf } from './hakenverlauf.js';
import { daysOf } from './satz.js';

/** The days a «typical day» and the habits are taken from. */
export const WINDOW = 90;
/** Fewer days with data than this: no typical day. */
export const MIN_DAYS = 5;
/** A day below this share of the typical one is lighter, above the other stronger. */
export const LIGHT = 0.75;
export const STRONG = 1.25;
/** A week within these shares of the mean of the last four is «similar». */
export const WEEK_LOW = 0.8;
export const WEEK_HIGH = 1.2;
/** The weeks the week is compared with, and how many of them need data. */
export const WEEKS = 4;
export const MIN_WEEKS = 3;
/** The days the mix of the kinds is counted over. */
export const MIX_DAYS = 28;
/** An activity rests «longest» from this many days, when it is also this many times its usual distance. */
export const PAUSE_MIN = 4;
export const PAUSE_TIMES = 1.5;
/** The longest pause that still counts as a pause (after that the activity has stopped). */
export const PAUSE_MAX = 60;
/** At least this many days with a tick of an activity for its usual distance. */
export const PAUSE_DAYS = 5;
/** The days the weekday and the hour are taken from, and how many are needed. */
export const RHYTHM_MIN_DAYS = 12;
export const RHYTHM_MIN_TIMED = 10;
/** Fewer days last year than this: no comparison with the same days. */
export const YEAR_MIN_DAYS = 3;

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
const gem = (u) => (u.minQuelle === 'gemessen' && Number(u.min) > 0 ? Number(u.min) : 0);

/** day → { min (measured minutes), n (activities ticked, each once), units } */
export function perDay(units = []) {
  const by = new Map();
  for (const u of units) {
    const r = by.get(u.day) ?? { min: 0, acts: new Set(), n: 0 };
    r.min += gem(u);
    r.acts.add(u.actId ?? u.sport);
    r.n = r.acts.size;
    by.set(u.day, r);
  }
  return by;
}

const level = (value, typical, low, high) => (value < typical * low ? 'light' : value > typical * high ? 'strong' : 'usual');

/**
 * The day: the last day with something in the last two (today, else yesterday) against your typical day.
 * → { kind: 'light' | 'usual' | 'strong', when: 'today' | 'yesterday', by: 'min' | 'n', value, typical } or null
 */
export function dayLine(units = [], today) {
  const by = perDay(units);
  const when = by.has(today) ? 'today' : by.has(addDays(today, -1)) ? 'yesterday' : null;
  if (!when) return null;
  const day = when === 'today' ? today : addDays(today, -1);
  const from = addDays(today, -(WINDOW - 1));
  const past = [...by.entries()].filter(([d]) => d >= from && d < day);
  const here = by.get(day);
  const mins = past.map(([, r]) => r.min).filter((m) => m > 0);
  if (here.min > 0 && mins.length >= MIN_DAYS) return { kind: level(here.min, median(mins), LIGHT, STRONG), when, by: 'min', value: here.min, typical: median(mins) };
  const ns = past.map(([, r]) => r.n);
  if (ns.length >= MIN_DAYS) return { kind: level(here.n, median(ns), LIGHT, STRONG), when, by: 'n', value: here.n, typical: median(ns) };
  return null;
}

/**
 * The week so far (Monday to today) against the same stretch of the last four weeks.
 * → { kind: 'harder' | 'similar' | 'lighter', by: 'min' | 'days', cur, mean } or null
 */
export function weekLine(units = [], today) {
  const by = perDay(units);
  const monday = mondayOf(today);
  const span = daysBetween(monday, today);
  const sum = (from, key) => {
    let s = 0;
    for (let i = 0; i <= span; i++) {
      const r = by.get(addDays(from, i));
      if (r) s += key === 'min' ? r.min : 1;
    }
    return s;
  };
  for (const key of ['min', 'days']) {
    const prev = [];
    for (let w = 1; w <= WEEKS; w++) prev.push(sum(addDays(monday, -7 * w), key));
    const have = prev.filter((x) => x > 0).length;
    const cur = sum(monday, key);
    if (have < MIN_WEEKS || !(cur > 0)) continue;
    const mean = Math.round((prev.reduce((a, b) => a + b, 0) / WEEKS) * 10) / 10;
    const r = cur / mean;
    return { kind: r > WEEK_HIGH ? 'harder' : r < WEEK_LOW ? 'lighter' : 'similar', by: key, cur, mean: key === 'min' ? Math.round(mean) : mean };
  }
  return null;
}

/**
 * The mix: the days with a tick per kind (the field `art` of the activity) over the last 28 days.
 * acts: flowActs, artName(id) gives the name of a kind.
 * → { kinds: [{ id, days }] (most days first), missing (activities ticked in the period that have no kind), total (activities ticked) } or null without ticks
 */
export function mixLine(units = [], acts = [], today) {
  const from = addDays(today, -(MIX_DAYS - 1));
  const artOf = new Map(acts.map((a) => [a.id, a.art || null]));
  const days = new Map();
  const ticked = new Set();
  for (const u of units) {
    if (u.day < from || u.day > today || !u.actId) continue;
    ticked.add(u.actId);
    const art = artOf.get(u.actId);
    if (!art) continue;
    if (!days.has(art)) days.set(art, new Set());
    days.get(art).add(u.day);
  }
  if (!ticked.size) return null;
  const kinds = [...days.entries()].map(([id, s]) => ({ id, days: s.size })).sort((a, b) => b.days - a.days || a.id.localeCompare(b.id));
  const missing = [...ticked].filter((id) => !artOf.get(id)).length;
  return { kinds, missing, total: ticked.size };
}

/** The activity that rests longest against its own usual distance: { act, since, usual } or null. */
export function pauseLine(log = [], acts = [], today) {
  let best = null;
  for (const a of acts) {
    if (a.paused) continue;
    const days = daysOf(log, a.id, today).filter((d) => daysBetween(d, today) <= 120);
    if (days.length < PAUSE_DAYS) continue;
    const gaps = [];
    for (let i = 1; i < days.length; i++) gaps.push(daysBetween(days[i - 1], days[i]));
    const usual = Math.max(1, median(gaps));
    const since = daysBetween(days[days.length - 1], today);
    if (since < PAUSE_MIN || since > PAUSE_MAX || since < usual * PAUSE_TIMES) continue;
    const ratio = since / usual;
    if (!best || ratio > best.ratio) best = { act: a, since, usual, ratio };
  }
  return best ? { act: best.act, since: best.since, usual: best.usual } : null;
}

/** The days without movement: of the last 7 days up to yesterday, and the longest stretch of the last 90 days. */
export function freeLine(units = [], today) {
  const by = perDay(units);
  const from = addDays(today, -(WINDOW - 1));
  if (![...by.keys()].some((d) => d >= from && d <= today)) return null;
  let week = 0;
  for (let i = 1; i <= 7; i++) if (!by.has(addDays(today, -i))) week += 1;
  let longest = 0;
  let run = 0;
  for (let d = from; d < today; d = addDays(d, 1)) {
    run = by.has(d) ? 0 : run + 1;
    longest = Math.max(longest, run);
  }
  return { week, longest };
}

/**
 * Your active weekday and hour: the weekday with the most days of movement in the last 90 days (when it clearly leads), and the three-hour
 * slot in which most of the timed sessions begin. timed: [{ day, time: 'HH:MM' }] from Strava and the watch.
 * → { weekday (0 = Monday) | null, days, of, slot ({ from, n, of }) | null } or null
 */
export function rhythmLine(units = [], timed = [], today) {
  const from = addDays(today, -(WINDOW - 1));
  const days = new Set(units.filter((u) => u.day >= from && u.day <= today).map((u) => u.day));
  let weekday = null;
  let top = 0;
  if (days.size >= RHYTHM_MIN_DAYS) {
    const per = [0, 0, 0, 0, 0, 0, 0];
    for (const d of days) per[dow(d)] += 1;
    top = Math.max(...per);
    const mean = days.size / 7;
    if (top >= mean * 1.3) weekday = per.indexOf(top);
  }
  let slot = null;
  const hours = timed.filter((x) => x.day >= from && x.day <= today && /^\d{2}:\d{2}/.test(String(x.time ?? ''))).map((x) => Number(String(x.time).slice(0, 2)));
  if (hours.length >= RHYTHM_MIN_TIMED) {
    const per = new Map();
    for (const h of hours) per.set(Math.floor(h / 3) * 3, (per.get(Math.floor(h / 3) * 3) ?? 0) + 1);
    const [f, n] = [...per.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    if (n / hours.length >= 0.3) slot = { from: f, n, of: hours.length };
  }
  if (weekday == null && !slot) return null;
  return { weekday, days: top, of: days.size, slot };
}

/**
 * This month so far against the same days of last year: days with movement and measured minutes (minutes only when both sides have them).
 * → { days, daysBefore, min, minBefore, by: 'min' | 'days', fromDay (1), toDay } or null without enough days last year
 */
export function yearLine(units = [], today) {
  const y = Number(today.slice(0, 4));
  const m = today.slice(5, 7);
  const dayNo = today.slice(8, 10);
  const cut = (year) => units.filter((u) => u.day >= `${year}-${m}-01` && u.day <= `${year}-${m}-${dayNo}`);
  const now = cut(y);
  const before = cut(y - 1);
  const d1 = new Set(before.map((u) => u.day)).size;
  if (d1 < YEAR_MIN_DAYS) return null;
  const d0 = new Set(now.map((u) => u.day)).size;
  const m0 = now.reduce((s, u) => s + gem(u), 0);
  const m1 = before.reduce((s, u) => s + gem(u), 0);
  return { days: d0, daysBefore: d1, min: m0, minBefore: m1, by: m0 > 0 && m1 > 0 ? 'min' : 'days', month: m, toDay: Number(dayNo) };
}
