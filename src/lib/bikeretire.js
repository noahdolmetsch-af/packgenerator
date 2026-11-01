/**
 * «Velos ausmustern» (Noah 1.11.2026 «1-5 a»): a bike that is no longer ridden is retired, not deleted.
 * Nothing is removed: trips, km book, workshop visits and the year reviews keep the bike. It only leaves the
 * lists where a bike is chosen (new tour, km import, care, …) and waits under «Retired bikes», where it can
 * be brought back at any time.
 *
 * Stored on the bike: `retired: { at: 'YYYY-MM-DD', reason, note }` and `archived: true` (the flag many pages
 * already hide, so they follow without a change). No imports here, so tests and plain modules can use it.
 */
export const RETIRE_REASONS = ['sold', 'given', 'broken', 'other'];

/** True when the bike is retired (also bikes marked archived or sold by older data). */
export const isRetired = (b) => !!b && !!(b.retired || b.archived || b.status === 'sold');
export const activeBikes = (bikes = []) => (bikes ?? []).filter((b) => !isRetired(b));
export const retiredBikes = (bikes = []) => (bikes ?? []).filter(isRetired);

const day = /^\d{4}-\d{2}-\d{2}$/;

/** The record stored in bike.retired. Pure. */
export function retireRecord({ reason = 'other', at, note = '' } = {}) {
  return { at: day.test(at ?? '') ? at : null, reason: RETIRE_REASONS.includes(reason) ? reason : 'other', note: String(note ?? '').trim().slice(0, 200) };
}

/** Retires the bike. → what it was before (for Undo), or null when the bike is not there. */
export async function retireBike(db, id, info) {
  const bike = await db.bikes.get(id);
  if (!bike) return null;
  const before = { retired: bike.retired ?? null, archived: bike.archived ?? false };
  await db.bikes.update(id, { retired: retireRecord(info), archived: true });
  return before;
}

/** Brings the bike back (also the way to undo retireBike with `before`). */
export async function restoreBike(db, id, before = null) {
  if (!(await db.bikes.get(id))) return;
  await db.bikes.update(id, { retired: before?.retired ?? null, archived: before?.archived ?? false });
}
