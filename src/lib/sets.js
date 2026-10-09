/**
 * v0.26.0 (Noah 2a, AP10): item sets you can see and make.
 *
 * The built-in sets (gear.js SETS; v0.66.0: bivy, tent, hotel, cook, firstaid, repair, charge,
 * lights, race, food, hygiene, comfort) keep their keys: context.js and Pack use them. Own sets live in the settings
 * record "sets" as [{ key: 'u-<slug>', name, note? }]; the name is saved as Noah wrote it and
 * never translated. Membership stays on the item (item.sets = ['sleep', 'u-rain', …]).
 *
 * A set may also carry an amount per item (coordinator default, 7.10.2026: "Rain: 2 pairs of
 * gloves"): qty: { [itemId]: n } on the set's record. A built-in set gets a record ({ key, qty })
 * only once an amount is set. Without an entry the amount is 1.
 *
 * Pure functions only (no database, no screen), so they are easy to test.
 */
import { SETS, isInventory, itemWeight, sumKnown, isOldSetKey } from './gear.js';
import { slotFor } from './trips.js';
import { t, tn } from './i18n.svelte.js';
import { STANDARD, isWorn } from './blocks2026.js';

export const SETS_KEY = 'sets';
export const BUILT_IN = Object.keys(SETS);
export const isBuiltIn = (key) => BUILT_IN.includes(key);

/**
 * Every set, built-in first (their labels through t()), then the own ones in the saved order:
 * [{ key, name, note, builtIn, qty }]. value: the settings record's value (may be missing).
 */
export function allSets(value) {
  const list = Array.isArray(value) ? value : [];
  const rec = (key) => list.find((s) => s.key === key);
  // v0.26.0 (Noah 5b): a built-in block can get its own name (saved on its record, as written).
  const builtIn = BUILT_IN.map((key) => ({ key, name: rec(key)?.name || t(SETS[key]), note: '', builtIn: true, renamed: !!rec(key)?.name, qty: { ...(rec(key)?.qty ?? {}) } }));
  // v0.42.0: a temperature kit keeps its range (minC / maxC) and the Excel id it came from (sourceId).
  const extra = (s) => Object.fromEntries(['minC', 'maxC', 'sourceId', 'mergedIds'].filter((k) => s[k] !== undefined).map((k) => [k, s[k]]));
  // v0.66.0: records of the old built-in keys (gear.js OLD_SETS, kept for older versions) are not own blocks.
  const own = list.filter((s) => s?.key && !isBuiltIn(s.key) && !isOldSetKey(s.key)).map((s) => ({ key: s.key, name: s.name ?? s.key, note: s.note ?? '', builtIn: false, qty: { ...(s.qty ?? {}) }, ...extra(s) }));
  return [...builtIn, ...own];
}

/**
 * The name of one set key (an unknown key shows as it is, so nothing disappears). v0.33.0: the key
 * 'standard' (blocks2026.js) is the built-in block Standard, shown by its word.
 */
export const setName = (sets, key) => sets.find((s) => s.key === key)?.name ?? (key === STANDARD ? t('Standard|block') : key);

/** The amount of one item in a set (1 when none is set). */
export const qtyOf = (set, itemId) => Math.max(1, Number(set?.qty?.[itemId]) || 1);

/** "Rain setup" → "u-rain-setup"; a taken key gets -2, -3 … */
export function setKey(name, value = []) {
  const slug = String(name).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'set';
  const taken = new Set((value ?? []).map((s) => s.key));
  let key = `u-${slug}`;
  for (let n = 2; taken.has(key); n++) key = `u-${slug}-${n}`;
  return key;
}

const nameTaken = (value, name, except = null) => {
  const low = name.toLowerCase();
  return allSets(value).some((s) => s.key !== except && (s.name.toLowerCase() === low || (s.builtIn && !s.renamed && SETS[s.key].toLowerCase() === low)));
};

/**
 * A new own set. Returns { value, key } (the new settings value and the new key), or
 * { error: 'empty' | 'taken' } and changes nothing.
 */
export function addSet(value, name, note = '') {
  const clean = String(name ?? '').trim();
  if (!clean) return { error: 'empty' };
  const list = Array.isArray(value) ? value : [];
  if (nameTaken(list, clean)) return { error: 'taken' };
  const key = setKey(clean, list);
  return { key, value: [...list, { key, name: clean, ...(note.trim() ? { note: note.trim() } : {}) }] };
}

/**
 * Rename a set: { value } or { error }. v0.26.0 (Noah 5b): built-in sets can be renamed too; their
 * record keeps the name (and any amounts). An empty name gives a built-in set its own label back.
 */
export function renameSet(value, key, name) {
  const clean = String(name ?? '').trim();
  const list = Array.isArray(value) ? value : [];
  if (isBuiltIn(key) && !clean) return { value: list.map((s) => (s.key === key ? (({ name: _, ...rest }) => rest)(s) : s)) };
  if (!clean) return { error: 'empty' };
  if (nameTaken(list, clean, key)) return { error: 'taken' };
  if (!list.some((s) => s.key === key)) return isBuiltIn(key) ? { value: [...list, { key, name: clean }] } : { error: 'missing' };
  return { value: list.map((s) => (s.key === key ? { ...s, name: clean } : s)) };
}

/**
 * What deleting an own set changes: { value (without its record), items (only the items that
 * carried the key, without it) }. A built-in set cannot be deleted: null.
 */
export function deleteSetPlan(value, items, key, now = new Date().toISOString()) {
  if (isBuiltIn(key)) return null;
  return {
    value: (value ?? []).filter((s) => s.key !== key),
    items: items.filter((i) => i.sets?.includes(key)).map((i) => ({ ...i, sets: i.sets.filter((s) => s !== key), updatedAt: now })),
  };
}

/** The amount of one item in a set (1 removes the entry). A built-in set gets a record when needed. */
export function setQty(value, key, itemId, n) {
  const list = Array.isArray(value) ? value : [];
  const q = Math.max(1, Math.min(20, Math.round(Number(n) || 1)));
  const has = list.some((s) => s.key === key);
  const fix = (s) => {
    const qty = { ...(s.qty ?? {}) };
    if (q === 1) delete qty[itemId];
    else qty[itemId] = q;
    const { qty: _, ...rest } = s;
    return Object.keys(qty).length ? { ...rest, qty } : rest;
  };
  if (has) return list.map((s) => (s.key === key ? fix(s) : s));
  return q === 1 ? list : [...list, fix({ key })];
}

/**
 * One card of the Sets tab: { items (every item in the set, inventory first), inventory (only
 * owned or unclear: the ones that get packed), g, missing (honest sum of the inventory items
 * times their amount; an unknown weight stays unknown) }.
 */
export function setView(set, items) {
  const all = items.filter((i) => i.sets?.includes(set.key));
  const inventory = all.filter(isInventory);
  const rest = all.filter((i) => !isInventory(i));
  const { g, missing } = sumKnown(inventory.map((i) => (itemWeight(i) == null ? null : itemWeight(i) * qtyOf(set, i.id))));
  return { items: [...inventory, ...rest], inventory, g, missing };
}

/** Where a set item goes on a trip: worn on me, else its usual bag (slotFor). */
export const tripSlot = (item, setup) => (isWorn(item) ? 'body' : slotFor(item.defaultBag, setup));

/**
 * "+ Set" in Pack (Noah 3a): the inventory items of a set that are not on the trip yet, as new
 * entries in their usual bag with src: 'set' and the set's amount. Entries already on the trip
 * are not touched (also their amount), so an item in two sets is packed once.
 * slotOf(item): the place (default tripSlot with the trip's setup). skip: item IDs that never
 * go into a bag (the bags themselves, fixtures). Returns { entries, added } (added = new IDs).
 */
export function addSetEntries(trip, items, set, { slotOf = null, skip = new Set() } = {}) {
  const entries = trip.entries ?? [];
  const have = new Set(entries.map((e) => e.itemId));
  const slot = slotOf ?? ((i) => tripSlot(i, trip.setup));
  const added = [];
  for (const i of items) {
    if (!i.sets?.includes(set.key) || !isInventory(i) || have.has(i.id) || skip.has(i.id)) continue;
    have.add(i.id);
    added.push({ itemId: i.id, slot: slot(i), qty: qtyOf(set, i.id), packed: false, src: 'set' });
  }
  return { entries: added.length ? [...entries, ...added] : entries, added: added.map((e) => e.itemId) };
}

/** How many items "+ Set" would add right now (for the chip "+ Sleep (4)"). */
export const setAddable = (trip, items, set, skip = new Set()) => addSetEntries(trip, items, set, { slotOf: () => 'body', skip }).added.length;

/**
 * v0.26.0 (Noah 2a): what a built-in set does, in one line, for the Sets tab.
 * Own sets: "add with + Set in Pack".
 */
export function setUse(key) {
  switch (key) {
    case 'bivy':
      return t('Comes with a night outdoors (Bivouac or Bivouac + tent)');
    case 'tent':
      return t('Comes with Bivouac + tent, always together with Bivouac');
    case 'hotel':
      return t('Comes with a night in a hotel or hut');
    case 'cook':
      return t('Comes with a night outdoors when you cook');
    case 'firstaid':
      return t('Comes with every night (hotel, hut or outdoors); never on a trip without a night');
    case 'repair':
    case 'charge':
      return t('Suggested on every ride; you can take it off per trip');
    case 'lights':
      return t('Comes when the ride goes into the dark, with or without a night; you can take it off per trip');
    case 'race':
      return t('Comes only on a trip marked as an event');
    case 'comfort':
      return t('Nice to have: its items are only offered, never packed by themselves');
    default:
      return t('Add it in Pack: Add material → Building blocks');
  }
}

/**
 * v0.30.0 (Noah, finding 2): the weight of new entries (a block chip in "New trip": "Rain 3 · 400 g").
 * Honest like sumKnown: { g, missing }.
 */
export function entriesWeight(entries, items) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return sumKnown(entries.map((e) => {
    const w = itemWeight(byId.get(e.itemId) ?? {});
    return w == null ? null : w * Math.max(1, Number(e.qty) || 1);
  }));
}

/**
 * v0.30.0 (Noah, finding 2): a block worth a look for this trip ("Tip" on its chip in "New trip"):
 * a rain block (key or name with rain/Regen) when rain is in the weather; v0.66.0: Hygiene with a
 * night (Warm and Light are no tips any more). ctx: { wet, night }.
 */
export function isBlockTip(set, { wet = false, night = 'none' } = {}) {
  if (wet && /rain|regen/i.test(`${set.key} ${set.name ?? ''}`)) return true;
  // v0.66.0: Warm became a temperature rule on each item; Light comes by itself with the dark.
  if (set.key === 'hygiene') return !!night && night !== 'none';
  return false;
}

/**
 * v0.30.0 (Noah, finding 2): a template in words. ids: the item IDs of the template; stdIds: the
 * standard set's IDs. When the template is the whole standard set plus whole building blocks,
 * → those blocks ([] = only the standard set), else null (then the row shows its item count).
 */
export function startBlocks(ids, stdIds, sets, items) {
  const have = new Set(ids);
  const std = new Set(stdIds);
  if (!std.size || ![...std].every((id) => have.has(id))) return null;
  const rest = [...have].filter((id) => !std.has(id));
  const used = [];
  const covered = new Set();
  for (const s of sets) {
    if (s.key === STANDARD) continue; // Standard is the stdIds comparison, never a block next to it
    const its = items.filter((i) => isInventory(i) && i.sets?.includes(s.key)).map((i) => i.id);
    if (!its.length || !its.every((id) => have.has(id)) || !its.some((id) => !std.has(id) && !covered.has(id))) continue;
    used.push(s);
    for (const id of its) covered.add(id);
  }
  return rest.every((id) => covered.has(id)) ? used : null;
}

/**
 * v0.30.1 (Noah N10): a template in words, always: whether it holds the whole standard set, the
 * building blocks it holds completely (each one adding something), and how many items are left
 * over ("+ 3 single items"). → { standard, blocks: [set], single }
 */
export function templateBlocks(ids, stdIds, sets, items) {
  const have = new Set(ids);
  const std = new Set(stdIds);
  const standard = std.size > 0 && [...std].every((id) => have.has(id));
  const covered = new Set(standard ? std : []);
  const blocks = [];
  for (const s of sets) {
    if (s.key === STANDARD) continue; // Standard is the `standard` answer, never a block next to it
    const its = items.filter((i) => isInventory(i) && i.sets?.includes(s.key)).map((i) => i.id);
    if (!its.length || !its.every((id) => have.has(id)) || !its.some((id) => !covered.has(id))) continue;
    blocks.push(s);
    for (const id of its) covered.add(id);
  }
  return { standard, blocks, single: [...have].filter((id) => !covered.has(id)).length };
}

/**
 * v0.32.0 (finding 5, stage 1): a template in the two words of the app, "Standard + Rain + 2 extra"
 * («Standard + Regen + 2 Extra»), from templateBlocks. label(set): the name shown for a block.
 */
export function blocksLine({ standard, blocks, single }, label = (s) => s.name) {
  const names = [...(standard ? [t('Standard|block')] : []), ...blocks.map(label)];
  const rest = single ? tn(single, '{n} extra', '{n} extra|plural') : '';
  return names.length ? [names.join(' + '), rest].filter(Boolean).join(' + ') : rest || tn(0, '{n} item', '{n} items');
}

/** The block label for lines and chips: a built-in night block without "Night: " in front. */
export const blockLabel = (s) => (s.builtIn ? s.name.replace(/^(Night|Nacht): /, '') : s.name);
