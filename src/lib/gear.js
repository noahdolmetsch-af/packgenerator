/**
 * Gear rules: categories, bags, labels and the calculations behind the Gear page.
 * Pure functions only (no database, no screen), so they are easy to test.
 */
import { t } from './i18n.svelte.js';

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
export const SETS = { base: 'Night: Base', warm: 'Night: Warm', sleep: 'Night: Sleep', cook: 'Night: Cook', light: 'Night: Light' };

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
 * Totals for the overview: per category, top 10, inventory and wishlist.
 * total and top leave out consumables (food and water); consumablesG is their weight on its own.
 */
export function gearStats(items) {
  const cats = Object.fromEntries(CATEGORIES.map((c) => [c.key, { ...c, g: 0, n: 0, unweighed: 0, consumable: CONSUMABLE_CATEGORIES.includes(c.key) }]));
  const inventory = [];
  const wishlist = [];
  const gone = [];
  let total = 0;
  let consumablesG = 0;
  let unweighed = 0;
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
    const c = cats[item.category];
    const w = itemWeight(item);
    if (c) c.n++;
    if (w == null) {
      unweighed++;
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
  return { cats: CATEGORIES.map((c) => cats[c.key]), total, consumablesG, unweighed, top, inventory, wishlist, gone };
}

/** Does an item match the search text and filters? */
export function matches(item, { q = '', category = '', role = '', fav = false } = {}) {
  if (fav && !item.favorite) return false;
  if (category && item.category !== category) return false;
  if (role === 'none' && (item.role || item.sets?.length)) return false;
  if (role === 'night' && !item.sets?.length) return false;
  if (role && role !== 'none' && role !== 'night' && item.role !== role) return false;
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

/** Items grouped by category, in category order; empty categories left out. */
export function groupByCategory(items) {
  return CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.key) })).filter((g) => g.items.length);
}

/** How soon an item should be weighed: what goes on every ride first, then overnight sets, then optional, then the rest. */
export function weighPriority(item) {
  if (item.role === 'worn' || item.role === 'standard') return 0;
  if (item.sets?.length) return 1;
  if (item.role === 'optional') return 2;
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
const PREFIX = { elec: 'EL', light: 'LI', onbike: 'KL', rain: 'RG', offbike: 'OB', shoes: 'SH', tools: 'WZ', food: 'FD', cook: 'KO', sleep: 'SL', hyg: 'HY', docs: 'DK', bags: 'TA', bike: 'BK', lux: 'LX' };
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
