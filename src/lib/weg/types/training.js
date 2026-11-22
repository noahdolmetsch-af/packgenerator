/**
 * «Weg zum Ziel» › kind of step «Training progress» (Noah 05.11.2026 «a»: the tick sets itself). No new data: it only
 * reads what the app already has (the week plan of Aktiv › Training, the rides from Strava, the training build-up of
 * the race in race.js).
 *
 * A step is a check point: the week of its day (the Monday to Sunday that holds the step's day; without a start day
 * the current week). It shows three lines for that week:
 *   plan  – «Plan runs»: the week plan has sessions in that week.
 *   week  – «Week goal»: minutes done against the minutes planned; reached from 80 %.
 *   long  – «Longest ride against the stage goal»: the longest ride of the week against `longKm` of the race build-up
 *           (trainingPlan(): up to 60 % of an average race day, easier in the last two weeks). Without a day length
 *           (a free goal without a route) there is no stage goal and the line says so.
 * Each line is { key, state: 'ok' | 'open' | 'none' | 'later', ...numbers }. «none» = nothing to measure
 * (no plan, no stage goal), «later» = the week has not started.
 *
 * The step ticks itself (auto → true) when the plan runs, the week goal is reached and the longest ride reached the
 * stage goal. Without a stage goal the first two are enough. Otherwise it stays quietly open (null, never false) and the
 * user can tick by hand; a step the user unticked is never ticked again (applyAuto in weg.js).
 *
 * What the page hands in as ctx (all optional; a missing one means «nothing known», never an error). `load(db)` below
 * fetches the data; the page puts it under ctx.training (flat on ctx works too) and adds `today` and `dayKm`:
 *   today    'YYYY-MM-DD'
 *   sessions the planned sessions of Aktiv › Training [{ day, mins, done? }] (planOf(training.plan))
 *   acts     the activities [{ day, movingS }] (Strava; any sport counts as training minutes)
 *   rides    the counted bike rides [{ day | date, km }]
 *   dayKm    km of an average race day: a number, or { [goalId]: number }
 * Minutes done in a week = the larger of the minutes of the activities and the minutes of the sessions ticked by hand
 * (so a ride that is both ticked and on Strava counts once). Days are calendar days; nothing here reads the clock.
 * Pure, tested in tests/weg-training.test.js. Texts are English keys for t().
 */
import { trainingPlan, longestByWeek, monday, addDay } from '../../race/race.js';
import { dueOf } from '../weg.js';
import { PLAN_KEY, planOf } from '../../training.js';

/** Days before the start of the three suggested check points: 8, 4 and 2 weeks. */
export const CHECK_OFFSETS = [[56, 'Training check, 8 weeks before', 'check8'], [28, 'Training check, 4 weeks before', 'check4'], [14, 'Training check, 2 weeks before', 'check2']];
/** From this share of the planned minutes the week goal counts as reached. */
export const REACHED = 0.8;

/** The data of this type: ctx.training when the page loaded it, else ctx itself; today always from ctx. */
const dataOf = (ctx = {}) => ({ today: ctx.today, ...(ctx.training ?? ctx) });

const dayOf = (r) => String(r?.day ?? r?.date ?? '').slice(0, 10);
const inWeek = (day, from) => day >= from && day <= addDay(from, 6);

/** The Monday of the week a step looks at: the week of its day, else the current week; '' without any day. */
export function weekOfStep(goal, step, today = '') {
  const due = dueOf(goal, step);
  return due ? monday(due) : today ? monday(today) : '';
}

/** The km of an average race day for the goal, or 0. */
export function dayKmOf(goal, c0 = {}) {
  const ctx = dataOf(c0);
  const v = ctx.dayKm && typeof ctx.dayKm === 'object' ? ctx.dayKm[goal.id] : ctx.dayKm;
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** The stage goal (km of the longest ride) for the week from the training build-up of the race; null without one. */
export function stageGoal(goal, week, c0 = {}) {
  const ctx = dataOf(c0);
  const dayKm = dayKmOf(goal, ctx);
  if (!goal.start || !week || !dayKm) return null;
  // the build-up as the page of the race shows it: seen from today for this week and later ones, from the week's own
  // Monday for a week that is over (trainingPlan only lists the weeks from the reference day on)
  const ref = ctx.today && ctx.today < week ? ctx.today : week;
  const row = trainingPlan(goal.start, ref, dayKm).find((w) => w.week === week);
  return row ? { km: row.longKm, taper: !!row.taper } : null;
}

/** The three lines of a step: [{ key: 'plan' | 'week' | 'long', state, ... }]. */
export function lines(goal, step, c0 = {}) {
  const ctx = dataOf(c0);
  const today = ctx.today ?? '';
  const week = weekOfStep(goal, step, today);
  const later = !!week && !!today && week > today;
  const sessions = (ctx.sessions ?? []).filter((s) => inWeek(dayOf(s), week) && s.mins > 0);

  const plan = { key: 'plan', state: sessions.length ? 'ok' : 'none', sessions: sessions.length };

  const planned = sessions.reduce((n, s) => n + (Number(s.mins) || 0), 0);
  const upTo = (d) => !today || d <= today;
  const byActs = Math.round((ctx.acts ?? []).filter((a) => inWeek(dayOf(a), week) && upTo(dayOf(a))).reduce((n, a) => n + (Number(a.movingS) || 0), 0) / 60);
  const byHand = sessions.filter((s) => s.done === true && upTo(s.day)).reduce((n, s) => n + s.mins, 0);
  const have = Math.max(byActs, byHand);
  const fill = planned ? have / planned : 0;
  const weekLine = !planned
    ? { key: 'week', state: 'none', have: 0, of: 0, fill: 0 }
    : { key: 'week', state: later ? 'later' : fill >= REACHED ? 'ok' : 'open', have, of: planned, fill: Math.round(fill * 100) / 100 };

  const target = stageGoal(goal, week, ctx);
  const longest = Math.round(longestByWeek((ctx.rides ?? []).filter((r) => r && upTo(dayOf(r))))[week] ?? 0);
  const long = !target
    ? { key: 'long', state: 'none', have: longest, of: 0 }
    : { key: 'long', state: later ? 'later' : longest >= target.km ? 'ok' : 'open', have: longest, of: target.km, taper: target.taper };

  return [plan, weekLine, long];
}

/**
 * What the page writes for a line: { label, text, vars, state } with English keys for t(label) and t(text, vars).
 * Calm wording: a line that is not reached says how far it is, never «failed».
 */
export function say(line) {
  const label = { plan: 'Plan runs', week: 'Week goal', long: 'Longest ride against the stage goal' }[line.key];
  const w = { state: line.state, label };
  if (line.state === 'later') return { ...w, text: 'This week has not started yet.', vars: {} };
  if (line.key === 'plan') return line.state === 'ok' ? { ...w, text: 'Sessions are planned this week.', vars: {} } : { ...w, text: 'No plan for this week yet. The training plans can set one up.', vars: {} };
  if (line.state === 'none') return { ...w, text: line.key === 'week' ? 'No sessions planned this week, so there is nothing to measure.' : 'No stage goal yet. It needs the length of a race day.', vars: {} };
  return line.key === 'week'
    ? { ...w, text: '{have} of {of} min', vars: { have: line.have, of: line.of } }
    : { ...w, text: '{have} of {of} km', vars: { have: line.have, of: line.of } };
}

export default {
  type: 'training',
  label: 'Training progress',
  icon: 'trending-up',
  /** Three check points before the start (8, 4 and 2 weeks); every one can be renamed, moved and deleted. */
  defaults: () => CHECK_OFFSETS.map(([offset, title, key]) => ({
    key,
    title,
    offset,
    note: 'Plan runs, week goal reached, longest ride against the stage goal.',
  })),
  /** Reads what `auto` and the page need: the week plan, the activities (Strava) and the bike rides. */
  async load(db) {
    const [plan, acts] = await Promise.all([db.settings.get(PLAN_KEY), db.activities.toArray()]);
    const slim = acts.map((a) => ({ day: a.day, movingS: a.movingS, km: a.km, kind: a.kind }));
    return { sessions: planOf(plan?.value), acts: slim, rides: slim.filter((a) => a.kind === 'bike' || a.kind === 'ride') };
  },
  lines,
  say,
  auto(goal, step, ctx = {}) {
    const [plan, week, long] = lines(goal, step, ctx);
    const reached = plan.state === 'ok' && week.state === 'ok' && (long.state === 'ok' || long.state === 'none');
    return reached ? true : null;
  },
  /** To the training plans; with a start day the plan counts back from it. */
  link: (goal) => (goal?.start ? `#/flow/plans?race=${goal.start}` : '#/flow/plans'),
};
