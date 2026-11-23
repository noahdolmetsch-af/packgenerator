/**
 * Kleider «heute» (Noah 23.11.2026, Thread «Kleiderschrank wieder ins Zentrum rücken»): the wardrobe page tidies
 * up by suggestion. Nothing is moved, merged or deleted by itself; every list here is a suggestion with a tap,
 * and the page gives each tap an Undo.
 *   - noRange: pieces in their place that still lack a temperature range, with the suggested steps
 *   - everydayGuess: pieces on the bike list whose name says everyday (swimwear, flip-flops, pyjama …)
 *   - duplicateGroups: pieces that carry the same name more than once (merge, never delete)
 *   - oddWeight: weights that look like a typo (1 g, exactly 1 kg) → «check?»
 * Pure functions; tests in tests/wardrobe-tidy.test.js.
 */
import { isClothing, everydayOnly, layerKey, zoneGroup } from './wardrobe.js';
import { suggestLevels } from './wardrobe-setup.js';

const OUT = new Set(['gone', 'wishlist', 'to-buy']);
const fold = (s) =>
  String(s ?? '')
    .replace(/^\s*test_data_gtp_\s*/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const mine = (i) => isClothing(i) && !OUT.has(i.ownership);

/** Pieces of the bike wardrobe that are in their layer and zone but have no temperature range, each with the steps the name suggests. */
export function noRange(items = []) {
  return items
    .filter((i) => mine(i) && !everydayOnly(i) && layerKey(i.layer) && zoneGroup(i.zone) && typeof i.tempMin !== 'number' && typeof i.tempMax !== 'number')
    .map((item) => ({ item, levels: suggestLevels(item) }))
    .sort((a, b) => Number(b.levels.length > 0) - Number(a.levels.length > 0) || String(a.item.name).localeCompare(String(b.item.name)));
}

const EVERYDAY_WORDS = /badehose|badeanzug|bikini|badeschlappen|bade ?schuh|flip ?flop|crocs|schlafhose|pyjama|schlafanzug|nachthemd|yoga|boxershort|turnschuh|sneaker|chill ?schuh|hausschuh|finken|jeans|pantoffel/;
/** Pieces that count for cycling but whose name says everyday; skipped: ids the user said stay. */
export function everydayGuess(items = [], skipped = []) {
  const skip = new Set(skipped);
  return items.filter((i) => mine(i) && !everydayOnly(i) && !skip.has(i.id) && EVERYDAY_WORDS.test(fold(`${i.nameDe ?? ''} ${i.name ?? ''}`)));
}

/** Groups of two or more owned pieces with the same name: [{ name, items }], the oldest-looking (first by id) first in a group. */
export function duplicateGroups(items = []) {
  const by = new Map();
  for (const i of items.filter(mine)) {
    const k = fold(i.nameDe || i.name);
    if (!k) continue;
    by.set(k, [...(by.get(k) ?? []), i]);
  }
  return [...by.values()]
    .filter((g) => g.length > 1)
    .map((g) => ({ name: g[0].nameDe || g[0].name, items: [...g].sort((a, b) => String(a.id).localeCompare(String(b.id))) }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/** A weight that looks like a typo: under 5 g, or exactly a whole kilogram (1 kg, 2 kg …). Without a weight: false. */
export function oddWeight(item) {
  const g = item?.weightG; // one piece, not times the quantity
  if (g == null || !Number.isFinite(g) || g <= 0) return false;
  return g < 5 || (g >= 1000 && g % 1000 === 0);
}
