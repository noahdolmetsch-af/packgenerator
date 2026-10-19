/**
 * Paket U3 «Live-Karte» (Noah 19.10.2026 «5a»: start on every tour and on Aktiv; Heute «1a» a tile; «2a» the
 * app-icon shortcut): where «Start a ride» leads. A trip on its days today → its live map
 * (#/live/<tripId>); else a free ride (#/live). Pure, tested in tests/live-after.test.js.
 */
import { onTripDay } from '../ride.js';
import { hasBike } from '../domains.js';

/** The trip that runs today (not skipped, not finished), a bike trip first, the newest start first; or null. */
export function todayTrip(trips = [], today) {
  const on = (trips ?? []).filter((x) => x && !x.skipped && !x.finished && x.status !== 'done' && !!x.startDate && onTripDay(x, today));
  on.sort((a, b) => Number(hasBike(b)) - Number(hasBike(a)) || String(b.startDate).localeCompare(String(a.startDate)));
  return on[0] ?? null;
}

/** The live map of a trip, or of a free ride without one. */
export const liveHref = (trip = null) => (trip?.id ? `#/live/${encodeURIComponent(trip.id)}` : '#/live');

/** Today's live map: the trip of today, else a free ride. */
export const liveToday = (trips, today) => liveHref(todayTrip(trips, today));
