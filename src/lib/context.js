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
import { inStandard, isWorn, blockKeys } from './blocks2026.js';

export const OVERNIGHT = ['none', 'lodging', 'outdoor'];

/**
 * v0.55.0 «Bausteine neu» (Noah 8a): the night is one choice of four, changeable. Stored as before
 * (trip.overnight) plus trip.tent for "Bivouac + tent", so every older reader of overnight still works:
 *   none → no night; hotel → overnight 'lodging'; bivy → 'outdoor'; tent → 'outdoor' + tent.
 */
export const NIGHT_CHOICES = [
  { key: 'none', overnight: 'none', tent: false, name: 'None|overnight' },
  { key: 'bivy', overnight: 'outdoor', tent: false, name: 'Bivouac' },
  { key: 'tent', overnight: 'outdoor', tent: true, name: 'Bivouac + tent' },
  { key: 'hotel', overnight: 'lodging', tent: false, name: 'Hotel/hut' },
];
/** The choice of a trip or template (null: not set, an older trip). */
/**
 * Is the tent part of this night? An outdoor night of an older trip or template (no tent field) was
 * "Outdoor (tent, bivvy)" and brought the tent: only tent === false is the bivouac alone.
 */
export const hasTent = (x) => x?.overnight === 'outdoor' && x?.tent !== false;
export const nightChoice = (x) => (x?.overnight === 'lodging' ? 'hotel' : x?.overnight === 'outdoor' ? (hasTent(x) ? 'tent' : 'bivy') : x?.overnight === 'none' ? 'none' : null);
/** The fields a choice writes: { overnight, tent }. */
export const nightFields = (key) => {
  const c = NIGHT_CHOICES.find((x) => x.key === key) ?? NIGHT_CHOICES[0];
  return { overnight: c.overnight, tent: c.tent };
};
/** The English key of the night in words ("Bivouac + tent"), for t(); '' when not set. */
export const nightName = (x) => NIGHT_CHOICES.find((c) => c.key === nightChoice(x))?.name ?? '';

/** The blocks that come with the night (they "come by themselves"). */
export const NIGHT_BLOCKS = ['bivy', 'tent', 'hotel', 'cook', 'firstaid'];
/**
 * v0.55.0 (Noah 7a, 9a): the blocks that come on the ride: repair and charge on every ride, lights
 * when the ride goes into the dark (trip.dark), race only on an event. Each one stays a visible
 * suggestion: trip.sets[key] === false takes it off for this trip.
 */
export const RIDE_BLOCKS = ['repair', 'charge', 'lights', 'race'];
/** The item sets a context can bring. */
export const CONTEXT_SETS = [...NIGHT_BLOCKS, ...RIDE_BLOCKS];
/** v0.55.0: the built-in blocks to add (filled by category at the update; loose groupings). */
export const LOOSE = ['food', 'hygiene', 'comfort'];
/** v0.55.0 (Noah 9a): Comfort is never packed by itself: its items are only offered, unticked. */
export const OFFER_ONLY = ['comfort'];
/**
 * v0.28.0 (AP25, Noah: "Erste Hilfe komplett raus ausser bei 1 Nacht oder mehr"): the first aid
 * set comes with every night (lodging and outdoor). A new trip without a night carries none of
 * its items, also when one is standard, "On every trip" or in the template.
 */
export const NIGHT_ONLY = ['firstaid'];
const nightOnly = (item) => !!item?.sets?.some((s) => NIGHT_ONLY.includes(s));

/** Without a night (overnight 'none'): the entries without the first aid items. Other trips keep all. */
export function dropNightOnly(entries, trip, items) {
  if (trip?.overnight !== 'none') return entries;
  const byId = new Map(items.map((i) => [i.id, i]));
  return entries.filter((e) => !nightOnly(byId.get(e.itemId)));
}
/** Night switches that follow the overnight stay (trip.sets, read by older versions). */
const SWITCHED = ['bivy', 'tent', 'cook'];

/** Does the trip say where it sleeps? Older trips do not: their entries are never changed here. */
export const hasContext = (trip) => OVERNIGHT.includes(trip?.overnight);

/** v0.25.0 (Noah 4), v0.55.0: the blocks the night brings (one choice: hotel, bivy or bivy + tent). */
export function nightSets(trip) {
  if (trip?.overnight === 'lodging') return ['hotel', 'firstaid'];
  if (trip?.overnight === 'outdoor') return ['bivy', ...(hasTent(trip) ? ['tent'] : []), ...(trip.cook ? ['cook'] : []), 'firstaid'];
  return [];
}

/** v0.55.0: the blocks the ride suggests (repair, charge; lights in the dark; race on an event), minus the ones taken off. */
export function rideSets(trip) {
  const on = ['repair', 'charge', ...(trip?.dark ? ['lights'] : []), ...(trip?.event === true ? ['race'] : [])];
  return on.filter((k) => trip?.sets?.[k] !== false);
}

/** The item sets the context brings: the night's, then the ride's. */
export function contextSets(trip) {
  return [...nightSets(trip), ...rideSets(trip)];
}

/**
 * v0.55.0: the blocks on a trip right now: what its context brings (only a trip with a known night)
 * plus the ones switched on by hand (trip.sets[key] === true). For the switches in Pack.
 */
export function activeBlocks(trip) {
  const ctx = hasContext(trip) ? contextSets(trip) : [];
  const own = Object.entries(trip?.sets ?? {}).filter(([k, v]) => v === true && !ctx.includes(k)).map(([k]) => k);
  return [...ctx, ...own];
}

/** The overnight switches in Pack that match the context (bivy, tent, cook on for outdoor). */
export function contextSwitches(trip) {
  const on = new Set(nightSets(trip));
  return { ...(trip?.sets ?? {}), ...Object.fromEntries(SWITCHED.map((k) => [k, on.has(k)])) };
}

/**
 * The layer rows the context applies: weather and amounts, nothing optional. Default choices,
 * except an alternative Noah picked (v0.27.0, Noah 1a: "Swap for light gilet" stays when the
 * weather changes later); a skipped row ("none") is still applied, as before.
 */
export const contextRows = (trip, items) => layerSuggest({ ...trip, layerPick: Object.fromEntries(Object.entries(trip?.layerPick ?? {}).filter(([, v]) => v && v !== 'none')) }, items).filter((r) => !r.optional);

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
    out.push({ itemId: i.id, slot: isWorn(i) ? 'body' : slot(i.id), qty: 1, packed: false, src: 'context' });
    have.add(i.id);
  }
  return applyLayers(out, contextRows(trip, items), slot).map((e) => (have.has(e.itemId) ? e : { ...e, src: 'context' }));
}

const sameContext = (a, b) =>
  a.overnight === b.overnight && !!a.cook === !!b.cook && hasTent(a) === hasTent(b) && !!a.dark === !!b.dark && !!a.event === !!b.event &&
  RIDE_BLOCKS.every((k) => (a.sets?.[k] === false) === (b.sets?.[k] === false)) && (Number(a.hours) || 0) === (Number(b.hours) || 0) &&
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
  // v0.55.0: a later change brings only the ride blocks it switched on (Light into the dark, Race on
  // an event, a block switched back on); one that was already on (an older trip made without it) does
  // not come along with a change of the weather or the hours.
  const stay = before && hasContext(before) ? rideSets(before).filter((k) => rideSets(trip).includes(k)) : [];
  const fresh2 = contextSets(trip).filter((k) => !stay.includes(k));
  const quiet = (id) => {
    const keys = blockKeys(byId.get(id));
    return stay.length > 0 && keys.some((k) => stay.includes(k)) && !keys.some((k) => fresh2.includes(k));
  };
  for (const [id, e] of target) if (!seen.has(id) && !quiet(id)) entries.push({ ...e, src: 'context' });
  const changes = { entries };
  if (!before || before.overnight !== trip.overnight || !!before.cook !== !!trip.cook || hasTent(before) !== hasTent(trip)) changes.sets = contextSwitches(trip);
  return changes;
}

/**
 * A new trip with its context (Pack / TripDialog "Create trip"). fromCopy: the start is a copy of
 * the last trip; items of that trip that only belong to overnight sets this trip does not bring
 * stay at home (a day ride after a bivvy weekend starts without the sleeping bag). Worn, standard
 * and "On every trip" items always stay, except the first aid set on a trip without a night
 * (v0.28.0, dropNightOnly).
 */
export function contextTrip(trip, items, { fromCopy = false } = {}) {
  if (!hasContext(trip)) return trip;
  const entries = dropNightOnly(fromCopy ? startEntries(trip, items) : trip.entries ?? [], trip, items);
  const out = { ...trip, ...applyContext({ ...trip, entries }, items, null, { fresh: true }) };
  return { ...out, entries: dropNightOnly(out.entries ?? [], trip, items) };
}

/** The entries a copy of the last trip starts with: without overnight-set items this trip does not bring. */
export function startEntries(trip, items) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const sets = contextSets(trip);
  return (trip.entries ?? []).filter((e) => {
    const i = byId.get(e.itemId);
    // v0.55.0: Food, Hygiene and Comfort (to add, filled by category) do not keep a night item on a copy.
    const keys = blockKeys(i).filter((s) => !LOOSE.includes(s));
    if (e.src === 'context' || !i || isWorn(i) || inStandard(i) || !keys.length) return true;
    return !keys.every((s) => CONTEXT_SETS.includes(s) && !sets.includes(s));
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
export function contextSummary(start0, trip, items) {
  const start = dropNightOnly(start0, trip, items); // v0.28.0: no first aid without a night
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
