/**
 * «Meilensteine aktiver machen» PR 4 (Noah 01.11.2026 «4a», «alle vier Stellen»): «Fast geschafft» right after a tick:
 * which star is nearly reached. Plain module (no runes).
 */
import { SOON } from '../flowms.js';

/** Counters (no unit) count as near when 2 or fewer ticks are left. */
export const NEAR_COUNT = 2;

/**
 * From the evaluated milestones of one sport (starcheck actList): the star that is nearest and near enough, or null.
 * → { r (the milestone), k (the star number), left (to go, 1 decimal) }
 */
export function almostOf(list) {
  const near = [];
  for (const r of list) {
    if (r.off || !r.next || !(r.value > 0) || r.progress >= 1) continue;
    const left = Math.max(0, Math.round((r.target - r.value) * 10) / 10);
    if (left <= 0) continue;
    if (r.progress >= SOON || (!r.m?.unit && left <= NEAR_COUNT)) near.push({ r, k: r.next, left });
  }
  near.sort((a, b) => b.r.progress - a.r.progress || a.left - b.left);
  return near[0] ?? null;
}
