/**
 * «Haken-Verlauf» (Noah 27.11.2026 «1a 2a 3a 4a 5a», thread «Abhaken auf einen Blick verbessern»): which activity was ticked on which day,
 * as one grid on Auswerten › Woche. Pure rules, no page, no database. The page is src/lib/flow/HakenVerlauf.svelte.
 * Up to 31 days: one column per day. Longer (3 months, a year): one column per week (Monday to Sunday), its shade says on how
 * many days of the week there was a tick. What counts as a tick is the same as on Heute (entriesFor: own entries, «zählt auch», trip days).
 * Observation only: nothing is graded.
 */
import { addDays, entriesFor, normAct, RINGS } from '../flow.js';

/** The periods to choose, in days ending today. */
export const SPANS = [10, 30, 90, 365];
export const SPAN_DEFAULT = 10;
/** From this many days on a column is a week, not a day. */
export const WEEK_FROM = 32;

const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
export const mondayOf = (day) => addDays(day, -dow(day));
export const spanOf = (n) => (SPANS.includes(Number(n)) ? Number(n) : SPAN_DEFAULT);

/** The days of the period, oldest first, ending today. */
export function daysOf(today, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

/**
 * The columns: { key, from, to, days (the days of the period inside it), week: bool }.
 * Day columns for n < WEEK_FROM, else one per week; the first and last week may be partly outside the period (they count only what is inside).
 */
export function columnsOf(today, n) {
  const days = daysOf(today, n);
  if (n < WEEK_FROM) return days.map((d) => ({ key: d, from: d, to: d, days: [d], week: false, today: d === today, weekend: dow(d) >= 5 }));
  const cols = [];
  for (const d of days) {
    const m = mondayOf(d);
    const last = cols[cols.length - 1];
    if (last && last.from === m) last.days.push(d);
    else cols.push({ key: m, from: m, to: addDays(m, 6), days: [d], week: true, today: false, weekend: false });
  }
  for (const c of cols) c.today = c.days.includes(today);
  return cols;
}

/**
 * The rows: the activities (not paused) with a tick in the period, grouped by ring in the order of the rings, and per group the most days first
 * (the same days: the order of Heute). Each row: { act, ring, cells: [days with a tick in the column], n (days with a tick), days: Set }.
 * Not shown as rows: the activities without any tick in the period, they come back as `quiet` (their order).
 * actsList: db.flowActs; log: the entries of the period; tripDayList: from tripDays().
 */
export function rowsOf({ acts = [], log = [], tripDayList = [], today, n }) {
  const cols = columnsOf(today, n);
  const from = cols[0].days[0];
  const rows = [];
  const quiet = [];
  for (const a of acts.map(normAct).filter((x) => !x.paused).sort((x, y) => x.order - y.order)) {
    const days = new Set(entriesFor(a, log, tripDayList).filter((e) => e.day >= from && e.day <= today).map((e) => e.day));
    if (!days.size) {
      quiet.push(a);
      continue;
    }
    rows.push({ act: a, ring: a.ring, cells: cols.map((c) => c.days.filter((d) => days.has(d)).length), n: days.size, days });
  }
  const groups = RINGS.map((ring) => ({ ring, rows: rows.filter((r) => r.ring === ring).sort((x, y) => y.n - x.n) })).filter((g) => g.rows.length);
  return { cols, groups, quiet, from };
}

/** On how many days of the period there was at least one tick (of any activity shown), and how many days the period has. */
export function daysWithTick(groups = []) {
  const all = new Set();
  for (const g of groups) for (const r of g.rows) for (const d of r.days) all.add(d);
  return all.size;
}

/** The shade of a week cell (0 … 1): days with a tick of 7, at least a faint one for a single day. */
export const shadeOf = (days) => (days > 0 ? Math.min(1, 0.3 + (days / 7) * 0.7) : 0);
