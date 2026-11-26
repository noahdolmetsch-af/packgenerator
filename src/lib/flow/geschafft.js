/**
 * «Geschafft» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T1): the page after a tick, in one place:
 * what you did, how often this week, the week in hours and days, the weekly goals still open, a comparison with the last
 * time (only where Strava numbers exist) and ONE next step. Everything here only counts and looks; it never judges
 * («das 2. Mal diese Woche», never «gut» or «zu wenig»). Pure functions; the page is src/pages/flow/Geschafft.svelte.
 * No new data: it reads flowLog, flowActs, db.activities and the settings training.goal / training.weekplan / training.weeklog.
 */
import { mondayOf, shiftDay, goalOf, planOf, zoneSecs, mainZone } from '../training.js';
import { planOf as weekplanOf, isSummer } from '../training/wochenplan.js';
import { weekFor, logOf, weekLog, weekPins, QUIET } from '../training/wochenlog.js';
import { weekGoals } from '../flowweek.js';

/** The 7 days Monday to Sunday of the week of a day. */
export const weekDays = (day) => Array.from({ length: 7 }, (_, i) => shiftDay(mondayOf(day), i));

/** Where the tick came from: 'strava' | 'timer' | 'commute' | 'plan' | 'hand'. */
export const sourceKey = (e) => (e?.via === 'strava' || e?.via === 'timer' || e?.via === 'commute' || e?.via === 'plan' ? e.via : 'hand');

/** The entry to show: the one asked for, else the latest of today, else null. */
export function entryToShow(log = [], id, today) {
  if (id) return log.find((e) => e.id === id) ?? null;
  return [...log].filter((e) => e.day === today).sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '') || a.id.localeCompare(b.id)).at(-1) ?? null;
}

/** How many times the activity was ticked in the week of the entry, this one included (1 = the first time). */
export function nthThisWeek(log = [], e) {
  if (!e) return 0;
  const days = new Set(weekDays(e.day));
  const key = (x) => `${x.at ?? ''}|${x.id}`;
  return log.filter((x) => x.actId === e.actId && x.via !== 'commute' && days.has(x.day) && key(x) <= key(e)).length || 1;
}

/** The ticks that count as training: a «move» activity, not the ride to work. */
const training = (acts = []) => {
  const move = new Set(acts.filter((a) => a.ring === 'move').map((a) => a.id));
  return (e) => move.has(e.actId) && e.via !== 'commute';
};

/** The week of a day: minutes known, the days with training (Monday first), the number of ticks. */
export function weekNumbers(log = [], acts = [], day) {
  const days = weekDays(day);
  const counts = training(acts);
  const mine = log.filter((e) => days.includes(e.day) && counts(e));
  return {
    days,
    mins: mine.reduce((s, e) => s + (Number(e.min) || 0), 0),
    done: days.map((d) => mine.some((e) => e.day === d)),
    daysDone: new Set(mine.map((e) => e.day)).size,
    ticks: mine.length,
  };
}

/** Whole and half hours: 2:12 h. */
export const hhmm = (mins) => `${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, '0')}`;

/**
 * The weekly hours the person set (Training › «Stundenziel» = training.goal, else the hours of the weekly plan), or null.
 * Nothing invented: no goal set, no bar.
 */
export function hoursGoal({ goal = null, weekplan = null } = {}, day) {
  const g = goalOf(goal)?.hours;
  if (g) return g;
  if (weekplan == null) return null;
  const p = weekplanOf(weekplan);
  const h = (isSummer(day) ? p.summer : p.winter).hours;
  return h > 0 ? h : null;
}

/**
 * The weekly goals still open (met ones last), the goals of the sport just ticked first.
 * states: flowStates(...). → [{ act, n, of, daily, met }]
 */
export function openGoals(states = [], actId, limit = 4) {
  const own = (g) => (g.act.id === actId ? 0 : 1);
  const goals = weekGoals(states);
  const open = goals.filter((g) => !g.met).sort((a, b) => own(a) - own(b) || a.of - a.n - (b.of - b.n));
  const met = goals.filter((g) => g.met && g.act.id === actId);
  return { list: [...met, ...open].slice(0, limit), open: open.length, all: goals.length };
}

const fin = (v) => (Number.isFinite(v) && v > 0 ? v : null);
/**
 * Strava numbers of this tick against the last time of the same sport: [{ k: 'min'|'km'|'hr', now, before }] and the day
 * of the last time; null when there is no Strava activity or no earlier one. Only to look at.
 */
export function compareLast(activities = [], stravaId) {
  const cur = activities.find((a) => String(a.id) === String(stravaId));
  if (!cur) return null;
  const key = (a) => `${a.start ?? a.day}`;
  const before = activities
    .filter((a) => a.type === cur.type && a.id !== cur.id && key(a) < key(cur) && fin(a.movingS))
    .sort((a, b) => key(b).localeCompare(key(a)))[0];
  if (!before) return { cur, before: null, rows: [] };
  const rows = [];
  if (fin(cur.movingS) && fin(before.movingS)) rows.push({ k: 'min', now: Math.round(cur.movingS / 60), before: Math.round(before.movingS / 60) });
  if (fin(cur.km) && fin(before.km)) rows.push({ k: 'km', now: Math.round(cur.km * 10) / 10, before: Math.round(before.km * 10) / 10 });
  if (fin(cur.hrAvg) && fin(before.hrAvg)) rows.push({ k: 'hr', now: Math.round(cur.hrAvg), before: Math.round(before.hrAvg) });
  return { cur, before, rows };
}

/**
 * «Geplant und gemacht» (Noah 19.11.2026 «4a», TrainingPeaks): the planned session of the day of this tick, next to what was
 * done. The session is the one of the same day and the same sport: a Strava activity matches by its kind (bike, run, hike),
 * a tick of your own sport by the session's `sport`. With several, the one nearest in minutes. Only to look at: both numbers,
 * never «too short» or «on target». → { name, tp, zone, planned, did } (did = null without minutes) or null.
 */
export function plannedFor(stored, e, activities = []) {
  if (!e) return null;
  const cur = e.stravaId ? activities.find((a) => String(a.id) === String(e.stravaId)) : null;
  const did = cur && fin(cur.movingS) ? Math.round(cur.movingS / 60) : fin(Number(e.min)) ? Math.round(Number(e.min)) : null;
  const mine = planOf(stored).filter((x) => x.day === e.day && (cur ? x.kind === cur.kind : !!x.sport && x.sport === e.actId));
  if (!mine.length) return null;
  const s = [...mine].sort((a, b) => Math.abs(a.mins - (did ?? a.mins)) - Math.abs(b.mins - (did ?? b.mins)) || a.id.localeCompare(b.id))[0];
  return { name: s.name, tp: s.src === 'tp', zone: s.zone, planned: s.mins, did };
}

/**
 * «Diese Woche» planned against done (Noah 21.11.2026 «alles»): the minutes of the sessions planned this week (Training › Meine
 * Woche, also from TrainingPeaks) next to the minutes ticked. null when nothing is planned this week. Only to look at.
 */
export function plannedWeek(stored, day, doneMins = 0) {
  const days = weekDays(day);
  const mine = planOf(stored).filter((x) => days.includes(x.day) && fin(x.mins));
  if (!mine.length) return null;
  return { planned: mine.reduce((s, x) => s + x.mins, 0), done: Math.round(doneMins), n: mine.length };
}

/**
 * The zone of the plan (1–5) next to the zone with the most time in the ride (1–5), from the pulse histogram and the zones
 * in use (bounds). Only when both are known; no verdict. → { plan, ride } or null.
 */
export function zoneVsPlan(planned, activity, bounds) {
  if (!planned?.zone || !activity?.hist || !Array.isArray(bounds)) return null;
  const z = mainZone(zoneSecs(activity.hist, bounds));
  return z == null ? null : { plan: planned.zone, ride: z + 1 };
}

/**
 * The next open unit of the weekly plan (this week), after the moment given: { id, type, d (0 Monday), t 'HH:MM', day }.
 * null without a saved weekly plan or when nothing is left. The small daily habits do not count.
 * now: { day, time 'HH:MM' }. sessions: the sessions of `training.plan` (what TrainingPeaks replaced is not open).
 */
export function nextUnit(stored, rawLog, now, sessions = []) {
  if (stored == null) return null;
  const monday = mondayOf(now.day);
  const log = logOf(rawLog);
  const w = weekLog(log, monday);
  const wp = weekPins(log, monday);
  const { week } = weekFor(stored, monday, wp.pins, w.mode, sessions, wp.carried);
  const todayIdx = (new Date(`${now.day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const open = week.units.filter((u) => !QUIET.includes(u.type) && !w.done[u.id] && !w.released.includes(u.id) && (u.d > todayIdx || (u.d === todayIdx && u.t > now.time)));
  const u = open.sort((a, b) => a.d - b.d || a.t.localeCompare(b.t))[0];
  return u ? { id: u.id, type: u.type, d: u.d, t: u.t, day: shiftDay(monday, u.d) } : null;
}
