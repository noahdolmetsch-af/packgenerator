/**
 * Trips (Pack): a new trip, the standard set, the ready check and all weights.
 * Pure functions plus one start-up step (ensureTrips), so the rules are easy to test.
 *
 * A trip stores:
 *   bikeId, setup     which bike, and which bag sits where for this trip (copied from the bike)
 *   entries           [{ itemId, slot, qty, packed }]  slot = a bike place, "body" or "mounted"
 *   ready             [{ id, group, label, itemId?, done }]  this trip's ready check
 */
import { SLOT, SLOTS, FIXED_ZONES, containerWeight } from './bikes.js';
import { isInventory } from './gear.js';

/** The fixed ready-check list, suggested for every new trip (decision 7: editable per trip). */
export const READY_DEFAULT = [
  { id: 'gear', group: 'Packing', label: 'Riding gear ready' },
  { id: 'charged', group: 'Power and fuel', label: 'All devices charged' },
  { id: 'carbs', group: 'Power and fuel', label: 'Carbs and bottles ready' },
  { id: 'a1', group: 'Always with me', label: 'AirPods', itemId: 'EL13', slot: 'top' },
  { id: 'a2', group: 'Always with me', label: 'Garmin', itemId: 'EL07', slot: 'mounted' },
  { id: 'a3', group: 'Always with me', label: 'HR strap', itemId: 'EL10', slot: 'body' },
  { id: 'a4', group: 'Always with me', label: 'Glasses', itemId: 'KL22', slot: 'body' },
  { id: 'a5', group: 'Always with me', label: 'Sunscreen', itemId: 'HY01', slot: 'top' },
  { id: 'a6', group: 'Always with me', label: 'Lock', itemId: 'WZ23', slot: 'frame' },
];
export const freshReady = () => READY_DEFAULT.map((r) => ({ ...r, done: false }));

/** Zone names for "body", "mounted" and every bike place. */
export const ZONE = Object.fromEntries([...FIXED_ZONES, ...SLOTS].map((z) => [z.key, z]));

/** Where an item lands when its default bag is not on this trip's bike. */
export function slotFor(defaultBag, setup) {
  if (defaultBag === 'body' || defaultBag === 'mounted') return defaultBag;
  if (setup?.[defaultBag]) return defaultBag;
  if (setup?.seat) return 'seat';
  const any = SLOTS.find((s) => setup?.[s.key] && s.key !== 'carry');
  return any ? any.key : 'body';
}

/** The standard set: worn items on me, standard items and the overnight base set in their default bag. */
export function standardEntries(items, setup) {
  return items
    .filter((i) => isInventory(i) && (i.role === 'worn' || i.role === 'standard' || i.sets?.includes('base')))
    .map((i) => ({ itemId: i.id, slot: i.role === 'worn' ? 'body' : slotFor(i.defaultBag, setup), qty: 1, packed: false }));
}

/** Last trip on this bike (by start date), or null. */
export function lastTripOn(bikeId, trips) {
  return [...trips].filter((t) => t.bikeId === bikeId).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0] ?? null;
}

/**
 * A new trip (decision 5a): a copy of the last trip with the same bike,
 * or the standard set when this bike has no trip yet. Nothing is ticked off.
 */
export function newTrip({ title, startDate, days, bike }, trips, items, now = Date.now()) {
  const from = lastTripOn(bike.id, trips);
  const setup = { ...(bike.setup ?? {}) };
  const known = new Set(items.map((i) => i.id));
  const entries = from
    ? from.entries.filter((e) => known.has(e.itemId)).map((e) => ({ ...e, slot: e.slot === 'body' || e.slot === 'mounted' || setup[e.slot] ? e.slot : slotFor(e.slot, setup), packed: false }))
    : standardEntries(items, setup);
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
    ready: freshReady(),
    status: 'planned',
    copiedFrom: from?.id ?? null,
    createdAt: new Date(now).toISOString(),
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
 */
export function tripStats(trip, items, containers, bike, riderG) {
  const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
  const bagsById = Object.fromEntries(containers.map((c) => [c.id, c]));
  const w = (e) => {
    const it = itemsById[e.itemId];
    return it?.weightG == null ? null : it.weightG * (e.qty || 1);
  };
  const keys = [...FIXED_ZONES.map((z) => z.key), ...SLOTS.filter((s) => trip.setup?.[s.key]).map((s) => s.key)];
  // Entries in a place without a bag still show up, marked as "no bag".
  for (const e of trip.entries) if (!keys.includes(e.slot)) keys.push(e.slot);
  const zones = keys.map((key) => {
    const entries = trip.entries.filter((e) => e.slot === key);
    const bag = bagsById[trip.setup?.[key]] ?? null;
    const grams = entries.reduce((t, e) => t + (w(e) ?? 0), 0);
    const vol = entries.reduce((t, e) => t + (itemsById[e.itemId]?.volumeL || 0) * (e.qty || 1), 0);
    return {
      key,
      zone: ZONE[key] ?? { key, name: key, box: null },
      bag,
      noBag: !bag && key !== 'body' && key !== 'mounted',
      entries,
      grams,
      vol,
      unweighed: entries.filter((e) => w(e) == null).length,
      packed: entries.filter((e) => e.packed).length,
    };
  });
  const bagsG = SLOTS.reduce((t, s) => {
    const bag = bagsById[trip.setup?.[s.key]];
    return t + (bag ? containerWeight(bag, itemsById) ?? 0 : 0);
  }, 0);
  const onMeG = zones.filter((z) => z.key === 'body').reduce((t, z) => t + z.grams, 0);
  const gearG = zones.filter((z) => z.key !== 'body').reduce((t, z) => t + z.grams, 0);
  const bikeG = bike?.weightG ?? 0;
  return {
    zones,
    gearG,
    onMeG,
    bagsG,
    bikeG,
    riderG: riderG ?? 0,
    systemG: gearG + onMeG + bagsG + bikeG + (riderG ?? 0),
    unweighed: trip.entries.filter((e) => w(e) == null).length,
    count: trip.entries.length,
    packed: trip.entries.filter((e) => e.packed).length,
    missing: { bike: !bike?.weightG, rider: !riderG },
  };
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
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n > 1) return `In ${n} days`;
  return n === -1 ? 'Yesterday' : `${-n} days ago`;
}

/**
 * Bags that were packed like gear (the Excel lists the seat pack, frame bag … as items)
 * belong in the trip's bag setup instead, so their weight is not counted twice.
 * A bag item goes to its place when that place is still free; the entry is removed.
 * Fixtures (mounts that never come off the bike, like the Garmin mount) are removed too.
 */
export function absorbBags(trip, containers, fixtures = []) {
  const byItem = {};
  for (const c of containers) if (c.itemId && !byItem[c.itemId]) byItem[c.itemId] = c;
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
export const bagItemIds = (containers) => new Set(containers.map((c) => c.itemId).filter(Boolean));

/**
 * Start-up step: trips from the Excel import get a bike, a bag setup and a ready check,
 * their entries use `slot` instead of `container`, and bags packed as items move to the setup.
 * Trips that already have all this stay as they are.
 */
export async function ensureTrips(db) {
  return db.transaction('rw', db.trips, db.bikes, db.containers, async () => {
    const bikes = await db.bikes.toArray();
    const containers = await db.containers.toArray();
    const bagItems = bagItemIds(containers);
    const fixturesOf = (id) => bikes.find((b) => b.id === id)?.fixtures ?? [];
    const todo = (await db.trips.toArray()).filter(
      (t) => !t.bikeId || !t.setup || !t.ready || t.entries?.some((e) => !e.slot || bagItems.has(e.itemId) || fixturesOf(t.bikeId).includes(e.itemId)),
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
      await db.trips.put(absorbBags(trip, containers, fixturesOf(trip.bikeId)));
    }
    return todo.length;
  });
}

/** Item IDs on the trip, for quick "is it packed?" checks. */
export const onTrip = (trip) => new Set(trip.entries.map((e) => e.itemId));

/** Label for a zone: the bag's name, or the place name. */
export const zoneName = (z) => (z.bag ? z.bag.name : z.zone.name) + (z.noBag ? ' (no bag)' : '');

export { SLOT };

/* ---------- overnight sets (answer 4: switches per trip) ---------- */

export const NIGHT_SETS = [
  { key: 'warm', name: 'Warm' },
  { key: 'sleep', name: 'Sleep' },
  { key: 'cook', name: 'Cook' },
  { key: 'light', name: 'Light' },
];

/**
 * Switch an overnight set on or off for a trip.
 * On: its items are added to their usual bag. Off: its items leave the trip,
 * unless they are standard items or belong to another set that is still on.
 */
export function toggleSet(trip, items, key, on) {
  const sets = { ...(trip.sets ?? {}), [key]: on };
  const inSet = items.filter((i) => isInventory(i) && i.sets?.includes(key));
  let entries = trip.entries;
  if (on) {
    const have = new Set(entries.map((e) => e.itemId));
    entries = [...entries, ...inSet.filter((i) => !have.has(i.id)).map((i) => ({ itemId: i.id, slot: slotFor(i.defaultBag, trip.setup), qty: 1, packed: false }))];
  } else {
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    const keep = (i) => i.role === 'standard' || i.role === 'worn' || i.sets?.some((s) => s !== key && (s === 'base' || sets[s]));
    const drop = new Set(inSet.filter((i) => !keep(i)).map((i) => i.id));
    entries = entries.filter((e) => !drop.has(e.itemId) || !byId[e.itemId]);
  }
  return { sets, entries };
}

/* ---------- weather (answer 5: temperature range and clothing suggestion, as in the prototype) ---------- */

export const WX_PRESETS = [
  { name: 'Cold', min: -2, max: 4 },
  { name: 'Chilly', min: 4, max: 12 },
  { name: 'Mild', min: 10, max: 18 },
  { name: 'Warm', min: 16, max: 24 },
  { name: 'Hot', min: 22, max: 32 },
];
export const RAIN = { none: 'dry', showers: 'showers', rain: 'rain' };

// Temperature bands from the prototype: what to wear when it is warmest, what to pack for the coldest part.
const WX_BANDS = [
  { max: 2, wear: ['KL06', 'KL04', 'KL08', 'KL12', 'RG01', 'KL27', 'KL14', 'KL18', 'KL15', 'RG13', 'RG07'], pack: [] },
  { max: 5, wear: ['KL06', 'KL04', 'KL08', 'KL12', 'KL27', 'KL14', 'KL18', 'KL15'], pack: ['RG01'] },
  { max: 10, wear: ['KL05', 'KL04', 'KL08', 'KL12', 'KL14', 'KL18', 'KL15'], pack: [] },
  { max: 15, wear: ['KL05', 'KL04', 'KL03', 'KL12', 'KL17'], pack: ['KL10', 'KL14', 'KL18'] },
  { max: 20, wear: ['KL05', 'KL04', 'KL03', 'KL17'], pack: [] },
  { max: 99, wear: ['KL05', 'KL04', 'KL03', 'KL17', 'KL19'], pack: [] },
];
const band = (t) => WX_BANDS.find((b) => t < b.max) ?? WX_BANDS[WX_BANDS.length - 1];

/** Clothing for a weather range: wear (on me) and pack (in a bag). Only items you own. */
export function weatherSuggest(wx, items) {
  if (!wx || typeof wx.min !== 'number' || typeof wx.max !== 'number') return null;
  const own = new Set(items.filter(isInventory).map((i) => i.id));
  const wear = [...new Set(band(wx.max).wear)].filter((id) => own.has(id));
  const pack = [...band(wx.min).wear, ...band(wx.min).pack, ...band(wx.max).pack];
  if (wx.rain === 'showers' || wx.rain === 'rain') pack.push('RG01');
  if (wx.rain === 'rain') pack.push('RG06', 'RG08');
  return { wear, pack: [...new Set(pack)].filter((id) => own.has(id) && !wear.includes(id)) };
}

/* ---------- bag too full (answer 3: hint, plus an optional suggestion) ---------- */

/** A bigger bag for the same place that fits what is packed, or null. */
export function biggerBag(zone, containers) {
  if (!zone.bag?.volumeL || zone.vol <= zone.bag.volumeL) return null;
  return (
    containers
      .filter((c) => c.slot === zone.key && c.id !== zone.bag.id && (c.volumeL ?? 0) >= zone.vol)
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
  for (const z of stats.zones) {
    if (z.key === 'body') continue;
    const box = z.zone.box;
    const share = z.key === 'mounted' || !box ? 0.5 : Math.min(1, Math.max(0, (box.x + box.w / 2 - REAR_X) / (FRONT_X - REAR_X)));
    const bagG = z.bag?.itemId && itemsById[z.bag.itemId]?.weightG != null ? itemsById[z.bag.itemId].weightG * (z.bag.pieces || 1) : 0;
    const g = z.grams + bagG;
    front += g * share;
    rear += g * (1 - share);
  }
  return { front: Math.round(front), rear: Math.round(rear) };
}
