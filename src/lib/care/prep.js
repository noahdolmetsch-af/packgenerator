/**
 * Ticking off the event preparation of a trip (v0.30.2, L5). The preparation belongs to the trip:
 * it can be ticked in the trip (Plan → Before the trip) and in Bikes → Care, both with these two
 * functions, so both save the same way.
 *
 * result: 'done', 'ok' (checked, all OK) or 'needed' (work needed). Done or OK also writes the
 * check or service into the bike's part history (the check before the event counts for the
 * 1000 km check, answer 7). Trip and bike are read fresh in one transaction: no tap gets lost.
 */
import { ensureParts, logPart, prepParts, prepService } from '../care.js';

/** Tick one or more rows (prepFor rows) of a trip; by: 'self' or 'shop'; note: for the bike history. */
export async function tickPrep(db, tripId, rows, result, { today, by = 'self', note = '' } = {}) {
  if (!rows?.length) return;
  const state = { result, date: today, by };
  await db.transaction('rw', db.trips, db.bikes, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return;
    await db.trips.update(tripId, { prep: { ...(trip.prep ?? {}), ...Object.fromEntries(rows.map((r) => [r.task.id, state])) } });
    if (result !== 'done' && result !== 'ok') return;
    const keys = [...new Set(rows.flatMap((r) => prepParts(r.task)))];
    const svc = [...new Set(rows.map((r) => prepService(r.task)).filter(Boolean))];
    const bike = (keys.length || svc.length) && trip.bikeId ? await db.bikes.get(trip.bikeId) : null;
    if (!bike) return;
    const at = { date: today, km: bike.km ?? null, value: null, by, model: null, note };
    let parts = ensureParts(bike);
    for (const k of keys) parts = logPart(parts, k, { ...at, action: 'check', result: 'ok' });
    for (const k of svc) parts = logPart(parts, k, { ...at, action: 'service', result: 'done' });
    await db.bikes.update(bike.id, { parts });
  });
}

/** Undo: the row is open again (the bike history keeps its entry, as before in Bike care). */
export async function untickPrep(db, tripId, row) {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return;
    const prep = { ...(trip.prep ?? {}) };
    delete prep[row.task.id];
    await db.trips.update(tripId, { prep });
  });
}
