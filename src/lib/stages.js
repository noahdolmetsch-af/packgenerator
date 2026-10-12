/**
 * v0.102.0 Design-Refresh P4 «Touren» (T3/T5, approved 12.10.2026 «Touren T1–T6 freigegeben»): the
 * stages of a trip of more than one day («Etappen») and the places where each day ends (the camps).
 *
 * Until now a route was shared out evenly over the days (ride.js stage). «Einteilen» lets Noah set
 * where each day ends and name the place. It is stored on the trip as an extra field (no new table,
 * no schema version; an older trip or backup simply has none and keeps the even split):
 *   trip.stages = { start: 'Biel', days: [{ km: 58, name: 'Chasseral' }, { km: 126, name: 'Saignelégier' }, { km: null, name: 'Delémont' }] }
 * days[n].km: where day n ends, in km from the start (the last day always ends at the route's end).
 * Everything here is pure and tested in tests/stages.test.js.
 */
import { distKm, climb } from './route.js';

const r1 = (v) => Math.round(v * 10) / 10;
const pos = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** How many days the trip has (a nonstop ride is one stage). */
export const stageDays = (trip) => (trip?.nonstop ? 1 : Math.max(1, Number(trip?.days) || 1));

/** Does the trip get stages (two days or more)? */
export const hasStages = (trip) => stageDays(trip) > 1;

/**
 * The km where each day ends: [end of day 1, …, end of the last day = total]. From trip.stages when
 * set and sensible (rising, inside the route), else the even split. Without a route: nulls.
 */
export function stageCuts(trip) {
  const days = stageDays(trip);
  const total = trip?.route?.km;
  if (!pos(total)) return Array(days).fill(null);
  const even = Array.from({ length: days }, (_, n) => r1((total * (n + 1)) / days));
  const own = trip?.stages?.days;
  if (!Array.isArray(own)) return even;
  const out = [];
  let prev = 0;
  for (let n = 0; n < days - 1; n++) {
    const km = own[n]?.km;
    // a cut that is missing, not rising or past the end falls back to the even point
    const ok = pos(km) && km > prev && km < total;
    const v = ok ? r1(km) : Math.max(even[n], r1(prev + 0.1));
    out.push(Math.min(v, total));
    prev = out[n];
  }
  out.push(r1(total));
  return out;
}

/** The km range of one day (0-based): { fromKm, toKm } or null without a route. */
export function dayRange(trip, day) {
  const cuts = stageCuts(trip);
  const d = Math.max(0, Math.min(cuts.length - 1, day));
  if (cuts[d] == null) return null;
  return { fromKm: d === 0 ? 0 : cuts[d - 1], toKm: cuts[d] };
}

/** Climbing between two km of the route, from its profile, scaled to the route's own climbing. */
export function gainBetween(route, fromKm, toKm) {
  if (route?.gainM == null) return null;
  const prof = route.profile ?? [];
  const total = route.km || prof.at(-1)?.[0] || 0;
  if (prof.length < 2) return total ? Math.round((route.gainM * (toKm - fromKm)) / total) : null;
  const all = climb(prof.map(([, ele]) => ({ ele }))).gain;
  if (!all) return Math.round((route.gainM * (toKm - fromKm)) / (total || 1));
  // the profile's own km may differ a little from the route's km: compare as a share of the way
  const end = prof.at(-1)[0] || 1;
  const [a, b] = [(fromKm / total) * end, (toKm / total) * end];
  const part = climb(prof.filter(([km]) => km >= a - 1e-9 && km <= b + 1e-9).map(([, ele]) => ({ ele }))).gain;
  return Math.round((route.gainM * part) / all);
}

/** The point at a km of a thinned route line [[lat, lon], …], scaled to the route's km. */
export function pointAtKm(line, km, totalKm) {
  if (!line?.length) return null;
  const pts = line.map(([lat, lon]) => ({ lat, lon }));
  if (pts.length === 1 || !(km > 0)) return pts[0];
  const legs = pts.slice(1).map((p, n) => distKm(pts[n], p));
  const sum = legs.reduce((s, l) => s + l, 0);
  let want = Math.min(1, km / (totalKm || sum || 1)) * sum;
  for (let n = 0; n < legs.length; n++) {
    if (want <= legs[n]) {
      const f = legs[n] ? want / legs[n] : 0;
      const a = pts[n];
      const b = pts[n + 1];
      return { lat: Math.round((a.lat + (b.lat - a.lat) * f) * 1e4) / 1e4, lon: Math.round((a.lon + (b.lon - a.lon) * f) * 1e4) / 1e4 };
    }
    want -= legs[n];
  }
  return pts.at(-1);
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * The days of the trip as stages: [{ day, date, fromKm, toKm, km, gainM, from, to, end, night }].
 * from / to: the names (start or the place of the night before, and where the day ends; '' when not
 * named). end: the point where the day ends ({ lat, lon }, null without a route line). night: a night
 * follows this day (all but the last).
 */
export function stagePlan(trip) {
  const days = stageDays(trip);
  const cuts = stageCuts(trip);
  const route = trip?.route ?? null;
  const own = trip?.stages ?? {};
  const name = (n) => (typeof own.days?.[n]?.name === 'string' ? own.days[n].name.trim() : '');
  return Array.from({ length: days }, (_, n) => {
    const toKm = cuts[n];
    const fromKm = n === 0 ? (toKm == null ? null : 0) : cuts[n - 1];
    const km = toKm == null ? null : r1(toKm - fromKm);
    const end = toKm == null ? null : n === days - 1 && route?.end ? { lat: route.end.lat, lon: route.end.lon } : pointAtKm(route?.line, toKm, route?.km);
    return {
      day: n,
      date: trip?.startDate ? addDays(trip.startDate, n) : null,
      fromKm,
      toKm,
      km,
      gainM: toKm == null ? null : gainBetween(route, fromKm, toKm),
      from: n === 0 ? (typeof own.start === 'string' ? own.start.trim() : '') : name(n - 1),
      to: name(n),
      end,
      night: n < days - 1,
    };
  });
}

/** Are the stages Noah's own (set with «Einteilen»), or the even split? */
export const ownStages = (trip) => Array.isArray(trip?.stages?.days) && trip.stages.days.some((d) => pos(d?.km) || (typeof d?.name === 'string' && d.name.trim()));

/**
 * The trip.stages to store from the sheet's fields: start name, and per day { km, name } (km as typed,
 * text or number). Cuts that are not rising or outside the route are dropped (they fall back to even).
 */
export function cleanStages({ start = '', days = [] } = {}, trip) {
  const n = stageDays(trip);
  const total = trip?.route?.km;
  let prev = 0;
  const out = Array.from({ length: n }, (_, i) => {
    const raw = days[i]?.km;
    const v = typeof raw === 'string' ? Number(raw.replace(',', '.')) : raw;
    let km = null;
    if (i < n - 1 && pos(v) && v > prev && (!pos(total) || v < total)) km = r1(v), (prev = km);
    return { km, name: typeof days[i]?.name === 'string' ? days[i].name.trim().slice(0, 60) : '' };
  });
  return { start: String(start ?? '').trim().slice(0, 60), days: out };
}
