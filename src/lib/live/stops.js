/**
 * Paket U3 «Live-Karte»: the stops for the live map from outside (free, no key, fair use).
 * - with a route: the stops along it (outside.js fetchPois), kept as POI_CACHE + tripId, the same answer
 *   the race page «Along the route» keeps;
 * - without a route: the stops around you (live-lib aroundQuery), kept as AROUND_CACHE with its centre.
 * Answers live on this device (meta table, cacheGet/cacheSet); a new request only when the kept one does
 * not fit any more. The fetcher is passed in for tests.
 */
import { POI_CACHE, poiQuery, poisFrom, overpassFailed } from '../race/outside.js';
import { queued, postTimed } from '../route/oneatatime.js';
import { overpassUrls, whyFailed } from '../route/pois.js';
import { cacheGet, cacheSet } from '../race/store.js';
import { aroundQuery, aroundFresh } from './live-lib.js';

export const AROUND_CACHE = 'live-poi-around';
/** The kinds asked for around you; a kept answer of fewer kinds (before «Stopps in der Nähe», 24.10.2026) is asked anew. */
export const AROUND_V = 2;

/**
 * Live Navigation PR 2 (Noah 26.10.2026 «OSM ausgelastet, Backup-Server»): the live map asked only one server.
 * Now each server in turn (the Swiss one first in Switzerland); when all fail, the error is the true reason:
 * 'busy' (full or too slow), 'net' (none reachable) or 'failed'. → the JSON answer.
 */
export async function askServers(fetcher, query, pts = [], ms = undefined) {
  const errors = [];
  for (const url of overpassUrls(pts)) {
    try {
      const res = await postTimed(fetcher, url, { method: 'POST', body: `data=${encodeURIComponent(query)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, ms);
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      const json = await res.json();
      if (overpassFailed(json)) throw new Error('overpass gave up'); // the query was too big for it: not «busy»
      return json;
    } catch (e) {
      errors.push(e);
    }
  }
  throw new Error(whyFailed(errors));
}

/** Overpass JSON → stops without km: [{ id, kind, name, lat, lon, hours, sub, phone }]. */
export const aroundFrom = (json) => poisFrom(json, []).map(({ km, offKm, ...p }) => p);

/** The stops around here: the kept ones when they still fit, else a new request (throws 'busy' | 'net' | 'failed'). */
export async function loadAround(here, { fetcher = fetch, force = false, now = Date.now() } = {}) {
  const kept = await cacheGet(AROUND_CACHE);
  if (!force && kept?.data?.v === AROUND_V && aroundFresh({ ...kept.data, at: kept.at }, here, now)) return kept.data.list;
  const json = await queued(() => askServers(fetcher, aroundQuery(here), [here]));
  const list = aroundFrom(json);
  await cacheSet(AROUND_CACHE, { v: AROUND_V, center: { lat: here.lat, lon: here.lon }, list });
  return list;
}

/**
 * Noah 22.10.2026 (picture): «Stopps entlang der Strecke laden» did nothing. The live map asked
 * OpenStreetMap for the whole route at once; on a long route the free server ran out of time and
 * answered with an empty list (and a «runtime error» note), so no stops came and no message either.
 * Now the live map asks only for the stretch ahead of you (ALONG_AHEAD_KM), in small pieces
 * (ALONG_CHUNK_KM), one after the other. Each piece is kept as soon as it is there; the stops of the
 * rest of the route that were kept before stay.
 */
export const ALONG_AHEAD_KM = 60;
export const ALONG_CHUNK_KM = 20;
/** The time one piece may take (ms). */
export const ALONG_REQUEST_MS = 45_000;

/** The pieces of the route from fromKm to toKm: point lists of at most chunkKm, a point every ≥ stepKm. */
export function stretches(pts = [], fromKm = 0, toKm = Infinity, chunkKm = ALONG_CHUNK_KM, stepKm = 0.4) {
  const out = [];
  if (pts.length < 2) return out;
  const end = Math.min(toKm, pts.at(-1).km);
  for (let a = Math.max(0, fromKm); a < end - 0.01; a += chunkKm) {
    const b = Math.min(end, a + chunkKm);
    const i0 = Math.max(0, pts.findIndex((p) => p.km >= a) - 1);
    let i1 = pts.findIndex((p) => p.km >= b);
    if (i1 < 0) i1 = pts.length - 1;
    const part = [];
    for (let i = i0; i <= i1; i++) {
      const p = pts[i];
      if (i === i0 || i === i1 || p.km - part.at(-1).km >= stepKm) part.push(p);
    }
    if (part.length > 1) out.push(part);
  }
  return out;
}

/** The stops along a trip's route ahead of fromKm (kept per trip); throws 'busy' | 'net' | 'failed'. */
export async function loadAlong(tripId, pts, { fetcher = fetch, fromKm = 0, aheadKm = ALONG_AHEAD_KM, chunkKm = ALONG_CHUNK_KM } = {}) {
  const from = Math.max(0, Number.isFinite(fromKm) ? fromKm : 0);
  const parts = stretches(pts, from, from + aheadKm, chunkKm);
  const key = POI_CACHE + tripId;
  const kept = await cacheGet(key);
  let list = Array.isArray(kept?.data) ? kept.data : [];
  for (const part of parts) {
    const a = part[0].km;
    const b = part.at(-1).km;
    const json = await queued(() => askServers(fetcher, poiQuery(part), part, ALONG_REQUEST_MS));
    const found = poisFrom(json, pts);
    const ids = new Set(found.map((p) => p.id));
    list = [...list.filter((p) => !ids.has(p.id) && !(p.km >= a && p.km <= b)), ...found].sort((x, y) => x.km - y.km);
    await cacheSet(key, list);
  }
  return list;
}
