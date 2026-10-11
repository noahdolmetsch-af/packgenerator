/**
 * v0.94.0 «Kachel-Wand» (Noah 4a, idea 6): ONE series over everything. A week (Monday to Sunday)
 * counts when anything happened in it: a ride, a day of a trip, or any activity of Im Flow
 * (meditation, yoga, tennis, gym, a commute …). A rest week the user set keeps the series without
 * adding to it. The running week does not break the series until it is over.
 * Milestones of the series: 2, 4, 8, 12, 26, 52 and 104 weeks; heute.js celebrates them.
 * Pure functions, tested in tests/series.test.js. Days are calendar days (YYYY-MM-DD, Europe/Zurich).
 */
import { weekOf } from './heute.js';
import { tripDone } from '../yearreview.js';

export const REST_KEY = 'seriesRest';
export const SERIES_STEPS = [2, 4, 8, 12, 26, 52, 104];
/** How many weeks the tile shows. */
export const WEEKS_SHOWN = 8;

const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);
const day = (n) => new Date(n).toISOString().slice(0, 10);
const prevWeek = (w) => day(ms(w) - 7 * 864e5);
const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x);

/** Every day with something done: Im Flow entries, ride dates, the days of trips that happened. */
export function activeDays({ log = [], rides = [], trips = [], debriefs = [], today }) {
  const out = new Set();
  for (const e of log) if (isDay(e?.day) && e.day <= today) out.add(e.day.slice(0, 10));
  for (const r of rides) if (isDay(r?.date) && r.date.slice(0, 10) <= today) out.add(r.date.slice(0, 10));
  for (const x of trips) {
    if (!tripDone(x, debriefs, today)) continue;
    const n = Math.max(1, Math.min(60, Number(x.days) || 1));
    for (let i = 0; i < n; i++) {
      const d = day(ms(x.startDate) + i * 864e5);
      if (d <= today) out.add(d);
    }
  }
  return out;
}

/** The rest weeks stored (Mondays), made safe. */
export const restOf = (value) => (Array.isArray(value) ? value.filter((w) => isDay(w) && weekOf(w) === w) : []);
/** Rest this week or not (the stored list, with this week's Monday added or taken away). */
export function toggleRest(value, today) {
  const w = weekOf(today);
  const list = restOf(value);
  return list.includes(w) ? list.filter((x) => x !== w) : [...list, w].sort();
}

/**
 * The series now. days: Set of active days (activeDays); rest: Mondays of rest weeks.
 * → { n, record, active (this week has something), rest (this week is a rest week), weeks: the last
 *   WEEKS_SHOWN weeks oldest first [{ week, on, rest, now }], next: the next milestone or null, left }
 */
export function seriesOf(days = new Set(), rest = [], today) {
  const on = new Set([...days].map((d) => weekOf(d)));
  const off = new Set(restOf(rest));
  const now = weekOf(today);
  const kept = (w) => on.has(w) || off.has(w);
  // the running series: this week only counts once it has something (or is a rest week)
  let w = kept(now) ? now : prevWeek(now);
  let n = 0;
  while (kept(w)) {
    if (on.has(w)) n++;
    w = prevWeek(w);
  }
  // the record: the longest run over all weeks with something
  let record = 0;
  if (on.size) {
    const first = [...on].sort()[0];
    let run = 0;
    for (let x = first; x <= now; x = day(ms(x) + 7 * 864e5)) {
      if (on.has(x)) run++;
      else if (!off.has(x) && x !== now) run = 0;
      record = Math.max(record, run);
    }
  }
  const weeks = [];
  for (let i = WEEKS_SHOWN - 1, x = now; i >= 0; i--) {
    weeks.unshift({ week: x, on: on.has(x), rest: off.has(x), now: x === now });
    x = prevWeek(x);
  }
  const next = SERIES_STEPS.find((s) => s > n) ?? null;
  return { n, record: Math.max(record, n), active: on.has(now), rest: off.has(now), weeks, next, left: next ? next - n : 0 };
}
