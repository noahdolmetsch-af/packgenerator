/**
 * «Zeitplan» (Noah 21.11.2026 «V4 ok»): Training opens the week as a schedule: every day lists what is on it with the
 * time (own sessions, TrainingPeaks, suggestions of the weekly plan, dates), and a free slot per day to tap.
 * Pure: no clock, no database, no texts. The page turns the rows into words through t().
 */

export const DAY_FROM = 7 * 60; // the day starts at 07:00 for the free slot
export const DAY_TO = 21 * 60; // and ends at 21:00
export const MIN_FREE = 60; // a free slot is at least one hour long
export const MAX_FREE = 180; // a free slot is shown at most three hours long

/** «HH:MM» → minutes since midnight, or null for anything else. */
export function toMin(t) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutes → «HH:MM». */
export const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** A time as the sessions keep it: «HH:MM» or '' (anything else is dropped). */
export const cleanTime = (t) => (toMin(t) == null ? '' : String(t));

/**
 * The longest gap of a day that is free, between DAY_FROM and DAY_TO: [{ from, to }] busy in minutes → { from, to } or null.
 * The first gap wins when two are equally long; a gap shorter than MIN_FREE is no slot; a longer one shows its first MAX_FREE minutes.
 */
export function freeSlot(busy, { from = DAY_FROM, to = DAY_TO, min = MIN_FREE, max = MAX_FREE } = {}) {
  const list = busy
    .filter((b) => b && b.to > b.from)
    .map((b) => ({ from: Math.max(b.from, from), to: Math.min(b.to, to) }))
    .filter((b) => b.to > b.from)
    .sort((a, b) => a.from - b.from);
  let best = null;
  let at = from;
  const take = (a, b) => {
    if (b - a >= min && (!best || b - a > best.to - best.from)) best = { from: a, to: b };
  };
  for (const b of list) {
    if (b.from > at) take(at, b.from);
    at = Math.max(at, b.to);
  }
  take(at, to);
  return best && best.to - best.from > max ? { from: best.from, to: best.from + max } : best;
}

/** The rows of one day in their order: the ones with a time by time, then the ones without. */
export const sortRows = (rows) =>
  [...rows].sort((a, b) => {
    const x = toMin(a.time);
    const y = toMin(b.time);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return x - y;
  });

/** What a row occupies of the day: only a row with a time and a length counts. */
export const busyOf = (rows) => rows.filter((r) => toMin(r.time) != null && r.mins > 0).map((r) => ({ from: toMin(r.time), to: toMin(r.time) + r.mins }));
