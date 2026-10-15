/**
 * Data updates, applied once on every device.
 * Each update checks the data itself before it changes anything, and only touches
 * the fields it names, so weights or notes you entered in the app stay as they are.
 * Data cleanup 14.10.2026 (Noah 1a): the one-time updates for one person's own bikes, bags and
 * items left the code (they had already run on that data). Updates here work on any data.
 */

import { READY_DEFAULT, READY_OLD_IDS } from './checks.js';
import { loadTemplates, saveTemplates, TEMPLATES_KEY, linkTemplate, isLinked } from './templates.js';
import { templateSlot } from './gear/assign.js';
import { SETS_KEY, addSet, allSets } from './sets.js';
import { isInventory } from './gear.js';
import { migrateAll, blocksRerunAfterImport, BLOCKS_MARKER } from './blocks2026.js';
import { splitAll, needsSplitUpdate, splitRerunAfterImport, SPLIT_MARKER, REVIEW_KEY } from './blocksplit.js';
import { ensureSeed } from './flowdb.js';
import { moveSeatHeight } from './bikespecs.js';
import { blocksMore2026 } from './blocksmore.js';

const now = () => new Date().toISOString();

/**
 * v0.26.0 (Noah 1a): the eight kits of the import become templates, once. Each kit without a
 * template of the same name gets one: { id: 'tpl-kit-<id>', name, note: kit.use, entries: the
 * owned or unclear items with that kit code, each in its usual bag (templateSlot: a template
 * without bags keeps the bag key, tripFromTemplate puts it into the bike's matching bag) }.
 * Coordinator default (7.10.2026): the rain kit ("Rain setup (add-on)") is an add-on to any
 * kit, so it becomes an own item set "Rain setup" with its items (not gone ones) instead.
 * The kits table and item.kits stay as they are (data is never lost).
 */
export const kitSetName = (kit) => String(kit.name ?? '').replace(/\s*\(add-on\)\s*$/i, '').trim();
// Whole word: "Training ride" stays a template.
export const isAddOnKit = (kit) => /\brain\b/i.test(kit.name ?? '');
async function kitTemplates2026(db) {
  if (await db.settings.get('update.kitTemplates2026')) return false;
  if (!(await db.items.count())) return false; // nothing imported yet
  await db.transaction('rw', db.items, db.kits, db.settings, async () => {
    const kits = await db.kits.toArray();
    const items = await db.items.toArray();
    const tplRec = await db.settings.get(TEMPLATES_KEY);
    const list0 = tplRec?.value ?? [];
    let list = list0;
    const setsRec = await db.settings.get(SETS_KEY);
    const sets0 = setsRec?.value ?? [];
    let sets = sets0;
    const stamp = now();
    for (const kit of kits) {
      const withKit = items.filter((i) => i.kits?.includes(kit.id));
      if (isAddOnKit(kit)) {
        const name = kitSetName(kit) || kit.id;
        let key = allSets(sets).find((s) => !s.builtIn && s.name.toLowerCase() === name.toLowerCase())?.key;
        if (!key) {
          const made = addSet(sets, name, kit.use ?? '');
          if (made.error) continue;
          ({ key } = made);
          sets = made.value;
        }
        const todo = withKit.filter((i) => i.ownership !== 'gone' && !i.sets?.includes(key));
        if (todo.length) await db.items.bulkPut(todo.map((i) => ({ ...i, sets: [...(i.sets ?? []), key], updatedAt: stamp })));
        continue;
      }
      if (list.some((x) => x.name.toLowerCase() === String(kit.name ?? '').toLowerCase())) continue;
      list = [
        ...list,
        {
          id: `tpl-kit-${kit.id}`,
          name: String(kit.name ?? kit.id),
          note: kit.use ?? '',
          setup: {},
          entries: withKit.filter(isInventory).map((i) => ({ itemId: i.id, slot: templateSlot(i, {}), qty: 1 })),
          ready: [],
          ride: null,
          hours: null,
          sets: {},
          purpose: {},
          fromKit: kit.id,
          updatedAt: stamp,
        },
      ];
    }
    if (list !== list0) await db.settings.put({ ...(tplRec ?? {}), key: TEMPLATES_KEY, value: list });
    if (sets !== sets0) await db.settings.put({ key: SETS_KEY, value: sets });
    await db.settings.put({ key: 'update.kitTemplates2026', value: stamp });
  });
  return true;
}

/**
 * v0.28.0 (AP25, Noah 8.10.2026: "Erste Hilfe komplett raus ausser bei 1 Nacht oder mehr"): items
 * named first aid get the built-in set "firstaid", which comes with every night (context.js).
 * By name, so it works on any data; other sets and fields stay; an item that has it is not touched.
 * Returns the IDs it changed.
 */
export const FIRST_AID = /erste[\s-]?hilfe|first[\s-]?aid/i;
export async function firstAid2026(db) {
  if (await db.settings.get('update.firstAid2026')) return [];
  if (!(await db.items.count())) return []; // nothing imported yet
  const changed = [];
  await db.transaction('rw', db.items, db.settings, async () => {
    for (const item of await db.items.toArray()) {
      if (!FIRST_AID.test(`${item.name ?? ''} ${item.nameDe ?? ''}`) || item.sets?.includes('firstaid')) continue;
      await db.items.update(item.id, { sets: [...(item.sets ?? []), 'firstaid'] });
      changed.push(item.id);
    }
    await db.settings.put({ key: 'update.firstAid2026', value: now() });
  });
  return changed;
}

/**
 * v0.28.0 (AP25, Noah: "werkzeug und ersatzschlauch immer"): the spare tube, tyre levers, patches
 * and the multitool become "On every trip". Only owned or unclear items of Tools & repair or Bike
 * parts whose name says so, and only when "On every trip" was never set (always == null): an item
 * switched off in the app stays off. Returns the IDs it changed.
 */
export const TOOLS_ALWAYS = /ersatzschlauch|spare\s?tube|schlauch|\btube\b|multi-?tool|flickzeug|patch|reifenheber|tyre lever|tire lever/i;
export async function toolsAlways2026(db) {
  if (await db.settings.get('update.toolsAlways2026')) return [];
  if (!(await db.items.count())) return []; // nothing imported yet
  const changed = [];
  await db.transaction('rw', db.items, db.settings, async () => {
    for (const item of await db.items.toArray()) {
      if (!['tools', 'bike'].includes(item.category) || !isInventory(item) || item.always != null) continue;
      if (!TOOLS_ALWAYS.test(`${item.name ?? ''} ${item.nameDe ?? ''}`)) continue;
      await db.items.update(item.id, { always: true });
      changed.push(item.id);
    }
    await db.settings.put({ key: 'update.toolsAlways2026', value: now() });
  });
  return changed;
}

/**
 * v0.33.0 (finding 5, stage 2; Noah 11a): the data onto building blocks (blocks2026.js migrateAll).
 * role 'standard' and "On every trip" → the block Standard (item.sets has 'standard'); role
 * 'optional' → item.leaveHome; role 'worn' stays as it is. Templates get tpl.blocks. role and always
 * stay on the item, so a backup still opens in an older version. Runs after toolsAlways2026 (which
 * still writes always). Only changed records are written; a second run changes nothing.
 * Returns { items, templates } (the changed IDs).
 */
export async function blocks2026(db) {
  if (await db.settings.get(BLOCKS_MARKER)) return { items: [], templates: [] };
  if (!(await db.items.count())) return { items: [], templates: [] }; // nothing imported yet
  let res = { items: [], templates: [] };
  await db.transaction('rw', db.items, db.settings, async () => {
    const items = await db.items.toArray();
    const templates = await loadTemplates(db);
    const sets = (await db.settings.get(SETS_KEY))?.value ?? [];
    const up = migrateAll({ items, templates, settings: { sets } }, { now: now() });
    const changed = new Set(up.changedItems);
    if (changed.size) await db.items.bulkPut(up.items.filter((i) => changed.has(i.id)));
    if (up.changedTemplates.length) await saveTemplates(db, up.templates);
    await db.settings.put(up.marker);
    res = { items: up.changedItems, templates: up.changedTemplates };
  });
  return res;
}

/**
 * v0.33.0: after a backup import (or a demo start / end), before tidyData: when the file holds data
 * from before the update (or a "replace" brought no marker), the marker goes, so applyUpdates runs
 * blocks2026 again on the imported data. Returns true when the marker was deleted.
 */
export async function blocksAfterImport(db, data, mode = 'replace') {
  // v0.66.0: a file from before «Bausteine neu» replacing the data gets the new blocks again (blockSplit2026).
  if (splitRerunAfterImport(data, mode)) await db.settings.delete(SPLIT_MARKER);
  if (!blocksRerunAfterImport(data, mode).rerun) return false;
  await db.settings.delete(BLOCKS_MARKER);
  return true;
}

/**
 * v0.66.0 «Bausteine neu» (Noah 5a–10b): the building blocks split and renamed once (blocksplit.js
 * splitAll): Base + Sleep → Bivouac (a tent → Tent), Warm → a temperature rule on each item, Light →
 * Light (by itself in the dark), Lodging → Hotel/hut or Tent; the new blocks get only obvious
 * category matches. What to check goes into the settings 'blockReview' for «Bausteine prüfen».
 * The old keys stay on the items (older versions). Runs after templatesLinked2026. On the first run
 * (no marker) every item is looked at; later only items or templates that still carry an old key
 * (an older backup merged in), so a second run changes nothing. Returns { items, templates }.
 */
export async function blockSplit2026(db) {
  const marker = await db.settings.get(SPLIT_MARKER);
  if (!(await db.items.count())) return { items: [], templates: [] }; // nothing imported yet
  let res = { items: [], templates: [] };
  await db.transaction('rw', db.items, db.settings, async () => {
    const items = await db.items.toArray();
    const templates = await loadTemplates(db);
    if (marker && !needsSplitUpdate({ items, templates })) return;
    const sets = (await db.settings.get(SETS_KEY))?.value ?? [];
    const review = (await db.settings.get(REVIEW_KEY))?.value ?? null;
    const up = splitAll({ items, templates, sets, review }, { first: !marker, now: now() });
    const changed = new Set(up.changedItems);
    if (changed.size) await db.items.bulkPut(up.items.filter((i) => changed.has(i.id)));
    if (up.setsChanged) await db.settings.put({ key: SETS_KEY, value: up.sets });
    if (up.changedTemplates.length) {
      const rec = await db.settings.get(TEMPLATES_KEY);
      await db.settings.put({ ...(rec ?? {}), key: TEMPLATES_KEY, value: up.templates });
    }
    if (changed.size || !review) await db.settings.put({ key: REVIEW_KEY, value: up.review });
    if (!marker) await db.settings.put(up.marker);
    res = { items: up.changedItems, templates: up.changedTemplates };
  });
  return res;
}

/**
 * v0.39.0 (AP28, Noah 2a): templates linked to their building blocks. Every template without the new
 * fields gets them once, with EXACTLY the same content (templates.js linkTemplate: blocks from
 * tpl.blocks, block items it does not have as "without", the rest as extras, other places and
 * amounts as slots and qty, domain bikepacking, createdAt = updatedAt). entries stays as it is (the
 * snapshot for older versions). One transaction, a marker; it runs again only for templates that
 * are still unlinked (an old backup, the favourites list), so a second run changes nothing.
 * Returns the IDs of the linked templates.
 */
export const LINKED_MARKER = 'update.templatesLinked2026';
export async function templatesLinked2026(db) {
  let done = [];
  await db.transaction('rw', db.items, db.settings, async () => {
    const rec = await db.settings.get(TEMPLATES_KEY);
    const list = rec?.value ?? [];
    const marker = await db.settings.get(LINKED_MARKER);
    if (marker && list.every(isLinked)) return;
    if (list.some((x) => !isLinked(x))) {
      const items = await db.items.toArray();
      const sets = (await db.settings.get(SETS_KEY))?.value ?? [];
      const out = list.map((x) => linkTemplate(x, items, sets));
      done = out.filter((x, n) => x !== list[n]).map((x) => x.id);
      await db.settings.put({ ...(rec ?? {}), key: TEMPLATES_KEY, value: out });
    }
    if (!marker) await db.settings.put({ key: LINKED_MARKER, value: now() });
  });
  return done;
}

/**
 * v0.45.2 (Noah 9.10.2026): the new base check before every ride (checks.js READY_DEFAULT) replaces
 * the old suggested rows of a saved standard; its own rows stay after the new ones. Trips keep the
 * check they have (an import keeps the records exactly as in the file); new trips get the new one.
 */
export async function basicCheck2026(db) {
  if (await db.settings.get('update.basicCheck2026')) return false;
  const labels = new Set(READY_DEFAULT.map((r) => r.label.toLowerCase()));
  await db.transaction('rw', db.settings, async () => {
    const std = await db.settings.get('readyStandard');
    if (std?.value?.length) {
      const keep = std.value.filter((r) => !r.itemId && !READY_OLD_IDS.includes(r.id) && !READY_DEFAULT.some((d) => d.id === r.id) && !labels.has(String(r.label).toLowerCase()));
      await db.settings.put({ key: 'readyStandard', value: [...READY_DEFAULT.map((r) => ({ ...r })), ...keep.map(({ done, ...r }) => r)] });
    }
    await db.settings.put({ key: 'update.basicCheck2026', value: now() });
  });
  return true;
}

/**
 * v0.51.0 «Im Flow»: the starter activities and the question pool, once (flowdb.js ensureSeed: only
 * when there is no marker and no activity, so a restored backup with flow data keeps its own). Runs
 * with the other updates (start and after an import), not only when Today's card is on screen.
 */
export const flowSeed2026 = (db) => ensureSeed(db);

/**
 * v0.65.0 «Velo-Masse»: the saddle height moved from the geometry to the fit block. Every bike with
 * geometry.seatHeight gets it as fit.seatHeight (a value typed in fit stays) and loses the old field.
 * Idempotent: it checks the data itself, so it runs on every start and after an import.
 */
export async function fitMove2026(db) {
  let n = 0;
  await db.transaction('rw', db.bikes, async () => {
    for (const bike of await db.bikes.toArray()) {
      const changes = moveSeatHeight(bike);
      if (changes) {
        await db.bikes.update(bike.id, changes);
        n++;
      }
    }
  });
  return n > 0;
}

// v0.154.0 «Bausteine mehr» (1a, 2a): the example parts of the new blocks and the new parts of existing ones, once
export const UPDATES = [kitTemplates2026, firstAid2026, toolsAlways2026, basicCheck2026, flowSeed2026, fitMove2026, blocks2026, templatesLinked2026, blockSplit2026, (db) => blocksMore2026(db)];

export async function applyUpdates(db) {
  for (const update of UPDATES) await update(db);
}
