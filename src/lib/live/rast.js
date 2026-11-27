/**
 * «Rast suchen» (Pausen-Planer, Noah 26.11.2026 «1a 2a»): on a tap, three places to stop in the next 20 km of the
 * route, the one with the shortest detour first. Places that are closed when you get there come last. Only
 * the places the app already has (loaded along the route, also offline). Pure: the ride gives the km, the
 * places, the pace and the profile; nothing is stored.
 *   → { rows: [{ ...poi, distKm, detourKm, eta, gain, open }], next: nearest place beyond the range | null }
 */
import { rideH, gainBetween } from './live-lib.js';
import { openAt } from '../race/outside.js';

export const REST_KINDS = ['shop', 'food', 'fuel', 'water'];
export const REST_RANGE_KM = 20;
export const REST_N = 3;
const ROUND = (v) => Math.round(v * 10) / 10;

export function restStops({ pois = [], km, now = Date.now(), pace = {}, profile = [], rangeKm = REST_RANGE_KM, n = REST_N }) {
  if (!Number.isFinite(km)) return { rows: [], next: null };
  const ahead = pois.filter((p) => REST_KINDS.includes(p.kind) && Number.isFinite(Number(p.km)) && p.km >= km - 0.1).map((p) => ({ ...p, distKm: ROUND(Math.max(0, p.km - km)), detourKm: ROUND(2 * Math.max(0, Number(p.offKm) || 0)) }));
  const row = (p) => {
    const gain = gainBetween(profile, km, p.km);
    const eta = Math.round(now + (rideH(p.distKm, gain, pace) + (p.detourKm / 2) / 15) * 36e5);
    const open = p.hours ? openAt(p.hours, new Date(eta)) : null;
    return { ...p, gain, eta, open };
  };
  const closed = (p) => p.open?.open === false;
  const inRange = ahead.filter((p) => p.distKm <= rangeKm).map(row);
  inRange.sort((a, b) => closed(a) - closed(b) || a.detourKm - b.detourKm || a.distKm - b.distKm);
  const beyond = ahead.filter((p) => p.distKm > rangeKm).sort((a, b) => a.distKm - b.distKm)[0];
  return { rows: inRange.slice(0, n), next: beyond ? row(beyond) : null };
}
