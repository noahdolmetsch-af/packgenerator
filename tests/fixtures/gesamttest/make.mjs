// Gesamttest (full browser test), round 1: one big fictional data set for the Pack Generator.
//
//   node tests/fixtures/gesamttest/make.mjs [--today YYYY-MM-DD]
//
// writes, next to this file:
//   test_data_gtp_daten.json   a backup file ("Backup importieren" / Import backup → Replace all data)
//   step1.json    a gear import file, step 1 (items + learnings): duplicates, unsure and broken rows
//   step2.json    a gear import file, step 2 (kits, blocks, tasks, old trips) plus a few items again
//   ride-s2.gpx   a recorded 3-day ride (day 1) for the GPX debrief in scenario S2
//
// Deterministic: the same --today gives byte-identical files (seeded random numbers, fixed times).
// Every date is relative to --today (default 2026-10-09), so the specs build the same data for the
// real day with build(today). Every name starts with "test_data_gtp_"; everything is invented.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const P = 'test_data_gtp_';
export const DEFAULT_TODAY = '2026-10-09';
const SCHEMA = 5;

/* ---------- small helpers ---------- */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const at = (iso, hh = 8, mm = 0) => `${iso}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00.000Z`;
const pad = (n, w = 3) => String(n).padStart(w, '0');

/* ---------- word lists (fictional) ---------- */

const BRANDS = ['Alpfink', 'Bergmolch', 'Gamsbock', 'Murmeli', 'Tannzapf', 'Firnbach', 'Gletschli', 'Steinhuhn', 'Arvenholz', 'Bachstelz'];
const COLOURS = [
  ['red', 'rot'],
  ['blue', 'blau'],
  ['black', 'schwarz'],
  ['green', 'grün'],
  ['grey', 'grau'],
  ['orange', 'orange'],
  ['yellow', 'gelb'],
  ['white', 'weiss'],
];

// [en, de, category, zone, layer, tempMin, tempMax, grams, defaultBag]
const CLOTHES = [
  ['Merino shirt short sleeve', 'Merino-Shirt kurzarm', 'onbike', 'torso', 'base', 12, 30, 140, 'body'],
  ['Base layer long sleeve', 'Unterhemd langarm', 'onbike', 'torso', 'base', 0, 15, 180, 'seat'],
  ['Mesh base layer', 'Netzunterhemd', 'onbike', 'torso', 'base', 5, 25, 90, 'body'],
  ['Jersey short sleeve', 'Trikot kurzarm', 'onbike', 'torso', 'base', 15, 35, 130, 'body'],
  ['Jersey long sleeve', 'Trikot langarm', 'onbike', 'torso', 'base', 5, 18, 210, 'body'],
  ['Thermal jersey', 'Thermotrikot', 'onbike', 'torso', 'mid', -5, 10, 320, 'seat'],
  ['Arm warmers', 'Armlinge', 'onbike', 'arms', 'mid', 5, 15, 70, 'top'],
  ['Leg warmers', 'Beinlinge', 'onbike', 'legs', 'mid', 3, 14, 120, 'seat'],
  ['Knee warmers', 'Knielinge', 'onbike', 'legs', 'mid', 8, 16, 80, 'seat'],
  ['Bib shorts', 'Trägerhose kurz', 'onbike', 'legs', 'base', 12, 35, 190, 'body'],
  ['Bib tights', 'Trägerhose lang', 'onbike', 'legs', 'base', -5, 12, 280, 'body'],
  ['Baggy shorts', 'Baggy-Shorts', 'onbike', 'legs', 'base', 12, 32, 240, 'body'],
  ['Fleece pullover', 'Fleecepulli', 'offbike', 'torso', 'mid', -5, 12, 350, 'seat'],
  ['Down jacket', 'Daunenjacke', 'offbike', 'torso', 'mid', -15, 8, 310, 'seat'],
  ['Synthetic vest', 'Kunstfaserweste', 'offbike', 'torso', 'mid', -5, 12, 220, 'seat'],
  ['Hiking trousers', 'Wanderhose', 'offbike', 'legs', 'base', 0, 25, 330, 'seat'],
  ['Camp shorts', 'Lagershorts', 'offbike', 'legs', 'base', 15, 35, 120, 'seat'],
  ['Rain jacket', 'Regenjacke', 'rain', 'torso', 'outer', -5, 20, 260, 'seat'],
  ['Wind vest', 'Windweste', 'rain', 'torso', 'outer', 5, 18, 80, 'top'],
  ['Wind jacket', 'Windjacke', 'rain', 'torso', 'outer', 3, 16, 110, 'seat'],
  ['Rain trousers', 'Regenhose', 'rain', 'legs', 'outer', -5, 18, 210, 'seat'],
  ['Poncho', 'Poncho', 'rain', 'torso', 'outer', 5, 25, 300, 'seat'],
  ['Summer gloves', 'Handschuhe Sommer', 'onbike', 'hands', 'accessory', 12, 35, 50, 'body'],
  ['Winter gloves', 'Handschuhe Winter', 'rain', 'hands', 'accessory', -10, 6, 150, 'seat'],
  ['Overmitts', 'Überhandschuhe', 'rain', 'hands', 'accessory', -10, 8, 60, 'seat'],
  ['Liner gloves', 'Unterziehhandschuhe', 'rain', 'hands', 'accessory', -5, 10, 30, 'top'],
  ['Cycling cap', 'Velokappe', 'onbike', 'head', 'accessory', 8, 30, 40, 'body'],
  ['Beanie', 'Mütze', 'rain', 'head', 'accessory', -15, 8, 50, 'seat'],
  ['Buff', 'Buff', 'onbike', 'neck', 'accessory', -5, 20, 35, 'top'],
  ['Headband', 'Stirnband', 'rain', 'head', 'accessory', -5, 10, 25, 'top'],
  ['Balaclava', 'Sturmhaube', 'rain', 'head', 'accessory', -20, 2, 60, 'seat'],
  ['Sunglasses', 'Sonnenbrille', 'onbike', 'eyes', 'accessory', 5, 35, 30, 'body'],
  ['Merino socks', 'Merinosocken', 'onbike', 'feet', 'accessory', -5, 25, 60, 'body'],
  ['Overshoes', 'Überschuhe', 'rain', 'feet', 'accessory', -10, 8, 140, 'seat'],
  ['Toe covers', 'Zehenschützer', 'rain', 'feet', 'accessory', 2, 12, 50, 'top'],
  ['Bike shoes', 'Veloschuhe', 'shoes', 'feet', 'accessory', -5, 35, 820, 'body'],
  ['Hiking boots', 'Wanderschuhe', 'shoes', 'feet', 'accessory', -10, 25, 1100, 'seat'],
  ['Sandals', 'Sandalen', 'shoes', 'feet', 'accessory', 15, 35, 380, 'seat'],
  ['Camp slippers', 'Hüttenfinken', 'shoes', 'feet', 'accessory', 0, 25, 160, 'seat'],
  ['Sports bra', 'Sport-BH', 'onbike', 'torso', 'base', 0, 35, 60, 'body'],
];

// [en, de, grams, defaultBag, carry]
const GEAR = {
  elec: [
    ['Power bank 10000 mAh', 'Powerbank 10000 mAh', 180, 'top', 'luggage'],
    ['Power bank 20000 mAh', 'Powerbank 20000 mAh', 350, 'frame', 'luggage'],
    ['USB-C cable', 'USB-C-Kabel', 25, 'top', 'luggage'],
    ['Charger dual', 'Ladegerät doppelt', 90, 'seat', 'luggage'],
    ['Bike computer', 'Velocomputer', 130, 'mounted', 'bike'],
    ['Smartwatch', 'Sportuhr', 50, 'body', 'body'],
    ['Phone', 'Handy', 190, 'body', 'body'],
    ['Headphones', 'Kopfhörer', 45, 'top', 'luggage'],
    ['Camera', 'Kamera', 300, 'bar', 'luggage'],
    ['Dynamo charger', 'Dynamo-Lader', 120, 'mounted', 'bike'],
  ],
  light: [
    ['Front light', 'Lampe vorne', 160, 'mounted', 'bike'],
    ['Rear light', 'Rücklicht', 40, 'mounted', 'bike'],
    ['Head torch', 'Stirnlampe', 80, 'top', 'luggage'],
    ['Helmet light', 'Helmlampe', 95, 'body', 'body'],
    ['Lantern', 'Laterne', 110, 'seat', 'luggage'],
    ['Reflector band', 'Reflektorband', 20, 'top', 'luggage'],
  ],
  tools: [
    ['Multitool', 'Multitool', 150, 'frame', 'luggage'],
    ['Mini pump', 'Minipumpe', 110, 'frame', 'luggage'],
    ['Spare tube', 'Ersatzschlauch', 120, 'frame', 'luggage'],
    ['Tubeless plugs', 'Tubeless-Würste', 30, 'top', 'luggage'],
    ['Chain tool', 'Kettennieter', 60, 'frame', 'luggage'],
    ['Quick link', 'Kettenschloss', 5, 'top', 'luggage'],
    ['Tyre levers', 'Reifenheber', 20, 'frame', 'luggage'],
    ['Cable ties', 'Kabelbinder', 15, 'frame', 'luggage'],
    ['Duct tape', 'Panzertape', 40, 'frame', 'luggage'],
    ['Chain oil', 'Kettenöl', 70, 'frame', 'luggage'],
    ['Lock', 'Schloss', 450, 'frame', 'luggage'],
    ['Spoke key', 'Nippelspanner', 15, 'frame', 'luggage'],
  ],
  food: [
    ['Energy bar', 'Energieriegel', 50, 'top', 'luggage'],
    ['Gel', 'Gel', 40, 'top', 'luggage'],
    ['Water bottle 750 ml', 'Trinkflasche 750 ml', 90, 'mounted', 'bike'],
    ['Water bladder 2 L', 'Trinkblase 2 L', 160, 'frame', 'luggage'],
    ['Dried fruit', 'Dörrfrüchte', 150, 'top', 'luggage'],
    ['Trail mix', 'Studentenfutter', 200, 'top', 'luggage'],
    ['Freeze-dried meal', 'Trockenmahlzeit', 130, 'seat', 'luggage'],
    ['Electrolyte tabs', 'Elektrolyt-Tabletten', 60, 'top', 'luggage'],
  ],
  cook: [
    ['Gas stove', 'Gaskocher', 80, 'seat', 'luggage'],
    ['Gas canister 100 g', 'Gaskartusche 100 g', 190, 'seat', 'luggage'],
    ['Titanium pot', 'Titantopf', 110, 'seat', 'luggage'],
    ['Spork', 'Göffel', 15, 'seat', 'luggage'],
    ['Lighter', 'Feuerzeug', 20, 'seat', 'luggage'],
    ['Coffee filter', 'Kaffeefilter', 25, 'seat', 'luggage'],
    ['Folding cup', 'Faltbecher', 40, 'seat', 'luggage'],
  ],
  sleep: [
    ['Tent 1 person', 'Zelt 1 Person', 980, 'bar', 'luggage'],
    ['Bivy bag', 'Biwaksack', 420, 'bar', 'luggage'],
    ['Sleeping bag summer', 'Schlafsack Sommer', 560, 'bar', 'luggage'],
    ['Sleeping bag winter', 'Schlafsack Winter', 1100, 'bar', 'luggage'],
    ['Sleeping mat', 'Schlafmatte', 420, 'bar', 'luggage'],
    ['Pillow', 'Kissen', 60, 'seat', 'luggage'],
    ['Tarp', 'Tarp', 380, 'bar', 'luggage'],
    ['Silk liner', 'Seideninlett', 120, 'seat', 'luggage'],
  ],
  hyg: [
    ['Toothbrush', 'Zahnbürste', 15, 'seat', 'luggage'],
    ['Sun cream', 'Sonnencreme', 60, 'top', 'luggage'],
    ['Chamois cream', 'Sitzcreme', 50, 'seat', 'luggage'],
    ['First aid kit', 'Erste-Hilfe-Set', 180, 'frame', 'luggage'],
    ['Wet wipes', 'Feuchttücher', 70, 'seat', 'luggage'],
    ['Towel', 'Handtuch', 120, 'seat', 'luggage'],
    ['Soap', 'Seife', 40, 'seat', 'luggage'],
    ['Insect repellent', 'Mückenschutz', 60, 'seat', 'luggage'],
  ],
  docs: [
    ['ID card', 'Identitätskarte', 10, 'body', 'body'],
    ['Cash', 'Bargeld', 20, 'body', 'body'],
    ['Credit card', 'Kreditkarte', 5, 'body', 'body'],
    ['Train ticket', 'Bahnbillett', 5, 'top', 'luggage'],
    ['Map', 'Karte', 80, 'top', 'luggage'],
    ['Passport', 'Pass', 40, 'top', 'luggage'],
  ],
  bike: [
    ['Bottle cage', 'Flaschenhalter', 30, 'mounted', 'bike'],
    ['Computer mount', 'Computerhalter', 40, 'mounted', 'bike'],
    ['Light mount', 'Lampenhalter', 25, 'mounted', 'bike'],
    ['Spare derailleur hanger', 'Ersatz-Schaltauge', 20, 'frame', 'luggage'],
    ['Spare brake pads', 'Ersatz-Bremsbeläge', 40, 'frame', 'luggage'],
    ['Bell', 'Glocke', 20, 'mounted', 'bike'],
    ['Kickstand', 'Ständer', 300, 'mounted', 'bike'],
  ],
  lux: [
    ['E-reader', 'E-Reader', 180, 'seat', 'luggage'],
    ['Paperback book', 'Taschenbuch', 220, 'seat', 'luggage'],
    ['Camp chair', 'Campingstuhl', 480, 'bar', 'luggage'],
    ['Playing cards', 'Spielkarten', 70, 'seat', 'luggage'],
    ['Binoculars', 'Feldstecher', 300, 'bar', 'luggage'],
  ],
};

const BAGS = [
  // [key, en, de, slot, volume, grams]
  ['seat6', 'Seat pack 6 L', 'Satteltasche 6 L', 'seat', 6, 290],
  ['seat14', 'Seat pack 14 L', 'Satteltasche 14 L', 'seat', 14, 480],
  ['frameS', 'Frame bag small', 'Rahmentasche klein', 'frame', 3, 180],
  ['frameL', 'Frame bag large', 'Rahmentasche gross', 'frame', 6, 260],
  ['top', 'Top tube bag', 'Oberrohrtasche', 'top', 1, 110],
  ['top2', 'Top tube bag large', 'Oberrohrtasche gross', 'top', 2, 150],
  ['bar9', 'Front roll 9 L', 'Lenkerrolle 9 L', 'bar', 9, 380],
  ['bar14', 'Front roll 14 L', 'Lenkerrolle 14 L', 'bar', 14, 450],
  ['fork', 'Fork cage', 'Gabelhalter', 'fork', null, 120],
  ['pouchL', 'Feed pouch left', 'Futterbeutel links', 'pouchL', 1, 70],
  ['pouchR', 'Feed pouch right', 'Futterbeutel rechts', 'pouchR', 1, 70],
  ['side', 'Side bags', 'Seitentaschen', 'side', 20, 450],
  ['tool', 'Tool bag', 'Werkzeugtasche', 'tool', 1, 90],
  ['hip', 'Hip bag', 'Hüfttasche', 'hip', 2, 160],
];

/* ---------- the data set ---------- */

/**
 * The whole backup for a day (YYYY-MM-DD). Returns the backup object and a summary of what it
 * holds (ids the specs use).
 */
export function build(today = DEFAULT_TODAY) {
  const r = rng(20261009);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const D = (n) => addDays(today, n);
  const created = at(D(-200));

  /* items */
  const items = [];
  const nameUsed = new Set();
  const add = (it) => {
    if (nameUsed.has(it.name)) throw new Error(`duplicate name ${it.name}`);
    nameUsed.add(it.name);
    items.push(it);
    return it;
  };
  const base = (o) => ({
    weightStatus: o.weightG == null ? 'missing' : 'measured',
    qty: 1,
    ownership: 'owned',
    role: null,
    sets: [],
    kits: [],
    domains: ['bikepacking'],
    createdAt: created,
    ...o,
  });

  // bags (14)
  BAGS.forEach(([key, en, de, , , g], n) => {
    add(base({ id: `${P}TA${pad(n + 1)}`, name: `${P} ${en}`, nameDe: `${P} ${de}`, category: 'bags', weightG: g, carry: 'luggage', defaultBag: null, brand: BRANDS[n % BRANDS.length], model: '' }));
  });

  // clothes (200): every type five times (colour and brand differ)
  const clothes = [];
  for (let round = 0; round < 5; round++)
    for (const [en, de, category, zone, layer, tmin, tmax, g, bag] of CLOTHES) {
      const n = clothes.length + 1;
      const [cen, cde] = COLOURS[(round * 3 + n) % COLOURS.length];
      const brand = BRANDS[(n * 7) % BRANDS.length];
      const shift = round - 2; // -2 … +2 °C, so the ranges are not all the same
      const tempMin = tmin + shift;
      const tempMax = tmax + shift;
      const tempClass = tempMax <= 10 ? 'kalt' : tempMin >= 12 ? 'warm' : 'mittel';
      const domains = round === 0 ? ['bikepacking'] : round === 1 ? ['velo', 'everyday'] : round === 2 ? ['bikepacking', 'hiking'] : round === 3 ? ['ski', 'travel'] : ['everyday', 'weekend'];
      clothes.push(
        add(
          base({
            id: `${P}KL${pad(n)}`,
            name: `${P} ${en} ${cen} ${round + 1}`,
            nameDe: `${P} ${de} ${cde} ${round + 1}`,
            brand,
            model: `${brand.slice(0, 3).toUpperCase()}-${100 + n}`,
            category,
            weightG: Math.round(g * (0.85 + r() * 0.3)),
            carry: bag === 'body' ? 'body' : 'luggage',
            defaultBag: bag,
            role: bag === 'body' && round === 0 ? 'worn' : null,
            zone,
            layer,
            tempMin,
            tempMax,
            tempClass,
            domains,
            // a few clothes wait in "Noch einordnen" (no layer or zone)
            ...(n % 37 === 0 ? { layer: null, zone: null } : {}),
          }),
        ),
      );
    }

  // other gear (486): every word list, varied by brand and number until the size is reached
  const cats = Object.keys(GEAR);
  const PREF = { elec: 'EL', light: 'LI', tools: 'WZ', food: 'FD', cook: 'KO', sleep: 'SL', hyg: 'HY', docs: 'DK', bike: 'BK', lux: 'LX' };
  const perCat = Object.fromEntries(cats.map((c) => [c, 0]));
  let k = 0;
  while (items.length < 700) {
    const cat = cats[k % cats.length];
    const list = GEAR[cat];
    const [en, de, g, bag, carry] = list[Math.floor(k / cats.length) % list.length];
    const v = Math.floor(k / (cats.length * list.length)) + 1;
    const brand = BRANDS[(k * 3) % BRANDS.length];
    perCat[cat]++;
    add(
      base({
        id: `${P}${PREF[cat]}${pad(perCat[cat])}`,
        name: `${P} ${en} ${brand} ${v}`,
        nameDe: `${P} ${de} ${brand} ${v}`,
        brand,
        model: '',
        category: cat,
        weightG: Math.round(g * (0.8 + r() * 0.4)),
        carry,
        defaultBag: bag,
        domains: cat === 'docs' ? ['bikepacking', 'travel', 'hiking'] : k % 9 === 0 ? ['velo'] : k % 11 === 0 ? ['bikepacking', 'ski'] : ['bikepacking'],
      }),
    );
    k++;
  }

  // states: 60 unweighed, 30 wishlist, 20 gone (disjoint; never a bag)
  const pool = items.filter((i) => i.category !== 'bags');
  const order = pool.map((i, n) => ({ i, s: (n * 2654435761) % 1000003 })).sort((a, b) => a.s - b.s).map((x) => x.i);
  const unweighed = order.slice(0, 60);
  const wish = order.slice(60, 90);
  const gone = order.slice(90, 110);
  for (const i of unweighed) (i.weightG = null), (i.weightStatus = 'missing'), (i.role = null);
  wish.forEach((i, n) => {
    i.ownership = 'wishlist';
    i.role = null;
    i.priceChf = 20 + n * 7;
    if (n % 3 === 0) i.weightStatus = 'online';
  });
  gone.forEach((i, n) => {
    i.ownership = 'gone';
    i.role = null;
    i.goneAt = at(D(-30 - n));
  });
  // favourites: 40 owned items
  items.filter((i) => i.ownership === 'owned' && i.category !== 'bags').filter((_, n) => n % 15 === 3).slice(0, 40).forEach((i) => (i.favorite = true));

  const owned = (pred) => items.filter((i) => i.ownership === 'owned' && pred(i));
  const byCat = (c) => owned((i) => i.category === c && i.weightG != null);

  // Standard block: always along on a bike trip (tools, phone, docs …)
  const standard = [...byCat('tools').slice(0, 4), ...byCat('docs').slice(0, 3), ...byCat('elec').slice(0, 2), ...byCat('light').slice(0, 2), ...byCat('hyg').slice(0, 1)];
  for (const i of standard) i.sets = [...new Set([...i.sets, 'standard'])];
  // night blocks
  const night = { base: byCat('hyg').slice(1, 5), sleep: byCat('sleep').slice(0, 3), warm: owned((i) => i.layer === 'mid' && i.weightG != null).slice(0, 3), cook: byCat('cook').slice(0, 4), lodging: byCat('hyg').slice(5, 8), firstaid: byCat('hyg').filter((i) => /First aid/.test(i.name)).slice(0, 2) };
  for (const [key, list] of Object.entries(night)) for (const i of list) i.sets = [...new Set([...i.sets, key])];

  /* building blocks (20) and temperature kits (6), settings "sets" */
  const BLOCKS = [
    ['Rain', 'Regen'],
    ['Cold morning', 'Kalter Morgen'],
    ['Long day', 'Langer Tag'],
    ['Repair big', 'Reparatur gross'],
    ['Night ride', 'Nachtfahrt'],
    ['Coffee stop', 'Kaffeehalt'],
    ['Train trip', 'Zugfahrt'],
    ['Hut night', 'Hüttennacht'],
    ['Swim', 'Baden'],
    ['Photo', 'Foto'],
    ['Race kit', 'Rennausrüstung'],
    ['Winter commute', 'Winter-Pendeln'],
    ['Desert water', 'Wasser viel'],
    ['Hiking day', 'Wandertag'],
    ['Ski tour basics', 'Skitour Grundausrüstung'],
    ['City', 'Stadt'],
    ['Bike park', 'Bikepark'],
    ['Family day', 'Familientag'],
    ['Bivouac', 'Biwak'],
    ['Navigation', 'Navigation'],
  ];
  const setsValue = [];
  const blockKeys = [];
  BLOCKS.forEach(([en], n) => {
    const key = `u-test-data-gtp-block-${pad(n + 1, 2)}`;
    blockKeys.push(key);
    setsValue.push({ key, name: `${P} ${en}`, ...(n % 4 === 0 ? { note: `${P} note ${n + 1}` } : {}) });
    const members = owned((i) => i.category !== 'bags').filter((_, m) => (m * 7 + n * 13) % 97 === 0).slice(0, 4 + (n % 5));
    for (const i of members) i.sets = [...new Set([...i.sets, key])];
    if (n === 0 && members.length > 1) setsValue.at(-1).qty = { [members[1].id]: 2 };
  });
  const KITS = [
    ['Kit hot', null, 25, 30, null],
    ['Kit warm', 18, 25, null, null],
    ['Kit mild', 12, 18, null, null],
    ['Kit cool', 6, 12, null, null],
    ['Kit cold', 0, 6, null, null],
    ['Kit freezing', null, 0, null, null],
  ];
  const kitKeys = [];
  KITS.forEach(([en, minC, maxC], n) => {
    const key = `u-test-data-gtp-kit-${n + 1}`;
    kitKeys.push(key);
    const rec = { key, name: `${P} ${en}`, ...(minC != null ? { minC } : {}), ...(maxC != null ? { maxC } : {}), sourceId: `GTP-K${n + 1}` };
    if (en === 'Kit hot') (rec.minC = 25), delete rec.maxC;
    setsValue.push(rec);
    const lo = rec.minC ?? -30;
    const hi = rec.maxC ?? 40;
    // clothes whose range covers the middle of the kit, one per zone and layer at most
    const mid = (lo + hi) / 2;
    const seen = new Set();
    for (const i of clothes) {
      if (i.ownership !== 'owned' || i.layer == null || i.tempMin > mid || i.tempMax < mid) continue;
      const slot = `${i.zone}/${i.layer}`;
      if (seen.has(slot)) continue;
      seen.add(slot);
      i.sets = [...new Set([...i.sets, key])];
    }
  });

  /* bikes (4), containers, visits */
  const containers = BAGS.map(([key, en, , slot, vol], n) => ({ id: `bag-gtp-${key}`, name: `${P} ${en}`, slot, volumeL: vol, itemId: `${P}TA${pad(n + 1)}`, pieces: key === 'side' ? 2 : 1 }));
  const fixtures = byCat('bike').slice(0, 3).map((i) => i.id);
  const hist = (date, km, action, result = 'done', extra = {}) => ({ date, km, action, result, by: 'self', ...extra });
  const parts = (km, due) => [
    { key: 'chain', model: `${P} chain 12s`, history: [hist(D(-200), km - 1800, 'replace', 'done', { value: null }), hist(D(due ? -60 : -6), km - (due ? 420 : 40), 'service')] },
    { key: 'cassette', model: '', history: [hist(D(-400), km - 4000, 'replace')] },
    { key: 'padsF', model: '', history: [hist(D(-40), km - 300, 'check', 'ok', { value: due ? 48 : 80 })] },
    { key: 'padsR', model: '', history: [hist(D(-40), km - 300, 'check', 'ok', { value: 70 })] },
    { key: 'tyres', model: `${P} tyre 2.35`, history: [hist(D(due ? -120 : -20), km - 600, 'service')] },
    { key: 'bolts', model: '', history: [hist(D(-90), km - (due ? 1200 : 300), 'check', 'ok')] },
    { key: 'shifting', model: '', history: [] },
  ];
  const BIKES = [
    { id: `${P}hardtail`, name: `${P} Hardtail Alu 29`, type: 'hardtail', weightG: 11800, km: 6400, slots: ['seat', 'frame', 'top', 'bar', 'cage1', 'cage2', 'pouchL', 'pouchR'], setup: { seat: 'bag-gtp-seat14', frame: 'bag-gtp-frameL', top: 'bag-gtp-top', bar: 'bag-gtp-bar9', cage1: null, cage2: null, pouchL: 'bag-gtp-pouchL', pouchR: 'bag-gtp-pouchR' }, due: true },
    { id: `${P}fully`, name: `${P} Fully Trail 140`, type: 'full', weightG: 13900, km: 3100, slots: ['seat', 'frame', 'top', 'cage1'], setup: { seat: 'bag-gtp-seat6', frame: 'bag-gtp-frameS', top: 'bag-gtp-top2', cage1: null }, due: false },
    { id: `${P}gravel`, name: `${P} Gravel Steel`, type: 'gravel', weightG: 10400, km: 12800, slots: ['seat', 'frame', 'top', 'bar', 'fork', 'cage1', 'cage2', 'tool'], setup: { seat: 'bag-gtp-seat14', frame: 'bag-gtp-frameL', top: 'bag-gtp-top', bar: 'bag-gtp-bar14', fork: 'bag-gtp-fork', cage1: null, cage2: null, tool: 'bag-gtp-tool' }, due: true },
    { id: `${P}road`, name: `${P} Road Carbon`, type: 'road', weightG: 8100, km: 21000, slots: ['seat', 'top', 'cage1', 'cage2'], setup: { seat: 'bag-gtp-seat6', top: 'bag-gtp-top', cage1: null, cage2: null }, due: false },
  ];
  const bikes = BIKES.map((b, n) => ({ id: b.id, name: b.name, type: b.type, weightG: b.weightG, slots: b.slots, setup: b.setup, fixtures: n === 0 ? fixtures : [], km: b.km, kmDate: D(-2 - n), parts: parts(b.km, b.due), createdAt: created }));
  const SHOPS = [`${P} Velo Werkstatt Nord`, `${P} Bike Shop Süd`];
  const visits = [];
  bikes.forEach((b, n) => {
    for (let v = 0; v < 3; v++) {
      const date = D(-30 - v * 95 - n * 11);
      visits.push({
        id: `visit-gtp-${n + 1}-${v + 1}`,
        bikeId: b.id,
        date,
        shop: SHOPS[(n + v) % 2],
        invoice: `GTP-${2026 - v}-${pad(n * 10 + v + 1, 4)}`,
        totalChf: 80 + v * 45 + n * 12,
        km: b.km - 300 - v * 900,
        parts: [
          { part: 'chain', action: v === 0 ? 'replace' : 'check', model: v === 0 ? `${P} chain 12s` : undefined, chf: v === 0 ? 49 : 0 },
          { part: 'bearings', action: 'check' },
          ...(v === 1 ? [{ part: 'brakes', action: 'service', what: `${P} bleed`, chf: 60 }] : []),
        ].map((p) => Object.fromEntries(Object.entries(p).filter(([, x]) => x !== undefined))),
        photos: [],
      });
    }
  });

  /* maintenance: preparation tasks (event and long trips) and repairs */
  const maintenance = [];
  const PREP = ['Check brake pads', 'Charge the lights', 'Wax the chain', 'Check tyre pressure', 'Tighten bolts', 'Update the route', 'Pack spare cleats', 'Check the GPS mount'];
  PREP.forEach((task, n) => maintenance.push({ id: 9500 + n, subject: `${P} setup`, area: 'Preparation', task: `${P} ${task}`, leadWeeks: n % 3, status: 'open' }));
  const REPAIRS = [
    [`${P} Creaking bottom bracket`, 'open', 0],
    [`${P} Rear brake rubs`, 'needed', 0],
    [`${P} Fork seal oily`, 'check', 1],
    [`${P} Bar tape worn`, 'open', 3],
    [`${P} Derailleur hanger bent`, 'done', 2],
    [`${P} Saddle rail creaks`, 'check', 2],
    [`${P} Spoke loose`, 'open', 2],
  ];
  REPAIRS.forEach(([task, status, b], n) => maintenance.push({ id: 9600 + n, subject: bikes[b].name, bikeId: bikes[b].id, area: 'Repair', task, status, ...(status === 'done' ? { statusDate: D(-10) } : {}) }));

  /* trips (30) */
  const trips = [];
  const ofDomain = (d) => owned((i) => i.weightG != null && (d === 'bikepacking' ? i.domains.includes('bikepacking') || i.domains.includes('velo') : i.domains.includes(d)) && i.category !== 'bags');
  const tripId = (n) => `${P}trip${pad(n + 1, 2)}`;
  const PLACES = ['Jura', 'Emmental', 'Toggenburg', 'Engadin', 'Ticino', 'Valais', 'Black Forest', 'Vosges', 'Napf', 'Gotthard', 'Lake Constance', 'Entlebuch'];
  const KINDS = [
    // [title, start offset, days, kind, extra]
    // past (23)
    ...Array.from({ length: 23 }, (_, n) => {
      const kind = ['day', 'tent', 'lodging', 'event', 'day', 'hiking', 'ski', 'travel', 'day', 'tent', 'weekend', 'day'][n % 12];
      const days = kind === 'day' || kind === 'event' ? 1 : kind === 'travel' ? 21 : kind === 'ski' ? 2 : kind === 'hiking' ? 1 : 3;
      return { title: `${PLACES[n % PLACES.length]} ${kind} ${n + 1}`, start: -12 - n * 14 - (kind === 'travel' ? 20 : 0), days, kind, past: true };
    }),
    // running (2)
    { title: 'Running tour 3 days', start: -1, days: 3, kind: 'tent', running: true },
    { title: 'Running day ride', start: 0, days: 1, kind: 'day', running: true },
    // planned (5)
    { title: 'Event Jura 300', start: 10, days: 2, kind: 'event', planned: true },
    { title: 'Bikepacking 3 days tent', start: 5, days: 3, kind: 'tent', planned: true },
    { title: 'Day ride Napf', start: 3, days: 1, kind: 'day', planned: true },
    { title: 'Ski tour Engadin', start: 60, days: 2, kind: 'ski', planned: true },
    { title: 'World trip Asia', start: 120, days: 45, kind: 'travel', planned: true },
  ];
  const debriefs = [];
  const learnings = [];
  const notes = [];
  const rides = [];
  KINDS.forEach((x, n) => {
    const id = tripId(n);
    const startDate = D(x.start);
    const bikeTrip = ['day', 'tent', 'lodging', 'event'].includes(x.kind);
    const domain = bikeTrip ? 'bikepacking' : x.kind === 'travel' ? 'travel' : x.kind;
    const bike = bikeTrip ? bikes[n % bikes.length] : null;
    const overnight = x.kind === 'tent' ? 'outdoor' : x.kind === 'lodging' || (x.kind === 'event' && x.days > 1) || x.kind === 'ski' || x.kind === 'travel' || x.kind === 'weekend' ? 'lodging' : 'none';
    const pool = ofDomain(domain);
    const entries = [];
    const used = new Set();
    const want = bikeTrip ? (x.kind === 'day' ? 14 : 30) : 18;
    const slots = bike ? Object.entries(bike.setup).filter(([, c]) => c).map(([s]) => s) : ['pack', ...(domain === 'ski' || domain === 'hiking' ? [] : ['day'])];
    for (let m = 0; entries.length < want && m < pool.length * 2; m++) {
      const it = pool[(n * 17 + m * 5) % pool.length];
      if (used.has(it.id)) continue;
      used.add(it.id);
      const slot = it.defaultBag === 'body' ? 'body' : bike ? (it.defaultBag === 'mounted' ? 'mounted' : slots.includes(it.defaultBag) ? it.defaultBag : slots[m % slots.length]) : slots[m % slots.length];
      entries.push({ itemId: it.id, slot, qty: it.category === 'food' ? 2 : 1, packed: !!x.past || (x.running && m % 2 === 0) });
    }
    // a past trip keeps one gone item on its list (gone items stay on old trips)
    if (x.past && n < 5) entries.push({ itemId: gone[n].id, slot: 'body', qty: 1, packed: true });
    const trip = {
      id,
      domain,
      title: `${P} ${x.title}`,
      startDate,
      days: x.days,
      bikeId: bike?.id ?? null,
      bike: bike?.name ?? null,
      setup: bike ? { ...bike.setup } : {},
      ...(bike ? {} : { packs: domain === 'ski' || domain === 'hiking' ? [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }] : [{ key: 'pack', name: 'Backpack 60 L', volumeL: 60 }, { key: 'day', name: 'Daypack', volumeL: null }] }),
      entries,
      ready: [
        { id: 'kit', label: 'Helmet, shoes, gloves', done: !!x.past },
        { id: 'wallet', label: 'Phone, wallet, keys', done: !!x.past },
      ],
      hours: x.kind === 'day' ? 4 : x.kind === 'event' ? 8 : 5,
      overnight,
      cook: overnight === 'outdoor',
      wx: { min: [4, 8, 12, 16][n % 4], max: [12, 18, 22, 27][n % 4], rain: ['none', 'showers', 'none', 'rain'][n % 4] },
      event: x.kind === 'event',
      status: 'planned',
      ...(x.past && n % 3 === 0 ? { finished: addDays(startDate, x.days - 1) } : {}),
      ...(x.kind === 'event' ? { place: `${P} Delémont` } : {}),
      createdAt: at(D(Math.min(x.start, 0) - 14)),
    };
    // a route on some bike trips
    if (bike && n % 4 === 1) {
      const line = Array.from({ length: 40 }, (_, p) => [47.2 + p * 0.004, 7.5 + p * 0.006]);
      trip.route = { name: `${P} route ${n + 1}`, km: 60 + n * 3, gainM: 600 + n * 20, lossM: 600 + n * 20, start: { lat: line[0][0], lon: line[0][1] }, end: { lat: line.at(-1)[0], lon: line.at(-1)[1] }, line, profile: line.map((_, p) => [Math.round(p * 1.6 * 100) / 100, 500 + Math.round(Math.sin(p / 5) * 80)]), file: `${P}route-${n + 1}.gpx` };
    }
    if (x.kind === 'event' && x.planned) trip.prep = { 9500: { result: 'done', date: D(-1), by: 'self' } };
    if (n === 10) trip.skipped = true; // one past trip was called off
    trips.push(trip);

    /* debriefs: 21 done + 2 drafts for the past trips, 2 drafts for the running ones */
    if (x.past || x.running) {
      const done = x.past && n < 21;
      const d = {
        tripId: id,
        status: done ? 'done' : 'draft',
        weather: done ? ['colder', 'planned', 'warmer'][n % 3] : null,
        amount: done ? ['little', 'right', 'much'][n % 3] : null,
        bags: done ? (n % 5 === 0 ? 'problems' : 'fine') : null,
        note: done ? `${P} debrief note ${n + 1}` : '',
        items: done ? { [entries[1].itemId]: 'unused', ...(n % 4 === 0 ? { [entries[2].itemId]: 'broken' } : {}) } : {},
        missing: done && n % 3 === 0 ? [{ id: `m-${n}`, name: `${P} missing thing ${n + 1}`, itemId: null }] : [],
        applied: [],
        km: bike ? 40 + n * 6 : null,
        kmApplied: 0,
        ...(done ? { clothing: ['cold', 'fit', 'warm'][n % 3], doneAt: at(addDays(startDate, x.days)) } : {}),
        ...(x.running ? { rideNotes: [{ at: at(D(0), 7, 30), day: 0, text: `${P} ride note on the way ${n + 1}` }] } : {}),
        createdAt: at(addDays(startDate, x.days)),
        updatedAt: at(addDays(startDate, x.days)),
      };
      if (n === 11 && x.past) delete d.items; // one older debrief without items (as an old backup has it)
      debriefs.push(d);
    }
  });
  if (debriefs.length !== 25) throw new Error(`debriefs: ${debriefs.length}`);

  /* learnings (60) */
  const TOPICS = ['Clothing', 'Gear', 'Food', 'Pace', 'Bike', 'Sleep', 'Quick note'];
  for (let n = 0; n < 60; n++) {
    const trip = trips[n % 23];
    const it = trip.entries[n % trip.entries.length];
    learnings.push({
      id: n + 1,
      topic: TOPICS[n % TOPICS.length],
      rule: `${P} learning ${n + 1}: ${['take the warm gloves below 8 °C', 'one bar per hour', 'leave the camp chair at home', 'start before 7 in summer', 'check the tyre pressure the evening before', 'the rain jacket goes on top'][n % 6]}`,
      action: n % 5 === 0 ? `${P} action ${n + 1}` : '',
      itemIds: n % 3 === 0 && it ? [it.itemId] : [],
      source: trip.title,
      appliesTo: ['all'],
      priority: ['low', 'medium', 'high'][n % 3],
      confirmed: n % 4,
      createdAt: at(D(-300 + n * 4)),
    });
  }

  /* notes (40): 25 open, 15 sorted */
  for (let n = 0; n < 40; n++) {
    const open = n < 25;
    const tripRef = n % 5 === 0 ? trips[23] : n % 7 === 0 ? trips[n % 23] : null;
    notes.push({
      id: `note-gtp-${pad(n + 1)}`,
      at: at(D(-n * 3), 9, n % 60),
      text: `${P} note ${n + 1}: ${['brake squeaks', 'buy new tubes', 'the frame bag zip sticks', 'try the other saddle', 'nice café in the valley', 'gloves too thin'][n % 6]}`,
      photo: null,
      page: ['home', 'pack', 'gear', 'bikes'][n % 4],
      tripId: tripRef?.id ?? null,
      bikeId: n % 6 === 0 ? bikes[n % 4].id : null,
      ...(tripRef === trips[23] ? { day: 0 } : {}),
      status: open ? 'open' : 'sorted',
      // the shape notes.js sortNote writes: { kind, label, ref }
      to: open ? null : [{ kind: 'repair', label: `Repair · ${bikes[0].name}`, ref: 9600 }, { kind: 'learning', label: 'Learning', ref: (n % 60) + 1 }, { kind: 'done', label: 'Done', ref: null }][n % 3],
      sortedAt: open ? null : at(D(-n * 3 + 1)),
    });
  }

  /* rides (10), small GPX-derived data */
  for (let n = 0; n < 10; n++) {
    const trip = trips.filter((t) => t.bikeId && t.startDate < today)[n];
    const g = analyse(track({ seed: n + 1, date: trip.startDate, km: 30 + n * 8, pauseMin: n % 3 === 0 ? 25 : 8 }));
    rides.push({
      ...g,
      id: `ride-gtp-${pad(n + 1, 2)}`,
      name: `${P} ride ${n + 1}`,
      file: `${P}ride-${n + 1}.gpx`,
      tripId: n < 8 ? trip.id : null,
      plan: n < 8 ? { km: g.km, gainM: g.gainM, hours: Math.round(g.movingH * 1.1 * 100) / 100, kmh: Math.round((g.km / (g.movingH * 1.1)) * 10) / 10, source: 'hours' } : null,
      basis: { kmh: 18, climbMh: 500 },
      answers: {},
      pace: n % 2 === 0,
      createdAt: at(trip.startDate, 20),
    });
  }

  /* templates (12) */
  const TPL = ['Evening loop', 'Weekend tent', 'Lodging tour', 'Event 24h', 'Commute', 'Gravel day', 'Winter ride', 'Ski tour', 'Hiking day', 'World trip', 'Weekend city', 'Overnighter'];
  const templates = TPL.map((name, n) => {
    const src = trips[n % 23];
    const bike = src.bikeId ? bikes.find((b) => b.id === src.bikeId) : null;
    return {
      id: `tpl-gtp-${pad(n + 1, 2)}`,
      name: `${P} ${name}`,
      domain: src.domain,
      setup: bike ? { ...bike.setup } : {},
      entries: src.entries.filter((e) => items.find((i) => i.id === e.itemId)?.ownership === 'owned').slice(0, 12).map(({ itemId, slot, qty }) => ({ itemId, slot, qty })),
      ready: [{ id: 'kit', label: 'Helmet, shoes, gloves' }],
      ride: null,
      hours: src.hours,
      sets: {},
      purpose: {},
      days: src.days,
      overnight: src.overnight,
      cook: src.overnight === 'outdoor',
      bikeId: bike?.id ?? null,
      fromTrip: n < 4 ? src.id : null,
      createdAt: at(D(-150 + n)),
      updatedAt: at(D(-100 + n)),
    };
  });

  /* logbook events (8) */
  const events = Array.from({ length: 8 }, (_, n) => ({ id: `ev-gtp-${n + 1}`, name: `${P} logbook ride ${n + 1}`, date: n % 3 === 0 ? String(2020 + n) : D(-400 - n * 30), sortDate: n % 3 === 0 ? `${2020 + n}-00` : D(-400 - n * 30), type: 'ride', note: `${P} logbook note ${n + 1}`, source: 'excel' }));

  const settings = [
    { key: 'sets', value: setsValue },
    { key: 'templates', value: templates },
    { key: 'homePlace', value: { name: `${P} Home`, lat: 47.39, lon: 8.04 } },
    { key: 'riderG', value: 72000 },
    ...['layers2026', 'readyClean2026', 'dailyCommuteTemplate', 'stravaKm2026', 'lodgingSet2026', 'kitTemplates2026', 'toolsAlways2026', 'firstAid2026', 'blocks2026'].map((k) => ({ key: `update.${k}`, value: at(D(-100)) })),
  ];

  const data = {
    app: 'pack-generator',
    schemaVersion: SCHEMA,
    exportedAt: at(today, 6),
    tables: { items, kits: [], trips, debriefs, learnings, events, maintenance, bikes, containers, weightChecks: [], settings, visits, photos: [], notes, rides },
  };
  const summary = {
    today,
    items: items.length,
    clothes: clothes.length,
    unweighed: unweighed.length,
    wishlist: wish.length,
    gone: gone.length,
    bikes: bikes.length,
    visits: visits.length,
    trips: trips.length,
    templates: templates.length,
    blocks: blockKeys.length,
    kits: kitKeys.length,
    debriefs: debriefs.length,
    learnings: learnings.length,
    notes: notes.length,
    rides: rides.length,
    tripIds: { past: tripId(0), event: tripId(25), tent: tripId(26), day: tripId(27), ski: tripId(28), travel: tripId(29), running: tripId(23), runningDay: tripId(24) },
    bikeIds: bikes.map((b) => b.id),
    blockKeys,
    kitKeys,
  };
  return { data, summary };
}

/* ---------- a recorded ride (GPX) ---------- */

/** Points of a fictional ride: { lat, lon, ele, t (ms) } every 30 s, with one pause. */
export function track({ seed = 1, date, km = 40, pauseMin = 8, startHour = 8, lat0 = 47.3, lon0 = 7.6 }) {
  const r = rng(seed * 7919);
  const pts = [];
  const step = 0.25; // km per point (30 km/h … no: 30 s at ~18 km/h ≈ 0.15 km; a bit faster is fine)
  const n = Math.max(10, Math.round(km / step));
  let t = Date.parse(`${date}T${String(startHour - 2).padStart(2, '0')}:00:00Z`); // 08:00 Zurich in summer ≈ 06:00Z
  let lat = lat0;
  let lon = lon0;
  let ele = 450;
  const heading = r() * Math.PI * 2;
  for (let k = 0; k <= n; k++) {
    pts.push({ lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, ele: Math.round(ele * 10) / 10, t });
    if (k === Math.floor(n / 2)) for (let m = 1; m <= pauseMin * 2; m++) pts.push({ lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, ele: Math.round(ele * 10) / 10, t: (t += 30000) });
    const h = heading + Math.sin(k / 9) * 0.6;
    lat += (Math.cos(h) * step) / 111.2;
    lon += (Math.sin(h) * step) / (111.2 * Math.cos((lat * Math.PI) / 180));
    ele += Math.sin(k / 12) * 6 + (r() - 0.5) * 2;
    t += 50000; // 0.25 km in 50 s = 18 km/h
  }
  return pts;
}

/** The track as GPX text. */
export function gpxText(pts, name) {
  const rows = pts.map((p) => `<trkpt lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele><time>${new Date(p.t).toISOString()}</time></trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="test_data_gtp_" xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>${name}</name><trkseg>\n${rows}\n</trkseg></trk>\n</gpx>\n`;
}

const R = 6371;
const dist = (a, b) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

/** The stored numbers of a ride (the shape gpx.js analyseRide gives), worked out simply. */
function analyse(pts) {
  let km = 0;
  let gain = 0;
  let loss = 0;
  let pauseMs = 0;
  const pauses = [];
  let ref = pts[0].ele;
  let still = 0;
  for (let k = 1; k < pts.length; k++) {
    const d = dist(pts[k - 1], pts[k]);
    if (d < 0.001) still += pts[k].t - pts[k - 1].t;
    else {
      if (still >= 5 * 60000) (pauseMs += still), pauses.push({ km: r1(km), at: new Date(pts[k - 1].t - still).toISOString(), min: Math.round(still / 60000) });
      still = 0;
    }
    km += d;
    const e = pts[k].ele - ref;
    if (e >= 3) (gain += e), (ref = pts[k].ele);
    else if (e <= -3) (loss -= e), (ref = pts[k].ele);
  }
  const totalMs = pts.at(-1).t - pts[0].t;
  const moving = pts.filter((p, k) => !k || dist(pts[k - 1], p) >= 0.001);
  const stepN = Math.max(1, Math.ceil(moving.length / 120));
  const line = moving.filter((_, k) => k % stepN === 0).map((p) => [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5]);
  let acc = 0;
  const profile = moving.map((p, k) => ((acc += k ? dist(moving[k - 1], p) : 0), [r2(acc), Math.round(p.ele)])).filter((_, k) => k % stepN === 0);
  const startAt = new Date(pts[0].t).toISOString();
  return {
    date: startAt.slice(0, 10),
    startAt,
    km: r1(km),
    gainM: Math.round(gain),
    lossM: Math.round(loss),
    totalH: r2(totalMs / 36e5),
    pauseH: r2(pauseMs / 36e5),
    movingH: r2((totalMs - pauseMs) / 36e5),
    pauses,
    parts: { climb: { km: r1(km * 0.3), gainM: Math.round(gain * 0.8), h: r2((totalMs - pauseMs) / 36e5 * 0.4) }, flat: { km: r1(km * 0.5), h: r2((totalMs - pauseMs) / 36e5 * 0.45) } },
    line,
    profile,
    start: { lat: line[0][0], lon: line[0][1] },
    end: { lat: line.at(-1)[0], lon: line.at(-1)[1] },
  };
}

/* ---------- the gear import files ---------- */

/** Step 1: items and learnings, with duplicates (same row twice), near duplicates, unsure and broken rows. */
export function step1() {
  const items = [];
  const row = (n, o) => items.push({ sourceId: `GTP-M${pad(n, 4)}`, mergedIds: [], qty: 1, owned: true, optional: false, rule: '', notes: '', ...o });
  const list = [
    ['rain', 'Regenjacke leicht', 'outer', 'torso', -2, 18, 240, ['Velo', 'Wandern']],
    ['onbike', 'Trikot kurzarm', 'base', 'torso', 15, 32, 130, ['Velo']],
    ['onbike', 'Trägerhose kurz', 'base', 'legs', 14, 32, 190, ['Velo']],
    ['onbike', 'Armlinge', 'mid', 'arms', 6, 15, 70, ['Velo']],
    ['onbike', 'Beinlinge', 'mid', 'legs', 3, 14, 120, ['Velo']],
    ['rain', 'Windweste', 'outer', 'torso', 6, 18, 80, ['Velo', 'Alltag']],
    ['rain', 'Handschuhe Winter', 'accessory', 'hands', -10, 6, 150, ['Velo', 'Ski']],
    ['onbike', 'Handschuhe Sommer', 'accessory', 'hands', 12, 35, 50, ['Velo']],
    ['shoes', 'Veloschuhe', 'accessory', 'feet', -5, 35, 820, ['Velo']],
    ['offbike', 'Daunenjacke', 'mid', 'torso', -15, 8, 310, ['Reisen', 'Ski']],
    ['tools', 'Multitool', '', '', null, null, 150, ['Velo']],
    ['tools', 'Minipumpe', '', '', null, null, 110, ['Velo']],
    ['tools', 'Ersatzschlauch 29"', '', '', null, null, 120, ['Velo']],
    ['elec', 'Powerbank 10000 mAh', '', '', null, null, 180, ['Velo', 'Reisen']],
    ['light', 'Lampe vorne', '', '', null, null, 160, ['Velo']],
    ['light', 'Rücklicht', '', '', null, null, 40, ['Velo']],
    ['sleep', 'Schlafsack Sommer', '', '', null, null, 560, ['Velo', 'Wandern']],
    ['sleep', 'Schlafmatte', '', '', null, null, 420, ['Velo']],
    ['sleep', 'Zelt 1 Person', '', '', null, null, 980, ['Velo']],
    ['cook', 'Gaskocher', '', '', null, null, 80, ['Velo', 'Wandern']],
    ['hyg', 'Sonnencreme', '', '', null, null, 60, ['Alltag']],
    ['hyg', 'Erste-Hilfe-Set', '', '', null, null, 180, ['Velo']],
    ['docs', 'Identitätskarte', '', '', null, null, 10, ['Reisen']],
    ['food', 'Trinkflasche 750 ml', '', '', null, null, 90, ['Velo']],
    ['bags', 'Satteltasche 14 L', '', '', null, null, 480, ['Velo']],
    ['bags', 'Rahmentasche gross', '', '', null, null, 260, ['Velo']],
    ['bags', 'Oberrohrtasche', '', '', null, null, 110, ['Velo']],
    ['offbike', 'Wanderhose', 'base', 'legs', 0, 25, 330, ['Wandern']],
    ['rain', 'Mütze', 'accessory', 'head', -15, 8, 50, ['Ski', 'Alltag']],
    ['onbike', 'Merinosocken', 'accessory', 'feet', -5, 25, 60, ['Velo', 'Wandern']],
  ];
  list.forEach(([category, name, layer, zone, tempMin, tempMax, weightG, areas], n) =>
    row(n + 1, { category, name: `${P}${name}`, layer, zone, tempMin, tempMax, tempClass: tempMax == null ? '' : tempMax <= 10 ? 'kalt' : (tempMin ?? 0) >= 12 ? 'warm' : 'mittel', weightG, areas }),
  );
  // duplicates: the same row twice (another sourceId), and near duplicates (typo, other word order)
  row(101, { category: 'tools', name: `${P}Multitool`, weightG: 150, areas: ['Velo'] });
  row(102, { category: 'light', name: `${P}Lampe vorne`, weightG: 165, areas: ['Velo'] });
  row(103, { category: 'rain', name: `${P}Regenjacke leicht`, layer: 'outer', zone: 'torso', tempMin: -2, tempMax: 18, weightG: 240, areas: ['Velo'] });
  row(104, { category: 'tools', name: `${P}Mini Pumpe`, weightG: 110, areas: ['Velo'] });
  row(105, { category: 'sleep', name: `${P}Schlafsack Somer`, weightG: 560, areas: ['Velo'] });
  row(106, { category: 'elec', name: `${P}Powerbank 20000 mAh`, weightG: 350, areas: ['Velo'] });
  // wishlist and optional rows
  row(110, { category: 'lux', name: `${P}Packraft`, weightG: 2400, areas: ['Reisen'], owned: false, optional: true });
  row(111, { category: 'sleep', name: `${P}Ultraleicht-Zelt`, weightG: 690, areas: ['Velo'], owned: false });
  // broken rows: no name, a weight that is text, an unknown category, areas not a list, temperatures as words, a negative quantity
  row(120, { category: 'tools', name: '', weightG: 50, areas: ['Velo'] });
  row(121, { category: 'tools', name: `${P}Kettenöl`, weightG: 'ca. 70 g', areas: ['Velo'] });
  row(122, { category: 'xyz-unbekannt', name: `${P}Seltsames Ding`, weightG: 33, areas: ['Velo'] });
  row(123, { category: 'hyg', name: `${P}Zahnbürste`, weightG: 15, areas: 'Velo, Reisen' });
  row(124, { category: 'onbike', name: `${P}Thermotrikot`, layer: 'MID', zone: 'Oberkörper', tempMin: 'kalt', tempMax: '12', weightG: 320, areas: ['Velo'] });
  row(125, { category: 'docs', name: `${P}Bargeld`, qty: -2, weightG: 20, areas: ['Reisen'] });
  row(126, { category: 'tools', name: `   ${P}Reifenheber   `, weightG: 0, areas: ['Velo'] });
  return {
    kind: 'gear-import',
    version: 1,
    created: '2026-10-01',
    items,
    learnings: [
      { sourceId: 'GTP-L01', date: '2021-06-12', topic: `${P} Kleidung`, text: `${P} Bei Regen zuerst die Hände schützen`, condition: 'unter 10 °C', recommendation: 'Überhandschuhe', exceptions: '', reason: 'kalte Finger' },
      { sourceId: 'GTP-L02', date: '', topic: `${P} Schlafen`, text: `${P} Matte vor der Tour testen`, condition: '', recommendation: '', exceptions: '', reason: '' },
      { sourceId: 'GTP-L03', date: '2024', topic: `${P} Essen`, text: `${P} Pro Stunde ein Riegel`, condition: '', recommendation: '', exceptions: '', reason: '' },
      { sourceId: 'GTP-L01', date: '2021-06-12', topic: `${P} Kleidung`, text: `${P} Bei Regen zuerst die Hände schützen`, condition: '', recommendation: '', exceptions: '', reason: '' },
    ],
  };
}

/** Step 2: kits, blocks, tasks and old trips, and the step-1 items again (a re-import changes nothing twice) plus unsure rows. */
export function step2() {
  const s1 = step1();
  const items = s1.items.filter((i) => String(i.name).trim()).slice(0, 30);
  items.push({ sourceId: 'GTP-M0201', mergedIds: [], category: 'rain', name: `${P}Regenjacke leicht Pro`, qty: 1, areas: ['Velo'], owned: true, optional: false, weightG: 250, notes: '' });
  items.push({ sourceId: 'GTP-M0202', mergedIds: [], category: 'sleep', name: `${P}Schlafmatte kurz`, qty: 1, areas: ['Velo'], owned: true, optional: false, weightG: 330, notes: '' });
  items.push({ sourceId: 'GTP-M0203', mergedIds: [], category: 'tools', name: `${P}Werkzeug Multi`, qty: 1, areas: ['Velo'], owned: true, optional: false, weightG: 150, notes: '' });
  const ids = (...n) => n.map((x) => `GTP-M${pad(x, 4)}`);
  return {
    kind: 'gear-import',
    version: 1,
    created: '2026-10-05',
    items,
    learnings: [],
    kits: [
      { id: 'GTP-K1', name: `${P}Kit heiss`, minC: 25, maxC: null, items: ids(2, 3, 8), note: '' },
      { id: 'GTP-K2', name: `${P}Kit mild`, minC: 10, maxC: 18, items: ids(2, 3, 4, 6), note: '' },
      { id: 'GTP-K3', name: `${P}Kit kalt`, minC: null, maxC: 5, items: ids(7, 10, 29, 5), note: `${P}lange Abfahrten` },
      { id: 'GTP-K4', name: `${P}Kit verkehrt`, minC: 20, maxC: 8, items: ids(1, 999), note: '' },
      { id: 'GTP-K4', name: `${P}Kit doppelt`, minC: 0, maxC: 8, items: ids(1), note: '' },
    ],
    blocks: [
      { id: 'GTP-F01', name: `${P}Reparatur`, items: ids(11, 12, 13), note: '' },
      { id: 'GTP-B01', name: `${P}Nacht draussen`, items: ids(17, 18, 19, 20), note: '' },
      { id: 'GTP-B02', name: `${P}Nacht draussen 2`, items: ids(17, 18, 19), note: '' },
      { id: 'GTP-B03', name: '', items: [], note: '' },
      { id: 'GTP-B04', name: `${P}Unbekannte Teile`, items: ['GTP-NOPE-1', 'GTP-NOPE-2'], note: '' },
    ],
    tasks: [
      { id: 'GTP-A001', text: `${P}Kette wachsen`, group: 'Velo' },
      { id: 'GTP-A002', text: `${P}Licht laden`, group: 'Velo' },
      { id: 'GTP-A003', text: `${P}Route aufs Gerät`, group: 'Navigation' },
      { id: 'GTP-A004', text: '', group: '' },
    ],
    oldTrips: [
      { id: 'GTP-T001', name: `${P}Alpenrunde`, date: '2023', note: `${P}vor der App` },
      { id: 'GTP-T002', name: `${P}Juratour`, date: '2024-06-15', note: '' },
      { id: 'GTP-T003', name: `${P}ohne Datum`, date: null, note: '' },
    ],
  };
}

/* ---------- write the files ---------- */

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf('--today');
  const today = i > 0 ? process.argv[i + 1] : DEFAULT_TODAY;
  const dir = new URL('./', import.meta.url);
  const { data, summary } = build(today);
  writeFileSync(new URL('test_data_gtp_daten.json', dir), `${JSON.stringify(data, null, 1)}\n`);
  writeFileSync(new URL('step1.json', dir), `${JSON.stringify(step1(), null, 1)}\n`);
  writeFileSync(new URL('step2.json', dir), `${JSON.stringify(step2(), null, 1)}\n`);
  const s2 = build(today).data.tables.trips.find((t) => t.id === summary.tripIds.tent);
  writeFileSync(new URL('ride-s2.gpx', dir), gpxText(track({ seed: 42, date: s2.startDate, km: 55, pauseMin: 30 }), `${P} S2 day 1`));
  const counts = Object.fromEntries(Object.entries(data.tables).map(([k, v]) => [k, v.length]));
  console.log(JSON.stringify({ ...summary, tables: counts, tripIds: undefined, bikeIds: undefined, blockKeys: undefined, kitKeys: undefined }));
}
