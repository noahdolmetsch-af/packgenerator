/**
 * SN2+ SN2f «Nicht gebraucht» (mockup approved 13.10.2026): an item not used on a trip can be taken out
 * of the trip's template, one item at a time and never by itself. It leaves the template only: it stays in
 * Material and on this trip. Undo puts exactly that back. Pure functions; the write goes through
 * templates.js updateTemplate (so a linked template's snapshot is rewritten). Tested in tests/sn2plus.test.js.
 */
import { templateItems, isLinked } from '../templates.js';

/** The trip's template, when it still exists and is not archived. */
export const tripTemplate = (trip, templates = []) => (trip?.templateId ? templates.find((x) => x.id === trip.templateId && !x.archivedAt) ?? null : null);

/** Is the item in the template right now? */
export const inTemplate = (tpl, itemId, items = [], sets = []) => !!tpl && templateItems(tpl, items, sets).some((x) => x.itemId === itemId);

/**
 * The template without the item, and what Undo needs: { tpl, undo } or null (not in it).
 * A linked template: the item goes to `without` of every block it comes from, or leaves the extras;
 * an older template: its entry leaves the list.
 */
export function dropItem(tpl, itemId, items = [], sets = []) {
  if (!inTemplate(tpl, itemId, items, sets)) return null;
  const next = structuredClone(tpl);
  if (!isLinked(tpl)) {
    const entry = (tpl.entries ?? []).find((e) => e.itemId === itemId) ?? null;
    next.entries = (tpl.entries ?? []).filter((e) => e.itemId !== itemId);
    return { tpl: next, undo: { itemId, entry, blocks: [], extra: null } };
  }
  const extra = (tpl.extras ?? []).find((x) => x.itemId === itemId) ?? null;
  next.extras = (tpl.extras ?? []).filter((x) => x.itemId !== itemId);
  const blocks = [];
  for (const key of tpl.blocks ?? []) {
    const bare = { ...tpl, blocks: [key], extras: [] };
    if (!templateItems(bare, items, sets).some((x) => x.itemId === itemId)) continue;
    next.without = { ...(next.without ?? {}), [key]: [...(next.without?.[key] ?? []), itemId] };
    blocks.push(key);
  }
  return { tpl: next, undo: { itemId, entry: null, blocks, extra } };
}

/** The template with the item back, as it was before dropItem. */
export function putBack(tpl, undo) {
  if (!tpl || !undo) return tpl;
  const next = structuredClone(tpl);
  if (undo.entry && !(next.entries ?? []).some((e) => e.itemId === undo.itemId)) next.entries = [...(next.entries ?? []), undo.entry];
  if (undo.extra && !(next.extras ?? []).some((x) => x.itemId === undo.itemId)) next.extras = [...(next.extras ?? []), undo.extra];
  for (const key of undo.blocks ?? []) {
    const left = (next.without?.[key] ?? []).filter((id) => id !== undo.itemId);
    next.without = { ...(next.without ?? {}) };
    if (left.length) next.without[key] = left;
    else delete next.without[key];
  }
  return next;
}

/**
 * How often each item was not used on trips BEFORE this one (finished debriefs of trips that started
 * earlier): { itemId: n }, for «auch auf n Touren davor nicht gebraucht».
 */
export function unusedBefore(debriefs = [], trips = [], trip) {
  const start = new Map(trips.map((x) => [x.id, x.startDate ?? '']));
  const out = {};
  for (const d of debriefs) {
    if (d.status !== 'done' || d.tripId === trip?.id) continue;
    const s = start.get(d.tripId);
    if (!s || !trip?.startDate || s >= trip.startDate) continue;
    for (const [id, st] of Object.entries(d.items ?? {})) if (st === 'unused') out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}
