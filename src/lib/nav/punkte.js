/**
 * «Ruhige Punkte an allen Orten» (Noah 23.11.2026 «4a»): a small mark on a place of the menu only where something waits.
 * Before, only Velos showed one (care due). Now also Plan (ticks still open today) and Touren (a tour starts within 3 days
 * and its packing list is not full). Never red, like the small badges; each one can be switched off in Ich › Darstellung
 * (ops.dotplan, ops.dottrips). Pure; punkte.svelte.js keeps the numbers, PlaceBar and SideBar draw them.
 */
import { homeTrips } from '../home/heute.js';
import { addDays } from '../flow.js';

/** Ticks still open today: the same number the tick list «Heute abhaken» shows as open (flowStates: a daily goal not reached). */
export const openTicks = (states = []) => states.filter((s) => !s.resting && s.open).length;

/** Tours that start within `days` days (today included), are not skipped or finished, and have a packing list with items not packed yet. A tour already under way does not count. */
export function toursToPack(trips = [], today, days = 3) {
  const last = addDays(today, days);
  return homeTrips(trips).filter((x) => {
    if (x.skipped || x.finished || !x.startDate) return false;
    if (x.startDate < today || x.startDate > last) return false;
    const es = x.entries ?? [];
    return es.length > 0 && es.some((e) => !e.packed);
  }).length;
}

/**
 * What the menu shows: { week: { n, tip } | null, trips: { n, tip } | null }. `tip` is the English key for the tooltip and the
 * words for a screen reader. `on` is { plan, trips } (the two switches).
 */
export function dotsOf({ ticks = 0, tours = 0 } = {}, on = { plan: true, trips: true }) {
  return {
    week: on.plan && ticks > 0 ? { n: ticks, tip: 'plan' } : null,
    trips: on.trips && tours > 0 ? { n: tours, tip: 'tours' } : null,
  };
}
