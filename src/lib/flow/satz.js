/**
 * «Der Satz nach dem Haken» (Noah 27.11.2026 «1b 2a», Thread «Abhaken auf einen Blick verbessern», Fragen 1 bis 7 der 22): what the tick
 * just made says about THIS activity, in two short lines on the page «Geschafft»: the first line is the strongest statement (a series
 * with its record, a long pause, how often this week against your usual), the second the next one (the length against your usual,
 * the weekly goal, what you often tick next). Pure rules over the ticks (flowLog); no database, no clock.
 * Observation only: nothing is graded, a line appears only when enough is behind it. Noah 27.11.2026: without minutes the
 * NUMBER of ticks is counted (minutes are only compared when the person, the timer or Strava measured them; «ca.» is never compared).
 */
import { addDays, daysBetween } from '../flow.js';
import { mondayOf } from './hakenverlauf.js';
import { t, num } from '../i18n.svelte.js';

/** The weeks before the tick the «usual» is taken from. */
export const WEEKS = 8;
/** Fewer ticks than this in those weeks: no «usual». */
export const MIN_USUAL_DAYS = 3;
/** A series from this many days in a row is named. */
export const MIN_RUN = 3;
/** A pause from this many days is named (or twice your usual distance). */
export const LONG_GAP = 7;
/** Fewer gaps than this: no usual distance. */
export const MIN_GAPS = 4;
/** The days the usual distance and the habits are taken from. */
export const HISTORY = 120;
/** Fewer measured durations than this: no comparison of the length. */
export const MIN_MINS = 5;
/** Shorter than this share of the usual length counts as shorter, longer than the other as longer. */
export const SHORT = 0.75;
export const LONG = 1.25;
/** «After A you often tick B»: from this many days together and this share of the days of A. */
export const MIN_TOGETHER = 4;
export const TOGETHER_SHARE = 0.5;

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The days with a tick of an activity up to a day, oldest first, each once. */
export const daysOf = (log = [], actId, upTo) => [...new Set(log.filter((e) => e.actId === actId && e.day <= upTo).map((e) => e.day))].sort();

/** The series of days in a row inside a sorted list of days: [[day, …], …]. */
export function runsOf(days = []) {
  const out = [];
  let cur = [];
  for (const d of days) {
    if (cur.length && daysBetween(cur[cur.length - 1], d) === 1) cur.push(d);
    else {
      if (cur.length) out.push(cur);
      cur = [d];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * The facts about one tick.
 * act: the activity, acts: all activities, log: the whole flowLog, entry: the tick, goal: { n, of, met } of its weekly goal or null.
 * → { days (ticks of this activity so far), first, weekN (days with a tick this week, Monday to the tick), usual ({ perWeek } | { everyWeeks } | null),
 *     gap (days since the time before, or null), usualGap, run, record (the longest series before this one), min (measured), usualMin,
 *     goal, together ({ other, k, of } | null) }
 */
export function actFacts({ act, acts = [], log = [], entry, goal = null }) {
  const day = entry.day;
  const days = daysOf(log, act.id, day);
  const monday = mondayOf(day);
  const weekN = days.filter((d) => d >= monday).length;
  let prior = 0;
  for (let i = 1; i <= WEEKS; i++) {
    const from = addDays(monday, -7 * i);
    prior += days.filter((d) => d >= from && d < addDays(from, 7)).length;
  }
  const usual = prior >= MIN_USUAL_DAYS ? (prior / WEEKS >= 0.75 ? { perWeek: Math.max(1, Math.round(prior / WEEKS)) } : { everyWeeks: Math.max(2, Math.round(WEEKS / prior)) }) : null;

  const before = days.filter((d) => d < day);
  const gap = before.length ? daysBetween(before[before.length - 1], day) : null;
  const recent = before.filter((d) => daysBetween(d, day) <= HISTORY);
  const gaps = [];
  for (let i = 1; i < recent.length; i++) gaps.push(daysBetween(recent[i - 1], recent[i]));
  const usualGap = gaps.length >= MIN_GAPS ? Math.max(1, Math.round(median(gaps))) : null;

  const runs = runsOf(days);
  const run = runs.length && runs[runs.length - 1].includes(day) ? runs[runs.length - 1].length : 1;
  const prev = runs.filter((r) => !r.includes(day));
  const record = prev.reduce((m, r) => Math.max(m, r.length), 0);

  const min = Number(entry.min) > 0 && entry.minQuelle !== 'ca.' ? Number(entry.min) : null;
  const mins = log.filter((e) => e.actId === act.id && e.id !== entry.id && Number(e.min) > 0 && e.day <= day).map((e) => Number(e.min));
  const usualMin = mins.length >= MIN_MINS ? Math.round(median(mins)) : null;

  // habits: the days of this activity in the history, and the other activities on those days
  const hist = before.filter((d) => daysBetween(d, day) <= HISTORY);
  let together = null;
  if (hist.length >= MIN_TOGETHER) {
    const doneToday = new Set(log.filter((e) => e.day === day).map((e) => e.actId));
    for (const b of acts) {
      if (b.id === act.id || b.paused || doneToday.has(b.id)) continue;
      const k = hist.filter((d) => log.some((e) => e.day === d && e.actId === b.id)).length;
      if (k >= MIN_TOGETHER && k / hist.length >= TOGETHER_SHARE && (!together || k / hist.length > together.k / together.of)) together = { other: b, k, of: hist.length };
    }
  }
  return { days: days.length, first: days.length === 1, weekN, usual, gap, usualGap, run, record, min, usualMin, goal, together };
}

/**
 * The lines for a tick, at most two: [{ kind, text }]. nameOf(act) gives the name of an activity in the current language.
 * The first line is the strongest of: series (with its record), long pause, the first time ever, how often this week; the second the next of:
 * the length against your usual, the weekly goal, what you often tick next, how often this week.
 */
export function satzLines(f, name, nameOf = (a) => a?.name ?? '') {
  const lines = [];
  const freq = () => {
    if (f.weekN <= 1) return f.usual?.perWeek ? t('{name}: the first time this week, usually about {u} a week.', { name, u: f.usual.perWeek }) : f.usual?.everyWeeks ? t('{name}: the first time this week, usually about every {k} weeks.', { name, k: f.usual.everyWeeks }) : t('{name}: the first time this week.', { name });
    return f.usual?.perWeek ? t('{name}: time {n} this week, usually about {u} a week.', { name, n: f.weekN, u: f.usual.perWeek }) : f.usual?.everyWeeks ? t('{name}: time {n} this week, usually only about every {k} weeks.', { name, n: f.weekN, k: f.usual.everyWeeks }) : t('{name}: time {n} this week.', { name, n: f.weekN });
  };
  let main = null;
  let usedFreq = false;
  if (f.run >= MIN_RUN) {
    main = { kind: 'run', text: f.run > f.record && f.days >= 10 ? t('{name}: day {n} in a row, your longest series so far.', { name, n: f.run }) : f.run === f.record && f.days >= 10 ? t('{name}: day {n} in a row, as long as your longest series.', { name, n: f.run }) : t('{name}: day {n} in a row.', { name, n: f.run }) };
  } else if (f.first) {
    main = { kind: 'first', text: t('{name}: the first time you tick this.', { name }) };
  } else if (f.gap != null && (f.gap >= LONG_GAP || (f.usualGap && f.gap >= 2 * f.usualGap && f.gap >= 4))) {
    main = { kind: 'gap', text: f.usualGap ? t('{name}: {n} days since the last time, usually {u} days between two.', { name, n: f.gap, u: f.usualGap }) : t('{name}: {n} days since the last time.', { name, n: f.gap }) };
  } else {
    main = { kind: 'freq', text: freq() };
    usedFreq = true;
  }
  lines.push(main);

  const extras = [];
  if (f.min && f.usualMin) {
    const r = f.min / f.usualMin;
    if (r < SHORT) extras.push({ kind: 'short', text: t('{min} minutes is shorter than usual, {name} usually takes about {u} minutes.', { min: num(f.min), name, u: num(f.usualMin) }) });
    else if (r > LONG) extras.push({ kind: 'long', text: t('{min} minutes is longer than usual, {name} usually takes about {u} minutes.', { min: num(f.min), name, u: num(f.usualMin) }) });
  }
  if (f.goal) extras.push({ kind: 'goal', text: f.goal.met ? t('Weekly goal reached: {n} of {of}.', { n: f.goal.n, of: f.goal.of }) : t('Weekly goal: {n} of {of} so far.', { n: f.goal.n, of: f.goal.of }) });
  if (f.together) extras.push({ kind: 'together', text: t('After {name} you often tick {other} too (on {k} of {n} days), not yet today.', { name, other: nameOf(f.together.other), k: f.together.k, n: f.together.of }) });
  if (!usedFreq && f.usual && f.weekN > 0) extras.push({ kind: 'freq', text: freq() });
  if (extras.length) lines.push(extras[0]);
  return lines;
}

/** One line for the short message right after a tick: the first line only. */
export const satzShort = (f, name, nameOf) => satzLines(f, name, nameOf)[0]?.text ?? '';
