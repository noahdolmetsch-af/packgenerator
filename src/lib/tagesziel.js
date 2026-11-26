/**
 * «Challenges» PR 3 (Noah 21.11.2026 «4a», Entwurf freigegeben 22.11.2026 02:33): own daily goals on the same
 * engine as «Draussen» (src/lib/outdoor.js): a name, a unit (minutes, a count with a word you choose, or steps),
 * a goal per day, a first and a last day. A day counts when the amounts of that day reach the goal. The amounts are
 * added by hand (+5, +10, … or your own number, with Undo); only «Draussen» also reads Strava.
 *
 * The record (settings key `tagesziele`, travels in every backup and in the device sync):
 *   [{ id, name, unit: 'min'|'count'|'steps', word, goal, from, until, hand: { 'YYYY-MM-DD': [n, …] }, stopped, closed }]
 * The older settings key `challenges` (do X n times until a day, src/lib/challenge.js) stays as it is.
 * Pure functions, tested in tests/tagesziel.test.js.
 */
import { addDays, daysBetween } from './flow.js';

export const TAGESZIELE_KEY = 'tagesziele';
export const MAX_ZIELE = 12;
export const MAX_DAY = 100000;
/** The units: the buttons next to the field for your own number, the goal you can set. */
export const UNITS = {
  min: { chips: [5, 10, 15, 30], goal: 10, max: 1440 },
  count: { chips: [1, 2, 3, 5], goal: 3, max: 1000 },
  steps: { chips: [1000, 2000, 5000], goal: 8000, max: MAX_DAY },
};
export const UNIT_KEYS = Object.keys(UNITS);
/** «Belongs to»: the page whose sessions count by themselves (only minutes; today: the meditation sessions of the Dexie table flowLog). */
export const LINKS = ['meditation'];
/** Ideas to take over (only ideas, nothing is on by itself). */
export const SUGGESTIONS = [
  { name: '30 days of meditation', unit: 'min', goal: 10, days: 30, link: 'meditation' },
  { name: 'Daily steps', unit: 'steps', goal: 8000, days: 30 },
  { name: 'Stretching', unit: 'min', goal: 10, days: 14 },
  { name: 'Glasses of water', unit: 'count', word: 'glasses', goal: 8, days: 30 },
];

/** The time of the phone reminder, «HH:MM» (empty = no reminder). */
export const okTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const whole = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
const clean = (s, n) => String(s ?? '').trim().slice(0, n);

/** The stored goals made safe. */
export function tageszieleOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((c) => c && c.id && isDay(c.from) && isDay(c.until) && c.until >= c.from && clean(c.name, 40))
    .slice(0, MAX_ZIELE)
    .map((c) => {
      const unit = UNIT_KEYS.includes(c.unit) ? c.unit : 'min';
      const hand = {};
      for (const [d, list] of Object.entries(c.hand && typeof c.hand === 'object' ? c.hand : {})) {
        if (!isDay(d) || !Array.isArray(list)) continue;
        const l = list.map((n) => whole(n, 0, UNITS[unit].max)).filter((n) => n > 0);
        if (l.length) hand[d] = l;
      }
      return {
        id: String(c.id),
        name: clean(c.name, 40),
        unit,
        word: unit === 'count' ? clean(c.word, 20) : '',
        link: unit === 'min' && LINKS.includes(c.link) ? c.link : '',
        goal: Number(c.goal) >= 1 ? whole(c.goal, 1, UNITS[unit].max) : UNITS[unit].goal,
        from: c.from,
        until: c.until,
        hand,
        stopped: !!c.stopped,
        closed: !!c.closed,
        remindAt: okTime(c.remindAt) ? c.remindAt : '',
      };
    });
}

/** A new goal: from a day (default today) for `days` days (default until the end of the year). */
export function newZiel({ today, name, unit = 'min', word = '', link = '', goal, from = today, until, days, id = `tz-${today}-${Math.random().toString(36).slice(2, 7)}` }) {
  const u = UNIT_KEYS.includes(unit) ? unit : 'min';
  const end = until && until >= from ? until : days > 0 ? addDays(from, Math.round(days) - 1) : `${from.slice(0, 4)}-12-31`;
  return tageszieleOf([{ id, name, unit: u, word, link, goal: goal || UNITS[u].goal, from, until: end, hand: {}, stopped: false, closed: false }])[0] ?? null;
}

/** The amount added by hand on a day. */
export const handOnly = (c, day) => (c?.hand?.[day] ?? []).reduce((n, m) => n + m, 0);
/** The amount of a day: added by hand plus what the linked page counted by itself (`auto`, per day, never stored). */
export const handSum = (c, day) => handOnly(c, day) + (c?.auto?.[day] ?? 0);
/**
 * «Belongs to: Meditation»: the minutes of the sessions per day, from the rows of flowLog, added to the goals that are linked
 * (from their first to their last day). The goals come back as new objects; `tageszieleOf` drops `auto` again on saving.
 */
export function withAuto(list, log) {
  const sums = {};
  for (const l of log ?? []) if (l?.actId === 'meditation' && isDay(l.day) && Number.isFinite(l.min) && l.min > 0) sums[l.day] = (sums[l.day] ?? 0) + Math.round(l.min);
  return (list ?? []).map((c) => {
    if (c.link !== 'meditation') return c;
    const auto = {};
    for (const [d, n] of Object.entries(sums)) if (d >= c.from && d <= c.until) auto[d] = n;
    return { ...c, auto };
  });
}
/** Add an amount to a day (whole numbers; never more than a day holds). */
export function addAmount(c, day, n) {
  const m = whole(n, 0, UNITS[c?.unit]?.max ?? 1440);
  if (!c || !m) return c;
  const cur = c.hand[day] ?? [];
  const room = UNITS[c.unit].max - handOnly(c, day);
  return { ...c, hand: { ...c.hand, [day]: [...cur, Math.min(m, room)].filter((x) => x > 0) } };
}
/** Take the last added amount of a day back (Undo). */
export function undoAmount(c, day) {
  const cur = c?.hand?.[day] ?? [];
  if (!cur.length) return c;
  const hand = { ...c.hand };
  if (cur.length > 1) hand[day] = cur.slice(0, -1);
  else delete hand[day];
  return { ...c, hand };
}

/** Take a ticked day back: the last added amounts go until the day is under the goal again (the tick of «Tick off»). */
export function untick(c, day) {
  let next = c;
  while (next && handSum(next, day) >= next.goal && (next.hand[day] ?? []).length) next = undoAmount(next, day);
  return next;
}
/** «Tick off»: the amount that is missing to the goal today (0 when it is reached). */
export const missing = (c, day) => Math.max(0, (c?.goal ?? 0) - handSum(c, day));

/**
 * Where a goal stands today.
 * → { phase: 'soon'|'running'|'over'|'stopped', dayNo, total, today: { total, left, done }, doneN, missed, streak, days }
 * days: every day up to the end as 'ok' | 'miss' | 'today' | 'todo'.
 */
export function standing(c, today) {
  if (!c?.from) return null;
  const total = daysBetween(c.from, c.until) + 1;
  const phase = c.stopped ? 'stopped' : today < c.from ? 'soon' : today > c.until ? 'over' : 'running';
  const last = today > c.until ? c.until : today;
  const done = (d) => handSum(c, d) >= c.goal;
  let doneN = 0;
  let missed = 0;
  const days = [];
  for (let i = 0; i < total; i++) {
    const d = addDays(c.from, i);
    if (d > last || phase === 'soon') days.push({ day: d, state: 'todo' });
    else if (done(d)) (doneN++, days.push({ day: d, state: 'ok', n: handSum(c, d) }));
    else if (d === today && phase === 'running') days.push({ day: d, state: 'today', n: handSum(c, d) });
    else (missed++, days.push({ day: d, state: 'miss', n: handSum(c, d) }));
  }
  let streak = 0;
  for (let d = last, first = true; d >= c.from; d = addDays(d, -1), first = false) {
    if (done(d)) streak++;
    else if (!(first && d === today && phase === 'running')) break;
  }
  const now = handSum(c, today);
  return {
    phase,
    dayNo: phase === 'soon' ? 0 : Math.min(total, daysBetween(c.from, last) + 1),
    total,
    today: { total: now, left: Math.max(0, c.goal - now), done: now >= c.goal },
    doneN,
    missed,
    streak,
    days,
  };
}

/**
 * The days of the phone reminder of one goal: from today up to `ahead` days, while it runs. A day that already reaches the
 * goal is left out. → [{ day }] (empty without a time, ended by hand or closed)
 */
export function remindDays(c, today, ahead = 14) {
  if (!c?.remindAt || c.stopped || c.closed) return [];
  const out = [];
  for (let i = 0; i <= ahead; i++) {
    const d = addDays(today, i);
    if (d < c.from) continue;
    if (d > c.until) break;
    if (handSum(c, d) >= c.goal) continue;
    out.push({ day: d });
  }
  return out;
}

/** The goals that run today (not ended by hand, not closed, the last day not passed). */
export const running = (list, today) => (list ?? []).filter((c) => !c.stopped && !c.closed && today <= c.until);
/** One goal changed or added in the list (by id). */
export const putZiel = (list, c) => (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c].slice(0, MAX_ZIELE));
export const removeZiel = (list, id) => list.filter((x) => x.id !== id);
