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
import { isInventory, itemWeight, nextId } from './gear.js';
import { addSet } from './sets.js';
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

/**
 * The "Einsatz" filter: Velo (bike trips), Alltag (everyday), Alle.
 *
 * v0.45.0 (Noah, decision 10): everyday clothes show only under Alltag. An item is "everyday only"
 * when Everyday is its only area (item.domains = ['everyday']). Such an item is never under Velo
 * (it never was: inDomain) and no longer under Alle; Alle is everything else (also ski touring or
 * hiking clothing). An item of Everyday AND another area (['velo', 'everyday']) shows under all three.
 */
export const USES = [
  { key: 'velo', name: 'Cycling|use' },
  { key: 'everyday', name: 'Everyday|use' },
  { key: 'all', name: 'All|use' },
];
export const EVERYDAY = 'everyday';
/** Is Everyday the only area of this item? */
export const everydayOnly = (item) => itemDomains(item).every((d) => d === EVERYDAY);
export function inUse(item, use) {
  if (use === 'velo') return inDomain(item, BIKEPACKING);
  if (use === EVERYDAY) return itemDomains(item).includes(EVERYDAY);
  return !everydayOnly(item);
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

/**
 * v0.45.0 (Noah, decision 1): the temperature range an item is made for, { lo, hi } in °C, or null.
 * tempMin / tempMax first (a missing border is open: −∞ or +∞); without either the class of the
 * import counts as a range: warm 15 °C and more, mittel 5–15 °C, kalt 5 °C and less.
 */
export const CLASS_RANGE = { warm: { lo: 15, hi: Infinity }, mittel: { lo: 5, hi: 15 }, kalt: { lo: -Infinity, hi: 5 } };
export function tempKey(item) {
  const min = typeof item?.tempMin === 'number' ? item.tempMin : null;
  const max = typeof item?.tempMax === 'number' ? item.tempMax : null;
  if (min != null || max != null) return { lo: min ?? -Infinity, hi: max ?? Infinity };
  return CLASS_RANGE[item?.tempClass] ?? null;
}
/**
 * v0.47.0 (Noah 2b), shared in v0.59.0: the temperature bar on the scale −10 … 35 °C. The style of the
 * coloured part for a range { lo, hi } (an open border runs to the end of the scale), or '' without one.
 * The gradient is sized to the whole scale, so a colour always means the same temperature.
 */
export const BAR_LO = -10;
export const BAR_HI = 35;
const onScale = (n, open) => Math.max(BAR_LO, Math.min(BAR_HI, Number.isFinite(n) ? n : open));
export function barStyle(k) {
  if (!k) return '';
  const lo = onScale(k.lo, BAR_LO);
  const hi = onScale(k.hi, BAR_HI);
  const x = ((lo - BAR_LO) / (BAR_HI - BAR_LO)) * 100;
  const y = Math.max(5, ((hi - lo) / (BAR_HI - BAR_LO)) * 100);
  const left = Math.min(x, 100 - y);
  return `left:${left}%;width:${y}%;background-size:${(10000 / y).toFixed(1)}% 100%;background-position:${y >= 100 ? 0 : ((left / (100 - y)) * 100).toFixed(1)}% 0`;
}
/** The frame of the trip's range { min, max } on the same scale (left and width in %). */
export function markStyle(range) {
  if (!range) return '';
  const lo = onScale(range.min, BAR_LO);
  const hi = onScale(range.max, BAR_HI);
  const x = ((lo - BAR_LO) / (BAR_HI - BAR_LO)) * 100;
  const y = Math.max(3, ((hi - lo) / (BAR_HI - BAR_LO)) * 100);
  return `left:${Math.min(x, 100 - y)}%;width:${y}%`;
}
const cmpDesc = (a, b) => (a === b ? 0 : a > b ? -1 : 1);
/**
 * Warm to cold within a zone (decision 1): the upper border first (higher first), then the lower
 * border (higher first), so the short jersey comes before the winter jacket. Items without a range
 * or class last; equal ones by name.
 */
export function warmToCold(a, b) {
  const ka = tempKey(a);
  const kb = tempKey(b);
  if (ka && !kb) return -1;
  if (!ka && kb) return 1;
  if (ka && kb) return cmpDesc(ka.hi, kb.hi) || cmpDesc(ka.lo, kb.lo) || byName(a, b);
  return byName(a, b);
}
const grams = (list) => list.reduce((s, i) => s + (itemWeight(i) ?? 0), 0);

/**
 * The whole wardrobe for one filter: { all, unsorted, layers: [{ key, n, g, zones: [{ key, items }] }], n, g }.
 * all: the clothing in this filter (owned, unclear and wishlist items; not gone). unsorted: items
 * without a layer or zone, each with its guesses { item, layer, zone, guessLayer, guessZone }.
 */
export function wardrobe(items = [], use = 'all', { gaps = [] } = {}) {
  const all = items.filter((i) => isClothing(i) && inUse(i, use)).sort(byName);
  const unsorted = [];
  const placed = [];
  for (const i of all) {
    const layer = layerKey(i.layer);
    const zone = zoneGroup(i.zone);
    if (layer && zone) placed.push({ item: i, layer, zone });
    else unsorted.push({ item: i, layer, zone, guessLayer: layer ?? guessLayer(i.name), guessZone: zone ?? guessZone(i.name) });
  }
  // v0.45.0: warm to cold within a zone (decision 1); a gap (decision 2) keeps its zone and layer
  // on the page even when nothing is there yet.
  const layers = LAYERS.map((l) => {
    const mine = placed.filter((p) => p.layer === l.key);
    const zones = ZONES.map((z) => ({
      key: z.key,
      items: mine.filter((p) => p.zone === z.key).map((p) => p.item).sort(warmToCold),
      gap: gaps.find((g) => g.layer === l.key && g.zone === z.key) ?? null,
    })).filter((z) => z.items.length || z.gap);
    return { key: l.key, n: mine.length, g: grams(mine.map((p) => p.item)), zones };
  }).filter((l) => l.n || l.zones.length);
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
export function clothingOffset(debriefs = [], since = null) {
  let o = 0;
  const done = debriefs.filter((d) => d?.status === 'done' && (d.clothing === 'cold' || d.clothing === 'warm') && (!since || String(d.doneAt ?? '') > since)).sort((a, b) => String(a.doneAt ?? '').localeCompare(String(b.doneAt ?? '')));
  for (const d of done) o = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, o + (d.clothing === 'cold' ? 1 : -1)));
  return o;
}
/**
 * v0.45.0 (Noah, decision 8): the settings record after a saved debrief. A reset ("Reset" in the
 * wardrobe) stores resetAt: only debriefs saved after it count, so the offset starts at 0 again
 * and the old answers do not come back with the next debrief. prev: the record as it was (or null).
 */
export function offsetRecord(prev, debriefs = [], at = new Date().toISOString()) {
  const since = prev?.resetAt ?? null;
  return { key: CLOTHING_OFFSET, value: clothingOffset(debriefs, since), at, ...(since ? { resetAt: since } : {}) };
}
/** The record of a reset: 0 from now on. Undo puts the previous record back. */
export const resetOffset = (at = new Date().toISOString()) => ({ key: CLOTHING_OFFSET, value: 0, at, resetAt: at });
/**
 * The header line of the wardrobe (decision 8): { text, n } (an English key for t() and the signed
 * number), or null at 0. A positive offset: you run cold ("+2 °C"); a negative one: you run warm.
 */
export function offsetLine(offset) {
  const o = Math.round(Number(offset) || 0);
  if (!o) return null;
  return o > 0 ? { text: 'You run cold: {n} °C', n: `+${o}` } : { text: 'You run warm: {n} °C', n: `−${Math.abs(o)}` };
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

/* ---------- v0.45.0 "Kleiderschrank 2": gaps, the outfit of the day, a kit from an outfit ---------- */

/**
 * The gap rule (Noah, decision 2), kept simple on purpose:
 *   1. The wardrobe should keep you warm on a ride down to COVER_TO (0 °C), felt: with the learned
 *      offset ("you run cold: +2 °C" means down to −2 °C).
 *   2. Seven places need something warm, each from its own temperature on (the onion's rows):
 *      base, mid and outer layer of the upper body, the legs, the hands, the head and the feet.
 *      A rule names where its row shows (layer × zone) and which pieces count: for the legs and the
 *      accessories any layer of that zone, for the upper body only that layer.
 *   3. An owned piece (owned or unclear) covers COVER_TO when warmEnough says so: its lower border
 *      at most 2 °C above it; without a range only the class "warm" fails (unknown never alarms).
 *   4. No owned piece covers it → a gap. below: the lowest border of what is owned there ("No
 *      gloves below 7 °C"); nothing owned there at all → the temperature the place is needed from.
 *   5. A wish (wishlist or to buy) in that place shows with the gap instead of the button.
 * Everyday-only clothing never counts (decision 10): the gaps are about riding.
 */
export const COVER_TO = 0;
export const GAP_RULES = [
  { key: 'base', layer: 'base', zone: 'upper', from: 10, text: 'No warm base layer below {n} °C', wish: 'Warm base layer' },
  { key: 'mid', layer: 'mid', zone: 'upper', from: 15, text: 'No mid layer below {n} °C', wish: 'Warm mid layer' },
  { key: 'outer', layer: 'outer', zone: 'upper', from: 12, text: 'No jacket below {n} °C', wish: 'Warm jacket' },
  { key: 'legs', layer: 'mid', zone: 'legs', any: true, from: 10, text: 'No leg warmers or tights below {n} °C', wish: 'Warm tights' },
  { key: 'hands', layer: 'accessory', zone: 'hands', any: true, from: 12, text: 'No gloves below {n} °C', wish: 'Warm gloves' },
  { key: 'head', layer: 'accessory', zone: 'head', any: true, from: 8, text: 'No cap below {n} °C', wish: 'Warm cap' },
  { key: 'feet', layer: 'accessory', zone: 'feet', any: true, from: 5, text: 'No overshoes or warm socks below {n} °C', wish: 'Overshoes' },
];
const inRule = (rule, item) => zoneGroup(item.zone) === rule.zone && (rule.any || layerKey(item.layer) === rule.layer);
const isWishItem = (i) => i.ownership === 'wishlist' || i.ownership === 'to-buy';
/** The lowest temperature a piece is made for (−∞: no range, so it is not held against it). */
const floorOf = (item) => (typeof item.tempMin === 'number' ? item.tempMin : tempKey(item)?.lo ?? -Infinity);

/** The gaps of the wardrobe: [{ key, layer, zone, below, text, wish (English name), wished (item or null) }]. */
export function wardrobeGaps(items = [], { offset = 0, to = COVER_TO } = {}) {
  const c = felt(to, offset);
  const riding = items.filter((i) => isClothing(i) && !everydayOnly(i));
  const out = [];
  for (const rule of GAP_RULES) {
    const owned = riding.filter((i) => isInventory(i) && inRule(rule, i));
    if (owned.some((i) => warmEnough(i, c))) continue;
    const floors = owned.map(floorOf).filter((n) => Number.isFinite(n));
    const below = floors.length ? Math.min(...floors) : rule.from;
    const wished = riding.find((i) => isWishItem(i) && inRule(rule, i)) ?? null;
    out.push({ key: rule.key, layer: rule.layer, zone: rule.zone, below, text: rule.text, wish: rule.wish, wished });
  }
  return out;
}

/**
 * "Add to wishlist" on a gap: the new wishlist item, or null when a wish is already there.
 * name / reason: the words in the current language (the page passes them through t()); the record
 * keeps them as written. The item gets the gap's layer and zone, so it shows in that place.
 */
export function gapWish(gap, items = [], { name, reason, now = new Date().toISOString() } = {}) {
  if (!gap || gap.wished) return null;
  const zone = ZONES.find((z) => z.key === gap.zone)?.set ?? gap.zone;
  return {
    id: nextId(items, 'onbike'), name: name || gap.wish, brand: '', model: '', category: 'onbike', weightG: null, qty: 1, weightStatus: 'missing', carry: 'body',
    defaultBag: 'body', ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['velo'], layer: gap.layer, zone,
    note: reason || '', from: 'wardrobe', updatedAt: now,
  };
}

/**
 * "What do I wear today?" (Noah, decision 9): the outfit for a day ride at the home place.
 * forecast: the saved home forecast (days, with hourly values when there are); date: the ride's
 * day; start: its first hour; hours: how long. The onion decides which rows are needed at the
 * coldest riding hour (felt, with the offset); the legs always get a row. Each row gets the best
 * owned piece for it (never everyday-only), or null when nothing owned fits.
 * → { c (felt), real, hour, from, wet, pct, rows: [{ key, name, item, rain }] } or null (no forecast for that day).
 */
export function outfitFor(forecast, items = [], { date, start = 8, hours = 2, offset = 0 } = {}) {
  if (!forecast || !date) return null;
  const trip = { startDate: date, days: 1, hours, rideStart: [`${String(start).padStart(2, '0')}:00`], forecast, wx: null };
  const day = (forecast.days ?? []).find((x) => x.date === date);
  let cold = coldest(trip);
  if (!cold) {
    if (num(day?.min) == null) return null;
    cold = { c: day.min, from: 'min' };
  }
  const c = felt(cold.c, offset);
  const wet = isWet(trip) || day?.rain === 'rain' || day?.rain === 'showers';
  const own = items.filter((i) => isInventory(i) && isClothing(i) && !everydayOnly(i));
  const rows = [];
  for (const row of ONION) {
    if (!row.need(c, wet) && row.key !== 'legs') continue;
    const rain = row.key === 'outer' && wet;
    const fits = own.filter((i) => matchesRow(row, i) && warmEnough(i, c) && (!rain || rainProof(i)));
    rows.push({ key: row.key, name: row.name, item: best(fits, c), rain });
  }
  return { c, real: cold.c, hour: cold.hour ?? null, from: cold.from, wet, pct: rainChance(trip), rows };
}

/**
 * The ride "What do I wear today?" is for (decision 9), as the Day ride button picks its day
 * (dayride.js: from 14:00 on it is tomorrow's ride): { date, start, hours, tomorrow }. Today it
 * starts at the coming hour (not before 08:00), tomorrow at 08:00. hours: of the last day ride, else 2.
 */
export function rideWindow(now = new Date(), { late = 14, hours = 2 } = {}) {
  const d = new Date(now);
  const tomorrow = d.getHours() >= late;
  if (tomorrow) d.setDate(d.getDate() + 1);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const len = Math.max(1, Math.min(12, Math.round(Number(hours) || 2)));
  return { date, start: tomorrow ? 8 : Math.max(8, new Date(now).getHours()), hours: len, tomorrow };
}

/**
 * Save an outfit as a temperature kit (Noah, decision 5): a building block with a range, exactly
 * like the kits of the import (settings "sets": { key, name, minC, maxC }; the pieces carry its key
 * in item.sets), so Pack suggests it (chooseKit). value: the settings value "sets".
 * → { value, key, items (only the changed records) } or { error: 'empty' | 'taken' | 'range' | 'none' }.
 */
export function kitFromOutfit(value, items = [], { name, minC = null, maxC = null, ids = [] } = {}, now = new Date().toISOString()) {
  const parse = (v) => (v == null || String(v).trim() === '' ? null : Number(String(v).trim().replace('−', '-').replace(',', '.')));
  const lo = parse(minC);
  const hi = parse(maxC);
  if ((lo != null && !Number.isFinite(lo)) || (hi != null && !Number.isFinite(hi)) || (lo == null && hi == null) || (lo != null && hi != null && lo > hi)) return { error: 'range' };
  const chosen = items.filter((i) => ids.includes(i.id));
  if (!chosen.length) return { error: 'none' };
  const r = addSet(value, name);
  if (r.error) return r;
  const range = { ...(lo != null ? { minC: lo } : {}), ...(hi != null ? { maxC: hi } : {}) };
  return {
    key: r.key,
    value: r.value.map((s) => (s.key === r.key ? { ...s, ...range } : s)),
    items: chosen.filter((i) => !(i.sets ?? []).includes(r.key)).map((i) => ({ ...i, sets: [...(i.sets ?? []), r.key], updatedAt: now })),
  };
}
/** A first range for the kit form around a temperature: 3 °C either side, whole degrees. */
export const rangeAround = (c) => (c == null ? { minC: '', maxC: '' } : { minC: Math.round(c) - 3, maxC: Math.round(c) + 3 });
