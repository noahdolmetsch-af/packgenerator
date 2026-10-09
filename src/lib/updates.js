/**
 * Data updates Noah asked for in the chat, applied once on every device.
 * Each update checks the data itself before it changes anything, and only touches
 * the fields it names, so weights or notes you entered in the app stay as they are.
 * v0.27.0 (Noah 1a, AP23 finding 4): an update that creates records only runs when the records it
 * belongs to are already there (Noah's bikes and items by their IDs). A fresh install or someone
 * else's data never gets Noah's own items, bags or ready check.
 */

import { freshReady, slotFor, ALWAYS_OLD, READY_DEFAULT, READY_OLD_IDS } from './trips.js';
import { loadTemplates, saveTemplates, templateFrom, TEMPLATES_KEY, linkTemplate, isLinked } from './templates.js';
import { templateSlot } from './gear/assign.js';
import { SETS_KEY, addSet, allSets } from './sets.js';
import { isInventory } from './gear.js';
import { migrateAll, blocksRerunAfterImport, BLOCKS_MARKER } from './blocks2026.js';

const now = () => new Date().toISOString();

/**
 * 4.10.2026, answer 1 and 2: what is really mounted on each bike.
 * Four bikes: Scott Scale (the Excel "Hardtail"), Scott Spark (the Excel "Fully"),
 * Factor LS (the Excel "Gravel" is the same bike) and the newly ordered Canyon Lux World Cup.
 * Factor: frame bag, top tube bag, 2 bottles. Scott Scale: top tube bag, full frame bag, 2 food pouches.
 * Scott Spark: 2 food pouches, full frame bag. Canyon Lux World Cup: 2 bottle cages, tool bag.
 * Garmin mount and Quad Lock stay on all bikes. The 13 kg from the logbook become a note only.
 */
// The Excel bikes have no bottle cage places yet; bikes with cages need them to show the cages.
const withCages = (slots) => [...new Set([...(slots ?? []), 'cage1', 'cage2'])];

async function bikeSetups2026(db) {
  if (!(await db.bikes.get('scott-hardtail')) || (await db.bikes.get('canyon-world-cup'))) return false;
  await db.transaction('rw', db.items, db.containers, db.bikes, db.trips, async () => {
    // A full frame bag is new in the gear list (to weigh), plus the two bottle cages as places.
    if (!(await db.items.get('TA14'))) {
      await db.items.put({
        id: 'TA14', name: 'Full frame bag', brand: '', model: '', category: 'bags', weightG: null, qty: 1, weightStatus: 'missing',
        carry: 'bike', defaultBag: 'frame', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'],
        note: 'Added 4.10.2026: on the Scott Scale and the Scott Fully.', updatedAt: now(),
      });
    }
    const bags = [
      { id: 'bag-TA14', name: 'Full frame bag', slot: 'frame', volumeL: null, itemId: 'TA14', pieces: 1, note: '' },
      { id: 'bag-cage1', name: 'Bottle cage (down tube)', slot: 'cage1', volumeL: 0.75, itemId: (await db.items.get('BK04')) ? 'BK04' : null, pieces: 1, note: 'Holds one bottle' },
      { id: 'bag-cage2', name: 'Bottle cage (seat tube)', slot: 'cage2', volumeL: 0.75, itemId: (await db.items.get('BK04')) ? 'BK04' : null, pieces: 1, note: 'Holds one bottle' },
    ];
    for (const b of bags) if (!(await db.containers.get(b.id))) await db.containers.put(b);

    const fixtures = ['BK02', 'BK01'].filter(Boolean); // Garmin mount, Quad Lock
    const scott = await db.bikes.get('scott-hardtail');
    await db.bikes.update('scott-hardtail', {
      name: 'Scott Scale',
      type: 'Hardtail',
      setup: { top: 'bag-TA06', frame: 'bag-TA14', pouchL: 'bag-TA08-L', pouchR: 'bag-TA08-R' },
      fixtures,
      // The logbook value is only a hint now; a weight typed in the app stays.
      ...(scott.weightG === 13000 ? { weightG: null } : {}),
      weightNote: 'About 13 kg (logbook). Weigh it.',
    });
    if (await db.bikes.get('fully')) {
      await db.bikes.update('fully', { name: 'Scott Spark', type: 'Full suspension', setup: { frame: 'bag-TA14', pouchL: 'bag-TA08-L', pouchR: 'bag-TA08-R' }, fixtures });
    }
    const gravel = await db.bikes.get('gravel');
    const factor = await db.bikes.get('factor-ls');
    if (factor) {
      // "Gravel" in the Excel is the Factor LS: its notes join the Factor, then the duplicate goes.
      const use = [factor.use, gravel?.use].filter((u) => u && u !== '-').join('; ');
      const openPoints = [factor.openPoints, gravel?.openPoints].filter((u) => u && u !== '-').join('; ');
      await db.bikes.update('factor-ls', {
        type: 'Road / gravel', use, openPoints,
        gearing: factor.gearing?.length ? factor.gearing : gravel?.gearing ?? [],
        setup: { frame: 'bag-TA07', top: 'bag-TA06', cage1: 'bag-cage1', cage2: 'bag-cage2' }, fixtures,
        slots: withCages(factor.slots),
      });
      if (gravel) {
        await db.trips.filter((t) => t.bikeId === 'gravel').modify({ bikeId: 'factor-ls', bike: 'Factor LS' });
        await db.bikes.delete('gravel');
      }
    }
    const slots = withCages((await db.bikes.get('scott-hardtail')).slots);
    await db.bikes.put({
      id: 'canyon-world-cup', name: 'Canyon Lux World Cup', type: 'Full suspension', use: 'Newly ordered (October 2026)', gearing: [], openPoints: '',
      weightG: 10100, slots, setup: { cage1: 'bag-cage1', cage2: 'bag-cage2', tool: 'bag-TA09' }, fixtures,
    });
  });
  return true;
}

/** 4.10.2026, answer 4: a "Light" overnight set with the lights for riding in the dark. */
async function lightSet2026(db) {
  const ids = ['LI01', 'LI02', 'LI03'];
  const todo = (await db.items.bulkGet(ids)).filter((i) => i && !i.sets?.includes('light') && !i.lightSetDone);
  for (const i of todo) await db.items.update(i.id, { sets: [...(i.sets ?? []), 'light'], lightSetDone: true });
  return todo.length > 0;
}

/**
 * 4.10.2026, rounds C and D: layers on top of the every-ride base (15 °C and dry is the base).
 * Daily ride: wind jacket, midlayer, large lock (mini lock instead, or none). Training ride: 1 bottle,
 * 1 carb mix and 1 gel per 3 hours, at most 2 bottles (refill the rest).
 * Below 15 °C: arm warmers, leg warmers, wind vest. Below 10 °C: buff, thin gloves (instead of
 * fingerless), cosy fleece gilet. Below 5 °C: warm Rapha base layer instead of the sleeveless one,
 * warm Gore jersey instead of the short one, long chilled trousers instead of shorts, thin rain
 * trousers, rain jacket, clear glasses instead of sunglasses.
 * Rain: rain trousers, rain jacket, rain socks, clear glasses, overshoes (optional).
 * Bottles carry their litres of water. Only empty fields are filled, once.
 */
// needs: the items of Noah's list this one belongs with (v0.27.0: without them it is not his list).
const NEW_ITEMS = [
  { key: 'trousers', needs: ['KL03'], name: 'Trainerhose lang chillig', category: 'onbike', defaultBag: 'body', carry: 'body', coldBelow: 5, replaces: 'KL03' },
  { key: 'gilet', needs: ['KL15', 'KL18'], name: 'Gilet Fleece kuschelig', category: 'onbike', defaultBag: 'seat', carry: 'body', coldBelow: 10 },
];
const LAYERS = {
  RG14: { ride: 'daily' }, KL26: { ride: 'daily' }, WZ24: { ride: 'daily' }, WZ23: { altFor: 'WZ24' },
  FD01: { perHours: 3, waterL: 1, maxQty: 2 }, FD07: { perHours: 3 }, FD05: { perHours: 3 }, FD02: { waterL: 0.5 },
  RG17: { coldBelow: 15 }, KL14: { coldBelow: 15 }, KL12: { coldBelow: 15 },
  KL15: { coldBelow: 10 }, KL18: { coldBelow: 10, replaces: 'KL17' },
  KL07: { coldBelow: 5, replaces: 'KL05' }, KL08: { coldBelow: 5, replaces: 'KL04' },
  RG06: { coldBelow: 5, rain: 'yes' }, RG01: { coldBelow: 5, rain: 'yes' }, RG10: { coldBelow: 5, rain: 'yes', replaces: 'KL22' },
  RG07: { rain: 'yes' }, RG08: { rain: 'optional' },
};
async function layers2026(db) {
  if (await db.settings.get('update.layers2026')) return false;
  // v0.27.0: none of the items it changes is there (fresh install, someone else's data): nothing to do yet.
  if (!(await db.items.bulkGet(Object.keys(LAYERS))).some(Boolean)) return false;
  await db.transaction('rw', db.items, db.settings, async () => {
    const all = await db.items.toArray();
    for (const n of NEW_ITEMS) {
      if (all.some((i) => i.name === n.name)) continue;
      if (!n.needs.every((id) => all.some((i) => i.id === id))) continue;
      const { key, needs, ...fields } = n;
      const used = all.filter((i) => i.id.startsWith('KL')).map((i) => parseInt(i.id.slice(2), 10) || 0);
      const id = 'KL' + String(Math.max(0, ...used) + 1).padStart(2, '0');
      const item = {
        id, brand: '', model: '', weightG: null, qty: 1, weightStatus: 'missing', ownership: 'owned', role: null,
        sets: [], kits: [], domains: ['bikepacking'], note: 'Added 4.10.2026 from the chat. Weigh it.', updatedAt: now(), ...fields,
      };
      await db.items.put(item);
      all.push(item);
    }
    for (const [id, fields] of Object.entries(LAYERS)) {
      const item = all.find((i) => i.id === id);
      if (!item) continue;
      const todo = Object.fromEntries(Object.entries(fields).filter(([k]) => item[k] == null));
      // The wind vest moves from "every ride" to "below 15 °C" (15 °C is the base).
      if (id === 'KL12' && item.role === 'worn' && item.coldBelow == null) todo.role = null;
      if (Object.keys(todo).length) await db.items.update(id, todo);
    }
    await db.settings.put({ key: 'update.layers2026', value: now() });
  });
  return true;
}

/**
 * 4.10.2026: the full frame bag must always be in the bag list, also on a device where the
 * bike update above did not run (Noah's screenshot only offered the half frame bag).
 */
async function fullFrameBag(db) {
  if (!(await db.items.count())) return false; // nothing imported yet
  // v0.27.0: only for Noah's Scotts (by ID) or a bike whose setup already names this bag.
  const bikes = await db.bikes.toArray();
  if (!bikes.some((b) => ['scott-hardtail', 'fully'].includes(b.id) || Object.values(b.setup ?? {}).includes('bag-TA14'))) return false;
  let changed = false;
  await db.transaction('rw', db.items, db.containers, async () => {
    if (!(await db.items.get('TA14'))) {
      await db.items.put({
        id: 'TA14', name: 'Full frame bag', brand: '', model: '', category: 'bags', weightG: null, qty: 1, weightStatus: 'missing',
        carry: 'bike', defaultBag: 'frame', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'],
        note: 'Added 4.10.2026: on the Scott Scale and the Scott Spark.', updatedAt: now(),
      });
      changed = true;
    }
    if (!(await db.containers.get('bag-TA14'))) {
      await db.containers.put({ id: 'bag-TA14', name: 'Full frame bag', slot: 'frame', volumeL: null, itemId: 'TA14', pieces: 1, note: '' });
      changed = true;
    }
  });
  return changed;
}

/**
 * 4.10.2026, ready check cleaned up with Noah (answers 1, 2, 3, 5):
 * - AirPods, Garmin, HR strap, glasses and sunscreen become items "On every trip".
 *   (The lock stays with the layers: large lock every day, mini lock as the option.)
 * - Trips that are still ahead (or have no date) get the new short ready check. Checks
 *   added by hand for one trip stay, with their tick; the "always" items go into the trip.
 * Past trips stay as they were.
 */
const ALWAYS = ['EL13', 'EL07', 'EL10', 'KL22', 'HY01'];
async function readyClean2026(db) {
  if (await db.settings.get('update.readyClean2026')) return false;
  if (!(await db.items.count())) return false; // nothing imported yet
  // v0.27.0: none of Noah's "always" items there: not his list, its ready checks stay as they are.
  if (!(await db.items.bulkGet(ALWAYS)).some(Boolean)) return false;
  const today = now().slice(0, 10);
  await db.transaction('rw', db.items, db.trips, db.settings, async () => {
    for (const id of ALWAYS) {
      const item = await db.items.get(id);
      if (item && item.always == null) await db.items.update(id, { always: true });
    }
    // Only items that really are "On every trip" now (not one switched off in the app), and still owned.
    const always = (await db.items.bulkGet(ALWAYS)).filter((i) => i?.always && ['owned', 'unclear'].includes(i.ownership)).map((i) => i.id);
    for (const t of await db.trips.toArray()) {
      if (t.startDate && t.startDate < today) continue;
      if (Array.isArray(t.packs)) continue; // v0.21.0: a trip without a bike keeps its own check
      const own = (t.ready ?? []).filter((r) => r.id.startsWith('own-')).map(({ group, ...r }) => r);
      const on = new Set((t.entries ?? []).map((e) => e.itemId));
      const add = always.filter((id) => !on.has(id)).map((id) => ({ itemId: id, slot: slotFor(ALWAYS_OLD[id], t.setup), qty: 1, packed: false }));
      await db.trips.update(t.id, { ready: [...freshReady(), ...own], entries: [...(t.entries ?? []), ...add] });
    }
    await db.settings.put({ key: 'update.readyClean2026', value: now() });
  });
  return true;
}

/**
 * 4.10.2026, templates answer 10a: the first template "Daily commute" is made from Noah's
 * trip with that name. Runs once; if there is no such trip yet, it tries again next start.
 */
async function dailyCommuteTemplate(db) {
  if (await db.settings.get('update.dailyCommuteTemplate')) return false;
  const trip = (await db.trips.toArray()).find((t) => /daily commute/i.test(t.title ?? ''));
  if (!trip) return false;
  const list = await loadTemplates(db);
  if (!list.some((t) => t.name.toLowerCase() === 'daily commute')) {
    const id = 'tpl-daily-commute';
    await saveTemplates(db, [...list, templateFrom(trip, { id, name: 'Daily commute' })]);
    if (!trip.templateId) await db.trips.update(trip.id, { templateId: id });
  }
  await db.settings.put({ key: 'update.dailyCommuteTemplate', value: now() });
  return true;
}

/**
 * 4.10.2026, from Noah's Strava gear page: km of each bike today, and Strava's weights as a
 * start until the bike is weighed (answer 3b). Only fills empty fields: km or weights typed
 * in the app stay. The Canyon keeps the 10.1 kg Noah gave.
 */
const STRAVA_2026 = {
  'scott-hardtail': { km: 2287, weightG: 13000 },
  fully: { km: 1460, weightG: 9000 },
  'factor-ls': { km: 3689, weightG: 12000 },
  'canyon-world-cup': { km: 0, weightG: 9000 },
};
async function stravaKm2026(db) {
  if (await db.settings.get('update.stravaKm2026')) return false;
  if (!(await db.bikes.get('canyon-world-cup'))) return false; // the bikes are not set up yet
  await db.transaction('rw', db.bikes, db.settings, async () => {
    for (const [id, s] of Object.entries(STRAVA_2026)) {
      const bike = await db.bikes.get(id);
      if (!bike) continue;
      const change = {};
      if (typeof bike.km !== 'number') Object.assign(change, { km: s.km, kmDate: '2026-10-04' });
      if (bike.weightG == null) Object.assign(change, { weightG: s.weightG, weightNote: `${s.weightG / 1000} kg from Strava (estimate). Weigh it.` });
      if (Object.keys(change).length) await db.bikes.update(id, change);
    }
    await db.settings.put({ key: 'update.stravaKm2026', value: now() });
  });
  return true;
}

/**
 * v0.25.0 (M3, Noah answer 4, 7.10.2026): with a night in lodging only these come along (besides
 * worn, standard and "On every trip"): toothbrush, toothpaste, shower gel, towel, moisturiser,
 * insect repellent, training trousers and the wind jacket. They get the item set "lodging", once.
 * (Noah 1b/2a: the fleece hoodie is a new item he creates and ticks himself.) Only owned or unclear
 * items that exist; other sets and fields stay; a set removed later in Gear is not added again.
 */
export const LODGING_IDS = ['HY07', 'HY08', 'HY09', 'HY05', 'HY15', 'HY12', 'KL28', 'RG14'];
async function lodgingSet2026(db) {
  if (await db.settings.get('update.lodgingSet2026')) return false;
  if (!(await db.items.count())) return false; // nothing imported yet
  await db.transaction('rw', db.items, db.settings, async () => {
    for (const item of await db.items.bulkGet(LODGING_IDS)) {
      if (!item || !['owned', 'unclear'].includes(item.ownership) || item.sets?.includes('lodging')) continue;
      await db.items.update(item.id, { sets: [...(item.sets ?? []), 'lodging'] });
    }
    await db.settings.put({ key: 'update.lodgingSet2026', value: now() });
  });
  return true;
}

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
  if (!blocksRerunAfterImport(data, mode).rerun) return false;
  await db.settings.delete(BLOCKS_MARKER);
  return true;
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
 * v0.45.2 (Noah 9.10.2026): the new base check before every ride (trips.js READY_DEFAULT) replaces
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

export const UPDATES = [bikeSetups2026, lightSet2026, layers2026, fullFrameBag, readyClean2026, dailyCommuteTemplate, stravaKm2026, lodgingSet2026, kitTemplates2026, firstAid2026, toolsAlways2026, basicCheck2026, blocks2026, templatesLinked2026];

export async function applyUpdates(db) {
  for (const update of UPDATES) await update(db);
}
