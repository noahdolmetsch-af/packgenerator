/**
 * «Kleiderschrank einrichten» (Noah 21.11.2026 «1-5a 4b», Thread «Kleiderschrank wieder ins Zentrum rücken», Weg C):
 * one piece after the other, one tap each: how cold it is made for (five steps with words), plus its layer and
 * body zone. Without a temperature the onion cannot think along («Hands: nothing warm enough»); this is the
 * quick way to give every piece one.
 *
 * Pure rules, tested in tests/wardrobe-setup.test.js. The page is src/pages/WardrobeSetup.svelte.
 * Everything is a suggestion: the guess from the name is only preselected, every tap changes it, Skip leaves
 * the piece as it is, and every save has an Undo (the same snapshot as the wardrobe's own sorting).
 */
import { isClothing, everydayOnly, guessLayer, guessZone, zoneGroup, layerKey, ZONES, tempKey } from './wardrobe.js';

/**
 * The five steps, from warm to cold. lo / hi in °C: the range the piece is made for (hi null = open to the
 * warm end). «Frost» has no lower border on the page; −15 °C is the lowest value the wardrobe's rule accepts.
 * name / sub: English keys for t().
 */
export const LEVELS = [
  { key: 'warm', name: 'Warm|level', sub: 'from 20 °C', lo: 20, hi: null },
  { key: 'mild', name: 'Mild|level', sub: '12–20 °C', lo: 12, hi: 20 },
  { key: 'cool', name: 'Cool|level', sub: '5–12 °C', lo: 5, hi: 12 },
  { key: 'cold', name: 'Cold|level', sub: '0–5 °C', lo: 0, hi: 5 },
  { key: 'frost', name: 'Frost|level', sub: 'below 0 °C', lo: -15, hi: 0 },
];
const KEYS = LEVELS.map((l) => l.key);

/** Pieces that are not owned (any more) are not set up. */
const OUT = new Set(['gone', 'wishlist', 'to-buy']);

const fold = (s) =>
  String(s ?? '')
    .replace(/^\s*test_data_gtp_\s*/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** The level keys (warm … frost), a gap-free run, for a range { lo, hi } (hi / lo may be ±Infinity); [] without one. */
export function levelsOfRange(range) {
  if (!range) return [];
  const lo = range.lo ?? -Infinity;
  const hi = range.hi ?? Infinity;
  // a step counts when the range covers more than a hair of it; the open warm end counts as 20–35
  const on = LEVELS.filter((l) => {
    const a = l.lo;
    const b = l.hi ?? 35;
    const overlap = Math.min(hi, b) - Math.max(lo, a);
    return overlap >= Math.min(4, b - a) / 2;
  }).map((l) => l.key);
  return on.length ? run(on) : [];
}

/** Keep the steps as one run, from the first to the last chosen. */
function run(keys) {
  const idx = keys.map((k) => KEYS.indexOf(k)).filter((i) => i >= 0);
  if (!idx.length) return [];
  const a = Math.min(...idx);
  const b = Math.max(...idx);
  return KEYS.slice(a, b + 1);
}

/** The range { tempMin, tempMax } for the chosen steps; both null when none is chosen. */
export function rangeOfLevels(keys) {
  const run1 = run(keys ?? []);
  if (!run1.length) return { tempMin: null, tempMax: null };
  const chosen = LEVELS.filter((l) => run1.includes(l.key));
  const warm = chosen.some((l) => l.hi == null);
  return { tempMin: Math.min(...chosen.map((l) => l.lo)), tempMax: warm ? null : Math.max(...chosen.map((l) => l.hi)) };
}

/** What the name says about the cold it is made for: a run of steps, or [] when it says nothing. First rule wins. */
const NAME_RULES = [
  [/winter|daune|\bdown\b|primaloft|expedition|thermo|schneeanzug|\bski\b/, ['cold', 'frost']],
  [/beinling|armling|arm ?warm|knielinge|ubergang|halbfinger/, ['mild', 'cool']],
  [/fleece|isolier|chill|\bwarm|woll|gefuttert/, ['cool', 'cold']],
  [/regen|rain|wind|shell|gore|poncho/, ['mild', 'cool']],
  [/dunn|leicht|light|ultra|mesh|netz|sommer|summer|kurzarm|armlos|aermellos|armellos|kurze?\b|short|sonnenbrille/, ['warm', 'mild']],
];

/** The suggested steps for a piece: its class from the import, else the name, else nothing. */
export function suggestLevels(item) {
  const range = tempKey(item);
  if (range && (typeof item?.tempMin === 'number' || typeof item?.tempMax === 'number')) return levelsOfRange(range);
  if (item?.tempClass === 'warm') return ['warm', 'mild'];
  if (item?.tempClass === 'mittel') return ['mild', 'cool'];
  if (item?.tempClass === 'kalt') return ['cold', 'frost'];
  const w = fold(`${item?.nameDe ?? ''} ${item?.name ?? ''}`);
  for (const [re, keys] of NAME_RULES) {
    if (!re.test(w)) continue;
    // a thin glove or sock is for the cool days, not for summer
    if (keys[0] === 'warm' && ['hands', 'feet'].includes(guessZone(item?.name ?? ''))) return ['mild', 'cool'];
    return keys;
  }
  return [];
}

/** The layer and stored zone value of a piece: its own, else the guess from the name; null when unknown. */
export function placeOf(item) {
  const own = { layer: layerKey(item?.layer), zone: zoneGroup(item?.zone) };
  const layer = own.layer ?? guessLayer(item?.name ?? '');
  const zone = own.zone ?? guessZone(item?.name ?? '');
  const setOf = (k) => ZONES.find((z) => z.key === k)?.set ?? null;
  return { layer: layer ?? null, zone: setOf(zone), guessed: !own.layer || !own.zone };
}

/** Does this piece still need its steps? Clothes you own and wear on the bike, without layer, zone or a number. */
export function needsSetup(item) {
  if (!isClothing(item) || OUT.has(item.ownership) || everydayOnly(item)) return false;
  const placed = !!layerKey(item.layer) && !!zoneGroup(item.zone);
  const numbered = typeof item.tempMin === 'number' || typeof item.tempMax === 'number';
  return !placed || !numbered;
}

/**
 * The pieces still to set up, the ones you take most often first, then by name. trips: to count how often a piece
 * was on a trip (entries[].itemId); skipped: ids to leave out for now.
 */
export function setupQueue(items = [], trips = [], skipped = []) {
  const used = new Map();
  for (const t of trips) for (const e of t.entries ?? []) used.set(e.itemId, (used.get(e.itemId) ?? 0) + 1);
  const skip = new Set(skipped);
  return items
    .filter((i) => needsSetup(i) && !skip.has(i.id))
    .map((i) => ({ item: i, used: used.get(i.id) ?? 0 }))
    .sort((a, b) => b.used - a.used || String(a.item.nameDe || a.item.name).localeCompare(String(b.item.nameDe || b.item.name)));
}

/** The numbers for the head of the page: how many are all, still open, and how many lack a number or a place. */
export function setupCount(items = []) {
  const all = items.filter((i) => isClothing(i) && !OUT.has(i.ownership) && !everydayOnly(i));
  const open = all.filter(needsSetup);
  return {
    all: all.length,
    open: open.length,
    noTemp: open.filter((i) => typeof i.tempMin !== 'number' && typeof i.tempMax !== 'number').length,
    noPlace: open.filter((i) => !layerKey(i.layer) || !zoneGroup(i.zone)).length,
  };
}

/** The patch that saves a piece: its layer, zone and range. Only what is set; a missing step leaves the range as it is. */
export function setupPatch(item, { levels, layer, zone }) {
  const patch = {};
  if (layer && layerKey(item.layer) !== layer) patch.layer = layer;
  if (zone && zoneGroup(item.zone) !== zoneGroup(zone)) patch.zone = zone;
  if (levels?.length) Object.assign(patch, rangeOfLevels(levels));
  return patch;
}
