/**
 * Paket P2 «Skitour» (Noah 21.10.2026 «1a 2b 3a 4a 5b», mockups V1/V2/V5, R8/R11/R13 of «Offene Mockups»):
 * the planning before a ski tour and the season around it. Pure rules, no database (tests/skiplan.test.js).
 *
 * - The avalanche danger level of the day (1–5, optional sub-level −/=/+), with a neutral sentence in the
 *   spirit of the bulletin. The app never decides: it shows the level the user typed in and links the bulletin.
 * - «Dein Morgen»: get up, leave, start of the ascent, planned at the peak, turnaround, last train back.
 * - Plan and reality after the tour: metres climbed, time moving, the time at the peak.
 * - The season: a goal (tours, metres climbed), wish tours, transceiver practice, courses (refresh after
 *   two years), ski days of the last eight weeks, the days to the season start, last season in short,
 *   metres climbed per ski.
 *
 * Where it lives: trip.ski.plan = { level, sub, wakeAt, leaveAt, ascentAt, peakPlanAt, hm, timeMin, temp,
 * wind, notes }; trip.ski.peakAt (the «Gipfel erreicht» tap) and trip.ski.turnAt / trainAt (Start-Check)
 * stay where they were. The settings 'ski.goal', 'ski.wishes', 'ski.lvs', 'ski.courses'.
 */
import { seasonId, seasonTrips, seasonStats, hmOf, isPastSki, hasNotes } from './ski.js';

export const GOAL_KEY = 'ski.goal';
export const WISHES_KEY = 'ski.wishes';
export const LVS_KEY = 'ski.lvs';
export const COURSES_KEY = 'ski.courses';

/** The five danger levels, in the words of the European scale (short, neutral). */
export const DANGER_LEVELS = [
  { level: 1, name: 'Low|danger', text: 'Generally favourable conditions. Single danger spots in extremely steep terrain.' },
  { level: 2, name: 'Moderate|danger', text: 'Mostly favourable conditions. Choose the route with care, above all on very steep slopes of the aspects named in the bulletin.' },
  { level: 3, name: 'Considerable|danger', text: 'Critical conditions. Avoid very steep slopes of the named aspects and heights; it needs experience in judging avalanches.' },
  { level: 4, name: 'High|danger', text: 'Very critical conditions. Stay in moderately steep terrain and away from run-out zones.' },
  { level: 5, name: 'Very high|danger', text: 'Extraordinary situation. No ski tours.' },
];
/** The sub-levels the bulletin gives (low, middle, high within a level); not for level 5. */
export const SUB_LEVELS = ['-', '=', '+'];
export const BULLETIN_URL = 'https://www.slf.ch/de/lawinenbulletin-und-schneesituation/';

export const dangerOf = (level) => DANGER_LEVELS.find((d) => d.level === Number(level)) ?? null;
/** «3+», «2», or '' without a level. */
export function dangerShort(plan) {
  const d = dangerOf(plan?.level);
  if (!d) return '';
  return d.level < 5 && SUB_LEVELS.includes(plan?.sub) && plan.sub !== '=' ? `${d.level}${plan.sub}` : String(d.level);
}

/** «Dein Morgen»: the times of the tour day, in their order. turnAt and trainAt sit in trip.ski. */
export const MORNING = [
  { key: 'wakeAt', name: 'Get up', at: 'plan' },
  { key: 'leaveAt', name: 'Leave (train or car)', at: 'plan' },
  { key: 'ascentAt', name: 'Start of the ascent', at: 'plan' },
  { key: 'peakPlanAt', name: 'At the peak (planned)', at: 'plan' },
  { key: 'turnAt', name: 'Turnaround', at: 'ski' },
  { key: 'trainAt', name: 'Last train back', at: 'ski' },
];

const CLOCK = /^([01]?\d|2[0-3]):([0-5]\d)$/;
/** '07:05' → 425 minutes; anything else → null. */
export function minutesOf(text) {
  const m = CLOCK.exec(String(text ?? '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
/** The filled morning rows of a trip: [{ key, name, time }] in the order of MORNING. */
export function morningRows(trip) {
  const ski = trip?.ski ?? {};
  const plan = ski.plan ?? {};
  return MORNING.map((r) => ({ key: r.key, name: r.name, time: (r.at === 'plan' ? plan[r.key] : ski[r.key]) || '' })).filter((r) => minutesOf(r.time) != null);
}

/** True when the plan has anything typed in. */
export function hasPlan(trip) {
  const p = trip?.ski?.plan;
  return !!p && Object.values(p).some((v) => v != null && v !== '');
}

/** Minutes between two clock times (b − a), or null. */
export function clockDiff(a, b) {
  const x = minutesOf(a);
  const y = minutesOf(b);
  return x == null || y == null ? null : y - x;
}

/**
 * Plan and reality after the tour: rows only where a plan exists.
 * → [{ key: 'hm' | 'time' | 'peak', plan, real, diff }] (hm in metres, time in minutes, peak as clock text;
 * diff = real − plan, in metres or minutes; null while the real value is missing).
 */
export function planVsReal(trip) {
  const ski = trip?.ski ?? {};
  const plan = ski.plan ?? {};
  const rows = [];
  const pHm = Number(plan.hm) > 0 ? Math.round(Number(plan.hm)) : null;
  if (pHm) {
    const real = hmOf(trip) || null;
    rows.push({ key: 'hm', plan: pHm, real, diff: real == null ? null : real - pHm });
  }
  const pTime = Number(plan.timeMin) > 0 ? Math.round(Number(plan.timeMin)) : null;
  if (pTime) {
    const real = Number(ski.activeMin) > 0 ? Math.round(Number(ski.activeMin)) : null;
    rows.push({ key: 'time', plan: pTime, real, diff: real == null ? null : real - pTime });
  }
  if (minutesOf(plan.peakPlanAt) != null) {
    const real = minutesOf(ski.peakAt) != null ? ski.peakAt : null;
    rows.push({ key: 'peak', plan: plan.peakPlanAt, real, diff: real == null ? null : clockDiff(plan.peakPlanAt, real) });
  }
  return rows;
}

/* ---------- the season ---------- */

/** The goal of a season: { tours, hm } (0 = no goal). goals: { '2026/27': { tours, hm } }. */
export function goalOf(goals, id) {
  const g = goals?.[id] ?? {};
  const n = (v) => (Number(v) > 0 ? Math.round(Number(v)) : 0);
  return { tours: n(g.tours), hm: n(g.hm) };
}
/** Progress to the goal: { tours: { n, of, pct }, hm: { n, of, pct } }; of = 0 means no goal. */
export function goalProgress(goal, stats) {
  const one = (n, of) => ({ n, of, pct: of ? Math.min(100, Math.round((n / of) * 100)) : 0 });
  return { tours: one(stats.tours, goal.tours), hm: one(stats.hm, goal.hm) };
}

/* wish tours: [{ id, name, doneTripId? }] — the user's own names (never through t()) */
export const addWish = (list, name, id) => {
  const n = String(name ?? '').trim();
  return n ? [...(list ?? []), { id, name: n }] : (list ?? []);
};
export const renameWish = (list, id, name) => {
  const n = String(name ?? '').trim();
  return n ? (list ?? []).map((w) => (w.id === id ? { ...w, name: n } : w)) : (list ?? []);
};
export const dropWish = (list, id) => (list ?? []).filter((w) => w.id !== id);
/** Put the wish at place `from` to place `to` (indices in the list). */
export function moveWish(list, from, to) {
  const out = [...(list ?? [])];
  if (from < 0 || from >= out.length || to < 0 || to >= out.length || from === to) return out;
  const [w] = out.splice(from, 1);
  out.splice(to, 0, w);
  return out;
}
/** Done or not: a wish ticked off keeps the day. */
export const toggleWish = (list, id, day) => (list ?? []).map((w) => (w.id === id ? (w.doneDay ? { id: w.id, name: w.name } : { ...w, doneDay: day }) : w));

/* transceiver practice: [{ id, day, note }] */
export const lvsOfSeason = (log, id) => (log ?? []).filter((x) => x.day && seasonId(x.day) === id).sort((a, b) => b.day.localeCompare(a.day));

/* courses: [{ id, name, day }]; a course older than two years is due for a refresh */
export const REFRESH_YEARS = 2;
export function courseDue(course, today) {
  if (!course?.day) return false;
  const [y, m, d] = course.day.split('-').map(Number);
  const until = `${y + REFRESH_YEARS}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return until <= today;
}

/** Calendar day + n (noon UTC keeps the day). */
const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
/** Monday of the week of a day. */
const mondayOf = (day) => addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));

/** Ski days of the last `weeks` weeks (this week last): [{ start, n }], tours that are over or noted. */
export function skiWeeks(trips, today, weeks = 8) {
  const first = addDays(mondayOf(today), -7 * (weeks - 1));
  const out = Array.from({ length: weeks }, (_, i) => ({ start: addDays(first, 7 * i), n: 0 }));
  for (const t of trips ?? []) {
    if (t?.domain !== 'ski' || t.skipped || !t.startDate || t.startDate < first || t.startDate > today) continue;
    if (!(hasNotes(t) || isPastSki(t, today))) continue;
    const i = Math.floor((Date.parse(`${mondayOf(t.startDate)}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / (7 * 864e5));
    if (out[i]) out[i].n += Math.max(1, Number(t.days) || 1);
  }
  return out;
}

/** In October: the days until 1 November; otherwise null. */
export function daysToSeason(today) {
  if (Number(today.slice(5, 7)) !== 10) return null;
  const start = `${today.slice(0, 4)}-11-01`;
  return Math.round((Date.parse(`${start}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5);
}

/** Last season in short: { id, tours, hm, peaks } of the season before the one of today. */
export function lastSeason(trips, today) {
  const startYear = Number(seasonId(today).slice(0, 4));
  return seasonStats(trips, `${startYear}-09-30`);
}

/**
 * Metres climbed per ski (the ski picked in «Nach der Tour»), over all seasons and in this one.
 * → [{ itemId, hm, tours, seasonHm }], most metres first.
 */
export function hmPerSki(trips, today) {
  const id = seasonId(today);
  const season = new Set(seasonTrips(trips, id).map((t) => t.id));
  const by = new Map();
  for (const t of trips ?? []) {
    const ski = t?.ski?.skiItemId;
    if (t?.domain !== 'ski' || !ski || t.skipped) continue;
    const row = by.get(ski) ?? { itemId: ski, hm: 0, tours: 0, seasonHm: 0 };
    row.hm += hmOf(t);
    row.tours += 1;
    if (season.has(t.id)) row.seasonHm += hmOf(t);
    by.set(ski, row);
  }
  return [...by.values()].sort((a, b) => b.hm - a.hm);
}
