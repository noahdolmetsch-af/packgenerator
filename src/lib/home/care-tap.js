/**
 * v0.46.0 «Startseite neu» (Noah 27a, 14a): "Lubed ✓" / "Done ✓" in a row of "Important today" and
 * "kette geölt spark" in the top search record the job right where it is said, the same way Bikes →
 * Care and the bike buttons of 0.38 do (quickcare.js quickLog: the part's history with date and km).
 * Each returns what Undo needs.
 */
import { db } from '../db.js';
import { quickLog } from '../quickcare.js';
import { localDay } from '../localday.js';
import { t } from '../i18n.svelte.js';

/** The kinds a tap can record here. */
export const CARE_KINDS = ['chain', 'sealant', 'wash'];

/**
 * Record one job on a bike (as stored). → { text, undo: { bikeId, prev } } or null (no such bike).
 */
export async function recordCare(bikeId, kind, today = localDay()) {
  let out = null;
  await db.transaction('rw', db.bikes, async () => {
    const stored = await db.bikes.get(bikeId);
    if (!stored || !CARE_KINDS.includes(kind)) return;
    const res = quickLog(stored, kind, { today });
    if (!res) return;
    const prev = Object.fromEntries(Object.keys(res.changes).map((k) => [k, stored[k]]));
    await db.bikes.update(bikeId, res.changes);
    const bike = stored.name;
    const text = kind === 'chain' ? t('{bike}: chain lubed.', { bike }) : kind === 'sealant' ? t('{bike}: sealant topped up.', { bike }) : t('{bike}: washed.', { bike });
    out = { text, undo: { bikeId, prev } };
  });
  return out;
}

/** Undo: the bike's fields as they were before the tap. */
export async function undoCare(undo) {
  if (undo?.bikeId) await db.bikes.update(undo.bikeId, undo.prev);
}
