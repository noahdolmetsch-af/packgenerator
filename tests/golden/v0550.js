// v0.55.0 «Bausteine neu»: the older golden lists (stage 1, blocks2026) were written before the blocks
// were split. With the new blocks they change ON PURPOSE, in exactly these ways (Noah 5a–9a):
//   - the ride blocks Repair and Charging come on every ride (Light in the dark, Race on an event):
//     items in them may be added, or come with the mark 'context' now;
//   - Warm is no block any more (6a): an item of the old Warm comes with the weather (coldBelow) or not;
//   - a tent (by its name) moved to the block Tent, which only comes with "Bivouac + tent";
//   - Sleep went into Bivouac (5a, 8a), the base set of a trip without a known night: it now brings
//     the old Sleep items too.
// Everything else must stay exactly as in the frozen lists. Fictional fixture data only.
import { migrateAll } from '../../src/lib/blocks2026.js';
import { splitAll } from '../../src/lib/blocksplit.js';

const RIDE = ['repair', 'charge', 'lights', 'race'];

/** The data as the app holds it after both updates: { items, templates, sets }. */
export function split55(items, templates = [], sets = []) {
  const a = migrateAll({ items, templates, settings: { sets } }, { now: '2026-10-09T08:00:00.000Z' });
  const b = splitAll({ items: a.items, templates: a.templates, sets }, { now: '2026-10-09T08:00:00.000Z' });
  return { items: b.items, templates: b.templates, sets: b.sets };
}

/** Is a different row of this item one of the intended v0.55.0 changes? before/after: Maps id → item. */
export function explained55(id, before, after) {
  const b = before.get(id);
  const a = after.get(id);
  if (!b || !a) return false;
  const old = b.sets ?? [];
  const now = a.sets ?? [];
  if (now.some((k) => RIDE.includes(k))) return true;
  if (old.includes('warm')) return true;
  if (now.includes('tent') && old.some((k) => ['base', 'sleep', 'lodging'].includes(k))) return true;
  if (old.includes('sleep') && now.includes('bivy')) return true;
  return false;
}

/** A list of rows ("id@slot×qty:src" or a layer row "id:place…") without the rows of explained items. */
export const without55 = (rows, before, after) => (rows ?? []).filter((s) => !explained55(String(s).split(/[@:]/)[0], before, after));
