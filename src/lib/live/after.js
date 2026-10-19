/**
 * Paket U3 «Live-Karte», after the ride (Noah 19.10.2026): what the closed recording says and where it goes.
 * - the summary: km, Hm (when the trip's route has a profile), moving against stopped time (live-lib pauses);
 * - «3a» Debrief: the recording becomes a ride row like an uploaded GPX ride (table rides), so the trip's
 *   look back gets its km and pauses the app's own way (kmIntoDebrief, «Planned vs real»);
 * - «4a» bike km: the km go to the bike's ride ledger, unless a Strava/Garmin ride of the same bike
 *   overlaps in time (that one counts already: liveKmCounts);
 * - «2a» the evening line per day in the Reise-Spur: km, riding time, pauses.
 * ride: the closed recording { id, kind 'rec', tripId, startAt, endAt, pts: [[lat, lon, sec]], km }.
 * Pure, tested in tests/live-after.test.js.
 */
import { pauses, liveKmCounts, distKm, gainBetween, onRoute } from './live-lib.js';
import { lineKm } from '../race/race.js';
import { thin } from '../route.js';
import { zurichDay } from '../spur/spur.js';

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
/** A ride on the route: start and end within this of the route line. */
export const ON_ROUTE_M = 1000;
/** A Strava/Garmin entry without its own duration: assumed this fast (km/h) for the overlap test. */
export const GUESS_KMH = 15;

/** The points of a recording as fixes { lat, lon, at (ms) }. */
export const fixesOf = (ride) => (ride?.pts ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])).map(([lat, lon, s]) => ({ lat, lon, at: (ride.startAt ?? 0) + (Number(s) || 0) * 1000 }));

/** Hm of the ride from the trip's route profile, when start and end lie on the route; else null. */
export function hmOf(ride, trip = null) {
  const route = trip?.route;
  const prof = route?.profile;
  if (!Array.isArray(prof) || prof.length < 2) return null;
  const pts = lineKm(route);
  const f = fixesOf(ride);
  if (pts.length < 2 || f.length < 2) return null;
  const a = onRoute(pts, f[0]);
  const b = onRoute(pts, f.at(-1));
  if (!a || !b || a.offM > ON_ROUTE_M || b.offM > ON_ROUTE_M) return null;
  return gainBetween(prof, Math.min(a.km, b.km), Math.max(a.km, b.km));
}

/** The km along the fixes at each stop (for the pauses list). */
function kmAtStops(fixes, stops) {
  const out = [];
  let k = 0;
  let s = 0;
  for (let i = 0; i < fixes.length && s < stops.length; i++) {
    if (i) k += distKm(fixes[i - 1], fixes[i]);
    while (s < stops.length && stops[s].at <= fixes[i].at) out[s++] = k;
  }
  while (s < stops.length) out[s++] = k;
  return out;
}

/**
 * The summary of a ride: { km, hm, movingS, stoppedS, totalS, stops: [{ at, s, lat, lon, km }] }.
 * hm is null without a profile.
 */
export function rideSummary(ride, trip = null) {
  const fixes = fixesOf(ride);
  const p = pauses(fixes);
  const at = kmAtStops(fixes, p.stops);
  const totalS = fixes.length > 1 ? Math.round((fixes.at(-1).at - fixes[0].at) / 1000) : 0;
  return { km: r1(Number(ride?.km) || 0), hm: hmOf(ride, trip), movingS: p.movingS, stoppedS: p.stoppedS, totalS, stops: p.stops.map((x, i) => ({ ...x, km: r1(at[i]) })) };
}

/** The id of the ride row made from a recording (one per recording, so «Debrief» twice makes it once). */
export const rideIdOf = (ride) => `ride-live-${ride.id}`;

/**
 * The recording as a ride row of the table rides, shaped like an uploaded GPX ride (gpx.js analyseRide),
 * so the look back, «Planned vs real» and the ride list read it as they read any ride.
 * plan: plannedFor(trip, date, pace) or null; name: the shown name (the trip's title or «Live ride»).
 */
export function rideRowOf(ride, { trip = null, name = '', plan = null, basis = null, now = new Date() } = {}) {
  const s = rideSummary(ride, trip);
  const fixes = fixesOf(ride);
  const first = fixes[0] ?? { lat: 0, lon: 0, at: ride.startAt };
  const last = fixes.at(-1) ?? first;
  const r5 = (v) => Math.round(v * 1e5) / 1e5;
  return {
    id: rideIdOf(ride),
    name: String(name || trip?.title || '').slice(0, 120),
    file: '',
    source: 'live',
    liveId: ride.id,
    date: ride.day ?? zurichDay(first.at),
    startAt: new Date(first.at).toISOString(),
    km: s.km,
    gainM: s.hm,
    lossM: null,
    totalH: r2(s.totalS / 3600),
    pauseH: r2(s.stoppedS / 3600),
    movingH: r2(s.movingS / 3600),
    pauses: s.stops.map((x) => ({ km: x.km, at: new Date(x.at).toISOString(), min: Math.round(x.s / 60) })),
    parts: null,
    line: thin(fixes),
    profile: [],
    sensors: null,
    start: { lat: r5(first.lat), lon: r5(first.lon) },
    end: { lat: r5(last.lat), lon: r5(last.lon) },
    tripId: trip?.id ?? ride.tripId ?? null,
    plan,
    basis,
    answers: {},
    pace: false,
    createdAt: now.toISOString(),
  };
}

/**
 * The Strava/Garmin rides that already count for the bikes, as { start, end, bikeId } (ms) for liveKmCounts.
 * acts: the activities table (start ISO, elapsedS or movingS, kind); entries: the ride ledger (kmBook) —
 * an activity takes its bike from the ledger entry with its stravaId; a ledger ride from a file or a list
 * without an activity counts from its time with a guessed duration (GUESS_KMH).
 */
export function countedRides(acts = [], entries = []) {
  const bikeOf = new Map(entries.filter((e) => e.stravaId && e.bikeId).map((e) => [String(e.stravaId), e.bikeId]));
  const out = [];
  const seen = new Set();
  for (const a of acts) {
    if (a.kind !== 'bike' || a.trainer) continue;
    const start = Date.parse(a.start);
    const dur = Number(a.elapsedS) || Number(a.movingS) || 0;
    if (!Number.isFinite(start) || !(dur > 0)) continue;
    seen.add(String(a.id));
    out.push({ start, end: start + dur * 1000, bikeId: bikeOf.get(String(a.id)) ?? null });
  }
  for (const e of entries) {
    if (e.kind !== 'ride' || e.state !== 'counted' || e.source === 'hand' || (e.stravaId && seen.has(String(e.stravaId)))) continue;
    const start = typeof e.time === 'string' && e.time.includes('T') ? Date.parse(e.time) : NaN;
    if (!Number.isFinite(start)) continue;
    out.push({ start, end: start + ((Number(e.km) || 0) / GUESS_KMH) * 36e5, bikeId: e.bikeId ?? null });
  }
  return out;
}

/**
 * Should the live ride's km go to the bike? → { count, why } with why 'none' (no km), 'overlap' (a
 * Strava/Garmin ride of this bike counts already), 'added' (already added once) or '' (count).
 */
export function bikeKmPlan(ride, bikeId, { acts = [], entries = [] } = {}) {
  if (!ride || !(ride.km > 0)) return { count: false, why: 'none' };
  if (ride.kmId && entries.some((e) => e.id === ride.kmId && e.state !== 'removed')) return { count: false, why: 'added' };
  const ok = liveKmCounts({ ...ride, bikeId }, countedRides(acts, entries));
  return ok ? { count: true, why: '' } : { count: false, why: 'overlap' };
}

/**
 * The ledger entry for the live ride (makeEntry fields; the page passes it through makeEntry and keeps its
 * id on the recording as kmId, so it is added once). note: the shown word (t('Live map')).
 */
export const bikeEntryOf = (ride, bikeId, { name = '', note = '' } = {}) => ({
  bikeId,
  date: ride.day ?? zurichDay(ride.startAt),
  time: new Date(ride.startAt).toISOString(),
  km: r1(Number(ride.km) || 0),
  kind: 'ride',
  source: 'hand',
  name,
  by: 'user',
  sure: 'user',
  tripId: ride.tripId ?? null,
  note,
});

/**
 * The evening line of one day in the Reise-Spur («2a»): the day's own recordings (closed ones) summed.
 * → { km, movingS, stoppedS, n } or null without a recording on that day.
 */
export function daySum(tracks = [], day) {
  const recs = tracks.filter((x) => x.kind === 'rec' && !x.open && x.day === day && (x.pts?.length ?? 0) >= 2);
  if (!recs.length) return null;
  let km = 0;
  let movingS = 0;
  let stoppedS = 0;
  let n = 0;
  for (const r of recs) {
    const p = pauses(fixesOf(r));
    km += Number(r.km) || 0;
    movingS += p.movingS;
    stoppedS += p.stoppedS;
    n += p.stops.length;
  }
  return { km: r1(km), movingS, stoppedS, n };
}

/** A duration from seconds: «35 min» under an hour, else «2:05 h» (the same in German). */
export const durText = (s) => {
  const m = Math.round((Number(s) || 0) / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h`;
};
