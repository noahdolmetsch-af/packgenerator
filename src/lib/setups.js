/**
 * Taschen-Setups TS0–TS5 (Noah 14.10.2026 «TS0–TS5 freigegeben», answers «1a 2a 3b 4a 5a», «material a»):
 * several named bag setups per bike. A setup says WHICH bag sits in which place and WHERE each item
 * goes; the template (or the last trip) still says WHAT comes along (1a).
 *
 * Model (no new table, every backup carries it):
 *  - bike.setup      the bags of the setup «Standard» (as before: place → bag id), the fallback for old trips
 *  - bike.stdItems   where items go in «Standard» ([{ itemId, slot, qty }]); missing = taken from the
 *                    last trip on the bike that used «Standard»
 *  - bike.setups     the other setups: [{ id, name, bags: { place: bagId }, items: [...], createdAt }]
 *  - trip.setupId    the setup a trip started from (missing = «Standard»). Moving an item in a trip
 *                    changes only that trip; «Ins Setup übernehmen» saves it into the setup (2a).
 * Weights: the bike from the bike data, empty bags and contents from Material, water apart (items
 * with waterL, 4a). Noah 14.10.2026 «3a»: an empty bottle is gear and counts to the base weight; the
 * water in it («Wasser 0.75 L») and food are consumables outside it. Base weight = bike + empty bags
 * + gear; the total adds food and water. Everything is a suggestion: every setup can be changed, copied or deleted.
 *
 * Pure functions, tested in tests/setups.test.js.
 */
import { SLOTS, addedWeight, isWornSlot } from './bikes.js';
import { slotFor } from './trips.js';
import { bagPlan, sideOf, sideShares, SIDES } from './rig.js';
import { isConsumable } from './gear.js';

export const STD = 'std';

/** Places on the bike in the order front to back (as a reader looks at the drawing list); a function, as rig.js and trips.js import each other. */
export const order = () => [...SIDES.front, ...SIDES.middle, ...SIDES.rear];
const orderOf = (slot) => {
  const list = order();
  return list.includes(slot) ? list.indexOf(slot) : list.length + SLOTS.findIndex((s) => s.key === slot);
};

const keep = (slot) => slot === 'body' || slot === 'mounted' || isWornSlot(slot);
const sortTrips = (list) => [...list].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
const bikeTrips = (bike, trips) => (trips ?? []).filter((t) => t.bikeId === bike?.id && !Array.isArray(t.packs));
export const setupIdOf = (trip) => trip?.setupId ?? STD;

/** The bags of a trip on the bike (worn places left out) and where its items are: a setup to save. */
export function fromTrip(trip) {
  const bags = Object.fromEntries(Object.entries(trip?.setup ?? {}).filter(([k, v]) => v && !isWornSlot(k)));
  const items = (trip?.entries ?? []).filter((e) => bags[e.slot]).map((e) => ({ itemId: e.itemId, slot: e.slot, qty: e.qty || 1 }));
  return { bags, items };
}

/** Where items go in «Standard»: stored on the bike, or taken from the last trip that used it. */
export function stdItemsOf(bike, trips) {
  if (Array.isArray(bike?.stdItems)) return bike.stdItems;
  const last = sortTrips(bikeTrips(bike, trips).filter((t) => setupIdOf(t) === STD))[0];
  return last ? fromTrip(last).items.filter((x) => bike.setup?.[x.slot]) : [];
}

/** All setups of a bike: «Standard» first, then the others in the order they were made. */
export function setupsOf(bike, trips = []) {
  if (!bike) return [];
  const std = { id: STD, name: 'Standard', std: true, bags: { ...(bike.setup ?? {}) }, items: stdItemsOf(bike, trips) };
  return [std, ...(bike.setups ?? [])];
}
export const setupOf = (bike, id, trips = []) => setupsOf(bike, trips).find((s) => s.id === id) ?? setupsOf(bike, trips)[0] ?? null;

/** Per setup: how many trips used it and the last one (by start date). */
export function usageOf(bike, trips) {
  const out = {};
  for (const t of sortTrips(bikeTrips(bike, trips))) {
    const id = setupIdOf(t);
    out[id] ??= { n: 0, last: t };
    out[id].n++;
  }
  return out;
}

/** The setup the app suggests: the one of the last trip on this bike (that still exists), else «Standard». */
export function lastUsedId(bike, trips) {
  const last = sortTrips(bikeTrips(bike, trips))[0];
  const id = setupIdOf(last);
  return (bike?.setups ?? []).some((s) => s.id === id) ? id : STD;
}

/** The fields to store on the bike after changing one setup. */
export function saveSetup(bike, setup) {
  if (setup.id === STD) return { setup: { ...setup.bags }, stdItems: setup.items };
  const list = bike.setups ?? [];
  const clean = { id: setup.id, name: setup.name, bags: { ...setup.bags }, items: setup.items, createdAt: setup.createdAt ?? null };
  return { setups: list.some((s) => s.id === setup.id) ? list.map((s) => (s.id === setup.id ? clean : s)) : [...list, clean] };
}

/** A new setup as a copy of another (or of a trip's bags), with a fresh id. */
export function copySetup(from, { name, id, now = Date.now() }) {
  return { id, name, bags: { ...(from?.bags ?? {}) }, items: (from?.items ?? []).map((x) => ({ ...x })), createdAt: new Date(now).toISOString() };
}
/** A name that is not taken yet: «Bikepacking (Kopie)», «… (Kopie 2)». */
export function freeName(name, setups, copyWord = 'copy') {
  const taken = new Set((setups ?? []).map((s) => s.name));
  if (!taken.has(name)) return name;
  for (let n = 1; ; n++) {
    const next = n === 1 ? `${name} (${copyWord})` : `${name} (${copyWord} ${n})`;
    if (!taken.has(next)) return next;
  }
}

/** The bike's setups without one (Standard cannot be deleted). */
export const withoutSetup = (bike, id) => (id === STD ? bike.setups ?? [] : (bike.setups ?? []).filter((s) => s.id !== id));

/**
 * The setup copied to another bike: only the places that bike has keep their bag; items of a place
 * without a bag there end up «without a bag» (loose), as in the bag plan.
 */
export function copyToBike(setup, target, { id, name, now = Date.now() }) {
  const places = new Set(target?.slots ?? SLOTS.map((s) => s.key));
  const bags = Object.fromEntries(Object.entries(setup.bags ?? {}).filter(([k]) => places.has(k)));
  return { ...copySetup({ ...setup, bags }, { id, name, now }), items: (setup.items ?? []).map((x) => ({ ...x, slot: bags[x.slot] ? x.slot : null })) };
}

/* ---------- changing one setup ---------- */

/** One item into another place (or a new item into a place). */
export function moveItem(setup, itemId, slot) {
  const items = setup.items ?? [];
  return { ...setup, items: items.some((x) => x.itemId === itemId) ? items.map((x) => (x.itemId === itemId ? { ...x, slot } : x)) : [...items, { itemId, slot, qty: 1 }] };
}
export const addItems = (setup, itemIds, slot) => itemIds.reduce((s, id) => moveItem(s, id, slot), setup);
export const removeItem = (setup, itemId) => ({ ...setup, items: (setup.items ?? []).filter((x) => x.itemId !== itemId) });
/** Another bag in a place (or none): the items of a place left empty become loose. */
export function setBag(setup, slot, bagId) {
  const bags = { ...(setup.bags ?? {}) };
  if (bagId) bags[slot] = bagId;
  else delete bags[slot];
  return { ...setup, bags, items: bagId ? setup.items ?? [] : (setup.items ?? []).map((x) => (x.slot === slot ? { ...x, slot: null } : x)) };
}

/* ---------- a setup and a trip ---------- */

/**
 * The trip's entries placed by a setup: an item the setup knows goes to its place (when that place
 * has a bag); others stay where they are when their place still has a bag, else they go where the
 * app puts an item without a place. On me, on the bike and the worn places stay as they are.
 */
export function placeBySetup(entries, setup, bags = setup?.bags ?? {}) {
  const where = Object.fromEntries((setup?.items ?? []).filter((x) => x.slot && bags[x.slot]).map((x) => [x.itemId, x.slot]));
  return (entries ?? []).map((e) => {
    if (keep(e.slot)) return e;
    const to = where[e.itemId] ?? (bags[e.slot] ? e.slot : slotFor(e.slot, bags));
    return to === e.slot ? e : { ...e, slot: to, packed: false };
  });
}

/** The changes to store when a trip takes a setup (its bags and places; the worn bags stay). */
export function applySetup(trip, setup) {
  const worn = Object.fromEntries(Object.entries(trip.setup ?? {}).filter(([k, v]) => isWornSlot(k) && v));
  const bags = { ...(setup.bags ?? {}), ...worn };
  return { setupId: setup.id, setup: bags, entries: placeBySetup(trip.entries, setup, bags) };
}

/** How many items a setup would move in this trip (shown before switching). */
export const movesOf = (trip, setup) => {
  const next = applySetup(trip, setup).entries;
  return (trip.entries ?? []).filter((e, i) => next[i]?.slot !== e.slot).length;
};

/**
 * Does the trip differ from its setup: other bags, or an item of the setup in another place? Things
 * the setup does not know are WHAT goes along (the template's part, 1a) and do not count.
 */
export function tripDiffers(trip, setup) {
  if (!setup) return false;
  const mine = fromTrip(trip);
  const a = JSON.stringify(Object.entries(mine.bags).sort());
  const b = JSON.stringify(Object.entries(setup.bags ?? {}).filter(([, v]) => v).sort());
  if (a !== b) return true;
  const at = Object.fromEntries((setup.items ?? []).map((x) => [x.itemId, x.slot]));
  return mine.items.some((x) => at[x.itemId] !== undefined && at[x.itemId] !== x.slot);
}

/** The setup after taking over the trip's bags and places («Ins Setup übernehmen»). */
export const takeFromTrip = (setup, trip) => ({ ...setup, ...fromTrip(trip) });

/* ---------- the numbers of a setup ---------- */

/** A setup as a trip, so the bag plan can count it. */
export const asTrip = (setup, bike) => ({
  id: `setup-${setup.id}`,
  bikeId: bike?.id ?? null,
  setup: { ...(setup.bags ?? {}) },
  entries: (setup.items ?? []).map((x) => ({ itemId: x.itemId, slot: x.slot ?? 'loose', qty: x.qty || 1, packed: false })),
});

/**
 * Everything the setup pages show: per bag (front to back, numbered) the empty weight, the contents
 * (water apart), litres and fill; the totals bike / empty bags / contents / water; front / middle /
 * rear; and the items without a bag. missing: things without a weight (bike, bags, items).
 */
export function setupCalc(setup, bike, items, containers) {
  const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
  const bagsById = Object.fromEntries(containers.map((c) => [c.id, c]));
  const plan = bagPlan(asTrip(setup, bike), items, containers, bike);
  const isWater = (id) => Number(itemsById[id]?.waterL) > 0;
  const isFood = (id) => !isWater(id) && !!itemsById[id] && isConsumable(itemsById[id]);
  const list = [...plan.bags]
    .sort((a, b) => orderOf(a.key) - orderOf(b.key))
    .map((b, n) => {
      const bag = bagsById[setup.bags?.[b.key]] ?? null;
      const emptyG = bag ? addedWeight(bag, itemsById) : null;
      const waterG = b.items.filter((x) => isWater(x.itemId)).reduce((t, x) => t + (x.grams ?? 0), 0);
      const foodG = b.items.filter((x) => isFood(x.itemId)).reduce((t, x) => t + (x.grams ?? 0), 0);
      const contentG = b.items.filter((x) => !isWater(x.itemId) && !isFood(x.itemId)).reduce((t, x) => t + (x.grams ?? 0), 0);
      return { ...b, n: n + 1, bag, emptyG, contentG, foodG, waterG, sumG: (emptyG ?? 0) + contentG + foodG + waterG, items: b.items.map((x) => ({ ...x, item: itemsById[x.itemId] ?? null, water: isWater(x.itemId), food: isFood(x.itemId) })) };
    });
  const sides = { front: 0, middle: 0, rear: 0 };
  for (const b of list) {
    const s = sideOf(b.key);
    if (s) sides[s] += b.sumG;
  }
  const bagsG = list.reduce((t, b) => t + (b.emptyG ?? 0), 0);
  const contentG = list.reduce((t, b) => t + b.contentG, 0);
  const waterG = list.reduce((t, b) => t + b.waterG, 0);
  const foodG = list.reduce((t, b) => t + b.foodG, 0);
  const bikeG = bike?.weightG ?? 0;
  const loadG = bagsG + contentG + foodG + waterG;
  const missing = list.filter((b) => b.bag && b.emptyG == null).length + list.reduce((t, b) => t + b.unweighed, 0) + (bike?.weightG == null ? 1 : 0);
  const loose = (setup.items ?? []).filter((x) => !x.slot || !setup.bags?.[x.slot]).map((x) => ({ itemId: x.itemId, item: itemsById[x.itemId] ?? null, grams: itemsById[x.itemId]?.weightG ?? null }));
  return { setup, list, sides, shares: sideShares(sides), bagsG, contentG, foodG, waterG, bikeG, loadG, baseG: bikeG + bagsG + contentG, totalG: bikeG + loadG, missing, loose };
}

/** The item names of a setup (for «only in A / only in B»). */
const itemIds = (calc) => new Set(calc.list.flatMap((b) => b.items.map((x) => x.itemId)));

/**
 * Two setups place by place (TS3): every place either uses, with both bags and B minus A, then the
 * totals, and the items only in A or only in B.
 */
export function compareTwo(a, b) {
  const places = [...new Set([...a.list.map((x) => x.key), ...b.list.map((x) => x.key)])].sort((x, y) => orderOf(x) - orderOf(y));
  const rows = places.map((key) => {
    const ba = a.list.find((x) => x.key === key) ?? null;
    const bb = b.list.find((x) => x.key === key) ?? null;
    return { key, a: ba, b: bb, diff: (bb?.sumG ?? 0) - (ba?.sumG ?? 0) };
  });
  const ia = itemIds(a);
  const ib = itemIds(b);
  return {
    rows,
    totals: ['bikeG', 'bagsG', 'contentG', 'baseG', 'foodG', 'waterG', 'totalG'].map((k) => ({ key: k, a: a[k], b: b[k], diff: b[k] - a[k] })),
    onlyA: [...ia].filter((id) => !ib.has(id)),
    onlyB: [...ib].filter((id) => !ia.has(id)),
  };
}

/** All setups of a bike as a table (TS4): the places any of them uses, front to back. */
export function tablePlaces(calcs) {
  return [...new Set(calcs.flatMap((c) => c.list.map((x) => x.key)))].sort((x, y) => orderOf(x) - orderOf(y));
}
