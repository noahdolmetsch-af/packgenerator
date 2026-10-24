/**
 * v0.114.0 «Rahmenbedingungen» (Noah 12.10.2026, mockups B1–B3 approved «b1 ok», «b3 ok», «b2 b4 b5 ok»):
 * the packing list of a new trip in four groups (answer 4b): Clothing, Gear, Electronics and
 * Extra warm (the cold layers the weather brings). Items worn on the body are counted apart (answer 7a):
 * the button «Tour anlegen · n Teile» counts only what goes into the bags.
 * The example templates per kind of trip (answer 3b): a start with its days, hours and night,
 * from the standard set. Pure functions only.
 */
import { isWorn } from './blocks2026.js';
import { WORN_SLOTS } from './swap.js';
import { CLOTHING_CATEGORIES, CHARGE_CATEGORIES } from './gear.js';
import { entriesWeight } from './sets.js';
import { DOMAIN } from './domains.js';

/** The four groups in display order, with the icon key and colour of each. */
export const PACK_GROUPS = [
  { key: 'clothes', name: 'Clothing|group', color: '#2E6DB4' },
  { key: 'gear', name: 'Gear|group', color: '#4a7360' },
  { key: 'elec', name: 'Electronics', color: '#C99A06' },
  { key: 'warm', name: 'Extra warm', color: '#6A5ACD' },
];

/** The group of one item; warmIds: the cold layers the weather brings. */
export function groupOf(item, warmIds = new Set()) {
  if (warmIds.has(item?.id)) return 'warm';
  if (CLOTHING_CATEGORIES.includes(item?.category)) return 'clothes';
  if (CHARGE_CATEGORIES.includes(item?.category)) return 'elec';
  return 'gear';
}

/**
 * entries → { groups: [{ key, name, color, rows: [{ entry, item, w }], n, w }], worn: [item], bag: n, w }.
 * Entries of unknown items are left out; worn items go to worn, not into a group.
 * Klick-Rundgang 22.10.2026 H01: an entry with a slot is worn when the slot is on me (swap.js
 * WORN_SLOTS, as the button «x in the bags · y on me» and Pack count); without a slot the item's role.
 */
export function groupEntries(entries, items, warmIds = new Set()) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const rows = {};
  const worn = [];
  const bagEntries = [];
  for (const e of entries ?? []) {
    const item = byId.get(e.itemId);
    if (!item) continue;
    if (e.slot ? WORN_SLOTS.has(e.slot) : isWorn(item)) {
      worn.push(item);
      continue;
    }
    bagEntries.push(e);
    (rows[groupOf(item, warmIds)] ??= []).push({ entry: e, item, w: entriesWeight([e], items) });
  }
  const groups = PACK_GROUPS.filter((g) => rows[g.key]?.length).map((g) => ({ ...g, rows: rows[g.key], n: rows[g.key].length, w: entriesWeight(rows[g.key].map((r) => r.entry), items) }));
  return { groups, worn, bag: bagEntries.length, w: entriesWeight(bagEntries, items) };
}

/** Two example templates per kind of trip (answer 3b): they start from Standard with these conditions (domains.js DOMAINS[].examples). */
export const examplesFor = (area) => DOMAIN[area]?.examples ?? [];
export const EXAMPLES_HIDDEN = 'tplExamplesHidden';
