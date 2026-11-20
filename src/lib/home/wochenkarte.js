/**
 * «Wochenrückblick» as a card on Heute (Noah 10.11.2026 «1b»: the Sunday brief also lives in the app): from Sunday 17:00
 * until Monday 12:00 the card shows the finished week in three numbers (time, km, sessions, each with its change against
 * the week before), on Sundays the own tasks that slide to Monday, and leads to the review or to «Woche planen».
 * It does not replace the window «Your week in review» (Sunday from 18:00, windows.js; Noah 19.11.2026 «3a»): the card is
 * quiet and stays on Heute, the window asks once. «Not today» puts the card away until tomorrow, the main button
 * until the next Sunday. Pure rules: no database, no clock (stamps 'YYYY-MM-DDTHH:MM', local time).
 */
import { mondayOf, shiftDay } from '../training.js';
import { dayOfStamp } from './windows.js';

/** The settings record: { off?: day, done?: the Sunday of the week it was opened for }. */
export const CARD_KEY = 'homeWeekCard';
export const CARD_FROM = '17:00';
export const CARD_UNTIL = '12:00';
/** The keys of weekFive the card shows, in this order. */
export const CARD_KEYS = ['hours', 'km', 'n'];

const dow = (day) => new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 Sunday … 6 Saturday
const hmOf = (stamp) => String(stamp ?? '').slice(11, 16);

/**
 * The week the card is about, or null outside its time: Sunday from 17:00 (the running week) and Monday until 12:00
 * (the week just finished). → { monday, sunday, isSunday } (sunday is the id of the week).
 */
export function cardWeek(now) {
  const day = dayOfStamp(now);
  if (!day) return null;
  const d = dow(day);
  if (d === 0 && hmOf(now) >= CARD_FROM) return { monday: mondayOf(day), sunday: day, isSunday: true };
  if (d === 1 && hmOf(now) < CARD_UNTIL) {
    const monday = shiftDay(mondayOf(day), -7);
    return { monday, sunday: shiftDay(monday, 6), isSunday: false };
  }
  return null;
}

/** Whether the card may show: in its time, not put away today, not opened for this week. */
export function cardShown(rec, now) {
  const w = cardWeek(now);
  if (!w) return null;
  const r = rec ?? {};
  if (r.off === dayOfStamp(now) || r.done === w.sunday) return null;
  return w;
}

/** The record after «Not today» and after the main button. */
export const cardAway = (rec, now) => ({ ...(rec ?? {}), off: dayOfStamp(now) });
export const cardDone = (rec, week) => ({ ...(rec ?? {}), done: week.sunday });

/** The numbers of the card out of weekFive's rows: hours, km, sessions; each { key, value, diff }. */
export const cardNumbers = (five = []) => CARD_KEYS.map((k) => five.find((f) => f.key === k)).filter(Boolean).map(({ key, value, diff }) => ({ key, value, diff }));

/** The own tasks that would slide to Monday: how many, and the first titles (at most `show`). */
export const cardOpen = (close, show = 3) => ({ n: close?.move?.length ?? 0, titles: (close?.move ?? []).slice(0, show).map((m) => m.title).filter(Boolean) });
