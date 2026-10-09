/**
 * v0.44.0: everything the review of the last 12 months reads, in one go (for a liveQuery on the
 * card on Today and on #/review). The bikes are read raw here: yearreview.js merges the workshop
 * visits itself (withVisits), so a bike that already has them merged would count them twice.
 */
import { PACE_KEY } from '../pace.js';

export async function loadReview(db) {
  const [trips, debriefs, items, containers, bikes, visits, rides, learnings, pace] = await Promise.all([
    db.trips.toArray(),
    db.debriefs.toArray(),
    db.items.toArray(),
    db.containers.toArray(),
    db.bikes.toArray(),
    db.visits.toArray(),
    db.rides.toArray(),
    db.learnings.toArray(),
    db.settings.get(PACE_KEY),
  ]);
  return { trips, debriefs, items, containers, bikes, visits, rides, learnings, pace: pace?.value ?? null };
}
