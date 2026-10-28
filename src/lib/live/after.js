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
import { pauses, pausedS as pausedBetween, liveKmCounts, distKm, gainBetween, onRoute } from './live-lib.js';
import { statsOf } from './ble.js';
import { lineKm } from '../race/race.js';
import { thin } from '../route.js';
import { lapsOf } from './laps.js';
import { zurichDay } from '../spur/spur.js';

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
/** A ride on the route: start and end within this of the route line. */
export const ON_ROUTE_M = 1000;
/** A Strava/Garmin entry without its own duration: assumed this fast (km/h) for the overlap test. */
export const GUESS_KMH = 15;

/** The points of a recording as fixes { lat, lon, at (ms) }. */
export const fixesOf = (ride) => (ride?.pts ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])).map(([lat, lon, s, alt]) => ({ lat, lon, at: (ride.startAt ?? 0) + (Number(s) || 0) * 1000, alt: Number.isFinite(alt) ? alt : null }));

/* Nachprüfung 27.10.2026 (Noah «prüfe, ob wir wirklich alles so gemacht haben»): the recording keeps the GPS
   height as a 4th value of each point ([lat, lon, sec, alt], recorder.svelte.js), so a ride without a route
   gets its Hm and its elevation profile too. */

/** Metres up from the GPS heights of the fixes (4 m steps against the jitter, like the live tile), or null. */
export function gpsGainOf(fixes = []) {
  const alts = fixes.map((f) => f.alt).filter(Number.isFinite);
  if (alts.length < 2) return null;
  let base = alts[0];
  let gain = 0;
  for (const a of alts) {
    if (a < base) base = a;
    else if (a - base >= 4) {
      gain += a - base;
      base = a;
    }
  }
  return Math.round(gain);
}

/** The elevation over the ride time: [[sec, m]] from the GPS heights (at most `max` points), or []. */
export function heightCurve(ride, max = 400) {
  const p = (ride?.pts ?? []).filter((x) => Array.isArray(x) && Number.isFinite(x[2]) && Number.isFinite(x[3]));
  if (p.length < 2) return [];
  const step = Math.max(1, Math.ceil(p.length / max));
  return p.filter((_, i) => i % step === 0 || i === p.length - 1).map((x) => [x[2], Math.round(x[3])]);
}

/** The elevation profile of the ride as [[km, m]] (shaped like a route profile), or []. */
export function heightProfile(ride, max = 400) {
  const f = fixesOf(ride);
  const out = [];
  let k = 0;
  for (let i = 0; i < f.length; i++) {
    if (i) k += distKm(f[i - 1], f[i]);
    if (Number.isFinite(f[i].alt)) out.push([Math.round(k * 100) / 100, Math.round(f[i].alt)]);
  }
  if (out.length < 2) return [];
  const step = Math.max(1, Math.ceil(out.length / max));
  return out.filter((_, i) => i % step === 0 || i === out.length - 1);
}

/**
 * A Strava or Garmin ride (table activities) at the same time as the live ride, or null: its Hm, pulse and
 * power fill what the phone did not measure (Noah 20.10.2026: «kommt später eine Garmin- oder Strava-Fahrt
 * vom selben Tag, ergänzt die App ihre Daten damit»). The one that overlaps most in time wins.
 */
export function twinActivity(ride, acts = []) {
  const f = fixesOf(ride);
  const start = f[0]?.at ?? ride?.startAt;
  const end = f.at(-1)?.at ?? ride?.endAt;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  let best = null;
  let most = 0;
  for (const a of acts ?? []) {
    if (a?.kind !== 'bike' || a.trainer) continue;
    const s = Date.parse(a.start);
    const dur = Number(a.elapsedS) || Number(a.movingS) || 0;
    if (!Number.isFinite(s) || !(dur > 0)) continue;
    const over = Math.min(end, s + dur * 1000) - Math.max(start, s);
    if (over > most) {
      most = over;
      best = a;
    }
  }
  // at least a third of the live ride lies in it, so a short ride the same day is not taken
  return best && most >= (end - start) / 3 ? best : null;
}

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
 * hm: from the trip's route profile, else from the GPS heights (hmFrom 'route' | 'gps'), else null.
 */
export function rideSummary(ride, trip = null) {
  const fixes = fixesOf(ride);
  const p = pauses(fixes, { breaks: ride?.breaks ?? [] });
  const at = kmAtStops(fixes, p.stops);
  const totalS = fixes.length > 1 ? Math.round((fixes.at(-1).at - fixes[0].at) / 1000) : 0;
  // Pausieren und Sensoren (Noah 20.10.2026): the time in your pauses, the pulse, power and cadence of the ride
  const pausedS = Math.round(pausedBetween(0, Number.MAX_SAFE_INTEGER, (ride?.breaks ?? []).filter((b) => b?.[1] != null)));
  const sn = ride?.sensors ?? {};
  const sensors = { hr: statsOf(sn.hr), power: statsOf(sn.power, { noZero: true }), cadence: statsOf(sn.cadence, { noZero: true }) };
  const routeHm = hmOf(ride, trip);
  const gpsHm = routeHm == null ? gpsGainOf(fixes) : null;
  return { km: r1(Number(ride?.km) || 0), hm: routeHm ?? gpsHm, hmFrom: routeHm != null ? 'route' : gpsHm != null ? 'gps' : null, movingS: p.movingS, stoppedS: p.stoppedS, totalS, pausedS, sensors, stops: p.stops.map((x, i) => ({ ...x, km: r1(at[i]) })) };
}

/** The laps of a closed recording with their own pulse and power: [{ n, km, movingS, hrAvg, wAvg }] or null. */
export function lapRows(ride) {
  if (!ride?.laps?.length) return null;
  const f = fixesOf(ride);
  const end = f.at(-1)?.at ?? ride.endAt ?? ride.startAt;
  const total = rideSummary(ride);
  return lapsOf(ride.laps, { km: Number(ride.km) || 0, movingS: total.movingS, now: end, startAt: ride.startAt ?? 0, sensors: ride.sensors ?? null });
}

/** The id of the ride row made from a recording (one per recording, so «Debrief» twice makes it once). */
export const rideIdOf = (ride) => `ride-live-${ride.id}`;

/**
 * The recording as a ride row of the table rides, shaped like an uploaded GPX ride (gpx.js analyseRide),
 * so the look back, «Planned vs real» and the ride list read it as they read any ride.
 * plan: plannedFor(trip, date, pace) or null; name: the shown name (the trip's title or «Live ride»).
 */
export function rideRowOf(ride, { trip = null, name = '', plan = null, basis = null, twin = null, now = new Date() } = {}) {
  const s = rideSummary(ride, trip);
  // the sensor numbers as the look back reads them (review/werte.js: hrAvg, hrMax, wAvg, wMax); what the
  // phone did not measure comes from a Strava/Garmin ride at the same time (twinActivity)
  const hr = s.sensors.hr;
  const w = s.sensors.power;
  const fill = (own, other) => (own != null ? own : Number.isFinite(other) ? Math.round(other) : null);
  const sensors = { hrAvg: fill(hr?.avg, twin?.hrAvg), hrMax: fill(hr?.max, twin?.hrMax), wAvg: fill(w?.avg, twin?.wAvg), wMax: fill(w?.max, twin?.wMax) };
  const hasSensors = Object.values(sensors).some((v) => v != null);
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
    gainM: s.hm ?? (Number.isFinite(twin?.hm) ? Math.round(twin.hm) : null),
    lossM: null,
    totalH: r2(s.totalS / 3600),
    pauseH: r2(s.stoppedS / 3600),
    movingH: r2(s.movingS / 3600),
    pauses: s.stops.map((x) => ({ km: x.km, at: new Date(x.at).toISOString(), min: Math.round(x.s / 60) })),
    parts: null,
    line: thin(fixes),
    profile: heightProfile(ride),
    sensors: hasSensors ? sensors : null,
    laps: lapRows(ride),
    twinId: twin?.id != null ? String(twin.id) : null,
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
    const p = pauses(fixesOf(r), { breaks: r.breaks ?? [] });
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
