/**
 * Which bike for this trip? (v0.19.3, N13, answer 9a "now"): the bikes side by side for one trip,
 * with what decides: weight with bags, bag volume against the packed gear, what the bike needs
 * before the start, what it costs per 1000 km and how often it was on a trip before.
 * Pure function; the Pack page shows it.
 */
import { bikeSetup, ON_BIKE_SLOTS } from './bikes.js';
import { beforeTrip, costPer1000, visitsOf, tyreSetup } from './workshop.js';

/** Litres of the packed gear that go into bags (not worn, not mounted), or null when no item has a volume. */
export function gearLitres(trip, items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const inBags = trip.entries.filter((e) => e.slot !== 'body' && e.slot !== 'mounted' && !ON_BIKE_SLOTS.includes(e.slot));
  const known = inBags.filter((e) => byId[e.itemId]?.volumeL);
  if (!known.length) return null;
  return Math.round(known.reduce((t, e) => t + byId[e.itemId].volumeL * (e.qty || 1), 0) * 10) / 10;
}

/**
 * views: the bikes from withVisits. Returns rows, one per bike:
 * { bike, weightG, bagsG, totalG, volumeL, gearL, full, due, late, per, trips, current, lightest, roomiest }.
 * totalG is null when the bike is not weighed. full: the gear needs more than 80 % of the bags.
 */
export function bikeChoice(trip, views, { containers = [], items = [], visits = [], trips = [], today }) {
  const gearL = gearLitres(trip, items);
  const rows = views.map((bike) => {
    const setup = bikeSetup(bike, containers, items);
    const due = beforeTrip(bike, trip, tyreSetup(bike, visits), today)?.rows ?? [];
    const before = trips.filter((t) => t.bikeId === bike.id && t.id !== trip.id && !t.skipped && t.startDate && t.startDate < today);
    return {
      bike,
      weightG: bike.weightG ?? null,
      bagsG: setup.bagsG,
      totalG: bike.weightG ? bike.weightG + setup.bagsG : null,
      volumeL: setup.volumeL,
      gearL,
      full: gearL != null && setup.volumeL > 0 ? gearL > setup.volumeL * 0.8 : null,
      due: due.length,
      late: due.filter((r) => r.late || r.worn).length,
      per: costPer1000(visitsOf(visits, bike.id), bike),
      trips: before.length,
      current: trip.bikeId === bike.id,
    };
  });
  const min = Math.min(...rows.filter((r) => r.totalG).map((r) => r.totalG));
  const max = Math.max(...rows.map((r) => r.volumeL));
  return rows.map((r) => ({ ...r, lightest: r.totalG === min, roomiest: max > 0 && r.volumeL === max }));
}
