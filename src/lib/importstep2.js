/**
 * v0.42.0 "Excel Schritt 2" (Noah, picture draft answers 4, 7-11): the second tab of "Import prüfen"
 * (#/gear/import): kits, building blocks, tasks and old trips from the same import file.
 *
 * The file (kind 'gear-import', see gearimport.js) may carry four more lists:
 *   kits:     [{ id: 'K1', name, minC, maxC, items: [sourceId…], note }]  temperature kits
 *   blocks:   [{ id: 'F01' | 'B01', name, items: [sourceId…], note }]     favourite kits and Excel building blocks
 *   tasks:    [{ id: 'A001', text, group }]                               preparation tasks
 *   oldTrips: [{ id: 'T001', name, date, note }]                          trips before the app
 * minC null: "below maxC"; maxC null: "above minC". date: null, a year ("2025") or an ISO date.
 *
 * What becomes of them:
 * - A temperature kit becomes a building block with its range (settings 'sets': { key, name, minC,
 *   maxC, sourceId, note }); its items get the block's key in item.sets. Pack suggests it (wardrobe.js).
 * - A favourite kit or Excel block that shares ≥ 70 % of its items with a building block you have
 *   (shared / the larger of the two) gets the choice Zusammenlegen | Neu | Weglassen; merge adds its
 *   items to that block and remembers the id on it (mergedIds). Any other becomes a new block.
 * - The tasks become ONE list, "Vorbereitungsliste": maintenance records { area: 'Preparation',
 *   list: PREP_LIST, sourceId }. They show before a trip only for events and bikepacking trips of
 *   more than 4 nights (care.js prepFor).
 * - Old trips become read-only notes in the Logbook (events: { id: 'xl-T001', source: 'excel' }).
 *
 * Items are named by their sourceId (M0001 …) and found by sourceId, mergedIds or the app's own ID.
 * An id that is not found is listed quietly ("nicht gefunden"), never an error.
 * Re-importing the same file changes nothing twice: everything is matched by its id (K1, F01, B01, A001, T001).
 *
 * Pure functions only; src/lib/gear/importdb.js writes the result (with a backup and undo).
 */
import { allSets, addSet } from './sets.js';

import { PREP_LIST } from './care.js';
export { PREP_LIST };
/** From this share of the same items on, a block is offered to merge. */
export const SIMILAR_AT = 0.7;
const LISTS = ['kits', 'blocks', 'tasks', 'oldTrips'];

const str = (v) => (v == null ? '' : String(v).trim());
const numOr = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

/** Does the file carry anything for step 2? */
export const hasStep2 = (data) => !!data && LISTS.some((k) => Array.isArray(data[k]) && data[k].length);

/** Problems with the step-2 lists (English keys for t()); used by gearimport.js validateGearImport. */
export function validateStep2(data) {
  const problems = [];
  for (const k of LISTS) {
    if (data[k] == null) continue;
    if (!Array.isArray(data[k])) {
      problems.push(`The list "${k}" in the file is not a list.`);
      continue;
    }
    if (data[k].some((x) => !x || typeof x !== 'object' || !str(x.id))) problems.push(`Every entry of "${k}" needs an id.`);
  }
  for (const k of [...(data.kits ?? []), ...(data.blocks ?? [])]) if (k && k.items != null && !Array.isArray(k.items)) problems.push('The items of a kit or block are not a list.');
  return [...new Set(problems)];
}

/* ---------- items by their Excel id ---------- */

/** (sourceId) → the app item or null: by sourceId, mergedIds or the app ID; an item not gone first. */
export function itemFinder(items = []) {
  const map = new Map();
  const add = (id, it) => {
    if (!id) return;
    const k = String(id);
    const was = map.get(k);
    if (!was || (was.ownership === 'gone' && it.ownership !== 'gone')) map.set(k, it);
  };
  for (const it of items) for (const id of [it.sourceId, ...(Array.isArray(it.mergedIds) ? it.mergedIds : []), it.id]) add(id, it);
  return (sid) => map.get(String(sid ?? '').trim()) ?? null;
}

function resolve(list, find) {
  const itemIds = [];
  const notFound = [];
  for (const sid of Array.isArray(list) ? list : []) {
    const it = find(sid);
    if (it) {
      if (!itemIds.includes(it.id)) itemIds.push(it.id);
    } else if (str(sid) && !notFound.includes(str(sid))) notFound.push(str(sid));
  }
  return { itemIds, notFound };
}

/** The items of a building block: every item (not gone) that carries its key. */
const membersOf = (key, items) => items.filter((i) => i.ownership !== 'gone' && (i.sets ?? []).includes(key)).map((i) => i.id);
/** The raw set record (own or a built-in's record) that came from this id. */
const recordFor = (value, id) => (value ?? []).find((s) => s && (s.sourceId === id || (s.mergedIds ?? []).includes(id)));

/**
 * The most similar building block for a list of item IDs: { key, name, both, of, share } or null.
 * share = shared items / the larger of the two lists. Temperature kits and blocks of this import are left out.
 */
export function similarBlock(itemIds, items, value) {
  if (!itemIds.length) return null;
  let top = null;
  for (const s of allSets(value)) {
    if (typeof s.minC === 'number' || typeof s.maxC === 'number' || s.sourceId) continue;
    const mine = membersOf(s.key, items);
    if (!mine.length) continue;
    const both = itemIds.filter((id) => mine.includes(id)).length;
    const of = Math.max(itemIds.length, mine.length);
    const share = both / of;
    if (!top || share > top.share) top = { key: s.key, name: s.name, both, of, share: Math.round(share * 1000) / 1000 };
  }
  return top;
}

/** "2025" → "2025-00" (after the full dates of that year in a newest-first list), an ISO date as it is. */
export function tripSortDate(date) {
  const s = str(date);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}$/.test(s)) return `${s}-00`;
  return '';
}

/**
 * The plan of step 2 against the data now (what the tab shows):
 * { kits, blocks, tasks, oldTrips, notFound, empty }
 *   kits:   [{ id, name, minC, maxC, note, itemIds, notFound, status: 'new' | 'same', key? }]
 *   blocks: [{ id, name, note, itemIds, notFound, status: 'same' | 'similar' | 'new', key?, similar? }]
 *   tasks:  { add: [{ id, text, group }], same, update, total, sample }
 *   oldTrips: { add, same, update, total }
 */
export function planStep2(data, { items = [], sets = [], tasks = [], events = [] } = {}) {
  const find = itemFinder(items);
  const notFound = new Set();
  const kits = (data?.kits ?? []).filter((k) => str(k?.id)).map((k) => {
    const id = str(k.id);
    const r = resolve(k.items, find);
    r.notFound.forEach((x) => notFound.add(x));
    const rec = recordFor(sets, id);
    return { id, name: str(k.name) || id, minC: numOr(k.minC), maxC: numOr(k.maxC), note: str(k.note), ...r, status: rec ? 'same' : 'new', ...(rec ? { key: rec.key } : {}) };
  });
  const blocks = (data?.blocks ?? []).filter((b) => str(b?.id)).map((b) => {
    const id = str(b.id);
    const r = resolve(b.items, find);
    r.notFound.forEach((x) => notFound.add(x));
    const rec = recordFor(sets, id);
    if (rec) return { id, name: str(b.name) || id, note: str(b.note), ...r, status: 'same', key: rec.key };
    const sim = similarBlock(r.itemIds, items, sets);
    return { id, name: str(b.name) || id, note: str(b.note), ...r, status: sim && sim.share >= SIMILAR_AT ? 'similar' : 'new', ...(sim && sim.share >= SIMILAR_AT ? { similar: sim } : {}) };
  });
  const bySource = new Map(tasks.filter((x) => x.sourceId).map((x) => [String(x.sourceId), x]));
  const tk = { add: [], update: [], same: 0, total: 0, sample: [] };
  const seenT = new Set();
  for (const raw of data?.tasks ?? []) {
    const id = str(raw?.id);
    const text = str(raw?.text);
    if (!id || !text || seenT.has(id)) continue;
    seenT.add(id);
    tk.total++;
    if (tk.sample.length < 3) tk.sample.push(text);
    const old = bySource.get(id);
    if (!old) tk.add.push({ id, text, group: str(raw.group) });
    else if (old.task !== text || (old.group ?? '') !== str(raw.group)) tk.update.push({ key: old.id, text, group: str(raw.group) });
    else tk.same++;
  }
  const evIds = new Map(events.map((e) => [e.id, e]));
  const ot = { add: [], update: [], same: 0, total: 0 };
  const seenO = new Set();
  for (const raw of data?.oldTrips ?? []) {
    const id = str(raw?.id);
    if (!id || seenO.has(id)) continue;
    seenO.add(id);
    ot.total++;
    const rec = eventOf(raw);
    const old = evIds.get(rec.id);
    if (!old) ot.add.push(rec);
    else if (old.name !== rec.name || (old.note ?? '') !== rec.note || (old.date ?? null) !== rec.date) ot.update.push(rec);
    else ot.same++;
  }
  return { kits, blocks, tasks: tk, oldTrips: ot, notFound: [...notFound], empty: !kits.length && !blocks.length && !tk.total && !ot.total };
}

/** An old trip as a Logbook record (read-only, marked "aus Excel"). */
export function eventOf(raw) {
  const id = str(raw.id);
  const date = str(raw.date) || null;
  return { id: `xl-${id}`, sourceId: id, name: str(raw.name) || id, date, sortDate: tripSortDate(date), note: String(raw.note ?? '').replace(/\r\n?/g, '\n').trim(), source: 'excel', readOnly: true };
}

/** The default choice of a block row: merge when it is similar, else new. */
export const defaultChoice = (row) => (row.status === 'similar' ? 'merge' : 'new');

/**
 * The records to write for "Übernehmen": { items (changed), sets (the new settings value), tasks
 * (records to put), events (records to put), counts }. choices: { [blockId]: 'merge' | 'new' | 'skip' }
 * for the similar rows (missing: the default).
 */
export function buildStep2(data, { items = [], sets = [], tasks = [], events = [] } = {}, choices = {}, now = new Date().toISOString()) {
  const plan = planStep2(data, { items, sets, tasks, events });
  let value = [...(Array.isArray(sets) ? sets : [])];
  const byId = new Map(items.map((i) => [i.id, i]));
  const changed = new Map();
  const counts = { kits: 0, kitsSame: 0, blocks: 0, merged: 0, skipped: 0, blocksSame: 0, tasks: 0, tasksUpdated: 0, oldTrips: 0, notFound: plan.notFound.length };
  const join = (key, ids) => {
    for (const id of ids) {
      const it = changed.get(id) ?? byId.get(id);
      if (!it || (it.sets ?? []).includes(key)) continue;
      changed.set(id, { ...it, sets: [...(it.sets ?? []), key], updatedAt: now });
    }
  };
  const make = (row, extra = {}) => {
    let r = addSet(value, row.name, row.note ?? '');
    if (r.error === 'taken') r = addSet(value, `${row.name} (${row.id})`, row.note ?? '');
    if (r.error) return null;
    value = r.value.map((s) => (s.key === r.key ? { ...s, sourceId: row.id, ...extra } : s));
    return r.key;
  };
  for (const k of plan.kits) {
    const range = { minC: k.minC, maxC: k.maxC };
    let key = k.key;
    if (k.status === 'same') {
      value = value.map((s) => (s.key === key ? { ...s, ...range } : s));
      counts.kitsSame++;
    } else {
      key = make(k, range);
      if (!key) continue;
      counts.kits++;
    }
    join(key, k.itemIds);
  }
  for (const b of plan.blocks) {
    if (b.status === 'same') {
      join(b.key, b.itemIds);
      counts.blocksSame++;
      continue;
    }
    const choice = b.status === 'similar' ? choices[b.id] ?? defaultChoice(b) : 'new';
    if (choice === 'skip') {
      counts.skipped++;
      continue;
    }
    if (choice === 'merge' && b.similar) {
      const key = b.similar.key;
      const has = value.some((s) => s.key === key);
      // A built-in block gets a record only to remember the id (its name stays its own).
      value = has ? value.map((s) => (s.key === key ? { ...s, mergedIds: [...new Set([...(s.mergedIds ?? []), b.id])] } : s)) : [...value, { key, mergedIds: [b.id] }];
      join(key, b.itemIds);
      counts.merged++;
      continue;
    }
    const key = make(b);
    if (!key) continue;
    join(key, b.itemIds);
    counts.blocks++;
  }
  // The tasks: one list, numbered after the tasks there are.
  let next = Math.max(0, ...tasks.map((x) => (typeof x.id === 'number' ? x.id : 0))) + 1;
  const taskRecs = [];
  for (const x of plan.tasks.add) {
    taskRecs.push({ id: next++, task: x.text, area: 'Preparation', list: PREP_LIST, group: x.group, sourceId: x.id, leadWeeks: 0, status: 'open', source: 'import', importedAt: now });
    counts.tasks++;
  }
  const taskById = new Map(tasks.map((x) => [x.id, x]));
  for (const u of plan.tasks.update) {
    taskRecs.push({ ...taskById.get(u.key), task: u.text, group: u.group, updatedAt: now });
    counts.tasksUpdated++;
  }
  const evRecs = [...plan.oldTrips.add, ...plan.oldTrips.update].map((e) => ({ ...e, importedAt: now }));
  counts.oldTrips = plan.oldTrips.add.length;
  return { items: [...changed.values()], sets: value, tasks: taskRecs, events: evRecs, counts, plan };
}

/** The file without its step-2 lists (after "Übernehmen"); step2At remembers when. */
export function withoutStep2(data, now = new Date().toISOString()) {
  const rest = { ...data };
  for (const k of LISTS) delete rest[k];
  return { ...rest, step2At: now };
}
