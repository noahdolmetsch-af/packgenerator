/**
 * E3 «Strava-Verbindung» (mockups S1–S5 approved 12.10.2026): Strava activities from the server
 * (api/strava.js, step=activities) as the rides the km ledger already knows from the CSV import,
 * so planImport assigns them the same way (Strava bike name = app bike name).
 * No UI here; the screens come with the E3 release.
 */
import { CYCLING, zurichDay } from './kmbook.js';

const VIRTUAL = /virtual|indoor|trainer/i;

/** Strava's «GravelRide» as the CSV writes it («Gravel Ride»). */
export const typeName = (t) => String(t ?? '').replace(/^E(?=[A-Z])/, 'E-').replace(/([a-z])([A-Z])/g, '$1 $2');

/**
 * activities: the server's trimmed list; bikes: the server's gear list ({ id, name }).
 * Returns { rides, other } like parseStravaCsv: rides of the bike kind, other = how many were no ride.
 */
export function toRides(activities, bikes = []) {
  const names = Object.fromEntries((bikes ?? []).map((b) => [b.id, b.name]));
  const rides = [];
  let other = 0;
  for (const a of activities ?? []) {
    const type = typeName(a.type);
    const gear = a.gearId ? names[a.gearId] ?? '' : '';
    const date = a.start ? zurichDay(a.start) : null;
    if (!date || !Number.isFinite(a.km)) continue;
    if (!CYCLING.test(type) || ((VIRTUAL.test(type) || a.trainer) && !gear)) {
      other++;
      continue;
    }
    rides.push({ source: 'strava', date, time: a.start, km: a.km, name: a.name ?? '', type, gear, gearId: a.gearId ?? null, stravaId: String(a.id), device: a.device ?? '', profile: '', sensors: [] });
  }
  return { rides, other };
}

/**
 * Rides whose Strava bike changed since the app took them (answer 4b: the app asks, with a clear
 * notice). known: ledger entries with stravaId and gear; returns [{ entry, ride }].
 */
export function gearChanges(known, rides) {
  const byId = new Map((known ?? []).filter((e) => e.stravaId).map((e) => [String(e.stravaId), e]));
  return (rides ?? []).filter((r) => byId.has(r.stravaId) && (byId.get(r.stravaId).gear ?? '') !== (r.gear ?? '') && r.gear).map((r) => ({ entry: byId.get(r.stravaId), ride: r }));
}
