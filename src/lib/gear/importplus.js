/**
 * SN5+ «Import prüfen» (Noah 13.10.2026, answers 4a 5b): pure rules for the new parts of the page.
 *
 * - I1 importWeight: the weight of the gear list before and after the import; only what is on
 *   «Übernehmen» counts, and only owned items (the wishlist is not in the gear list). Unweighed new
 *   items are named in a quiet line.
 * - I2 changeLines: what an item that is already there gets («+ Reiseart Alltag», «+ Notiz …») and
 *   what stays («bleibt: Gewicht 60 g, Name, Kategorie»). The internal source ID is not shown.
 * - I3 suggestBag: a bag for each new item from its category (4a: a suggestion, changeable with a tap).
 * - I4/5b the import history: every applied import keeps what it added and the values it changed
 *   (importRecord), the last KEEP of them in the «meta» record HISTORY (never exported). undoPlan takes
 *   back ONE of them, also an older one: only what nobody changed since; the rest stays and is named.
 */
import { isInventory, itemWeight } from '../gear.js';

/* ---------- I3 a bag from the category ---------- */

/** The usual bag of a category (BAGS keys in gear.js); null: none suggested (bags themselves). */
export const BAG_BY_CATEGORY = {
  elec: 'top',
  light: 'top',
  onbike: 'body',
  rain: 'seat',
  offbike: 'seat',
  shoes: 'seat',
  tools: 'frame',
  food: 'frame',
  cook: 'frame',
  sleep: 'seat',
  hyg: 'seat',
  docs: 'top',
  bags: null,
  bike: 'mounted',
  lux: 'seat',
};
/** The bags offered as buttons when the place of a new item is opened. */
export const BAG_CHOICES = ['top', 'frame', 'seat', 'bar', 'body', 'mounted'];

/** The suggested bag for a category (unknown category: the seat pack, the big dry place). */
export const suggestBag = (category) => (category in BAG_BY_CATEGORY ? BAG_BY_CATEGORY[category] : 'seat');

/* ---------- I1 weight before and after ---------- */

const numOrNull = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) || Number(v) <= 0 ? null : Math.round(Number(v)));

/** The known weight of the gear list (owned items, not gone; unweighed ones left out). */
export const gearGrams = (items) => items.filter(isInventory).reduce((g, i) => g + (itemWeight(i) ?? 0), 0);

/**
 * { before, after, delta, unweighed: [names] } of the staged plan (gearimport.js planGearImport).
 * decisions: the staged decisions (SKIP leaves a new item out; 'new' or an item ID for an unsure one).
 * Counts: the new items taken, a weight filled into an item that had none, the decided unsure lines.
 */
export function importWeight(plan, items, decisions = {}, skip = 'skip') {
  const before = gearGrams(items);
  let delta = 0;
  const unweighed = [];
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const r of plan?.fresh ?? []) {
    if (decisions[r.key] === skip || !isInventory(r.item)) continue;
    const g = itemWeight(r.item);
    if (g == null) unweighed.push(r.item.name);
    else delta += g;
  }
  const fill = (item, imp) => (item && isInventory(item) && item.weightG == null && numOrNull(imp.weightG) != null ? numOrNull(imp.weightG) * (item.qty || 1) : 0);
  for (const r of plan?.same ?? []) delta += fill(r.item, r.imp);
  for (const r of plan?.unsure ?? []) {
    const d = decisions[r.key];
    if (d === 'new') {
      if (r.imp.owned === false) continue;
      const w = numOrNull(r.imp.weightG);
      if (w == null) unweighed.push(r.imp.name);
      else delta += w * Math.max(1, Math.round(Number(r.imp.qty)) || 1);
    } else if (d && byId.has(d)) delta += fill(byId.get(d), r.imp);
  }
  return { before, after: before + delta, delta, unweighed };
}

/* ---------- I2 what an item that is already there gets ---------- */

/** The fields never shown as a change (internal IDs). */
export const HIDDEN_FIELDS = ['sourceId', 'mergedIds'];

/**
 * A «Schon da» row (planGearImport same row with adds): { adds, stays }.
 * adds: [{ field, value }] without the internal IDs. stays: what the import does not touch,
 * [{ field, value? }]: the weight (when the item has one), the name and the category.
 */
export function changeLines(row) {
  const adds = (row?.adds ?? []).filter((a) => !HIDDEN_FIELDS.includes(a.field));
  const changed = new Set(adds.map((a) => a.field));
  const item = row?.item ?? {};
  const stays = [];
  if (item.weightG != null && !changed.has('weightG')) stays.push({ field: 'weightG', value: itemWeight(item) });
  stays.push({ field: 'name' });
  if (item.category && !changed.has('category')) stays.push({ field: 'category' });
  return { adds, stays };
}

/* ---------- I4 / 5b the last imports, each one can be undone ---------- */

/** Key in the «meta» table: the last applied imports (never exported). */
export const HISTORY = 'gearImportHistory';
/** How many imports are kept. */
export const KEEP = 3;

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
/** Fields an undo never compares or writes back by itself. */
const SKIP_FIELDS = new Set(['id', 'updatedAt']);

/** What changed from one record to the next: { before, after, absent } (absent: fields that were not there). */
function diff(was, now) {
  const before = {};
  const after = {};
  const absent = [];
  for (const k of new Set([...Object.keys(was), ...Object.keys(now)])) {
    if (SKIP_FIELDS.has(k) || same(was[k], now[k])) continue;
    if (!(k in was)) absent.push(k);
    else before[k] = was[k];
    after[k] = now[k] ?? null;
  }
  return { before, after, absent };
}

/**
 * The history entry of one apply: what it added and the values it changed, enough to take it back.
 * pre: the items before; written: the records the apply put. learnPre / learnAdd / learnUpdate: the
 * learnings before, the new ones, the updates ({ id, changes }).
 */
export function importRecord({ at, name = '', counts = {}, pre = [], written = [], learnPre = [], learnAdd = [], learnUpdate = [] }) {
  const byId = new Map(pre.map((i) => [i.id, i]));
  const added = [];
  const changed = [];
  for (const rec of written) {
    const was = byId.get(rec.id);
    if (!was) added.push({ id: rec.id, name: rec.name, updatedAt: rec.updatedAt ?? null });
    else {
      const d = diff(was, rec);
      if (Object.keys(d.after).length) changed.push({ id: rec.id, name: was.name, ...d });
    }
  }
  const after = new Map(pre.filter(isInventory).map((i) => [i.id, i]));
  for (const rec of written) after.set(rec.id, rec);
  const grams = gearGrams([...after.values()]) - gearGrams(pre);
  const lById = new Map(learnPre.map((l) => [l.id, l]));
  const learnChanged = learnUpdate
    .filter((u) => lById.has(u.id))
    .map((u) => {
      const was = lById.get(u.id);
      return { id: u.id, ...diff(was, { ...was, ...u.changes }) };
    });
  return {
    // the time alone is not unique (two applies within one millisecond, or a fixed test clock)
    id: `imp-${at}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    name,
    counts: { added: counts.added ?? 0, completed: (counts.enriched ?? 0) + (counts.merged ?? 0), wishlist: counts.wishlist ?? 0 },
    grams,
    added,
    changed,
    learnAdded: learnAdd.map((l) => ({ ...l })),
    learnChanged,
  };
}

/** The history with a new entry first, the last KEEP kept. */
export const pushHistory = (list, entry) => [entry, ...(list ?? []).filter((e) => e.id !== entry.id)].slice(0, KEEP);

/**
 * Take back ONE import (also an older one): { delItems, putItems, delLearn, putLearn, kept, done }.
 *   - an item it added goes, unless it changed since (updatedAt) or a trip uses it: it stays (kept).
 *   - a value it changed goes back, unless the field holds another value now (a later edit or a
 *     later import): that field stays (kept).
 *   - a learning it added goes unless changed since; a learning it completed gets its old values back.
 * kept: [{ id, name, why: 'changed' | 'trip' }] for the quiet line; done: how many records changed.
 */
export function undoPlan(entry, { items = [], learnings = [], trips = [] } = {}, now = new Date().toISOString()) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const used = new Set(trips.flatMap((t) => (t.entries ?? []).map((e) => e?.itemId)));
  const delItems = [];
  const putItems = [];
  const kept = [];
  for (const a of entry?.added ?? []) {
    const cur = byId.get(a.id);
    if (!cur) continue;
    if (used.has(a.id)) kept.push({ id: a.id, name: cur.name, why: 'trip' });
    else if (a.updatedAt && cur.updatedAt !== a.updatedAt) kept.push({ id: a.id, name: cur.name, why: 'changed' });
    else delItems.push(a.id);
  }
  for (const c of entry?.changed ?? []) {
    const cur = byId.get(c.id);
    if (!cur) continue;
    const next = { ...cur };
    let back = 0;
    let stay = 0;
    for (const [k, v] of Object.entries(c.after)) {
      if (!same(cur[k], v)) {
        stay++;
        continue;
      }
      if (c.absent.includes(k)) delete next[k];
      else next[k] = c.before[k];
      back++;
    }
    if (stay) kept.push({ id: c.id, name: cur.name, why: 'changed' });
    if (back) putItems.push({ ...next, updatedAt: now });
  }
  const lById = new Map(learnings.map((l) => [l.id, l]));
  const delLearn = [];
  const putLearn = [];
  for (const l of entry?.learnAdded ?? []) {
    const cur = lById.get(l.id);
    if (!cur) continue;
    if (same(cur, l)) delLearn.push(l.id);
    else kept.push({ id: l.id, name: cur.rule ?? '', why: 'changed', learning: true });
  }
  for (const c of entry?.learnChanged ?? []) {
    const cur = lById.get(c.id);
    if (!cur) continue;
    const next = { ...cur };
    let back = 0;
    for (const [k, v] of Object.entries(c.after)) {
      if (!same(cur[k], v)) continue;
      if (c.absent.includes(k)) delete next[k];
      else next[k] = c.before[k];
      back++;
    }
    if (back) putLearn.push(next);
  }
  return { delItems, putItems, delLearn, putLearn, kept, done: delItems.length + putItems.length + delLearn.length + putLearn.length };
}
