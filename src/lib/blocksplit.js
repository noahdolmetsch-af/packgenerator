/**
 * v0.66.0 «Bausteine neu» (Noah, Trello 9.10.2026, answers 5a–10b): the one-time update of the
 * building blocks, in the same way as blocks2026.js (pure functions; updates.js writes them).
 *
 *   base, sleep  → bivy «Biwak» (5a + 8a: Base and Sleep merged, then replaced by Bivouac);
 *                  a tent, pegs or a footprint → tent «Zelt»
 *   warm         → no block any more (6a): the item gets a temperature rule (coldBelow). One it has
 *                  stays; without one it gets COLD_DEFAULT (10 °C), listed first in «Bausteine prüfen»
 *   light        → lights «Licht» (7a)
 *   lodging      → hotel «Hotel/Hütte», or tent by its name (8a). An item the words do not place
 *                  stays in Hotel/Hütte for now and is listed under «noch zuordnen» in «Bausteine prüfen»
 *   new blocks   → empty, except obvious category matches (9a): tools → repair, a charging item of
 *                  electronics → charge, hygiene → hygiene (not first aid), food → food (not bottles).
 *                  Every such prefill is a suggestion in «Bausteine prüfen», never final.
 *
 * Nothing is deleted: the old keys stay on item.sets (gear.js OLD_SETS; the app reads them no more),
 * so a backup still opens in an older version for two versions. A migrated item gets split2026: true,
 * so a second run (or a later start) never changes it again; an item someone takes out of a block
 * afterwards stays out. Amounts in a block (settings 'sets', qty) move with their items; templates
 * that held an old block hold the new ones with exactly the same items (templates.js linkEntries).
 */
import { isInventory, isOldSetKey } from './gear.js';
import { isLinked, templateItems, linkEntries } from './templates.js';
import { leaveHome } from './blocks2026.js';

/** Settings key of the one-time update. */
export const SPLIT_MARKER = 'update.blockSplit2026';
/** Settings key of what «Bausteine prüfen» lists first: { cold, unassigned, suggested: { key: [id] } }. */
export const REVIEW_KEY = 'blockReview';
/** 6a: the temperature rule an item of the old Warm gets when it has none. */
export const COLD_DEFAULT = 10;

const words = (i) => `${i?.name ?? ''} ${i?.nameDe ?? ''} ${i?.model ?? ''}`.toLowerCase();
/** A tent, its pegs, its footprint (English and German). */
export const TENT_WORDS = /\btents?\b|zelt|hering|\bpegs?\b|footprint|groundsheet|bodenplane/;
/** Things for a night in a hotel or hut: liner, earplugs, evening clothes and slippers. */
export const HOTEL_WORDS = /liner|inlett|h(ü|ue)ttenschlafsack|seidenschlafsack|ohrst(ö|oe)psel|ohropax|earplug|ear plug|evening|abend|slipper|hausschuh|finken/;
/** A charging item among the electronics: power bank, cable, charger. */
export const CHARGE_WORDS = /power ?bank|akku ?pack|cable|kabel|charg|lade|usb|netzteil|adapter/;

export const isTent = (item) => TENT_WORDS.test(words(item));
export const isHotel = (item) => HOTEL_WORDS.test(words(item)) || item?.category === 'offbike';

/**
 * 9a: the new block an item clearly belongs to by its category, or null. Only inventory items
 * that are not marked "stays at home".
 */
export function prefillKey(item) {
  if (!item || !isInventory(item) || leaveHome(item)) return null;
  if (item.category === 'tools') return 'repair';
  if (item.category === 'elec' && CHARGE_WORDS.test(words(item))) return 'charge';
  if (item.category === 'hyg' && !item.sets?.includes('firstaid')) return 'hygiene';
  if (item.category === 'food' && !item.waterL) return 'food';
  return null;
}

/** Does the item still need the update? (an old key, not migrated yet) */
export const needsSplit = (item) => !!item && !item.split2026 && Array.isArray(item.sets) && item.sets.some(isOldSetKey);

/**
 * One item. prefill: also put it into a new block by its category (only on the first run).
 * → { item (the SAME object when nothing changes), moves: [{ from, to }], suggested: [key],
 *     unassigned, cold }
 */
export function splitItem(item, { prefill = false } = {}) {
  const none = { item, moves: [], suggested: [], unassigned: false, cold: false };
  if (!item || typeof item !== 'object' || item.split2026) return none;
  const sets = Array.isArray(item.sets) ? item.sets : [];
  const old = sets.filter(isOldSetKey);
  const p0 = prefill ? prefillKey(item) : null;
  const pre = p0 && !sets.includes(p0) ? p0 : null;
  if (!old.length && !pre) return none;
  const moves = [];
  const suggested = [];
  let unassigned = false;
  let cold = false;
  const patch = {};
  const tent = isTent(item);
  for (const k of old) {
    if (k === 'base' || k === 'sleep') {
      moves.push({ from: k, to: tent ? 'tent' : 'bivy' });
      // Base (towel, toothbrush …) may not belong to a bivouac: shown to check. A tent by its name too.
      if (tent) suggested.push('tent');
      else if (k === 'base') suggested.push('bivy');
    } else if (k === 'light') moves.push({ from: k, to: 'lights' });
    else if (k === 'lodging') {
      moves.push({ from: k, to: tent ? 'tent' : 'hotel' });
      if (tent) suggested.push('tent');
      else if (!isHotel(item)) unassigned = true;
    } else if (k === 'warm' && typeof item.coldBelow !== 'number') {
      patch.coldBelow = COLD_DEFAULT;
      cold = true;
    }
  }
  if (pre) suggested.push(pre);
  const add = [...new Set([...moves.map((m) => m.to), ...(pre ? [pre] : [])])].filter((k) => !sets.includes(k));
  const out = { ...item, ...patch, ...(add.length ? { sets: [...sets, ...add] } : {}), split2026: true };
  return { item: out, moves, suggested: [...new Set(suggested)].filter((k) => !sets.includes(k)), unassigned, cold };
}

/**
 * The amounts of the old blocks (settings 'sets', qty) on the new keys, for the items that moved.
 * The old records stay (older versions read them). Returns the SAME value when nothing changes.
 */
export function splitSets(value, movesById) {
  const list = Array.isArray(value) ? value : [];
  const add = {};
  for (const rec of list) {
    if (!rec?.key || !isOldSetKey(rec.key) || !rec.qty) continue;
    for (const [id, n] of Object.entries(rec.qty)) {
      const to = (movesById.get(id) ?? []).find((m) => m.from === rec.key)?.to;
      if (to && Number(n) > 1) (add[to] ??= {})[id] = Number(n);
    }
  }
  if (!Object.keys(add).length) return value;
  const out = list.map((s) => (add[s?.key] ? { ...s, qty: { ...add[s.key], ...(s.qty ?? {}) } } : s));
  for (const [key, qty] of Object.entries(add)) if (!out.some((s) => s?.key === key)) out.push({ key, qty });
  return out;
}

/** The items a template holds now, with the amounts of its old blocks (allSets no longer knows them). */
function contentOf(tpl, items, setsValue) {
  if (!isLinked(tpl)) return (tpl.entries ?? []).map((e) => ({ ...e }));
  const rec = (key) => (Array.isArray(setsValue) ? setsValue : []).find((s) => s?.key === key);
  return templateItems(tpl, items, setsValue).map(({ itemId, slot, qty, block }) => {
    const n = isOldSetKey(block) && tpl.qty?.[itemId] == null ? Number(rec(block)?.qty?.[itemId]) || 1 : qty;
    return { itemId, slot, qty: n };
  });
}

/**
 * One template: old block keys in tpl.blocks become the new ones its items went to (a template
 * with Lodging and a tent in it gets Hotel/hut and Tent); the items stay exactly the same (linked
 * templates are linked again with linkEntries: what a new block holds beyond them goes to
 * `without`, the old Warm items to the extras). Returns the SAME object when nothing changes.
 */
export function splitTemplate(tpl, { before, after, setsBefore = [], setsAfter = [], movesById = new Map() }) {
  if (!tpl || !Array.isArray(tpl.blocks) || !tpl.blocks.some(isOldSetKey)) return tpl;
  const content = contentOf(tpl, before, setsBefore);
  const ids = new Set(content.map((e) => e.itemId));
  const blocks = [];
  for (const key of tpl.blocks) {
    if (!isOldSetKey(key)) {
      blocks.push(key);
      continue;
    }
    const to = new Set();
    for (const id of ids) for (const m of movesById.get(id) ?? []) if (m.from === key) to.add(m.to);
    blocks.push(...to);
  }
  const clean = [...new Set(blocks)];
  if (!isLinked(tpl)) return { ...tpl, blocks: clean };
  return linkEntries({ ...tpl, blocks: clean }, content, after, setsAfter);
}

/** Add ids to a review list without doubles. */
const union = (a = [], b = []) => [...new Set([...a, ...b])];

/**
 * The whole update, without a database.
 * data: { items, templates, sets (settings 'sets' value), review (settings REVIEW_KEY value) }
 * first: true on the first run (marker missing): the category prefills are made only then; later
 * runs only map items that still carry an old key (an older backup merged in).
 * → { items, templates, sets, review, changedItems, changedTemplates, setsChanged, marker }
 */
export function splitAll({ items = [], templates = [], sets = [], review = null } = {}, { first = true, now = new Date().toISOString() } = {}) {
  const movesById = new Map();
  const rev = { cold: [...(review?.cold ?? [])], unassigned: [...(review?.unassigned ?? [])], suggested: { ...(review?.suggested ?? {}) } };
  const outItems = items.map((i) => {
    if (!first && !needsSplit(i)) return i;
    const r = splitItem(i, { prefill: first });
    if (r.item === i) return i;
    if (r.moves.length) movesById.set(i.id, r.moves);
    if (r.cold) rev.cold = union(rev.cold, [i.id]);
    if (r.unassigned) rev.unassigned = union(rev.unassigned, [i.id]);
    for (const k of r.suggested) rev.suggested[k] = union(rev.suggested[k], [i.id]);
    return r.item;
  });
  const outSets = splitSets(sets, movesById);
  const list = Array.isArray(templates) ? templates : [];
  const outTemplates = list.map((t) => splitTemplate(t, { before: items, after: outItems, setsBefore: sets, setsAfter: outSets, movesById }));
  return {
    items: outItems,
    templates: outTemplates,
    sets: outSets,
    setsChanged: outSets !== sets,
    review: { ...rev, at: review?.at ?? now },
    changedItems: outItems.filter((i, n) => i !== items[n]).map((i) => i.id),
    changedTemplates: outTemplates.filter((t, n) => t !== list[n]).map((t) => t.id),
    marker: { key: SPLIT_MARKER, value: now },
  };
}

/** Would the update change anything here? (an item or template with an old key) */
export const needsSplitUpdate = ({ items = [], templates = [] } = {}) =>
  items.some(needsSplit) || (Array.isArray(templates) && templates.some((t) => Array.isArray(t?.blocks) && t.blocks.some(isOldSetKey)));

/**
 * After a backup import: delete the marker so the update runs again (with the category prefills)?
 * Only a "replace" with a file from before the update (no marker in it); a merge maps the old items
 * on the next start anyway (needsSplit), without new prefills.
 */
export function splitRerunAfterImport(data, mode = 'replace') {
  const rows = data?.tables?.settings ?? [];
  return mode === 'replace' && !rows.some((r) => r?.key === SPLIT_MARKER && r.value);
}

/* ---------- «Bausteine prüfen»: the review list ---------- */

/**
 * The review record without the given ids (an action in «Bausteine prüfen» settled them).
 * key: only from the suggestions of that block; list: only from 'cold' or 'unassigned';
 * neither: from everything.
 */
export function settle(review, ids, { key = null, list = null } = {}) {
  const drop = new Set(ids);
  const rest = (l) => (l ?? []).filter((id) => !drop.has(id));
  const all = !key && !list;
  const suggested = Object.fromEntries(Object.entries(review?.suggested ?? {}).map(([k, l]) => [k, all || k === key ? rest(l) : l]).filter(([, l]) => l.length));
  return {
    ...(review ?? {}),
    cold: all || list === 'cold' ? rest(review?.cold) : review?.cold ?? [],
    unassigned: all || list === 'unassigned' ? rest(review?.unassigned) : review?.unassigned ?? [],
    suggested,
  };
}

/** Is anything left to check? */
export const reviewOpen = (review) => !!review && ((review.cold?.length ?? 0) + (review.unassigned?.length ?? 0) + Object.values(review.suggested ?? {}).reduce((n, l) => n + l.length, 0)) > 0;
