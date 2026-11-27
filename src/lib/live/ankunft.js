/**
 * «Ankunfts-Bericht» (Noah 05.11.2026 «4b 5a 5b», 26.11.2026 «4a»): when you reach the end of the route the live map
 * says it on its own (with «Später»): when you arrived and how that is against the plan, riding time and stops against
 * the planned rest, the phone battery and the light you used. Pure: the ride gives the numbers; nothing is stored.
 *   → { arrivedAt, totalS, movingS, restS, stops: { n, totalS, longestS }, plan: { arriveAt, lateMin, restPlanS, restDiffMin } | null,
 *       battery: { from, to, usedPct } | null, dark: { min, lights: [{ name, pct }] } }
 */
import { lightLeft } from './live-lib.js';

/** At the end of the route when you are this close (km) to its last point. */
export const AT_GOAL_KM = 0.3;
const STEP = 10 * 6e4;

/** Are you at the end of the route? (km = where you are on it, totalKm = its length) */
export const atGoal = ({ km, totalKm }) => Number.isFinite(km) && Number.isFinite(totalKm) && totalKm > 1 && totalKm - km <= AT_GOAL_KM;

/** Minutes of darkness between two moments at a place (checked every 10 minutes). */
export function darkMinutes(lat, lon, from, to) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !(to > from)) return 0;
  let ms = 0;
  for (let t = from; t < to; t += STEP) if (lightLeft(lat, lon, t)?.dark) ms += Math.min(STEP, to - t);
  return Math.round(ms / 6e4);
}

export function arrivalReport({ startAt, endAt, movingS = 0, stops = [], plan = null, totalKm = null, bat = null, lat = null, lon = null, lights = [] }) {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return null;
  const totalS = Math.round((endAt - startAt) / 1000);
  const moving = Math.max(0, Math.min(totalS, Math.round(movingS)));
  const restS = totalS - moving;
  const stopS = stops.map((s) => Number(s.s) || 0);
  let against = null;
  if (plan?.etaOf && Number.isFinite(totalKm)) {
    const arriveAt = plan.etaOf(totalKm);
    if (Number.isFinite(arriveAt)) {
      const restPlanS = Number.isFinite(plan.offH) ? Math.round(plan.offH * 3600) : null;
      against = { arriveAt: Math.round(arriveAt), lateMin: Math.round((endAt - arriveAt) / 6e4), restPlanS, restDiffMin: restPlanS == null ? null : Math.round((restS - restPlanS) / 60) };
    }
  }
  const battery = bat && Number.isFinite(bat.from) && Number.isFinite(bat.to) ? { from: Math.round(bat.from * 100), to: Math.round(bat.to * 100), usedPct: Math.max(0, Math.round((bat.from - bat.to) * 100)) } : null;
  const min = darkMinutes(lat, lon, startAt, endAt);
  return {
    arrivedAt: endAt,
    totalS,
    movingS: moving,
    restS,
    stops: { n: stops.length, totalS: stopS.reduce((a, b) => a + b, 0), longestS: Math.max(0, ...stopS) },
    plan: against,
    battery,
    dark: { min, lights: min > 0 ? lights.map((l) => ({ name: l.name, pct: Math.min(100, Math.round((Number(l.pctPerMin) || 0) * min)) })).filter((l) => l.pct > 0) : [] },
  };
}
