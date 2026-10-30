/**
 * Velo-Idee 72 «Fehlende Kilometer nachtragen» (996 Ideen, Noah 25.10.2026): before a new km reading goes
 * into the ride ledger, a jump is cleared up. Many km more than the app knows: rides outside the app
 * (one ride entry on a day you pick) or simply the new reading. Fewer km than the app knows: most often a
 * typo, so the window offers to type again first. Pure functions, tested in tests/veloideen.test.js.
 */
import { bikeKm } from './kmbook.js';

/** From this many km more than the ledger knows, the app asks where they come from. */
export const GAP_KM = 30;

/**
 * The jump of a new reading: { kind: 'more'|'less', diff, exact, since } or null (no ledger yet, or a
 * small step). since: the day of the newest counted entry.
 */
export function kmGap(entries, bikeId, total) {
  const { exact, kmDate } = bikeKm(entries ?? [], bikeId);
  if (exact == null || typeof total !== 'number' || Number.isNaN(total)) return null;
  const diff = Math.round((total - exact) * 10) / 10;
  if (diff >= GAP_KM) return { kind: 'more', diff, exact, since: kmDate };
  if (diff <= -1) return { kind: 'less', diff, exact, since: kmDate };
  return null;
}
