/**
 * «Mein Trainingsplan» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S6, draft m3): plan and what you did,
 * on one page. Pure and read only: it writes nothing and replaces nothing. It reads
 *   training.weekplan + training.weeklog   (the Wochenplan and its ticks; past weeks from the frozen snapshots)
 *   training.plan                          (the sessions of the week suggestion, ticked by a Strava activity or by hand)
 *   training.goal                          (name, day)
 * Tested in tests/meinplan.test.js. The page is pages/flow/Meinplan.svelte.
 *
 * A row is one planned unit: { id, src: 'plan' | 'session', type, name, d (0 = Monday), t, mins, done, doneMins, released, tp? }.
 * A session from TrainingPeaks (tp: true) is part of the week's hours: the Wochenplan plans only the rest (planWeek, W1), so plan + TrainingPeaks
 * is the week, and `tpMins` of the sums says how much of it TrainingPeaks brings.
 * Counted for the hours are the units that move you (not the small habits, not the rest block, not the ones let go).
 */
import { shiftDay, mondayOf, isoWeek, goalOf, weeksTo, planOf as sessionsOf, plannerSessions, doneBy } from '../training.js';
import { QUIET, logOf, weekLog, isPast, weekFor } from './wochenlog.js';
import { TP_SRC } from './wochenplan.js';

/** Weeks before this one and after it that the chart shows. */
export const WEEKS_BACK = 4;
export const WEEKS_AHEAD = 3;
/** The share below which a week counts as «less than planned» (only a colour, never a grade). */
export const LOW_PCT = 85;

const dayIndex = (monday, day) => Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${monday}T12:00:00Z`)) / 864e5);
const counts = (r) => !r.released && !QUIET.includes(r.type) && r.type !== 'rest';

/** The rows of one week: the units of the Wochenplan (frozen after Sunday) and the sessions of the week suggestion. */
export function weekRows({ stored, log, sessions, planner, acts }, monday, today) {
  const w = weekLog(log, monday);
  const rows = [];
  const past = isPast(monday, today);
  const units = past ? (w.snap?.units ?? []).filter((u) => u.type !== 'tp') : stored != null ? weekFor(stored, monday, w.pins, w.mode, planner ?? sessions).week.units : []; // planner: the sessions plus the free days of TrainingPeaks, for the plan only
  for (const u of units) rows.push({ id: u.id, src: 'plan', type: u.type, name: null, d: u.d, t: u.t, mins: u.mins, done: !!w.done[u.id], doneMins: w.done[u.id] ? u.mins : 0, doneDay: w.done[u.id] ?? null, released: w.released.includes(u.id) });
  const end = shiftDay(monday, 6);
  for (const s of sessions) {
    if (s.day < monday || s.day > end) continue;
    const a = doneBy(s, acts);
    const m = a && !a.byHand && a.movingS > 0 ? Math.round(a.movingS / 60) : s.mins;
    rows.push({ id: `s:${s.id}`, src: 'session', type: 'session', kind: s.kind, name: s.name || null, d: dayIndex(monday, s.day), t: '', mins: s.mins, done: !!a, doneMins: a ? m : 0, doneDay: a ? s.day : null, released: false, byHand: !!a?.byHand, tp: s.src === TP_SRC });
  }
  return rows.sort((a, b) => a.d - b.d || a.t.localeCompare(b.t));
}

/** Planned minutes, done minutes, units and the share of the plan reached (null without a plan). */
export function sumOf(rows) {
  const main = rows.filter(counts);
  const plannedMins = main.reduce((a, r) => a + r.mins, 0);
  const doneMins = main.reduce((a, r) => a + r.doneMins, 0);
  const tpMins = main.filter((r) => r.tp).reduce((a, r) => a + r.mins, 0); // only there when TrainingPeaks is in the week
  return { plannedMins, doneMins, ...(tpMins > 0 ? { tpMins } : {}), units: main.length, doneUnits: main.filter((r) => r.done).length, pct: plannedMins > 0 ? Math.round((doneMins / plannedMins) * 100) : null };
}

/**
 * Everything the page shows.
 * { goal: { name, until, weeks, passed } | null, hasPlan, sources: { weekplan, sessions }, monday, kw,
 *   week: { rows, ...sumOf }, weeks: [{ monday, kw, current, future, rows, ...sumOf }] (oldest first), last: [the 4 weeks before this one with a plan],
 *   soFar: share of the plan hours of the days up to today (null without a plan) }
 */
export function meinPlan({ stored = null, rawLog = null, rawPlan = null, rawGoal = null, team = [], acts = [], today }) {
  const log = logOf(rawLog);
  const sessions = sessionsOf(rawPlan);
  const monday = mondayOf(today);
  const ctx = { stored, log, sessions, planner: plannerSessions(rawPlan, team), acts };
  const g = goalOf(rawGoal);
  const goal = g && (g.name || g.until) ? { name: g.name, until: g.until, weeks: weeksTo(g.until, today), passed: !!g.until && g.until < today } : null;

  const weeks = [];
  for (let i = -WEEKS_BACK; i <= WEEKS_AHEAD; i++) {
    const m = shiftDay(monday, i * 7);
    const r = weekRows(ctx, m, today);
    weeks.push({ monday: m, kw: isoWeek(m), current: i === 0, future: i > 0, rows: r, ...sumOf(r) });
  }
  const rows = weekRows(ctx, monday, today);
  const week = { rows, ...sumOf(rows) };
  // «so far»: only the units of the days up to today count against what was done
  const todayD = dayIndex(monday, today);
  const upTo = sumOf(rows.filter((r) => r.d <= todayD));
  const sources = { weekplan: stored != null, sessions: sessions.length > 0 };
  const hasPlan = sources.weekplan || sources.sessions;
  const last = weeks.filter((x) => !x.current && !x.future && x.plannedMins > 0).slice(-4);
  return { goal, hasPlan, sources, monday, kw: isoWeek(monday), week, weeks, last, soFar: upTo.plannedMins > 0 ? Math.round((upTo.doneMins / upTo.plannedMins) * 100) : null, upTo };
}
