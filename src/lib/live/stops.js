/**
 * Paket U3 «Live-Karte»: the stops for the live map from outside (free, no key, fair use).
 * - with a route: the stops along it (outside.js fetchPois), kept as POI_CACHE + tripId, the same answer
 *   the race page «Along the route» keeps;
 * - without a route: the stops around you (live-lib aroundQuery), kept as AROUND_CACHE with its centre.
 * Answers live on this device (meta table, cacheGet/cacheSet); a new request only when the kept one does
 * not fit any more. The fetcher is passed in for tests.
 */
import { OVERPASS, POI_CACHE, fetchPois, poisFrom } from '../race/outside.js';
import { queued } from '../route/oneatatime.js';
import { cacheGet, cacheSet } from '../race/store.js';
import { aroundQuery, aroundFresh } from './live-lib.js';

export const AROUND_CACHE = 'live-poi-around';

/** Overpass JSON → stops without km: [{ id, kind, name, lat, lon, hours, sub, phone }]. */
export const aroundFrom = (json) => poisFrom(json, []).map(({ km, offKm, ...p }) => p);

/** The stops around here: the kept ones when they still fit, else a new request (throws 'busy' | 'failed'). */
export async function loadAround(here, { fetcher = fetch, force = false, now = Date.now() } = {}) {
  const kept = await cacheGet(AROUND_CACHE);
  if (!force && aroundFresh(kept?.data ? { ...kept.data, at: kept.at } : null, here, now)) return kept.data.list;
  const res = await queued(() => fetcher(OVERPASS, { method: 'POST', body: `data=${encodeURIComponent(aroundQuery(here))}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  const list = aroundFrom(await res.json());
  await cacheSet(AROUND_CACHE, { center: { lat: here.lat, lon: here.lon }, list });
  return list;
}

/** The stops along a trip's route (kept per trip). */
export async function loadAlong(tripId, pts, { fetcher = fetch } = {}) {
  const list = await fetchPois(pts, fetcher);
  await cacheSet(POI_CACHE + tripId, list);
  return list;
}
