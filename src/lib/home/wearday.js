/**
 * «Was ziehe ich an? selbst anpassen», step 1 (Noah 27.10.2026 «1a 2a oder b wählbar 3a 4a … 5a»).
 *
 * The day choice: what you changed in the suggestion of «What do I wear today?». It holds for that
 * ride day only (step 2 adds «save in the set»), kept in the settings record WEAR_DAY:
 *   { date, pick: { [rowKey]: itemId | 'none' }, add: [rowKey] }
 * pick: the piece you chose for a row, or 'none' (leave the row out); add: rows you added although
 * the temperature does not need them yet (Noah 4a: the limits can be overridden).
 *
 * Also: why a row has no piece (gapReason), the pieces you can swap to (swapOptions) and the rule
 * in words (WHY_LIMITS). Pure functions only; the rule itself stays in wardrobe.js (ONION, outfitFor).
 */
import { ONION, matchesRow, warmEnough, best, isClothing, everydayOnly, layerKey, zoneGroup, guessZone, guessLayer, rainProof } from '../wardrobe.js';
import { isInventory } from '../gear.js';

export const WEAR_DAY = 'wear.day';
export const NONE = 'none';
const EMPTY = { pick: {}, add: [] };

/** The rows that come from a temperature on: below this felt temperature (wardrobe.js ONION). */
export const WHY_LIMITS = { mid: 15, outer: 12, hands: 12, head: 8, feet: 5 };

/** The choice of this ride day from the settings record (another day: nothing changed). */
export function dayChoice(rec, date) {
  const v = rec?.value;
  if (!v || !date || v.date !== date) return { pick: {}, add: [] };
  return { pick: { ...(v.pick ?? {}) }, add: [...(v.add ?? [])] };
}
export const dayRecord = (date, choice = EMPTY) => ({ key: WEAR_DAY, value: { date, pick: { ...choice.pick }, add: [...choice.add] } });
export const isChanged = (choice) => !!choice && (Object.keys(choice.pick ?? {}).length > 0 || (choice.add ?? []).length > 0);

export const withPick = (choice, key, id) => ({ pick: { ...choice.pick, [key]: id }, add: [...choice.add] });
export function withoutPick(choice, key) {
  const pick = { ...choice.pick };
  delete pick[key];
  return { pick, add: [...choice.add] };
}
export const withAdd = (choice, key) => ({ pick: { ...choice.pick }, add: choice.add.includes(key) ? [...choice.add] : [...choice.add, key] });
export const withoutAdd = (choice, key) => ({ ...withoutPick(choice, key), add: choice.add.filter((k) => k !== key) });

/** The clothing that counts for a ride: owned (or unclear), not gone, not everyday-only. */
const riding = (items) => items.filter((i) => isInventory(i) && isClothing(i) && !everydayOnly(i));
const rowOf = (key) => ONION.find((r) => r.key === key) ?? null;
/** The lower border of a piece: its tempMin, «warm» counts as 15 °C, else unknown (null). */
const floorOf = (i) => (typeof i.tempMin === 'number' ? i.tempMin : i.tempClass === 'warm' ? 15 : null);

/** How a piece fits a felt temperature: 'ok', 'light' (too light) or 'warm' (made for colder days). */
export function fitOf(item, c) {
  if (!warmEnough(item, c)) return 'light';
  if (typeof item.tempMax === 'number' && item.tempMax < c) return 'warm';
  return 'ok';
}

/**
 * The pieces you can choose for one row: every riding piece of that row. Those that fit first (the
 * app's choice on top), then the warmer ones, then the too light ones; each { item, fit }.
 */
export function swapOptions(key, items = [], c) {
  const row = rowOf(key);
  if (!row) return [];
  const mine = riding(items).filter((i) => matchesRow(row, i));
  const top = best(mine.filter((i) => warmEnough(i, c)), c);
  const rank = { ok: 0, warm: 1, light: 2 };
  const lo = (i) => floorOf(i) ?? -99;
  return mine
    .map((item) => ({ item, fit: fitOf(item, c) }))
    .sort((a, b) => Number(b.item === top) - Number(a.item === top) || rank[a.fit] - rank[b.fit] || lo(b.item) - lo(a.item) || String(a.item.name).localeCompare(String(b.item.name)));
}

/** Would this not yet sorted piece belong to the row (its guess from the name)? */
function guessedFor(row, i) {
  if (layerKey(i.layer) && zoneGroup(i.zone)) return false;
  const zone = zoneGroup(i.zone) ?? guessZone(i.name);
  if (row.zone) return zone === row.zone && !zoneGroup(i.zone);
  const layer = layerKey(i.layer) ?? guessLayer(i.name);
  return zone === 'upper' && layer === row.layer && !matchesRow(row, i);
}

/**
 * Why a row has no piece: { kind, from, unsorted, warmest }.
 * kind: 'rain' (nothing waterproof), 'light' (pieces there, all too light), 'unsorted' (only pieces
 * that still wait in «To sort»), 'none' (nothing at all). from: the lowest border of the pieces there;
 * unsorted: how many wait in «To sort»; warmest: the warmest piece there (for «Take it anyway»).
 */
export function gapReason(key, items = [], c, { rain = false } = {}) {
  const row = rowOf(key);
  if (!row) return { kind: 'none', from: null, unsorted: 0, warmest: null };
  const all = riding(items);
  const mine = all.filter((i) => matchesRow(row, i));
  const unsorted = all.filter((i) => guessedFor(row, i)).length;
  const floors = mine.map(floorOf).filter((n) => n != null);
  const warmest = [...mine].sort((a, b) => (floorOf(a) ?? 99) - (floorOf(b) ?? 99) || String(a.name).localeCompare(String(b.name)))[0] ?? null;
  const kind = rain && mine.some((i) => warmEnough(i, c) && !rainProof(i)) ? 'rain' : mine.length ? 'light' : unsorted ? 'unsorted' : 'none';
  return { kind, from: floors.length ? Math.min(...floors) : null, unsorted, warmest };
}

/**
 * The suggestion with your day choice on top: the rows of the outfit plus the rows you added; a
 * picked piece replaces the app's one, 'none' leaves the row empty. Each row: { key, name, item,
 * rain, added (you added it), mine (you changed it), none (you left it out) }.
 */
export function applyDay(outfit, items = [], choice = EMPTY) {
  if (!outfit) return null;
  const c = outfit.c;
  const byId = new Map(items.map((i) => [i.id, i]));
  const all = riding(items);
  const rows = [];
  for (const row of ONION) {
    const auto = outfit.rows.find((r) => r.key === row.key);
    const added = !auto && choice.add.includes(row.key);
    if (!auto && !added) continue;
    let item = auto ? auto.item : best(all.filter((i) => matchesRow(row, i) && warmEnough(i, c)), c);
    const p = choice.pick[row.key];
    const picked = p && p !== NONE ? byId.get(p) : null;
    if (p === NONE) item = null;
    else if (picked && isInventory(picked)) item = picked;
    rows.push({ key: row.key, name: row.name, item, rain: auto?.rain ?? false, added, mine: added || p === NONE || !!(picked && isInventory(picked)), none: p === NONE });
  }
  return { ...outfit, rows };
}

/** The rows you can still add (the temperature does not need them yet): [{ key, name }]. */
export const addableRows = (outfit, choice = EMPTY) => (outfit ? ONION.filter((r) => !outfit.rows.some((x) => x.key === r.key) && !choice.add.includes(r.key)).map((r) => ({ key: r.key, name: r.name })) : []);
