/**
 * Paket U «Rennen»: small pure helpers for Race mode, After the race and the briefing sheet
 * (RaceMode.svelte, After.svelte, Briefing.svelte). Tested in tests/race-ride.test.js.
 *
 * Stored fields these parts add to the race record (race.js header): sleepLog [{ id, at, min }] (at = when
 * you woke up), creamAt (ISO), foodPerH, whyOn, rainH, gravelPct, yearNote.
 */
import { snap, addDay, dayOfMs } from './race.js';

/** When you get to km k from now, at the plan's pace from where you are (null without a plan). */
export const etaFrom = (plan, km, now) => (plan ? (k) => now + (plan.etaOf(k) - plan.etaOf(km)) : null);

/** The places of some kinds ahead of km (within rangeKm), nearest first. */
export const ahead = (pois = [], km, kinds = [], rangeKm = Infinity) =>
  pois.filter((p) => kinds.includes(p.kind) && p.km >= km && p.km - km <= rangeKm).sort((a, b) => a.km - b.km);

/** The next checkpoint row (checkpointRows) after km, or null. */
export const nextCheckpoint = (rows = [], km) => rows.find((r) => (Number(r.km) || 0) > km) ?? null;

/**
 * 29 · The next small goal: the next mini goal not ticked, or the next food or water place if that is
 * nearer. → { key, km, name, kind } or null (key null for a place: it cannot be ticked).
 */
export function nextGoal(goals = [], done = [], pois = [], km) {
  const g = goals.find((x) => x.km > km && !done.includes(x.key)) ?? null;
  const p = ahead(pois, km + 0.05, ['shop', 'fuel', 'food', 'water'])[0] ?? null;
  if (p && (!g || p.km < g.km)) return { key: null, km: p.km, name: p.name || '', kind: p.kind };
  return g ? { ...g, kind: 'goal' } : null;
}

/**
 * The weather series nearest to km from the weather cache. The cache is either Open-Meteo's array of
 * series (each with latitude/longitude) or { points: [{ km }], series: [...] }. → series or null
 */
export function wxNear(data, pts = [], km) {
  const series = Array.isArray(data) ? data : Array.isArray(data?.series) ? data.series : [];
  if (!series.length) return null;
  const kms = series.map((s, i) => {
    const k = data?.points?.[i]?.km ?? s.km;
    if (Number.isFinite(k)) return k;
    if (pts.length > 1 && Number.isFinite(s.latitude) && Number.isFinite(s.longitude)) return snap(pts, { lat: s.latitude, lon: s.longitude }).km;
    return null;
  });
  let best = null;
  kms.forEach((k, i) => {
    if (k != null && (best == null || Math.abs(k - km) < Math.abs(kms[best] - km))) best = i;
  });
  return best == null ? series[0] : series[best];
}

/** Minutes slept in the race so far (the sleep log). */
export const sleptMin = (log = []) => log.reduce((s, x) => s + (Number(x.min) || 0), 0);

/** Hours awake: since the last logged wake-up, else since the start. */
export function awakeH(log = [], start, now) {
  const last = log.map((x) => Date.parse(x.at)).filter(Number.isFinite).sort((a, b) => a - b).at(-1);
  const from = Number.isFinite(last) ? last : start;
  return Number.isFinite(from) && now > from ? (now - from) / 36e5 : 0;
}

/** 18 · Riding on to a bed: km and hours to it and the arrival at a pace. → { km, h, at } or null */
export function toBed(bed, km, now, kmh) {
  if (!bed || !(kmh > 0)) return null;
  const d = Math.max(0, bed.km - km);
  const h = d / kmh;
  return { km: Math.round(d * 10) / 10, h, at: now + h * 36e5 };
}

/** The day of the race (1 = start day) at a moment. */
export function stageOf(startMs, now) {
  if (!Number.isFinite(startMs)) return 1;
  const a = Date.parse(`${dayOfMs(startMs)}T12:00:00Z`);
  const b = Date.parse(`${dayOfMs(now)}T12:00:00Z`);
  return Math.max(1, Math.round((b - a) / 864e5) + 1);
}

/** The calendar days of a trip ('YYYY-MM-DD'). */
export function tripDays(trip) {
  if (!trip?.startDate) return [];
  const n = Math.max(1, Number(trip.days) || 1);
  return Array.from({ length: n }, (_, i) => addDay(trip.startDate, i));
}

/**
 * 6 · The rides for the stop analysis: uploaded rides of the trip plus Strava rides on the race days
 * (an activity on a day that already has an uploaded ride is left out, so nothing counts twice).
 */
export function rideTimes(rides = [], activities = [], days = []) {
  const own = rides.map((r) => ({ km: r.km || 0, movingH: r.movingH || 0, totalH: r.totalH || 0, pauses: r.pauses ?? [], day: r.date }));
  const taken = new Set(own.map((r) => r.day));
  const acts = activities
    .filter((a) => days.includes(a.day) && (a.kind ?? 'bike') === 'bike' && !taken.has(a.day))
    .map((a) => ({ km: a.km || 0, movingH: (a.movingS || 0) / 3600, totalH: (a.elapsedS ?? a.movingS ?? 0) / 3600, pauses: [], day: a.day }));
  return [...own, ...acts];
}

/** Metres up between two km of a profile [[km, m], …] (null without a profile). */
export function gainBetween(profile = [], from, to) {
  const pts = (profile ?? []).filter((p) => p[1] != null && p[0] >= from && p[0] <= to);
  if (pts.length < 2) return null;
  let up = 0;
  for (let i = 1; i < pts.length; i++) up += Math.max(0, pts[i][1] - pts[i - 1][1]);
  return Math.round(up);
}

/** The Sundays (and their dates) among the race days. */
export const sundays = (days = []) => days.filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 0);
