/**
 * «Tasche lernen» (Noah 23.11.2026 «3a», Thread «Packen nach Taschen am Bike ausbauen»): every item has a usual bag
 * (item.defaultBag), where a new list puts it. When you put an item somewhere else again and again, the app
 * suggests making that place the usual bag: «Künftig in die Oberrohrtasche?». It only suggests; a tap changes the
 * field, with Undo, and «Nicht mehr fragen» keeps the item's id in the settings record LEARN_OFF.
 *
 * Learned from the finished trips (debrief done), nothing new is recorded: an entry counts as «moved by you» when its
 * place is not the one the usual bag would have given on that trip (trips.js slotFor, which also covers a trip that has no
 * bag at the usual place). A place needs LEARN_MIN such trips and LEARN_SHARE of the trips with the item on a bag.
 * Pure, tested in tests/taschelernen.test.js. Nothing here writes.
 */
import { debriefedTrips } from '../insights.js';
import { slotFor } from '../trips.js';
import { SLOT } from '../bikes.js';

/** Settings key: the item ids that «Tasche lernen» does not ask about any more. */
export const LEARN_OFF = 'bagLearnOff';
/** A place counts after this many finished trips on which you put the item there although it was elsewhere. */
export const LEARN_MIN = 3;
/** Of the finished trips with the item in a bag, this share had it in that place. */
export const LEARN_SHARE = 0.8;
/** At most this many rows. */
export const MAX_ROWS = 5;

const isInventory = (item) => item?.ownership === 'owned' || item?.ownership === 'unclear';
const isBagPlace = (key) => !!SLOT[key] && !SLOT[key].worn;

/**
 * The suggestions for the items on the open trip: [{ id, item, slot, n, of }], the clearest first. n = finished trips with the
 * item in `slot` although its usual bag was another; of = finished trips with the item in a bag.
 */
export function learnedBags({ trip, items = [], trips = [], debriefs = [], off = [] }) {
  if (!trip || !Array.isArray(trip.entries) || !trip.entries.length) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const skip = new Set(off ?? []);
  const on = new Set(trip.entries.map((e) => e?.itemId).filter(Boolean));
  const hist = debriefedTrips(trips, debriefs).map(({ t }) => t).filter((t) => t.id !== trip.id);
  const seen = new Map(); // itemId → { of, moved: Map(slot → n) }
  for (const t of hist) {
    for (const e of t.entries ?? []) {
      const item = byId.get(e?.itemId);
      if (!item || !on.has(item.id) || skip.has(item.id) || !isBagPlace(e.slot)) continue;
      const rec = seen.get(item.id) ?? { of: 0, moved: new Map() };
      rec.of++;
      if (e.slot !== slotFor(item.defaultBag, t.setup)) rec.moved.set(e.slot, (rec.moved.get(e.slot) ?? 0) + 1);
      seen.set(item.id, rec);
    }
  }
  const rows = [];
  for (const [id, rec] of seen) {
    const item = byId.get(id);
    if (!isInventory(item)) continue;
    const [slot, n] = [...rec.moved].sort((a, b) => b[1] - a[1])[0] ?? [];
    if (!slot || n < LEARN_MIN || n / rec.of < LEARN_SHARE || slot === item.defaultBag) continue;
    rows.push({ id, item, slot, n, of: rec.of });
  }
  return rows.sort((a, b) => b.n - a.n || String(a.item.name).localeCompare(String(b.item.name))).slice(0, MAX_ROWS);
}

/** The settings value after «Nicht mehr fragen» for one item (never twice). */
export const withOff = (off, id) => [...new Set([...(off ?? []), id])];
