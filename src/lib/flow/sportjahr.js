/**
 * «Sportjahr» (Noah 21.11.2026 «1 a dann b», Thread «Sportjahr», S3): everything you did, all sports together, in
 * hours. Pure functions over the common list of units (einheiten.js); the page is src/pages/Sportjahr.svelte.
 * Only looking: nothing is judged, nothing is saved. Minutes are «gemessen» or «ca.» (the usual duration, S1); the
 * numbers say how many of each.
 *
 * What counts: movement (ring «Bewegen»); the ride to work ticked by hand has no time and is left out.
 */
import { addDays } from '../flow.js';
import { mondayOf } from '../training.js';

/** The units that belong to the Sportjahr. */
export const training = (units = []) => units.filter((u) => u.ring === 'move' && u.quelle !== 'weg');

const inRange = (list, from, to) => list.filter((u) => u.day >= from && u.day <= to);
const mins = (u) => (Number(u.min) > 0 ? Number(u.min) : 0);
const parts = (day) => day.split('-').map(Number);
const pad = (n) => String(n).padStart(2, '0');

/** The same days one year earlier (29 February becomes 28 February). */
export function yearBack(day, n = 1) {
  const [y, m, d] = parts(day);
  const last = new Date(Date.UTC(y - n, m, 0)).getUTCDate();
  return `${y - n}-${pad(m)}-${pad(Math.min(d, last))}`;
}

/**
 * The range of a period for the Sportjahr: { from, to } up to today; «Alles» starts at the first unit.
 * range: from rangeOf() of zeitraum.js.
 */
export function windowOf(range, units, today) {
  if (range.from <= '1970-01-01') {
    const first = units.reduce((m, u) => (m === null || u.day < m ? u.day : m), null);
    return { from: first ?? today, to: today };
  }
  return { from: range.from, to: range.to > today ? today : range.to };
}

/** The same window a year earlier (for «against last year»), null for «Alles». */
export const prevWindow = (mode, w) => (mode === 'all' ? null : { from: yearBack(w.from), to: yearBack(w.to) });

/** The numbers over the top: minutes measured and estimated, units, days with training, sports. */
export function totals(units = []) {
  const o = { gemessen: 0, ca: 0, n: units.length, nCa: 0, days: 0, sports: 0, km: 0 };
  const days = new Set();
  const sports = new Set();
  for (const u of units) {
    if (u.minQuelle === 'gemessen') o.gemessen += mins(u);
    else if (u.minQuelle === 'ca.') {
      o.ca += mins(u);
      o.nCa += 1;
    }
    o.km += Number(u.km) || 0;
    days.add(u.day);
    sports.add(u.sport);
  }
  o.days = days.size;
  o.sports = sports.size;
  o.mins = o.gemessen + o.ca;
  o.km = Math.round(o.km * 10) / 10;
  return o;
}

/** One row per sport: minutes, units, days, km (and the same of the window a year earlier). Most minutes first. */
export function bySport(units = [], prev = null) {
  const acc = (list) => {
    const m = new Map();
    for (const u of list) {
      const r = m.get(u.sport) ?? { sport: u.sport, mins: 0, ca: 0, n: 0, days: new Set(), km: 0, actId: u.actId ?? null, stravaType: u.stravaType };
      r.mins += mins(u);
      if (u.minQuelle === 'ca.') r.ca += mins(u);
      r.n += 1;
      r.days.add(u.day);
      r.km += Number(u.km) || 0;
      m.set(u.sport, r);
    }
    return m;
  };
  const now = acc(units);
  const before = prev ? acc(prev) : null;
  return [...now.values()]
    .map((r) => {
      const p = before?.get(r.sport);
      return { sport: r.sport, actId: r.actId, stravaType: r.stravaType, mins: r.mins, ca: r.ca, n: r.n, days: r.days.size, km: Math.round(r.km * 10) / 10, prev: before ? { mins: p?.mins ?? 0, n: p?.n ?? 0, days: p?.days.size ?? 0, km: Math.round((p?.km ?? 0) * 10) / 10 } : null };
    })
    .sort((a, b) => b.mins - a.mins || b.n - a.n || a.sport.localeCompare(b.sport));
}

/** The sports that get an own colour (the biggest by minutes); the rest is «other». → Map sport → 0..max-1 | 'other'. */
export function colourOf(rows, max = 7) {
  const m = new Map();
  rows.forEach((r, i) => m.set(r.sport, i < max ? i : 'other'));
  return m;
}

const MAX_DAYS_BARS = 62;
/** How a window is divided into bars: 'day' | 'month' | 'year'. */
export function grainOf(mode, w) {
  if (mode === 'year') return 'month';
  if (mode === 'all') return 'year';
  const days = Math.round((Date.parse(`${w.to}T00:00:00Z`) - Date.parse(`${w.from}T00:00:00Z`)) / 864e5) + 1;
  return days <= MAX_DAYS_BARS ? 'day' : 'month';
}

/**
 * The bars: [{ key, from, to, mins, n, parts: { sport: minutes } }]. A year always has its 12 months (the months
 * to come stay empty), «Everything» one bar per year, a short window one bar per day.
 */
export function buckets(units, mode, w) {
  const grain = grainOf(mode, w);
  const list = [];
  if (grain === 'day') {
    for (let d = w.from; d <= w.to; d = addDays(d, 1)) list.push({ key: d, from: d, to: d });
  } else if (grain === 'month') {
    let [y, m] = parts(w.from);
    const [ey, em] = mode === 'year' ? [y, 12] : parts(w.to);
    for (; y < ey || (y === ey && m <= em); m === 12 ? ((m = 1), y++) : m++) {
      const from = `${y}-${pad(m)}-01`;
      list.push({ key: `${y}-${pad(m)}`, from, to: `${y}-${pad(m)}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}` });
    }
  } else {
    for (let y = parts(w.from)[0]; y <= parts(w.to)[0]; y++) list.push({ key: String(y), from: `${y}-01-01`, to: `${y}-12-31` });
  }
  const at = new Map(list.map((b) => [b.key, { ...b, mins: 0, n: 0, parts: {} }]));
  const keyOf = grain === 'day' ? (d) => d : grain === 'month' ? (d) => d.slice(0, 7) : (d) => d.slice(0, 4);
  for (const u of inRange(units, w.from, w.to)) {
    const b = at.get(keyOf(u.day));
    if (!b) continue;
    b.mins += mins(u);
    b.n += 1;
    b.parts[u.sport] = (b.parts[u.sport] ?? 0) + mins(u);
  }
  return list.map((b) => at.get(b.key));
}

/** The year before as a line: the minutes of each month of the year earlier (12 numbers, null when it has no data). */
export function lastYearLine(units, w) {
  const y = parts(w.from)[0] - 1;
  const m = Array(12).fill(0);
  let any = false;
  for (const u of units) {
    if (u.day.slice(0, 4) !== String(y)) continue;
    m[Number(u.day.slice(5, 7)) - 1] += mins(u);
    any = true;
  }
  return any ? m : null;
}

/** Records and series of a window: the longest week (Mon–Sun), most units in one day, the longest run of days in a row. */
export function records(units = []) {
  const week = new Map();
  const perDay = new Map();
  for (const u of units) {
    const mon = mondayOf(u.day);
    week.set(mon, (week.get(mon) ?? 0) + mins(u));
    perDay.set(u.day, (perDay.get(u.day) ?? 0) + 1);
  }
  let longestWeek = null;
  for (const [mon, m] of week) if (!longestWeek || m > longestWeek.mins) longestWeek = { mon, mins: m };
  let mostPerDay = null;
  for (const [day, n] of perDay) if (!mostPerDay || n > mostPerDay.n || (n === mostPerDay.n && day > mostPerDay.day)) mostPerDay = { day, n };
  const days = [...perDay.keys()].sort();
  let best = null;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === addDays(days[i - 1], 1) ? run + 1 : 1;
    if (!best || run > best.days) best = { days: run, end: days[i] };
  }
  return { longestWeek: longestWeek && longestWeek.mins > 0 ? longestWeek : null, mostPerDay, longestStreak: best };
}

/** The weeks of a year (Monday first): how many units each had; ok = at least `need`. Future weeks are marked. */
export function weeksWith(units, year, today, need = 2) {
  const out = [];
  const n = new Map();
  for (const u of units) if (u.day.startsWith(`${year}-`)) n.set(mondayOf(u.day), (n.get(mondayOf(u.day)) ?? 0) + 1);
  for (let mon = mondayOf(`${year}-01-04`); mon <= `${year}-12-31`; mon = addDays(mon, 7)) {
    if (mon.slice(0, 4) < String(year) && addDays(mon, 6).slice(0, 4) < String(year)) continue;
    const c = n.get(mon) ?? 0;
    out.push({ mon, n: c, ok: c >= need, future: mon > today });
  }
  return out;
}

/* ---------- S10 «Ziele sichtbar» (Noah 21.11.2026 «alle entwürfe 1-3 umsetzen»): the hours goal as a line ---------- */

const daysIn = (b) => Math.round((Date.parse(`${b.to}T00:00:00Z`) - Date.parse(`${b.from}T00:00:00Z`)) / 864e5) + 1;

/**
 * The goal of the app (training.goal: name, hours per week, day) as the sports year needs it, or null where none with hours
 * is set. passed: the goal day is over; then the page says so quietly and draws no line.
 */
export function goalOfYear(goal, today) {
  const hours = Number(goal?.hours);
  if (!(hours > 0)) return goal?.until && goal.until < today ? { name: goal.name ?? '', hours: null, until: goal.until, passed: true } : null;
  return { name: goal.name ?? '', hours, until: goal.until ?? null, passed: !!goal.until && goal.until < today };
}

/** The goal as a line over the bars, in minutes: hours per week × the days of the bar ÷ 7. null without hours. */
export function goalLine(bars, hours) {
  return hours > 0 ? bars.map((b) => Math.round((daysIn(b) / 7) * hours * 60)) : null;
}

/** Hours per week the window really had, up to today (minutes); null for a window that has not begun. */
export function perWeek(totalMins, w, today) {
  const to = w.to < today ? w.to : today;
  if (to < w.from) return null;
  const days = daysIn({ from: w.from, to });
  return Math.round((totalMins / days) * 7);
}

/* ---------- S9 «Jahre vergleichen» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen»): every year side by side ---------- */

/** Summer is April to October, as in the weekly plan; the rest is winter. */
export const isSummerDay = (day) => {
  const m = Number(day.slice(5, 7));
  return m >= 4 && m <= 10;
};

/**
 * One row per year with units, newest first: { year, mins, n, days, bestWeek: { mon, mins } | null, bestMonth: { key, mins } | null,
 * summer, winter } (minutes). A year without a unit has no row.
 */
export function yearsOf(units = []) {
  const by = new Map();
  for (const u of units) {
    const year = u.day.slice(0, 4);
    const y = by.get(year) ?? { year, mins: 0, n: 0, days: new Set(), week: new Map(), month: new Map(), summer: 0, winter: 0 };
    const m = mins(u);
    y.mins += m;
    y.n += 1;
    y.days.add(u.day);
    const mon = mondayOf(u.day);
    y.week.set(mon, (y.week.get(mon) ?? 0) + m);
    const key = u.day.slice(0, 7);
    y.month.set(key, (y.month.get(key) ?? 0) + m);
    if (isSummerDay(u.day)) y.summer += m;
    else y.winter += m;
    by.set(year, y);
  }
  const best = (map, name) => {
    let b = null;
    for (const [k, v] of map) if (!b || v > b.mins) b = { [name]: k, mins: v };
    return b;
  };
  return [...by.values()]
    .map((y) => ({ year: y.year, mins: y.mins, n: y.n, days: y.days.size, bestWeek: best(y.week, 'mon'), bestMonth: best(y.month, 'key'), summer: y.summer, winter: y.winter }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

/** The sports of the two seasons over all given units: { summer: [bySport rows], winter: [bySport rows] }, biggest first. */
export function seasons(units = []) {
  return { summer: bySport(units.filter((u) => isSummerDay(u.day))), winter: bySport(units.filter((u) => !isSummerDay(u.day))) };
}
