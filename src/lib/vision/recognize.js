/**
 * Paket L2 «Packliste per Foto» (Noah 19.10.2026 «1 a und b möglich mit umschalten des modus 2a»):
 * the pure part of the recognition. The engine (engine.js) says what it sees in English words
 * («bottle», «sleeping bag»); here those words meet the person's own gear:
 *   1. a thing the person taught («Was ist das?») is found again by its fingerprint (learned),
 *   2. else the seen word is looked up in the gear names (GEAR_LABELS: words in German and English),
 *   3. else it stays open and the app asks «Was ist das?».
 * Everything is a suggestion: the person ticks or adds only what they confirm.
 * Tested in tests/bilderkennung.test.js.
 */
import { fold } from '../gearimport.js';

/**
 * What the device models can name (COCO objects and ImageNet classes) that is gear on a trip.
 * keys: the engine's words (lower case; a key matches a whole word of the label);
 * en: the suggested name (English key for t()); words: folded words that find it in a gear name.
 */
export const GEAR_LABELS = [
  { keys: ['backpack', 'rucksack', 'knapsack'], en: 'Backpack', words: ['rucksack', 'backpack', 'daypack'] },
  { keys: ['handbag', 'purse', 'mailbag'], en: 'Bag', words: ['tasche', 'bag', 'beutel'] },
  { keys: ['suitcase'], en: 'Suitcase', words: ['koffer', 'suitcase', 'trolley'] },
  { keys: ['water bottle', 'water jug', 'bottle', 'pop bottle', 'wine bottle', 'beer bottle'], en: 'Water bottle', words: ['flasche', 'bottle', 'bidon', 'trinkflasche'] },
  { keys: ['cup', 'coffee mug', 'mug'], en: 'Mug', words: ['tasse', 'becher', 'mug', 'cup'] },
  { keys: ['bowl', 'mixing bowl', 'soup bowl'], en: 'Bowl', words: ['schussel', 'bowl', 'napf'] },
  { keys: ['wok', 'frying pan', 'dutch oven', 'caldron', 'pot', 'crock pot'], en: 'Cooking pot', words: ['topf', 'pfanne', 'pot', 'kochtopf', 'kochset', 'pan'] },
  { keys: ['spoon', 'wooden spoon', 'ladle'], en: 'Spoon', words: ['loffel', 'spork', 'spoon', 'besteck'] },
  { keys: ['fork'], en: 'Fork', words: ['gabel', 'fork', 'besteck', 'spork'] },
  { keys: ['knife', 'cleaver', 'letter opener'], en: 'Knife', words: ['messer', 'knife', 'taschenmesser', 'sackmesser'] },
  { keys: ['scissors'], en: 'Scissors', words: ['schere', 'scissors'] },
  { keys: ['cell phone', 'cellular telephone', 'ipod', 'hand-held computer'], en: 'Phone', words: ['handy', 'phone', 'smartphone', 'telefon'] },
  { keys: ['laptop', 'notebook'], en: 'Laptop', words: ['laptop', 'notebook'] },
  { keys: ['book', 'comic book'], en: 'Book', words: ['buch', 'book', 'roman', 'reisefuhrer'] },
  { keys: ['umbrella'], en: 'Umbrella', words: ['schirm', 'umbrella', 'regenschirm'] },
  { keys: ['poncho', 'raincoat'], en: 'Rain jacket', words: ['regenjacke', 'poncho', 'rain', 'regen'] },
  { keys: ['toothbrush'], en: 'Toothbrush', words: ['zahnburste', 'toothbrush', 'zahn'] },
  { keys: ['hair drier'], en: 'Hair dryer', words: ['fohn', 'hair'] },
  { keys: ['sleeping bag'], en: 'Sleeping bag', words: ['schlafsack', 'sleeping bag', 'quilt'] },
  { keys: ['mountain tent', 'tent'], en: 'Tent', words: ['zelt', 'tent', 'tarp', 'biwak'] },
  { keys: ['crash helmet', 'football helmet', 'helmet'], en: 'Helmet', words: ['helm', 'helmet'] },
  { keys: ['sunglasses', 'sunglass', 'dark glasses'], en: 'Sunglasses', words: ['sonnenbrille', 'brille', 'glasses'] },
  { keys: ['running shoe', 'sneaker'], en: 'Shoes', words: ['schuh', 'schuhe', 'shoe', 'sneaker', 'turnschuh'] },
  { keys: ['clog', 'sandal', 'flip-flop'], en: 'Sandals', words: ['sandale', 'sandalen', 'flip', 'slipper', 'finken'] },
  { keys: ['cowboy boot', 'boot'], en: 'Boots', words: ['stiefel', 'boot', 'wanderschuh'] },
  { keys: ['sock', 'christmas stocking'], en: 'Socks', words: ['socke', 'socken', 'sock'] },
  { keys: ['mitten', 'glove'], en: 'Gloves', words: ['handschuh', 'handschuhe', 'glove', 'gloves'] },
  { keys: ['ski mask', 'balaclava'], en: 'Balaclava', words: ['sturmhaube', 'balaclava', 'buff', 'mutze'] },
  { keys: ['cardigan', 'sweatshirt', 'pullover', 'jersey'], en: 'Sweater', words: ['pulli', 'pullover', 'fleece', 'trikot', 'jersey', 'shirt', 'midlayer'] },
  { keys: ['jean', 'jeans', 'swimming trunks', 'miniskirt'], en: 'Trousers', words: ['hose', 'shorts', 'trousers', 'pants', 'badehose'] },
  { keys: ['trench coat', 'fur coat', 'lab coat', 'jacket'], en: 'Jacket', words: ['jacke', 'jacket', 'daunenjacke', 'windjacke'] },
  { keys: ['cap', 'sombrero', 'cowboy hat', 'bonnet', 'hat'], en: 'Cap', words: ['mutze', 'kappe', 'cap', 'hut', 'hat'] },
  { keys: ['torch', 'flashlight', 'spotlight'], en: 'Torch', words: ['lampe', 'stirnlampe', 'taschenlampe', 'licht', 'light', 'headlamp'] },
  { keys: ['lighter', 'matchstick'], en: 'Lighter', words: ['feuerzeug', 'zundholzer', 'lighter', 'streichholzer'] },
  { keys: ['band aid', 'first aid'], en: 'First aid kit', words: ['apotheke', 'pflaster', 'erste hilfe', 'first aid'] },
  { keys: ['lotion', 'sunscreen', 'hand blower', 'perfume'], en: 'Sun cream', words: ['sonnencreme', 'creme', 'lotion', 'sunscreen'] },
  { keys: ['toilet tissue', 'paper towel'], en: 'Toilet paper', words: ['wc', 'toilettenpapier', 'tissue', 'taschentucher'] },
  { keys: ['bath towel', 'towel', 'dishrag'], en: 'Towel', words: ['tuch', 'handtuch', 'towel', 'badetuch'] },
  { keys: ['wallet', 'purse'], en: 'Wallet', words: ['portemonnaie', 'geldbeutel', 'wallet', 'portmonee'] },
  { keys: ['digital watch', 'analog clock', 'stopwatch', 'wall clock'], en: 'Watch', words: ['uhr', 'watch', 'garmin', 'fitbit'] },
  { keys: ['padlock', 'combination lock', 'chain'], en: 'Lock', words: ['schloss', 'lock', 'veloschloss'] },
  { keys: ['screwdriver', 'wrench', 'hammer', 'power drill', 'hatchet'], en: 'Tool', words: ['werkzeug', 'tool', 'multitool', 'schraubenzieher', 'inbus'] },
  { keys: ['carabiner', 'safety pin', 'buckle'], en: 'Carabiner', words: ['karabiner', 'carabiner'] },
  { keys: ['whistle'], en: 'Whistle', words: ['pfeife', 'whistle'] },
  { keys: ['binoculars'], en: 'Binoculars', words: ['feldstecher', 'fernglas', 'binoculars'] },
  { keys: ['magnetic compass'], en: 'Compass', words: ['kompass', 'compass'] },
  { keys: ['camera', 'reflex camera', 'polaroid camera'], en: 'Camera', words: ['kamera', 'camera', 'fotoapparat'] },
  { keys: ['ballpoint', 'fountain pen', 'pencil box'], en: 'Pen', words: ['stift', 'kuli', 'pen'] },
  { keys: ['banana', 'apple', 'orange', 'sandwich', 'pretzel', 'bagel', 'granny smith'], en: 'Food', words: ['essen', 'riegel', 'proviant', 'snack', 'food', 'verpflegung'] },
  { keys: ['bicycle', 'mountain bike', 'bicycle-built-for-two'], en: 'Bike', words: ['velo', 'bike', 'fahrrad'] },
  { keys: ['remote', 'remote control', 'mouse', 'power bank'], en: 'Power bank', words: ['powerbank', 'akku', 'ladegerat', 'charger', 'kabel'] },
];

const words = (s) => ` ${fold(s).replace(/[^a-z0-9]+/g, ' ').trim()} `;

/** The gear label of an engine word («water bottle» → the bottle row), or null. */
export function labelInfo(label) {
  const w = words(label);
  if (w.trim() === '') return null;
  return GEAR_LABELS.find((g) => g.keys.some((k) => w.includes(` ${k} `))) ?? null;
}

/** The best of the given items for a gear label: the first whose name holds one of its words. */
export function itemForLabel(info, items) {
  if (!info) return null;
  for (const w of info.words) {
    const hit = items.find((it) => words(it.name).includes(` ${w} `)) ?? items.find((it) => fold(it.name).includes(w));
    if (hit) return hit;
  }
  return null;
}

/* ---------- fingerprints («Was ist das?», only on this device) ---------- */

/** A fingerprint as small whole numbers (−127…127), to keep in the device's memory. */
export const packEmb = (v) => Array.from(v ?? [], (x) => Math.max(-127, Math.min(127, Math.round(x * 127))));

/** Likeness of two fingerprints, −1…1 (1 = the same). Works with packed and plain ones. */
export function likeness(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return -1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : -1;
}

/** How alike a taught thing must be to count as found again. */
export const SAME = 0.82;

/** The taught thing most like this fingerprint (at least SAME), or null. known: [{ emb, itemId, name }]. */
export function nearestKnown(emb, known, min = SAME) {
  let best = null;
  for (const k of known ?? []) {
    const s = likeness(emb, k.emb);
    if (s >= min && (!best || s > best.score)) best = { ...k, score: s };
  }
  return best;
}

/** At most this many taught things are kept (the oldest go first). */
export const KNOWN_MAX = 300;

/** The taught list with one more answer (the newest first). */
export function teach(known, { emb, itemId = null, name = '', label = '' }, now = new Date().toISOString()) {
  const row = { id: `k${Date.parse(now) || Date.now()}${Math.random().toString(36).slice(2, 6)}`, emb: packEmb(emb), itemId: itemId || null, name: String(name ?? '').trim(), label: String(label ?? ''), at: now };
  return [row, ...(known ?? [])].slice(0, KNOWN_MAX);
}

/* ---------- one photo ---------- */

/**
 * What a region of the photo is, against the given items.
 * region: { label, cls: [{label, score}], emb }; items: the items it may be (the open packing list, or all gear).
 * → { itemId, name, by: 'learned'|'label'|null, info, known } (known: a taught name without an item).
 */
export function resolveRegion(region, items, known) {
  const byId = new Map(items.map((it) => [it.id, it]));
  const k = region.emb ? nearestKnown(region.emb, known) : null;
  if (k?.itemId && byId.has(k.itemId)) return { itemId: k.itemId, name: byId.get(k.itemId).name, by: 'learned', info: null, known: k };
  const labels = region.grid ? [] : [region.label, ...(region.cls ?? []).filter((c) => c.score >= 0.2).map((c) => c.label)].filter(Boolean);
  const infos = labels.map(labelInfo).filter(Boolean);
  if (k && !k.itemId && k.name) return { itemId: null, name: k.name, by: 'learned', info: infos[0] ?? null, known: k };
  for (const info of infos) {
    const it = itemForLabel(info, items);
    if (it) return { itemId: it.id, name: it.name, by: 'label', info, known: null };
  }
  return { itemId: null, name: '', by: null, info: infos[0] ?? null, known: k?.itemId ? k : null };
}

/**
 * Packliste «Abhaken» (mode tick): the regions against the trip's list.
 * entries: the trip's entries; items: all gear. → { tick: [{ itemId, name, by, region }], packed: [names], other: [names], ask: [region] }
 *   tick: on the list and not packed yet (suggested, the person confirms); packed: already ticked;
 *   other: seen gear that is not on this list; ask: not recognised («Was ist das?»).
 */
export function matchTick(regions, entries, items, known) {
  const onList = new Set((entries ?? []).map((e) => e.itemId));
  const packed = new Set((entries ?? []).filter((e) => e.packed).map((e) => e.itemId));
  const listItems = items.filter((it) => onList.has(it.id));
  const tick = [];
  const was = [];
  const other = [];
  const ask = [];
  for (const r of regions) {
    const hit = resolveRegion(r, listItems, known);
    if (hit.itemId) {
      if (packed.has(hit.itemId)) was.includes(hit.name) || was.push(hit.name);
      else if (!tick.some((x) => x.itemId === hit.itemId)) tick.push({ itemId: hit.itemId, name: hit.name, by: hit.by, region: r });
      continue;
    }
    const any = resolveRegion(r, items, known);
    if (any.itemId || any.name) {
      if (!other.includes(any.name)) other.push(any.name);
    } else if (r.ask !== false) ask.push(r);
  }
  return { tick, packed: was, other, ask };
}

/**
 * Packliste «Neu erfassen» (mode new): what on the photo is not in the gear yet.
 * → { have: [{ itemId, name }], add: [{ name, nameKey, region }], ask: [region] }
 *   nameKey: an English key for t() when the name is the app's suggestion; '' for a name the person typed.
 */
export function matchNew(regions, items, known) {
  const have = [];
  const add = [];
  const ask = [];
  for (const r of regions) {
    const hit = resolveRegion(r, items, known);
    if (hit.itemId) {
      if (!have.some((x) => x.itemId === hit.itemId)) have.push({ itemId: hit.itemId, name: hit.name });
    } else if (hit.name) {
      if (!add.some((x) => fold(x.name) === fold(hit.name))) add.push({ name: hit.name, nameKey: '', region: r });
    } else if (hit.info) {
      if (!add.some((x) => x.nameKey === hit.info.en)) add.push({ name: '', nameKey: hit.info.en, region: r });
    } else if (r.ask !== false) ask.push(r);
  }
  return { have, add, ask };
}

/**
 * The parts of a photo to look at: each thing the detector found, plus a 2×2 and 3×3 grid (only to find
 * taught things again; a grid part is never asked about). w, h: the photo's size in pixels.
 */
export function regionsOf(dets, w, h) {
  const out = (dets ?? []).map((d) => ({ box: d.box, label: d.label, score: d.score, ask: true }));
  for (const n of [2, 3]) {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push({ box: { x: (i * w) / n, y: (j * h) / n, w: w / n, h: h / n }, label: '', score: 0, ask: false, grid: true });
  }
  return out;
}
