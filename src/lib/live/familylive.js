/**
 * Paket U3 «Live-Karte» (Noah 19.10.2026 «4a»): while the live map runs, the family link of the Reise-Spur
 * (src/lib/spur/link.js) shows where you are. Every few minutes the live page calls refreshFamilyLink(trip,
 * here): when the trip has a link, its payload is made again (the same options the rider chose) with
 * `live: { lat, lon, at }` and sealed and uploaded the link's own way (putLink, /api/sync?action=spur).
 * Without a link nothing happens and nothing is sent. The viewer (SpurLink page) shows the point only
 * while it is younger than LIVE_MAX_MIN. With «leave out the first and last 500 m» on, a point near the
 * tour's start is not sent (home stays off the map).
 * withLive / liveOf / liveFresh are pure, tested in tests/live-after.test.js.
 */
import { linkPayload, putLink, CUT_KM } from '../spur/link.js';
import { distKm } from '../spur/polyline.js';

/** How often the live page refreshes the link (ms). */
export const LIVE_EVERY_MS = 5 * 60_000;
/** The viewer shows the live point while it is younger than this. */
export const LIVE_MAX_MIN = 30;

const r5 = (v) => Math.round(v * 1e5) / 1e5;

/**
 * The payload with the live point. here: { lat, lon, at? (ms) }; home: [lat, lon] of the tour's first
 * point or null; cut: the rider's «leave out 500 m». A point within CUT_KM of home is left out.
 */
export function withLive(payload, here, { now = Date.now(), home = null, cut = true } = {}) {
  if (!payload) return payload;
  const { live: _old, ...rest } = payload;
  if (!here || !Number.isFinite(here.lat) || !Number.isFinite(here.lon)) return rest;
  if (cut && home && distKm(home, [here.lat, here.lon]) < CUT_KM) return rest;
  const at = new Date(Number.isFinite(here.at) ? here.at : now).toISOString();
  return { ...rest, live: { lat: r5(here.lat), lon: r5(here.lon), at } };
}

/** The live point of an opened payload ({ live }), or null when it is missing or broken. */
export function liveOf(obj) {
  const l = obj?.live;
  if (!l || !Number.isFinite(l.lat) || !Number.isFinite(l.lon) || !Number.isFinite(Date.parse(l.at))) return null;
  return { pos: [l.lat, l.lon], at: l.at };
}

/** Is the live point young enough to show? */
export const liveFresh = (live, now = Date.now(), maxMin = LIVE_MAX_MIN) => !!live && now - Date.parse(live.at) <= maxMin * 60_000 && Date.parse(live.at) <= now + 5 * 60_000;

/** The first point of the tour's shown lines ([lat, lon]) or null. */
export const homeOf = (spur) => spur?.days?.flatMap((d) => d.lines.filter((l) => !l.hidden && l.pts.length >= 2))[0]?.pts[0] ?? null;

/**
 * Refresh the family link of a trip with the place now. trip: the trip (its spurLink is read fresh from
 * the database); here: { lat, lon, at? }. → 'sent' | 'no-link' | 'error'. Never throws.
 * opts: { db, now, put } (put: putLink, for tests).
 */
export async function refreshFamilyLink(trip, here, opts = {}) {
  try {
    const db = opts.db ?? (await import('../db.js')).db;
    const fresh = trip?.id ? await db.trips.get(trip.id) : null;
    const link = fresh?.spurLink;
    if (!link?.id || !link?.key) return 'no-link';
    const { tourSpur } = await import('../spur/spur.js');
    const { activitiesForTrip } = await import('../training.js');
    const [acts, book, rides, tracks, notes] = await Promise.all([db.activities.toArray(), db.kmBook.toArray(), db.rides.toArray(), db.tracks.where('tripId').equals(fresh.id).toArray(), db.notes.filter((x) => x.tripId === fresh.id).toArray()]);
    const spur = tourSpur(fresh, { acts: activitiesForTrip(fresh, acts, book), rides, tracks, notes });
    const o = link.opts ?? {};
    const cut = o.cut !== false;
    const now = opts.now ?? Date.now();
    const payload = withLive(linkPayload(fresh, spur, { places: o.places !== false, notes: !!o.notes, cut }, new Date(now)), here, { now, home: homeOf(spur), cut });
    const made = await (opts.put ?? putLink)(payload, link);
    await db.trips.update(fresh.id, { spurLink: { ...link, ...made, opts: link.opts } });
    return 'sent';
  } catch {
    return 'error';
  }
}
