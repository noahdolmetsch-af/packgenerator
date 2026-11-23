/**
 * «Dazu nötig» (dazu.js): the field item.withIds, a list of item ids, kept apart from dazu.js because gear.js
 * (itemRecord) needs it and dazu.js needs gear-side modules; no imports here. Pure.
 */
export const ids = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x))] : []);

/** The companions an item names (ids, without itself). */
export const linkedOf = (item) => ids(item?.withIds).filter((x) => x !== item?.id);

/** The companions of an item with one added or taken away (the new list of item.withIds). */
export const withAdded = (item, itemId) => [...new Set([...linkedOf(item), itemId])].filter((x) => x !== item?.id);
export const withRemoved = (item, itemId) => linkedOf(item).filter((x) => x !== itemId);

/** The item field as stored: a list of ids, or null when there is none (an empty one is left out unless the item had it). */
export function withRecord(draft, item) {
  const list = linkedOf(draft);
  if (list.length) return { withIds: list };
  return item && 'withIds' in item ? { withIds: null } : {};
}
