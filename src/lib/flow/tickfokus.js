/**
 * «Im Fokus» für alle Sportarten (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung», Schritt D):
 * Auswerten › Im Fokus and «Letzte 7 Tage» show the sports you ticked in Aktiv (tennis, ice hockey, gym, yoga …) next to the
 * Strava sports. Pure functions over the shared units (flow/einheiten.js); the cards are drawn by garmin/Focus.svelte.
 *
 * What counts here: ticks of the move ring that have no Strava activity of their own. A tick that belongs to a Strava
 * activity is already counted by the Strava sport (run, hike, other), and the bike keeps its km from the rides list, so
 * neither is counted twice. Daily habits (every goal «each day») and trip days are left out, as in the week calculation
 * (weekcalc.js). Time is «gemessen» or «ca.» (the usual duration of the sport), kept apart. Only looking, nothing is saved.
 */
import { addDays } from '../health.js';
import { einheiten } from './einheiten.js';
import { training } from './sportjahr.js';
import { BIKE_ACT } from '../sportsbase.js';

const days = (from, to) => {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};
const secsOf = (u) => (Number(u.min) > 0 ? Number(u.min) * 60 : 0);

/**
 * The ticked units that «Im Fokus» adds to the Strava sports.
 * data: { log (flowLog), activities (db.activities), acts (flowActs), usual, map }
 */
export function tickUnits(data = {}) {
  const { log = [], activities = [], acts = [], usual = {}, map = {} } = data;
  const daily = new Set(acts.filter((a) => (a.goals ?? []).length && a.goals.every((g) => g.days === 1)).map((a) => a.id));
  const own = log.filter((e) => e.via !== 'trip' && !daily.has(e.actId));
  return training(einheiten({ log: own, activities, acts, usual, map })).filter((u) => !u.stravaId && u.actId && u.actId !== BIKE_ACT);
}

/**
 * The ticked sports of a range, the one with most time first (then most sessions, then name).
 * → [{ actId, n, secs, caSecs, nCa, noTime, est }]  secs = measured + estimated, caSecs = the estimated part
 */
export function tickRows(units, from, to) {
  const by = new Map();
  for (const u of units) {
    if (u.day < from || u.day > to) continue;
    const r = by.get(u.actId) ?? { actId: u.actId, n: 0, secs: 0, caSecs: 0, nCa: 0, noTime: 0, est: false };
    r.n += 1;
    r.secs += secsOf(u);
    if (u.minQuelle === 'ca.') {
      r.caSecs += secsOf(u);
      r.nCa += 1;
      r.est = true;
    } else if (u.minQuelle !== 'gemessen') r.noTime += 1;
    by.set(u.actId, r);
  }
  return [...by.values()].sort((a, b) => b.secs - a.secs || b.n - a.n || String(a.actId).localeCompare(String(b.actId)));
}

/**
 * «Im Fokus» card of one ticked sport: the 7 days up to today (one bar per day, the time, or the sessions when nobody
 * knows a time) and the 28 days as dots.  → { actId, from, to, n, secs, est, bars: [{ day, secs, n }], dots: [{ day, size 0–3 }] }
 */
export function tickFocus(units, today, actId) {
  const mine = units.filter((u) => u.actId === actId);
  const from = addDays(today, -6);
  const one = (day) => {
    const us = mine.filter((u) => u.day === day);
    return { day, n: us.length, secs: us.reduce((s, u) => s + secsOf(u), 0) };
  };
  const bars = days(from, today).map(one);
  const val = (b) => b.secs || b.n * 1800;
  const all = days(addDays(today, -27), today).map(one);
  const top = Math.max(1, ...all.map(val));
  const dots = all.map((d) => ({ day: d.day, size: !d.n ? 0 : val(d) >= top * 0.66 ? 3 : val(d) >= top * 0.33 ? 2 : 1 }));
  const week = mine.filter((u) => u.day >= from && u.day <= today);
  return { actId, from, to: today, n: week.length, secs: week.reduce((s, u) => s + secsOf(u), 0), est: week.some((u) => u.minQuelle === 'ca.'), bars, dots };
}

/** The ticked sports with a session in the last 7 days, the one with most time first. */
export const tickKinds = (units, today) => tickRows(units, addDays(today, -6), today).map((r) => r.actId);
