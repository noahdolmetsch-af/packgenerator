/**
 * Data updates Noah asked for in the chat, applied once on every device.
 * Each update checks the data itself before it changes anything, and only touches
 * the fields it names, so weights or notes you entered in the app stay as they are.
 */

import { freshReady, slotFor, ALWAYS_OLD } from './trips.js';
import { loadTemplates, saveTemplates, templateFrom } from './templates.js';

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
const NEW_ITEMS = [
  { key: 'trousers', name: 'Trainerhose lang chillig', category: 'onbike', defaultBag: 'body', carry: 'body', coldBelow: 5, replaces: 'KL03' },
  { key: 'gilet', name: 'Gilet Fleece kuschelig', category: 'onbike', defaultBag: 'seat', carry: 'body', coldBelow: 10 },
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
  await db.transaction('rw', db.items, db.settings, async () => {
    const all = await db.items.toArray();
    for (const n of NEW_ITEMS) {
      if (all.some((i) => i.name === n.name)) continue;
      const { key, ...fields } = n;
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

export const UPDATES = [bikeSetups2026, lightSet2026, layers2026, fullFrameBag, readyClean2026, dailyCommuteTemplate, stravaKm2026];

export async function applyUpdates(db) {
  for (const update of UPDATES) await update(db);
}
