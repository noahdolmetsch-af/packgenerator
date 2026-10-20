/**
 * Tour-Seite, Noah 20.10.2026 «1a 2a 3a 4a 5a» (the ideas on top of the gear):
 *   2 a personal sentence at the top, only when there is something to say (same route, the n-th time);
 *   3 the same route as a small chart (moving time per day);
 *   4 the weight of the gear of a trip, against the trip before;
 *   5 clothing by weather: what you wore on earlier tours at a similar temperature (Pack shows it).
 * Pure functions; names you type never go through t().
 */
import { isClothing } from '../wardrobe.js';
import { weatherOf } from '../review/rueckblick.js';

const FOOD = 'food';

/** The weight of a packing list: gear and food apart, with how many things have no weight yet. */
export function gearWeight(entries = [], items = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  let g = 0;
  let foodG = 0;
  let missing = 0;
  for (const e of entries) {
    const it = byId[e.itemId];
    if (!it) continue;
    if (it.weightG == null) {
      missing++;
      continue;
    }
    const w = it.weightG * (e.qty || 1);
    if (it.category === FOOD) foodG += w;
    else g += w;
  }
  return { g, foodG, missing, n: entries.length };
}

/** The trip before this one (by start date) that has a packing list, or null. */
export function tripBefore(trips = [], trip) {
  if (!trip?.startDate) return null;
  return (
    trips
      .filter((x) => x.id !== trip.id && !x.archivedAt && !x.skipped && (x.entries ?? []).length && x.startDate && x.startDate < trip.startDate)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
  );
}

/** The same route over time, oldest first: [{ id, day, movingS, hf, km, me }]. */
export function routeSeries(list = [], selfId = null) {
  return [...list]
    .filter((a) => a.movingS > 0)
    .sort((a, b) => `${a.day} ${a.time ?? ''}`.localeCompare(`${b.day} ${b.time ?? ''}`))
    .map((a) => ({ id: a.id, day: a.day, movingS: a.movingS, hf: a.hrAvg ?? null, km: a.km, me: String(a.id) === String(selfId) }));
}

/**
 * 2: the sentence at the top. → { key, vars } for t(), or null. On a route ridden before: which time it
 * is and how much faster or slower than the time before.
 */
export function personalLine(series = [], selfId = null) {
  const i = series.findIndex((x) => String(x.id) === String(selfId));
  if (i < 0 || series.length < 2) return null;
  const n = i + 1;
  if (i === 0) return { key: 'The first time on this route. You rode it {k} more times after.', vars: { k: series.length - 1 } };
  const prev = series[i - 1];
  const diff = Math.round((series[i].movingS - prev.movingS) / 60);
  if (diff === 0) return { key: 'Your {n}th time on this route, as fast as on {day}.', vars: { n, day: prev.day } };
  return diff < 0 ? { key: 'Your {n}th time on this route, {m} min faster than on {day}.', vars: { n, m: -diff, day: prev.day } } : { key: 'Your {n}th time on this route, {m} min slower than on {day}.', vars: { n, m: diff, day: prev.day } };
}

/** The temperature of a trip: the middle of its coldest and warmest (actual weather first), or null. */
export function tempOf(trip) {
  const days = trip?.wxReal?.days ?? [];
  const mins = days.map((d) => d.min).filter((v) => typeof v === 'number');
  const maxs = days.map((d) => d.max).filter((v) => typeof v === 'number');
  if (mins.length && maxs.length) return Math.round((Math.min(...mins) + Math.max(...maxs)) / 2);
  const w = weatherOf(trip);
  return w.tmin != null && w.tmax != null ? Math.round((w.tmin + w.tmax) / 2) : null;
}

/**
 * 5: the clothes of earlier finished trips at a similar temperature (± span °C). Used: on the list and not
 * marked «not used» in the Rückblick. → { n: trips, from, to, items: [{ id, worn, unused }] } or null.
 */
export function clothesAt(temp, { trips = [], debriefs = [], items = [], exceptTrip = null, span = 3 } = {}) {
  if (typeof temp !== 'number') return null;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const dBy = Object.fromEntries(debriefs.map((d) => [d.tripId, d]));
  const count = {};
  let n = 0;
  for (const tr of trips) {
    const d = dBy[tr.id];
    if (tr.id === exceptTrip || d?.status !== 'done' || !(tr.entries ?? []).length) continue;
    const tt = tempOf(tr);
    if (tt == null || Math.abs(tt - temp) > span) continue;
    n++;
    for (const e of tr.entries) {
      const it = byId[e.itemId];
      if (!it || !isClothing(it)) continue;
      const c = (count[it.id] ??= { id: it.id, worn: 0, unused: 0 });
      if (d.items?.[it.id] === 'unused') c.unused++;
      else c.worn++;
    }
  }
  if (!n) return null;
  const list = Object.values(count).sort((a, b) => b.worn - a.worn || a.unused - b.unused);
  return { n, from: temp - span, to: temp + span, items: list };
}
