/**
 * «Eigene Wochenziele» (Noah 05.11.2026, Ideen für alle Bereiche, Aktiv 4b): a few small goals of your own for the
 * calendar week Monday to Sunday (for example 2× Meditation, 150 km by bike) with a bar each. Everything is a suggestion:
 * a goal can be added, changed, put in another order and deleted (with Undo). The rings count the last 7 days
 * against the goals of the sports; these goals are separate and follow the calendar week.
 *
 * Setting WEEK_GOALS_KEY: [{ id, kind: 'km' | 'act', actId (for 'act'), of (whole number above 0) }]. It travels with the
 * backup like every setting. Pure, tested in tests/weekgoals.test.js.
 */
import { entriesFor } from '../flow.js';
import { weekOf } from '../flowweek.js';

export const WEEK_GOALS_KEY = 'flow.weekGoals';
export const MAX_GOALS = 12;
export const KINDS = ['km', 'act'];

const whole = (v) => {
  const n = Math.round(Number(String(v ?? '').replace(/[^\d.]/g, '')));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
/** What the typed text means: a whole number above 0, or undefined for nonsense (the old value stays). */
export const typedOf = (text) => whole(text) || undefined;

/** The stored list made safe: valid goals only, no doubles of the same thing, at most MAX_GOALS. */
export function goalsOf(raw) {
  const seen = new Set();
  const out = [];
  for (const g of Array.isArray(raw) ? raw : []) {
    if (!g || !KINDS.includes(g.kind)) continue;
    const of = whole(g.of);
    if (!of || (g.kind === 'act' && (typeof g.actId !== 'string' || !g.actId))) continue;
    const key = g.kind === 'km' ? 'km' : `act:${g.actId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: String(g.id || key), kind: g.kind, ...(g.kind === 'act' ? { actId: g.actId } : {}), of });
    if (out.length >= MAX_GOALS) break;
  }
  return out;
}

/** Monday and Sunday (YYYY-MM-DD) of the week of the day. */
export function weekRange(today) {
  const w = weekOf(today);
  return { from: w[0], to: w[6] };
}

/** The km of the rides (rides: [{ date, km }], from withStravaRides) in the week, up to today. */
export function weekKm(rides = [], today) {
  const { from } = weekRange(today);
  return Math.round((rides ?? []).filter((r) => typeof r?.date === 'string' && r.date.slice(0, 10) >= from && r.date.slice(0, 10) <= today).reduce((s, r) => s + (Number(r.km) || 0), 0));
}

/** What an activity has this week: the amounts of its entries from Monday to today (as the goals of the sport count). */
export function weekDone(act, log = [], tripDayList = [], today) {
  if (!act) return 0;
  const { from } = weekRange(today);
  return entriesFor(act, log, tripDayList).filter((e) => e.day >= from && e.day <= today).reduce((s, e) => s + (Number(e.n) || 1), 0);
}

/**
 * One goal with its stand: { goal, have, of, fill (0…1), met, left (days to Sunday, today included), missing (the sport
 * is gone) }. data: { acts, log, tripDays, rides, today }.
 */
export function standOf(goal, { acts = [], log = [], tripDays = [], rides = [], today } = {}) {
  const left = Math.max(1, 7 - weekOf(today).indexOf(today));
  const act = goal.kind === 'act' ? acts.find((a) => a.id === goal.actId) : null;
  if (goal.kind === 'act' && !act) return { goal, have: 0, of: goal.of, fill: 0, met: false, left, missing: true };
  const have = goal.kind === 'km' ? weekKm(rides, today) : weekDone(act, log, tripDays, today);
  return { goal, have, of: goal.of, fill: Math.min(1, have / goal.of), met: have >= goal.of, left, missing: false };
}

/** The goals with their stands, in the order of the list. */
export const standsOf = (goals, data) => goals.map((g) => standOf(g, data));

/* ---------- changing the list (every function returns a new list) ---------- */
const keyOf = (g) => (g.kind === 'km' ? 'km' : `act:${g.actId}`);
/** The list with a goal added; the same thing twice, or past MAX_GOALS, leaves the list as it is. */
export function addGoal(list, { kind, actId, of }) {
  const g = { id: kind === 'km' ? 'km' : `act:${actId}`, kind, ...(kind === 'act' ? { actId } : {}), of };
  return goalsOf([...list, g]).length > list.length ? goalsOf([...list, g]) : list;
}
/** The list with the number of a goal changed (nonsense: unchanged). */
export const setOf = (list, id, of) => (whole(of) ? list.map((g) => (g.id === id ? { ...g, of: whole(of) } : g)) : list);
export const removeGoal = (list, id) => list.filter((g) => g.id !== id);
/** One place up (−1) or down (+1). */
export function stepGoal(list, id, dir) {
  const i = list.findIndex((g) => g.id === id);
  return moveTo(list, i, i + dir);
}
/** The row at place `from` moves to place `to` (indices as shown). */
export function moveTo(list, from, to) {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/**
 * What the card offers to add with one tap: 2× the first meditation-like sport of the mind ring, 150 km, 3× the first
 * move sport; only those not in the list yet. acts: normAct list (live ones, not paused).
 */
export function suggestions(acts = [], goals = []) {
  const have = new Set(goals.map(keyOf));
  const live = acts.filter((a) => !a.paused);
  const out = [];
  const mind = live.find((a) => a.id === 'meditation') ?? live.find((a) => a.ring === 'mind');
  if (mind) out.push({ kind: 'act', actId: mind.id, of: 2 });
  out.push({ kind: 'km', of: 150 });
  const move = live.find((a) => a.id === 'stretch') ?? live.find((a) => a.ring === 'move' && a.id !== 'bike');
  if (move) out.push({ kind: 'act', actId: move.id, of: 3 });
  return out.filter((s) => !have.has(keyOf(s)));
}

