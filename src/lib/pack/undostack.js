/**
 * P3b «Bedienregeln», T2a (Noah 15.10.2026 «4a»): «Undo» while packing stays until another trip is
 * chosen, also after leaving the packing page and coming back (kept in memory, not in the database).
 * Each step: { id: trip id, before: the trip as it was, ctx? }.
 */
let list = [];
export const undoSteps = () => list;
export function keepUndoSteps(next, tripId) {
  if (!tripId) return; // the trip is still loading
  list = (next ?? []).filter((u) => u.id === tripId);
}
