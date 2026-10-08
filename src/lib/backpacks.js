/**
 * v0.37.0 "Backpacks" (Noah, 8.10.2026, all answers a): backpacks, hip bags and vests are real bags.
 *
 * Data model (no new table, no schema change):
 *   - A worn bag is a record of the bag list (db.containers) whose place is a worn place: slot 'carry'
 *     (Back) or 'hip' (Hip). It has litres (volumeL) and a weight: from its gear item (itemId), or its
 *     own weightG when it has no gear item. `domains` (optional, the same keys as items) says for which
 *     areas it is made, e.g. ['hiking'].
 *   - A trip without a bike keeps its bags in trip.packs ([{ key, name, volumeL }]). A pack can now point
 *     to a real bag: { ..., bagId }. Name and litres then come from that bag; without bagId (all older
 *     trips) the generic pack stays exactly as it was.
 *   - Clothing that is also a bag (a visibility vest with pockets): the bag record has itemId = the
 *     clothing item and alsoItem: true. The item stays in Gear as clothing and can still be packed;
 *     only the bag record makes it a choice on Back. When the vest is on the list as an item too, its
 *     weight counts once (trips.js tripStats).
 * Pure functions, tested in tests/backpacks.test.js.
 */
import { isWornBag, isWornSlot } from './bikes.js';
import { DOMAIN } from './domains.js';

/**
 * What each area looks for in its bags, by litres (min–max), in the order of the area's packs
 * (domains.js DOMAINS[].packs). Noah 3a: hiking a 12 or 15 L running pack; weekend and world trip
 * a 20 L duffle and a 20 L daypack. Areas not listed look for the litres of their generic pack ±5 L.
 */
export const PACK_WANTS = {
  hiking: [{ min: 12, max: 15 }],
  weekend: [{ min: 18, max: 22 }, { min: 18, max: 22 }],
  travel: [{ min: 18, max: 22 }, { min: 18, max: 22 }],
};
/** Noah 3a: an ultra race on the bike: the running vest (about 15 L) on Back. */
export const ULTRA_WANT = { min: 12, max: 15 };

/** The litres a pack of an area looks for, or null when nothing is known. */
export function wantFor(domain, index, pack = null) {
  const own = PACK_WANTS[domain]?.[index];
  if (own) return own;
  const l = Number(pack?.volumeL ?? DOMAIN[domain]?.packs?.[index]?.volumeL);
  return l > 0 ? { min: Math.max(1, l - 5), max: l + 5 } : null;
}

/** The areas of a bag: its own, else those of its gear item (a vest), else none. */
export const bagAreas = (bag, itemsById = {}) => (bag?.domains?.length ? bag.domains : (bag?.itemId && itemsById[bag.itemId]?.domains) || []);

const inRange = (l, want) => want && l > 0 && l >= want.min && l <= want.max;

/**
 * How well a bag fits a want: 3 = litres and area, 2 = litres only, 1 = area only, 0 = no match.
 * Matched by litres and areas, never by names (Noah's names come from his own data).
 */
export function fitScore(bag, want, domain, itemsById = {}) {
  const l = Number(bag?.volumeL);
  const litres = inRange(l, want);
  const area = !!domain && bagAreas(bag, itemsById).includes(domain);
  return litres && area ? 3 : litres ? 2 : area ? 1 : 0;
}

/** The worn bags that fit a want, best first: [{ bag, score }]. Bags in `skip` are left out. */
export function rankBags(containers, want, domain, { itemsById = {}, skip = new Set() } = {}) {
  const mid = want ? (want.min + want.max) / 2 : 0;
  return containers
    .filter((c) => isWornBag(c) && !skip.has(c.id))
    .map((bag) => ({ bag, score: fitScore(bag, want, domain, itemsById) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || Math.abs((a.bag.volumeL ?? 999) - mid) - Math.abs((b.bag.volumeL ?? 999) - mid) || String(a.bag.name).localeCompare(String(b.bag.name)));
}

/**
 * The suggested real bag for each pack of a trip without a bike: [{ key, bagId|null }], one per pack.
 * A pack that already has a real bag keeps it; two packs never get the same bag.
 */
export function suggestPacks(trip, containers, itemsById = {}) {
  const packs = Array.isArray(trip?.packs) ? trip.packs : [];
  const used = new Set(packs.map((p) => p.bagId).filter(Boolean));
  return packs.map((p, n) => {
    if (p.bagId) return { key: p.key, bagId: p.bagId };
    const best = rankBags(containers, wantFor(trip.domain, n, p), trip.domain, { itemsById, skip: used })[0];
    if (best) used.add(best.bag.id);
    return { key: p.key, bagId: best?.bag.id ?? null };
  });
}

/** Does this trip still use a generic bag (no real one chosen)? For the quiet "Choose a real backpack". */
export const genericPacks = (trip) => (Array.isArray(trip?.packs) ? trip.packs.filter((p) => !p.bagId) : []);

/** The change for a trip without a bike: pack `key` uses the real bag `bagId` (null = the generic one again). */
export function choosePack(trip, key, bagId) {
  return { packs: trip.packs.map((p) => (p.key === key ? (bagId ? { ...p, bagId } : (({ bagId: _, ...rest }) => rest)(p)) : p)) };
}

/** Is a bike trip an ultra race? An event of more than one day, or an event with long hours. */
export const isUltra = (trip) => !!trip?.event && ((Number(trip.days) || 1) > 1 || (Number(trip.hours) || 0) >= 10);

/** Noah 3a: the bag suggested for Back on an ultra race with nothing on Back yet, or null. */
export function suggestBack(trip, containers, itemsById = {}) {
  if (!isUltra(trip) || trip.setup?.carry) return null;
  return rankBags(containers, ULTRA_WANT, 'bikepacking', { itemsById })[0]?.bag ?? null;
}

/**
 * Noah 5a: a quiet litre warning for one bag (a zone of tripStats). Only with facts: the bag has
 * litres, and the items whose litres are known already need more than that. Items without litres
 * count as unknown, never as zero or as full, so unknown data never warns.
 * → { need, cap, known, count } or null.
 */
export function litreWarning(zone, itemsById) {
  const cap = Number(zone?.bag?.volumeL);
  if (!zone?.entries?.length || !(cap > 0)) return null;
  let need = 0;
  let known = 0;
  for (const e of zone.entries) {
    const v = Number(itemsById[e.itemId]?.volumeL);
    if (!(v > 0)) continue;
    need += v * (e.qty || 1);
    known++;
  }
  need = Math.round(need * 10) / 10;
  return known && need > cap ? { need, cap, known, count: zone.entries.length } : null;
}

/** The bag record that makes clothing a worn bag (Noah 4a): one per item, on Back. */
export const alsoBagId = (itemId) => `bag-also-${itemId}`;
export const alsoBagOf = (itemId, containers) => containers.find((c) => c.alsoItem && c.itemId === itemId) ?? null;
export function alsoBagRecord(item, volumeL = null, old = null) {
  return { ...(old ?? {}), id: old?.id ?? alsoBagId(item.id), name: old?.name ?? item.name, slot: old && isWornSlot(old.slot) ? old.slot : 'carry', volumeL: volumeL ?? old?.volumeL ?? null, itemId: item.id, pieces: 1, alsoItem: true, note: old?.note ?? '' };
}

/**
 * Switch "also a worn bag" for an item, in the database. On: the bag record is made (or updated).
 * Off: the record goes, and every bike and trip that had it on a place gets that place empty again;
 * the item itself and every trip entry of it stay (nothing is lost).
 */
export async function setAlsoBag(db, item, on, volumeL = null) {
  return db.transaction('rw', db.containers, db.bikes, db.trips, async () => {
    const old = alsoBagOf(item.id, await db.containers.toArray());
    if (on) return db.containers.put(alsoBagRecord(item, volumeL, old));
    if (!old) return;
    await db.containers.delete(old.id);
    const clear = (setup) => Object.fromEntries(Object.entries(setup ?? {}).map(([k, v]) => [k, v === old.id ? null : v]));
    for (const b of await db.bikes.toArray()) if (Object.values(b.setup ?? {}).includes(old.id)) await db.bikes.update(b.id, { setup: clear(b.setup) });
    for (const t of await db.trips.toArray()) {
      const inSetup = Object.values(t.setup ?? {}).includes(old.id);
      const inPacks = (t.packs ?? []).some((p) => p.bagId === old.id);
      if (inSetup || inPacks) await db.trips.update(t.id, { ...(inSetup ? { setup: clear(t.setup) } : {}), ...(inPacks ? { packs: t.packs.map((p) => (p.bagId === old.id ? (({ bagId: _, ...rest }) => rest)(p) : p)) } : {}) });
    }
  });
}
