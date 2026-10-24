/**
 * Paket B «Folgen vorher sehen» (Noah 24.10.2026, 996 Ideen «1b»): before a building block goes onto a trip,
 * the app shows what it does — how many things, how many grams, into which bags, which bag is missing on
 * this bike, which already packed bag needs a look again — and what earlier trips say about the block
 * (how often something of it was missing, how often it stayed unused). Nothing changes until «Add».
 * Pure, tested in tests/folgen.test.js. Uses addSetEntries/entriesWeight of sets.js unchanged.
 */
import { addSetEntries, entriesWeight } from '../sets.js';

/**
 * What adding `block` to `trip` would do.
 * → { added: [{ itemId, slot, qty, item }], g, unknown, bags: [{ slot, n, g }], missingBag: [itemId], recheck: [slot] }
 */
export function blockEffect(trip, items, block, { skip = new Set(), slotOf = null } = {}) {
  const before = trip?.entries ?? [];
  const r = addSetEntries({ ...trip, entries: before }, items, block, { skip, slotOf });
  const byId = new Map(items.map((i) => [i.id, i]));
  const added = r.entries.slice(before.length).map((e) => ({ ...e, item: byId.get(e.itemId) ?? null }));
  const w = entriesWeight(added, items);
  const bags = new Map();
  for (const e of added) {
    const b = bags.get(e.slot) ?? { slot: e.slot, n: 0, g: 0 };
    b.n += 1;
    b.g += (e.item?.weightG ?? 0) * Math.max(1, Number(e.qty) || 1);
    bags.set(e.slot, b);
  }
  const setup = trip?.setup ?? {};
  const missingBag = added.filter((e) => e.item?.defaultBag && !['body', 'mounted'].includes(e.item.defaultBag) && !setup[e.item.defaultBag] && e.slot !== e.item.defaultBag).map((e) => e.itemId);
  // a bag whose things are all ticked «packed» gets something new: it needs a look again
  const recheck = [...bags.keys()].filter((slot) => {
    const there = before.filter((e) => e.slot === slot);
    return there.length > 0 && there.every((e) => e.packed);
  });
  return { added, g: w.g, unknown: w.missing, bags: [...bags.values()], missingBag, recheck };
}

/**
 * What earlier, finished trips say about a block: on how many it was along, how often a thing of it was
 * missing (debrief «fehlte») and how often things of it stayed unused. Only trips with a finished debrief.
 * → { trips, along, missed, unused, missedNames: [name] }
 */
export function blockHistory(block, items, trips = [], debriefs = [], exceptTripId = null) {
  const ids = new Set(items.filter((i) => i.sets?.includes(block.key)).map((i) => i.id));
  const names = new Set(items.filter((i) => ids.has(i.id)).map((i) => String(i.name ?? '').toLowerCase()));
  const byTrip = new Map(debriefs.filter((d) => d?.status === 'done').map((d) => [d.tripId, d]));
  const out = { trips: 0, along: 0, missed: 0, unused: 0, missedNames: [] };
  if (!ids.size) return out;
  for (const trip of trips) {
    if (!trip || trip.id === exceptTripId) continue;
    const d = byTrip.get(trip.id);
    if (!d) continue;
    out.trips += 1;
    if ((trip.entries ?? []).some((e) => ids.has(e.itemId))) out.along += 1;
    const miss = (d.missing ?? []).filter((m) => ids.has(m.itemId) || names.has(String(m.name ?? '').toLowerCase()));
    if (miss.length) {
      out.missed += 1;
      for (const m of miss) if (m.name && !out.missedNames.includes(m.name)) out.missedNames.push(m.name);
    }
    if (Object.entries(d.items ?? {}).some(([id, s]) => s === 'unused' && ids.has(id))) out.unused += 1;
  }
  return out;
}

/** One sentence key for the history (English key for t(), with vars). */
export function historyLine(h) {
  if (!h.trips) return { key: 'No finished debrief yet: earlier trips cannot say anything.', vars: {} };
  if (h.missed && h.unused) return { key: 'On {trips} earlier trips: {missed}× something of it was missing, {unused}× something stayed unused.', vars: h };
  if (h.missed) return { key: 'On {trips} earlier trips: {missed}× something of it was missing.', vars: h };
  if (h.unused) return { key: 'On {trips} earlier trips: {unused}× something of it stayed unused.', vars: h };
  return { key: 'On {trips} earlier trips: nothing of it was missing or unused.', vars: h };
}
