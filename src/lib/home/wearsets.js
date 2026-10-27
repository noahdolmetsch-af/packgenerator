/**
 * «Kleider-Sets», step 2 of «Was ziehe ich an? selbst anpassen» (Noah 27.10.2026 «1a 2a oder b
 * wählbar 3a 4a 5a»). A clothing set is a building block (settings "sets") whose pieces carry its
 * key in item.sets, like the temperature kits of the import: Pack suggests the same sets (5a).
 *  - 3a: the nine sample sets of wearpresets.js are created once (seedPlan), with the owned pieces
 *    that fit their temperature; all can be renamed, changed and deleted.
 *  - 1a: the set that fits today comes first (matchSet); a row the set has no piece for is filled by
 *    the app as before (setOutfit).
 *  - 2 «a oder b wählbar»: a swap holds for today only or goes into the set (WEAR_REMEMBER, setRowPlan).
 * Pure functions only.
 */
import { WEAR_PRESETS, presetKey } from '../wearpresets.js';
import { allSets } from '../sets.js';
import { ONION, matchesRow, warmEnough, best, isClothing, everydayOnly, inUse, EVERYDAY, tempKits, chooseKit, onionRows } from '../wardrobe.js';
import { isInventory } from '../gear.js';
import { NONE } from './wearday.js';

export const WEAR_SEEDED = 'wear.seeded';
export const WEAR_REMEMBER = 'wear.remember';
export const REMEMBER = ['today', 'set'];
export const AUTO = 'auto';
/** Rain: the rain set fits a wet ride below this felt temperature. */
export const RAIN_BELOW = 18;

const pool = (items, everyday = false) => items.filter((i) => isInventory(i) && isClothing(i) && (everyday ? inUse(i, EVERYDAY) : !everydayOnly(i)));
const lowest = (list) => [...list].sort((a, b) => (typeof a.tempMin === 'number' ? a.tempMin : 99) - (typeof b.tempMin === 'number' ? b.tempMin : 99))[0] ?? null;

/**
 * The sample sets that are not there yet, with the owned pieces the onion picks at their temperature:
 * { value (the settings value "sets"), items (only the changed pieces), added (how many sets) }.
 * A set you deleted is not made again: seeding runs once (WEAR_SEEDED).
 */
export function seedPlan(value, items = [], now = new Date().toISOString()) {
  const list = Array.isArray(value) ? value : [];
  const have = new Set(list.map((s) => s?.key));
  const add = [];
  const member = new Map();
  for (const p of WEAR_PRESETS) {
    const key = presetKey(p.preset);
    if (have.has(key)) continue;
    add.push({ key, preset: p.preset, ...(p.minC != null ? { minC: p.minC } : {}), ...(p.maxC != null ? { maxC: p.maxC } : {}), ...(p.rain ? { rain: true } : {}) });
    for (const r of onionRows(pool(items, p.everyday), p.seedC, !!p.rain)) if (r.item) member.set(r.item.id, [...(member.get(r.item.id) ?? []), key]);
  }
  const changed = items.filter((i) => member.has(i.id)).map((i) => ({ ...i, sets: [...new Set([...(i.sets ?? []), ...member.get(i.id)])], updatedAt: now }));
  return { value: [...list, ...add], items: changed, added: add.length };
}

/** The clothing sets: the sample sets and every block with a temperature range (sets.js allSets). */
export const wearSets = (value) => allSets(value).filter((s) => s.preset || typeof s.minC === 'number' || typeof s.maxC === 'number');

/** The set that fits a ride (felt °C): wet and below 18 °C the rain set, else the kit for c (yours before the samples). */
export function matchSet(sets = [], c, wet = false) {
  if (c == null) return null;
  if (wet && c < RAIN_BELOW) {
    const rain = sets.find((s) => s.rain);
    if (rain) return rain;
  }
  return chooseKit(tempKits(sets), c, 0);
}

/** The set shown today: your choice of the day (AUTO: none), else the one that fits. */
export function activeSet(sets = [], choiceSet, match) {
  if (choiceSet === AUTO) return null;
  return (choiceSet && sets.find((s) => s.key === choiceSet)) || match || null;
}

/** The sets for the chips: the one that fits first, then the others in their order. */
export const orderedSets = (sets = [], match) => (match ? [match, ...sets.filter((s) => s.key !== match.key)] : [...sets]);

/** The owned clothing of a set (the everyday set holds everyday clothes as well). */
export const setPieces = (set, items = []) => (set ? items.filter((i) => isInventory(i) && isClothing(i) && (i.sets ?? []).includes(set.key)) : []);

/**
 * The suggestion with a set on top (1a): a row the set has a piece for shows that piece (the warm
 * enough one first); a row the set leaves out (set.off) stays empty; every other row as the app
 * picked it. Rows: { key, name, item, rain, fromSet, setOff, light (the set piece is too light) }.
 */
export function setOutfit(outfit, set, items = []) {
  if (!outfit || !set) return outfit;
  const c = outfit.c;
  const mine = setPieces(set, items);
  const off = set.off ?? [];
  const rows = [];
  for (const row of ONION) {
    const auto = outfit.rows.find((r) => r.key === row.key);
    const ms = mine.filter((i) => matchesRow(row, i));
    if (off.includes(row.key)) {
      if (auto) rows.push({ ...auto, item: null, fromSet: false, setOff: true, light: false });
      continue;
    }
    if (!auto && !ms.length) continue;
    if (!ms.length) {
      rows.push({ ...auto, fromSet: false, setOff: false, light: false });
      continue;
    }
    const item = best(ms.filter((i) => warmEnough(i, c)), c) ?? lowest(ms);
    rows.push({ key: row.key, name: row.name, item, rain: auto?.rain ?? false, fromSet: true, setOff: false, light: !warmEnough(item, c) });
  }
  return { ...outfit, rows };
}

/**
 * A swap saved in the set (2b): the set holds this piece for the row (its other pieces there leave
 * the set, they stay in the wardrobe); NONE: the set leaves the row out; null: the set no longer
 * decides the row, the app picks. → { value, items (changed pieces), before (their old records) }.
 */
export function setRowPlan(value, items = [], setKey, rowKey, id, now = new Date().toISOString()) {
  const list = Array.isArray(value) ? value : [];
  const row = ONION.find((r) => r.key === rowKey);
  if (!row || !list.some((s) => s.key === setKey)) return { value: list, items: [], before: [] };
  const out = [];
  for (const i of items) {
    const has = (i.sets ?? []).includes(setKey);
    if (i.id === id && !has) out.push({ ...i, sets: [...(i.sets ?? []), setKey], updatedAt: now });
    else if (i.id !== id && has && isClothing(i) && matchesRow(row, i)) out.push({ ...i, sets: i.sets.filter((k) => k !== setKey), updatedAt: now });
  }
  const next = list.map((s) => {
    if (s.key !== setKey) return s;
    const off = (s.off ?? []).filter((k) => k !== rowKey);
    const { off: _, ...rest } = s;
    if (id === NONE) return { ...rest, off: [...off, rowKey] };
    return off.length ? { ...rest, off } : rest;
  });
  const ids = new Set(out.map((i) => i.id));
  return { value: next, items: out, before: items.filter((i) => ids.has(i.id)) };
}

/** Fill a set with what the window shows now (rows with a piece): one plan for all rows. */
export function fillPlan(value, items = [], setKey, rows = [], now = new Date().toISOString()) {
  let v = value;
  let cur = items;
  const before = new Map();
  for (const r of rows) {
    if (!r.item) continue;
    const p = setRowPlan(v, cur, setKey, r.key, r.item.id, now);
    for (const b of p.before) if (!before.has(b.id)) before.set(b.id, b);
    const byId = new Map(p.items.map((i) => [i.id, i]));
    cur = cur.map((i) => byId.get(i.id) ?? i);
    v = p.value;
  }
  const changed = cur.filter((i) => before.has(i.id));
  return { value: v, items: changed, before: [...before.values()] };
}
