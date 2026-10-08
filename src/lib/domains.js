/**
 * Areas (v0.21.0, package 5): besides bikepacking the app packs for ski touring, a weekend away
 * and a world trip. One inventory: an item belongs to one or more areas (item.domains); an item
 * without areas counts as bikepacking, like everything imported so far.
 *
 * A trip of an area without a bike keeps its bags on the trip itself:
 *   trip.packs = [{ key, name, volumeL }]   e.g. a 30 L backpack; "On me" (body) is always there
 * and trip.bikeId is null. Entries use the pack key (or "body") as their slot. No new table.
 * Pure functions, easy to test.
 */
import { isInventory, CATEGORIES } from './gear.js';
import { inStandard, isWorn } from './blocks2026.js';

export const BIKEPACKING = 'bikepacking';

/** The areas, in the order they are offered. packs: the bags a new trip of this area gets. */
export const DOMAINS = [
  { key: BIKEPACKING, name: 'Bikepacking', bike: true },
  { key: 'ski', name: 'Ski touring', packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }] },
  {
    key: 'weekend',
    name: 'Weekend',
    packs: [
      { key: 'bag', name: 'Travel bag', volumeL: null },
      { key: 'day', name: 'Daypack', volumeL: null },
    ],
  },
  {
    key: 'travel',
    name: 'World trip',
    packs: [
      { key: 'pack', name: 'Backpack 60 L', volumeL: 60 },
      { key: 'day', name: 'Daypack', volumeL: null },
    ],
  },
];
export const DOMAIN = Object.fromEntries(DOMAINS.map((d) => [d.key, d]));

/** The area of a trip (older trips have none: bikepacking). */
export const domainOf = (trip) => (trip?.domain && DOMAIN[trip.domain] ? trip.domain : BIKEPACKING);
/** Does this trip go by bike? Trips with their own bags (trip.packs) do not. */
export const hasBike = (trip) => !Array.isArray(trip?.packs);
/** The name of an area (English; show it with t()). */
export const domainName = (key) => DOMAIN[key]?.name ?? key;

/** The areas of an item; none set means bikepacking. */
export const itemDomains = (item) => (item?.domains?.length ? item.domains : [BIKEPACKING]);
export const inDomain = (item, key) => !key || itemDomains(item).includes(key);

/** How many items (not gone) are in each area: { bikepacking: 120, weekend: 3 }. */
export function countByDomain(items) {
  const out = {};
  for (const i of items) {
    if (i.ownership === 'gone') continue;
    for (const d of itemDomains(i)) out[d] = (out[d] ?? 0) + 1;
  }
  return out;
}

/* ---------- the last area chosen for a new trip (per device) ---------- */

const LAST = 'pack.lastDomain';
export function lastDomain() {
  try {
    const v = localStorage.getItem(LAST);
    return DOMAIN[v] ? v : BIKEPACKING;
  } catch {
    return BIKEPACKING;
  }
}
export function rememberDomain(key) {
  try {
    if (DOMAIN[key]) localStorage.setItem(LAST, key);
  } catch {
    /* private mode: bikepacking next time */
  }
}

/* ---------- trips without a bike ---------- */

/** The ready check suggested for a trip without a bike (the bike one speaks of helmet and tyres). */
export const READY_BY_DOMAIN = {
  ski: [
    { id: 'lvs', label: 'Avalanche transceiver on and tested' },
    { id: 'bulletin', label: 'Avalanche bulletin read' },
    { id: 'skins', label: 'Skins, crampons, poles' },
    { id: 'charged', label: 'Devices charged' },
    { id: 'wallet', label: 'Phone, wallet, keys' },
  ],
  weekend: [
    { id: 'tickets', label: 'Tickets or route checked' },
    { id: 'charged', label: 'Devices charged' },
    { id: 'wallet', label: 'Phone, wallet, keys' },
  ],
  travel: [
    { id: 'passport', label: 'Passport, visa, insurance' },
    { id: 'cards', label: 'Cards and some cash' },
    { id: 'charged', label: 'Devices charged, adapter packed' },
    { id: 'wallet', label: 'Phone, wallet, keys' },
  ],
};
/** Where the own standard ready check of an area is stored (settings key). */
export const readyKey = (domain) => (!domain || domain === BIKEPACKING ? 'readyStandard' : `readyStandard.${domain}`);

/** A fresh copy of an area's bags for a new trip. */
export const packsFor = (domain) => (DOMAIN[domain]?.packs ?? []).map((p) => ({ ...p }));

/** Where an item lands on a trip without a bike: worn items on me, everything else in the first bag. */
export function packSlot(item, packs) {
  if (isWorn(item) || item?.defaultBag === 'body') return 'body';
  return packs[0]?.key ?? 'body';
}

/** The start of a trip of an area: its items marked worn, standard or "On every trip". */
export function domainEntries(items, domain, packs) {
  return items
    .filter((i) => isInventory(i) && inDomain(i, domain) && (isWorn(i) || inStandard(i)))
    .map((i) => ({ itemId: i.id, slot: packSlot(i, packs), qty: 1, packed: false }));
}

/** The last trip of an area (by start date), or null. */
export function lastTripIn(domain, trips) {
  return [...trips].filter((t) => domainOf(t) === domain).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0] ?? null;
}

/**
 * A new trip without a bike: a copy of the last trip of the same area (from = 'last'), or the
 * area's own items ('standard'). An area with no items yet starts empty. Nothing is ticked off.
 */
export function newPackTrip({ title, startDate, days, domain, readyStandard = null }, trips, items, now = Date.now()) {
  const packs = packsFor(domain);
  const keys = new Set(['body', ...packs.map((p) => p.key)]);
  const from = lastTripIn(domain, trips);
  const known = new Set(items.map((i) => i.id));
  const entries = from
    ? from.entries.filter((e) => known.has(e.itemId)).map((e) => ({ ...e, slot: keys.has(e.slot) ? e.slot : packs[0]?.key ?? 'body', packed: false }))
    : domainEntries(items, domain, packs);
  const ready = (readyStandard?.length ? readyStandard : READY_BY_DOMAIN[domain] ?? []).map((r) => ({ id: r.id, label: r.label, done: false }));
  return {
    id: `trip-${now.toString(36)}`,
    domain,
    title: title.trim(),
    startDate,
    days: Math.max(1, Number(days) || 1),
    bikeId: null,
    bike: null,
    setup: {},
    packs: from?.packs?.length ? from.packs.map((p) => ({ ...p })) : packs,
    entries,
    ready,
    status: 'planned',
    copiedFrom: from?.id ?? null,
    createdAt: new Date(now).toISOString(),
  };
}

/* ---------- all my favourite things (v0.21.0) ---------- */

/**
 * Every favourite (item.favorite, not gone) by area, in the order of DOMAINS, sorted by category
 * and name. An item in two areas shows in both. Areas without favourites are left out.
 * Returns [{ key, name, items, grams }].
 */
export function favoritesByDomain(items) {
  const order = Object.fromEntries(CATEGORIES.map((c, n) => [c.key, n]));
  const favs = items.filter((i) => i.favorite && i.ownership !== 'gone');
  const keys = [...DOMAINS.map((d) => d.key), ...new Set(favs.flatMap(itemDomains).filter((k) => !DOMAIN[k]))];
  return keys
    .map((key) => {
      const list = favs
        .filter((i) => itemDomains(i).includes(key))
        .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99) || a.name.localeCompare(b.name));
      return { key, name: domainName(key), items: list, grams: list.reduce((t, i) => t + (i.weightG ?? 0) * (i.qty || 1), 0) };
    })
    .filter((g) => g.items.length);
}
