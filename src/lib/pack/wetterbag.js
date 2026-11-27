/**
 * «Fürs Wetter noch in diese Tasche» (Noah 24.11.2026 «1-5», Thread «Packen nach Taschen am Bike ausbauen»): what the weather
 * asks for (cold layers, rain gear) and is not packed yet, sorted by the bag where each piece usually goes. Only a view of the
 * open weather rows of layers.js; nothing here writes. A favourite among alternatives already took the place of the usual
 * piece there (layers.js withChoice), so the line names it.
 */
import { openRows } from '../layers.js';

/** At most this many pieces per bag stand in the line; the rest are in the list «Liste prüfen». */
export const MAX_PER_BAG = 3;

/**
 * rows: layerSuggest(trip, items); slotOf(item) → the bag key where the item goes on this trip.
 * Returns { [bagKey]: [{ id, slot, qty, why, kind, favorite }] }, the favourites first.
 */
export function weatherByBag({ trip, rows = [], itemsById = {}, slotOf }) {
  const out = {};
  for (const r of openRows(rows, trip)) {
    if ((r.kind !== 'cold' && r.kind !== 'rain') || r.place !== 'pack') continue;
    const item = itemsById[r.id];
    if (!item) continue;
    const key = slotOf(item);
    if (!key || key === 'body') continue;
    (out[key] ??= []).push({ id: r.id, slot: r.slot, qty: r.qty, why: r.why, kind: r.kind, favorite: !!item.favorite });
  }
  for (const key of Object.keys(out)) out[key].sort((a, b) => Number(b.favorite) - Number(a.favorite)).splice(MAX_PER_BAG);
  return out;
}
