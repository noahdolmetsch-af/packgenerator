/**
 * «Dazu nötig» (Noah 23.11.2026 «G1 G2 G3», Thread «Packen leichter und besser machen»): the small thing that
 * belongs to a bigger one is the one that gets forgotten (the cable of the bike computer, the spare battery of
 * the lamp). Two sources, both only a suggestion on the list of a trip:
 *
 *   linked   the item names its companions: item.withIds = [itemId, …] (field in the item window, nothing else
 *            changes in the data; an item without the field has no companions)
 *   learned  on at least LEARN_MIN finished trips (debrief done) the item came along and the other one was
 *            always with it and not without it, and both are things of a minority of trips (not the jacket)
 *
 * A companion that is not on the list yet shows as «Dazu fehlt». It is left out when the trip's list had it taken
 * off by hand or by the weather (trip.leftOut) or when you said «Nicht diesmal» (trip.dazuSkip). Pure, tested in
 * tests/dazu.test.js. Nothing here writes.
 */
import { debriefedTrips } from '../insights.js';
import { ids, linkedOf } from './dazufeld.js';

/** A learned pair needs this many finished trips with the first item. */
export const LEARN_MIN = 3;
/** Of the trips with the first item, this share had the second one too (all but a rare miss). */
export const LEARN_SHARE = 0.9;
/** A thing on more than this share of the finished trips is «general» and is never learned as a companion. */
export const GENERAL_SHARE = 0.5;
/** Of the trips with the second item, this share had the first one too (the pair came as a pair). */
export const LEARN_BACK = 0.8;
/** At most this many missing companions are shown, of which at most MAX_LEARNED are learned ones (your own links always count). */
export const MAX_ROWS = 8;
export const MAX_LEARNED = 3;

// what is in your inventory (gear.js isInventory; not imported here: gear.js imports dazufeld.js)
const isInventory = (item) => item?.ownership === 'owned' || item?.ownership === 'unclear';
export { linkedOf, withAdded, withRemoved, withRecord } from './dazufeld.js';

const idsOfTrip = (trip) => new Set((trip?.entries ?? []).map((e) => e?.itemId).filter(Boolean));

/**
 * The pairs learned from the finished trips: { [a]: { [b]: { n, of } } } for the items `only` (a Set of ids, the
 * items of the open trip) as `a`. n = trips with both, of = trips with `a`.
 */
export function learnedPairs(trips, debriefs, { except = null, only = null } = {}) {
  const hist = debriefedTrips(trips, debriefs)
    .map(({ t }) => t)
    .filter((t) => t.id !== except);
  const sets = hist.map(idsOfTrip);
  const count = new Map();
  const pair = new Map(); // a → Map(b → n)
  for (const s of sets) {
    for (const a of s) {
      count.set(a, (count.get(a) ?? 0) + 1);
      if (only && !only.has(a)) continue;
      const m = pair.get(a) ?? new Map();
      for (const b of s) if (b !== a) m.set(b, (m.get(b) ?? 0) + 1);
      pair.set(a, m);
    }
  }
  const total = sets.length;
  const out = {};
  // A thing on most trips (jacket, bike computer, a pair that only meets in the cold season) is no companion of
  // anything: «with a» would only mean «in winter». Only things that come on a minority of trips can be learned.
  const rare = (id) => (count.get(id) ?? 0) / total <= GENERAL_SHARE;
  for (const [a, m] of pair) {
    const of = count.get(a) ?? 0;
    if (of < LEARN_MIN || !rare(a)) continue;
    for (const [b, n] of m) {
      if (n < LEARN_MIN || n / of < LEARN_SHARE || !rare(b)) continue;
      if (n / (count.get(b) ?? n) < LEARN_BACK) continue; // b also came without a: not a companion of a
      (out[a] ??= {})[b] = { n, of };
    }
  }
  return out;
}

/**
 * What is missing from the list of a trip because it belongs to something on it.
 * → [{ id, item, forIds: [ids on the list it belongs to], source: 'linked' | 'learned', n, of }] (a linked
 * companion stays «linked» when both sources name it). Empty without a trip or list.
 */
export function dazuRows({ trip, items = [], trips = [], debriefs = [] }) {
  if (!trip || !Array.isArray(trip.entries) || !trip.entries.length) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const on = idsOfTrip(trip);
  const skip = new Set(ids(trip.dazuSkip));
  const left = new Set((Array.isArray(trip.leftOut) ? trip.leftOut : []).map((x) => x?.itemId).filter(Boolean));
  const ok = (b) => byId.has(b) && isInventory(byId.get(b)) && !on.has(b) && !skip.has(b) && !left.has(b);
  const rows = new Map();
  const put = (b, a, source, extra = {}) => {
    const r = rows.get(b) ?? { id: b, item: byId.get(b), forIds: [], source, n: 0, of: 0 };
    if (!r.forIds.includes(a)) r.forIds.push(a);
    if (source === 'linked') r.source = 'linked';
    if (extra.n > r.n) Object.assign(r, { n: extra.n, of: extra.of });
    rows.set(b, r);
  };
  for (const a of on) {
    const item = byId.get(a);
    if (!item || !isInventory(item)) continue;
    for (const b of linkedOf(item)) if (ok(b)) put(b, a, 'linked');
  }
  const learned = learnedPairs(trips, debriefs, { except: trip.id, only: on });
  for (const [a, m] of Object.entries(learned)) {
    if (!isInventory(byId.get(a))) continue;
    for (const [b, x] of Object.entries(m)) if (ok(b)) put(b, a, 'learned', x);
  }
  const all = [...rows.values()];
  const learnedKept = new Set(all.filter((r) => r.source === 'learned').sort((a, b) => b.n - a.n).slice(0, MAX_LEARNED));
  return all.filter((r) => r.source === 'linked' || learnedKept.has(r)).slice(0, MAX_ROWS);
}

/** The trip's list of «Nicht diesmal» with one more item (never twice). */
export const skipPatch = (trip, itemId) => ({ ...trip, dazuSkip: [...new Set([...ids(trip?.dazuSkip), itemId])] });
