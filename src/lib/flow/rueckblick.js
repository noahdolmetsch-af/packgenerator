/**
 * «Rückblick pro Sportart» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S4, Entwurf 2): one sport of the
 * Sportjahr, looked at alone. Pure functions over the common list of units (einheiten.js, training() of
 * sportjahr.js); the page is src/pages/SportRueckblick.svelte. Only looking: nothing is judged or saved.
 *
 * The feeling after a unit (leicht, gut, hart) is not shown yet: it arrives with the thread «Training erfassen»
 * (`u.feel` is already passed on by einheiten.js).
 */
import { totals } from './sportjahr.js';

const mins = (u) => (Number(u.min) > 0 ? Number(u.min) : 0);
const inWin = (list, w) => (w ? list.filter((u) => u.day >= w.from && u.day <= w.to) : []);

/** The units of one sport. */
export const unitsOf = (units = [], sport) => units.filter((u) => u.sport === sport);

/** The numbers of one sport in a window: totals, average duration of the measured units, and the same a year earlier. */
export function rueckblick(units = [], sport, win, prevWin = null) {
  const mine = unitsOf(units, sport);
  const now = inWin(mine, win);
  const before = prevWin ? inWin(mine, prevWin) : null;
  const avg = (list) => {
    const m = list.filter((u) => u.minQuelle === 'gemessen' && mins(u) > 0);
    return m.length ? Math.round(m.reduce((s, u) => s + mins(u), 0) / m.length) : null;
  };
  return {
    now: totals(now),
    prev: before ? totals(before) : null,
    avgMin: avg(now),
    prevAvgMin: before ? avg(before) : null,
    units: now,
  };
}

/** Where the units come from: Strava, or by hand (tick, timer, plan). */
export function quellen(units = []) {
  let strava = 0;
  let hand = 0;
  for (const u of units) {
    if (u.quelle === 'strava') strava += 1;
    else hand += 1;
  }
  return { strava, hand };
}

/** Best values of a list: the longest measured unit, the farthest distance, the most units in one month. */
export function bestwerte(units = []) {
  let longest = null;
  let farthest = null;
  const months = new Map();
  for (const u of units) {
    if (u.minQuelle === 'gemessen' && mins(u) > (longest?.min ?? 0)) longest = { min: mins(u), day: u.day };
    if (Number(u.km) > (farthest?.km ?? 0)) farthest = { km: Math.round(Number(u.km) * 10) / 10, day: u.day };
    const m = u.day.slice(0, 7);
    months.set(m, (months.get(m) ?? 0) + 1);
  }
  let busiest = null;
  for (const [month, n] of [...months].sort((a, b) => a[0].localeCompare(b[0]))) if (n > (busiest?.n ?? 0)) busiest = { month, n };
  return { longest, farthest, busiest };
}
