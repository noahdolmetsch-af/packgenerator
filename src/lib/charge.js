/**
 * v0.34.0 (L4, Noah a): the charge list. The ready check says "Devices charged"; which devices
 * that are on this trip, the packing list knows. Pure functions, easy to test.
 *
 * The rule (kept simple on purpose):
 * 1. every item on the trip in the category Electronics (elec) or Lights (light) is a device,
 *    except cables, adapters, chargers, plugs and memory cards (nothing to charge there);
 * 2. an item in another category only when its name says it is clearly a device with a battery:
 *    Di2, AXS, power bank, battery / Akku.
 *
 * The ticks live on the trip, never on the items:
 *   trip.charge       { [itemId]: true }            the evening before the trip (Pack, #/pack?charge)
 *   trip.chargeNight  { [date]: { [itemId]: true } } the evenings on the way (Ride, evening block)
 */
import { nameOf } from './i18n.svelte.js';

/** The categories whose items are devices to charge. */
export const CHARGE_CATEGORIES = ['elec', 'light'];
/** Not a device, even in Electronics: cables, adapters, chargers, plugs, memory cards. */
export const NOT_A_DEVICE = /\b(cable|kabel|adapter|charger|ladeger(ä|ae)t|lader|plug|stecker|sd[- ]?card|speicherkarte|card|karte)s?\b/i;
/** A device in another category: the name says so. */
export const DEVICE_NAME = /\b(di2|axs|power ?bank|battery|batterie|akku)\b/i;

const words = (item) => [item.name, item.nameDe, item.model].filter(Boolean).join(' ');

/** Is this item a device to charge? */
export function isChargeable(item) {
  if (!item) return false;
  const text = words(item);
  if (CHARGE_CATEGORIES.includes(item.category)) return !NOT_A_DEVICE.test(text);
  return DEVICE_NAME.test(text);
}

/**
 * The devices to charge on a trip: [{ itemId, name, qty }], Electronics first, then Lights, then
 * the rest, by name within each. items: all gear items (the trip's entries say which are on it).
 */
export function chargeList(trip, items) {
  if (!trip) return [];
  const byId = new Map((items ?? []).map((i) => [i.id, i]));
  const rank = (i) => (i.category === 'elec' ? 0 : i.category === 'light' ? 1 : 2);
  const seen = new Set();
  const out = [];
  for (const e of trip.entries ?? []) {
    const item = byId.get(e.itemId);
    if (!item || seen.has(item.id) || !isChargeable(item)) continue;
    seen.add(item.id);
    out.push({ itemId: item.id, name: nameOf(item), qty: e.qty || 1, rank: rank(item) });
  }
  return out
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .map(({ itemId, name, qty }) => ({ itemId, name, qty }));
}

/** The ticks of one evening: the evening before (night null) or the evening of a date on the way. */
export const chargeTicks = (trip, night = null) => (night ? trip?.chargeNight?.[night] : trip?.charge) ?? {};

/** Is a device ticked as charged on that evening? */
export const isCharged = (trip, itemId, night = null) => !!chargeTicks(trip, night)[itemId];

/** How many of the list are charged: { done, total }. Ticks of items no longer on the list do not count. */
export function chargeCount(trip, list, night = null) {
  const ticks = chargeTicks(trip, night);
  return { done: list.filter((r) => ticks[r.itemId]).length, total: list.length };
}

/**
 * The trip fields that tick or untick a device (on = true / false; default: the other way round).
 * Returns { charge } or { chargeNight }, to save with db.trips.update. Other evenings stay as they are.
 */
export function toggleCharge(trip, itemId, night = null, on = !isCharged(trip, itemId, night)) {
  const ticks = { ...chargeTicks(trip, night) };
  if (on) ticks[itemId] = true;
  else delete ticks[itemId];
  if (!night) return { charge: ticks };
  return { chargeNight: { ...(trip?.chargeNight ?? {}), [night]: ticks } };
}

/** Tick every device of the list on that evening. */
export function chargeAll(trip, list, night = null) {
  const ticks = { ...chargeTicks(trip, night) };
  for (const r of list) ticks[r.itemId] = true;
  if (!night) return { charge: ticks };
  return { chargeNight: { ...(trip?.chargeNight ?? {}), [night]: ticks } };
}
