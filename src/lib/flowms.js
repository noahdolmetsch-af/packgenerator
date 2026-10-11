/**
 * Hobby pages, package 1 (mockups A and A2, Noah 10.10.2026, H16a, H17a): the milestones. Pure
 * functions; the stars reached are kept in the table flowStars (db.js v8) and never get lost, even
 * when a streak breaks. Only the next star of a milestone is shown.
 *
 * A milestone: { id, key (for flow.msTune), actId|null, name, what, unit?, steps[≤7], opt?, sugg?, series }
 *   series(ctx) → one value per day of ctx.days (oldest first). A star is reached on the first day the
 *   value meets its threshold; `now` is the value shown today (for a streak: the running streak, kept
 *   until the day after the last entry has passed).
 * Stages (fixed names): 1 Beginning · 2 Habit · 3 Devotion · 4 Depth · 5 Calm · 6 Mastery · 7 Path
 * (Anfang · Gewohnheit · Hingabe · Tiefe · Ruhe · Meisterschaft · Weg).
 * Days are calendar days (YYYY-MM-DD, Europe/Zurich on the device), weeks start on Monday.
 */
import { addDays, normAct, actState } from './flow.js';

export const STAGES = ['Beginning|stage', 'Habit|stage', 'Devotion|stage', 'Depth|stage', 'Calm|stage', 'Mastery|stage', 'Path|stage'];
export const TUNE_KEY = 'flow.msTune';
export const REWARD_KEY = 'flow.reward';
/** From this share of the next threshold on a milestone is «soon» (Bald erreichbar). */
export const SOON = 0.8;
/** Activities that happen outside unless the activity says otherwise (act.outdoor). A suggestion. */
export const OUTDOOR = ['bike', 'run', 'walk'];

/* ---------- days ---------- */
const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();
/** The Monday of the day's week. */
export const weekStart = (day) => addDays(day, -((dow(day) + 6) % 7));
/** The hour (0–23) of an ISO time in Zurich, null without a time. */
const hourCache = new Map();
export function zurichHour(at) {
  if (!at) return null;
  if (hourCache.has(at)) return hourCache.get(at);
  const d = new Date(at);
  const h = Number.isNaN(d.getTime()) ? null : Number(d.toLocaleString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hourCycle: 'h23' }));
  if (hourCache.size > 5000) hourCache.clear();
  hourCache.set(at, h);
  return h;
}

/* ---------- the context: everything computed once per query ---------- */
/**
 * acts, log (the WHOLE flowLog), sessions (flowSessions), today, tripDays.
 * → { days, idx (day → index), byDay (day → entries), acts, actOf, today, ... }
 */
export function msContext({ acts = [], log = [], sessions = [], today, tripDays = [] }) {
  const list = acts.map(normAct);
  const actOf = new Map(list.map((a) => [a.id, a]));
  const known = log.filter((e) => e?.day && e.day <= today && actOf.has(e.actId));
  const first = known.reduce((m, e) => (e.day < m ? e.day : m), today);
  const days = [];
  for (let d = first; d <= today; d = addDays(d, 1)) days.push(d);
  const idx = new Map(days.map((d, i) => [d, i]));
  const byDay = new Map(days.map((d) => [d, []]));
  for (const e of known) byDay.get(e.day).push(e);
  return { acts: list, actOf, log: known, sessions, days, idx, byDay, today, tripDays };
}
const ringOf = (ctx, e) => ctx.actOf.get(e.actId)?.ring;
const outdoor = (a) => (a?.outdoor != null ? !!a.outdoor : OUTDOOR.includes(a?.id));

/* ---------- series builders ---------- */
/** Days so far on which an entry matches (or the day matches dayPred). */
function cumDays(ctx, dayPred) {
  let n = 0;
  return ctx.days.map((d) => (dayPred(ctx.byDay.get(d), d) ? ++n : n));
}
/** The running sum of w(e) over the entries that match. */
function cumSum(ctx, pred, w = () => 1, from = null) {
  let n = 0;
  return ctx.days.map((d) => {
    if (from && d < from) return 0;
    for (const e of ctx.byDay.get(d)) if (pred(e)) n += w(e);
    return Math.round(n * 10) / 10;
  });
}
/** The running maximum of w(e). */
function runMax(ctx, pred, w) {
  let m = 0;
  return ctx.days.map((d) => {
    for (const e of ctx.byDay.get(d)) if (pred(e)) m = Math.max(m, Number(w(e)) || 0);
    return m;
  });
}
/** Days in a row on which dayPred holds, ending on each day. */
function streak(ctx, dayPred) {
  let s = 0;
  return ctx.days.map((d) => (dayPred(ctx.byDay.get(d), d) ? ++s : (s = 0)));
}
/** Per week (Monday on): f(entries of the week up to that day). */
function weekly(ctx, f) {
  let wk = null;
  let acc = [];
  return ctx.days.map((d) => {
    const w = weekStart(d);
    if (w !== wk) (wk = w), (acc = []);
    acc.push(...ctx.byDay.get(d));
    return f(acc);
  });
}
/** Weeks in a row in which weekPred(entries of the week) holds; the running week counts once it holds. */
function weekStreak(ctx, weekPred) {
  const out = [];
  let done = 0; // complete weeks in a row before the running one
  let wk = null;
  let acc = [];
  let last = false;
  ctx.days.forEach((d) => {
    const w = weekStart(d);
    if (w !== wk) {
      if (wk) done = last ? done + 1 : 0;
      if (wk && addDays(wk, 7) !== w) done = 0; // a week without any day in the list (cannot happen) breaks it
      wk = w;
      acc = [];
    }
    acc.push(...ctx.byDay.get(d));
    last = weekPred(acc);
    out.push(last ? done + 1 : done);
  });
  return out;
}
/** Minutes of the most recent Saturday + Sunday (Saturday on or before the day). */
function weekendMin(ctx, pred) {
  return ctx.days.map((d) => {
    const k = dow(d);
    const sat = addDays(d, k === 6 ? 0 : k === 0 ? -1 : -(k + 1));
    let n = 0;
    for (const day of [sat, addDays(sat, 1)]) if (day <= d) for (const e of ctx.byDay.get(day) ?? []) if (pred(e)) n += Number(e.min) || 0;
    return n;
  });
}
/** Streak now: today counts, but a streak is not broken before today has passed. */
const streakNow = (s) => (s.length > 1 && s.at(-1) === 0 ? s.at(-2) : s.at(-1) ?? 0);
/** A week streak now: the running week may still come. */
const weekStreakNow = (s) => s.at(-1) ?? 0;

/* ---------- the milestones ---------- */
const own = (id) => (e) => e.actId === id;
const ms = (o) => ({ actId: null, unit: '', opt: false, sugg: false, now: (s) => s.at(-1) ?? 0, ...o, key: o.key ?? o.id });

/** The milestones over all activities (A, A2 «Über alle»). */
export function crossMilestones(ctx) {
  const year = ctx.today.slice(0, 4);
  const has = (ring) => (list) => list.some((e) => ringOf(ctx, e) === ring);
  const rings = new Set(ctx.acts.map((a) => a.ring));
  return [
    ms({ id: 'x.activeDay', name: 'Active day', what: 'days with movement', steps: [7, 30, 100, 200, 365], series: (c) => cumDays(c, has('move')) }),
    ms({ id: 'x.allround', name: 'All-rounder', what: 'sports in one week', steps: [3, 4, 5, 6], series: (c) => weekly(c, (l) => new Set(l.filter((e) => ringOf(c, e) === 'move').map((e) => e.actId)).size) }),
    ms({ id: 'x.wholeWeek', name: 'Whole week', what: 'weeks with all goals', steps: [1, 4, 12, 26], series: (c) => wholeWeeks(c) }),
    ms({ id: 'x.threeRings', name: 'Three-ring day', what: 'all 3 rings full', sugg: true, steps: [1, 7, 30, 100], series: (c) => cumDays(c, (l) => [...rings].every((r) => has(r)(l))) }),
    ms({ id: 'x.recovery', name: 'Recovery pro', what: 'days with recovery', sugg: true, steps: [10, 25, 50, 100], series: (c) => cumDays(c, has('rest')) }),
    ms({ id: 'x.outdoor', name: 'Outdoor person', what: 'days with sport outside', sugg: true, steps: [10, 50, 100, 250], series: (c) => cumDays(c, (l) => l.some((e) => outdoor(c.actOf.get(e.actId)))) }),
    ms({ id: 'x.early', name: 'Early start', what: 'active before 8', sugg: true, steps: [10, 25, 50, 100], series: (c) => cumDays(c, (l) => l.some((e) => (zurichHour(e.at) ?? 24) < 8)) }),
    ms({ id: 'x.newTried', name: 'Tried something new', what: 'new activity', sugg: true, steps: [1, 3, 5, 10], series: (c) => newTried(c) }),
    ms({ id: `x.hours.${year}`, key: 'x.hours', name: 'Hours moving {year}', vars: { year }, what: 'all sports', unit: 'h', sugg: true, steps: [50, 100, 200, 250, 400], series: (c) => cumSum(c, (e) => ringOf(c, e) === 'move', (e) => (Number(e.min) || 0) / 60, `${year}-01-01`) }),
  ];
}
function newTried(ctx) {
  const seen = new Set();
  return ctx.days.map((d) => {
    for (const e of ctx.byDay.get(d)) seen.add(e.actId);
    return seen.size;
  });
}
/** Complete weeks (to Sunday) in which every activity with a goal had it met on Sunday. */
function wholeWeeks(ctx) {
  const live = ctx.acts.filter((a) => !a.paused);
  let n = 0;
  return ctx.days.map((d) => {
    if (dow(d) === 0) {
      const states = live.map((a) => actState(a, ctx.log, d, ctx.tripDays)).filter((s) => !s.resting);
      if (states.length && states.every((s) => s.met)) n++;
    }
    return n;
  });
}

/** The meditation milestones (B1): six, plus four optional ones (suggestions). */
function meditationMilestones(a) {
  const p = own(a.id);
  const id = (k) => `${a.id}.${k}`;
  const sess = (c) => c.sessions.filter((s) => s.actId === a.id);
  const target = (() => {
    const q = a.goals.find((x) => x.count > 0);
    return q ? Math.max(1, Math.min(7, Math.round((q.count * 7) / q.days))) : 7;
  })();
  return [
    ms({ id: id('daily'), actId: a.id, name: 'Daily|ms', what: 'days in a row', steps: [3, 7, 14, 30, 60, 100, 365], series: (c) => streak(c, (l) => l.some(p)), now: streakNow }),
    ms({ id: id('devoted'), actId: a.id, name: 'Devoted', what: 'sessions', steps: [10, 25, 50, 100, 250, 500, 1000], series: (c) => cumSum(c, p) }),
    ms({ id: id('deeper'), actId: a.id, name: 'Deeper', what: 'longest session', unit: 'min', steps: [20, 30, 45, 60, 90, 120, 180], series: (c) => runMax(c, p, (e) => e.min) }),
    ms({ id: id('weekend'), actId: a.id, name: 'Weekend|ms', what: 'minutes on one Saturday + Sunday', unit: 'min', steps: [30, 60, 120, 180, 240, 360, 480], series: (c) => weekendMin(c, p), best: true }),
    ms({ id: id('practised'), actId: a.id, name: 'Practised', what: 'sessions of 60 min or more', steps: [1, 5, 10, 25, 50, 100, 250], series: (c) => cumSum(c, (e) => p(e) && Number(e.min) >= 60) }),
    ms({ id: id('intense'), actId: a.id, name: 'Intense', what: 'days in a row with 2 sessions', steps: [2, 3, 5, 7, 10, 14, 21], series: (c) => streak(c, (l) => l.filter(p).length >= 2), now: streakNow }),
    ms({ id: id('hours'), actId: a.id, name: 'Hours on the cushion', what: 'all sessions', unit: 'h', opt: true, sugg: true, steps: [10, 25, 50, 100, 250, 500, 1000], series: (c) => cumSum(c, p, (e) => (Number(e.min) || 0) / 60) }),
    ms({ id: id('morning'), actId: a.id, name: 'Morning', what: 'sessions before 8', opt: true, sugg: true, steps: [10, 25, 50, 100, 250, 500, 1000], series: (c) => cumSum(c, (e) => p(e) && (zurichHour(e.at) ?? 24) < 8) }),
    ms({ id: id('week'), actId: a.id, name: 'Faithful week', what: 'weeks in a row with your goal', opt: true, sugg: true, steps: [1, 4, 12, 26, 52, 104, 156], series: (c) => weekStreak(c, (l) => new Set(l.filter(p).map((e) => e.day)).size >= target), now: weekStreakNow }),
    ms({ id: id('variety'), actId: a.id, name: 'Variety', what: 'kinds of meditation', opt: true, sugg: true, steps: [2, 3, 5, 7, 9, 12], series: (c) => kinds(c, sess(c)) }),
  ];
}
function kinds(ctx, sessions) {
  const seen = new Set();
  const byDay = new Map();
  for (const s of sessions) if (s.art && s.day) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s.art]);
  return ctx.days.map((d) => {
    for (const k of byDay.get(d) ?? []) seen.add(k);
    return seen.size;
  });
}

/** The milestones of one activity (A2 «Pro Aktivität»): the meditation set, or one or two that fit. */
export function actMilestones(act) {
  const a = normAct(act);
  if (a.id === 'meditation' || a.page === 'meditation') return meditationMilestones(a);
  const p = own(a.id);
  const out = [];
  if (a.id === 'pushups' || a.perTap > 1) out.push(ms({ id: `${a.id}.total`, actId: a.id, name: 'Total|ms', what: 'all together', steps: [100, 500, 1000, 2500, 5000, 10000, 25000], series: (c) => cumSum(c, p, (e) => Number(e.n) || 1) }));
  if (a.counts.includes('commute')) out.push(ms({ id: `${a.id}.commute`, actId: a.id, name: 'Commute pro', what: 'rides to work', steps: [10, 25, 50, 100, 250, 500, 1000], series: (c) => cumSum(c, (e) => p(e) && e.via === 'commute') }));
  out.push(ms({ id: `${a.id}.sessions`, actId: a.id, name: 'Sessions', what: 'times done', steps: [5, 10, 25, 50, 100, 250, 500], series: (c) => cumSum(c, p) }));
  if (a.id === 'tennis') out.push(ms({ id: `${a.id}.hours`, actId: a.id, name: 'Hours on court', what: 'with a duration', unit: 'h', sugg: true, steps: [5, 10, 25, 50, 100, 250, 500], series: (c) => cumSum(c, p, (e) => (Number(e.min) || 0) / 60) }));
  return out;
}

/* ---------- evaluating ---------- */
/** The thresholds of a milestone after the user's own numbers (flow.msTune), ascending, at most 7. */
export function stepsOf(m, tune = {}) {
  const own = tune?.[m.key]?.steps;
  const list = Array.isArray(own) && own.length ? own : m.steps;
  return [...new Set(list.map((x) => Math.round(Number(x) * 10) / 10).filter((x) => x > 0))].sort((a, b) => a - b).slice(0, 7);
}
/** Whether the user switched a milestone off (everything stays changeable and deselectable). */
export const isOff = (m, tune = {}) => !!tune?.[m.key]?.off;

/**
 * One milestone today: { m, id, steps, value, best, reached: [{ star, day }], next (1-based) | null,
 * target, progress 0…1, soon, done (all stars: «Path») }. stored: Map id → day of flowStars.
 */
export function evaluate(m, ctx, stored = new Map(), tune = {}) {
  const series = m.series(ctx);
  const steps = stepsOf(m, tune);
  const value = m.now(series);
  const best = series.reduce((x, v) => Math.max(x, v), 0);
  const reached = [];
  steps.forEach((th, i) => {
    const star = i + 1;
    const sid = `${m.id}:${star}`;
    const k = series.findIndex((v) => v >= th);
    const day = stored.get(sid) ?? (k >= 0 ? ctx.days[k] : null);
    if (day) reached.push({ star, day, id: sid });
  });
  const got = new Set(reached.map((r) => r.star));
  const nextI = steps.findIndex((_, i) => !got.has(i + 1));
  const next = nextI < 0 ? null : nextI + 1;
  const target = next ? steps[nextI] : steps.at(-1);
  const progress = next ? Math.min(1, Math.max(0, value / target)) : 1;
  return { m, id: m.id, steps, value, best, reached, next, target, progress, soon: !!next && progress >= SOON && progress < 1, done: !next };
}

/** All milestones (cross + per activity), evaluated. Paused activities keep their stars but drop out. */
export function allMilestones(ctx, stored = new Map(), tune = {}) {
  const defs = [...crossMilestones(ctx), ...ctx.acts.filter((a) => !a.paused).flatMap(actMilestones)];
  return defs.map((m) => ({ ...evaluate(m, ctx, stored, tune), off: isOff(m, tune) }));
}

/** The stars that are reached but not yet stored: the flowStars rows to write. */
export function newStars(list, stored = new Map()) {
  return list.flatMap((r) => r.reached.filter((s) => !stored.has(s.id)).map((s) => ({ id: s.id, msId: r.id, star: s.star, day: s.day })));
}

/** «Bald erreichbar»: from 80 % of the next threshold on, the closest first. */
export const soonList = (list, n = 3) => list.filter((r) => !r.off && r.soon).sort((a, b) => b.progress - a.progress || a.target - b.target).slice(0, n);
/** «Zuletzt erreicht»: the newest stars (one per milestone, its highest), newest first. */
export function recentStars(list, n = 3) {
  return list
    .filter((r) => !r.off && r.reached.length)
    .map((r) => ({ r, star: r.reached.at(-1) }))
    .sort((a, b) => b.star.day.localeCompare(a.star.day) || b.star.star - a.star.star)
    .slice(0, n);
}
/** «Dein Jahr bisher»: stars reached this year and this month, and how many are soon. */
export function yearSummary(list, today) {
  const y = today.slice(0, 4);
  const m = today.slice(0, 7);
  const stars = list.filter((r) => !r.off).flatMap((r) => r.reached);
  return { year: stars.filter((s) => s.day.startsWith(y)).length, month: stars.filter((s) => s.day.startsWith(m)).length, soon: list.filter((r) => !r.off && r.soon).length, all: stars.length };
}
/** The next star of each activity: its milestone that is closest to the next star. */
export function nextPerAct(list) {
  const by = new Map();
  for (const r of list) {
    if (r.off || !r.m.actId) continue;
    const was = by.get(r.m.actId);
    const better = !was || (was.done && !r.done) || (!r.done && !was.done && r.progress > was.progress);
    if (better) by.set(r.m.actId, r);
  }
  return by;
}

/* ---------- the record wall ---------- */
/**
 * The personal bests that have data: [{ id, value, unit, what, day? }]. rides: the uploaded rides
 * (km). Only what the data can say; nothing is made up.
 */
export function records(ctx, rides = []) {
  const out = [];
  const maxBy = (list, w) => list.reduce((b, e) => (Number(w(e)) > (b ? Number(w(b)) : 0) ? e : b), null);
  const med = maxBy(ctx.log.filter((e) => e.actId === 'meditation' && e.min), (e) => e.min);
  if (med) out.push({ id: 'med', value: med.min, unit: 'min', what: 'longest meditation', day: med.day });
  const push = maxBy(ctx.log.filter((e) => e.actId === 'pushups'), (e) => e.n);
  if (push && push.n > 1) out.push({ id: 'push', value: push.n, unit: '', what: 'push-ups in one go', day: push.day });
  const ride = maxBy(rides.filter((r) => Number(r?.km) > 0), (r) => r.km);
  if (ride) out.push({ id: 'ride', value: Math.round(ride.km), unit: 'km', what: 'longest ride', day: ride.date });
  const s = streak(ctx, (l) => l.length > 0).reduce((m, v) => Math.max(m, v), 0);
  if (s > 1) out.push({ id: 'streak', value: s, unit: 'days', what: 'longest activity streak' });
  const weeks = new Map();
  for (const e of ctx.log) if (e.min) weeks.set(weekStart(e.day), (weeks.get(weekStart(e.day)) ?? 0) + Number(e.min));
  const wk = Math.max(0, ...weeks.values());
  if (wk > 0) out.push({ id: 'week', value: Math.round(wk), unit: 'min', what: 'most minutes in one week' });
  return out;
}

/* ---------- the reward (H17a) ---------- */
/** The reward made safe: { msId, star, itemId } or null. */
export function rewardOf(v) {
  if (!v || typeof v !== 'object' || !v.msId || !v.itemId) return null;
  const star = Math.max(1, Math.min(7, Math.round(Number(v.star) || 1)));
  return { msId: String(v.msId), star, itemId: String(v.itemId) };
}
/** How far the reward's star is: { r (the milestone), threshold, left, reached } or null. */
export function rewardState(reward, list) {
  const rw = rewardOf(reward);
  if (!rw) return null;
  const r = list.find((x) => x.id === rw.msId);
  if (!r) return null;
  const star = Math.min(rw.star, r.steps.length);
  const threshold = r.steps[star - 1];
  const reached = r.reached.some((s) => s.star === star);
  return { r, star, threshold, left: reached ? 0 : Math.max(0, Math.round((threshold - r.value) * 10) / 10), reached };
}
