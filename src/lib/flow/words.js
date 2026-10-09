/**
 * v0.51.0 «Im Flow»: the short words of the flow views (goal, state of a button, the stand, the
 * season), in the current language. The numbers come from flow.js.
 */
import { t, tn, locale, lang } from '../i18n.svelte.js';
import { goalWords, activeGoals, halfOf } from '../flow.js';

const goalName = (q) => (q ? (lang.v === 'de' && q.labelDe ? q.labelDe : q.label) || '' : '');

/** «3× in 7 days», «10 daily», «daily», «rests». */
export function oneGoal(goal) {
  const w = goalWords(goal);
  return t(w.key, w.vars);
}

/** The goal of a list of goals: «Studio 1× + At home 1× in 7 days» or the one goal. */
export function goalsText(goals = []) {
  const live = goals.filter((q) => q.count > 0);
  if (!live.length) return t('rests');
  if (live.length === 1) return oneGoal(live[0]);
  const sameDays = live.every((q) => q.days === live[0].days);
  const parts = live.map((q) => `${goalName(q)} ${q.count}×`).join(' + ');
  return sameDays ? t('{goals} in {d} days', { goals: parts, d: live[0].days }) : live.map((q) => `${goalName(q)} ${oneGoal(q)}`).join(' + ');
}

/** The goal line of an activity on a day: with the season and the minimum duration. */
export function actGoalText(act, day, { season = true, min = true } = {}) {
  const now = goalsText(activeGoals(act, day));
  const half = halfOf(act, day);
  let s = now;
  if (season && half && activeGoals(act, day).length) s = `${half === 'summer' ? t('Summer') : t('Winter')} ${now}`;
  if (min && act.minMin) s += ` · ${act.minMin} min`;
  return s;
}

/** A day as «1. Nov.» / «1 Nov». */
export const dayShort = (day) => (day ? new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
/** «Sa 3.» for the grid head: weekday and day. */
export const wd = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '').slice(0, 2);
export const dnum = (day) => Number(day.slice(8, 10));

/** The quiet line under a button: «daily · open», «10 · open», «At home open», «in 4 days», «on track», «1× to go». */
export function tileSub(s) {
  if (s.resting) return t('rests until {date}', { date: dayShort(s.restUntil) });
  if (s.commuteToday) return t('Commute ✓');
  if (s.todayDone) return t('today ✓');
  if (s.open) return s.act.perTap > 1 ? t('{n} · open', { n: s.goals[0].goal.count }) : t('daily · open');
  if (s.goals.length > 1 && !s.met) return t('{place} open', { place: goalName(s.goals.find((r) => !r.met).goal) });
  if (s.met) {
    const r = s.goals[0];
    return r.dueIn != null && r.dueIn <= 7 && r.goal.days > 7 ? tn(r.dueIn, 'in {n} day', 'in {n} days') : t('on track');
  }
  const r = s.goals[0];
  if (!r.done && r.goal.count > 1) return t('0 of {n}', { n: r.goal.count });
  return t('{n}× to go', { n: r.goal.count - r.done });
}

/** The stand right in the grid: «6/7», «4/3 ✓», «in 4 d.» */
export function standText(s) {
  if (s.resting) return '';
  const tick = s.met && !s.daily ? ' ✓' : '';
  return `${s.stand.n}/${s.stand.of}${tick}`;
}
/** The stand's tone: met (teal), short (warn) or plain. */
export const standTone = (s) => (s.resting ? '' : s.daily ? (s.stand.n >= s.stand.of ? 'ok' : '') : s.met ? 'ok' : s.goals.some((r) => r.done > 0) ? 'warn' : '');
