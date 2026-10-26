/**
 * Idee 51 «Teil mit kleiner Geschichte» (Touren b, 996 Ideen, Noah 25.10.2026): a short voice note on an item
 * (Material › Teil, the input bar of «Eingaben überall», item.inputs.voices) comes back while packing: the card
 * «Kleine Geschichten» in Packen plays it. Taken out for one trip with × (trip.storiesOff = [itemId]).
 * Pure function, tested in tests/touren-b.test.js.
 */
import { inputsOf } from '../eingabe/inputs.js';

/** The items on the trip with a voice note, in list order: [{ item, voices }]. */
export function packStories(trip, itemsById = {}) {
  const off = new Set(Array.isArray(trip?.storiesOff) ? trip.storiesOff : []);
  const out = [];
  const seen = new Set();
  for (const e of trip?.entries ?? []) {
    const item = itemsById[e.itemId];
    if (!item || seen.has(item.id) || off.has(item.id)) continue;
    seen.add(item.id);
    const voices = inputsOf(item.inputs).voices;
    if (voices.length) out.push({ item, voices });
  }
  return out;
}

/** The trip's list of taken-out stories with one more (or one less with back = true). */
export function storyOff(trip, itemId, back = false) {
  const off = new Set(Array.isArray(trip?.storiesOff) ? trip.storiesOff : []);
  if (back) off.delete(itemId);
  else off.add(itemId);
  return [...off];
}
