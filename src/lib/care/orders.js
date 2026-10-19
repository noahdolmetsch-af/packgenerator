/**
 * Impeccable (18.10.2026, Velopflege 3 / Werkstatt 1): «Auftrag für den Velomech» means one thing on
 * both pages. One order per bike from workshopOrder (what is due before its next trip, or today,
 * without what I usually do myself, plus its open problems not fixed by me). Care and Workshop &
 * receipts read the same list from here.
 */
import { ensureParts, upcomingTrips } from '../care.js';
import { withVisits, tyreSetup, workshopOrder } from '../workshop.js';
import { shopSkip } from './last.js';
import { localDay } from '../localday.js';

/** The order of one bike (a view from withVisits): { order, orderTrip, tyres }. */
export function orderOf(view, trips = [], tasks = [], visits = [], today = localDay()) {
  const tyres = tyreSetup(view, visits);
  const orderTrip = upcomingTrips(trips, today).find((t) => t.bikeId === view.id) ?? null;
  const order = workshopOrder(view, orderTrip, tasks, visits, tyres, today, { skip: shopSkip(view) });
  return { order, orderTrip, tyres };
}

/** The bikes that have something for the bike shop: [{ bike (view), order, orderTrip }], in the order of bikes. */
export function shopOrders(bikes = [], trips = [], tasks = [], visits = [], today = localDay()) {
  return bikes
    .map((b) => withVisits({ ...b, parts: ensureParts(b) }, visits))
    .map((bike) => ({ bike, ...orderOf(bike, trips, tasks, visits, today) }))
    .filter((c) => c.order?.rows.length);
}
