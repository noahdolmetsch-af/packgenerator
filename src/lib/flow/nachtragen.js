/**
 * «Gestern nachtragen» (Noah 19.11.2026 «1-5a», 21.11.2026 «bitte hiermit fortfahren», Thread «Training erfassen vereinfachen»):
 * the tick window can tick off a training of an earlier day. The entry is the same as always: `day` is the day it
 * counts on (Geschafft, the weekly goals, Auswerten read `day`), `at` the moment (only for the order within a day).
 * No new field, no new table: `day` and `at` are in every entry since «Im Flow».
 */
import { addDays } from '../flow.js';

/** How far back a day can be picked by hand: a year (the quick chips go two days back). */
export const BACK_MAX = 365;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** The quick choices: today, yesterday, the day before. */
export const quickDays = (today) => [today, addDays(today, -1), addDays(today, -2)];

/** A day from the date field: a real calendar day from a year ago up to today, else null. */
export function pickedDay(value, today) {
  const v = String(value ?? '').trim();
  if (!DAY.test(v)) return null;
  if (Number.isNaN(Date.parse(`${v}T12:00:00Z`)) || addDays(v, 0) !== v) return null; // 2026-02-31 is no day
  if (v > today || v < addDays(today, -BACK_MAX)) return null;
  return v;
}

/** The time field «HH:MM», or null when it is empty or no time of the day. */
export const pickedTime = (value) => (TIME.test(String(value ?? '').trim()) ? String(value).trim() : null);

/**
 * The moment of the entry as ISO text, or undefined when «now» is right (today without a time).
 * An earlier day without a time sits at noon of that day; a time in the future of today is «now».
 */
export function momentOf(day, time, today, now = new Date()) {
  const tm = pickedTime(time);
  if (day === today && !tm) return undefined;
  const d = new Date(`${day}T${tm ?? '12:00'}:00`); // the device's own clock, as the day itself
  if (Number.isNaN(d.getTime())) return undefined;
  return (d > now ? now : d).toISOString();
}

/* ---------- «Gestern nichts abgehakt? Nachtragen» (the quiet hint in the morning on Aktiv) ---------- */
/** The hint is hidden for the day on this device (a convenience of the device, no data). */
export const HINT_NO_KEY = 'nachtragNo';
/** The hint stands until noon. */
export const HINT_UNTIL_HOUR = 12;
/** Somebody who ticked something in the last two weeks gets it; a new user does not. */
export const HINT_LOOKBACK = 14;

/**
 * Show the hint? In the morning, when yesterday has no tick and the last two weeks had at least one
 * (so someone who just started is not told off). `log` is the flowLog, `hour` the hour of the device.
 */
export function showNachtragHint(log = [], today, hour) {
  if (hour >= HINT_UNTIL_HOUR) return false;
  const yesterday = addDays(today, -1);
  if (log.some((e) => e.day === yesterday)) return false;
  const from = addDays(today, -HINT_LOOKBACK);
  return log.some((e) => e.day >= from && e.day < yesterday);
}
