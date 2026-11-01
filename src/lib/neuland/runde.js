/**
 * «Neuland-Runde» (Träume und Neuland N2, Noah 27.10.2026 «1-5 a»): a tap on a white spot plans a round from
 * home through it, so you ride somewhere new without planning. The round is a triangle home → the spot → a
 * point beside the way back → home; «Another round» takes the other side. The free bike router (BRouter, as
 * the surprise round: one request per tap, never in the background) finds the real way.
 * Pure functions plus planSpotRound (takes a fetcher for tests). Tested in tests/neuland-runde.test.js.
 */
import { bearing, destination, sectorOf, planSurprise } from '../ueberraschung.js';
import { distKm } from '../route.js';

/** The angle between the spot and the way back, seen from home (degrees). */
export const TURN = 35;

/**
 * The via points of a round to a spot { lat, lon }: the spot, then a point at 70 % of its distance, TURN
 * degrees to the left (side -1) or right (side 1). → { via, sector, km } (km: the straight triangle) or null.
 */
export function spotRoundPlan(home, spot, side = 1) {
  const fin = (v) => Number.isFinite(Number(v));
  if (!home || !spot || !fin(home.lat) || !fin(home.lon) || !fin(spot.lat) || !fin(spot.lon)) return null;
  const H = { lat: Number(home.lat), lon: Number(home.lon) };
  const S = { lat: Number(spot.lat), lon: Number(spot.lon) };
  const d = distKm(H, S);
  if (!(d > 0.3)) return null;
  const dir = bearing(H, S);
  const B = destination(H, dir + (side < 0 ? -TURN : TURN), d * 0.7);
  const km = Math.round((d + distKm(S, B) + distKm(B, H)) * 10) / 10;
  return { via: [S, B], sector: sectorOf(dir), km, side: side < 0 ? -1 : 1 };
}

/** Ask the router for the round. → as planSurprise (line, km, gainM, min …), throws 'busy', 'noroute' or 'failed'. */
export function planSpotRound(home, plan, opts = {}) {
  if (!plan) return Promise.reject(new Error('failed'));
  return planSurprise(home, { level: 'curious', profile: 'trekking', hours: null, sector: plan.sector, km: plan.km, via: plan.via }, opts);
}
