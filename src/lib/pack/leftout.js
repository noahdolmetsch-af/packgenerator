/**
 * «Was hätte gefehlt?» (Touren-Ideen 43, Noah 25.10.2026): the app remembers what was taken off a
 * trip's packing list (by hand, or by a weather change), and after the trip the debrief asks whether
 * one of them was missing. Stored on the trip (no new table, no schema change; an older trip has none):
 *   trip.leftOut = [{ itemId, at }]  newest last, at most LEFT_MAX
 * An item that comes back on the list leaves the list again. Pure, tested in tests/leftout.test.js.
 */
export const LEFT_MAX = 40;

const idsOf = (entries) => new Set((Array.isArray(entries) ? entries : []).map((e) => e?.itemId).filter(Boolean));

/**
 * The trip fields to add to a change (before: the trip, next: the fields of the change):
 * { leftOut } when the entries changed what was left out, else {}.
 */
export function leftOutPatch(before, next, at = new Date().toISOString()) {
  if (!before || !next || !Array.isArray(next.entries)) return {};
  const was = idsOf(before.entries);
  const now = idsOf(next.entries);
  const gone = [...was].filter((id) => !now.has(id));
  const old = Array.isArray(before.leftOut) ? before.leftOut.filter((x) => x?.itemId) : [];
  const back = old.some((x) => now.has(x.itemId));
  if (!gone.length && !back) return {};
  const kept = old.filter((x) => !now.has(x.itemId) && !gone.includes(x.itemId));
  return { leftOut: [...kept, ...gone.map((itemId) => ({ itemId, at }))].slice(-LEFT_MAX) };
}

/**
 * The left-out items to ask about after the trip: still in the gear, not on the list again, not yet
 * named as missing. → items (newest first), at most n.
 */
export function leftOutToAsk(trip, items = [], missing = [], n = 8) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const on = idsOf(trip?.entries);
  const named = new Set((missing ?? []).map((m) => m?.itemId).filter(Boolean));
  const out = [];
  for (const x of [...(Array.isArray(trip?.leftOut) ? trip.leftOut : [])].reverse()) {
    const item = byId.get(x?.itemId);
    if (!item || on.has(item.id) || named.has(item.id) || item.ownership === 'gone' || out.includes(item)) continue;
    out.push(item);
  }
  return out.slice(0, n);
}
