/**
 * Live Navigation, «Fahrt beenden» (Noah 26.10.2026, mockups M9/M10 approved «LN freigeben»):
 * every finished ride is kept at once as its own entry in Touren, labelled «Live Navigation», instead of
 * only after a tap on «Debrief». The bike km are booked by themselves, with Undo.
 *
 * - saveLiveRide(): the recording → one row of the table rides (rideRowOf, id ride-live-<rec id>, so a
 *   second save of the same ride changes that row and keeps its answers). With a trip, the km also go into
 *   its look back, unless that is finished.
 * - bikeFor(): which bike gets the km: the trip's bike, else the one used for the last live ride
 *   (setting LIVE_BIKE_KEY), else the first of your bikes.
 * - bookBikeKm(): books the km on that bike when bikeKmPlan says so (not twice, not when a Strava/Garmin
 *   ride of the same bike overlaps) → { entry, ids } or null; the caller offers Undo.
 * - saveLeftRides(): rides that were never ended (app closed, phone off) are closed and kept in Touren
 *   too, before a new ride starts (Noah 27.10.2026 «eine neue Live-Aufnahme überschreibt die vorherige»).
 * Plain module (no runes), tested in tests/live-saveride.test.js.
 */
import { rideRowOf, bikeKmPlan, bikeEntryOf } from './after.js';
import { PACE_KEY, paceOf } from '../pace.js';
import { plannedFor } from '../gpx.js';
import { kmIntoDebrief } from '../ridelist.js';
import { sortBikes } from '../bikes.js';
import { makeEntry } from '../kmbook.js';
import { addEntries, ensureKmBook } from '../kmbookdb.js';

/** Settings key: the bike of the last live ride without a trip bike. */
export const LIVE_BIKE_KEY = 'live-bike';
/** The label of a live ride in Touren (a name, the same in every language). */
export const LIVE_LABEL = 'Live Navigation';

/** Is this ride row from the live map? */
export const isLiveRide = (r) => r?.source === 'live';

/**
 * Save the recording as its ride row. → the stored row.
 * ride: stopRecording()'s row; trip: the trip or null; name: the shown name.
 */
export async function saveLiveRide(db, ride, { trip = null, name = '', now = new Date() } = {}) {
  const pace = paceOf((await db.settings.get(PACE_KEY))?.value);
  const draft = rideRowOf(ride, { trip, name, basis: { kmh: pace.kmh, climbMh: pace.climbMh }, now });
  // Touren c 70: the feeling of the ride (asked before the numbers) goes with it
  const row = { ...draft, plan: trip ? plannedFor(trip, draft.date, pace) : null, ...(ride.feel ? { feel: ride.feel } : {}) };
  const old = await db.rides.get(row.id);
  const kept = old ? { ...row, name: old.name || row.name, answers: old.answers ?? {}, createdAt: old.createdAt ?? row.createdAt } : row;
  await db.rides.put(kept);
  // the km of the ride into the trip's look back (as an uploaded ride does), unless it is finished
  if (trip?.bikeId) {
    const stored = await db.debriefs.get(trip.id);
    if (stored?.status !== 'done') {
      const d = kmIntoDebrief(stored, trip, [kept]);
      // Touren c 70: the feeling goes with it, unless the look back has its own already
      if (d && ride.feel && d.feel == null) d.feel = ride.feel;
      if (d) await db.debriefs.put(d);
    }
  }
  return kept;
}

/** The bike for the ride's km, or null without bikes. bikes: all bikes; lastId: LIVE_BIKE_KEY's value. */
export function bikeFor(trip, bikes = [], lastId = null) {
  const list = sortBikes(bikes.filter((b) => b && b.id && !b.archivedAt));
  if (trip?.bikeId) return bikes.find((b) => b.id === trip.bikeId) ?? null;
  return list.find((b) => b.id === lastId) ?? list[0] ?? null;
}

/**
 * Book the ride's km on the bike, when they count. → { entry, ids, bike } or null.
 * The recording keeps the entry's id as kmId (so «Add km» is not offered twice).
 */
export async function bookBikeKm(db, ride, { trip = null, name = '', note = '' } = {}) {
  const [bikes, acts, entries, last] = await Promise.all([db.bikes.toArray(), db.activities.toArray(), db.kmBook.toArray(), db.settings.get(LIVE_BIKE_KEY)]);
  const bike = bikeFor(trip, bikes, last?.value ?? null);
  if (!bike) return null;
  const plan = bikeKmPlan(ride, bike.id, { acts, entries });
  if (!plan.count) return null;
  await ensureKmBook(db);
  const entry = makeEntry(bikeEntryOf(ride, bike.id, { name, note }));
  const ids = await addEntries(db, [entry]);
  await db.tracks.update(ride.id, { kmId: entry.id });
  return { entry, ids, bike };
}

/** Remember the bike picked for a free ride (the next ride without a trip bike takes it). */
export const rememberBike = (db, bikeId) => db.settings.put({ key: LIVE_BIKE_KEY, value: bikeId });

/**
 * Close every open recording except keep (an id) and keep each one as its own ride in Touren; one with
 * fewer than 2 points goes. nameOf(ride, trip) gives the shown name. → the saved ride rows.
 */
export async function saveLeftRides(db, { keep = null, nameOf = () => '' } = {}) {
  const open = (await db.tracks.where('kind').equals('rec').toArray()).filter((r) => r.open && r.id !== keep);
  const saved = [];
  for (const r of open) {
    if ((r.pts?.length ?? 0) < 2) {
      await db.tracks.delete(r.id);
      continue;
    }
    const done = { ...r, open: false };
    await db.tracks.put(done);
    const trip = done.tripId ? ((await db.trips.get(done.tripId)) ?? null) : null;
    saved.push(await saveLiveRide(db, done, { trip, name: nameOf(done, trip) }));
  }
  return saved;
}
