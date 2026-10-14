/**
 * TZ-2 «Fest nach der Fahrt»: what the trip pages share while a trip is reopened or answered.
 *   ask:  the id of the trip whose «Wieder öffnen?» sheet is open (TripBand shows ReopenSheet);
 *   done: the last change with its Undo, shown under the trip's state note: { id, text, undo };
 * and the two writes: reopenPlan («Wieder öffnen») and answerRide («Bist du gefahren?»), each with its Undo.
 */
import { db } from '../db.js';
import { touched } from '../trips.js';
import { reopenChanges, rideAnswerChanges, beforeOf } from './fixed.js';

export const tz2 = $state({ ask: null, done: null });

/** Open the «Wieder öffnen?» sheet of a trip (from the state note or the menu «…»). */
export const askReopen = (trip) => (tz2.ask = trip?.id ?? null);

/** Write changes to a trip and return its Undo (puts the changed fields back). */
async function apply(id, changesOf) {
  const cur = await db.trips.get(id);
  if (!cur) return null;
  const changes = changesOf(cur);
  const before = beforeOf(cur, changes);
  await db.trips.update(id, touched(changes));
  return () => db.trips.update(id, touched(before));
}

/** «Wieder öffnen»: the trip is planned again (a saved debrief stays as it is). → its Undo. */
export const reopenPlan = (trip) => apply(trip.id, reopenChanges);

/** The answer to «Did you ride?» (yes: true). → its Undo. */
export const answerRide = (trip, yes) => apply(trip.id, (cur) => rideAnswerChanges(cur, yes));
