/**
 * v0.42.0 "Excel Schritt 2 und Kleiderschrank" (Noah, picture draft answers 1-6, 12).
 *
 * The wardrobe (#/wardrobe): every piece of clothing grouped by LAYER (base, mid, outer, accessory)
 * and then by body ZONE (upper body, legs, hands, head, feet). The fields come from the 0.36 gear
 * import (item.layer, item.zone, item.tempMin, item.tempMax, item.tempClass; see gearimport.js).
 * Clothes without a layer or a zone wait in "Noch einordnen" with a guess from the name.
 *
 * The onion check in Pack (answer 2, 3, 12): for the coldest riding hour of the trip, which layer
 * and zone is covered by what is on the list, and the best owned item for a gap.
 *
 * Temperature kits (answer 4, 5): building blocks with a range (set record minC / maxC, see sets.js).
 * Pack suggests the kit for the coldest riding hour (no hourly data: the minimum temperature).
 * When two kits fit, the colder one wins (the safe side).
 *
 * The clothing row of the debrief (answer 6): "Too cold | Fitted | Too warm" per trip, stored as
 * debrief.clothing. Over the debriefs it shifts the kit borders by 1 °C per answer, at most ±3 °C,
 * kept in the settings record CLOTHING_OFFSET. A positive offset means "you run cold": the
 * temperature counts as that much colder.
 *
 * Pure functions only (no database, no screen), so they are easy to test.
 */
import { isInventory, itemWeight } from './gear.js';
import { itemDomains, inDomain, BIKEPACKING } from './domains.js';
import { rainOf } from './layers.js';
import { fold } from './gearimport.js';

/** The layers, inside out. name / sub: English keys for t(). */
export const LAYERS = [
  { key: 'base', name: 'Base|layer', sub: 'next to the skin' },
  { key: 'mid', name: 'Mid|layer', sub: 'keeps you warm' },
  { key: 'outer', name: 'Outer|layer', sub: 'wind and rain' },
  { key: 'accessory', name: 'Accessories|layer', sub: 'hands, head, feet' },
];
export const LAYER_KEYS = LAYERS.map((l) => l.key);

/**
 * The body zones as the wardrobe shows them. The import knows finer zones (gearimport.js ZONES):
 * torso and arms count as upper body, eyes and neck as head (a buff). set: the value a tap stores.
 */
export const ZONES = [
  { key: 'upper', name: 'Upper body', set: 'torso', of: ['torso', 'arms'] },
  { key: 'legs', name: 'Legs', set: 'legs', of: ['legs'] },
  { key: 'hands', name: 'Hands', set: 'hands', of: ['hands'] },
  { key: 'head', name: 'Head', set: 'head', of: ['head', 'eyes', 'neck'] },
  { key: 'feet', name: 'Feet', set: 'feet', of: ['feet'] },
];
/** The wardrobe zone of an item's zone ('torso' → 'upper'); null when it has none or an unknown one. */
export const zoneGroup = (zone) => ZONES.find((z) => z.of.includes(String(zone ?? '').toLowerCase()))?.key ?? null;
/** The layer of an item, when it is one of the four. */
export const layerKey = (layer) => (LAYER_KEYS.includes(String(layer ?? '').toLowerCase()) ? String(layer).toLowerCase() : null);

/** Categories that are clothing (gear.js CATEGORIES). */
export const CLOTHING_CATEGORIES = ['onbike', 'rain', 'offbike', 'shoes'];
/** Is this item clothing? A clothing category, or a layer or a zone from the import. Gone items never. */
export const isClothing = (item) => !!item && item.ownership !== 'gone' && (CLOTHING_CATEGORIES.includes(item.category) || !!item.zone || !!item.layer);

/** The "Einsatz" filter: Velo (bike trips), Alltag (everyday), Alle. */
export const USES = [
  { key: 'velo', name: 'Cycling|use' },
  { key: 'everyday', name: 'Everyday|use' },
  { key: 'all', name: 'All|use' },
];
export function inUse(item, use) {
  if (use === 'velo') return inDomain(item, BIKEPACKING);
  if (use === 'everyday') return itemDomains(item).includes('everyday');
  return true;
}

/* ---------- guesses from the name ---------- */

const words = (name) => ` ${fold(String(name ?? '').replace(/^\s*test_data_gtp_\s*/i, '')).replace(/[^a-z0-9]+/g, ' ')} `;
const has = (w, list) => list.some((x) => w.includes(x));

/** The zone a name suggests (a wardrobe zone key) or null. */
export function guessZone(name) {
  const w = words(name);
  if (has(w, ['handschuh', 'glove', 'faustling', 'mitt'])) return 'hands';
  if (has(w, ['socke', 'sock', 'schuh', 'shoe', 'uberschuh', 'overshoe', 'gamasche', 'zehen', 'toe '])) return 'feet';
  if (has(w, ['mutze', 'cap ', 'kappe', 'helm', 'stirnband', 'headband', 'buff', 'beanie', 'balaclava', 'sturmhaube', 'brille', 'glasses', 'halstuch', 'neck', 'hat '])) return 'head';
  if (has(w, ['hose', 'pant', 'trouser', 'short', 'bein', 'leg', 'knie', 'knee', 'tights', 'bib'])) return 'legs';
  if (has(w, ['shirt', 'trikot', 'jersey', 'jacke', 'jacket', 'weste', 'vest', 'gilet', 'unterhemd', 'hemd', 'pulli', 'pullover', 'fleece', 'hoodie', 'arm', 'langarm', 'kurzarm', 'top ', 'bra ', 'baselayer', 'anorak', 'poncho', 'cape'])) return 'upper';
  return null;
}

/** The layer a name suggests or null. */
export function guessLayer(name) {
  const w = words(name);
  const zone = guessZone(name);
  if (zone === 'hands' || zone === 'head' || zone === 'feet') return 'accessory';
  if (has(w, ['unterhemd', 'baselayer', 'base layer', 'unterhose', 'underwear', 'netzhemd', 'netzunterhemd'])) return 'base';
  if (has(w, ['regen', 'rain', 'wind', 'jacke', 'jacket', 'weste', 'vest', 'gilet', 'shell', 'anorak', 'poncho', 'cape', 'goretex', 'gore tex'])) return 'outer';
  if (has(w, ['fleece', 'thermo', 'warm', 'pulli', 'pullover', 'hoodie', 'daune', 'down', 'primaloft', 'arm', 'bein', 'leg', 'knie', 'knee'])) return 'mid';
  if (has(w, ['unterhemd', 'baselayer', 'base layer', 'merino', 'unterhose', 'underwear', 'trikot', 'jersey', 'shirt', 'trager', 'bib', 'hose', 'short', 'bra '])) return 'base';
  return null;
}

/* ---------- the wardrobe page ---------- */

/** "4–15 °C", "unter 4 °C", "über 25 °C"; '' without a range (then the page shows the class). */
export function tempRange(min, max, t = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m)) {
  const lo = typeof min === 'number' ? min : null;
  const hi = typeof max === 'number' ? max : null;
  if (lo != null && hi != null) return `${lo}–${hi} °C`;
  if (hi != null) return t('below {n} °C', { n: hi });
  if (lo != null) return t('above {n} °C', { n: lo });
  return '';
}

const byName = (a, b) => String(a.nameDe || a.name).localeCompare(String(b.nameDe || b.name));
const grams = (list) => list.reduce((s, i) => s + (itemWeight(i) ?? 0), 0);

/**
 * The whole wardrobe for one filter: { all, unsorted, layers: [{ key, n, g, zones: [{ key, items }] }], n, g }.
 * all: the clothing in this filter (owned, unclear and wishlist items; not gone). unsorted: items
 * without a layer or zone, each with its guesses { item, layer, zone, guessLayer, guessZone }.
 */
export function wardrobe(items = [], use = 'all') {
  const all = items.filter((i) => isClothing(i) && inUse(i, use)).sort(byName);
  const unsorted = [];
  const placed = [];
  for (const i of all) {
    const layer = layerKey(i.layer);
    const zone = zoneGroup(i.zone);
    if (layer && zone) placed.push({ item: i, layer, zone });
    else unsorted.push({ item: i, layer, zone, guessLayer: layer ?? guessLayer(i.name), guessZone: zone ?? guessZone(i.name) });
  }
  const layers = LAYERS.map((l) => {
    const mine = placed.filter((p) => p.layer === l.key);
    const zones = ZONES.map((z) => ({ key: z.key, items: mine.filter((p) => p.zone === z.key).map((p) => p.item) })).filter((z) => z.items.length);
    return { key: l.key, n: mine.length, g: grams(mine.map((p) => p.item)), zones };
  }).filter((l) => l.n);
  return { all, unsorted, layers, n: all.length, g: grams(all) };
}

/* ---------- temperature: the coldest riding hour ---------- */

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The riding hours of a trip: from its start time (default 08:00) for trip.hours per day (default 6 h). */
export function ridingHours(trip) {
  if (!trip?.startDate) return [];
  const days = Math.max(1, Number(trip.days) || 1);
  const len = Math.max(1, Math.min(24, Math.round(Number(trip.hours) || 6)));
  const out = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(trip.startDate, d);
    const start = Number(String(trip.rideStart?.[d] ?? '08:00').slice(0, 2)) || 8;
    for (let h = start; h < Math.min(24, start + len); h++) out.push({ date, hour: h });
  }
  return out;
}

/** The hourly values of the trip's forecast on its riding hours: [{ date, hour, temp, pct }]. */
export function forecastHours(trip) {
  const byDate = new Map((trip?.forecast?.days ?? []).map((d) => [d.date, d]));
  return ridingHours(trip)
    .map(({ date, hour }) => {
      const h = byDate.get(date)?.hourly;
      return { date, hour, temp: num(h?.t?.[hour]), pct: num(h?.p?.[hour]) };
    })
    .filter((x) => x.temp != null || x.pct != null);
}
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * The temperature the clothing is chosen for: { c, from: 'hour' | 'min', date?, hour? } or null.
 * The coldest riding hour of the forecast; without hourly data the minimum of the packing weather.
 */
export function coldest(trip) {
  const hours = forecastHours(trip).filter((x) => x.temp != null);
  if (hours.length) {
    const c = hours.reduce((a, b) => (b.temp < a.temp ? b : a));
    return { c: Math.round(c.temp), from: 'hour', date: c.date, hour: c.hour };
  }
  const min = num(trip?.wx?.min);
  return min == null ? null : { c: min, from: 'min' };
}

/**
 * The rain chance of the trip in %: the max over its riding hours (hourly forecast), else the stored
 * forecast.rainPct, else the max of the daily chances on the trip's days, else wx.rainPct; null: unknown.
 */
export function rainChance(trip) {
  const hours = forecastHours(trip).filter((x) => x.pct != null);
  if (hours.length) return Math.max(...hours.map((x) => x.pct));
  if (num(trip?.forecast?.rainPct) != null) return trip.forecast.rainPct;
  const want = new Set(ridingHours(trip).map((h) => h.date));
  const daily = (trip?.forecast?.days ?? []).filter((d) => want.has(d.date) && num(d.rainPct) != null).map((d) => d.rainPct);
  if (daily.length) return Math.max(...daily);
  return num(trip?.wx?.rainPct);
}
/** The forecast with its rain chance over the trip's riding hours stored on it (answer 12). */
export function withRainPct(forecast, trip) {
  if (!forecast) return forecast;
  const { rainPct: _, ...rest } = forecast;
  const pct = rainChance({ ...trip, forecast: rest, wx: null });
  return pct == null ? rest : { ...rest, rainPct: pct };
}
/** { rainPct } for the packing weather when the forecast knows it (spread into trip.wx), else {}. */
export function pctOf(trip) {
  const pct = rainChance({ ...trip, wx: null });
  return pct == null ? {} : { rainPct: pct };
}
/** From this rain chance on, rain protection belongs in the onion (answer 12). */
export const RAIN_PCT = 30;
export const isWet = (trip) => trip?.wx?.rain === 'rain' || trip?.wx?.rain === 'showers' || (rainChance(trip) ?? 0) >= RAIN_PCT;

/* ---------- the border offset (debrief clothing row) ---------- */

export const CLOTHING_OFFSET = 'clothing.offset';
export const MAX_OFFSET = 3;
export const CLOTHING = [
  { key: 'cold', name: 'Too cold' },
  { key: 'fit', name: 'Fitted|clothing' },
  { key: 'warm', name: 'Too warm' },
];
/**
 * The offset from the saved debriefs, oldest first: "too cold" +1, "too warm" −1, "fitted" stays;
 * never beyond ±3. Computed from all debriefs again, so a debrief answered twice counts once.
 */
export function clothingOffset(debriefs = []) {
  let o = 0;
  const done = debriefs.filter((d) => d?.status === 'done' && (d.clothing === 'cold' || d.clothing === 'warm')).sort((a, b) => String(a.doneAt ?? '').localeCompare(String(b.doneAt ?? '')));
  for (const d of done) o = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, o + (d.clothing === 'cold' ? 1 : -1)));
  return o;
}
/** The temperature as it feels to you: colder by the offset. */
export const felt = (c, offset = 0) => (c == null ? null : c - (Number(offset) || 0));

/* ---------- temperature kits ---------- */

/** The kits among the building blocks (sets.js allSets / the settings record): those with a range. */
export const tempKits = (sets = []) => (Array.isArray(sets) ? sets : []).filter((s) => s && (typeof s.minC === 'number' || typeof s.maxC === 'number'));
const lo = (k) => (typeof k.minC === 'number' ? k.minC : -Infinity);
const hi = (k) => (typeof k.maxC === 'number' ? k.maxC : Infinity);
/** Does a kit fit this temperature (its borders shifted by the offset)? minC included, maxC included. */
export const kitFits = (kit, c, offset = 0) => c != null && felt(c, offset) >= lo(kit) && felt(c, offset) <= hi(kit);

/**
 * The kit for a temperature (answer 5): the kits that fit; when two fit, the colder one (lower
 * maxC). None fits: the nearest kit. Returns the kit or null (no kits, no temperature).
 */
export function chooseKit(kits = [], c, offset = 0) {
  const list = tempKits(kits);
  if (!list.length || c == null) return null;
  const f = felt(c, offset);
  const fit = list.filter((k) => kitFits(k, c, offset)).sort((a, b) => hi(a) - hi(b) || lo(a) - lo(b));
  if (fit.length) return fit[0];
  const dist = (k) => (f < lo(k) ? lo(k) - f : f - hi(k));
  return [...list].sort((a, b) => dist(a) - dist(b) || hi(a) - hi(b))[0];
}

/** What a kit adds to a trip: { items (owned members), have (already on), add (still missing) }. */
export function kitPlan(kit, trip, items = []) {
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const members = items.filter((i) => isInventory(i) && i.sets?.includes(kit.key));
  return { items: members, have: members.filter((i) => on.has(i.id)), add: members.filter((i) => !on.has(i.id)) };
}

/* ---------- the onion check ---------- */

/**
 * The rows of the onion and when each is needed (c: the felt temperature). layer / zone: what an
 * item must be to count. rain: on a wet trip the outer layer must keep rain out.
 */
export const ONION = [
  { key: 'base', name: 'Base|layer', layer: 'base', need: () => true },
  { key: 'mid', name: 'Mid|layer', layer: 'mid', need: (c) => c < 15 },
  { key: 'outer', name: 'Outer|layer', layer: 'outer', need: (c, wet) => c < 12 || wet },
  { key: 'legs', name: 'Legs', zone: 'legs', below: 10, need: (c) => c < 10 },
  { key: 'hands', name: 'Hands', zone: 'hands', below: 12, need: (c) => c < 12 },
  { key: 'head', name: 'Head', zone: 'head', below: 8, need: (c) => c < 8 },
  { key: 'feet', name: 'Feet', zone: 'feet', below: 5, need: (c) => c < 5 },
];

/**
 * Is an item warm enough for this temperature? Its range (layers add up, so 2 °C below its lower
 * border still count), else its class; without either: yes.
 */
export const SLACK = 2;
export function warmEnough(item, c) {
  if (typeof item.tempMin === 'number') return item.tempMin <= c + SLACK;
  if (item.tempClass === 'warm') return c >= 15;
  return true;
}
/** Does an item keep rain out? Its rain setting, a rain building block, the category or the name. */
export const rainProof = (item) => !!rainOf(item) || /regen|rain|wasserdicht|waterproof|poncho|gore-?tex/i.test(`${item.name} ${item.nameDe ?? ''}`);

// The three layer rows are the upper body (leg warmers count under Legs, not under Mid).
const matchesRow = (row, item) => (row.layer ? layerKey(item.layer) === row.layer && (!item.zone || zoneGroup(item.zone) === 'upper') : zoneGroup(item.zone) === row.zone);

/**
 * The onion check of a trip: { c, from, wet, pct, rows, gaps } or null (no temperature, or no
 * clothing with a layer or zone at all). Each row: { key, name, ok, items (on the trip), need,
 * rain (the outer layer must keep rain out), fix (the best owned item for a gap, or null) }.
 * Only the rows that are needed, or that something on the list covers, are shown.
 */
export function onionCheck(trip, items = [], offset = 0) {
  const cold = coldest(trip);
  if (!cold) return null;
  if (!items.some((i) => isInventory(i) && (layerKey(i.layer) || zoneGroup(i.zone)))) return null;
  const c = felt(cold.c, offset);
  const wet = isWet(trip);
  const byId = new Map(items.map((i) => [i.id, i]));
  const on = (trip.entries ?? []).map((e) => byId.get(e.itemId)).filter(Boolean);
  const onIds = new Set(on.map((i) => i.id));
  const rows = [];
  for (const row of ONION) {
    const need = row.need(c, wet);
    const mine = on.filter((i) => matchesRow(row, i));
    if (!need && !mine.length) continue;
    const warm = mine.filter((i) => warmEnough(i, c));
    const rain = row.key === 'outer' && wet;
    let ok = !need || warm.length > 0;
    if (rain && !mine.some(rainProof)) ok = false;
    const needRain = rain && !mine.some(rainProof);
    let fix = null;
    if (!ok) fix = best(items.filter((i) => isInventory(i) && !onIds.has(i.id) && matchesRow(row, i) && (needRain && warm.length ? rainProof(i) : warmEnough(i, c) && (!needRain || rainProof(i)))), c);
    rows.push({ key: row.key, name: row.name, below: row.below ?? null, need, ok, rain: needRain, items: mine, fix });
  }
  return { c, real: cold.c, from: cold.from, date: cold.date ?? null, hour: cold.hour ?? null, wet, pct: rainChance(trip), rows, gaps: rows.filter((r) => !r.ok).length };
}

/** The best item for a gap: a range that holds c first, then the closest lower border, then the lighter one. */
function best(list, c) {
  const holds = (i) => typeof i.tempMin === 'number' && i.tempMin <= c && (typeof i.tempMax !== 'number' || i.tempMax >= c);
  return (
    [...list].sort(
      (a, b) =>
        Number(holds(b)) - Number(holds(a)) ||
        (typeof b.tempMin === 'number' ? b.tempMin : -99) - (typeof a.tempMin === 'number' ? a.tempMin : -99) ||
        (a.weightG ?? 9999) - (b.weightG ?? 9999) ||
        a.id.localeCompare(b.id),
    )[0] ?? null
  );
}
