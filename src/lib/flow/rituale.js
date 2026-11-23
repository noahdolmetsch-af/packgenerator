/**
 * «Erholung und Rituale» (Noah 22.11.2026 «a», Thread «Alle Sportarten und Erholung», Schritt J): sauna, cold water, friends,
 * meditation, a nap, the forest … the ticks of the rings «Ruhe» and «Geist» counted as TIMES per week, with the goal of the
 * activity next to it. They never count as sport hours (sportjahr.js training() keeps the ring «move»). Time is shown only where it
 * was measured; the usual duration («ca.») is not added up for rituals. Only reading, nothing is saved, nothing is rated.
 * Pure: no database, no clock.
 */
import { activeGoals, normAct } from '../flow.js';
import { einheiten } from './einheiten.js';
import { shiftDay } from '../training.js';

export const RITUAL_RINGS = ['mind', 'rest'];

const isRitual = (u) => RITUAL_RINGS.includes(u.ring) && u.quelle !== 'weg';

/** Days from a to b, both included. */
const span = (a, b) => Math.max(1, Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1);

/** The goal of an activity as times per week (the first live goal; «2× in 7 days» = 2, «1× a day» = 7), null without a goal. */
export function goalPerWeek(act, day) {
  const g = activeGoals(normAct(act), day)[0];
  if (!g || !g.count) return null;
  return Math.round(((g.count * 7) / g.days) * 10) / 10;
}

/**
 * units: einheiten() of ALL rings; acts: flowActs; from, to: the window (YYYY-MM-DD).
 * → [{ id, n, days, measuredMin, perWeek, goal }]: one row per ritual activity that was ticked in the window or has a live goal,
 * most ticks first, then by name order of the list. `goal` is per week (or null), `perWeek` the mean per week of the window.
 */
export function rituale(units = [], acts = [], from, to) {
  const weeks = span(from, to) / 7;
  const mine = acts.map(normAct).filter((a) => RITUAL_RINGS.includes(a.ring) && !a.paused);
  const rows = [];
  for (const a of mine) {
    const own = units.filter((u) => isRitual(u) && u.actId === a.id && u.day >= from && u.day <= to);
    const goal = goalPerWeek(a, to);
    if (!own.length && goal == null) continue;
    rows.push({
      id: a.id,
      n: own.length,
      days: new Set(own.map((u) => u.day)).size,
      measuredMin: own.reduce((s, u) => s + (u.minQuelle === 'gemessen' ? Number(u.min) || 0 : 0), 0),
      perWeek: Math.round((own.length / weeks) * 10) / 10,
      goal,
    });
  }
  return rows.sort((x, y) => y.n - x.n);
}

/** The week of the review: data as in WeekReview (log, flowActs, usual, map, acts = activities). Ticks of trip days do not count. */
export function ritualeWeek(data, monday, upto = shiftDay(monday, 6)) {
  const { log = [], flowActs = [], acts: activities = [], usual = {}, map = {} } = data ?? {};
  const end = shiftDay(monday, 6) < upto ? shiftDay(monday, 6) : upto;
  const units = einheiten({ log: log.filter((e) => e.via !== 'trip'), activities, acts: flowActs, usual, map });
  return { rows: rituale(units, flowActs, monday, end), from: monday, to: end };
}
