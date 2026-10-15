/**
 * v0.154.0 «Bausteine mehr» (SN3h–SN3j; Noah 14.10.2026 21:31 «SN3h–SN3j freigegeben», answers 1a 2a 3a 4b 5a):
 * the example parts of the new blocks and the new parts of the existing ones.
 *
 *   1a: the nine new blocks (situation.js MORE_BLOCKS) and the stages (STAGE_OF) start with example parts;
 *       you take out what does not fit.
 *   2a: the new parts of existing blocks (Hotel/Hütte, Licht, Komfort; the stages of Kälte, Kochen, Laden,
 *       Erste Hilfe and Hygiene) go in directly, with «+N neu» and Rückgängig on Bausteine.
 *
 * Once per device (marker MORE_MARKER), only with data (like the other updates in updates.js). An item with the
 * same name (English or German, any case) is reused: it only gets the block key, so nothing doubles. A new item
 * is generic, «unklar» (you check whether you own it), not weighed, in the bag of its category. What the update
 * did is kept in the settings record MORE_KEY ({ at, added: { block: [ids] }, created: [ids] }), so Bausteine
 * can show «+N neu» and take it back per block. Nothing else is touched; old data stays valid.
 */
import { nextId } from './gear.js';
import { loadTemplates } from './templates.js';
import { suggestBag } from './gear/importplus.js';
import { localDay } from './localday.js';

export const MORE_MARKER = 'update.blocksMore2026';
export const MORE_KEY = 'blocksMore';
/** How long «+N neu» shows on Bausteine (calendar days from the update). */
export const NEW_DAYS = 14;

/** The example parts: [English name, German name, category]. Generic names only. */
const P = {
  earplugs: ['Earplugs', 'Ohrstöpsel', 'sleep'],
  eyemask: ['Eye mask', 'Augenmaske', 'sleep'],
  pillow: ['Inflatable pillow', 'Kissen aufblasbar', 'sleep'],
  shirt2: ['Second shirt', 'Zweites Shirt', 'offbike'],
  underwear: ['Underwear', 'Unterhose', 'offbike'],
  detergent: ['Small detergent', 'Waschmittel klein', 'hyg'],
  windvest: ['Wind vest', 'Windweste', 'onbike'],
  armwarmers: ['Arm warmers', 'Armlinge', 'onbike'],
  neck: ['Neck tube', 'Halstuch', 'onbike'],
  recdrink: ['Recovery drink', 'Recovery-Drink', 'food'],
  fasciaball: ['Fascia ball', 'Faszienball', 'lux'],
  freshclothes: ['Fresh clothes for arrival', 'Frische Kleider fürs Ankommen', 'offbike'],
  mudguards: ['Mudguards', 'Schutzbleche', 'bike'],
  wintertyres: ['Winter tyres or spikes', 'Winterreifen oder Spikes', 'bike'],
  trunks: ['Swimwear', 'Badehose', 'offbike'],
  towel: ['Microfibre towel', 'Mikrofaser-Tuch', 'hyg'],
  saunatowel: ['Sauna towel', 'Saunatuch', 'hyg'],
  slippers: ['Bath slippers', 'Badeschlappen', 'shoes'],
  showergel: ['Shower gel', 'Duschmittel', 'hyg'],
  neosocks: ['Neoprene socks', 'Neopren-Socken', 'shoes'],
  beanie: ['Beanie', 'Mütze', 'offbike'],
  poncho: ['Warm poncho', 'Warmer Poncho', 'offbike'],
  tea: ['Tea', 'Tee', 'food'],
  drybag: ['Dry bag', 'Dry-Bag', 'lux'],
  wetbag: ['Plastic bag for wet things', 'Plastiksack für Nasses', 'lux'],
  gloves: ['Long gloves', 'Handschuhe lang', 'rain'],
  overshoes: ['Overshoes', 'Überschuhe', 'rain'],
  heatpads: ['Heat pads', 'Wärmepads', 'rain'],
  thermotop: ['Thermal undershirt', 'Thermo-Unterhemd', 'onbike'],
  winterjacket: ['Winter jacket', 'Winterjacke', 'rain'],
  thermotights: ['Thermal tights', 'Thermohose', 'onbike'],
  down: ['Down jacket', 'Daunenjacke', 'offbike'],
  warmsocks: ['Warm socks', 'Warme Socken', 'offbike'],
  meal: ['Ready meal', 'Fertiggericht', 'food'],
  thermos: ['Thermos flask', 'Thermosflasche', 'cook'],
  powerbank: ['Power bank 20,000 mAh', 'Powerbank 20’000 mAh', 'elec'],
  charger: ['Charger', 'Ladegerät', 'elec'],
  blanket: ['Rescue blanket', 'Rettungsdecke', 'hyg'],
  sunscreen: ['Sunscreen', 'Sonnencreme', 'hyg'],
  lipbalm: ['Lip balm', 'Lippenpflege', 'hyg'],
  chamois: ['Chamois cream', 'Gesässcreme', 'hyg'],
  wipes: ['Wet wipes', 'Feuchttücher', 'hyg'],
  trousers: ['Light trousers', 'Leichte Hose', 'offbike'],
  eveningshoes: ['Shoes for the evening', 'Schuhe für den Abend', 'shoes'],
  cash: ['Cash', 'Bargeld', 'docs'],
  sparebattery: ['Spare battery', 'Ersatz-Akku', 'elec'],
  reflective: ['Reflective vest', 'Reflexweste', 'onbike'],
  book: ['Book', 'Buch', 'lux'],
  notebook: ['Notebook', 'Notizheft', 'lux'],
  headphones: ['Headphones', 'Kopfhörer', 'elec'],
  medtimer: ['Meditation timer', 'Meditations-Timer', 'lux'],
};

/**
 * The parts per block (README SN3h, table B7–B26). New blocks and stages: their example parts (1a); Hotel/Hütte,
 * Licht and Komfort: their new parts, which come with the block as it is (2a; the same trigger).
 */
export const MORE_PARTS = {
  // new blocks
  sleepwell: ['earplugs', 'eyemask', 'pillow'],
  twonights: ['shirt2', 'underwear', 'detergent'],
  descent: ['windvest', 'armwarmers', 'neck'],
  recovery: ['recdrink', 'fasciaball', 'freshclothes'],
  icy: ['mudguards', 'wintertyres'],
  swim: ['trunks', 'towel'],
  sauna: ['saunatowel', 'slippers', 'showergel'],
  coldwater: ['neosocks', 'beanie', 'poncho', 'tea'],
  drybag: ['drybag', 'wetbag'],
  // the stages (4b and the extensions with their own condition)
  coldHands: ['gloves', 'overshoes', 'heatpads'],
  coldLayers: ['thermotop', 'winterjacket', 'thermotights'],
  coldEvening: ['down', 'beanie', 'warmsocks'],
  cookWarm: ['tea', 'meal', 'thermos'],
  chargeLong: ['powerbank', 'charger'],
  aidWinter: ['blanket', 'heatpads', 'thermos'],
  hygieneCare: ['sunscreen', 'lipbalm', 'chamois', 'wipes'],
  // extensions with the same trigger as their block
  hotel: ['trousers', 'eveningshoes', 'cash'],
  lights: ['sparebattery', 'reflective'],
  comfort: ['book', 'notebook', 'headphones', 'medtimer'],
};
/** The parts as data: [{ key, name, nameDe, category }] of one block. */
export const partsOf = (block) => (MORE_PARTS[block] ?? []).map((k) => ({ key: k, name: P[k][0], nameDe: P[k][1], category: P[k][2] }));
/** Every example part once. */
export const ALL_PARTS = Object.keys(P).map((k) => ({ key: k, name: P[k][0], nameDe: P[k][1], category: P[k][2] }));

const low = (s) => String(s ?? '').trim().toLowerCase();

/**
 * The plan of the update (pure): which items change, which are new, what goes into the marker record.
 * items: all items. → { items: [changed or new item records], added: { block: [ids] }, created: [ids] }.
 * An item with the same name or German name (not gone) is reused; one already in the block is left alone.
 */
export function morePlan(items, { now = new Date().toISOString() } = {}) {
  const all = [...items];
  const byName = new Map();
  for (const i of all) {
    if (i.ownership === 'gone') continue;
    for (const n of [i.name, i.nameDe]) if (n && !byName.has(low(n))) byName.set(low(n), i.id);
  }
  const out = new Map(); // id → record
  const created = [];
  const added = {};
  const rec = (id) => out.get(id) ?? all.find((i) => i.id === id);
  for (const [block, keys] of Object.entries(MORE_PARTS)) {
    for (const k of keys) {
      const [name, nameDe, category] = P[k];
      let id = byName.get(low(name)) ?? byName.get(low(nameDe));
      if (!id) {
        const item = {
          id: nextId(all, category),
          name,
          nameDe,
          brand: '',
          model: '',
          category,
          weightG: null,
          qty: 1,
          weightStatus: 'missing',
          weightNote: '',
          carry: 'luggage',
          defaultBag: suggestBag(category),
          ownership: 'unclear',
          role: null,
          sets: [],
          kits: [],
          domains: ['bikepacking'],
          note: '',
          sources: `example parts 0.154.0 ${now.slice(0, 10)}`,
          updatedAt: now,
        };
        all.push(item);
        out.set(item.id, item);
        created.push(item.id);
        byName.set(low(name), item.id);
        byName.set(low(nameDe), item.id);
        id = item.id;
      }
      const cur = rec(id);
      if (cur.sets?.includes(block)) continue;
      out.set(id, { ...cur, sets: [...(cur.sets ?? []), block], updatedAt: now });
      (added[block] ??= []).push(id);
    }
  }
  return { items: [...out.values()], added, created };
}

/**
 * The update itself (updates.js), once per device and only with data. Returns the plan (or null when it did not run).
 */
export async function blocksMore2026(db, { today = localDay(), now = new Date().toISOString() } = {}) {
  if (await db.settings.get(MORE_MARKER)) return null;
  if (!(await db.items.count())) return null; // nothing imported yet
  let plan = null;
  await db.transaction('rw', db.items, db.settings, async () => {
    if (await db.settings.get(MORE_MARKER)) return;
    plan = morePlan(await db.items.toArray(), { now });
    if (plan.items.length) await db.items.bulkPut(plan.items);
    await db.settings.put({ key: MORE_KEY, value: { at: today, added: plan.added, created: plan.created } });
    await db.settings.put({ key: MORE_MARKER, value: now });
  });
  return plan;
}

/** Calendar days between two YYYY-MM-DD dates. */
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/**
 * «+N neu» of one block on Bausteine: the new parts still in it → [item] (inventory or not), or [] after
 * NEW_DAYS days, after Rückgängig, or when there are none. more: the settings value MORE_KEY.
 */
export function newParts(more, block, items, today = localDay()) {
  const ids = more?.added?.[block] ?? [];
  if (!ids.length || !more.at || daysBetween(more.at, today) >= NEW_DAYS) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  return ids.map((id) => byId.get(id)).filter((i) => i && i.sets?.includes(block));
}

/**
 * Rückgängig for one block (pure): the parts the update put in go out again; an item the update made that is
 * then in no block, on no trip and in no template goes. → { items: [changed], drop: [ids], value: new MORE_KEY value }
 */
export function undoMorePlan(more, block, items, { trips = [], templates = [], now = new Date().toISOString() } = {}) {
  const ids = new Set(more?.added?.[block] ?? []);
  const created = new Set(more?.created ?? []);
  const used = new Set([...trips.flatMap((t) => (t.entries ?? []).map((e) => e.itemId)), ...templates.flatMap((t) => (t.entries ?? []).map((e) => e.itemId))]);
  const changed = [];
  const drop = [];
  for (const i of items) {
    if (!ids.has(i.id) || !i.sets?.includes(block)) continue;
    const sets = i.sets.filter((s) => s !== block);
    if (created.has(i.id) && !sets.length && !used.has(i.id)) drop.push(i.id);
    else changed.push({ ...i, sets, updatedAt: now });
  }
  const { [block]: _, ...rest } = more?.added ?? {};
  return { items: changed, drop, value: { ...(more ?? {}), added: rest, created: [...created].filter((id) => !drop.includes(id)) } };
}

/** Rückgängig on Bausteine: one transaction; returns the snapshot for the page's Undo ({ items, more }). */
export async function undoMore(db, block) {
  let snap = null;
  await db.transaction('rw', db.items, db.trips, db.settings, async () => {
    const rec = await db.settings.get(MORE_KEY);
    const items = await db.items.toArray();
    const plan = undoMorePlan(rec?.value, block, items, { trips: await db.trips.toArray(), templates: await loadTemplates(db) });
    const touched = new Set([...plan.items.map((i) => i.id), ...plan.drop]);
    snap = { items: items.filter((i) => touched.has(i.id)), more: rec ?? null, n: touched.size };
    if (plan.items.length) await db.items.bulkPut(plan.items);
    if (plan.drop.length) await db.items.bulkDelete(plan.drop);
    await db.settings.put({ key: MORE_KEY, value: plan.value });
  });
  return snap;
}

/**
 * v0.154.0 (Gesamtliste 13.10.2026 «das passt», 3a, 5a): the groups of the page Bausteine, in this order:
 * Übernachtung, Auf jeder Fahrt (Standard first, 3a), Je nach Lage (open), Baden (new, open), Zum Dazunehmen.
 * Licht and Rennen moved to «Je nach Lage» (they keep coming by themselves, as before). Own blocks, Verpflegung,
 * Hygiene and Komfort are «Zum Dazunehmen». The stages show inside their block.
 */
export const BLOCK_GROUPS = {
  night: ['bivy', 'tent', 'hotel', 'cook', 'sleepwell', 'twonights'],
  every: ['standard', 'firstaid', 'repair', 'charge'],
  situation: ['rain', 'cold', 'heat', 'lights', 'climb', 'descent', 'long', 'recovery', 'icy', 'abroad', 'train', 'race'],
  bathing: ['swim', 'sauna', 'coldwater', 'drybag'],
};
/** The groups open at the start (5a). */
export const OPEN_GROUPS = ['situation', 'bathing'];
/** Licht and Rennen in «Je nach Lage»: their fixed «kommt mit» (they come by themselves, no rule to change). */
export const FIXED_WHEN = { lights: 'The ride goes into the dark', race: 'The trip is an event' };
