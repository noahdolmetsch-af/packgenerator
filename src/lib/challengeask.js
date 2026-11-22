/**
 * «Challenges» PR 4 (Noah 22.11.2026 «c»): the question every 10 days: «Do you want a new challenge, a milestone or a
 * crazy idea?». Two places: a phone message at 18:00 (push kind `challengeask`, off until switched on) and a card at the
 * top of the page «Challenges» with three buttons and «Later». It never blocks anything.
 *
 * The record (settings key `challengeask`, travels in every backup and in the device sync):
 *   { last: 'YYYY-MM-DD' | '', later: 'YYYY-MM-DD' | '' }
 *   last: the day you answered (a button); later: the day «Later» asked again (the day after you tapped it).
 * Pure functions, tested in tests/challengeask.test.js.
 */
import { addDays } from './flow.js';

export const ASK_KEY = 'challengeask';
export const ASK_EVERY = 10;
export const ASK_AT = '18:00';

const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);

/** The stored record made safe. */
export function askOf(value) {
  return { last: isDay(value?.last) ? value.last : '', later: isDay(value?.later) ? value.later : '' };
}
/** The day the question is next due: 10 days after the last answer, or the day «Later» named (whichever is later); `today` when never asked. */
export function askDay(rec, today) {
  const r = askOf(rec);
  const base = r.last ? addDays(r.last, ASK_EVERY) : today;
  return r.later && r.later > base ? r.later : base;
}
/** Is the card shown today? */
export const askDue = (rec, today) => askDay(rec, today) <= today;
/** An answer (a button): the next question comes in 10 days. */
export const answered = (today) => ({ last: today, later: '' });
/** «Later»: the same question again tomorrow. The answer of before stays. */
export const postponed = (rec, today) => ({ ...askOf(rec), later: addDays(today, 1) });
