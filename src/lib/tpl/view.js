/**
 * v0.39.0 (AP28, "Vorlagen neu"): what the template pages show, as pure functions (list, detail and
 * the 3 steps of a new template use the same rows). Data rules live in templates.js.
 */
import { allSets, blocksLine, blockLabel, qtyOf } from '../sets.js';
import { itemWeight, sumKnown, isInventory, CATEGORIES } from '../gear.js';
import { inDomain } from '../domains.js';
import { STANDARD, blockOrder } from '../blocks2026.js';
import { SLOTS, FIXED_ZONES } from '../bikes.js';
import { templateItems, templateParts, templateWeight, blockMembers, tplDomain } from '../templates.js';
import { t, tn, nameOf, bagName } from '../i18n.svelte.js';

/** The name of a block: Standard by its word, a built-in night block without "Night: ". */
export function blockName(key, setsValue = []) {
  if (key === STANDARD) return t('Standard|block');
  const s = allSets(setsValue).find((x) => x.key === key);
  return s ? blockLabel(s) : key;
}

const weigh = (rows, byId) =>
  sumKnown(rows.map((r) => {
    const w = itemWeight(byId.get(r.itemId) ?? {});
    return w == null ? null : w * (r.qty || 1);
  }));

/**
 * The blocks to choose from in an area (step 1, "+ Building block"): Standard first, then every
 * block with at least one item of the area, in the usual order.
 * → [{ key, name, members (items), n, g, missing }]
 */
export function blockChoices(items, setsValue = [], domain) {
  const sets = allSets(setsValue);
  const byId = new Map(items.map((i) => [i.id, i]));
  return blockOrder(items, setsValue)
    .map((key) => {
      const members = blockMembers(key, items, domain);
      const set = sets.find((s) => s.key === key);
      const { g, missing } = weigh(members.map((i) => ({ itemId: i.id, qty: qtyOf(set, i.id) })), byId);
      return { key, name: blockName(key, setsValue), members, n: members.length, g, missing };
    })
    .filter((b) => b.key === STANDARD || b.n > 0);
}

/**
 * The block rows of a template: what each block brings into it now ("Regen · without 1").
 * → [{ key, name, n, g, missing, without, members: [{ item, on }] }]
 */
export function blockRows(tpl, items, setsValue = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const list = templateItems(tpl, items, setsValue);
  const domain = tplDomain(tpl);
  return (tpl.blocks ?? []).map((key) => {
    const mine = list.filter((r) => r.block === key);
    const out = new Set(tpl.without?.[key] ?? []);
    const members = blockMembers(key, items, domain).map((item) => ({ item, on: !out.has(item.id) }));
    const { g, missing } = weigh(mine, byId);
    return { key, name: blockName(key, setsValue), n: mine.length, g, missing, without: members.filter((m) => !m.on).length, members };
  });
}

/** The extras of a template with their items: [{ itemId, item, qty, g }]. */
export function extraRows(tpl, items, setsValue = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return templateItems(tpl, items, setsValue)
    .filter((r) => r.block === null)
    .map((r) => {
      const item = byId.get(r.itemId) ?? null;
      const w = item ? itemWeight(item) : null;
      return { ...r, item, g: w == null ? null : w * r.qty };
    });
}

/** "Standard + Rain + 2 extra" (an older template: its item count). */
export function lineOf(tpl, setsValue = []) {
  const parts = templateParts(tpl, setsValue);
  return parts ? blocksLine(parts, blockLabel) : tn((tpl?.entries ?? []).length, '{n} item', '{n} items');
}

/** What the sticky line of a new template says: { line, n, g, missing }. */
export function summary(tpl, items, setsValue = []) {
  const w = templateWeight(tpl, items, setsValue);
  return { line: lineOf(tpl, setsValue), ...w };
}

/**
 * Items to add as extras (step 2, "+ Item"): inventory of the area, no bags, not in the template yet;
 * by category in the gear order, filtered by a search text.
 * → [{ key, name, items }]
 */
export function addable(tpl, items, setsValue = [], q = '', skip = new Set()) {
  const domain = tplDomain(tpl);
  const have = new Set(templateItems(tpl, items, setsValue).map((r) => r.itemId));
  const low = q.trim().toLowerCase();
  const hit = (i) => !low || `${i.name} ${i.nameDe ?? ''} ${i.brand ?? ''} ${i.model ?? ''}`.toLowerCase().includes(low);
  const list = items.filter((i) => isInventory(i) && i.category !== 'bags' && inDomain(i, domain) && !have.has(i.id) && !skip.has(i.id) && hit(i));
  const known = new Set(CATEGORIES.map((c) => c.key));
  const groups = CATEGORIES.map((c) => ({ key: c.key, name: t(c.name), items: list.filter((i) => i.category === c.key) }));
  groups.push({ key: 'other', name: t('Other / unknown category'), items: list.filter((i) => !known.has(i.category)) });
  return groups
    .filter((g) => g.items.length)
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => nameOf(a).localeCompare(nameOf(b))) }));
}

/**
 * The places of a template with a bike (Noah 5a: bags only with a bike): every place with a bag, then
 * Mounted and On me, with their items, count and weight. bags: the containers.
 * → [{ key, name, place, volumeL, rows: [{ itemId, item, qty, g }], n, g, missing }]
 */
export function zonesOf(tpl, items, setsValue = [], bags = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const bagById = new Map(bags.map((b) => [b.id, b]));
  const list = templateItems(tpl, items, setsValue).filter((r) => byId.has(r.itemId));
  const keys = [...SLOTS.filter((s) => tpl.setup?.[s.key]).map((s) => s.key), 'mounted', 'body'];
  for (const r of list) if (!keys.includes(r.slot)) keys.push(r.slot);
  return keys
    .map((key) => {
      const bag = bagById.get(tpl.setup?.[key]) ?? null;
      const zone = [...SLOTS, ...FIXED_ZONES].find((z) => z.key === key);
      const rows = list.filter((r) => r.slot === key).map((r) => ({ ...r, item: byId.get(r.itemId), g: itemWeight(byId.get(r.itemId)) == null ? null : itemWeight(byId.get(r.itemId)) * r.qty }));
      const { g, missing } = sumKnown(rows.map((r) => r.g));
      return { key, name: bag ? bagName(bag.name) : t(zone?.name ?? key), place: zone ? t(zone.name) : key, volumeL: bag?.volumeL ?? null, rows, n: rows.length, g, missing, bag: !!bag };
    })
    .filter((z) => z.bag || z.n);
}
