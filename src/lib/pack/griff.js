/**
 * «Griffbereit» (Noah 23.11.2026 «G3», Thread «Packen leichter und besser machen»): what you reach for while
 * riding (a bar, the rain jacket when it starts) should not lie at the bottom of the seat pack. Two sources, both
 * only a suggestion on the list of a trip:
 *
 *   marked     the item says so: item.reach = true (row «Griffbereit» in the item window)
 *   automatic  food and rain gear, as long as the item does not say item.reach = false
 *
 * Such an item that sits in a place a hand does not reach on the bike (seat pack, side bags, frame bag, fork,
 * front roll …) gets a place that is reached (top tube bag, mini bag, pouch left or right), when the trip has a bag
 * there and the item fits it (litres known on both sides). Worn things and things on «On me», «Hip» or «Mounted»
 * are reached already. Nothing here writes; the move is Pack's change() with Undo (bagsuggest.js applyPlaces).
 * Left out for this trip by «Nicht diesmal» (trip.griffSkip). Pure, tested in tests/griff.test.js.
 */
import { isWornSlot } from '../bikes.js';
import { reachChoice } from './griffeld.js';
export { reachChoice, reachRecord, withReach } from './griffeld.js';

/** Places a hand reaches while riding, best first (bag places of the trip). */
export const REACH_PLACES = ['top', 'ttrear', 'pouchL', 'pouchR'];
/** Places that need no suggestion: on you, worn, mounted, in a bottle cage. */
const REACHED = new Set(['body', 'mounted', 'hip', 'cage1', 'cage2', ...REACH_PLACES]);
/** The categories that count as «reached for on the way» when the item says nothing. */
export const AUTO_CATEGORIES = ['food', 'rain'];
/** At most this many rows. */
export const MAX_ROWS = 6;

const isInventory = (item) => item?.ownership === 'owned' || item?.ownership === 'unclear';

/** Why an item should lie within reach: 'marked', 'food', 'rain' or null. */
export function reachWhy(item) {
  const c = reachChoice(item);
  if (c === 'no') return null;
  if (c === 'yes') return 'marked';
  return AUTO_CATEGORIES.includes(item?.category) ? item.category : null;
}

/**
 * What lies out of reach on a trip: [{ itemId, from, to, bagId, addBag:false, why }].
 * trip: a trip with a bike (trip.setup, trip.entries); empty for a trip with its own packs, a finished one,
 * and for items the trip left out or you said «Nicht diesmal» to.
 */
export function griffRows({ trip, items = [], bags = [] }) {
  if (!trip || !Array.isArray(trip.entries) || !trip.entries.length || Array.isArray(trip.packs) || trip.status === 'done') return [];
  const setup = trip.setup ?? {};
  const byId = new Map(items.map((i) => [i.id, i]));
  const bagById = new Map(bags.map((b) => [b.id, b]));
  const skip = new Set(Array.isArray(trip.griffSkip) ? trip.griffSkip : []);
  const free = REACH_PLACES.filter((s) => setup[s]);
  if (!free.length) return [];
  const rows = [];
  for (const e of trip.entries) {
    const item = byId.get(e.itemId);
    if (!item || !isInventory(item) || skip.has(e.itemId)) continue;
    if (REACHED.has(e.slot) || isWornSlot(e.slot)) continue;
    const why = reachWhy(item);
    if (!why) continue;
    const need = Number(item.volumeL);
    const to = free.find((s) => {
      const cap = Number(bagById.get(setup[s])?.volumeL);
      return !(need > 0 && cap > 0) || need <= cap;
    });
    if (!to) continue;
    rows.push({ itemId: e.itemId, from: e.slot, to, bagId: setup[to], addBag: false, why });
  }
  return rows.slice(0, MAX_ROWS);
}

/** The trip's list of «Nicht diesmal» with one more item (never twice). */
export const skipGriff = (trip, itemId) => ({ griffSkip: [...new Set([...(Array.isArray(trip?.griffSkip) ? trip.griffSkip : []), itemId])] });
