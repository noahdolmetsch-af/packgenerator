/**
 * Späte Absage und No-Show (Noah 04.11.2026 «3a»): what happened to a lesson, kept only on this device
 * (settings «booking.outcomes», also in the backup): { [bookingId]: 'late' | 'noshow' }. No entry means «held».
 */
import { db as appDb } from '../db.js';

export const OUTCOMES_KEY = 'booking.outcomes';

export async function listOutcomes(db = appDb) {
  const v = (await db.settings.get(OUTCOMES_KEY))?.value;
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

/** Sets or clears («held») the outcome of one booking and returns the new map. */
export async function setOutcome(id, outcome, db = appDb) {
  const next = { ...(await listOutcomes(db)) };
  if (outcome === 'late' || outcome === 'noshow') next[id] = outcome;
  else delete next[id];
  await db.settings.put({ key: OUTCOMES_KEY, value: next });
  return next;
}
