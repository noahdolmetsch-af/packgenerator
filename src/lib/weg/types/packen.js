/**
 * «Weg zum Ziel» › kind of step «Test packing» (Noah 05.11.2026 «a»): three steps with a standard distance to the
 * start, all of them only suggestions (rename, move, delete, tick by hand):
 *   probe  Pack once as for real and weigh it (the packing list shows the total weight), 14 days before the start
 *          (ticked by hand).
 *   dress  Dress rehearsal, 7 days before the start; ticks by itself once the dress rehearsal of the trip
 *          (`trip.probe`, src/lib/probe/probe.js) is done.
 *   night  A night outside with the kit, 21 days before the start (ticked by hand).
 * The trip of a goal is the one named by `goal.tripId`, else the trip that starts on the goal's start day.
 * `load(db)` reads the trips; the page puts them under `ctx.packen` (`ctx.trips` works too). Labels are English keys for t(); German in de/weg-packen.js.
 */
import { PROBE_STEPS, rowsOf, summary } from '../../probe/probe.js';

/** Standard distances (days before the start), changeable in the sheet «New way» and on every step. */
export const PACKEN_OFFSETS = { night: 21, probe: 14, dress: 7 };

/** The trip a goal belongs to: its own tripId, else a trip starting on the start day. null when none fits. */
export function tripOfGoal(goal, trips) {
  const list = Array.isArray(trips) ? trips.filter((t) => t && !t.skipped) : [];
  if (goal?.tripId) return list.find((t) => t.id === goal.tripId) ?? null;
  if (goal?.start) return list.find((t) => t.startDate === goal.start) ?? null;
  return null;
}

/**
 * Is the dress rehearsal of the trip done: every step answered, and at least one answered by the user (a rehearsal
 * that only the app answered by itself was never done). ctx is the one of probe.js: offlineAt, backupAt, today, …
 */
export function probeDone(trip, ctx = {}) {
  const saved = trip?.probe?.steps;
  if (!saved || !Object.values(saved).some((s) => s?.r)) return false;
  return summary(rowsOf(PROBE_STEPS, trip, trip.probe, ctx)).done;
}

export default {
  order: 20,
  type: 'packen',
  label: 'Test packing',
  icon: 'backpack',
  defaults: () => [
    { key: 'night', title: 'Sleep one night outside with the kit', offset: PACKEN_OFFSETS.night, note: 'Tent or bivvy, mat, sleeping bag: what is cold, what is missing?' },
    { key: 'probe', title: 'Pack once as for real and weigh it', offset: PACKEN_OFFSETS.probe, note: 'Everything in the bags: does the total weight fit? Then ride the bike once around the block.' },
    { key: 'dress', title: 'Dress rehearsal at home', offset: PACKEN_OFFSETS.dress, note: 'Route offline, plan B, power, food for one day, a tube change.' },
  ],
  /** What auto reads: the trips (with their dress rehearsal). */
  load: async (db) => ({ trips: await db.trips.toArray() }),
  auto: (goal, step, ctx = {}) => {
    if (step.key !== 'dress') return null;
    const trip = tripOfGoal(goal, ctx.packen?.trips ?? ctx.trips);
    return trip ? (probeDone(trip, ctx) ? true : null) : null;
  },
  link: (goal, step) => {
    if (step.key === 'dress' && goal?.tripId) return `#/trip/${encodeURIComponent(goal.tripId)}/probe`;
    if (step.key === 'probe' || step.key === 'dress') return '#/pack';
    return '';
  },
};
