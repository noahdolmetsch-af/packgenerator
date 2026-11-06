/**
 * «Ruhetag-Hinweis» (Noah 05.11.2026, Ideen für alle Bereiche, Aktiv 4a): after three hard days in a row one gentle
 * line on Aktiv («Heute locker?»). Only watching, never a duty, never a diagnosis; «Nicht heute» hides it for the day
 * and the area «Performance tips» (Ich › Aussehen › Vorschläge) switches it off for good.
 *
 * A day is hard when its load (form.js dayLoads: power, else Strava effort, else pulse and time) is high for the person
 * themselves: at or above their own upper quarter of the last 42 days, and never below HARD_MIN. With fewer than
 * MIN_DAYS active days there is no own norm yet, so only HARD_FIRST counts. Pure, tested in tests/ruhetag.test.js.
 *
 * Setting RUHETAG_NO_KEY = 'YYYY-MM-DD': the day «Nicht heute» hid the line.
 */
import { addDays } from './flow.js';

export const RUHETAG_NO_KEY = 'flow.ruhetagNo';
/** Hard days in a row from which the line shows. */
export const HARD_STREAK = 3;
/** A day is never hard below this load (about an easy hour). */
export const HARD_MIN = 60;
/** Without a norm of the person's own (fewer active days), this load is hard. */
export const HARD_FIRST = 90;
/** The days that make the person's own norm, and how many active ones it needs. */
export const NORM_DAYS = 42;
export const MIN_DAYS = 8;
/** The share of active days that counts as «upper»: the load at or above the upper quarter. */
export const UPPER = 0.75;

/** The load from which a day is hard for this person: { hard, own (a norm of the person's own) }. */
export function hardFrom(loads, today) {
  const from = addDays(today, -NORM_DAYS);
  const v = [...loads].filter(([d, l]) => d > from && d < today && l > 0).map(([, l]) => l).sort((a, b) => a - b);
  if (v.length < MIN_DAYS) return { hard: HARD_FIRST, own: false };
  const q = v[Math.min(v.length - 1, Math.floor(v.length * UPPER))];
  return { hard: Math.max(HARD_MIN, Math.round(q)), own: true };
}

/**
 * The hint: null, or { n (hard days in a row), todayHard (today is one of them), hard (the load that counts as hard),
 * days [YYYY-MM-DD, newest first] }. A streak ends today when today is hard, else yesterday (today is still open); a
 * day that is easy or without a load ends it. Not shown when today already is easy (the person did rest).
 * loads: Map day → load (form.js dayLoads).
 */
export function ruhetagHint({ loads = new Map(), today, hiddenOn = null } = {}) {
  if (hiddenOn === today) return null;
  const { hard } = hardFrom(loads, today);
  const isHard = (d) => (loads.get(d) ?? 0) >= hard;
  const todayHard = isHard(today);
  if (!todayHard && (loads.get(today) ?? 0) > 0) return null;
  const days = [];
  let d = todayHard ? today : addDays(today, -1);
  while (isHard(d) && days.length < 30) {
    days.push(d);
    d = addDays(d, -1);
  }
  return days.length >= HARD_STREAK ? { n: days.length, todayHard, hard, days } : null;
}
