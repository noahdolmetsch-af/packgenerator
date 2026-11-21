/**
 * «Weg zum Ziel» › review «planned against actual» (Noah 05.11.2026 «5a», mockup G7): once the start day is over, a
 * card lists every step that had a planned day next to what happened: the day it was ticked, «+5 days» or «−4 days»
 * against the plan, or «not done». No judgement, only the two columns.
 *
 * The day a step was ticked is step.doneAt (set when the user ticks it or the app ticks it by itself). Steps ticked
 * before this review existed have no day: they show «done» without a number.
 *
 * rows(goal, today) → [{ id, title, planned, state: 'day' | 'done' | 'missed', actual, diff }] ordered by the planned
 * day; null when there is nothing to look back on (no start day, the start not over, no step with a planned day).
 * Pure, tested in tests/weg-rueckblick.test.js. Days are calendar days; nothing reads the clock.
 */
import { dueOf, daysBetween, EARLIER_DAYS } from './weg.js';

export function lookBack(goal, today) {
  if (!goal?.start || !today || goal.start >= today) return null;
  const rows = goal.steps
    .map((step) => ({ step, planned: dueOf(goal, step) }))
    .filter((r) => r.planned)
    .sort((a, b) => a.planned.localeCompare(b.planned))
    .map(({ step, planned }) => {
      if (!step.done) return { id: step.id, title: step.title, planned, state: 'missed', actual: '', diff: null };
      if (!step.doneAt) return { id: step.id, title: step.title, planned, state: 'done', actual: '', diff: null };
      return { id: step.id, title: step.title, planned, state: 'day', actual: step.doneAt, diff: daysBetween(planned, step.doneAt) };
    });
  return rows.length ? rows : null;
}

/** «+5 days», «−4 days», «on plan» as English keys for t()/tn(): { key, n } with n the number of days. */
export function sayDiff(diff) {
  if (diff == null) return null;
  if (diff === 0) return { one: 'On the planned day', many: 'On the planned day', n: 0 };
  return diff > 0
    ? { one: '+{n} day', many: '+{n} days', n: diff }
    : { one: '−{n} day', many: '−{n} days', n: -diff };
}

/**
 * Idea 5e «suggestion for next time»: the first step that was not done and not answered yet, as a question
 * «next time N weeks earlier?». Answered steps (step.next) and steps asked «later» today stay quiet. null when
 * there is nothing to ask (or the review is not shown yet).
 */
export function nextTime(goal, today) {
  const rows = lookBack(goal, today);
  if (!rows) return null;
  const miss = rows.find((r) => {
    const s = goal.steps.find((x) => x.id === r.id);
    return r.state === 'missed' && s && !s.next && s.later !== today;
  });
  return miss ? { id: miss.id, title: miss.title, weeks: EARLIER_DAYS / 7 } : null;
}
