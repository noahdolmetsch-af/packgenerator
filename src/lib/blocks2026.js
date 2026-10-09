/**
 * v0.33.0 (finding 5, stage 2 preparation; Noah 11a and 12a): one word instead of four.
 *
 *   role 'standard'  + always ("On every trip")  →  the building block "Standard" (item.sets has 'standard'),
 *                                                    which comes into every new trip (11a)
 *   role 'worn'                                   →  STAYS as it is (coordinator correction to 12a: only the
 *                                                    word changes, shown as "Am Körper"; no data change)
 *   role 'optional'                               →  the mark item.leaveHome = true
 *   templates                                     →  tpl.blocks: the blocks a template holds completely
 *
 * role and always STAY on the item (read only, for two versions), so a backup still works in an
 * older version. The helpers inStandard, isWorn and leaveHome read the old AND the new fields, so
 * they answer the same before and after the update (tests/blocks2026.test.js).
 *
 * Pure functions only: no database. v0.33.0 (stage 2): the one-time update runs from updates.js
 * (blocks2026, after toolsAlways2026), and every place that read role / always uses the helpers.
 */
import { SETS, OLD_SETS, isInventory, isOldSetKey } from './gear.js';
import { inDomain, BIKEPACKING } from './domains.js';

/** The key of the built-in block "Standard" on item.sets. */
export const STANDARD = 'standard';
/** Settings key of the one-time update (like 'update.kitTemplates2026'). */
export const BLOCKS_MARKER = 'update.blocks2026';

/* ---------- helpers: the same answer before and after the update ---------- */

/**
 * In the block Standard: the new field, or the old role standard, or the old "On every trip".
 * A worn item is NOT in it by this test: role 'worn' keeps its own logic (use isWorn); today's
 * "worn or standard" reads become isWorn(i) || inStandard(i) only where `always` is already read too.
 */
export const inStandard = (item) => !!item && (!!item.sets?.includes(STANDARD) || item.role === 'standard' || !!item.always);

/**
 * The building blocks of an item WITHOUT Standard (the night blocks, Light, own blocks). Every
 * place that asks "is it in a block?" (item.sets.length) uses this, so the key 'standard' never
 * counts as an overnight set, a filter hit or a sort rank of its own.
 */
export const blockKeys = (item) => (Array.isArray(item?.sets) ? item.sets.filter((k) => k !== STANDARD && !isOldSetKey(k)) : []);

/** Worn ("Am Körper" on screen): role 'worn', exactly as today. */
export const isWorn = (item) => !!item && item.role === 'worn';

/**
 * Marked "stays at home": the new mark, or the old role optional. An explicit leaveHome: false
 * (set by the new screens) wins over an old role optional that is still stored.
 */
export const leaveHome = (item) => !!item && (item.leaveHome === true || (item.leaveHome == null && item.role === 'optional'));

/* ---------- the one-time update ---------- */

/** Does the old data say Standard? (role standard, or "On every trip"; not worn) */
const oldStandard = (item) => item.role === 'standard' || !!item.always;

/**
 * One item after the update. Returns the SAME object when nothing changes (idempotent: a second
 * run changes nothing). A worn item gets nothing for being worn. Never removes or changes role,
 * always, defaultBag, other sets or other fields;
 * updatedAt is left alone (the item did not change for the user).
 */
export function migrateItem(item) {
  if (!item || typeof item !== 'object') return item;
  const patch = {};
  if (oldStandard(item) && !item.sets?.includes(STANDARD)) patch.sets = [...(Array.isArray(item.sets) ? item.sets : []), STANDARD];
  if (item.role === 'optional' && item.leaveHome == null) patch.leaveHome = true;
  return Object.keys(patch).length ? { ...item, ...patch } : item;
}

/**
 * The block keys in display order: Standard, the built-in blocks, the own blocks in their saved
 * order (settings 'sets'), then any other key found on an item (alphabetical, so nothing is lost).
 */
export function blockOrder(items, setsValue = [], { old = false } = {}) {
  const own = (Array.isArray(setsValue) ? setsValue : []).map((s) => s?.key).filter(Boolean);
  // v0.55.0: the old keys (gear.js OLD_SETS) only for the update of old data (old: true), first.
  const known = [STANDARD, ...(old ? Object.keys(OLD_SETS) : []), ...Object.keys(SETS), ...own.filter((k) => !isOldSetKey(k))];
  const seen = new Set(known);
  const rest = [...new Set(items.flatMap((i) => (Array.isArray(i?.sets) ? i.sets : [])))].filter((k) => !seen.has(k) && !isOldSetKey(k)).sort();
  return [...new Set([...known, ...rest])];
}

/**
 * The blocks a template holds completely: every inventory item of the block is in tpl.entries.
 * A block without inventory items is never "in" a template. items: AFTER migrateItem.
 * Templates are bike trips (tripFromTemplate: domain bikepacking), so only items of that area
 * count: a Standard item only for the weekend must not keep Standard out of every template.
 */
export function templateBlockKeys(tpl, items, setsValue = []) {
  const ids = new Set((tpl?.entries ?? []).map((e) => e.itemId));
  // v0.55.0: old data (an old backup) keeps its old blocks here; blocksplit.js maps them afterwards.
  return blockOrder(items, setsValue, { old: true }).filter((key) => {
    const its = items.filter((i) => isInventory(i) && inDomain(i, BIKEPACKING) && i.sets?.includes(key));
    return its.length > 0 && its.every((i) => ids.has(i.id));
  });
}

/**
 * One template after the update: tpl.blocks is added once. Entries and every other field stay
 * as they are. A template that already has blocks is not touched (idempotent; later edits stay).
 * Returns the SAME object when nothing changes.
 */
export function migrateTemplate(tpl, items, setsValue = []) {
  if (!tpl || Array.isArray(tpl.blocks)) return tpl;
  return { ...tpl, blocks: templateBlockKeys(tpl, items, setsValue) };
}

/**
 * The whole update, without a database. settings: { sets?: the settings 'sets' value } (only for
 * the order of the blocks). now: the marker's value.
 * → { items, templates (every record, changed or not), changedItems, changedTemplates (IDs),
 *     marker: { key, value } (the settings record to store) }
 */
export function migrateAll({ items = [], templates = [], settings = {} } = {}, { now = new Date().toISOString() } = {}) {
  const outItems = items.map(migrateItem);
  const outTemplates = (Array.isArray(templates) ? templates : []).map((t) => migrateTemplate(t, outItems, settings?.sets));
  return {
    items: outItems,
    templates: outTemplates,
    changedItems: outItems.filter((i, n) => i !== items[n]).map((i) => i.id),
    changedTemplates: outTemplates.filter((t, n) => t !== templates[n]).map((t) => t.id),
    marker: { key: BLOCKS_MARKER, value: now },
  };
}

/** Would the update change anything in this data? (old items or templates without blocks) */
export function needsBlocksUpdate({ items = [], templates = [] } = {}) {
  return items.some((i) => migrateItem(i) !== i) || (Array.isArray(templates) && templates.some((t) => t && !Array.isArray(t.blocks)));
}

/* ---------- old backups ---------- */

/** Does a list of settings records carry the marker? */
export const hasBlocksMarker = (settingsRows) => Array.isArray(settingsRows) && settingsRows.some((r) => r?.key === BLOCKS_MARKER && r.value);

/**
 * After a backup import: must the update run again (delete the marker before tidyData, so
 * applyUpdates runs it)? data: the backup object ({ tables }); mode: 'replace' or 'merge'.
 * → { rerun, reason }  reason: 'old-data' (the file holds items or templates from before the
 *   update; in "merge" they overwrite updated records while the device keeps its marker),
 *   'no-marker' (a "replace" with a file from before the update: the marker is gone with the old
 *   settings anyway), or null (the file is already updated: nothing to do).
 */
export function blocksRerunAfterImport(data, mode = 'replace') {
  const tables = data?.tables ?? {};
  const templates = (tables.settings ?? []).find((r) => r?.key === 'templates')?.value ?? [];
  if (needsBlocksUpdate({ items: tables.items ?? [], templates })) return { rerun: true, reason: 'old-data' };
  if (mode === 'replace' && !hasBlocksMarker(tables.settings)) return { rerun: true, reason: 'no-marker' };
  return { rerun: false, reason: null };
}
