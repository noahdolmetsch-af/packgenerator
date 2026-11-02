/**
 * «Analyse» M4 «Muster und Rekorde» (Noah 27.10.2026 «alle Mockups 1:1», ideas «Saisons» and «Serien und
 * Lücken»): when in the week you do your activities, this year against last year (per month or per season),
 * your best values, and the runs and gaps of every activity. Pure: days are 'YYYY-MM-DD'. Only to look at.
 */
import { addDays } from '../analyse.js';
import { mondayOf } from './diagram.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const span = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/** The parts of the day (hours from–to, «night» goes over midnight). */
export const SLOTS = [
  { key: 'morning', from: 5, to: 11 },
  { key: 'noon', from: 11, to: 15 },
  { key: 'evening', from: 15, to: 22 },
  { key: 'night', from: 22, to: 5 },
];
export const slotOf = (h) => (h >= 5 && h < 11 ? 0 : h >= 11 && h < 15 ? 1 : h >= 15 && h < 22 ? 2 : 3);

/** The local hour of a tick (its `at` time), null without one. */
export function hourOf(e) {
  if (!e?.at) return null;
  const d = new Date(e.at);
  return Number.isNaN(d.getTime()) ? null : d.getHours();
}
const wdOf = (d) => (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;

/**
 * How many ticks per part of the day (rows) and weekday (Monday first), inside the days; ids: only these
 * activities (null = all). → { grid: number[4][7], top, most: { slot, wd } | null, least: { slot, wd } | null }
 * «least» is the smallest cell above 0 of the parts of the day that have any tick.
 */
export function weekPattern(log = [], days = [], ids = null) {
  const inside = new Set(days);
  const grid = SLOTS.map(() => Array(7).fill(0));
  for (const e of log) {
    if (!e?.day || !inside.has(e.day) || (ids && !ids.has(e.actId))) continue;
    const h = hourOf(e);
    if (h == null) continue;
    grid[slotOf(h)][wdOf(e.day)] += 1;
  }
  let most = null;
  let least = null;
  grid.forEach((row, slot) =>
    row.forEach((n, wd) => {
      if (n && (!most || n > grid[most.slot][most.wd])) most = { slot, wd };
      if (n && (!least || n < grid[least.slot][least.wd])) least = { slot, wd };
    }),
  );
  return { grid, top: Math.max(0, ...grid.flat()), most, least: least && most && (least.slot !== most.slot || least.wd !== most.wd) ? least : null };
}

const monthDays = (y, m) => {
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => addDays(first, i));
};

/**
 * One value per month of a year: the total (sum) or the mean of the days with a value; days after today
 * are left out, a month without a value is null.
 */
export function monthsOf(year, get, { sum = false, today = '9999-12-31' } = {}) {
  return Array.from({ length: 12 }, (_, i) => {
    const vals = monthDays(year, i + 1)
      .filter((d) => d <= today)
      .map((d) => fin(get(d)))
      .filter((v) => v != null);
    if (!vals.length) return null;
    const total = vals.reduce((a, b) => a + b, 0);
    return sum ? total : total / vals.length;
  });
}

/** The seasons of a calendar year: winter (Jan, Feb, Dec), spring, summer, autumn. */
export const SEASONS = [
  { key: 'winter', months: [0, 1, 11] },
  { key: 'spring', months: [2, 3, 4] },
  { key: 'summer', months: [5, 6, 7] },
  { key: 'autumn', months: [8, 9, 10] },
];

/** Months to seasons: totals add up, means are the mean of the months with a value. */
export function seasonsOf(months, sum = false) {
  return SEASONS.map((s) => {
    const vals = s.months.map((m) => months[m]).filter((v) => v != null);
    if (!vals.length) return null;
    const total = vals.reduce((a, b) => a + b, 0);
    return sum ? total : total / vals.length;
  });
}

/** The days with at least one tick of the activity (or of any when id is null), sorted. */
export function tickDaysOf(log = [], id = null) {
  return [...new Set(log.filter((e) => e?.day && (id == null || e.actId === id)).map((e) => e.day))].sort();
}

/**
 * Runs and gaps of sorted tick days up to today: the longest run (days in a row) and its last day, the run
 * still going (counting today or yesterday), the longest gap between two ticks and the days since the last.
 */
export function runsAndGaps(days = [], today) {
  const ds = days.filter((d) => d <= today);
  if (!ds.length) return { longest: 0, longestEnd: null, current: 0, gap: 0, gapEnd: null, since: null };
  let longest = 1;
  let longestEnd = ds[0];
  let run = 1;
  let gap = 0;
  let gapEnd = null;
  for (let i = 1; i < ds.length; i++) {
    const step = span(ds[i - 1], ds[i]);
    run = step === 1 ? run + 1 : 1;
    if (run > longest) {
      longest = run;
      longestEnd = ds[i];
    }
    if (step - 1 > gap) {
      gap = step - 1;
      gapEnd = ds[i];
    }
  }
  const since = span(ds.at(-1), today);
  return { longest, longestEnd, current: since <= 1 ? run : 0, gap, gapEnd, since };
}

/** The most ticks of one activity in a week (Monday to Sunday) and that week's Monday. */
export function bestWeek(log = [], id) {
  const per = new Map();
  for (const e of log) if (e?.day && e.actId === id) per.set(mondayOf(e.day), (per.get(mondayOf(e.day)) ?? 0) + 1);
  let best = null;
  for (const [key, n] of per) if (!best || n > best.n || (n === best.n && key > best.key)) best = { key, n };
  return best;
}

/** The highest (or lowest) value of the days and its day; the newest day wins a tie. */
export function extremeOf(days = [], get, low = false) {
  let best = null;
  for (const d of days) {
    const v = fin(get(d));
    if (v == null) continue;
    if (!best || (low ? v <= best.v : v >= best.v)) best = { v, day: d };
  }
  return best;
}

/** The month with the highest total and its key 'YYYY-MM'. */
export function bestMonth(days = [], get) {
  const per = new Map();
  for (const d of days) {
    const v = fin(get(d));
    if (v != null) per.set(d.slice(0, 7), (per.get(d.slice(0, 7)) ?? 0) + v);
  }
  let best = null;
  for (const [key, v] of per) if (v > 0 && (!best || v >= best.v)) best = { key, v };
  return best;
}

/** A record is «new» when it was set in the last `n` days. */
export const isNew = (day, today, n = 30) => !!day && day <= today && span(day, today) < n;
