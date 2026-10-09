/**
 * Gear rules: categories, bags, labels and the calculations behind the Gear page.
 * Pure functions only (no database, no screen), so they are easy to test.
 */
import { t } from './i18n.svelte.js';
import { inStandard, isWorn, leaveHome, blockKeys } from './blocks2026.js';

/** Categories in display order, with the Trail Journal colour of each. */
export const CATEGORIES = [
  { key: 'elec', name: 'Electronics', color: '#C99A06' },
  { key: 'light', name: 'Lights', color: '#4C55B0' },
  { key: 'onbike', name: 'On-bike clothing', color: '#2E6DB4' },
  { key: 'rain', name: 'Rain & cold', color: '#3BA3B8' },
  { key: 'offbike', name: 'Off-bike clothing', color: '#8C63C0' },
  { key: 'shoes', name: 'Shoes', color: '#8A5A35' },
  { key: 'tools', name: 'Tools & repair', color: '#5F6B73' },
  { key: 'food', name: 'Food & drink', color: '#E0782A' },
  { key: 'cook', name: 'Cooking', color: '#B5452F' },
  { key: 'sleep', name: 'Sleep', color: '#2F8F5B' },
  { key: 'hyg', name: 'Hygiene & health', color: '#D0507A' },
  { key: 'docs', name: 'Documents & payment', color: '#8A8F2E' },
  { key: 'bags', name: 'Bags', color: '#1E7A6E' },
  { key: 'bike', name: 'Bike parts & mounts', color: '#9B3D8F' },
  { key: 'lux', name: 'Comfort & luxury', color: '#B8935A' },
];
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

/** Where an item goes by default (same keys as the prototype). */
export const BAGS = [
  { key: 'body', name: 'On me' },
  { key: 'mounted', name: 'Mounted' },
  { key: 'seat', name: 'Seat pack / Tailfin' },
  { key: 'side', name: 'Side bags' },
  { key: 'frame', name: 'Frame bag' },
  { key: 'top', name: 'Top tube bag' },
  { key: 'bar', name: 'Front roll' },
  { key: 'pouchL', name: 'Pouch left' },
  { key: 'pouchR', name: 'Pouch right' },
  { key: 'tool', name: 'Tool bag' },
  { key: 'ttrear', name: 'Mini bag' },
  { key: 'fork', name: 'Fork cage' },
  { key: 'down', name: 'Down tube cage' },
];
export const BAG = Object.fromEntries(BAGS.map((b) => [b.key, b.name]));

export const OWNERSHIP = { owned: 'Owned', unclear: 'Unclear', 'to-buy': 'To buy', wishlist: 'Wishlist', gone: 'Gone' };
export const ROLES = { worn: 'Worn', standard: 'Standard pack', optional: 'Optional' };
/**
 * The built-in building blocks (v0.55.0 «Bausteine neu», Noah 5a–10b):
 *   with the night (one choice per trip): bivy «Biwak» (the old Base + Sleep), tent «Zelt» (always
 *   together with bivy), hotel «Hotel/Hütte» (the old Lodging), cook, firstaid (every night, as before);
 *   on the ride (suggested, deselectable per trip): repair, charge, lights «Licht» (when the ride goes
 *   into darkness), race «Rennen» (only on an event);
 *   to add: food «Verpflegung», hygiene, comfort «Komfort» (only ever unticked suggestions).
 * The old keys (OLD_SETS) stay on the items for two versions, so a backup still opens in an older
 * version; the app no longer reads them as blocks (blocksplit.js maps them once).
 */
export const SETS = {
  bivy: 'Bivouac',
  tent: 'Tent|block',
  hotel: 'Hotel/hut',
  cook: 'Night: Cook',
  firstaid: 'First aid',
  repair: 'Repair|block',
  charge: 'Charging|block',
  lights: 'Light|block',
  race: 'Race|block',
  food: 'Food|block',
  hygiene: 'Hygiene|block',
  comfort: 'Comfort|block',
};
/** v0.55.0: the block keys before «Bausteine neu» (read only by the one-time update and older backups). */
export const OLD_SETS = { base: 'Night: Base', warm: 'Night: Warm', sleep: 'Night: Sleep', light: 'Night: Light', lodging: 'Lodging' };
export const isOldSetKey = (key) => Object.hasOwn(OLD_SETS, key);

/** Food and water are used up on the way: they are packed, but not part of the gear weight. */
export const CONSUMABLE_CATEGORIES = ['food'];
export const isConsumable = (item) => CONSUMABLE_CATEGORIES.includes(item.category);

/** Owned and unclear items are the inventory; wishlist and to-buy are kept apart; gone items only stay for the record. */
export const isInventory = (item) => item.ownership === 'owned' || item.ownership === 'unclear';

/** Weight of all pieces (e.g. a pair of side bags = 2 × 450 g); null when not weighed. */
export const itemWeight = (item) => (item.weightG == null ? null : item.weightG * (item.qty || 1));

/** 1234 → "1,234 g"; 12345 → "12.35 kg" */
export function formatWeight(g) {
  if (g == null) return t('not weighed');
  // No trailing zeros: 64 kg, 1.5 kg, 1.23 kg (design review: "64.00 kg" looked odd).
  if (g >= 1000) return `${Number((g / 1000).toFixed(g >= 10000 ? 1 : 2))} kg`;
  return `${String(Math.round(g)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} g`;
}

/**
 * v0.22.0 (AP04, honest weights): a sum where some weights may be unknown. Unknown is not zero:
 * g adds up only the known weights, missing counts the unknown ones (null/undefined).
 * sumKnown([450, null, 0]) → { g: 450, missing: 1, n: 3 }
 */
export function sumKnown(weights) {
  let g = 0;
  let missing = 0;
  for (const w of weights) {
    if (w == null) missing++;
    else g += w;
  }
  return { g, missing, n: weights.length };
}

/**
 * The text for a sum (AP04): the plain weight when every weight is known, "known: 2.69 kg" when
 * some are missing. The count ("7 not weighed") is shown right next to it by the page.
 * fmt: the formatter for the number (formatWeight, or a page's own "84.8 kg").
 */
export function knownWeight(g, missing, fmt = formatWeight) {
  return missing ? t('known: {w}', { w: fmt(g) }) : fmt(g);
}

/** The same as one line of text, for labels, print and small cards: "known: 2.69 kg · 7 not weighed". */
export function weightText(g, missing, fmt = formatWeight) {
  return missing ? `${knownWeight(g, missing, fmt)} · ${t('{n} not weighed', { n: missing })}` : fmt(g);
}

/**
 * Totals for the overview: per category, top 10, inventory and wishlist.
 * total and top leave out consumables (food and water); consumablesG is their weight on its own.
 */
export function gearStats(items) {
  const cats = Object.fromEntries(CATEGORIES.map((c) => [c.key, { ...c, g: 0, n: 0, unweighed: 0, consumable: CONSUMABLE_CATEGORIES.includes(c.key) }]));
  // v0.27.0: the sums of the items with an unknown category (shown as their own group in Gear).
  const other = { ...UNKNOWN_CATEGORY, g: 0, n: 0, unweighed: 0, consumable: false };
  const inventory = [];
  const wishlist = [];
  const gone = [];
  let total = 0;
  let consumablesG = 0;
  let unweighed = 0;
  // v0.22.0 (AP04): unweighed items split like the sums: gear (total) and food and water (consumablesG).
  let totalMissing = 0;
  let consumablesMissing = 0;
  for (const item of items) {
    if (item.ownership === 'gone') {
      gone.push(item);
      continue;
    }
    if (!isInventory(item)) {
      wishlist.push(item);
      continue;
    }
    inventory.push(item);
    const c = cats[item.category] ?? other;
    const w = itemWeight(item);
    if (c) c.n++;
    if (w == null) {
      unweighed++;
      if (isConsumable(item)) consumablesMissing++;
      else totalMissing++;
      if (c) c.unweighed++;
    } else {
      if (isConsumable(item)) consumablesG += w;
      else total += w;
      if (c) c.g += w;
    }
  }
  const top = inventory
    .filter((i) => itemWeight(i) > 0 && !isConsumable(i))
    .sort((a, b) => itemWeight(b) - itemWeight(a) || a.name.localeCompare(b.name))
    .slice(0, 10);
  return { cats: CATEGORIES.map((c) => cats[c.key]), other, total, totalMissing, consumablesG, consumablesMissing, unweighed, top, inventory, wishlist, gone };
}

/**
 * v0.22.0 (AP05): favourites counted on the same bases as Gear's tabs, so every number says
 * what it counts: { inventory (owned or unclear), wishlist (wishlist or to buy), gone, all }.
 * Home and Gear show `inventory` as "favourites" and name the wishlist ones apart.
 */
export function favouriteCounts(items = []) {
  const n = { inventory: 0, wishlist: 0, gone: 0, all: 0 };
  for (const i of items) {
    if (!i.favorite) continue;
    n.all++;
    if (i.ownership === 'gone') n.gone++;
    else if (isInventory(i)) n.inventory++;
    else n.wishlist++;
  }
  return n;
}

/** Does an item match the search text and filters? */
export function matches(item, { q = '', category = '', role = '', fav = false, domain = '' } = {}) {
  if (fav && !item.favorite) return false;
  // v0.21.0: the area (item.domains; none set = bikepacking)
  if (domain && !(item.domains?.length ? item.domains : ['bikepacking']).includes(domain)) return false;
  if (category && item.category !== category) return false;
  // v0.32.0 (finding 5, stage 1): the filter "Comes along": Standard (with On me), On me, in a
  // building block, stays at home, nothing set. v0.33.0: read through blocks2026.js (the key
  // 'standard' is not "a building block" here).
  const std = isWorn(item) || inStandard(item);
  if (role === 'none' && (std || item.role || blockKeys(item).length || leaveHome(item))) return false;
  if (role === 'night' && !blockKeys(item).length) return false;
  if (role === 'standard' && !std) return false;
  if (role === 'worn' && !isWorn(item)) return false;
  if (role === 'optional' && !leaveHome(item)) return false;
  if (role && !['none', 'night', 'standard', 'worn', 'optional'].includes(role) && item.role !== role) return false;
  const text = q.trim().toLowerCase();
  if (!text) return true;
  const cat = CATEGORY[item.category]?.name;
  const bag = BAG[item.defaultBag];
  const hay = [item.name, item.brand, item.model, item.id, item.nameDe, cat, cat && t(cat), bag, bag && t(bag)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(text);
}

/**
 * v0.27.0 (Noah 1a): items whose category the app does not know (e.g. "clothing" from someone else's
 * import) are collected at the end, so nothing is invisible.
 */
export const UNKNOWN_CATEGORY = { key: 'other', name: 'Other / unknown category', color: '#8a9399', unknown: true };

/** Items grouped by category, in category order; empty categories left out; unknown ones last. */
export function groupByCategory(items) {
  const rest = items.filter((i) => !CATEGORY[i.category]);
  return [...CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.key) })), { ...UNKNOWN_CATEGORY, items: rest }].filter((g) => g.items.length);
}

/** How soon an item should be weighed: what goes on every ride first, then overnight sets, then optional, then the rest. */
export function weighPriority(item) {
  if (isWorn(item) || inStandard(item)) return 0;
  if (blockKeys(item).length) return 1;
  if (leaveHome(item)) return 2;
  return 3;
}

/** Items still to weigh (the "To weigh" queue): by priority, then category order, then name. */
export function weighQueue(items) {
  const order = Object.fromEntries(CATEGORIES.map((c, i) => [c.key, i]));
  return items
    .filter((i) => isInventory(i) && i.weightG == null)
    .sort(
      (a, b) =>
        weighPriority(a) - weighPriority(b) ||
        (order[a.category] ?? 99) - (order[b.category] ?? 99) ||
        a.name.localeCompare(b.name),
    );
}

/** Next free ID for a category, e.g. "EL20" after "EL19". */
export const PREFIX = { elec: 'EL', light: 'LI', onbike: 'KL', rain: 'RG', offbike: 'OB', shoes: 'SH', tools: 'WZ', food: 'FD', cook: 'KO', sleep: 'SL', hyg: 'HY', docs: 'DK', bags: 'TA', bike: 'BK', lux: 'LX' };
export function nextId(items, category) {
  const p = PREFIX[category] ?? 'XX';
  const used = items.map((i) => i.id).filter((id) => id.startsWith(p)).map((id) => parseInt(id.slice(p.length), 10) || 0);
  return p + String(Math.max(0, ...used) + 1).padStart(2, '0');
}

/** A grams value typed by the user: whole number from 1 to 30,000, else null. */
export function parseGrams(text) {
  const n = Number(String(text).trim().replace(/['’,]/g, ''));
  return Number.isInteger(n) && n >= 1 && n <= 30000 ? n : null;
}

/**
 * v0.23.0 (AP08/AP09): the copy the item dialog edits. An existing item keeps every field; numbers
 * of the layer rules become text while editing, the weight goes into `grams`. A new item starts
 * without a category (it has to be chosen) and with the preset (search text, filter, tab).
 */
export function itemDraft(item, preset = {}) {
  const layerFields = (src) => ({ ride: src.ride ?? '', rain: src.rain ?? '', coldBelow: src.coldBelow ?? '', perHours: src.perHours ?? '', waterL: src.waterL ?? '', maxQty: src.maxQty ?? '', replaces: src.replaces ?? '', altFor: src.altFor ?? '' });
  return item
    ? { ...item, role: item.role ?? '', model: item.model ?? '', grams: item.weightG ?? '', domains: item.domains?.length ? item.domains : ['bikepacking'], favNote: item.favNote ?? '', ...layerFields(item) }
    : { id: '', name: '', brand: '', model: '', category: '', grams: '', qty: 1, defaultBag: 'top', ownership: 'owned', role: '', note: '', sets: [], kits: [], domains: ['bikepacking'], ...preset, ...layerFields(preset) };
}

const numOrNull = (v) => (v == null || String(v).trim() === '' || !Number.isFinite(Number(String(v).replace(',', '.'))) ? null : Number(String(v).replace(',', '.')));

/**
 * v0.23.0 (AP09): the item record "Save" in the item dialog writes. draft: the edited copy
 * (layer numbers may still be text, `grams` is ignored), item: the item as it was (null = new),
 * weightG: the checked weight (null = not weighed). A new item gets the next free ID of its
 * category; an existing item keeps its ID exactly, also when its category changes, so trips,
 * templates, kits, bags, favourites and learnings that point to the ID keep working.
 * Every other field of the draft is kept as it is.
 */
export function itemRecord(draft, { item = null, items = [], weightG = null, now = new Date().toISOString() } = {}) {
  const { grams, ...rest } = draft;
  return {
    ...rest,
    id: item ? item.id : nextId(items, rest.category),
    name: rest.name.trim(),
    qty: Math.max(1, Number(rest.qty) || 1),
    role: rest.role || null,
    always: rest.always ? true : rest.always === false ? false : null,
    favorite: rest.favorite ? true : null,
    favNote: rest.favorite ? rest.favNote?.trim() || null : (item?.favNote ?? null),
    domains: rest.domains?.length ? rest.domains : ['bikepacking'],
    ride: rest.ride || null,
    rain: rest.rain || null,
    coldBelow: numOrNull(rest.coldBelow),
    perHours: numOrNull(rest.perHours),
    waterL: numOrNull(rest.waterL),
    maxQty: numOrNull(rest.maxQty),
    replaces: rest.replaces || null,
    altFor: rest.altFor || null,
    weightG,
    weightStatus: weightG == null ? 'missing' : weightG !== item?.weightG ? 'measured' : item.weightStatus,
    ...boughtNow(item, rest.ownership, now),
    updatedAt: now,
  };
}

/** A wish (wishlist or to buy). */
export const isWish = (item) => item?.ownership === 'wishlist' || item?.ownership === 'to-buy';
/**
 * v0.44.0: a wish that becomes owned gets the day it was bought (boughtAt), for the review of the
 * last 12 months (yearreview.js). Only then; otherwise nothing is added.
 */
export const boughtNow = (item, ownership, now = new Date().toISOString()) => (item && isWish(item) && ownership === 'owned' ? { boughtAt: now } : {});

/*
 * v0.24.1 (Noah 5a): several items at once in the Gear list ("Select"). The functions below only
 * compute the new records; src/lib/gear/bulk.js writes them in one database transaction and the
 * page keeps the old records in memory for "Undo".
 */

/**
 * v0.24.1 (Noah 5a): the selected items moved to another category. The IDs never change (like AP09
 * in itemRecord), so trips, templates, kits, bags and favourites keep them. Returns only the items
 * that really change.
 */
export function bulkCategory(items, ids, category, now = new Date().toISOString()) {
  const pick = new Set(ids);
  return items.filter((i) => pick.has(i.id) && i.category !== category).map((i) => ({ ...i, category, updatedAt: now }));
}

/** v0.24.1 (Noah 5a): the selected items onto the wishlist ('wishlist') or into my gear ('owned'); only the ones that change. */
export function bulkOwnership(items, ids, ownership, now = new Date().toISOString()) {
  const pick = new Set(ids);
  return items.filter((i) => pick.has(i.id) && i.ownership !== ownership).map((i) => ({ ...i, ownership, ...boughtNow(i, ownership, now), updatedAt: now }));
}

// Does a trip or template list one of the picked items (as an entry or an old ready row)?
const lists = (x, pick) => (x.entries ?? []).some((e) => pick.has(e.itemId)) || (x.ready ?? []).some((r) => r.itemId && pick.has(r.itemId));

/** v0.24.1 (Noah 5a): the IDs of the selected items that a trip or a template still lists. */
export function itemsInUse(ids, trips = [], templates = []) {
  return ids.filter((id) => [...trips, ...templates].some((x) => lists(x, new Set([id]))));
}

/**
 * v0.24.1 (Noah 5a): what deleting the selected items changes, so nothing points to a missing item:
 * { ids, used (IDs that were on a trip or template), trips (only the changed trips, without those
 * entries and their ready rows), templates (the new list, or null when no template changes) }.
 */
export function bulkDelete(ids, trips = [], templates = []) {
  const pick = new Set(ids);
  const strip = (x) => ({
    ...x,
    entries: (x.entries ?? []).filter((e) => !pick.has(e.itemId)),
    ...(Array.isArray(x.ready) ? { ready: x.ready.filter((r) => !(r.itemId && pick.has(r.itemId))) } : {}),
  });
  return {
    ids: [...pick],
    used: itemsInUse([...pick], trips, templates),
    trips: trips.filter((x) => lists(x, pick)).map(strip),
    templates: templates.some((x) => lists(x, pick)) ? templates.map((x) => (lists(x, pick) ? strip(x) : x)) : null,
  };
}

/** v0.24.1 (Noah 5a): up to `max` names for a confirm text: "A, B, C, D, E and 3 more". */
export function namesList(names, max = 5) {
  const shown = names.slice(0, max).join(', ');
  return names.length > max ? t('{names} and {n} more', { names: shown, n: names.length - max }) : shown;
}
