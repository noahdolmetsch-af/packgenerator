/**
 * Taschen-Setups (TS1–TS5, 14.10.2026): the few writes of the setup pages. The rules live in
 * src/lib/setups.js; here only the bike (and a trip) is read fresh and stored again.
 * Every write offers «Rückgängig» for 4 s (Noah's rule: delete = one question + 4 s undo).
 */
import { db } from '../db.js';
import { touched } from '../trips.js';
import { saveSetup, withoutSetup, applySetup, takeFromTrip, STD } from '../setups.js';
import { offerDone } from '../ui/rename.svelte.js';

export const UNDO_SETUP_MS = 4000;
export const newSetupId = () => `setup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** The bike's setup fields as they are now, to put back on «Rückgängig». */
const before = (bike) => ({ setup: bike.setup ?? {}, setups: bike.setups ?? [], ...(Array.isArray(bike.stdItems) ? { stdItems: bike.stdItems } : {}) });
async function undoable(bikeId, change, text) {
  const bike = await db.bikes.get(bikeId);
  if (!bike) return;
  const old = before(bike);
  await db.bikes.update(bikeId, change(bike));
  if (text) offerDone(text, () => db.bikes.update(bikeId, old), UNDO_SETUP_MS);
}

/** Store one setup (new or changed) on its bike. */
export const writeSetup = (bikeId, setup, text = '') => undoable(bikeId, (bike) => saveSetup(bike, structuredClone(setup)), text);

/** Delete one setup (never «Standard»); trips that used it fall back to «Standard». */
export const deleteSetup = (bikeId, id, text) => (id === STD ? null : undoable(bikeId, (bike) => ({ setups: withoutSetup(bike, id) }), text));

/** A trip takes a setup: its bags and places (only this trip; Undo puts the trip back). */
export async function useSetupInTrip(tripId, setup, text) {
  const trip = await db.trips.get(tripId);
  if (!trip) return;
  const old = structuredClone(trip);
  await db.trips.update(tripId, touched(applySetup(trip, structuredClone(setup))));
  if (text) offerDone(text, () => db.trips.put(old), UNDO_SETUP_MS);
}

/** «Ins Setup übernehmen» (2a): the trip's bags and places become the setup's. */
export async function takeTripIntoSetup(bikeId, setup, tripId, text) {
  const trip = await db.trips.get(tripId);
  if (trip) await writeSetup(bikeId, takeFromTrip(setup, trip), text);
}
