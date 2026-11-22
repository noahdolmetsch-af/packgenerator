/**
 * «Wochenplan» part 3 (Noah 09.11.2026): ticking off, progress, «Heute dran», frozen past weeks, the Strava suggestion.
 * Pure; the page is pages/flow/Wochenplan.svelte, the line on Heute is in pages/Home.svelte, tests in
 * tests/wochenlog.test.js.
 *
 * Setting training.weeklog (db.settings, goes into the backup, no schema change):
 *   { v: 1, weeks: { 'YYYY-MM-DD' (the Monday): { done: { [unitId]: 'YYYY-MM-DD' (the day it was ticked) },
 *                    no: [Strava activity ids that were said «not this unit»],
 *                    pins: { [unitId]: { d, t } } (part 4: the units moved by hand in this week),
 *                    mode: { light?, ski?, rain? } (part 5: this week is lighter, a ski tour week, a rainy week),
 *                    released: [unitId] (part 5: units let go on purpose; they do not count for the week's star),
 *                    snap: { saved, hours, units: [{ id, type, d, t, mins }] } } } }
 * - A tick belongs to the stable id of a unit (`tennis@1`, `bikeOut#2`, never «Tennis 2»), so a change of the plan
 *   moves nothing: a unit that is gone keeps its tick, and it shows again when the unit comes back.
 * - The snapshot is the week as it was last seen. It is renewed on every visit during the week and never again once
 *   Sunday is over: that is the freezing. Past weeks show the snapshot, whatever the plan says today.
 * - Strava only suggests (Noah «2a»): a matching activity of the same day is offered, a tick is always by hand.
 */
import { shiftDay, mondayOf } from '../training.js';
import { planOf, isSummer, planWeek, lightOf } from './wochenplan.js';

export const WEEKLOG_KEY = 'training.weeklog';
/** How many weeks the log keeps (older ones go on write). */
export const KEEP_WEEKS = 52;
/** Units that are small daily habits: counted apart from the units of the week. */
export const QUIET = ['med', 'stretch'];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, n) => String(v ?? '').slice(0, n);

/** One snapshot unit, cleaned (or null). */
function unitOf(u) {
  if (!u || typeof u.id !== 'string' || typeof u.type !== 'string') return null;
  const d = Number(u.d);
  const mins = Number(u.mins);
  if (!(d >= 0 && d <= 6) || !(mins > 0 && mins <= 1440) || !/^\d{2}:\d{2}$/.test(u.t ?? '')) return null;
  return { id: str(u.id, 40), type: str(u.type, 20), d: Math.round(d), t: u.t, mins: Math.round(mins) };
}

/** The stored setting, cleaned. Bad weeks, days and units are dropped. */
export function logOf(raw) {
  const weeks = {};
  for (const [monday, w] of Object.entries(raw?.weeks && typeof raw.weeks === 'object' ? raw.weeks : {})) {
    if (!DAY.test(monday) || !w || typeof w !== 'object') continue;
    const done = {};
    for (const [id, day] of Object.entries(w.done && typeof w.done === 'object' ? w.done : {})) if (DAY.test(day ?? '')) done[str(id, 40)] = day;
    const units = (Array.isArray(w.snap?.units) ? w.snap.units : []).map(unitOf).filter(Boolean);
    const snap = units.length ? { saved: DAY.test(w.snap.saved ?? '') ? w.snap.saved : monday, hours: Number.isFinite(w.snap.hours) ? w.snap.hours : 0, units } : null;
    const no = (Array.isArray(w.no) ? w.no : []).map((x) => str(x, 40)).filter(Boolean).slice(0, 40);
    const released = [...new Set((Array.isArray(w.released) ? w.released : []).map((x) => str(x, 40)).filter(Boolean))].slice(0, 60);
    weeks[monday] = { done, no, pins: pinsOf(w.pins), mode: modeOf(w.mode), released, snap };
  }
  return { v: 1, weeks };
}

/** Moved units, cleaned: { [unitId]: { d: 0..6, t: 'HH:MM' } }. */
export function pinsOf(raw) {
  const out = {};
  for (const [id, p] of Object.entries(raw && typeof raw === 'object' ? raw : {})) {
    const d = Number(p?.d);
    if (d >= 0 && d <= 6 && Number.isInteger(d) && /^([01]\d|2[0-3]):[0-5]\d$/.test(p?.t ?? '')) out[str(id, 40)] = { d, t: p.t };
  }
  return out;
}

/** The modes of a week, cleaned: only the ones that are on stay. */
export function modeOf(raw) {
  const out = {};
  for (const k of ['light', 'ski', 'rain']) if (raw?.[k] === true) out[k] = true;
  return out;
}

/** One week of the log (empty when there is none). */
export const weekLog = (log, monday) => log.weeks[monday] ?? { done: {}, no: [], pins: {}, mode: {}, released: [], snap: null };

/** Is the week over (Sunday is past)? A past week is frozen. */
export const isPast = (monday, today) => shiftDay(monday, 7) <= today;

/** The log with the oldest weeks dropped. */
function trim(log) {
  const keys = Object.keys(log.weeks).sort();
  if (keys.length <= KEEP_WEEKS) return log;
  const weeks = { ...log.weeks };
  for (const k of keys.slice(0, keys.length - KEEP_WEEKS)) delete weeks[k];
  return { ...log, weeks };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The log with the week's snapshot renewed. A past week is frozen: nothing changes (the same log comes back).
 * The same log also comes back when nothing differs, so a page can compare and write only on a change.
 */
export function withSnapshot(log, monday, units, hours, today) {
  if (isPast(monday, today) || !units.length) return log;
  const w = weekLog(log, monday);
  const snap = { hours, units: units.map(unitOf).filter(Boolean) };
  if (w.snap && same({ hours: w.snap.hours, units: w.snap.units }, snap)) return log;
  return trim({ ...log, weeks: { ...log.weeks, [monday]: { ...w, snap: { ...snap, saved: today } } } });
}

/** The log with one unit ticked (or the tick taken away). A past week can not be changed. */
export function setDone(log, monday, id, on, today, units = [], hours = 0) {
  if (isPast(monday, today)) return log;
  const base = withSnapshot(log, monday, units, hours, today);
  const w = weekLog(base, monday);
  const done = { ...w.done };
  if (on) done[id] = today;
  else delete done[id];
  return trim({ ...base, weeks: { ...base.weeks, [monday]: { ...w, done } } });
}

/** The log with the moved units of a week replaced (a past week can not be changed). Used by move, take back and undo. */
export function setPins(log, monday, pins, today) {
  if (isPast(monday, today)) return log;
  const w = weekLog(log, monday);
  const next = pinsOf(pins);
  if (same(w.pins, next)) return log;
  return trim({ ...log, weeks: { ...log.weeks, [monday]: { ...w, pins: next } } });
}

/** The log with the modes of a week replaced (this week and next week; a past week is frozen). */
export function setMode(log, monday, mode, today) {
  if (isPast(monday, today)) return log;
  const w = weekLog(log, monday);
  const next = modeOf(mode);
  if (same(w.mode, next)) return log;
  return trim({ ...log, weeks: { ...log.weeks, [monday]: { ...w, mode: next } } });
}

/** A unit let go for this week (it no longer counts for the star), or counted again. */
export function setReleased(log, monday, id, on, today) {
  if (isPast(monday, today)) return log;
  const w = weekLog(log, monday);
  const list = w.released.filter((x) => x !== id);
  if (on) list.push(id);
  if (same(list, w.released)) return log;
  return trim({ ...log, weeks: { ...log.weeks, [monday]: { ...w, released: list } } });
}

/** One unit moved to a day and a time. */
export const movePin = (log, monday, id, d, t, today) => setPins(log, monday, { ...weekLog(log, monday).pins, [id]: { d, t } }, today);

/** One unit back on the suggestion. */
export function clearPin(log, monday, id, today) {
  const pins = { ...weekLog(log, monday).pins };
  delete pins[id];
  return setPins(log, monday, pins, today);
}

/** The log with an activity marked «not this unit». */
export function dismiss(log, monday, actId, today) {
  if (isPast(monday, today)) return log;
  const w = weekLog(log, monday);
  if (w.no.includes(actId)) return log;
  return { ...log, weeks: { ...log.weeks, [monday]: { ...w, no: [...w.no, actId] } } };
}

/** Progress of a week: units ticked, the small daily habits apart, minutes ticked (without the rest block). */
export function progress(units, done, released = []) {
  const main = units.filter((u) => !QUIET.includes(u.type) && !released.includes(u.id));
  const quiet = units.filter((u) => QUIET.includes(u.type));
  const tick = (u) => !!done[u.id];
  return {
    done: main.filter(tick).length,
    total: main.length,
    quietDone: quiet.filter(tick).length,
    quietTotal: quiet.length,
    doneMins: main.filter((u) => tick(u) && u.type !== 'rest').reduce((a, u) => a + u.mins, 0),
  };
}

/** The plan of a week from the stored goals of its season; mode: a lighter week, a ski tour week, a rainy week. */
export function weekFor(stored, monday, pins = {}, mode = {}) {
  const p = planOf(stored);
  const summer = isSummer(monday);
  const base = summer ? p.summer : p.winter;
  const cfg = mode.light ? lightOf(base, summer) : base;
  return { cfg, base, week: planWeek(cfg, { monday, pins, ski: !!mode.ski, rain: !!mode.rain }) };
}

/**
 * What is up today: the plan of this week, today's units still open (the small daily habits do not count here), and
 * the week's tick state. null when no weekly plan was saved or nothing is planned for today.
 */
export function dueToday(stored, rawLog, today) {
  if (stored == null) return null;
  const monday = mondayOf(today);
  const d = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const log = logOf(rawLog);
  const w = weekLog(log, monday);
  const { cfg, week } = weekFor(stored, monday, w.pins, w.mode);
  const done = w.done;
  const open = week.units.filter((u) => u.d === d && !QUIET.includes(u.type) && !done[u.id] && !w.released.includes(u.id));
  if (!open.length) return null;
  return { monday, hours: cfg.hours, units: week.units, open, next: open[0], more: open.length - 1 };
}

/** Which Strava activities fit which kind of unit. `a` is a record of db.activities. */
const FITS = {
  bikeOut: (a) => a.kind === 'bike' && !a.trainer && a.type !== 'VirtualRide',
  bikeIn: (a) => a.kind === 'bike' && (a.trainer || a.type === 'VirtualRide'),
  runOut: (a) => a.kind === 'run' && !a.trainer && a.type !== 'VirtualRun',
  runIn: (a) => a.kind === 'run' && (a.trainer || a.type === 'VirtualRun'),
  tennis: (a) => a.type === 'Tennis',
  yoga: (a) => a.type === 'Yoga',
  gym: (a) => a.type === 'WeightTraining' || a.type === 'Workout',
  ski: (a) => a.type === 'BackcountrySki',
};
/** An activity must last at least half of the unit. */
const LONG_ENOUGH = 0.5;

/**
 * Suggestions: { [unitId]: activity } for open units of a week that a Strava activity of the same day fits.
 * Read only: nothing is ticked. One activity serves one unit; activities marked «no» stay away.
 */
export function suggest(units, acts, monday, done, no = []) {
  const out = {};
  const used = new Set(no);
  const byTime = [...units].sort((a, b) => a.d - b.d || a.t.localeCompare(b.t));
  for (const u of byTime) {
    const fits = FITS[u.type];
    if (!fits || done[u.id]) continue;
    const day = shiftDay(monday, u.d);
    const a = acts.find((x) => x.day === day && !x.commute && !used.has(x.id) && fits(x) && (x.movingS ?? 0) >= u.mins * 60 * LONG_ENOUGH);
    if (a) {
      out[u.id] = a;
      used.add(a.id);
    }
  }
  return out;
}

/**
 * A week's star (part 5): every unit of its snapshot is ticked, not counting the small daily habits and the units
 * let go on purpose. Returns the day the last unit was ticked, or null (no snapshot, nothing planned, something open).
 */
export function completedOn(w) {
  if (!w?.snap) return null;
  const main = w.snap.units.filter((u) => !QUIET.includes(u.type) && !w.released.includes(u.id));
  if (!main.length || !main.every((u) => w.done[u.id])) return null;
  return main.map((u) => w.done[u.id]).sort().at(-1);
}

/** The weeks with a star, oldest first: { monday, day, run }; run = weeks in a row up to and with this one. */
export function starWeeks(log) {
  const out = [];
  let prev = null;
  let run = 0;
  for (const monday of Object.keys(log.weeks).sort()) {
    const day = completedOn(log.weeks[monday]);
    if (!day) continue;
    run = prev && shiftDay(prev, 7) === monday ? run + 1 : 1;
    prev = monday;
    out.push({ monday, day, run });
  }
  return out;
}

/** Weeks in a row with a star that end this week or last week (this week may still come). */
export function streakNow(log, today) {
  const last = starWeeks(log).at(-1);
  const mon = mondayOf(today);
  return last && (last.monday === mon || last.monday === shiftDay(mon, -7)) ? last.run : 0;
}

/** The frozen weeks, newest first: { monday, units, hours, done, ticked, total }. Only weeks with a snapshot. */
export function pastWeeks(log, today, limit = 12) {
  return Object.keys(log.weeks)
    .filter((m) => isPast(m, today) && log.weeks[m].snap)
    .sort()
    .reverse()
    .slice(0, limit)
    .map((monday) => {
      const w = log.weeks[monday];
      const p = progress(w.snap.units, w.done, w.released);
      return { monday, units: w.snap.units, hours: w.snap.hours, done: w.done, released: w.released, ticked: p.done, total: p.total, star: completedOn(w) != null };
    });
}
