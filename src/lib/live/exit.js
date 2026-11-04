/**
 * «Ausstieg» (Noah 03.11.2026): the nearest station on the way, ahead and behind, for the moment you must stop
 * (injury, storm, a broken bike). Pure: the ride gives the km, the stops and the pace; nothing is stored.
 *   → { ahead, behind } with { poi, distKm, offKm, eta } (eta only for ahead), each null when none is in range
 */
import { rideH, gainBetween } from './live-lib.js';

export function nearestExit({ pois = [], km, now = Date.now(), pace = {}, profile = [], rangeKm = 150 }) {
  if (!Number.isFinite(km)) return null;
  const st = pois.filter((p) => p.kind === 'station' && Number.isFinite(p.km));
  const row = (p) => ({ poi: p, distKm: Math.round(Math.abs(p.km - km) * 10) / 10, offKm: Number.isFinite(p.offKm) ? Math.round(p.offKm * 10) / 10 : null });
  const near = (a, b) => (a.distKm + (a.offKm ?? 0)) - (b.distKm + (b.offKm ?? 0));
  const ahead = st.filter((p) => p.km >= km && p.km - km <= rangeKm).map(row).sort(near)[0] ?? null;
  const behind = st.filter((p) => p.km < km && km - p.km <= rangeKm).map(row).sort(near)[0] ?? null;
  if (ahead) ahead.eta = Math.round(now + (rideH(ahead.distKm, gainBetween(profile, km, ahead.poi.km), pace) + (ahead.offKm ?? 0) / 15) * 36e5);
  return { ahead, behind };
}
