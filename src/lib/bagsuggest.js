/**
 * v0.26.1 (AP17, Noah 14a/15b): packing places for an outdoor trip, and honest bag volume.
 *
 * Suggested places (14a): on a trip with a night outdoors (trip.overnight 'outdoor', context.js)
 * sleep and cook items that sit in a poor place get a better one:
 *   poor = on the body without being worn, or in a place where this trip has no bag
 *          (e.g. a bag the bike does not have).
 *   better = the item's usual bag when the trip has a bag there, else the first place of
 *          SLEEP_PLACES / COOK_PLACES with a bag on this trip; when no bag of the trip fits, a
 *          free place of the bike that has a bag in the bag list ("add for this trip").
 * Nothing moves by itself: the Pack card shows the rows, Apply / Apply all go through Pack's
 * change() (Undo). The bike's standard setup (bike.setup) stays as it is; a bag added here only
 * goes into trip.setup. Dismissed rows are kept in trip.placesDismissed ([itemId]).
 *
 * Volume (15b): no "fits" or "too full" until the litres are known. bagVolumes gives
 * "{used} of {cap} L" per bag only when every bag in use AND every item in those bags has litres.
 * Pure functions, tested in tests/bagsuggest.test.js.
 */
import { SLOTS } from './bikes.js';

/** The item sets that get a place suggestion. */
export const PLACE_SETS = ['sleep', 'cook'];
/** Where sleep things go best: big, dry places first. */
export const SLEEP_PLACES = ['seat', 'side', 'bar', 'fork', 'frame', 'down'];
/** Where cook things go best: low and central first (stove, fuel, pot). */
export const COOK_PLACES = ['frame', 'side', 'fork', 'down', 'seat', 'bar', 'top'];

const isOutdoor = (trip) => trip?.overnight === 'outdoor';

/** Is this entry's place poor for the item? On the body without being worn, or no bag at its place. */
export function poorPlace(entry, item, trip) {
  if (entry.slot === 'mounted') return false;
  if (entry.slot === 'body') return item?.role !== 'worn';
  if (Array.isArray(trip.packs)) return false; // a trip without a bike has its own bags
  return !trip.setup?.[entry.slot];
}

/** The best place on this trip for one item, or null: { slot, bagId, addBag }. */
function bestPlace(item, trip, bike, containers) {
  const order = item.sets?.includes('sleep') ? SLEEP_PLACES : COOK_PLACES;
  const setup = trip.setup ?? {};
  if (item.defaultBag && setup[item.defaultBag] && item.defaultBag !== 'carry') return { slot: item.defaultBag, bagId: setup[item.defaultBag], addBag: false };
  const own = order.find((s) => setup[s]);
  if (own) return { slot: own, bagId: setup[own], addBag: false };
  // No bag of the trip fits: a free place of the bike with a bag in the bag list, for this trip only.
  const slots = bike?.slots ?? [];
  for (const s of order) {
    if (!slots.includes(s) || setup[s]) continue;
    const bag = (bike?.setup?.[s] && containers.find((c) => c.id === bike.setup[s])) || containers.find((c) => c.slot === s);
    if (bag) return { slot: s, bagId: bag.id, addBag: true };
  }
  return null;
}

/**
 * The rows of "Suggested places": [{ itemId, from, to, bagId, addBag }], one per item, in the order
 * of the trip. Empty for a trip that is not outdoors, and for dismissed items.
 */
export function suggestPlaces(trip, items, containers = [], bike = null) {
  if (!isOutdoor(trip) || Array.isArray(trip.packs)) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const dismissed = new Set(trip.placesDismissed ?? []);
  const rows = [];
  for (const e of trip.entries ?? []) {
    const item = byId.get(e.itemId);
    if (!item || dismissed.has(e.itemId) || !item.sets?.some((s) => PLACE_SETS.includes(s))) continue;
    if (!poorPlace(e, item, trip)) continue;
    const to = bestPlace(item, trip, bike, containers);
    if (to && to.slot !== e.slot) rows.push({ itemId: e.itemId, from: e.slot, to: to.slot, bagId: to.bagId, addBag: to.addBag });
  }
  return rows;
}

/**
 * The changes for Pack's change() when rows are applied: the items move and are open to pack
 * again (like "Move to" in Pack: the new bag is not packed yet), and a bag added for this trip
 * goes into trip.setup (never the bike's setup). → { entries, setup }
 */
export function applyPlaces(trip, rows) {
  const setup = { ...(trip.setup ?? {}) };
  const to = new Map();
  for (const r of rows) {
    if (r.addBag && !setup[r.to]) setup[r.to] = r.bagId;
    to.set(r.itemId, r.to);
  }
  return { setup, entries: (trip.entries ?? []).map((e) => (to.has(e.itemId) ? { ...e, slot: to.get(e.itemId), packed: false } : e)) };
}

/** Dismiss a row: the item keeps its place and is not suggested again on this trip. */
export const dismissPlace = (trip, itemId) => ({ placesDismissed: [...new Set([...(trip.placesDismissed ?? []), itemId])] });

/** Places with a bag (not body, not mounted) that hold items, from tripStats zones. */
const bagZones = (stats) => (stats?.zones ?? []).filter((z) => z.key !== 'body' && z.key !== 'mounted' && z.entries.length);

/**
 * 15b: { [zoneKey]: { used, cap } } for every bag in use, or null as soon as one bag in use or one
 * item in such a bag has no litres (then nothing about volume is shown).
 */
export function bagVolumes(stats, itemsById) {
  const zones = bagZones(stats);
  if (!zones.length) return null;
  const out = {};
  for (const z of zones) {
    const cap = Number(z.bag?.volumeL);
    if (!z.bag || !(cap > 0)) return null;
    let used = 0;
    for (const e of z.entries) {
      const v = Number(itemsById[e.itemId]?.volumeL);
      if (!(v > 0)) return null;
      used += v * (e.qty || 1);
    }
    out[z.key] = { used: Math.round(used * 10) / 10, cap };
  }
  return out;
}

/** The name of a place for a suggestion row: the bag's name when there is one, else the place. */
export const placeKey = (slot) => SLOTS.find((s) => s.key === slot)?.name ?? (slot === 'body' ? 'On me' : slot);
