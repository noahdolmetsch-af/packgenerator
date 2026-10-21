/**
 * «Verschleiss» (Noah 20.10.2026, answer 1): a workshop visit can set the whole-bike counter to 0
 * («Service am ganzen Velo»). The point is kept on the bike (bike.service, wear.js serviceAt) with the
 * visit's id, so removing the visit takes its point away again, and Undo brings both back.
 */
import { db } from './db.js';
import { serviceAt, serviceWithout } from './wear.js';

/** The visit counts as a whole-bike service: its point goes into bike.service. → the service before (for Undo). */
export async function visitService(bikeId, { day, km = null, hours = null, visitId }) {
  return db.transaction('rw', db.bikes, async () => {
    const bike = await db.bikes.get(bikeId);
    if (!bike) return null;
    const before = bike.service ?? null;
    await db.bikes.update(bikeId, serviceAt(bike, { day, km, hours, visitId }));
    return { bikeId, service: before };
  });
}

/** Remove a visit and its service point. → a snapshot for restoreVisit, or null when it is gone. */
export async function removeVisit(id) {
  return db.transaction('rw', db.visits, db.bikes, async () => {
    const rec = await db.visits.get(id);
    if (!rec) return null;
    await db.visits.delete(id);
    const bike = rec.bikeId ? await db.bikes.get(rec.bikeId) : null;
    const patch = bike ? serviceWithout(bike, id) : null;
    if (patch) await db.bikes.update(bike.id, patch);
    return { rec, bikeId: bike?.id ?? null, service: patch ? bike.service ?? null : undefined };
  });
}

/** Undo of removeVisit. */
export async function restoreVisit(snap) {
  if (!snap?.rec) return;
  await db.transaction('rw', db.visits, db.bikes, async () => {
    await db.visits.put(snap.rec);
    if (snap.bikeId && snap.service !== undefined) await db.bikes.update(snap.bikeId, { service: snap.service ?? {} });
  });
}
