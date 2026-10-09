/**
 * Trips (Pack): a new trip, the standard set, the ready check and all weights.
 * Pure functions plus one start-up step (ensureTrips), so the rules are easy to test.
 *
 * A trip stores:
 *   bikeId, setup     which bike, and which bag sits where for this trip (copied from the bike)
 *   entries           [{ itemId, slot, qty, packed }]  slot = a bike place, "body" or "mounted"
 *   ready             [{ id, label, done }]  this trip's ready check (older trips may still have group/itemId)
 *   domain, packs     v0.21.0: the area; a trip without a bike has its own bags in `packs` (see domains.js)
 */
import { SLOT, SLOTS, FIXED_ZONES, addedWeight, bikeWeightKind, isWornSlot } from './bikes.js';
import { isInventory, isConsumable } from './gear.js';
import { t as tr, bagName } from './i18n.svelte.js';
import { inDomain, BIKEPACKING } from './domains.js';
import { inStandard, isWorn, blockKeys } from './blocks2026.js';
import { isOver } from './debrief.js';
import { localDay } from './localday.js';

/**
 * The ready check suggested for every new trip (decision 7: editable per trip).
 * Cleaned up 4.10.2026 with Noah: one short list without groups; the "always with me" items
 * are now normal items marked "On every trip" (see alwaysEntries). Noah can save his own
 * list as the standard (setting "readyStandard"), which then replaces this one.
 */
// v0.45.2 (Noah 9.10.2026, "gilt primär"): the base check before every ride starts with his six
// things; from the old list stay what still makes sense (kit, charged, tyres, phone/wallet/keys).
// Dropped: food, "Backpack packed" (now the mini backpack), route on the Garmin, live tracking.
export const READY_DEFAULT = [
  { id: 'lock', label: 'Lock' },
  { id: 'minipack', label: 'Mini backpack' },
  { id: 'bottle', label: 'Bottle filled' },
  { id: 'glasses', label: 'Sunglasses' },
  { id: 'cap', label: 'Cap' },
  { id: 'wind', label: 'Wind jacket' },
  { id: 'kit', label: 'Helmet, shoes, gloves' },
  { id: 'charged', label: 'Devices charged' },
  { id: 'tyres', label: 'Tyre pressure checked' },
  { id: 'wallet', label: 'Phone, wallet, keys' },
];
/** The ids of the ready check before 0.45.2 (basicCheck2026 replaces them, own rows stay). */
export const READY_OLD_IDS = ['kit', 'charged', 'fuel', 'backpack', 'route', 'tyres', 'wallet', 'tracking'];
/** Where the old "Always with me" checks put a missing item (used once when trips are updated). */
export const ALWAYS_OLD = { EL13: 'top', EL07: 'mounted', EL10: 'body', KL22: 'body', HY01: 'top', WZ23: 'frame' };
/** A fresh ready check: the saved standard (if any) or the suggested list, nothing ticked. */
export const freshReady = (standard = null, fallback = READY_DEFAULT) => (standard?.length ? standard : fallback).map((r) => ({ id: r.id, label: r.label, done: false }));

/**
 * Items in the block Standard that are not on these entries yet, in their usual place.
 * v0.33.0 (Noah 11a): Standard comes into EVERY new trip, also a copy and a template start (before:
 * only items "On every trip"; role standard items came only with the start "Standard").
 */
export function alwaysEntries(items, entries, setup) {
  const on = new Set(entries.map((e) => e.itemId));
  return items
    .filter((i) => inStandard(i) && isInventory(i) && !on.has(i.id) && inDomain(i, BIKEPACKING))
    .map((i) => ({ itemId: i.id, slot: slotFor(i.defaultBag, setup), qty: 1, packed: false }));
}

/** Zone names for "body", "mounted" and every bike place. */
export const ZONE = Object.fromEntries([...FIXED_ZONES, ...SLOTS].map((z) => [z.key, z]));

/** Where an item lands when its default bag is not on this trip's bike. */
export function slotFor(defaultBag, setup) {
  if (defaultBag === 'body' || defaultBag === 'mounted') return defaultBag;
  if (setup?.[defaultBag]) return defaultBag;
  if (setup?.seat) return 'seat';
  const any = SLOTS.find((s) => setup?.[s.key] && !isWornSlot(s.key));
  return any ? any.key : 'body';
}

/**
 * The standard set: worn items on me, standard items and the overnight base set in their default bag
 * (v0.55.0: the base set is the block Bivouac, which took in Base and Sleep).
 * v0.24.0 (Noah, fewer clicks; AP02 answer 2b): the base set (towel, toothbrush, swim shorts …) only
 * comes along when the trip has a night, i.e. more than one day. A day ride no longer starts with
 * seven items to take out again.
 */
export function standardEntries(items, setup, { overnight = true } = {}) {
  return items
    // v0.21.0: only items of the bikepacking area (an item only for the weekend stays out)
    .filter((i) => isInventory(i) && inDomain(i, BIKEPACKING) && (isWorn(i) || inStandard(i) || (overnight && i.sets?.includes('bivy'))))
    .map((i) => ({ itemId: i.id, slot: isWorn(i) ? 'body' : slotFor(i.defaultBag, setup), qty: 1, packed: false }));
}

/** Last trip on this bike (by start date), or null. */
export function lastTripOn(bikeId, trips) {
  return [...trips].filter((t) => t.bikeId === bikeId).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0] ?? null;
}

/**
 * A new trip (decision 5a): a copy of the last trip with the same bike,
 * or the standard set when this bike has no trip yet. Nothing is ticked off.
 */
export function newTrip({ title, startDate, days, bike, readyStandard = null, overnight = null }, trips, items, now = Date.now()) {
  const from = lastTripOn(bike.id, trips);
  const setup = { ...(bike.setup ?? {}) };
  // v0.37.1: an archived item (ownership 'gone') stays on the old trip but never comes into the copy.
  const known = new Set(items.filter((i) => i.ownership !== 'gone').map((i) => i.id));
  const entries = from
    ? from.entries.filter((e) => known.has(e.itemId)).map(({ qtyManual, ...e }) => ({ ...e, slot: e.slot === 'body' || e.slot === 'mounted' || setup[e.slot] ? e.slot : slotFor(e.slot, setup), packed: false }))
    // v0.25.0 (Noah 4): with a known overnight stay the base set only comes through the context
    // (context.js, "Outdoor"); without one the v0.24.0 rule stays (base set from 2 days on).
    : standardEntries(items, setup, { overnight: overnight ? false : (Number(days) || 1) > 1 });
  entries.push(...alwaysEntries(items, entries, setup));
  return {
    id: `trip-${now.toString(36)}`,
    domain: 'bikepacking',
    title: title.trim(),
    startDate,
    days: Math.max(1, Number(days) || 1),
    bikeId: bike.id,
    bike: bike.name,
    setup,
    entries,
    ready: freshReady(readyStandard),
    status: 'planned',
    copiedFrom: from?.id ?? null,
    createdAt: new Date(now).toISOString(),
  };
}

/**
 * The trip on another bike: it takes that bike's bags; items in a place it has no bag for
 * go to the seat pack. Returns the changes to store.
 */
export function switchBike(trip, bike) {
  // v0.37.0: the worn bags (Back, Hip) are on the rider; they stay when the bike changes.
  const worn = Object.fromEntries(Object.entries(trip.setup ?? {}).filter(([k, v]) => isWornSlot(k) && v));
  const setup = { ...(bike.setup ?? {}), ...worn };
  return {
    bikeId: bike.id,
    bike: bike.name,
    setup,
    entries: trip.entries.map((e) => (e.slot === 'body' || e.slot === 'mounted' || setup[e.slot] ? e : { ...e, slot: slotFor(e.slot, setup) })),
  };
}

/** Is a ready-check row done? Rows linked to an item are done when that item is on the trip. */
export function readyDone(row, trip) {
  if (row.itemId) return trip.entries.some((e) => e.itemId === row.itemId);
  return !!row.done;
}

/**
 * Everything the Pack page shows: per zone the entries and weights, and the totals.
 * System weight (decision 9b) = bike + rider + bags + everything packed and worn.
 * v0.22.0 (AP04, honest weights): unknown is not zero. Every sum (…G) adds up only known weights
 * and has its count of unknown weights next to it (…Missing): an item without a weight, a bag
 * without a weight, a bike or rider without a weight. A sum with missing > 0 is "known: …".
 */
export function tripStats(trip, items, containers, bike, riderG) {
  const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
  const bagsById = Object.fromEntries(containers.map((c) => [c.id, c]));
  const w = (e) => {
    const it = itemsById[e.itemId];
    return it?.weightG == null ? null : it.weightG * (e.qty || 1);
  };
  // v0.21.0: a trip without a bike has "On me" and its own bags (trip.packs) instead of bike places.
  const packs = Array.isArray(trip.packs) ? trip.packs : null;
  const packOf = Object.fromEntries((packs ?? []).map((p) => [p.key, p]));
  const keys = packs ? ['body', ...packs.map((p) => p.key)] : [...FIXED_ZONES.map((z) => z.key), ...SLOTS.filter((s) => trip.setup?.[s.key]).map((s) => s.key)];
  // Entries in a place without a bag still show up, marked as "no bag".
  for (const e of trip.entries) if (!keys.includes(e.slot)) keys.push(e.slot);
  // v0.37.0 (Noah 3a): a bag of a trip without a bike can be a real bag of the bag list (pack.bagId);
  // without one (or when that bag was deleted) it stays the generic bag with its name and litres.
  const realOf = (own) => (own?.bagId ? bagsById[own.bagId] ?? null : null);
  const onTripIds = new Set(trip.entries.map((e) => e.itemId));
  // v0.37.0 (Noah 4a): a vest that is clothing and a bag: when the vest is on the list as an item, its
  // weight is already counted there; the bag adds nothing on top.
  const bagG = (bag) => (bag.alsoItem && bag.itemId && onTripIds.has(bag.itemId) ? 0 : addedWeight(bag, itemsById));
  // v0.37.0 (Noah 2a): the worn places (Back, Hip) of a bike trip count to "On me".
  const worn = (key) => !packs && isWornSlot(key);
  const zones = keys.map((key) => {
    const entries = trip.entries.filter((e) => e.slot === key);
    const own = packOf[key];
    const real = realOf(own);
    const bag = own
      ? real
        ? { ...real, name: real.name, volumeL: real.volumeL ?? null, pack: true, real: true }
        : { id: `pack-${key}`, name: tr(own.name), volumeL: own.volumeL ?? null, pack: true }
      : packs
        ? null
        : bagsById[trip.setup?.[key]] ?? null;
    const grams = entries.reduce((t, e) => t + (w(e) ?? 0), 0);
    const vol = entries.reduce((t, e) => t + (itemsById[e.itemId]?.volumeL || 0) * (e.qty || 1), 0);
    return {
      key,
      zone: own ? { key, name: bag.name, box: null } : ZONE[key] ?? { key, name: key, box: null },
      bag,
      noBag: !bag && key !== 'body' && key !== 'mounted',
      worn: worn(key),
      entries,
      grams,
      vol,
      unweighed: entries.filter((e) => w(e) == null).length,
      packed: entries.filter((e) => e.packed).length,
    };
  });
  const tripBags = packs
    ? packs.map(realOf).filter(Boolean).map((bag) => ({ bag, worn: false }))
    : SLOTS.map((s) => ({ bag: bagsById[trip.setup?.[s.key]], worn: !!s.worn })).filter((x) => x.bag);
  const bagWeights = tripBags.filter((x) => !x.worn).map((x) => bagG(x.bag));
  const wornBagWeights = tripBags.filter((x) => x.worn).map((x) => bagG(x.bag));
  const bagsG = bagWeights.reduce((t, g) => t + (g ?? 0), 0);
  const bagsMissing = bagWeights.filter((g) => g == null).length;
  const wornBagsG = wornBagWeights.reduce((t, g) => t + (g ?? 0), 0);
  const wornBagsMissing = wornBagWeights.filter((g) => g == null).length;
  const onMe = (z) => z.key === 'body' || z.worn;
  const onMeG = zones.filter(onMe).reduce((t, z) => t + z.grams, 0) + wornBagsG;
  const gearG = zones.filter((z) => !onMe(z)).reduce((t, z) => t + z.grams, 0);
  const bikeG = bike?.weightG ?? 0;
  // v0.21.0 (decision 5, 9a): four figures. Food and water (food items and anything that holds
  // water, e.g. full bottles) count on their own, wherever they are, also in a jersey pocket.
  // Base = gear in the bags and on the bike without food and water; worn = on me without food.
  // base + worn + consumables = gear + on me, so nothing is counted twice.
  // v0.37.0: on me = the body plus the worn places (Back, Hip) with their bags.
  const eats = (e) => {
    const it = itemsById[e.itemId];
    return !!it && (isConsumable(it) || it.waterL > 0);
  };
  const sumOf = (list) => list.reduce((t, e) => t + (w(e) ?? 0), 0);
  const missOf = (list) => list.filter((e) => w(e) == null).length;
  const onMeEntry = (e) => e.slot === 'body' || worn(e.slot);
  const eatList = trip.entries.filter(eats);
  const wornList = trip.entries.filter((e) => onMeEntry(e) && !eats(e));
  const baseList = trip.entries.filter((e) => !onMeEntry(e) && !eats(e));
  const consumablesG = sumOf(eatList);
  const wornG = sumOf(wornList) + wornBagsG;
  const baseG = sumOf(baseList);
  const unweighed = missOf(trip.entries);
  const bikeKind = bikeWeightKind(bike);
  return {
    zones,
    gearG,
    onMeG,
    baseG,
    wornG,
    consumablesG,
    bagsG,
    wornBagsG,
    bikeG,
    riderG: riderG ?? 0,
    systemG: gearG + onMeG + bagsG + bikeG + (riderG ?? 0),
    unweighed,
    gearMissing: zones.filter((z) => !onMe(z)).reduce((t, z) => t + z.unweighed, 0),
    onMeMissing: zones.filter(onMe).reduce((t, z) => t + z.unweighed, 0) + wornBagsMissing,
    baseMissing: missOf(baseList),
    wornMissing: missOf(wornList) + wornBagsMissing,
    consumablesMissing: missOf(eatList),
    bagsMissing,
    wornBagsMissing,
    // Items, bags, the bike and the rider without a weight: what the system weight leaves out.
    systemMissing: unweighed + bagsMissing + wornBagsMissing + (bike?.weightG ? 0 : 1) + (riderG ? 0 : 1),
    // 'measured' | 'estimate' | 'missing': an estimated bike weight makes the system weight an estimate.
    bikeKind,
    count: trip.entries.length,
    packed: trip.entries.filter((e) => e.packed).length,
    // v0.22.0 (AP04): on the list = count; still to pack = count − packed (packing day).
    toPack: trip.entries.filter((e) => !e.packed).length,
    missing: { bike: !bike?.weightG, rider: !riderG },
  };
}

/**
 * v0.21.0 (stage D): heavy items high up or far back make the bike swing. Places on the
 * handlebar and the seat post; an item counts as heavy above HEAVY_G grams (one piece).
 */
export const HIGH_OR_BACK = ['bar', 'pouchL', 'pouchR', 'seat'];
export const HEAVY_G = 500;
/** The heavy items of a zone (from tripStats) that would sit better in the frame bag: [itemId]. */
export function heavyHigh(zone, itemsById) {
  if (!zone || !HIGH_OR_BACK.includes(zone.key)) return [];
  return zone.entries.filter((e) => (itemsById[e.itemId]?.weightG ?? 0) > HEAVY_G).map((e) => e.itemId);
}

/** Whole days from today to a date (YYYY-MM-DD); negative when it is in the past. */
export function daysUntil(iso, today = new Date()) {
  if (!iso) return null;
  const t = new Date(`${iso}T00:00:00`);
  const n = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((t - n) / 864e5);
}
export function whenLabel(iso, today) {
  const n = daysUntil(iso, today);
  if (n == null || Number.isNaN(n)) return '';
  if (n === 0) return tr('Today');
  if (n === 1) return tr('Tomorrow');
  if (n > 1) return tr('In {n} days', { n });
  return n === -1 ? tr('Yesterday') : tr('{n} days ago', { n: -n });
}

/**
 * Bags that were packed like gear (the Excel lists the seat pack, frame bag … as items)
 * belong in the trip's bag setup instead, so their weight is not counted twice.
 * A bag item goes to its place when that place is still free; the entry is removed.
 * Fixtures (mounts that never come off the bike, like the Garmin mount) are removed too.
 */
export function absorbBags(trip, containers, fixtures = []) {
  const byItem = {};
  // v0.37.0 (Noah 4a): a vest that is also clothing (alsoItem) stays a normal item on the list.
  for (const c of containers) if (c.itemId && !c.alsoItem && !byItem[c.itemId]) byItem[c.itemId] = c;
  const setup = { ...(trip.setup ?? {}) };
  const entries = [];
  for (const e of trip.entries ?? []) {
    if (fixtures.includes(e.itemId)) continue; // always on the bike, part of the bike weight
    const bag = byItem[e.itemId];
    if (!bag) {
      entries.push(e);
      continue;
    }
    if (!setup[bag.slot]) setup[bag.slot] = bag.id;
  }
  return { ...trip, setup, entries };
}

/** Items that are bags in the bag list (they go on the bike, not into a bag). */
// v0.37.0 (Noah 4a): except a bag that is also an item (a vest with pockets): it stays in the lists.
export const bagItemIds = (containers) => new Set(containers.filter((c) => !c.alsoItem).map((c) => c.itemId).filter(Boolean));

/**
 * Start-up step: trips from the Excel import get a bike, a bag setup and a ready check,
 * their entries use `slot` instead of `container`, and bags packed as items move to the setup.
 * Trips that already have all this stay as they are.
 * v0.45.1 (G002): a past or finished trip is history. Its list stays exactly as it was packed: bags
 * and mounts (fixtures) on it are not moved or removed, only the old format (slot) is updated.
 */
export async function ensureTrips(db, today = localDay()) {
  return db.transaction('rw', db.trips, db.bikes, db.containers, async () => {
    const bikes = await db.bikes.toArray();
    const containers = await db.containers.toArray();
    const bagItems = bagItemIds(containers);
    const fixturesOf = (id) => bikes.find((b) => b.id === id)?.fixtures ?? [];
    const todo = (await db.trips.toArray()).filter(
      // v0.21.0: trips without a bike (own bags in trip.packs) need none of this.
      (t) => !Array.isArray(t.packs) && (!t.bikeId || !t.setup || !t.ready || t.entries?.some((e) => !e.slot || (!isOver(t, today) && (bagItems.has(e.itemId) || fixturesOf(t.bikeId).includes(e.itemId))))),
    );
    for (const t of todo) {
      const bike = bikes.find((b) => b.id === t.bikeId) ?? bikes.find((b) => b.name === t.bike) ?? null;
      const trip = {
        ...t,
        bikeId: t.bikeId ?? bike?.id ?? null,
        setup: t.setup ?? { ...(bike?.setup ?? {}) },
        ready: t.ready ?? freshReady(),
        entries: (t.entries ?? []).map(({ container: c, ...e }) => ({ ...e, slot: e.slot ?? c ?? 'seat', packed: !!e.packed })),
      };
      await db.trips.put(isOver(trip, today) ? trip : absorbBags(trip, containers, fixturesOf(trip.bikeId)));
    }
    return todo.length;
  });
}

/** Item IDs on the trip, for quick "is it packed?" checks. */
export const onTrip = (trip) => new Set(trip.entries.map((e) => e.itemId));

/** Label for a zone: the bag's name, or the place name. */
export const zoneName = (z) => {
  const name = z.bag ? bagName(z.bag.name) : tr(z.zone.name);
  return z.noBag ? tr('{name} (no bag)', { name }) : name;
};

export { SLOT };

/* ---------- overnight sets (answer 4: switches per trip) ---------- */

/**
 * v0.55.0 «Bausteine neu»: the block switches of a trip in Pack: what the ride suggests (Light,
 * Repair, Charging, Race) and Cook. The night itself is one choice in the trip window.
 */
export const NIGHT_SETS = [
  { key: 'lights', name: 'Light|block' },
  { key: 'repair', name: 'Repair|block' },
  { key: 'charge', name: 'Charging|block' },
  { key: 'race', name: 'Race|block' },
  { key: 'cook', name: 'Cook' },
];

/**
 * Switch a building block on or off for a trip (trip.sets[key]; false also takes off a block the
 * context suggests, v0.55.0). On: its items are added to their usual bag. Off: its items leave the
 * trip, unless they are standard items or belong to another block that is still on.
 * active: the blocks on the trip besides the explicit switches (context.js activeBlocks).
 */
export function toggleSet(trip, items, key, on, { active = [] } = {}) {
  const sets = { ...(trip.sets ?? {}), [key]: on };
  const inSet = items.filter((i) => isInventory(i) && i.sets?.includes(key));
  let entries = trip.entries;
  if (on) {
    const have = new Set(entries.map((e) => e.itemId));
    entries = [...entries, ...inSet.filter((i) => !have.has(i.id)).map((i) => ({ itemId: i.id, slot: slotFor(i.defaultBag, trip.setup), qty: 1, packed: false }))];
  } else {
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    const keep = (i) => inStandard(i) || isWorn(i) || blockKeys(i).some((s) => s !== key && (sets[s] === true || (sets[s] !== false && active.includes(s))));
    const drop = new Set(inSet.filter((i) => !keep(i)).map((i) => i.id));
    entries = entries.filter((e) => !drop.has(e.itemId) || !byId[e.itemId]);
  }
  return { sets, entries };
}

/* ---------- weather (answer 5: a temperature range per trip; the clothes come from layers.js) ---------- */

export const WX_PRESETS = [
  { name: 'Cold', min: -2, max: 4 },
  { name: 'Chilly', min: 6, max: 12 }, // v0.25.1 (Noah 6a): from 6 °C, so items "below 5 °C" only come with Cold
  { name: 'Mild', min: 10, max: 18 },
  { name: 'Warm', min: 16, max: 24 },
  { name: 'Hot', min: 22, max: 32 },
];
export const RAIN = { none: 'dry', showers: 'showers', rain: 'rain' };

/* ---------- bag too full (answer 3: hint, plus an optional suggestion) ---------- */

/** Answer 4 (round C): keep 20 % of every bag free. Over 80 % is a hint, never a blocker. */
export const FILL_LIMIT = 0.8;
export const tooFull = (zone) => !!zone.bag?.volumeL && zone.vol > zone.bag.volumeL * FILL_LIMIT;

/** A bigger bag for the same place that keeps 20 % free with what is packed, or null. */
export function biggerBag(zone, containers) {
  if (!tooFull(zone)) return null;
  return (
    containers
      .filter((c) => c.slot === zone.key && c.id !== zone.bag.id && (c.volumeL ?? 0) * FILL_LIMIT >= zone.vol)
      .sort((a, b) => a.volumeL - b.volumeL)[0] ?? null
  );
}

/* ---------- weight per wheel (answer 9) ---------- */

// Wheel hubs on the drawing: rear at x 150, front at x 590.
const REAR_X = 150;
const FRONT_X = 590;

/**
 * Luggage on the bike split between the wheels, by where each bag sits on the drawing
 * (a bag above the rear hub is all rear, one at the handlebar mostly front).
 * Only gear and bags on the bike; "On me" and the bike itself are left out.
 */
export function axleLoad(stats, itemsById) {
  let front = 0;
  let rear = 0;
  // v0.22.0 (AP04): items or bags on the bike without a weight make the split an estimate.
  let missing = 0;
  for (const z of stats.zones) {
    // v0.37.0: what the rider wears (body, Back, Hip) is not on a wheel.
    if (z.key === 'body' || z.worn || isWornSlot(z.key)) continue;
    const box = z.zone.box;
    const share = z.key === 'mounted' || !box ? 0.5 : Math.min(1, Math.max(0, (box.x + box.w / 2 - REAR_X) / (FRONT_X - REAR_X)));
    const bagW = z.bag && !z.bag.pack ? addedWeight(z.bag, itemsById) : 0;
    if (bagW == null) missing++;
    missing += z.unweighed ?? 0;
    const g = z.grams + (bagW ?? 0);
    front += g * share;
    rear += g * (1 - share);
  }
  return { front: Math.round(front), rear: Math.round(rear), missing, estimate: missing > 0 };
}

/**
 * v0.22.0 (AP04): the front / rear split as shown. Exact percent only when every weight is known;
 * with missing weights it is an estimate, rounded to 5 % and marked "~". null without luggage.
 * → { front, rear, estimate }  (front + rear = 100)
 */
export function axleSplit(axle) {
  const sum = axle ? axle.front + axle.rear : 0;
  if (!sum) return null;
  const pct = (axle.rear / sum) * 100;
  const rear = axle.estimate ? Math.round(pct / 5) * 5 : Math.round(pct);
  return { front: 100 - rear, rear, estimate: !!axle.estimate };
}

/* ---------- packing day (Noah, 4.10.2026, answer 2a): full screen, bag by bag ---------- */

/**
 * The steps of the packing day: every bag with items (in the order of the trip), then what is
 * mounted on the bike, then what you wear and carry. Each step: { key, title, sub, entries, done }.
 */
export function packSteps(stats, purpose = {}) {
  const LAST = { mounted: 1, body: 2 };
  return stats.zones
    .filter((z) => z.entries.length)
    .map((z, n) => ({ z, n }))
    .sort((a, b) => (LAST[a.z.key] ?? 0) - (LAST[b.z.key] ?? 0) || a.n - b.n)
    .map(({ z }) => {
      // v0.24.0: the same name as on the Pack page ("Frame bag" / "Rahmentasche"); the bag's own
      // name (e.g. "Full frame bag") is the small line under it.
      const name = z.key === 'body' ? tr('Wear and carry') : z.key === 'mounted' ? tr('On the bike') : purpose[z.key] || tr(z.zone.name);
      const sub = z.key === 'body' || z.key === 'mounted' ? '' : purpose[z.key] ? zoneName(z) : z.bag && z.bag.name !== z.zone.name ? zoneName(z) : '';
      return { key: z.key, title: name, sub, entries: z.entries, done: z.entries.filter((e) => e.packed).length };
    });
}

/** Tick or untick one item as "in the bag" on the packing day. */
export const togglePacked = (entries, itemId) => entries.map((e) => (e.itemId === itemId ? { ...e, packed: !e.packed } : e));

/** v0.24.0 (Noah, "select all"): tick several items at once; null = every item of the trip. */
export const packAll = (entries, itemIds = null) => {
  const ids = itemIds && new Set(itemIds);
  return entries.map((e) => (!ids || ids.has(e.itemId) ? { ...e, packed: true } : e));
};

/** v0.24.1 (Noah 2a): tick the whole ready check; "always with me" rows stay as they are (they count by the item). */
export const tickReady = (ready = []) => ready.map((r) => (r.itemId ? r : { ...r, done: true }));

/** v0.24.1 (Noah 2a): a day ride "All packed, let's go": every item packed and the whole ready check, in one write. */
export const packAndReady = (trip) => ({ entries: packAll(trip.entries ?? []), ready: tickReady(trip.ready ?? []) });

/**
 * v0.26.1 (AP19, Noah 18b): a new amount for one entry (1–20). The entry keeps its packed state:
 * raising the amount of a packed item keeps it packed, without an extra question. The amount
 * counts as set by hand (qtyManual), so a later change of the trip's context leaves it alone.
 */
export const setQty = (entries, itemId, qty) => entries.map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, qty)), qtyManual: true } : e));

/** v0.24.1 (Noah 1a/2a): a day ride (1 day or no days set). */
export const isDayTrip = (trip) => !(Number(trip?.days) > 1);

/**
 * v0.24.1 (Noah 6a): "Add material" with tick boxes: several items into one place in one write.
 * Items already on the list stay where they are; an id given twice is added once.
 * fresh: extra fields of a new entry (a trip adds packed: false, a template nothing).
 */
export function addEntries(entries, itemIds, slot, fresh = {}) {
  const have = new Set(entries.map((e) => e.itemId));
  const added = [];
  for (const itemId of itemIds) {
    if (!itemId || have.has(itemId)) continue;
    have.add(itemId);
    added.push({ itemId, slot, qty: 1, ...fresh });
  }
  return added.length ? [...entries, ...added] : entries;
}

/** v0.35.0 (AP29): a change of a trip with its time, so "In progress" sorts by it and the band says "Saved". */
export const touched = (changes, now = new Date().toISOString()) => ({ ...changes, updatedAt: now });
