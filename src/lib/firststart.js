/**
 * «Erster Start» (Noah 14.10.2026 «Persönlich und Standard», decision 5 «passt»; 20.10.2026 «2a sofort und
 * wir machen b auch»): a new, empty app asks once «Start with examples» or «Start empty», so a friend who
 * opens the link sees full pages right away.
 *
 * - With examples: a made-up bike, bags, some gear and a 2-day trip in ten days (all fictional, ids «ex-»),
 *   a finished day ride three weeks ago with its debrief (so «Rückblick» shows something), plus the
 *   twelve starter activities of Active that every new app gets (flowdb.js ensureSeed).
 * - Empty: the twelve starter activities go too (they belong to the examples); nothing else changes.
 * The answer and the ids of the examples are one setting (FIRST_KEY, in the backup), so the question never
 * comes back and Me › Data and backup can take the examples away again (removeExamples, with Undo).
 *
 * Only a truly new app is asked (isFresh): every table empty except the app's own seeds, no demo, no
 * pairing with another device. Noah's data is never touched. Window: lib/firststart/FirstStart.svelte.
 */
import { restoreBackup, APP_ID } from './backup.js';
import { SCHEMA_VERSION } from './db.js';
import { blocksAfterImport } from './updates.js';
import { seedActs } from './flow.js';
import { seedTemplates } from './flowmed.js';
import { WALK } from './flowtiles.js';
import { addDays } from './play.js';
import { readCfg } from './sync/engine.js';
import { t } from './i18n.svelte.js';

export const FIRST_KEY = 'firstStart';
/** Tables the app fills by itself on a new start (settings, its own notes, the starter activities). */
const SEEDED = new Set(['settings', 'meta', 'flowActs', 'flowTemplates']);
/** The tables that hold the examples, in the order they are put back. */
export const EXAMPLE_TABLES = ['bikes', 'containers', 'items', 'trips', 'debriefs', 'flowActs'];
/** The key of a row (debriefs are keyed by their trip). */
const keyOf = (name, row) => (name === 'debriefs' ? row.tripId : row.id);

// [id, name (English key for t()), category, carry, weight g, slot on the trip or null]
const DAY_GEAR = new Set(['ex-frame', 'ex-jacket', 'ex-tool', 'ex-tube', 'ex-bottle', 'ex-jersey']);
const GEAR = [
  ['ex-seat', 'Seat pack 12 L', 'bags', 'luggage', 390, null],
  ['ex-frame', 'Frame bag', 'bags', 'luggage', 220, null],
  ['ex-sleep', 'Down sleeping bag', 'sleep', 'luggage', 820, 'seat'],
  ['ex-mat', 'Sleeping mat', 'sleep', 'luggage', 410, 'seat'],
  ['ex-tent', 'Tarp|example', 'sleep', 'luggage', 480, 'seat'],
  ['ex-jacket', 'Rain jacket|play', 'rain', 'luggage', 250, 'frame'],
  ['ex-tool', 'Tool kit', 'tools', 'luggage', 240, 'frame'],
  ['ex-tube', 'Spare tube|example', 'tools', 'luggage', 110, 'frame'],
  ['ex-power', 'Power bank|play', 'elec', 'luggage', 180, 'frame'],
  ['ex-lamp', 'Head torch', 'light', 'luggage', 90, 'frame'],
  ['ex-bottle', 'Water bottle|example', 'food', 'luggage', 80, null],
  ['ex-jersey', 'Jersey|play', 'onbike', 'body', 140, 'body'],
  ['ex-fleece', 'Fleece jumper|example', 'offbike', 'luggage', 300, null],
];

/**
 * Einzelidee Heute 7 (UC-309-I1 «Beispiel mit eigenem Bezug», Noah 25.10.2026): before the examples go in,
 * a short interest check picks the few that fit, so the app is not filled with things you never use.
 * nights: the 2-day trip with sleeping gear; days: the ridden day ride with its debrief; active: the twelve
 * starter activities. All three are on as a suggestion; at least one stays on.
 */
export const INTERESTS = [
  { key: 'nights', name: 'Trips with a night out', sub: 'a 2-day trip, sleeping bag, mat, tarp' },
  { key: 'days', name: 'Day rides', sub: 'a ridden day ride with its debrief' },
  { key: 'active', name: 'Active and everyday', sub: 'twelve activities like walk, yoga, sauna' },
];
export const ALL_INTERESTS = INTERESTS.map((x) => x.key);
/** The interests made safe: known keys only; none at all → all. */
export const interestsOf = (list) => {
  const k = (Array.isArray(list) ? list : []).filter((x) => ALL_INTERESTS.includes(x));
  return k.length ? [...new Set(k)] : [...ALL_INTERESTS];
};

/** The example data as a backup file (merged like an import). today: YYYY-MM-DD; interests: see INTERESTS. */
export function examplesFile(today, interests = ALL_INTERESTS) {
  const want = interestsOf(interests);
  const file = allExamples(today);
  const nights = want.includes('nights');
  const days = want.includes('days');
  if (nights && days) return file;
  const tb = file.tables;
  if (!nights && !days) return { ...file, tables: { bikes: [], containers: [], items: [], trips: [], debriefs: [] } };
  // a night out needs the whole gear of its trip; day rides only the day gear
  const keepItem = (id) => nights || DAY_GEAR.has(id);
  const items = tb.items.filter((i) => keepItem(i.id));
  const ids = new Set(items.map((i) => i.id));
  const containers = tb.containers.filter((c) => ids.has(c.itemId));
  const bags = new Set(containers.map((c) => c.id));
  const setupOf = (setup) => Object.fromEntries(Object.entries(setup ?? {}).filter(([, id]) => bags.has(id)));
  return {
    ...file,
    tables: {
      bikes: tb.bikes.map((b) => ({ ...b, setup: setupOf(b.setup), slots: b.slots.filter((sl) => setupOf(b.setup)[sl]) })),
      containers,
      items,
      trips: tb.trips.filter((x) => (x.id === 'ex-trip' ? nights : days)).map((x) => ({ ...x, setup: setupOf(x.setup) })),
      debriefs: days ? tb.debriefs : [],
    },
  };
}

function allExamples(today) {
  const now = new Date().toISOString();
  const start = addDays(today, 10);
  const bike = t('Gravel bike (example)');
  const setup = { seat: 'bag-ex-seat', frame: 'bag-ex-frame' };
  const items = GEAR.map(([id, name, category, carry, weightG]) => ({ id, name: t(name), category, carry, weightG, qty: 1, weightStatus: 'measured', ownership: 'owned', defaultBag: null, role: null, sets: [], domains: ['bikepacking'] }));
  const containers = GEAR.filter((g) => g[2] === 'bags').map(([id, name]) => ({ id: `bag-${id}`, name: t(name), slot: id === 'ex-seat' ? 'seat' : 'frame', volumeL: id === 'ex-seat' ? 12 : 4, itemId: id, pieces: 1 }));
  const bikes = [{ id: 'ex-bike', name: bike, weightG: 9600, slots: ['seat', 'frame'], setup, fixtures: [] }];
  const trips = [
    {
      id: 'ex-trip',
      title: t('Jura loop (example)'),
      domain: 'bikepacking',
      startDate: start,
      days: 2,
      status: 'planned',
      bikeId: 'ex-bike',
      bike,
      setup,
      overnight: 'outdoor',
      cook: false,
      sets: {},
      purpose: {},
      ready: [],
      entries: GEAR.filter((g) => g[5]).map(([itemId, , , , , slot]) => ({ itemId, slot, qty: 1, packed: false })),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ex-past',
      title: t('Lake ride (example)'),
      domain: 'bikepacking',
      startDate: addDays(today, -21),
      days: 1,
      status: 'done',
      finished: true,
      bikeId: 'ex-bike',
      bike,
      setup,
      overnight: null,
      cook: false,
      sets: {},
      purpose: {},
      ready: [],
      entries: GEAR.filter((g) => DAY_GEAR.has(g[0])).map(([itemId, , , , , slot]) => ({ itemId, slot: slot ?? 'frame', qty: 1, packed: true })),
      createdAt: now,
      updatedAt: now,
    },
  ];
  const debriefs = [
    {
      tripId: 'ex-past',
      status: 'done',
      weather: 'warmer',
      amount: 'much',
      bags: 'fine',
      note: t('Warm and dry: the rain jacket stayed in the bag. Next time one bottle more.'),
      items: { 'ex-jacket': 'unused' },
      missing: [],
      applied: [],
      km: 64,
      kmApplied: 0,
      doneAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now, tables: { bikes, containers, items, trips, debriefs } };
}

const seedIds = () => new Set(seedActs().map((a) => a.id));

/** Is this a truly new app that has not been asked yet? Never throws (false then). */
export async function isFresh(db) {
  try {
    if (await db.settings.get(FIRST_KEY)) return false;
    if (await db.meta.get('demo')) return false;
    if (await readCfg(db)) return false; // paired with another device: its data comes from there
    for (const table of db.tables) {
      if (SEEDED.has(table.name)) continue;
      if (await table.count()) return false;
    }
    // the starter activities and the walk of seed 2 (flowtiles.js): Heute puts them in by itself since 0.180
    const seeds = new Set([...seedIds(), WALK.id]);
    if (!(await db.flowActs.toArray()).every((a) => seeds.has(a.id))) return false;
    // The meditation templates the app puts in by itself (Heute shows meditation since 0.180), never used
    const tpls = new Set(seedTemplates().map((x) => x.id));
    return (await db.flowTemplates.toArray()).every((x) => tpls.has(x.id) && !x.usedAt);
  } catch {
    return false;
  }
}

/** The starter activities nobody has used yet (no tick, no session). */
async function unusedSeedActs(db, ids = null) {
  const seeds = ids ? new Set(ids) : seedIds();
  const acts = (await db.flowActs.toArray()).filter((a) => seeds.has(a.id));
  const out = [];
  for (const a of acts) {
    const used = (await db.flowLog.where('actId').equals(a.id).count()) + (await db.flowSessions.where('actId').equals(a.id).count());
    if (!used) out.push(a);
  }
  return out;
}

/**
 * The answer: 'examples' or 'empty'. Writes the setting first, so a second tab or a reload never asks
 * again. Returns the setting's value.
 */
export async function chooseStart(db, choice, today, interests = ALL_INTERESTS) {
  const at = new Date().toISOString();
  if (choice === 'examples') return addExamples(db, today, { at, first: true, interests });
  const value = { choice: 'empty', at, ids: {} };
  await db.settings.put({ key: FIRST_KEY, value });
  const acts = await unusedSeedActs(db);
  if (acts.length) await db.flowActs.bulkDelete(acts.map((a) => a.id));
  return value;
}

/**
 * Put the examples in (first start, or Me › Data and backup › «Get the examples» later). Only rows with
 * the «ex-» ids are written; a starter activity that is missing comes back. Never touches own data
 * (first: the first start, where every starter activity is still the app's own).
 */
export async function addExamples(db, today, { at = new Date().toISOString(), first = false, interests = ALL_INTERESTS } = {}) {
  const want = interestsOf(interests);
  const file = examplesFile(today, want);
  const active = want.includes('active');
  const present = new Set((await db.flowActs.toArray()).map((a) => a.id));
  const missing = active ? seedActs().filter((a) => !present.has(a.id)) : [];
  const ids = Object.fromEntries(Object.entries(file.tables).map(([k, rows]) => [k, rows.map((r) => keyOf(k, r))]));
  // on the first start every starter activity counts as an example; later only the ones it brings back
  ids.flowActs = first ? (active ? [...seedIds()] : []) : missing.map((a) => a.id);
  const value = { choice: 'examples', at, ids, ...(want.length < ALL_INTERESTS.length ? { interests: want } : {}) };
  await db.settings.put({ key: FIRST_KEY, value });
  await restoreBackup(db, file, 'merge');
  await blocksAfterImport(db, file, 'merge');
  if (missing.length) await db.flowActs.bulkPut(missing);
  // without «Active and everyday» the first start takes the unused starter activities away, as an empty start does
  if (first && !active) {
    const acts = await unusedSeedActs(db);
    if (acts.length) await db.flowActs.bulkDelete(acts.map((a) => a.id));
  }
  return value;
}

/** The examples still in the data: { table: [rows] } (empty object when none). */
export async function examplesLeft(db) {
  const rec = (await db.settings.get(FIRST_KEY))?.value;
  const ids = rec?.choice === 'examples' ? rec.ids ?? {} : {};
  const out = {};
  for (const name of EXAMPLE_TABLES) {
    if (!ids[name]?.length) continue;
    const rows = name === 'flowActs' ? await unusedSeedActs(db, ids.flowActs) : (await db.table(name).bulkGet(ids[name])).filter(Boolean);
    if (rows.length) out[name] = rows;
  }
  return out;
}

/** How many example things are left (the activities count as one). */
export const exampleCount = (left) => Object.entries(left).reduce((n, [k, rows]) => n + (k === 'flowActs' ? 1 : rows.length), 0);

/** Take the examples away. Returns what undoExamples needs. */
export async function removeExamples(db) {
  const left = await examplesLeft(db);
  const names = Object.keys(left);
  if (!names.length) return left;
  await db.transaction('rw', names.map((n) => db.table(n)), async () => {
    for (const n of names) await db.table(n).bulkDelete(left[n].map((r) => keyOf(n, r)));
  });
  return left;
}

/** «Undo»: the examples back as they were. */
export async function undoExamples(db, left) {
  const names = EXAMPLE_TABLES.filter((n) => left?.[n]?.length);
  if (!names.length) return;
  await db.transaction('rw', names.map((n) => db.table(n)), async () => {
    for (const n of names) await db.table(n).bulkPut(left[n]);
  });
}

/**
 * Should the window ask? Browser tests (webdriver) start empty on purpose and never see it, unless a test
 * asks for it with localStorage «firstStart.ask» = '1'. A shared page (#/share/…, #/spur-link/…, #/gruppe/…, #/karte/…) never asks.
 */
export function mayAsk(nav = globalThis.navigator, hash = globalThis.location?.hash ?? '') {
  if (/^#\/(share|spur-link|gruppe|karte)\//.test(hash)) return false;
  if (!nav?.webdriver) return true;
  try {
    return localStorage.getItem('firstStart.ask') === '1';
  } catch {
    return false;
  }
}
