/**
 * v0.59.0 «Tauschen» (OP2a, Noah: all answers a): one piece of clothing on the packing list swapped
 * for a situational alternative in two taps (a tap on the piece opens «Swap», a tap on the other
 * piece swaps and closes; Undo in the message).
 *
 *   - The worn clothing of a trip (entries on me) is the first card «On me», by zone from head to
 *     feet, inside a zone by layer from the skin outwards (wornClothes).
 *   - The alternatives are the owned pieces of the same zone and layer (wardrobe.js), first those
 *     that fit the trip's weather, then what was picked last, then the closest range (swapChoices).
 *   - A piece without a °C range gets its bar from its class warm / mittel / kalt (tempKey).
 *   - Every swap is remembered in the settings record SWAP_MEMORY ({ [itemId]: { n, at, c } }),
 *     so a picked piece ranks higher next time. Undo takes the swap and the memory back.
 *   - A suggestion is never forced: «Fits less» stays tappable, just quieter.
 *
 * Pure functions only, tested in tests/swap.test.js.
 */
import { isInventory } from './gear.js';
import { isClothing, zoneGroup, layerKey, guessZone, guessLayer, tempKey, warmToCold, rainProof, coldest, isWet, SLACK } from './wardrobe.js';
import { rainOf } from './layers.js';

/** The settings record of the picks. */
export const SWAP_MEMORY = 'swap.memory';
/** Head to feet, as the card and the mockup show the body. */
export const ZONE_ORDER = ['head', 'upper', 'legs', 'hands', 'feet'];
const LAYER_ORDER = ['base', 'mid', 'outer', 'accessory'];

/** The zone and layer of a piece: its own, else the guess from the name (null when neither knows). */
export const zoneOf = (item) => zoneGroup(item?.zone) ?? guessZone(item?.name);
export const layerOf = (item) => layerKey(item?.layer) ?? guessLayer(item?.name);

/**
 * The trip's temperature range { min, max } in °C: the packing weather (wx), else the coldest riding
 * hour of the forecast as a point; null when nothing is known.
 */
export function tripRange(trip) {
  const lo = trip?.wx?.min;
  const hi = trip?.wx?.max;
  if (typeof lo === 'number' && typeof hi === 'number') return { min: Math.min(lo, hi), max: Math.max(lo, hi) };
  const c = coldest(trip);
  return c ? { min: c.c, max: c.c } : null;
}

/** 'wet' | 'dry' from the trip (rain, showers or a rain chance from 30 %: wet). */
export const tripRain = (trip) => (isWet(trip) ? 'wet' : 'dry');

/**
 * Does a piece fit the range (and the rain)? { ok, why } where why is null or
 *   { key: 'cool', n }  made only from n °C (too cool for the coldest part),
 *   { key: 'warm', n }  made only up to n °C (too warm for the warmest part),
 *   { key: 'rain' }     rain gear on a dry trip,
 *   { key: 'dry' }      an outer layer that keeps no rain out on a wet trip.
 * Layers add up, so SLACK (2 °C) on either border still fits. rain: 'dry' | 'wet' | null (any).
 */
export function fitOf(item, range, rain = null) {
  const k = tempKey(item);
  if (k && range) {
    if (Number.isFinite(k.lo) && k.lo > range.min + SLACK) return { ok: false, why: { key: 'cool', n: k.lo } };
    if (Number.isFinite(k.hi) && k.hi < range.max - SLACK) return { ok: false, why: { key: 'warm', n: k.hi } };
  }
  if (rain === 'dry' && (rainOf(item) === 'yes' || (layerOf(item) === 'outer' && rainProof(item)))) return { ok: false, why: { key: 'rain' } };
  if (rain === 'wet' && layerOf(item) === 'outer' && !rainProof(item)) return { ok: false, why: { key: 'dry' } };
  return { ok: true, why: null };
}

/** How far the middle of a piece's range is from the middle of the trip's (0 without either). */
function distance(item, range) {
  const k = tempKey(item);
  if (!k || !range) return 0;
  const lo = Number.isFinite(k.lo) ? k.lo : k.hi - 20;
  const hi = Number.isFinite(k.hi) ? k.hi : k.lo + 20;
  return Math.abs((lo + hi) / 2 - (range.min + range.max) / 2);
}

/**
 * The alternatives for a worn piece: { fits: [row], less: [row] }, row = { item, fit, mem }.
 * Owned pieces (owned or unclear) of the same zone and layer, not the piece itself and nothing that is
 * on the trip already. Order: fits first; then picked more often, then picked more recently; then the
 * range closest to the trip's; then warm to cold.
 */
export function swapChoices(current, items = [], trip = null, memory = {}, { rain = tripRain(trip), range = tripRange(trip) } = {}) {
  if (!current) return { fits: [], less: [] };
  const zone = zoneOf(current);
  const layer = layerOf(current);
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const mem = memory ?? {};
  const rows = items
    .filter((i) => i.id !== current.id && !on.has(i.id) && isInventory(i) && isClothing(i) && zoneOf(i) === zone && layerOf(i) === layer)
    .map((item) => ({ item, fit: fitOf(item, range, rain), mem: mem[item.id] ?? null }));
  rows.sort(
    (a, b) =>
      (b.mem?.n ?? 0) - (a.mem?.n ?? 0) ||
      String(b.mem?.at ?? '').localeCompare(String(a.mem?.at ?? '')) ||
      distance(a.item, range) - distance(b.item, range) ||
      warmToCold(a.item, b.item),
  );
  return { fits: rows.filter((r) => r.fit.ok), less: rows.filter((r) => !r.fit.ok) };
}

/** The memory after a swap to `id` at the trip's temperature c (its coldest part). */
export function rememberSwap(memory, id, c = null, at = new Date().toISOString()) {
  const prev = memory?.[id];
  return { ...(memory ?? {}), [id]: { n: (prev?.n ?? 0) + 1, at, ...(typeof c === 'number' ? { c } : {}) } };
}

/**
 * The entries after a swap: `to` takes the place of `from` (same place, same amount, not packed yet).
 * `swappedFrom` keeps the piece it stands for, so the row can say «instead of …»; swapped back, it goes.
 */
export function swapEntries(entries = [], from, to) {
  if (from === to || !entries.some((e) => e.itemId === from)) return entries;
  if (entries.some((e) => e.itemId === to)) return entries.filter((e) => e.itemId !== from);
  return entries.map((e) => {
    if (e.itemId !== from) return e;
    const { swappedFrom, ...rest } = e;
    const was = swappedFrom ?? from;
    return { ...rest, itemId: to, packed: false, ...(was !== to ? { swappedFrom: was } : {}) };
  });
}

/**
 * The worn clothing of a trip for the card «On me»: [{ zone (key or 'other'), rows: [{ entry, item, layer }] }],
 * head to feet, inside a zone base, mid, outer, accessories, then warm to cold.
 * ids: the item ids it shows (the bag group «On me» leaves them out).
 */
export function wornClothes(trip, itemsById = {}) {
  const rows = (trip?.entries ?? [])
    .filter((e) => e.slot === 'body' && isClothing(itemsById[e.itemId]))
    .map((entry) => {
      const item = itemsById[entry.itemId];
      return { entry, item, zone: zoneOf(item) ?? 'other', layer: layerOf(item) };
    });
  const lrank = (l) => (l == null ? 9 : LAYER_ORDER.indexOf(l));
  const zones = [...ZONE_ORDER, 'other']
    .map((zone) => ({ zone, rows: rows.filter((r) => r.zone === zone).sort((a, b) => lrank(a.layer) - lrank(b.layer) || warmToCold(a.item, b.item)) }))
    .filter((z) => z.rows.length);
  return { zones, ids: new Set(rows.map((r) => r.entry.itemId)), n: rows.length };
}

/**
 * The wardrobe for a trip (OP2a «Kleiderschrank mit Tourband»): which pieces to hide in «Fits the trip».
 * A piece that does not fit is hidden only when another piece of the same zone and layer fits (an
 * unsuitable duplicate); a place where nothing fits keeps all its pieces. → Set of hidden ids.
 */
export function unfitDuplicates(items = [], range, rain = null) {
  const groups = new Map();
  for (const i of items) {
    const key = `${zoneOf(i)}|${layerOf(i)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ i, ok: fitOf(i, range, rain).ok });
  }
  const hide = new Set();
  for (const list of groups.values()) if (list.some((x) => x.ok)) for (const x of list) if (!x.ok) hide.add(x.i.id);
  return hide;
}
