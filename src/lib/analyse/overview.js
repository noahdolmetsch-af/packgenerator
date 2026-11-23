/**
 * «Analyse» M2 «Überblick» (Noah 27.10.2026 «alle Mockups 1:1»): the numbers of the period at a glance,
 * every day as a field (how much you ticked), the ranking of your activities against the period before,
 * and ticks per week. Pure: days are 'YYYY-MM-DD'. Only to look at: no grades.
 */
import { addDays } from '../analyse.js';
import { mondayOf } from './diagram.js';

/** Ticks per day: Map day → count (each entry of the log counts once). */
export function ticksPerDay(log = [], ids = null) {
  const out = new Map();
  for (const e of log) {
    if (!e?.day || (ids && !ids.has(e.actId))) continue;
    out.set(e.day, (out.get(e.day) ?? 0) + 1);
  }
  return out;
}

/** The longest run of days in a row with at least one tick, inside the days (oldest first). */
export function longestRun(days, perDay) {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = (perDay.get(d) ?? 0) > 0 ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/**
 * The calendar: one column per week (Monday on top), one field per day with its level 0–4 (0 = nothing;
 * 1–4 in quarters of your busiest day). → { weeks: [{ key, cells: [{ day, n, level } | null] }], top }
 */
export function heatWeeks(days, perDay) {
  const top = Math.max(0, ...days.map((d) => perDay.get(d) ?? 0));
  const level = (n) => (!n ? 0 : Math.max(1, Math.ceil((n / top) * 4)));
  const inside = new Set(days);
  const weeks = [];
  if (!days.length) return { weeks, top };
  for (let w = mondayOf(days[0]); w <= days.at(-1); w = addDays(w, 7)) {
    weeks.push({
      key: w,
      cells: Array.from({ length: 7 }, (_, i) => {
        const day = addDays(w, i);
        if (!inside.has(day)) return null;
        const n = perDay.get(day) ?? 0;
        return { day, n, level: level(n) };
      }),
    });
  }
  return { weeks, top };
}

/**
 * How often each activity in the days, and in the same number of days before; most first. Activities with the same
 * name (trimmed, any case) are one row: two entries called «Gym» are one line, their data stays as it is
 * (Noah 23.11.2026 «Gym steht doppelt»). nameOf: the name shown (default: a.name).
 */
export function ranking(acts = [], log = [], days = [], nameOf = (a) => a?.name) {
  if (!days.length) return [];
  const now = new Set(days);
  const before = new Set(Array.from({ length: days.length }, (_, i) => addDays(days[0], -(i + 1))));
  const n = new Map();
  const p = new Map();
  for (const e of log) {
    if (now.has(e.day)) n.set(e.actId, (n.get(e.actId) ?? 0) + 1);
    else if (before.has(e.day)) p.set(e.actId, (p.get(e.actId) ?? 0) + 1);
  }
  const rows = new Map();
  for (const a of acts) {
    const one = { id: a.id, act: a, n: n.get(a.id) ?? 0, prev: p.get(a.id) ?? 0 };
    const key = String(nameOf(a) ?? a.id).trim().toLowerCase() || String(a.id);
    const had = rows.get(key);
    if (!had) rows.set(key, { ...one, ids: [a.id] });
    else {
      // the entry with more ticks leads (its ring and icon are shown); the counts add up
      const lead = one.n + one.prev > had.n + had.prev ? one : had;
      rows.set(key, { id: lead.id, act: lead.act, n: had.n + one.n, prev: had.prev + one.prev, ids: [...had.ids, a.id] });
    }
  }
  return [...rows.values()]
    .map((r) => ({ ...r, diff: r.n - r.prev }))
    .filter((r) => r.n || r.prev)
    .sort((a, b) => b.n - a.n || b.prev - a.prev);
}

/** The ranking as groups by ring (Move, Mindful, Recovery); rows with 0× now go to `quiet`. → [{ ring, rows, quiet }] */
export function rankByRing(rank = [], rings = ['move', 'mind', 'rest']) {
  const known = (r) => (rings.includes(r.act?.ring) ? r.act.ring : rings[0]);
  return rings
    .map((ring) => ({ ring, rows: rank.filter((r) => known(r) === ring && r.n > 0), quiet: rank.filter((r) => known(r) === ring && !r.n) }))
    .filter((g) => g.rows.length || g.quiet.length);
}

/** The days of the last `count` whole weeks (Monday first) up to today, oldest first: the picture of weeks never starts mid-week. */
export function weekDays(today, count = 12) {
  const from = addDays(mondayOf(today), -(count - 1) * 7);
  const out = [];
  for (let d = from; d <= today; d = addDays(d, 1)) out.push(d);
  return out;
}

/** How many whole weeks the picture needs: at least `min`, and every day of the period (a Monday on or before its first day). */
export function weekCountFor(days, today, min = 12) {
  if (!days.length) return min;
  const span = Math.round((new Date(`${mondayOf(today)}T12:00:00Z`) - new Date(`${mondayOf(days[0])}T12:00:00Z`)) / (7 * 864e5)) + 1;
  return Math.max(min, span);
}

/** The change against the period before as a whole percent: { pct, same } or null without a real before (0 or none). */
export function changeOf(now, before) {
  if (!Number.isFinite(now) || !Number.isFinite(before) || !(before > 0)) return null;
  const pct = Math.round(((now - before) / before) * 100);
  return { pct, same: pct === 0 };
}

/**
 * «Was auffällt»: up to three plain sentences as data, by rules, never a grade. The most added and the most dropped
 * activity against the period before (at least 2 more or fewer, and 3 ticks on the bigger side), and the running week
 * against the week before at the same point. → [{ kind: 'up' | 'down' | 'week', ... }]
 */
export function noticed({ rank = [], perDay = new Map(), today } = {}) {
  const out = [];
  const up = rank.filter((r) => r.diff >= 2 && r.n >= 3).sort((a, b) => b.diff - a.diff)[0];
  if (up) out.push({ kind: 'up', name: up.act, n: up.n, prev: up.prev, row: up });
  const down = rank.filter((r) => r.diff <= -2 && r.prev >= 3).sort((a, b) => a.diff - b.diff)[0];
  if (down) out.push({ kind: 'down', name: down.act, n: down.n, prev: down.prev, row: down });
  if (today) {
    const mon = mondayOf(today);
    const k = Math.round((new Date(`${today}T12:00:00Z`) - new Date(`${mon}T12:00:00Z`)) / 864e5) + 1;
    const sum = (from) => Array.from({ length: k }, (_, i) => perDay.get(addDays(from, i)) ?? 0).reduce((a, b) => a + b, 0);
    const now = sum(mon);
    const last = sum(addDays(mon, -7));
    if (now === 0) out.push({ kind: 'week', n: 0, last });
    else if (last > 0 && now !== last) out.push({ kind: 'week', n: now, last });
  }
  return out.slice(0, 3);
}

/**
 * Ticks per week (Monday to Sunday) and the mean of the last 4 whole weeks. → [{ key, n, mean4 }]
 * With `today`, the week that is not over yet is marked `running` and left out of every mean (its line stops there):
 * a Monday with 0 must not look like a fall (Noah 23.11.2026).
 */
export function perWeek(days, perDay, today = null) {
  const out = [];
  for (const d of days) {
    const key = mondayOf(d);
    if (out.at(-1)?.key !== key) out.push({ key, n: 0 });
    out.at(-1).n += perDay.get(d) ?? 0;
  }
  const live = today ? mondayOf(today) : null;
  return out.map((w, i) => {
    if (w.key === live) return { ...w, running: true, mean4: null };
    const part = out.slice(Math.max(0, i - 3), i + 1).filter((x) => x.key !== live);
    return { ...w, mean4: part.reduce((s, x) => s + x.n, 0) / part.length };
  });
}
