/**
 * v0.25.0 (M3, Noah 7.10.2026): the trip decides the packing list.
 *
 * Before the list is made, the "New trip" dialog asks what kind of trip it is:
 *   trip.hours      riding hours PER DAY (2a); amounts are for the whole trip (hours × days, 8a)
 *   trip.overnight  'none' | 'lodging' | 'outdoor'; an older trip without it is "unknown" and keeps
 *                   its old behaviour (nothing here touches it)
 *   trip.cook       cooking, only for 'outdoor' (3a)
 *   trip.wx         { min, max, rain } (5a, WX_PRESETS)
 *   trip.event      race or organised ride
 * The context brings item sets (contextSets) and the layer rows for weather and amounts
 * (layers.js). They go straight into the list (6b, 7b); each entry they add carries
 * src: 'context', so a later change (9b, applyContext) can tell them from what Noah added himself.
 * Pure functions, tested in tests/context.test.js.
 */
import { isInventory } from './gear.js';
import { inDomain, BIKEPACKING } from './domains.js';
import { layerSuggest, applyLayers, rideHours } from './layers.js';
import { slotFor } from './trips.js';

export const OVERNIGHT = ['none', 'lodging', 'outdoor'];
/** The item sets a context can bring. */
export const CONTEXT_SETS = ['lodging', 'base', 'sleep', 'warm', 'cook'];
/** Night switches in Pack (trips.js NIGHT_SETS) that follow the overnight stay. */
const SWITCHED = ['sleep', 'warm', 'cook'];

/** Does the trip say where it sleeps? Older trips do not: their entries are never changed here. */
export const hasContext = (trip) => OVERNIGHT.includes(trip?.overnight);

/** v0.25.0 (Noah 4): the item sets the overnight stay brings. */
export function contextSets(trip) {
  if (trip?.overnight === 'lodging') return ['lodging'];
  if (trip?.overnight === 'outdoor') return ['base', 'sleep', 'warm', ...(trip.cook ? ['cook'] : [])];
  return [];
}

/** The overnight switches in Pack that match the context (sleep, warm, cook on for outdoor). */
export function contextSwitches(trip) {
  const on = new Set(contextSets(trip));
  return { ...(trip?.sets ?? {}), ...Object.fromEntries(SWITCHED.map((k) => [k, on.has(k)])) };
}

/** The layer rows the context applies: weather and amounts, default choices, nothing optional. */
export const contextRows = (trip, items) => layerSuggest({ ...trip, layerPick: {} }, items).filter((r) => !r.optional);

const slotOfTrip = (trip, items) => {
  const byId = new Map(items.map((i) => [i.id, i]));
  return (id) => slotFor(byId.get(id)?.defaultBag, trip?.setup);
};

/**
 * The entries of a fresh trip: its start (trip.entries: standard set, template or last trip)
 * plus what the context brings: the items of contextSets in their usual bag, and the
 * non-optional layer rows (weather, amounts by duration) applied with applyLayers.
 * Every entry added here carries src: 'context'. Returns the whole list.
 */
export function contextEntries(trip, items, { slotOf = null } = {}) {
  const slot = slotOf ?? slotOfTrip(trip, items);
  const out = (trip.entries ?? []).map((e) => ({ ...e }));
  const have = new Set(out.map((e) => e.itemId));
  const sets = contextSets(trip);
  for (const i of items) {
    if (!sets.length || have.has(i.id) || !isInventory(i) || !inDomain(i, BIKEPACKING) || !i.sets?.some((s) => sets.includes(s))) continue;
    out.push({ itemId: i.id, slot: i.role === 'worn' ? 'body' : slot(i.id), qty: 1, packed: false, src: 'context' });
    have.add(i.id);
  }
  return applyLayers(out, contextRows(trip, items), slot).map((e) => (have.has(e.itemId) ? e : { ...e, src: 'context' }));
}

const sameContext = (a, b) =>
  a.overnight === b.overnight && !!a.cook === !!b.cook && (Number(a.hours) || 0) === (Number(b.hours) || 0) &&
  Math.max(1, Number(a.days) || 1) === Math.max(1, Number(b.days) || 1) && JSON.stringify(a.wx ?? null) === JSON.stringify(b.wx ?? null) &&
  (a.ride ?? null) === (b.ride ?? null);

/**
 * v0.25.0 (Noah 9b): a change of duration, overnight stay or weather applies at once (Pack keeps
 * the Undo). trip: the trip WITH the new context; before (optional): the trip as it was.
 * - adds what the context now brings (src 'context'),
 * - sets the number of pieces of src 'context' entries and of items with an amount per hour,
 *   unless Noah changed that number by hand (qtyManual),
 * - removes src 'context' entries the new context no longer brings,
 * - never removes an entry without src 'context' and never changes the packed state of an entry that stays.
 * fresh (only for a new trip, contextTrip): the start may still lose the every-ride item a worn
 * layer replaces (warm jersey instead of the short one), so nothing stays open to decide (6b).
 * Returns the changes ({ entries, sets }), or {} for a trip without a known overnight stay.
 */
export function applyContext(trip, items, before = null, { fresh = false } = {}) {
  if (!hasContext(trip)) return {};
  if (before && hasContext(before) && sameContext(before, trip)) return {};
  const byId = new Map(items.map((i) => [i.id, i]));
  const counted = (e) => !!byId.get(e.itemId)?.perHours && !e.qtyManual;
  // Noah's own entries, amounts back to 1 so a shorter trip can lower them again.
  const mine = (trip.entries ?? []).filter((e) => e.src !== 'context').map((e) => (counted(e) ? { ...e, qty: 1 } : e));
  const target = new Map(contextEntries({ ...trip, entries: mine }, items).map((e) => [e.itemId, e]));
  const entries = [];
  const seen = new Set();
  for (const e of trip.entries ?? []) {
    const want = target.get(e.itemId);
    seen.add(e.itemId);
    if (e.src === 'context') {
      if (!want) continue; // the new context no longer brings it
      entries.push(e.qtyManual ? e : { ...e, qty: want.qty });
    } else if (want || !fresh) entries.push(want && counted(e) ? { ...e, qty: want.qty } : e);
  }
  for (const [id, e] of target) if (!seen.has(id)) entries.push({ ...e, src: 'context' });
  const changes = { entries };
  if (!before || before.overnight !== trip.overnight || !!before.cook !== !!trip.cook) changes.sets = contextSwitches(trip);
  return changes;
}

/**
 * A new trip with its context (Pack / TripDialog "Create trip"). fromCopy: the start is a copy of
 * the last trip; items of that trip that only belong to overnight sets this trip does not bring
 * stay at home (a day ride after a bivvy weekend starts without the sleeping bag). Worn, standard
 * and "On every trip" items always stay.
 */
export function contextTrip(trip, items, { fromCopy = false } = {}) {
  if (!hasContext(trip)) return trip;
  const entries = fromCopy ? startEntries(trip, items) : trip.entries ?? [];
  return { ...trip, ...applyContext({ ...trip, entries }, items, null, { fresh: true }) };
}

/** The entries a copy of the last trip starts with: without overnight-set items this trip does not bring. */
export function startEntries(trip, items) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const sets = contextSets(trip);
  return (trip.entries ?? []).filter((e) => {
    const i = byId.get(e.itemId);
    if (e.src === 'context' || !i || i.role === 'worn' || i.role === 'standard' || i.always || !i.sets?.length) return true;
    return !i.sets.every((s) => CONTEXT_SETS.includes(s) && !sets.includes(s));
  });
}

/**
 * v0.25.0 (Noah 8a): items whose amount for the whole trip is more than you can carry (capped by
 * maxQty) or that you carry for more than one day: "Buy {name} on the way?". → [item]
 */
export function carryHint(trip, items, entries = trip?.entries ?? []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const days = Math.max(1, Number(trip?.days) || 1);
  const hours = rideHours(trip);
  return entries
    .map((e) => byId.get(e.itemId))
    .filter((i) => i?.perHours && (days > 1 || (hours && i.maxQty && Math.ceil(hours / i.perHours) > i.maxQty)));
}

/**
 * "Your packing list" in the New trip dialog: what the start brings and what the context adds.
 * start: the entries of the start (standard set, template or last trip).
 * → { start, total, amounts: [{ item, qty }], weather: [item], sets: [{ key, n }], left: ['overnight', 'event'] }
 */
export function contextSummary(start, trip, items) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const startIds = new Set(start.map((e) => e.itemId));
  const full = contextEntries({ ...trip, entries: start }, items);
  const amounts = [];
  const weather = [];
  for (const r of contextRows(trip, items)) {
    const item = byId.get(r.id);
    if (!item) continue;
    if (item.perHours) {
      if (r.qty > 1 || !startIds.has(r.id)) amounts.push({ item, qty: r.qty });
    } else if (!item.ride && !startIds.has(r.id)) weather.push(item);
  }
  const sets = contextSets(trip).map((key) => ({ key, n: full.filter((e) => e.src === 'context' && byId.get(e.itemId)?.sets?.includes(key)).length }));
  const left = [...(trip.overnight === 'none' ? ['overnight'] : []), ...(trip.event ? [] : ['event'])];
  return { start: start.length, total: full.length, amounts, weather, sets, left };
}
