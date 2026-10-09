/**
 * v0.43.0 "Wiege-Modus" (Noah): weigh what has no weight yet, one thing per screen, the biggest
 * impact first. The queue holds three kinds of targets:
 *
 *   - bikes ('bike'): a bike without a weight, or with only an estimate (bikes.js bikeWeightKind);
 *   - bags ('bag'): a bag of the bag list without a gear item and without its own weight;
 *   - items ('item'): gear items (owned or unclear) without a weight. Bags (category 'bags') also
 *     come when their weight is from the logbook or online only: Noah still weighs his bags.
 *
 * With `extras` (Gear) bikes and bags come first, then the items in groups: bags, sleep, outer
 * clothing, mid layers, then the rest. Within a group the item used on the most trips and templates
 * goes first, then the category order, then the name.
 *
 * Saving writes the weight in grams (an item: per piece, weightStatus 'measured' like every weight
 * typed in the app); it returns the record before, which bulk.js undoBulk writes back ("Undo").
 * Pure functions plus two small writes; tested in tests/weigh043.test.js.
 */
import { CATEGORIES, isInventory } from './gear.js';
import { bikeWeightKind } from './bikes.js';
import { isClothing, layerKey } from './wardrobe.js';

/** The groups of the items, in the order they are weighed. name: English key for t(). */
export const WEIGH_GROUPS = [
  { key: 'bags', name: 'Bags' },
  { key: 'sleep', name: 'Sleep' },
  { key: 'outer', name: 'Outer layer' },
  { key: 'mid', name: 'Mid layer' },
  { key: 'rest', name: 'Everything else' },
];

/** The weigh group of an item: bags, sleep, outer (layer outer, or rain wear without a layer), mid, rest. */
export function weighGroup(item) {
  if (item.category === 'bags') return 'bags';
  if (item.category === 'sleep') return 'sleep';
  if (isClothing(item)) {
    const layer = layerKey(item.layer);
    if (layer === 'outer' || (!layer && item.category === 'rain')) return 'outer';
    if (layer === 'mid') return 'mid';
  }
  return 'rest';
}

/** Does this item still need the scale? No weight, or a bag with a weight that was not weighed in the app. */
export function itemToWeigh(item) {
  if (!isInventory(item)) return false;
  if (item.weightG == null) return true;
  return item.category === 'bags' && item.weightStatus !== 'measured';
}

/** How often each item is listed on trips and templates: { [itemId]: n } (one per trip or template). */
export function usageCounts(trips = [], templates = []) {
  const n = {};
  for (const x of [...trips, ...templates]) {
    const ids = new Set([...(x?.entries ?? []).map((e) => e.itemId), ...(x?.ready ?? []).map((r) => r.itemId)].filter(Boolean));
    for (const id of ids) n[id] = (n[id] ?? 0) + 1;
  }
  return n;
}

const catOrder = Object.fromEntries(CATEGORIES.map((c, i) => [c.key, i]));
const groupOrder = Object.fromEntries(WEIGH_GROUPS.map((g, i) => [g.key, i]));
const nameOf = (x) => String(x.nameDe || x.name || x.id || '');

/**
 * The queue: [{ kind, id, key, name, group, uses, rec, qty }] in weighing order.
 * key: `${kind}:${id}` (unique over the three kinds). extras: bikes and bags of the bag list first.
 */
export function weighQueue({ items = [], bikes = [], containers = [], trips = [], templates = [], extras = false } = {}) {
  const uses = usageCounts(trips, templates);
  const list = items
    .filter(itemToWeigh)
    .map((rec) => ({ kind: 'item', id: rec.id, key: `item:${rec.id}`, name: nameOf(rec), group: weighGroup(rec), uses: uses[rec.id] ?? 0, rec, qty: Math.max(1, Number(rec.qty) || 1) }))
    .sort(
      (a, b) =>
        groupOrder[a.group] - groupOrder[b.group] ||
        b.uses - a.uses ||
        (catOrder[a.rec.category] ?? 99) - (catOrder[b.rec.category] ?? 99) ||
        a.name.localeCompare(b.name),
    );
  if (!extras) return list;
  const bikeList = bikes
    .filter((b) => bikeWeightKind(b) !== 'measured')
    .map((rec) => ({ kind: 'bike', id: rec.id, key: `bike:${rec.id}`, name: nameOf(rec), group: 'bike', uses: 0, rec, qty: 1 }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const bagList = containers
    .filter((c) => !c.itemId && c.weightG == null)
    .map((rec) => ({ kind: 'bag', id: rec.id, key: `bag:${rec.id}`, name: nameOf(rec), group: 'bags', uses: 0, rec, qty: 1 }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...bikeList, ...bagList, ...list];
}

/**
 * The order on screen: skipped targets go to the end (in the order they were skipped); front (a key)
 * comes first, e.g. the target an Undo just brought back.
 */
export function orderQueue(queue, skipped = [], front = null) {
  const skip = new Set(skipped);
  const head = queue.filter((q) => q.key === front);
  const rest = queue.filter((q) => q.key !== front);
  const later = skipped.map((k) => rest.find((q) => q.key === k)).filter(Boolean);
  return [...head, ...rest.filter((q) => !skip.has(q.key)), ...later];
}

/** The largest weight a target may get: 60 kg for a bike, 30 kg for the rest. */
export const maxGrams = (target) => (target?.kind === 'bike' ? 60000 : 30000);

/**
 * Grams typed on the scale: a whole number from 1 to max; else null. Spaces and ' are thousands
 * marks; , and . only in front of exactly 3 digits ("1.250"), so "12,5" is refused, never 125 g.
 */
export function readGrams(text, max = 30000) {
  let clean = String(text ?? '').trim().replace(/[\s'’]/g, '');
  if (/^\d{1,3}([.,]\d{3})+$/.test(clean)) clean = clean.replace(/[.,]/g, '');
  if (!/^\d+$/.test(clean)) return null;
  const n = Number(clean);
  return n >= 1 && n <= max ? n : null;
}

/**
 * What saving writes: { table, id, patch }. An item gets the weight of one piece (a pair weighed
 * together, qty 2: half each) and weightStatus 'measured'; a bike loses an "estimate" note.
 */
export function weighPatch(target, grams, now = new Date().toISOString()) {
  if (target.kind === 'bike') {
    const note = target.rec.weightNote && /estimate/i.test(target.rec.weightNote) ? { weightNote: null } : {};
    return { table: 'bikes', id: target.id, patch: { weightG: grams, ...note, updatedAt: now } };
  }
  if (target.kind === 'bag') return { table: 'containers', id: target.id, patch: { weightG: grams } };
  return { table: 'items', id: target.id, patch: { weightG: Math.max(1, Math.round(grams / target.qty)), weightStatus: 'measured', updatedAt: now } };
}

/** Save one weight in one transaction. Returns the undo snapshot ({ items | bikes | containers: [before] }). */
export async function saveWeight(db, target, grams) {
  const { table, id, patch } = weighPatch(target, grams);
  return db.transaction('rw', db[table], async () => {
    const before = await db[table].get(id);
    if (!before) return null;
    await db[table].put({ ...before, ...patch });
    return { [table]: [before] };
  });
}
