/**
 * «Bereit für den Traum?» (Träume und Neuland N16, Noah 27.10.2026 «1-5 a»): in the window of a dream, what you
 * already have and what is still missing: the longest ride and the most climb in one ride of the last 12
 * months against what the dream asks per day, days in a row for a tour of several days, and sleeping gear.
 * Only a hint, never a verdict: «ok» when you have about 85 % of it.
 * Pure, tested in tests/bereit.test.js.
 */
import { heatKind } from '../heat/heat.js';

export const ENOUGH = 0.85;
/** A day counts for «days in a row» from this many km. */
export const DAY_KM = 20;

const plusDays = (day, n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${day}T12:00:00Z`));
const pos = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

/** What the dream asks: { days, kmDay, gainDay } (null when not known). */
export function needOf(dream) {
  const days = Math.max(1, Math.round(Number(dream?.days) || 1));
  const km = pos(dream?.route?.km ?? dream?.facts?.km);
  const gain = pos(dream?.route?.gainM ?? dream?.facts?.gainM);
  return { days, kmDay: km ? Math.round(km / days) : null, gainDay: gain ? Math.round(gain / days) : null };
}

/** Bike rides of the last year as [{ day, km, gainM }]: Strava rides plus uploaded rides on other days. */
export function ridesOf({ activities = [], rides = [] } = {}, today) {
  const from = plusDays(today, -365);
  const out = [];
  const stravaDays = new Set();
  for (const a of activities ?? []) {
    if (!a?.day || a.day > today || a.day < from || a.trainer || heatKind(a.type) !== 'bike') continue;
    stravaDays.add(a.day);
    out.push({ day: a.day, km: pos(a.km) ?? 0, gainM: pos(a.hm ?? a.gainM) ?? 0 });
  }
  for (const r of rides ?? []) {
    if (!r?.date || r.date > today || r.date < from || stravaDays.has(r.date)) continue;
    out.push({ day: r.date, km: pos(r.km) ?? 0, gainM: pos(r.gainM ?? r.gain) ?? 0 });
  }
  return out;
}

/** The most days in a row with at least DAY_KM km (rides of one day added up). */
export function daysInRow(list = []) {
  const perDay = new Map();
  for (const r of list) perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.km);
  const days = [...perDay].filter(([, km]) => km >= DAY_KM).map(([d]) => d).sort();
  let best = 0;
  let run = 0;
  let last = null;
  for (const d of days) {
    run = last && plusDays(last, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    last = d;
  }
  return best;
}

/**
 * The checks for one dream: [{ key: 'km'|'gain'|'days'|'sleep', ok, have, need, missing }] (missing: how much
 * is still lacking, 0 when ok). Leaves out what the dream does not tell (no km → no km check). items: the gear.
 */
export function readiness(dream, { activities = [], rides = [], items = [], today } = {}) {
  const need = needOf(dream);
  const list = ridesOf({ activities, rides }, today);
  const out = [];
  const row = (key, have, want) => {
    const ok = have >= want * ENOUGH;
    out.push({ key, ok, have, need: want, missing: ok ? 0 : Math.max(0, Math.round(want - have)) });
  };
  if (need.kmDay) row('km', Math.round(Math.max(0, ...list.map((r) => r.km))), need.kmDay);
  if (need.gainDay) row('gain', Math.round(Math.max(0, ...list.map((r) => r.gainM))), need.gainDay);
  if (need.days > 1) {
    const want = Math.min(need.days, 3);
    const have = daysInRow(list);
    out.push({ key: 'days', ok: have >= want, have, need: want, missing: Math.max(0, want - have) });
    const sleep = (items ?? []).filter((i) => i?.category === 'sleep' && i.ownership !== 'gone').length;
    out.push({ key: 'sleep', ok: sleep > 0, have: sleep, need: 1, missing: sleep > 0 ? 0 : 1 });
  }
  return out;
}
