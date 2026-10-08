/**
 * Bikes and bags: where bags can sit on a bike (slots), the starting bag list,
 * the four bike setups and the numbers shown for a setup.
 * Pure functions plus one start-up step (ensureBikeSetup), so the rules are easy to test.
 */

/**
 * Places on the bike. `box` is the position on the bike drawing
 * (x, y, width, height in a 720 × 420 picture, same as the prototype).
 */
export const SLOTS = [
  { key: 'seat', name: 'Seat pack', where: 'Seat post', box: { x: 120, y: 112, w: 160, h: 60 } },
  { key: 'side', name: 'Side bags', where: 'Next to the rear wheel', box: { x: 40, y: 186, w: 170, h: 56 } },
  { key: 'ttrear', name: 'Mini bag', where: 'Top tube, rear', box: { x: 284, y: 146, w: 58, h: 42 } },
  { key: 'frame', name: 'Frame bag', where: 'Frame triangle', box: { x: 345, y: 150, w: 140, h: 42 } },
  { key: 'top', name: 'Top tube bag', where: 'Top tube, front', box: { x: 430, y: 76, w: 108, h: 44 } },
  { key: 'cage1', name: 'Bottle cage 1', where: 'Down tube, inside the frame', box: { x: 428, y: 204, w: 84, h: 38 } },
  { key: 'cage2', name: 'Bottle cage 2', where: 'Seat tube', box: { x: 236, y: 200, w: 84, h: 38 } },
  { key: 'tool', name: 'Tool bag', where: 'Down tube, below', box: { x: 352, y: 268, w: 116, h: 44 } },
  { key: 'down', name: 'Down tube cage', where: 'Under the down tube', box: { x: 474, y: 232, w: 72, h: 46 } },
  { key: 'fork', name: 'Fork cage', where: 'Fork leg', box: { x: 556, y: 214, w: 72, h: 50 } },
  { key: 'bar', name: 'Front roll', where: 'Handlebar, front', box: { x: 596, y: 100, w: 118, h: 44 } },
  { key: 'pouchL', name: 'Pouch left', where: 'Handlebar, left', box: { x: 560, y: 24, w: 76, h: 46 } },
  { key: 'pouchR', name: 'Pouch right', where: 'Handlebar, right', box: { x: 642, y: 24, w: 76, h: 46 } },
  { key: 'carry', name: 'On my back', where: 'Hip bag or vest, worn by the rider', box: { x: 16, y: 62, w: 100, h: 40 } },
];
export const SLOT = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

/** Zones that are always there and hold no bag: worn things and things mounted on the bike. */
export const FIXED_ZONES = [
  { key: 'body', name: 'On me', where: 'Worn and in pockets', box: { x: 16, y: 16, w: 100, h: 40 } },
  { key: 'mounted', name: 'Mounted', where: 'Bottle cages, Garmin, lights', box: { x: 16, y: 364, w: 100, h: 40 } },
];

/**
 * The starting bag list, made from the gear items in the "Bags" category
 * (decision 5b: own bag list). Dry bags and straps stay gear, they are not a place on the bike.
 * The two cages come from the prototype's setup options.
 */
const START_BAGS = [
  { id: 'bag-TA02', itemId: 'TA02', slot: 'seat' },
  { id: 'bag-TA01', itemId: 'TA01', slot: 'seat' },
  { id: 'bag-TA03', itemId: 'TA03', slot: 'side', pieces: 2, note: 'Needs the Tailfin AeroPack' },
  { id: 'bag-TA05', itemId: 'TA05', slot: 'bar' },
  { id: 'bag-TA04', itemId: 'TA04', slot: 'bar' },
  { id: 'bag-TA06', itemId: 'TA06', slot: 'top' },
  { id: 'bag-TA07', itemId: 'TA07', slot: 'frame' },
  { id: 'bag-TA08-L', itemId: 'TA08', slot: 'pouchL', name: 'Food pouch left' },
  { id: 'bag-TA08-R', itemId: 'TA08', slot: 'pouchR', name: 'Food pouch right' },
  { id: 'bag-TA09', itemId: 'TA09', slot: 'tool' },
  { id: 'bag-TA10', itemId: 'TA10', slot: 'carry' },
  { id: 'bag-TA13', itemId: 'TA13', slot: 'carry' },
  { id: 'bag-cargo', itemId: null, slot: 'fork', name: 'Cargo cage', volumeL: 3 },
  { id: 'bag-mini', itemId: null, slot: 'ttrear', name: 'Mini bag', volumeL: 0.8 },
];

/** Default bags on every bike, like the prototype's standard setup. */
export const DEFAULT_SETUP = {
  seat: 'bag-TA02',
  frame: 'bag-TA07',
  top: 'bag-TA06',
  pouchL: 'bag-TA08-L',
  pouchR: 'bag-TA08-R',
  tool: 'bag-TA09',
};

/** Bag list to start with, from the gear items that exist. */
export function startContainers(items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  return START_BAGS.filter((b) => !b.itemId || byId[b.itemId]).map((b) => {
    const item = b.itemId ? byId[b.itemId] : null;
    const pieces = b.pieces ?? 1;
    const vol = b.volumeL ?? (item?.volumeL != null ? item.volumeL * pieces : null);
    return { id: b.id, name: b.name ?? item.name, slot: b.slot, volumeL: vol, itemId: b.itemId, pieces, note: b.note ?? '' };
  });
}

/** Fill in what a bike record from the Excel does not have yet (weight, slots, setup). */
export function completeBike(bike, containers, settings = {}) {
  const ids = new Set(containers.map((c) => c.id));
  const setup = Object.fromEntries(Object.entries(DEFAULT_SETUP).filter(([, id]) => ids.has(id)));
  const fromLogbook = bike.id === 'scott-hardtail' && settings.bikeWeightG ? settings.bikeWeightG : null;
  return {
    ...bike,
    weightG: bike.weightG !== undefined ? bike.weightG : fromLogbook,
    slots: bike.slots ?? SLOTS.map((s) => s.key),
    setup: bike.setup ?? setup,
  };
}

/**
 * L9: a new bike record from just a name (the New trip dialog without any bike): the same fields as
 * the Bikes page's "Add bike", the id made from the name (unique among `bikes`), and the default bags
 * that exist (as completeBike gives an imported bike).
 */
export function newBikeRecord(name, bikes = [], containers = []) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'bike';
  let id = base;
  for (let n = 2; bikes.some((b) => b.id === id); n++) id = `${base}-${n}`;
  const bike = { id, name, type: '', use: '', gearing: [], openPoints: '', weightG: null, photo: null };
  return { ...completeBike(bike, containers), fixtures: [] };
}

/**
 * Run on every start and after an import: creates the bag list once (when it is empty
 * and gear exists) and completes bikes that have no setup yet. Changes nothing otherwise.
 */
export async function ensureBikeSetup(db) {
  return db.transaction('rw', db.items, db.containers, db.bikes, db.settings, async () => {
    let containers = await db.containers.toArray();
    if (!containers.length) {
      containers = startContainers(await db.items.toArray());
      if (containers.length) await db.containers.bulkPut(containers);
    }
    const settings = Object.fromEntries((await db.settings.toArray()).map((s) => [s.key, s.value]));
    const todo = (await db.bikes.toArray()).filter((b) => !b.slots || !b.setup || b.weightG === undefined);
    if (todo.length) await db.bikes.bulkPut(todo.map((b) => completeBike(b, containers, settings)));
    return todo.length;
  });
}

/** Weight of a bag from its gear item (per piece × pieces); null when not weighed or not linked. */
export function containerWeight(container, itemsById) {
  const item = container.itemId ? itemsById[container.itemId] : null;
  return item?.weightG == null ? null : item.weightG * (container.pieces || 1);
}

/**
 * Bottle cages stay on the bike and are weighed with it (answer 1, 4.10.2026: bikes are weighed
 * without bags but with Garmin mount, Quad Lock and bottle cages), so they add nothing on top.
 */
export const ON_BIKE_SLOTS = ['cage1', 'cage2'];
export const addedWeight = (container, itemsById) => (ON_BIKE_SLOTS.includes(container.slot) ? 0 : containerWeight(container, itemsById));

/** Bags on a bike: one row per slot the bike has, with the bag and its numbers. */
export function bikeSetup(bike, containers, items) {
  const byId = Object.fromEntries(containers.map((c) => [c.id, c]));
  const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));
  const rows = SLOTS.filter((s) => bike.slots?.includes(s.key)).map((slot) => {
    const bag = byId[bike.setup?.[slot.key]] ?? null;
    return { slot, bag, weightG: bag ? addedWeight(bag, itemsById) : null };
  });
  const used = rows.filter((r) => r.bag);
  return {
    rows,
    bagCount: used.length,
    volumeL: used.reduce((t, r) => t + (r.bag.volumeL || 0), 0),
    bagsG: used.reduce((t, r) => t + (r.weightG || 0), 0),
    unweighed: used.filter((r) => r.weightG == null).length,
  };
}

/**
 * v0.22.0 (AP04): how sure the bike weight is. 'measured' = a weight typed or weighed in the app;
 * 'estimate' = a guess with a note saying so (e.g. "9 kg from Strava (estimate)"); 'missing' = no weight.
 */
export const bikeWeightKind = (bike) => (bike?.weightG == null ? 'missing' : /estimate/i.test(bike.weightNote ?? '') ? 'estimate' : 'measured');

/** Bags that fit a slot, for the "which bag goes here" choice. */
export const bagsFor = (slotKey, containers) => containers.filter((c) => c.slot === slotKey);

/** "16.5 L", or "–" when unknown */
export const formatVolume = (l) => (l ? `${Math.round(l * 10) / 10} L` : '–');

/** Bikes in Excel order (the favourite first), new bikes after them by name. */
const BIKE_ORDER = ['scott-hardtail', 'fully', 'factor-ls', 'canyon-world-cup', 'gravel'];
const bikeRank = (b) => (BIKE_ORDER.includes(b.id) ? BIKE_ORDER.indexOf(b.id) : 99);
export const sortBikes = (bikes) => [...bikes].sort((a, b) => bikeRank(a) - bikeRank(b) || a.name.localeCompare(b.name));

/* ---------- one page "Bikes" with the tabs Setup and Care (v0.21.0, Noah's answers 6a, 5) ---------- */

/**
 * Read the address of the Bikes page: #/bikes?tab=care&bike=<id>&open=1.
 * The old address #/care still lands on the Care tab. open: open that bike's care section.
 */
export function parseBikesHash(hash = '') {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const q = new URLSearchParams(query);
  const tab = path.startsWith('/care') || q.get('tab') === 'care' ? 'care' : 'setup';
  const out = { tab, bike: q.get('bike') || null, open: q.get('open') === '1' };
  // v0.22.0 (AP06): &trip=<id> on Care opens that trip's event preparation.
  if (tab === 'care' && q.get('trip')) out.trip = q.get('trip');
  return out;
}

/** The address for a tab (and bike): the canonical form of the Bikes page. */
export function bikesHash({ tab = 'setup', bike = null, open = false, trip = null } = {}) {
  const q = new URLSearchParams();
  if (tab === 'care') q.set('tab', 'care');
  if (bike) q.set('bike', bike);
  if (open && bike) q.set('open', '1');
  if (trip && tab === 'care') q.set('trip', trip);
  const s = q.toString();
  return `#/bikes${s ? `?${s}` : ''}`;
}
