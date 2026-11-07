/**
 * «Weg zum Ziel» › Schrittart «Practice rides» (Noah 05.11.2026 «3a»): a strip of milestones 50 / 100 / 200 km.
 * Three steps, counted back from the start day:
 *
 *   km50   a ride of 50 km, 70 days before the start.
 *   km100  a ride of 100 km, 42 days before.
 *   km200  a ride of 200 km, 21 days before (not for a free goal).
 *
 * A step ticks itself when ONE ride of at least that many km exists (Strava or the rides the app counts), ridden
 * within the last 150 days before the start (or before today without a start day) and not on the start day itself.
 * A ride counts for every milestone it reaches. A step the user unticked is never ticked again (applyAuto in weg.js);
 * the user can always tick by hand («assign by hand»). Nothing is stored: the strip is computed.
 *
 * `load(db)` reads the rides ({ day, km }); the page puts them under ctx.proben. Pure, tested in
 * tests/weg-proben.test.js. Labels are English keys for t(); the German is in i18n/de/weg-proben.js.
 */
import { timeline, shift } from '../weg.js';

export const TYPE = 'proben';

/** The milestones: key, km, days before the start. */
export const MILESTONES = [
  { key: 'km50', km: 50, offset: 70 },
  { key: 'km100', km: 100, offset: 42 },
  { key: 'km200', km: 200, offset: 21 },
];
/** How far back before the start (days) a ride still counts as a practice ride. */
export const WINDOW = 150;

const TITLE = { km50: 'Practice ride: 50 km', km100: 'Practice ride: 100 km', km200: 'Practice ride: 200 km' };
const NOTE = 'One ride of this length ticks it. Rides from Strava count by themselves; you can tick by hand too.';

const dayOf = (r) => String(r?.day ?? r?.date ?? '').slice(0, 10);
const dataOf = (ctx = {}) => ({ today: ctx.today, ...(ctx.proben ?? ctx) });

/** The km of a step (from its key), or 0 for a step of another kind. */
export const kmOf = (step) => MILESTONES.find((m) => m.key === step?.key)?.km ?? 0;

/** The rides that count for this goal: [{ day, km }]. */
export function ridesFor(goal, c0 = {}) {
  const ctx = dataOf(c0);
  const today = ctx.today ?? '';
  const end = goal.start && (!today || goal.start <= today) ? shift(goal.start, -1) : today;
  const from = goal.start ? shift(goal.start, -WINDOW) : today ? shift(today, -WINDOW) : '';
  return (ctx.rides ?? [])
    .map((r) => ({ day: dayOf(r), km: Number(r?.km) || 0 }))
    .filter((r) => r.day && r.km > 0 && (!from || r.day >= from) && (!end || r.day <= end));
}

/** The longest counting ride in km (rounded), 0 without one. */
export const bestKm = (goal, ctx) => Math.round(Math.max(0, ...ridesFor(goal, ctx).map((r) => r.km)));

/** The strip: { best, items: [{ id, title, km, due, state: 'done' | 'late' | 'open', reached }] } by km. */
export function milestones(goal, today, ctx = {}) {
  const best = bestKm(goal, { ...ctx, today });
  const items = timeline(goal, today)
    .filter((r) => r.step.type === TYPE && kmOf(r.step))
    .map((r) => ({ id: r.step.id, title: r.step.title, km: kmOf(r.step), due: r.due, state: r.state, reached: best >= kmOf(r.step), by: r.step.by }))
    .sort((a, b) => a.km - b.km);
  return { best, items };
}

export default {
  type: TYPE,
  label: 'Practice rides',
  icon: 'route',
  defaults: (goal) => MILESTONES.filter((m) => goal?.kind !== 'free' || m.km < 200).map((m) => ({ key: m.key, title: TITLE[m.key], offset: m.offset, note: NOTE })),
  /** The bike rides from the activities (Strava). */
  async load(db) {
    const acts = await db.activities.toArray();
    return { rides: acts.filter((a) => a.kind === 'bike' || a.kind === 'ride').map((a) => ({ day: a.day, km: a.km })) };
  },
  auto(goal, step, ctx = {}) {
    const km = kmOf(step);
    return km && bestKm(goal, ctx) >= km ? true : null;
  },
  link: () => '',
};

