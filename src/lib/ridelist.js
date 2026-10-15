/**
 * GPX-Weg R3 (Noah 15.10.2026 «5a»): one way «Upload ride» for GPX, TCX and CSV. Before, the trip's
 * look back had its own «Import from Strava or Garmin»; its job lives here now:
 * - a recorded ride saved to a trip puts its km into that trip's look back,
 * - a CSV list (Strava activities.csv, Garmin Connect «Export CSV») puts the km of the rides on each
 *   bike trip's days into that trip's look back. A list has no track and no times, so it never counts
 *   for your pace; for the km per bike the same list goes on to Bikes › Care › Import rides.
 * Pure functions; the page writes the debriefs.
 */
import { newDebrief } from './debrief.js';
import { ridesOnTrip } from './activities.js';

const CYCLING = /ride|cycl|bike|velo|rad|gravel|mountain/i;
const keyOf = (r) => `${r.date}|${r.name ?? ''}`;

/** Is the file the CSV list of activities (not a ride file)? */
export const isList = (file) => /\.csv$/i.test(file?.name ?? '') || /csv/i.test(file?.type ?? '');

/**
 * The debrief with these rides on the trip's days in it (a ride of the same day and name is replaced,
 * the others stay) and their km. null when none of the rides is on the trip's days.
 */
export function kmIntoDebrief(debrief, trip, rides, now = new Date().toISOString()) {
  const on = ridesOnTrip(rides, trip).rides.map(({ date, km, name }) => ({ date, km, name: name ?? '' }));
  if (!on.length) return null;
  const d = debrief ? structuredClone(debrief) : newDebrief(trip, now);
  const fresh = new Set(on.map(keyOf));
  d.rides = [...(d.rides ?? []).filter((r) => !fresh.has(keyOf(r))), ...on].sort((a, b) => a.date.localeCompare(b.date));
  d.km = Math.round(d.rides.reduce((t, r) => t + (Number(r.km) || 0), 0));
  d.updatedAt = now;
  return d;
}

/**
 * What a list brings: per bike trip the rides on its days and their km, the bike rides on no trip,
 * and the other activities (runs, walks …) that do not count here.
 */
export function listToTrips(activities, trips) {
  const bikeRides = activities.filter((a) => !a.type || CYCLING.test(a.type));
  const used = new Set();
  const hits = [];
  for (const trip of trips) {
    if (!trip?.startDate || !trip.bikeId || trip.skipped) continue;
    const { rides, km } = ridesOnTrip(bikeRides, trip);
    if (!rides.length) continue;
    rides.forEach((r) => used.add(r));
    hits.push({ trip, rides, km });
  }
  hits.sort((a, b) => b.trip.startDate.localeCompare(a.trip.startDate));
  return { hits, outside: bikeRides.filter((r) => !used.has(r)).length, other: activities.length - bikeRides.length, all: bikeRides.length };
}

/* The list goes on to Bikes › Care › Import rides (km per bike) without choosing it again: kept in
   memory for the next page only, never stored. */
let handed = [];
export const handToKmImport = (files) => (handed = [...files]);
export const takeHanded = () => {
  const out = handed;
  handed = [];
  return out;
};
