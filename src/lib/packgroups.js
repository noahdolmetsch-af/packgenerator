/**
 * v0.113.0 «Rahmenbedingungen» (Noah 12.10.2026, mockups B1–B3 approved «b1 ok», «b3 ok», «b2 b4 b5 ok»):
 * the packing list of a new trip in four groups (answer 4b): Clothing, Gear, Electronics and
 * Extra warm (the cold layers the weather brings). Items worn on the body are counted apart (answer 7a):
 * the button «Tour anlegen · n Teile» counts only what goes into the bags.
 * The example templates per kind of trip (answer 3b): a start with its days, hours and night,
 * from the standard set. Pure functions only.
 */
import { isWorn } from './blocks2026.js';
import { entriesWeight } from './sets.js';
import { BIKEPACKING } from './domains.js';

/** The four groups in display order, with the icon key and colour of each. */
export const PACK_GROUPS = [
  { key: 'clothes', name: 'Clothing|group', color: '#2E6DB4' },
  { key: 'gear', name: 'Gear|group', color: '#4a7360' },
  { key: 'elec', name: 'Electronics', color: '#C99A06' },
  { key: 'warm', name: 'Extra warm', color: '#6A5ACD' },
];
const CLOTHES = ['onbike', 'offbike', 'shoes', 'rain'];
const ELEC = ['elec', 'light'];

/** The group of one item; warmIds: the cold layers the weather brings. */
export function groupOf(item, warmIds = new Set()) {
  if (warmIds.has(item?.id)) return 'warm';
  if (CLOTHES.includes(item?.category)) return 'clothes';
  if (ELEC.includes(item?.category)) return 'elec';
  return 'gear';
}

/**
 * entries → { groups: [{ key, name, color, rows: [{ entry, item, w }], n, w }], worn: [item], bag: n, w }.
 * Entries of unknown items are left out; worn items (role «worn») go to worn, not into a group.
 */
export function groupEntries(entries, items, warmIds = new Set()) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const rows = {};
  const worn = [];
  const bagEntries = [];
  for (const e of entries ?? []) {
    const item = byId.get(e.itemId);
    if (!item) continue;
    if (isWorn(item)) {
      worn.push(item);
      continue;
    }
    bagEntries.push(e);
    (rows[groupOf(item, warmIds)] ??= []).push({ entry: e, item, w: entriesWeight([e], items) });
  }
  const groups = PACK_GROUPS.filter((g) => rows[g.key]?.length).map((g) => ({ ...g, rows: rows[g.key], n: rows[g.key].length, w: entriesWeight(rows[g.key].map((r) => r.entry), items) }));
  return { groups, worn, bag: bagEntries.length, w: entriesWeight(bagEntries, items) };
}

/** Two example templates per kind of trip (answer 3b): they start from Standard with these conditions. */
export const EXAMPLES = {
  [BIKEPACKING]: [
    { id: 'ex:day', name: 'Day tour', icon: 'bike', days: 1, hours: 3, overnight: 'none' },
    { id: 'ex:weekend', name: 'Weekend', icon: 'bag', days: 2, hours: 4, overnight: 'lodging' },
  ],
  ski: [
    { id: 'ex:ski-day', name: 'Day tour', icon: 'ski', days: 1 },
    { id: 'ex:ski-hut', name: 'Hut tour', icon: 'hut', days: 2 },
  ],
  hiking: [
    { id: 'ex:hike-day', name: 'Day hike', icon: 'walk', days: 1 },
    { id: 'ex:hike-hut', name: 'Hut hike', icon: 'hut', days: 2 },
  ],
};
export const examplesFor = (area) => EXAMPLES[area] ?? [];
export const EXAMPLES_HIDDEN = 'tplExamplesHidden';
