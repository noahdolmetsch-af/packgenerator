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
 */
export function absorbBags(trip, containers) {
  const byItem = {};
  for (const c of containers) if (c.itemId && !byItem[c.itemId]) byItem[c.itemId] = c;
  const setup = { ...(trip.setup ?? {}) };
  const entries = [];
  for (const e of trip.entries ?? []) {
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
    const todo = (await db.trips.toArray()).filter(
      (t) => !t.bikeId || !t.setup || !t.ready || t.entries?.some((e) => !e.slot || bagItems.has(e.itemId)),
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
      await db.trips.put(absorbBags(trip, containers));
    }
    return todo.length;
  });
}

/** Item IDs on the trip, for quick "is it packed?" checks. */
export const onTrip = (trip) => new Set(trip.entries.map((e) => e.itemId));

/** Label for a zone: the bag's name, or the place name. */
export const zoneName = (z) => (z.bag ? z.bag.name : z.zone.name) + (z.noBag ? ' (no bag)' : '');

export { SLOT };
