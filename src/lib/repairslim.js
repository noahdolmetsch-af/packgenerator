/**
 * v0.124.0 «Neue Tour Teil 2», B5 «Reparatur unterwegs» (mockup B5, Noah 12.10.2026 «b2 b4 b5 ok», answer 6a:
 * at most 8 of the tools): the block «Repair» often holds the whole workshop (36 tools, 7.9 kg). For the
 * ride the app suggests at most SLIM_MAX light parts (tube, pump, multitool …); one tap keeps them and the
 * rest leaves the block (the items stay in Gear, nothing is deleted; Gear › Building blocks › Repair puts
 * them back). Default (Noah 22:00 UTC, «a ★ Ja, schlank dabei»): a slim Repair comes with every new trip as
 * a suggestion that can be taken off; a Repair that is not slim yet stays off until it is made slim.
 * Pure functions only, tested in tests/repairslim.test.js.
 */
import { isInventory, itemWeight } from './gear.js';

export const REPAIR = 'repair';
/** Answer 6a: at most this many parts come on the ride. */
export const SLIM_MAX = 8;

const words = (i) => `${i?.name ?? ''} ${i?.nameDe ?? ''} ${i?.model ?? ''}`.toLowerCase();
/** What a ride needs, most important first (English and German words). */
const ROAD = [
  /schlauch|\btubes?\b|inner ?tube/,
  /(?<!stand)(?<!floor )pumpe?\b|mini ?pump/,
  /multi ?-?tool/,
  /reifenheber|tyre ?lever|tire ?lever/,
  /kettenschloss|quick ?link|missing ?link|chain ?link/,
  /flick|patch/,
  /tubeless|plug|w(ü|ue)rste?|salami|bacon/,
  /kabelbinder|cable ?ties?|zip ?ties?/,
  /tape|klebeband|gaffa/,
  /ventil|valve/,
  /schaltauge|derailleur ?hanger/,
  /speiche|spoke/,
];
/** Workshop tools that stay at home whatever they weigh. */
const WORKSHOP = /stand ?pump|floor ?pump|standpumpe|montagest(ä|ae)nder|repair ?stand|drehmoment|torque|kassetten|cassette|nieter|chain ?tool|zentrier|truing|verschleiss|wear ?gauge|gross\b|\blarge\b/;
/** Heavier than this is no part for the ride unless its name says it is (a pump, a tube). */
const HEAVY_G = 400;

/** The inventory items of the block «Repair». */
export const repairItems = (items) => (items ?? []).filter((i) => isInventory(i) && i.sets?.includes(REPAIR));
/** Does the block hold more than SLIM_MAX parts? Then the window «Reparatur unterwegs» has something to do. */
export const needsSlim = (items) => repairItems(items).length > SLIM_MAX;

/** How well an item fits the ride: a low number fits best; Infinity stays in the workshop. */
export function roadRank(item) {
  const w = words(item);
  if (WORKSHOP.test(w)) return Infinity;
  const at = ROAD.findIndex((re) => re.test(w));
  if (at >= 0) return at;
  const g = itemWeight(item);
  return g != null && g > HEAVY_G ? Infinity : ROAD.length;
}

/**
 * The window's rows: every part of the block, the ones for the ride first (their order of importance,
 * then the lighter one), the workshop after them (the lighter first). picked: the ids the app suggests
 * (at most SLIM_MAX, never a workshop tool).
 */
export function slimSuggest(items) {
  const all = repairItems(items);
  const w = (i) => itemWeight(i) ?? Infinity;
  const sorted = [...all].sort((a, b) => roadRank(a) - roadRank(b) || w(a) - w(b) || String(a.name).localeCompare(String(b.name)));
  const picked = sorted.filter((i) => roadRank(i) !== Infinity).slice(0, SLIM_MAX).map((i) => i.id);
  return { rows: sorted, picked };
}

/**
 * «8 Teile übernehmen»: keep = the ids to keep (at most SLIM_MAX, only parts of the block). Returns
 * { items: only the changed items (Repair taken off, updatedAt), workshop: their ids }. The items stay
 * in Gear. Nothing changes when keep holds more than SLIM_MAX.
 */
export function applySlim(items, keep, now = new Date().toISOString()) {
  const ids = new Set(keep ?? []);
  if (ids.size > SLIM_MAX) return { items: [], workshop: [] };
  const out = repairItems(items).filter((i) => !ids.has(i.id)).map((i) => ({ ...i, sets: i.sets.filter((s) => s !== REPAIR), updatedAt: now }));
  return { items: out, workshop: out.map((i) => i.id) };
}

/** Undo: the workshop parts back into «Repair» (only items that are not in it again already). */
export function undoSlim(items, workshop, now = new Date().toISOString()) {
  const ids = new Set(workshop ?? []);
  return (items ?? []).filter((i) => ids.has(i.id) && !i.sets?.includes(REPAIR)).map((i) => ({ ...i, sets: [...(i.sets ?? []), REPAIR], updatedAt: now }));
}

/**
 * The ride blocks a new trip leaves off (TripDialog). v0.114.0: Repair and Charging no longer by
 * themselves (Noah «92 Teile … nur 10-20»). v0.124.0 (B5 a ★): a slim Repair (at most SLIM_MAX) comes again.
 */
export const newTripOff = (items) => (needsSlim(items) ? [REPAIR, 'charge'] : ['charge']);
