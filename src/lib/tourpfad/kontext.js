/**
 * «Meine Tour», the missing facts (Noah 10.11.2026 «2a»): Heute and the Tour-Pfad passed tourStand only the day and the
 * debrief, so form, bike care, fuel plan and ride counted as «unknown» and open: «Body» was always the next step and
 * «Packing» never came. This file reads what the database knows and gives both places the same ctx (see stand.js).
 * null still means «no data», never «fine»: an unknown fact stays open exactly as before.
 *
 *   tourExtra({ trip, today, rides, bike, tasks, visits, ready }) → { form, longestKm, careDue, fuelPlan, ridden }  (pure)
 *   loadTourExtra(trip, today) → the same, read from the database once (lazy: only a planned tour asks for it)
 *
 * Not fed (and why): travelChosen. The travel options (settings «travel.choices») carry no tour, so «chosen» cannot be
 * said for this tour; the row «Journey» keeps reading trip.arrival only.
 */
import { bikeCare } from '../readiness.js';
import { tripOwnOf } from '../fuel.js';

/** The form of the body as the path knows it: from the readiness level of the day, null without data. */
export function formOf(ready) {
  if (!ready || typeof ready.score !== 'number') return null;
  return ready.level === 'rest' ? 'low' : ready.level === 'easy' ? 'ok' : 'good';
}

/** The bike care of the tour's bike: the number of due points, null when nothing is recorded to judge by. */
export function careDueOf(bike, { tasks = [], visits = [], trip = null, today } = {}) {
  if (!bike) return null;
  const c = bikeCare(bike, { tasks, visits, trip, today });
  if (!c) return null;
  return c.status === 'due' ? c.rows.length : c.status === 'nodata' ? null : 0;
}

export function tourExtra({ trip, today, rides = [], bike = null, tasks = [], visits = [], ready = null }) {
  const mine = (rides ?? []).filter((r) => r?.tripId === trip?.id);
  const km = (rides ?? []).map((r) => Number(r?.km) || 0);
  return {
    form: formOf(ready),
    longestKm: km.length && Math.max(...km) > 0 ? Math.max(...km) : null,
    careDue: careDueOf(bike, { tasks, visits, trip, today }),
    fuelPlan: tripOwnOf(trip) ? true : null,
    ridden: mine.length > 0 ? true : null,
  };
}

/** Reads the database once. Never throws: on any trouble the facts stay unknown (null), the path works as before. */
export async function loadTourExtra(trip, today) {
  const none = { form: null, longestKm: null, careDue: null, fuelPlan: null, ridden: null };
  if (!trip) return none;
  try {
    const { db } = await import('../db.js');
    const [rides, bike, tasks, visits, form] = await Promise.all([
      db.rides.toArray(),
      trip.bikeId ? db.bikes.get(trip.bikeId) : null,
      db.maintenance.toArray(),
      db.visits.toArray(),
      import('../form-data.js').then((m) => m.loadForm(today)).catch(() => null),
    ]);
    return tourExtra({ trip, today, rides, bike, tasks, visits, ready: form?.ready ?? null });
  } catch {
    return none;
  }
}
