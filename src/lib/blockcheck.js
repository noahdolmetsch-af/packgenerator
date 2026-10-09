/**
 * v0.66.0 «Bausteine prüfen» (Noah 4a): one building block after the other, every item with its
 * weight and the block's total; per item «behalten», «raus» or «gehört woanders hin»; at the bottom
 * items from the inventory that probably belong there but are missing (by category and name).
 *
 * The steps: first what the update «Bausteine neu» left to check (blocksplit.js REVIEW_KEY): the
 * items «noch zuordnen» (from the old Lodging) and the temperature rules it set (from the old Warm),
 * then Standard and every block in the usual order. Prefills of the update show as suggestions.
 * Pure functions only; the page (pages/BlockCheck.svelte) writes and keeps the Undo.
 */
import { isInventory, itemWeight, sumKnown, isConsumable } from './gear.js';
import { allSets, qtyOf, blockLabel } from './sets.js';
import { STANDARD, inStandard, isWorn, leaveHome } from './blocks2026.js';
import { TENT_WORDS, HOTEL_WORDS, CHARGE_WORDS } from './blocksplit.js';
import { t } from './i18n.svelte.js';

const words = (i) => `${i?.name ?? ''} ${i?.nameDe ?? ''} ${i?.model ?? ''}`.toLowerCase();

/**
 * What a built-in block usually holds: categories (cats) and words (English and German). only:
 * the words count only in these categories (a charging cable is electronics, not "charge" anywhere).
 */
export const PROFILES = {
  bivy: { cats: ['sleep'], words: /schlafsack|sleeping bag|isomatte|sleeping ?pad|\bmat\b|matte|biwak|bivy|bivvy|rettungsdecke|emergency blanket|space blanket|m(ü|ue)tze|beanie/ },
  tent: { cats: [], words: TENT_WORDS },
  hotel: { cats: [], words: HOTEL_WORDS },
  cook: { cats: ['cook'], words: /kocher|stove|topf|\bpot\b|spork|tasse|\bmug\b|feuerzeug|lighter/ },
  firstaid: { cats: [], words: /erste hilfe|first aid|pflaster|plaster|bandage|verband|blister/ },
  repair: { cats: ['tools'], words: /schlauch|\btube\b|pumpe|\bpump\b|multitool|multi-tool|kettenschloss|chain link|quick ?link|reifenheber|tyre lever|tire lever|flickzeug|patch|co2|dichtmilch|sealant/ },
  charge: { cats: [], only: ['elec'], words: CHARGE_WORDS },
  lights: { cats: ['light'], words: /lampe|\blamp\b|licht|(front|rear|tail|bike|head) ?light|stirnlampe|headlamp|head torch|r(ü|ue)cklicht|reflekt|reflective|warnweste/ },
  race: { cats: [], words: /tracker|startnummer|race number|rettungsdecke|emergency blanket|space blanket|pflichtausr|mandatory|pfeife|whistle/ },
  food: { cats: ['food'], words: /riegel|\bbars?\b|\bgels?\b|elektrolyt|electrolyte|wasserfilter|water filter/ },
  hygiene: { cats: ['hyg'], words: /zahnb(ü|ue)rste|toothbrush|zahnpasta|toothpaste|sonnencreme|sunscreen|sun cream|chamois|sitzcreme|feuchtt(ü|ue)cher|wet wipes|toilet|klopapier|wc-papier/ },
  comfort: { cats: ['lux'], words: /kopfh(ö|oe)rer|headphones|earbuds|sitzkissen|seat cushion|flip.?flops?|badelatschen|kissen|pillow|kaffee|coffee|e-?reader|kindle|kamera|camera/ },
};

/** An own block: the category most of its items have (at least 2), else nothing to go by. */
function ownProfile(members) {
  const n = {};
  for (const i of members) if (i.category) n[i.category] = (n[i.category] ?? 0) + 1;
  const [cat, count] = Object.entries(n).sort((a, b) => b[1] - a[1])[0] ?? [];
  return count >= 2 ? { cats: [cat], words: null } : null;
}

/** Is the item in this block? Standard counts the items On me too (as the Blocks page shows it). */
export const inBlock = (item, key) => (key === STANDARD ? inStandard(item) || isWorn(item) : !!item?.sets?.includes(key));

/** The items of a block: inventory first, then the rest (wishes), each group by name. */
export function blockMembers(key, items) {
  const all = items.filter((i) => i.ownership !== 'gone' && inBlock(i, key));
  const byName = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''));
  return [...all.filter(isInventory).sort(byName), ...all.filter((i) => !isInventory(i)).sort(byName)];
}

/**
 * Items from the inventory that probably belong to the block but are not in it: same category
 * or a telling word (PROFILES; an own block: its main category). Not: items marked "stays at
 * home", bags, a tent outside Tent, water bottles for Food, and items already in it. At most `limit`, by name.
 */
export function missingFor(key, items, { limit = 6 } = {}) {
  if (key === STANDARD) return [];
  const members = items.filter((i) => inBlock(i, key));
  const p = PROFILES[key] ?? ownProfile(members);
  if (!p) return [];
  return items
    // Bags hold things, they are not in a block ("Top tube bag" is no tube); a tent only for Tent.
    .filter((i) => isInventory(i) && !leaveHome(i) && !inBlock(i, key) && i.category !== 'bags' && !(key === 'food' && i.waterL) && !(key !== 'tent' && TENT_WORDS.test(words(i))))
    .filter((i) => p.cats.includes(i.category) || (!!p.words && p.words.test(words(i)) && (!p.only || p.only.includes(i.category))))
    .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
    .slice(0, limit);
}

/**
 * The total of a block, honest (an unknown weight stays unknown): { g, missing, n }. Food and
 * water count apart (consumables, not base weight): { food: { g, missing } }.
 */
export function blockTotal(set, members) {
  const inv = members.filter(isInventory);
  const w = (i) => (itemWeight(i) == null ? null : itemWeight(i) * qtyOf(set, i.id));
  const gear = sumKnown(inv.filter((i) => !isConsumable(i)).map(w));
  const food = sumKnown(inv.filter(isConsumable).map(w));
  return { ...gear, n: inv.length, food };
}

/**
 * Every step of «Bausteine prüfen»: [{ kind: 'unassigned' | 'cold' | 'block', key, name, ids? }].
 * review: the settings REVIEW_KEY value (may be missing). Only ids of items that still exist count.
 */
export function checkSteps(items, setsValue, review) {
  const have = new Set(items.filter((i) => i.ownership !== 'gone').map((i) => i.id));
  const live = (ids) => (ids ?? []).filter((id) => have.has(id));
  const out = [];
  const un = live(review?.unassigned);
  if (un.length) out.push({ kind: 'unassigned', key: 'hotel', name: t('Still to assign'), ids: un });
  const cold = live(review?.cold);
  if (cold.length) out.push({ kind: 'cold', key: null, name: t('Temperature rules'), ids: cold });
  out.push({ kind: 'block', key: STANDARD, name: t('Standard|block') });
  for (const s of allSets(setsValue)) out.push({ kind: 'block', key: s.key, name: blockLabel(s), set: s });
  return out;
}

/** The ids the update suggested for this block and that are still open (shown with "suggested"). */
export const suggestedIn = (review, key) => new Set(review?.suggested?.[key] ?? []);

/**
 * The item's sets after "out of key" or "into key" (Standard writes its own fields: comes.js).
 * Returns the new sets array (the SAME array when nothing changes).
 */
export function withBlock(sets, key, on) {
  const list = Array.isArray(sets) ? sets : [];
  if (on) return list.includes(key) ? list : [...list, key];
  return list.includes(key) ? list.filter((k) => k !== key) : list;
}
