/**
 * «Analyse» idea «Velo-km und Verschleiss» (Noah 27.10.2026, all 7 ideas): the km of every bike per week
 * from the km book (only counted rides), and its total in the period. Pure: days are 'YYYY-MM-DD'.
 */
import { addDays } from '../analyse.js';
import { mondayOf } from './diagram.js';

const rides = (e) => e?.state === 'counted' && e.kind === 'ride' && e.date && Number.isFinite(Number(e.km)) && Number(e.km) > 0;

/** km per week (Monday on) of each bike over the last `weeks` weeks up to today. → [{ key, km: { bikeId: km } }] */
export function bikeWeeks(entries = [], bikeIds = [], today, weeks = 12) {
  const last = mondayOf(today);
  const out = Array.from({ length: weeks }, (_, i) => ({ key: addDays(last, -7 * (weeks - 1 - i)), km: Object.fromEntries(bikeIds.map((id) => [id, 0])) }));
  const at = new Map(out.map((w) => [w.key, w]));
  for (const e of entries) {
    if (!rides(e) || e.date > today || !(e.bikeId in (out[0]?.km ?? {}))) continue;
    const w = at.get(mondayOf(e.date));
    if (w) w.km[e.bikeId] += Number(e.km);
  }
  return out;
}

/** The km of each bike inside the days (counted rides), most first; bikes without a km left out. */
export function bikeTotals(entries = [], bikes = [], days = []) {
  const inside = new Set(days);
  const km = new Map();
  for (const e of entries) if (rides(e) && inside.has(e.date)) km.set(e.bikeId, (km.get(e.bikeId) ?? 0) + Number(e.km));
  return bikes
    .map((b) => ({ bike: b, km: Math.round(km.get(b.id) ?? 0) }))
    .filter((x) => x.km > 0)
    .sort((a, b) => b.km - a.km);
}
