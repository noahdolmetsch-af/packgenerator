/**
 * Layers (answer 2, 4.10.2026): a base that goes on every ride, plus layers that are added
 * automatically when the ride is longer, colder or wet.
 *
 * Each item can carry these optional fields (set them in Gear → Edit):
 *   ride       'daily' | 'training'  joins from this kind of ride on (a training ride also gets the daily layer)
 *   coldBelow  number (°C)          add it when it gets colder than this
 *   rain       'yes' | 'optional'   add it when rain is expected ('optional' is only offered)
 *   perHours   number               one piece per this many riding hours (e.g. 1 gel per 3 h)
 *   waterL     number               litres of water in it, shown in the system weight
 * "Every ride" stays what it was: items with the role worn or standard.
 */
import { isInventory } from './gear.js';

export const RIDES = [
  { key: 'every', name: 'Every ride' },
  { key: 'daily', name: 'Daily ride' },
  { key: 'training', name: 'Training ride' },
];
const RIDE_RANK = { every: 0, daily: 1, training: 2 };
export const RAIN_ITEM = { yes: 'Rain', optional: 'Rain, optional' };

/** A trip with rain expected (showers or rain). */
const wet = (wx) => wx?.rain === 'showers' || wx?.rain === 'rain';
const hasTemps = (wx) => typeof wx?.min === 'number' && typeof wx?.max === 'number';

/**
 * Everything the layers add to a trip. Each row: { id, why, place, qty, optional }.
 * place 'wear' = on me, 'pack' = in its usual bag.
 * Cold layers are worn when even the warmest part of the day is colder than their limit,
 * and packed when only the coldest part is.
 */
export function layerSuggest(trip, items) {
  const rows = [];
  const level = RIDE_RANK[trip?.ride] ?? -1;
  const wx = trip?.wx;
  const hours = Number(trip?.hours) || 0;
  for (const i of items) {
    if (!isInventory(i)) continue;
    const qty = i.perHours && hours ? Math.max(1, Math.ceil(hours / i.perHours)) : 1;
    if (i.ride && RIDE_RANK[i.ride] <= level) {
      rows.push({ id: i.id, why: RIDES.find((r) => r.key === i.ride).name, place: i.defaultBag === 'body' ? 'wear' : 'pack', qty, optional: false });
    } else if (typeof i.coldBelow === 'number' && hasTemps(wx) && wx.min < i.coldBelow) {
      rows.push({ id: i.id, why: `Below ${i.coldBelow} °C`, place: wx.max < i.coldBelow ? 'wear' : 'pack', qty, optional: false });
    } else if (i.rain && wet(wx)) {
      rows.push({ id: i.id, why: RAIN_ITEM[i.rain] ?? 'Rain', place: 'pack', qty, optional: i.rain === 'optional' });
    } else if (qty > 1 && (i.role === 'worn' || i.role === 'standard')) {
      // Every-ride food and drink: more pieces on a longer ride.
      rows.push({ id: i.id, why: `1 per ${i.perHours} h`, place: i.defaultBag === 'body' ? 'wear' : 'pack', qty, optional: false });
    }
  }
  // Same order as the layers are built up: ride, amounts, warm to cold, rain.
  const rank = (r) => (r.why.startsWith('Below') ? 3 + (40 - itemCold(items, r.id)) / 100 : r.why.startsWith('Rain') ? 4 + (r.optional ? 0.5 : 0) : r.why === 'Daily ride' ? 1 : r.why === 'Training ride' ? 2 : 2.5);
  return rows.sort((a, b) => rank(a) - rank(b));
}
const itemCold = (items, id) => items.find((i) => i.id === id)?.coldBelow ?? 0;

/** Is a suggestion already done on this trip (worn, packed, enough pieces)? */
export function layerDone(row, trip) {
  const e = trip.entries.find((x) => x.itemId === row.id);
  if (!e) return false;
  if ((e.qty || 1) < row.qty) return false;
  return row.place === 'wear' ? e.slot === 'body' : true;
}

/**
 * Apply suggestions to a trip's entries: add what is missing, raise the number of pieces,
 * move items to "On me" that should be worn. Nothing is taken off.
 */
export function applyLayers(entries, rows, slotOf) {
  let out = [...entries];
  for (const r of rows) {
    const slot = r.place === 'wear' ? 'body' : slotOf(r.id);
    const e = out.find((x) => x.itemId === r.id);
    if (!e) out.push({ itemId: r.id, slot, qty: r.qty, packed: false });
    else out = out.map((x) => (x.itemId === r.id ? { ...x, qty: Math.max(x.qty || 1, r.qty), slot: r.place === 'wear' ? 'body' : x.slot } : x));
  }
  return out;
}

/** The layer an item belongs to, for the inventory check order and its heading. */
export function layerOf(item) {
  if (item.role === 'worn' || item.role === 'standard') return { rank: 0, name: 'Every ride' };
  if (item.ride === 'daily') return { rank: 1, name: 'Daily ride' };
  if (item.ride === 'training') return { rank: 2, name: 'Training ride' };
  if (typeof item.coldBelow === 'number') return { rank: 3 + (40 - item.coldBelow) / 100, name: `Below ${item.coldBelow} °C` };
  if (item.rain) return { rank: 4, name: 'Rain' };
  if (item.sets?.length) return { rank: 5, name: 'Overnight sets' };
  return { rank: 6, name: 'Everything else' };
}

/** Litres of water on a trip (bottles and bags with waterL). */
export function waterOn(trip, itemsById) {
  return trip.entries.reduce((t, e) => t + (itemsById[e.itemId]?.waterL || 0) * (e.qty || 1), 0);
}
