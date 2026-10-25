/**
 * Paket A «Ehrlicher Stand im Alltag» (Noah 24.10.2026 «1b 2a 3b 4b 5a», 996 Ideen; 25.10 «kannst du mit A …
 * anfangen?»), part 1 «Warten und Enden»:
 *
 *   Waiting   UC-255-I1  A to-do can wait on something: an answer, a part, someone else, a date. It leaves
 *                        «Overdue» and stands under «Waiting» with its reason and the day to check again.
 *                        Stored on the to-do: todo.wait = { on: WAIT_ON key, note?, check: 'YYYY-MM-DD' }.
 *   List end  UC-255-I2  An own list can be finished, put away or dropped, without ticking every point.
 *                        Stored on the list: list.ended = { how: LIST_ENDS key, at } (Undo: «Open again»).
 *   Goal end  UC-264-I2  A goal ends as reached, changed or let go, each with an optional reason.
 *                        Stored on the goal: goal.done = true and goal.end = { how: GOAL_ENDS key, why?, at }.
 *
 * Pure functions, tested in tests/stand.test.js. Labels are English keys for t().
 */
import { addDays } from '../merken.js';

/** What a to-do can wait on. */
export const WAIT_ON = [
  { key: 'answer', name: 'An answer' },
  { key: 'part', name: 'A part or a delivery' },
  { key: 'person', name: 'Someone else' },
  { key: 'date', name: 'A date' },
];
/** A new wait checks again after this many days. */
export const WAIT_CHECK_DAYS = 3;

/** The wait of a to-do made safe, or null. */
export function waitOf(todo) {
  const w = todo?.wait;
  if (!w || !WAIT_ON.some((x) => x.key === w.on)) return null;
  return { on: w.on, note: String(w.note ?? '').trim().slice(0, 120), check: /^\d{4}-\d{2}-\d{2}$/.test(w.check ?? '') ? w.check : null };
}

/** A fresh wait from today. */
export const newWait = (on, today, note = '') => ({ on, note: String(note).trim().slice(0, 120), check: addDays(today, WAIT_CHECK_DAYS) });

/** Still waiting: the next check moves on by WAIT_CHECK_DAYS from today. */
export const stillWaiting = (wait, today) => ({ ...wait, check: addDays(today, WAIT_CHECK_DAYS) });

/** Open to-dos that wait, those to check now first, then by their check day. [{ todo, wait, now }] */
export function waitingRows(todos, today) {
  return (todos ?? [])
    .filter((td) => td && !td.doneAt && !td.off && !td.kind && waitOf(td))
    .map((td) => {
      const wait = waitOf(td);
      return { todo: td, wait, now: !!wait.check && wait.check <= today };
    })
    .sort((a, b) => Number(b.now) - Number(a.now) || (a.wait.check ?? '9999').localeCompare(b.wait.check ?? '9999'));
}

/** The to-dos without a wait (for the date groups of Merken). */
export const notWaiting = (todos) => (todos ?? []).filter((td) => !waitOf(td));

/* ---------- lists end ---------- */

export const LIST_ENDS = [
  { key: 'done', name: 'Finished', sub: 'It did its job, even with open points' },
  { key: 'away', name: 'Put away', sub: 'Not now, maybe later again' },
  { key: 'dropped', name: 'Dropped', sub: 'It does not fit any more' },
];
export const endList = (list, how, now = new Date().toISOString()) => (LIST_ENDS.some((x) => x.key === how) ? { ...list, ended: { how, at: now } } : list);
export const reopenList = (list) => {
  const { ended: _e, ...rest } = list;
  return rest;
};
export const isEnded = (list) => !!list?.ended && LIST_ENDS.some((x) => x.key === list.ended.how);

/* ---------- goals end ---------- */

export const GOAL_ENDS = [
  { key: 'reached', name: 'Reached' },
  { key: 'changed', name: 'Changed' },
  { key: 'letgo', name: 'Let go' },
];
export function endGoal(goal, how, why = '', now = new Date().toISOString()) {
  if (!GOAL_ENDS.some((x) => x.key === how)) return goal;
  const w = String(why ?? '').trim().slice(0, 200);
  return { ...goal, done: true, end: { how, ...(w ? { why: w } : {}), at: now } };
}
export function reopenGoal(goal) {
  const { end: _e, ...rest } = goal;
  return { ...rest, done: false };
}
/** How a finished goal ended: an older goal ticked «Reached» before part 1 counts as reached. */
export const goalEnd = (goal) => (!goal?.done ? null : GOAL_ENDS.some((x) => x.key === goal.end?.how) ? goal.end : { how: 'reached' });

/* ---------- part 2: honest state ---------- */

/**
 * UC-259-I2 «Kündigung ist ein Vorgang»: a contract's cancellation in three steps, each with its own day, and
 * a note for the proof (registered letter number, mail, screenshot). Only «confirmed» ends the contract; until
 * then the reminder stays. Stored on the contract: c.cancel = { drafted?, sent?, confirmed?, proof? }.
 */
export const CANCEL_STEPS = [
  { key: 'drafted', name: 'Written' },
  { key: 'sent', name: 'Sent by me' },
  { key: 'confirmed', name: 'End confirmed' },
];
const DAYRE = /^\d{4}-\d{2}-\d{2}$/;
/** The cancellation made safe, or null when nothing is set. */
export function cancelOf(c) {
  if (!c || typeof c !== 'object') return null;
  const out = {};
  for (const s of CANCEL_STEPS) if (DAYRE.test(c[s.key] ?? '')) out[s.key] = c[s.key];
  const proof = String(c.proof ?? '').trim().slice(0, 200);
  if (proof) out.proof = proof;
  return Object.keys(out).length ? out : null;
}
/** Where the cancellation of a contract stands: null | 'drafted' | 'sent' | 'confirmed' (the furthest step with a day). */
export function cancelState(contract) {
  const k = cancelOf(contract?.cancel);
  if (!k) return null;
  return [...CANCEL_STEPS].reverse().find((s) => k[s.key])?.key ?? null;
}
/** A step done today, or taken back (a second tap). Confirmed also stops the contract (no reminder, not in the sum). */
export function cancelStep(contract, key, today) {
  const k = { ...(cancelOf(contract.cancel) ?? {}) };
  if (k[key]) delete k[key];
  else k[key] = today;
  const cancel = cancelOf(k);
  const next = { ...contract, ...(cancel ? { cancel } : {}) };
  if (!cancel) delete next.cancel;
  if (key === 'confirmed') next.stopped = !!cancel?.confirmed;
  return next;
}

/** UC-124-I1 «Angebrochene Mengen»: how full the opened pack of a supply is (item.opened; none = closed). */
export const OPENED = [
  { key: '', name: 'Closed' },
  { key: 'much', name: 'Open, plenty left' },
  { key: 'little', name: 'Open, little left' },
  { key: 'unknown', name: 'Open, not sure how much' },
];
/** The item with the opened state set ('' clears it). */
export function setOpened(item, key) {
  const next = { ...item };
  if (OPENED.some((o) => o.key === key && key)) next.opened = key;
  else delete next.opened;
  return next;
}

/**
 * UC-189-I1 «Pflege nicht nur bestätigen»: after a wet ride, besides «Done: chain oiled», say what really
 * happened: only wiped, or not today. The hint rests for today and a to-do for tomorrow keeps the rest.
 * Stored: settings WET_LATER_KEY = { [bikeId]: { day, how: 'wiped' | 'later' } }.
 */
export const WET_LATER_KEY = 'stand.wetLater';
export const WET_LATER = [
  { key: 'wiped', name: 'Only wiped, oil later' },
  { key: 'later', name: 'Not today' },
];
export const wetRests = (value, bikeId, today) => value?.[bikeId]?.day === today;

/* ---------- part 3: time ---------- */

/**
 * UC-228-I1 «Puffer als echter Planeintrag»: a date in «Woche planen» can get time before it (getting ready,
 * the way there) and after it (the way back, tidying up) as its own entries, so the gap is visible and kept.
 * The buffers are plain dates of the week (kind 'date'); their title says what they belong to.
 */
export const BUFFER_MIN = [0, 15, 30, 60, 90];
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const minOf = (time) => (/^\d{2}:\d{2}$/.test(time ?? '') ? +time.slice(0, 2) * 60 + +time.slice(3, 5) : null);
/**
 * The buffer entries for a date: [{ kind:'date', title, day, time }]. before/after in minutes; names(side, title, min)
 * gives the title in the person's language. Before a date without a time, or before midnight, the buffer has no time.
 */
export function bufferItems(item, { before = 0, after = 0 } = {}, names = (side, title, min) => `${side === 'before' ? 'Before' : 'After'}: ${title} (${min} min)`) {
  if (!item?.day || item.kind !== 'date') return [];
  const at = minOf(item.time);
  const out = [];
  if (before > 0) out.push({ kind: 'date', title: names('before', item.title, before).slice(0, 80), day: item.day, time: at != null && at - before >= 0 ? hm(at - before) : '' });
  if (after > 0) out.push({ kind: 'date', title: names('after', item.title, after).slice(0, 80), day: item.day, time: '' });
  return out;
}

/** UC-259-I1 «Abo mit tatsächlichem Nutzen»: now and then a line on what a contract was used for (contract.uses, newest first). */
export const USES_MAX = 30;
/** The use lines made safe: [{ day, what }], newest first, at most USES_MAX. */
export function usesOf(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((u) => u && DAYRE.test(u.day ?? '') && String(u.what ?? '').trim())
    .map((u) => ({ day: u.day, what: String(u.what).trim().slice(0, 80) }))
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
    .slice(0, USES_MAX);
}
/** The contract with one more use today; an empty text changes nothing. */
export function addUse(contract, what, today) {
  const w = String(what ?? '').trim();
  if (!w) return contract;
  return { ...contract, uses: usesOf([{ day: today, what: w }, ...(contract.uses ?? [])]) };
}
/** The contract without the use at index i (of usesOf). */
export function removeUse(contract, i) {
  const uses = usesOf(contract.uses).filter((_, n) => n !== i);
  const next = { ...contract, uses };
  if (!uses.length) delete next.uses;
  return next;
}
/** Uses in the last 365 days and the cost per use over that year (null without a cost or without uses). */
export function useYear(contract, today) {
  const from = addDays(today, -365);
  const n = usesOf(contract?.uses).filter((u) => u.day > from && u.day <= today).length;
  const cost = Number(contract?.cost) || 0;
  const year = contract?.period === 'year' ? cost : cost * 12;
  return { n, perUse: n && year ? Math.round((year / n) * 100) / 100 : null };
}

/** UC-258-I1 «Einkauf nach geplanter Verwendung»: a shopping point may name what it is for (item.for: recipe, guests, trip). */
export const forOf = (x) => String(x?.for ?? '').trim().slice(0, 60);
/** The purposes on the list with their open points, by name: [{ name, open }]. */
export function purposes(items = []) {
  const m = new Map();
  for (const x of items) {
    const f = forOf(x);
    if (!f) continue;
    const key = f.toLowerCase();
    const cur = m.get(key) ?? { name: f, open: 0 };
    if (!x.done) cur.open++;
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}
/** A plan fell through: the list without the open points for it (ticked ones stay, they were bought). */
export function dropPurpose(list, name) {
  const key = String(name ?? '').trim().toLowerCase();
  return { ...list, items: (list.items ?? []).filter((x) => x.done || forOf(x).toLowerCase() !== key) };
}

/** UC-007-I2 «Kaufpause mit Wiedersehen»: a wish may wait 30 days (item.wishPause = the day it asks again). */
export const PAUSE_DAYS = 30;
export const pauseWish = (item, today) => ({ ...item, wishPause: addDays(today, PAUSE_DAYS) });
export function endPause(item) {
  const next = { ...item };
  delete next.wishPause;
  return next;
}
/** null without a pause, else { until, over } (over: the day has come, time to ask again). */
export function wishPauseState(item, today) {
  const until = item?.wishPause;
  if (!DAYRE.test(until ?? '')) return null;
  return { until, over: until <= today };
}

/** UC-008-I1 «Grund für Nichtnutzung»: why an item was along but never used (item.neverWhy), each with its own next step. */
export const NEVER_WHY = [
  { key: '', name: 'Why not used?', next: '' },
  { key: 'forgot', name: 'Forgot I had it', next: 'Next time: pack it where you see it.' },
  { key: 'unfit', name: 'Did not fit the trip', next: 'Next time: leave it at home on such trips, or pass it on.' },
  { key: 'reserve', name: 'Reserve, good to have', next: 'Stays along as a reserve; not using it is fine.' },
  { key: 'season', name: 'Wrong season', next: 'Waits for its season; it comes back then.' },
];
export function setNeverWhy(item, key) {
  const next = { ...item };
  if (NEVER_WHY.some((w) => w.key && w.key === key)) next.neverWhy = key;
  else delete next.neverWhy;
  return next;
}
export const neverNext = (item) => NEVER_WHY.find((w) => w.key && w.key === item?.neverWhy)?.next ?? '';
