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

/** How often each activity in the days, and in the same number of days before; most first. */
export function ranking(acts = [], log = [], days = []) {
  if (!days.length) return [];
  const now = new Set(days);
  const before = new Set(Array.from({ length: days.length }, (_, i) => addDays(days[0], -(i + 1))));
  const n = new Map();
  const p = new Map();
  for (const e of log) {
    if (now.has(e.day)) n.set(e.actId, (n.get(e.actId) ?? 0) + 1);
    else if (before.has(e.day)) p.set(e.actId, (p.get(e.actId) ?? 0) + 1);
  }
  return acts
    .map((a) => ({ id: a.id, act: a, n: n.get(a.id) ?? 0, prev: p.get(a.id) ?? 0 }))
    .map((r) => ({ ...r, diff: r.n - r.prev }))
    .filter((r) => r.n || r.prev)
    .sort((a, b) => b.n - a.n || b.prev - a.prev);
}

/** Ticks per week (Monday to Sunday) and the mean of the last 4 weeks. → [{ key, n, mean4 }] */
export function perWeek(days, perDay) {
  const out = [];
  for (const d of days) {
    const key = mondayOf(d);
    if (out.at(-1)?.key !== key) out.push({ key, n: 0 });
    out.at(-1).n += perDay.get(d) ?? 0;
  }
  return out.map((w, i) => {
    const part = out.slice(Math.max(0, i - 3), i + 1);
    return { ...w, mean4: part.reduce((s, x) => s + x.n, 0) / part.length };
  });
}
