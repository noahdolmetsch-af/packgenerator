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
 *   maxQty     number               never more pieces than this (e.g. 2 bottles, refill the rest)
 *   replaces   item id              when worn, it takes the place of this every-ride item (warm jersey instead of short jersey)
 *   altFor     item id              can be taken instead of that item (mini lock instead of large lock)
 * Per trip, `layerPick` remembers a choice: { WZ24: 'WZ23' } takes the alternative, { WZ24: 'none' } skips it.
 * "Every ride" stays what it was: items with the role worn or standard.
 */
import { isInventory } from './gear.js';
import { t } from './i18n.svelte.js';

export const RIDES = [
  { key: 'every', name: 'Every ride' },
  { key: 'daily', name: 'Daily ride' },
  { key: 'training', name: 'Training ride' },
];
const RIDE_RANK = { every: 0, daily: 1, training: 2 };
export const RAIN_ITEM = { yes: 'Rain', optional: 'Rain, optional' };

/** v0.30.1 (Noah A2): an own building block for rain ("Regen", "Rain gear" → key u-regen, u-rain-gear). */
const RAIN_BLOCK = /^u-(.*-)?(rain|regen)/i;
export const isRainBlock = (key) => RAIN_BLOCK.test(key ?? '');
/**
 * When an item comes along for rain: its own setting (item.rain), else 'yes' for an item in a rain
 * building block. v0.30.1 (Noah A2): "+ Rain" on a trip changed nothing when the rain gear was only
 * in Noah's own "Regen" block and not marked "When it rains" one by one.
 */
export const rainOf = (item) => item?.rain || (item?.sets?.some(isRainBlock) ? 'yes' : null);

/** v0.25.0 (Noah 2a/8a): riding hours of the whole trip = hours per day × days (0 when not set). */
export const rideHours = (trip) => (Number(trip?.hours) || 0) * Math.max(1, Number(trip?.days) || 1);

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
  const rankOf = new Map(); // sort order, kept apart from the (translated) label
  const level = RIDE_RANK[trip?.ride] ?? -1;
  const wx = trip?.wx;
  // v0.25.0 (Noah 2a/8a): trip.hours are riding hours PER DAY; the amounts are for the whole trip
  // (day amount × days = what you carry; carryHint in context.js asks "buy on the way?").
  const hours = rideHours(trip);
  for (const i of items) {
    if (!isInventory(i) || i.altFor) continue; // alternatives only come in through a choice
    const qty = Math.min(i.maxQty || 99, i.perHours && hours ? Math.max(1, Math.ceil(hours / i.perHours)) : 1);
    if (i.ride && RIDE_RANK[i.ride] <= level) {
      rows.push({ id: i.id, why: t(RIDES.find((r) => r.key === i.ride).name), place: i.defaultBag === 'body' ? 'wear' : 'pack', qty, optional: false });
      rankOf.set(rows.at(-1), i.ride === 'daily' ? 1 : i.ride === 'training' ? 2 : 2.5);
    } else if (typeof i.coldBelow === 'number' && hasTemps(wx) && wx.min < i.coldBelow) {
      rows.push({ id: i.id, why: t('Below {n} °C', { n: i.coldBelow }), place: wx.max < i.coldBelow ? 'wear' : 'pack', qty, optional: false });
      rankOf.set(rows.at(-1), 3 + (40 - i.coldBelow) / 100);
    } else if (rainOf(i) && wet(wx)) {
      const rain = rainOf(i);
      rows.push({ id: i.id, why: t(RAIN_ITEM[rain] ?? 'Rain'), place: 'pack', qty, optional: rain === 'optional' });
      rankOf.set(rows.at(-1), 4 + (rain === 'optional' ? 0.5 : 0));
    } else if (qty > 1 && (i.role === 'worn' || i.role === 'standard')) {
      // Every-ride food and drink: more pieces on a longer ride.
      rows.push({ id: i.id, why: t('1 per {n} h', { n: i.perHours }), place: i.defaultBag === 'body' ? 'wear' : 'pack', qty, optional: false });
      rankOf.set(rows.at(-1), 2.5);
    }
  }
  // Same order as the layers are built up: ride, amounts, warm to cold, rain.
  rows.sort((a, b) => rankOf.get(a) - rankOf.get(b));
  return rows.map((r) => withChoice(r, trip, items));
}

/**
 * A row with its choices: `slot` is the item it stands for, `alts` the items that can take its
 * place, `skipped` when "none" was picked. A worn swap names the every-ride item it `replaces`.
 */
function withChoice(row, trip, items) {
  const byId = (id) => items.find((i) => i.id === id);
  const alts = items.filter((i) => i.altFor === row.id && isInventory(i)).map((i) => i.id);
  const pick = trip?.layerPick?.[row.id];
  const id = pick && pick !== 'none' && alts.includes(pick) ? pick : row.id;
  const replaces = row.place === 'wear' ? byId(id)?.replaces ?? null : null;
  return { ...row, id, slot: row.id, alts: alts.length ? [row.id, ...alts] : [], skipped: pick === 'none', replaces };
}

/** Does any row need doing? Skipped and optional rows never count. */
export const openRows = (rows, trip) => rows.filter((r) => !r.optional && !r.skipped && !layerDone(r, trip));
/** Is a suggestion already done on this trip (worn, packed, enough pieces)? */
export function layerDone(row, trip) {
  const e = trip.entries.find((x) => x.itemId === row.id);
  if (!e) return false;
  if ((e.qty || 1) < row.qty) return false;
  if (row.replaces && trip.entries.some((x) => x.itemId === row.replaces)) return false;
  return row.place === 'wear' ? e.slot === 'body' : true;
}

/**
 * Apply suggestions to a trip's entries: add what is missing, raise the number of pieces,
 * move items to "On me" that should be worn. Only a swap takes something off: the every-ride
 * item that the worn layer replaces.
 */
export function applyLayers(entries, rows, slotOf) {
  let out = [...entries];
  for (const r of rows) {
    if (r.skipped) continue;
    if (r.replaces) out = out.filter((x) => x.itemId !== r.replaces);
    if (r.id !== r.slot) out = out.filter((x) => x.itemId !== r.slot); // the alternative instead of the usual item
    const slot = r.place === 'wear' ? 'body' : slotOf(r.id);
    const e = out.find((x) => x.itemId === r.id);
    if (!e) out.push({ itemId: r.id, slot, qty: r.qty, packed: false });
    else out = out.map((x) => (x.itemId === r.id ? { ...x, qty: Math.max(x.qty || 1, r.qty), slot: r.place === 'wear' ? 'body' : x.slot } : x));
  }
  return out;
}

/** The layer an item belongs to, for the inventory check order and its heading. */
export function layerOf(item) {
  if (item.role === 'worn' || item.role === 'standard') return { rank: 0, name: t('Every ride') };
  if (item.ride === 'daily') return { rank: 1, name: t('Daily ride') };
  if (item.ride === 'training') return { rank: 2, name: t('Training ride') };
  if (typeof item.coldBelow === 'number') return { rank: 3 + (40 - item.coldBelow) / 100, name: t('Below {n} °C', { n: item.coldBelow }) };
  if (item.rain) return { rank: 4, name: t('Rain') };
  if (item.sets?.length) return { rank: 5, name: t('Building blocks with the night') };
  return { rank: 6, name: t('Everything else') };
}

/** Litres of water on a trip (bottles and bags with waterL). */
export function waterOn(trip, itemsById) {
  return trip.entries.reduce((t, e) => t + (itemsById[e.itemId]?.waterL || 0) * (e.qty || 1), 0);
}
