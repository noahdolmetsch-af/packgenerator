/**
 * «Auswertung wie Training» (Noah 20.10.2026: the ride page Aktiv › Training › Fahrt is the standard;
 * «zum auswerten von meinen täglich abgehakten aktivitäten»): the numbers behind Aktiv › Ziele › Auswerten
 * (#/flow/auswertung). Pure rules over the tick entries ({ actId, day, at, n, min }); the page and the
 * cards are src/pages/flow/TickReview.svelte and src/lib/flow/auswertung/. Observation only, nothing is rated.
 * Days are YYYY-MM-DD; weeks start on Monday.
 */
import { addDays, daysBetween } from '../flow.js';

/** The periods to choose, in days ending today. */
export const PERIODS = [30, 90, 365];

const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
/** The Monday of the week of a day. */
export const mondayOf = (day) => addDays(day, -dow(day));
/** The first day of a period of n days ending on `to`. */
export const fromOf = (to, n) => addDays(to, -(n - 1));
export const inRange = (list = [], from, to) => list.filter((e) => e?.day && e.day >= from && e.day <= to);
const minOf = (e) => Math.max(0, Number(e.min) || 0);
const amountOf = (e) => Math.max(1, Number(e.n) || 1);

/** The longest run of days in a row with a tick, among the days given. */
export function longestRun(days = []) {
  const s = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < s.length; i++) {
    run = i > 0 && daysBetween(s[i - 1], s[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** The run that is still going: it ends today, or yesterday when today has no tick yet. */
export function currentRun(days = [], today) {
  const on = new Set(days);
  let d = on.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (on.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** The key tiles: days with a tick, ticks, amount (push-ups …), minutes, Ø per week, runs, activities. */
export function tilesOf(list = [], from, to, today = to) {
  const es = inRange(list, from, to);
  const days = [...new Set(es.map((e) => e.day))];
  const weeks = Math.max(1, (daysBetween(from, to) + 1) / 7);
  return {
    days: days.length,
    ticks: es.length,
    amount: es.reduce((s, e) => s + amountOf(e), 0),
    min: es.reduce((s, e) => s + minOf(e), 0),
    perWeek: Math.round((es.length / weeks) * 10) / 10,
    longest: longestRun(days),
    current: currentRun(list.map((e) => e.day), today),
    acts: new Set(es.map((e) => e.actId)).size,
  };
}

/** Ticks per week (Monday to Sunday) from the week of `from` to the week of `to`, split by ring. */
export function perWeek(list = [], from, to, ringOf = () => 'move') {
  const out = [];
  for (let m = mondayOf(from); m <= to; m = addDays(m, 7)) out.push({ mon: m, n: 0, rings: { move: 0, mind: 0, rest: 0 } });
  const at = new Map(out.map((w, i) => [w.mon, i]));
  for (const e of inRange(list, from, to)) {
    const w = out[at.get(mondayOf(e.day))];
    if (!w) continue;
    w.n++;
    const r = ringOf(e.actId);
    w.rings[r in w.rings ? r : 'move']++;
  }
  return out;
}

/** The share of the ticks per weekday, Monday first: [{ i, n, pct }]. */
export function weekdays(list = []) {
  const n = Array(7).fill(0);
  for (const e of list) if (e?.day) n[dow(e.day)]++;
  const sum = n.reduce((a, b) => a + b, 0);
  return n.map((x, i) => ({ i, n: x, pct: sum ? Math.round((x / sum) * 100) : 0 }));
}

/** The time of day of the ticks in slots of three hours (local clock of the device): [{ from, n, pct }]. */
export const HOUR_SLOTS = [0, 3, 6, 9, 12, 15, 18, 21];
export function hours(list = []) {
  const n = Array(HOUR_SLOTS.length).fill(0);
  let sum = 0;
  for (const e of list) {
    const d = e?.at ? new Date(e.at) : null;
    if (!d || Number.isNaN(d.getTime()) || e.via === 'trip') continue;
    n[Math.floor(d.getHours() / 3)]++;
    sum++;
  }
  return n.map((x, i) => ({ from: HOUR_SLOTS[i], n: x, pct: sum ? Math.round((x / sum) * 100) : 0 }));
}

/** Ticks per day and the mean of the 7 days up to it: [{ day, n, mean }]. */
export function daily(list = [], from, to) {
  const by = new Map();
  for (const e of inRange(list, from, to)) by.set(e.day, (by.get(e.day) ?? 0) + 1);
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ day: d, n: by.get(d) ?? 0 });
  return out.map((x, i) => {
    const w = out.slice(Math.max(0, i - 6), i + 1);
    return { ...x, mean: Math.round((w.reduce((s, y) => s + y.n, 0) / w.length) * 100) / 100 };
  });
}

/** Ticks per activity (row) and weekday (column); only activities with a tick. */
export function gridOf(list = [], actIds = []) {
  const rows = actIds.map((id) => ({ id, n: Array(7).fill(0) }));
  const at = new Map(rows.map((r, i) => [r.id, i]));
  for (const e of list) {
    const r = rows[at.get(e.actId)];
    if (r && e.day) r.n[dow(e.day)]++;
  }
  return rows.filter((r) => r.n.some((x) => x > 0));
}

const pctOf = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);
const dirOf = (p) => (Math.abs(p) < 5 ? 'same' : p > 0 ? 'more' : 'less');
/** The first and the second half of the period (equal days): ticks, days with a tick, minutes; what changed. */
export function halvesOf(list = [], from, to) {
  const len = daysBetween(from, to) + 1;
  if (len < 4) return null;
  const mid = addDays(from, Math.floor(len / 2) - 1);
  const part = (a, b) => {
    const es = inRange(list, a, b);
    return { from: a, to: b, ticks: es.length, days: new Set(es.map((e) => e.day)).size, min: es.reduce((s, e) => s + minOf(e), 0) };
  };
  const rows = [part(from, mid), part(addDays(mid, 1), addDays(mid, Math.floor(len / 2)))];
  if (!rows[0].ticks && !rows[1].ticks) return null;
  const p = pctOf(rows[1].ticks, rows[0].ticks);
  return { rows, ticks: { p: Math.abs(p), dir: dirOf(p) }, min: rows[0].min + rows[1].min > 0 };
}

/** The best values of a list of entries: longest run, best week, best month, most in one day, most minutes in a day. */
function bestOf(es = []) {
  const count = (key) => {
    const m = new Map();
    for (const e of es) m.set(key(e), (m.get(key(e)) ?? 0) + 1);
    return Math.max(0, ...m.values());
  };
  const minDay = new Map();
  for (const e of es) minDay.set(e.day, (minDay.get(e.day) ?? 0) + minOf(e));
  return {
    run: longestRun(es.map((e) => e.day)),
    week: count((e) => mondayOf(e.day)),
    month: count((e) => e.day.slice(0, 7)),
    day: count((e) => e.day),
    minDay: Math.max(0, ...minDay.values()),
  };
}
export const BEST_ROWS = ['run', 'week', 'month', 'day', 'minDay'];
/** «Bestwerte»: the period against the last 90 days and the year of `to`; a star when the period is as good as the 90 days. */
export function bestTable(list = [], from, to) {
  const year = to.slice(0, 4);
  const me = bestOf(inRange(list, from, to));
  const d90 = bestOf(inRange(list, fromOf(to, 90), to));
  const yr = bestOf(inRange(list, `${year}-01-01`, to));
  const rows = BEST_ROWS.map((k) => ({ k, me: me[k], d90: d90[k], year: yr[k], star: me[k] > 0 && me[k] >= d90[k] }));
  return rows.some((r) => r.me > 0 || r.year > 0) ? { year, rows: rows.filter((r) => r.k !== 'minDay' || r.year > 0) } : null;
}

/** «Pro Monat»: one row per month of the period, newest first: days with a tick, ticks, minutes, Ø per week. */
export function months(list = [], from, to) {
  const out = [];
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = addDays(`${m}-28`, 7).slice(0, 7)) {
    const a = `${m}-01` < from ? from : `${m}-01`;
    const endM = addDays(`${addDays(`${m}-28`, 7).slice(0, 7)}-01`, -1);
    const b = endM > to ? to : endM;
    const es = inRange(list, a, b);
    const weeks = Math.max(1, (daysBetween(a, b) + 1) / 7);
    out.push({ m, days: new Set(es.map((e) => e.day)).size, ticks: es.length, min: es.reduce((s, e) => s + minOf(e), 0), perWeek: Math.round((es.length / weeks) * 10) / 10 });
  }
  return out.reverse();
}

/* ---------- your answers (Check-Fragen): the same cards for values ---------- */
export const VALUE_KINDS = ['scale', 'number'];
/** The answers with a number of one question, oldest first: [{ day, at, v }]. */
export function valuesOf(rows = [], qid) {
  return rows
    .filter((r) => r?.qid === qid && r.day && VALUE_KINDS.includes(r.kind) && r.value !== '' && r.value != null && Number.isFinite(Number(r.value)))
    .map((r) => ({ day: r.day, at: r.at ?? null, v: Number(r.value) }))
    .sort((a, b) => a.day.localeCompare(b.day) || String(a.at ?? '').localeCompare(String(b.at ?? '')));
}
/** The questions with at least one answer with a number, most answers first: [{ qid, n }]. */
export function valueQuestions(rows = []) {
  const n = new Map();
  for (const r of rows) if (VALUE_KINDS.includes(r?.kind) && Number.isFinite(Number(r.value)) && r.value !== '' && r.value != null) n.set(r.qid, (n.get(r.qid) ?? 0) + 1);
  return [...n].map(([qid, c]) => ({ qid, n: c })).sort((a, b) => b.n - a.n || a.qid.localeCompare(b.qid));
}
const round1 = (x) => Math.round(x * 10) / 10;
const meanOf = (vs) => (vs.length ? round1(vs.reduce((s, x) => s + x, 0) / vs.length) : null);
/** The key tiles of one question: answers, days, Ø, lowest, highest, the last answer. */
export function valueTiles(vals = [], from, to) {
  const vs = inRange(vals, from, to);
  const xs = vs.map((x) => x.v);
  return { n: vs.length, days: new Set(vs.map((x) => x.day)).size, mean: meanOf(xs), min: xs.length ? Math.min(...xs) : null, max: xs.length ? Math.max(...xs) : null, last: vs.at(-1) ?? null };
}
/** One value per day (the mean of the day) and the mean of the 7 days up to it; days without an answer stay null. */
export function valueDaily(vals = [], from, to) {
  const by = new Map();
  for (const x of inRange(vals, from, to)) by.set(x.day, [...(by.get(x.day) ?? []), x.v]);
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push({ day: d, v: by.has(d) ? meanOf(by.get(d)) : null });
  return out.map((x, i) => {
    const w = out.slice(Math.max(0, i - 6), i + 1).filter((y) => y.v != null);
    return { ...x, mean: w.length ? meanOf(w.map((y) => y.v)) : null };
  });
}
/** Ø per weekday, Monday first: [{ i, n, mean }]. */
export function valueWeekdays(vals = []) {
  const per = Array.from({ length: 7 }, () => []);
  for (const x of vals) per[dow(x.day)].push(x.v);
  return per.map((vs, i) => ({ i, n: vs.length, mean: meanOf(vs) }));
}
/** The first against the second half of the period: Ø, answers; what changed (a difference under 5 % is «the same»). */
export function valueHalves(vals = [], from, to) {
  const len = daysBetween(from, to) + 1;
  if (len < 4) return null;
  const mid = addDays(from, Math.floor(len / 2) - 1);
  const part = (a, b) => {
    const vs = inRange(vals, a, b).map((x) => x.v);
    return { from: a, to: b, n: vs.length, mean: meanOf(vs) };
  };
  const rows = [part(from, mid), part(addDays(mid, 1), addDays(mid, Math.floor(len / 2)))];
  if (rows[0].mean == null || rows[1].mean == null) return null;
  const p = rows[0].mean ? Math.round(((rows[1].mean - rows[0].mean) / Math.abs(rows[0].mean)) * 100) : 0;
  return { rows, change: { p: Math.abs(p), dir: dirOf(p) } };
}
/** Per month of the period, newest first: answers, Ø, lowest, highest. */
export function valueMonths(vals = [], from, to) {
  const vs = inRange(vals, from, to);
  return months([], from, to).map(({ m }) => {
    const xs = vs.filter((x) => x.day.startsWith(m)).map((x) => x.v);
    return { m, n: xs.length, mean: meanOf(xs), min: xs.length ? Math.min(...xs) : null, max: xs.length ? Math.max(...xs) : null };
  });
}
