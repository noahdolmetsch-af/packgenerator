/**
 * «Wochenrückblick mit mehr Daten» (Noah 01.11.2026 «3c 5c»): the pure rules of the new tiles on the week review
 * (#/flow/review) and of the note and goal of a week. No database, no clock: every function gets its days.
 *
 *   bodyTiles    resting heart rate, HRV, sleep, steps and active-zone minutes of the week (Fitbit), each against
 *                the same days of the week before
 *   zonesWeek    time in the five heart rate zones of the week's activities
 *   bikesWeek    km and rides per bike (the Strava gear of the activities)
 *   outdoorWeek  weather (high, rain, sun) and appointments per day, from the daily values kept on this device
 *   noteOf, putNote   the week's own note, its goal and whether the goal was reached (db.settings 'weeknotes')
 * Health data is observation only: what was, never what is good.
 */
import { shiftDay, zoneSecs, isoWeek } from './training.js';
import { weekSums, weekEnd, dayValues, baseShare, trainStreak, SLEEP_Q } from './weekreview.js';
import { isoWeek as weekKey } from './kmbook.js';

export const NOTES_KEY = 'weeknotes';
/** Weeks kept in the record of notes. */
export const KEEP_NOTE_WEEKS = 104;
const MAX_TEXT = 600;

const r1 = (x) => Math.round(x * 10) / 10;
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const days = (monday, upto) => Array.from({ length: 7 }, (_, i) => shiftDay(monday, i)).filter((d) => d <= upto);

/** The Fitbit values of a week: [{ key, unit, how: 'mean' | 'sum', value, prev, diff, n, days: [{ day, v }] }]; a value with no day at all is left out. */
export const BODY = [
  { key: 'restingHr', unit: 'bpm', how: 'mean', get: (h) => h.restingHr },
  { key: 'hrvMs', unit: 'ms', how: 'mean', get: (h) => h.hrvMs },
  { key: 'sleep', unit: 'min', how: 'mean', get: (h) => h.sleep?.asleepMin },
  { key: 'steps', unit: 'steps', how: 'mean', get: (h) => h.steps },
  { key: 'azm', unit: 'min', how: 'sum', get: (h) => h.azm },
];

export function bodyTiles(health = [], monday, upto) {
  const by = new Map(health.filter((h) => h?.date).map((h) => [h.date, h]));
  const read = (m, to, get) => days(m, to).map((day) => ({ day, v: Number.isFinite(get(by.get(day) ?? {})) && get(by.get(day) ?? {}) > 0 ? get(by.get(day)) : null }));
  const out = [];
  for (const b of BODY) {
    const now = read(monday, upto, b.get);
    const before = read(shiftDay(monday, -7), shiftDay(upto, -7), b.get);
    const vs = now.filter((x) => x.v != null).map((x) => x.v);
    if (!vs.length) continue;
    const ps = before.filter((x) => x.v != null).map((x) => x.v);
    const agg = (xs) => (b.how === 'sum' ? xs.reduce((s, x) => s + x, 0) : mean(xs));
    const value = Math.round(agg(vs) * 10) / 10;
    const prev = ps.length ? Math.round(agg(ps) * 10) / 10 : null;
    out.push({ key: b.key, unit: b.unit, how: b.how, value, prev, diff: prev == null ? null : r1(value - prev), n: vs.length, days: now });
  }
  return out;
}

/** Seconds per heart rate zone Z1–Z5 over the activities of the days → { secs: [5], total } or null without heart rate data. */
export function zonesWeek(acts = [], monday, upto, bounds) {
  const secs = [0, 0, 0, 0, 0];
  for (const a of acts) {
    if (!a.day || a.day < monday || a.day > upto) continue;
    const z = zoneSecs(a.hist, bounds);
    if (z) z.forEach((s, i) => (secs[i] += s));
  }
  const total = secs.reduce((s, x) => s + x, 0);
  return total ? { secs, total } : null;
}

/** Km and rides per bike → [{ id, name, km, n }] by km, biggest first; the Strava gear id names the bike (`gear`: [{ id, name }]). */
export function bikesWeek(acts = [], monday, upto, gear = []) {
  const names = new Map(gear.map((g) => [String(g.id), g.name]));
  const by = new Map();
  for (const a of acts) {
    if (!a.day || a.day < monday || a.day > upto || a.kind !== 'bike') continue;
    const id = a.gearId ? String(a.gearId) : '';
    const row = by.get(id) ?? { id, name: id ? (names.get(id) ?? '') : '', km: 0, n: 0 };
    row.km += Number(a.km) || 0;
    row.n += 1;
    by.set(id, row);
  }
  return [...by.values()].map((r) => ({ ...r, km: r1(r.km) })).filter((r) => r.km > 0 || r.n > 0).sort((a, b) => b.km - a.km);
}

/** Weather and appointments of each day of the week → { days: [{ day, tmax, rainMm, sunH, events }], hasWeather, hasEvents }. Days without a value stay null. */
export function outdoorWeek(weather = {}, events = {}, monday, upto) {
  const list = days(monday, upto).map((day) => ({ day, tmax: weather[day]?.tmax ?? null, rainMm: weather[day]?.rainMm ?? null, sunH: weather[day]?.sunH ?? null, events: Number.isFinite(events[day]) ? events[day] : null }));
  return { days: list, hasWeather: list.some((d) => d.tmax != null || d.rainMm != null || d.sunH != null), hasEvents: list.some((d) => d.events != null) };
}

/* ---------------------------------------------------------------- the note and the goal of a week */

const clean = (s) => (typeof s === 'string' ? s.trim().slice(0, MAX_TEXT) : '');

/** The stored record, cleaned: { weeks: { 'YYYY-Www': { note, goal, goalDone } } }. */
export function notesOf(value) {
  const weeks = {};
  for (const [k, v] of Object.entries(value?.weeks ?? {})) {
    if (!/^\d{4}-W\d{2}$/.test(k) || !v || typeof v !== 'object') continue;
    const row = { note: clean(v.note), goal: clean(v.goal), goalDone: !!v.goalDone };
    if (row.note || row.goal) weeks[k] = row;
  }
  return { weeks };
}

/** The note and goal of the week that starts on this Monday (empty texts when there are none). */
export const noteOf = (value, monday) => notesOf(value).weeks[weekKey(monday)] ?? { note: '', goal: '', goalDone: false };

/** The record with one week changed (only the given fields); an empty note and goal remove the week. */
export function putNote(value, monday, change) {
  const c = notesOf(value);
  const k = weekKey(monday);
  const row = { ...noteOf(value, monday), ...change };
  const weeks = { ...c.weeks };
  const next = { note: clean(row.note), goal: clean(row.goal), goalDone: !!row.goalDone && !!clean(row.goal) };
  if (next.note || next.goal) weeks[k] = next;
  else delete weeks[k];
  const keep = Object.keys(weeks).sort().slice(-KEEP_NOTE_WEEKS);
  return { weeks: Object.fromEntries(keep.map((x) => [x, weeks[x]])) };
}

/* ---------------------------------------------------------------- the course over several weeks (Noah 02.11.2026 «1a 3a») */

/** Weeks in a course. */
export const COURSE_WEEKS = 8;
/** The values a course can show: key → unit. A detail page is opened with ?k=<key>. */
export const COURSE = {
  restingHr: 'bpm',
  hrvMs: 'ms',
  sleep: 'min',
  steps: 'steps',
  azm: 'min',
  zones: 'pct',
  bikes: 'km',
  tmax: 'deg',
  rain: 'mm',
  hours: 'hours',
  sleepFelt: 'pt',
  streak: 'days',
};

/**
 * One value over the last COURSE_WEEKS weeks, each counted for the same days as the shown week (the running
 * week meets the same days of the weeks before). data: { acts, health, log, flowActs, answers, checks, weather }.
 * → { key, unit, points: [{ monday, kw, value | null, hi }], usual (mean of the weeks before, or null), now } or null for an unknown key.
 */
export function weekCourse(key, data, monday, today, bounds) {
  if (!COURSE[key]) return null;
  const upto = weekEnd(monday, today);
  const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const points = Array.from({ length: COURSE_WEEKS }, (_, i) => {
    const m = shiftDay(monday, -7 * (COURSE_WEEKS - 1 - i));
    const to = shiftDay(upto, -7 * (COURSE_WEEKS - 1 - i));
    const dayList = days(m, to);
    let value = null;
    if (['restingHr', 'hrvMs', 'sleep', 'steps', 'azm'].includes(key)) value = bodyTiles(data.health ?? [], m, to).find((t) => t.key === key)?.value ?? null;
    else if (key === 'zones') value = baseShare(data.acts ?? [], m, shiftDay(to, 1), bounds);
    else if (key === 'bikes') {
      const km = (data.acts ?? []).filter((a) => a.kind === 'bike' && a.day >= m && a.day <= to).reduce((s, a) => s + (Number(a.km) || 0), 0);
      value = km > 0 ? r1(km) : null;
    } else if (key === 'tmax') {
      const v = dayList.map((d) => data.weather?.[d]?.tmax).filter(Number.isFinite);
      value = v.length ? r1(mean(v)) : null;
    } else if (key === 'rain') {
      const v = dayList.map((d) => data.weather?.[d]?.rainMm).filter(Number.isFinite);
      value = v.length ? r1(v.reduce((s, x) => s + x, 0)) : null;
    } else if (key === 'hours') {
      const secs = weekSums(data, m, to).secs;
      value = secs > 0 ? r1(secs / 3600) : null;
    } else if (key === 'sleepFelt') {
      const sv = dayValues(data, SLEEP_Q);
      const v = dayList.map((d) => sv.get(d)).filter(Number.isFinite);
      value = v.length ? r1(mean(v)) : null;
    } else if (key === 'streak') {
      const n = trainStreak(data, m, to);
      value = n > 0 ? n : null;
    }
    return { monday: m, kw: isoWeek(m), value, hi: m === monday };
  });
  const before = points.slice(0, -1).map((p) => p.value).filter((v) => v != null);
  const usual = before.length ? r1(mean(before)) : null;
  return { key, unit: COURSE[key], points, usual, now: points.at(-1).value };
}
