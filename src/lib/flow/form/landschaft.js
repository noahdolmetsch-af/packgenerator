/**
 * «Belastungslandschaft» (Noah 03.11.2026, Cockpit-Idee 1): the load of the past days and of the planned
 * sessions as one landscape, and the same numbers as precise curves. Pure rules for the card on «Form und
 * Erholung» (FormLandschaft.svelte); tests/landschaft.test.js.
 *
 * Planned load is an ESTIMATE, never measured: a planned session of `mins` minutes in zone Z counts like a
 * ride at the middle of that power zone, load = IF² × hours × 100 (the formula the app uses for rides with
 * a power meter, training.js powerLoad). No zone counts as Z2. Only days after today count in the numbers,
 * so every day up to today shows the same fitness, fatigue and form as «Form und Erholung».
 */
import { addDays } from '../../health.js';
import { formSeries } from '../../form.js';
import { doneBy } from '../../training.js';

export const PAST_DAYS = 56;
export const AHEAD_DAYS = 14;
/** The intensity (share of FTP) a planned zone stands for: the middle of power zones 1–5 (training.js POWER_ZONE_SHARES). */
export const ZONE_IF = { 1: 0.5, 2: 0.65, 3: 0.83, 4: 0.98, 5: 1.12 };
export const DEFAULT_ZONE = 2;

/** The estimated load of one planned session (whole points); 0 without minutes. */
export function plannedLoad(s) {
  const mins = Number(s?.mins);
  if (!(mins > 0)) return 0;
  const f = ZONE_IF[s.zone] ?? ZONE_IF[DEFAULT_ZONE];
  return Math.round(f * f * (mins / 60) * 100);
}

/**
 * The planned sessions that still count: after today up to `ahead` days, and not yet done.
 * actsByDay: Map day → activities (a session counts as done when an activity of its kind is on its day).
 * → Map day → { load, sessions: [{ session, load }] }
 */
export function plannedByDay(sessions = [], actsByDay = new Map(), today, ahead = AHEAD_DAYS) {
  const last = addDays(today, ahead);
  const out = new Map();
  for (const s of sessions) {
    if (!s || s.day <= today || s.day > last || doneBy(s, actsByDay.get(s.day) ?? [])) continue;
    const l = plannedLoad(s);
    const e = out.get(s.day) ?? { load: 0, sessions: [] };
    e.load += l;
    e.sessions.push({ session: s, load: l });
    out.set(s.day, e);
  }
  return out;
}

/**
 * The days of the landscape: [{ day, load, fit, fat, form, future, planned }] for `past` days up to today and
 * `ahead` days after it. loads: Map day → measured load (form.js dayLoads); planned: plannedByDay().
 * future: the day is after today (its numbers carry the estimate). planned: the estimated load of that day.
 */
export function landscapeDays({ loads, planned = new Map(), today, past = PAST_DAYS, ahead = AHEAD_DAYS }) {
  const all = new Map(loads);
  for (const [d, e] of planned) all.set(d, (all.get(d) ?? 0) + e.load);
  const hasPlan = planned.size > 0;
  const to = hasPlan ? addDays(today, ahead) : today;
  return formSeries(all, addDays(today, -(past - 1)), to).map((p) => ({ ...p, future: p.day > today, planned: planned.get(p.day)?.load ?? 0 }));
}

/**
 * A smooth line through the points as an SVG path (quadratic curves between the middles of neighbours).
 * pts: [{ x, y }]; null for fewer than two points.
 */
export function smoothPath(pts) {
  if (!Array.isArray(pts) || pts.length < 2) return null;
  const f = (v) => v.toFixed(2);
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) d += ` Q${f(pts[i].x)},${f(pts[i].y)} ${f((pts[i].x + pts[i + 1].x) / 2)},${f((pts[i].y + pts[i + 1].y) / 2)}`;
  const last = pts.at(-1);
  return `${d} L${f(last.x)},${f(last.y)}`;
}

/** The same line closed down to `base` (a hill). */
export function hillPath(pts, base) {
  const line = smoothPath(pts);
  return line ? `${line} L${pts.at(-1).x.toFixed(2)},${base} L${pts[0].x.toFixed(2)},${base} Z` : null;
}

/** Map day → activities of that day (what plannedByDay needs to see what is done). */
export function actsByDayOf(acts = []) {
  const m = new Map();
  for (const a of acts) if (a?.day) m.set(a.day, [...(m.get(a.day) ?? []), a]);
  return m;
}
