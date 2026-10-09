/**
 * v0.36.0 (Noah 1a, 2a, 3b): "Import prüfen", the safe import of the reviewed gear list.
 *
 * The file (kind 'gear-import', version 1) is chosen in "Your data". Nothing goes into Gear before
 * Noah looks at it on the staging page (#/gear/import). There every item of the file is in one of
 * three groups:
 *   same    "Schon da": the item is already in the app. The app item stays the master: the import only
 *           fills EMPTY fields and adds notes, areas and the new fields. Name, weight (when set),
 *           category, quantity, ownership, trips and building blocks are never overwritten.
 *   fresh   "Neu": not in the app; becomes a new item (owned: false → the wishlist).
 *   unsure  "Unsicher": maybe the same as an app item; Noah decides with a tap (same item / new item).
 * plus notIn ("Nicht im Import"): app items the file does not mention. Removing one ARCHIVES it
 * (ownership 'gone'), never deletes it, so past trips stay complete.
 *
 * Matching (match()):
 *   1. IDs: the import's sourceId (or one of its mergedIds) is the app item's sourceId, one of its
 *      mergedIds, or its own ID (old Excel IDs such as "OB06")  → same. A re-import never duplicates.
 *   2. Names, normalised (lowercase, umlauts → base letters, no punctuation, sizes such as "0.5L" put
 *      aside): exact in the same category → same; similarity ≥ 0.8 → same; 0.5–0.8 → unsure with the
 *      3 best candidates; else → fresh. A different category or a different size is never "same" by name.
 *   3. One app item is matched at most once: when two imports point at the same item, both are unsure.
 *
 * Learnings of the file go into the learnings store with their ORIGINAL date and source 'import'
 * (so the 30-day "new" boost in debrief.js learningsFor does not treat them all as new); matched by
 * sourceId on a re-import.
 *
 * Pure functions only; src/lib/gear/importdb.js writes the result (with a backup and undo).
 */
import { CATEGORIES, CATEGORY, nextId, PREFIX } from './gear.js';
import { itemDomains } from './domains.js';
import { validateStep2 } from './importstep2.js';
import DE from './i18n/de/index.js';
import GEAR_DE from './i18n/de/gear.js';

export const KIND = 'gear-import';
export const VERSION = 1;

/** Thresholds of the name similarity (0..1). */
export const SAME_AT = 0.8;
export const UNSURE_AT = 0.5;

/** Is this parsed file a gear import? (The version is checked by validateGearImport.) */
export const isGearImportFile = (data) => !!data && typeof data === 'object' && data.kind === KIND && Array.isArray(data.items);

/** Problems that stop the import (empty list: fine). English keys for t(). */
export function validateGearImport(data) {
  const problems = [];
  if (!isGearImportFile(data)) return ['This is not a gear import file.'];
  if (typeof data.version !== 'number') problems.push('The file has no version.');
  else if (data.version > VERSION) problems.push('The file comes from a newer version of the app. Update the app first.');
  if (data.learnings != null && !Array.isArray(data.learnings)) problems.push('The learnings in the file are not a list.');
  // v0.42.0: the optional lists of step 2 (kits, blocks, tasks, oldTrips), see importstep2.js.
  problems.push(...validateStep2(data));
  return problems;
}

/* ---------- the areas ---------- */

/** The areas of the file → the app's areas (domains.js). Unknown words stay as they are (lowercase). */
export const AREA_MAP = {
  velo: 'velo',
  bike: 'velo',
  bikepacking: 'bikepacking',
  wandern: 'hiking',
  hiking: 'hiking',
  reisen: 'travel',
  travel: 'travel',
  alltag: 'everyday',
  everyday: 'everyday',
  ski: 'ski',
  skitour: 'ski',
  weekend: 'weekend',
  wochenende: 'weekend',
};
export function mapAreas(areas) {
  const out = [];
  for (const a of Array.isArray(areas) ? areas : []) {
    const k = fold(String(a ?? '').trim());
    if (!k) continue;
    const key = AREA_MAP[k] ?? k;
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

/* ---------- the category ---------- */

const CAT_WORDS = (() => {
  const m = {};
  for (const c of CATEGORIES) {
    m[fold(c.key)] = c.key;
    m[fold(c.name)] = c.key;
    for (const de of [DE[c.name], GEAR_DE[c.name]]) if (de) m[fold(de)] = c.key;
  }
  for (const [key, p] of Object.entries(PREFIX)) m[fold(p)] = key;
  return m;
})();

/** The app category of the file's category: key, English or German name, or ID prefix ("KL"); else the text itself. */
export function resolveCategory(cat) {
  const raw = String(cat ?? '').trim();
  if (!raw) return '';
  return CAT_WORDS[fold(raw)] ?? raw;
}

/* ---------- names ---------- */

/** Lowercase, umlauts and accents to base letters (ä → a, ß → ss), nothing else changed. */
export function fold(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const UNIT = '(?:ml|cl|dl|l|g|kg|mm|cm|m|mah|wh|w|lm|liter|litre|lumen)';
const SIZE_RE = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${UNIT}\\b`, 'g');
const CLOTH = new Set(['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);

// The marker of fictional test data (tests, screenshots) is not part of a name.
const TEST_MARK = /^\s*test_data_gtp_\s*/i;
// A few hundred imports × a hundred app items: each name is split once.
const memo = new Map();

/**
 * A name split for comparing: { text (sorted words, no sizes), words, sizes }.
 * "Trinkflasche 0.5L" → { text: 'trinkflasche', sizes: ['0.5l'] }. "Jacke (M)" → size 'm'.
 */
export function normalizeName(name) {
  const k = String(name ?? '');
  const hit = memo.get(k);
  if (hit) return hit;
  if (memo.size > 5000) memo.clear();
  const out = split(k);
  memo.set(k, out);
  return out;
}
function split(name) {
  let s = fold(String(name ?? '').replace(TEST_MARK, ''));
  const sizes = [];
  s = s.replace(SIZE_RE, (m, n) => {
    sizes.push(m.replace(/\s+/g, '').replace(',', '.').replace(/(liter|litre)$/, 'l'));
    return ' ';
  });
  const words = [];
  for (const w of s.replace(/[^a-z0-9]+/g, ' ').split(' ')) {
    if (!w) continue;
    if (CLOTH.has(w)) sizes.push(w);
    else words.push(w);
  }
  return { text: [...words].sort().join(' '), words, sizes: [...new Set(sizes)].sort() };
}

const bigrams = (s) => {
  const t = s.replace(/\s+/g, ' ');
  const out = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
};
/** Dice coefficient of two lists (with repeats): 2·|A∩B| / (|A|+|B|). */
function dice(a, b) {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const rest = new Map();
  for (const x of b) rest.set(x, (rest.get(x) ?? 0) + 1);
  let both = 0;
  for (const x of a) {
    const n = rest.get(x);
    if (n) (both++, rest.set(x, n - 1));
  }
  return (2 * both) / (a.length + b.length);
}

/**
 * How alike two normalised names are, 0..1: the mean of the word overlap and the letter-pair
 * (bigram) Dice, so a typo or a word order still counts, but one shared word alone does not.
 */
export function nameSimilarity(a, b) {
  const A = typeof a === 'string' ? normalizeName(a) : a;
  const B = typeof b === 'string' ? normalizeName(b) : b;
  if (!A.text || !B.text) return 0;
  if (A.text === B.text) return 1;
  return (dice(A.words, B.words) + dice(bigrams(A.text), bigrams(B.text))) / 2;
}

/** The names an app item can be known by: name, German name, with brand and model. */
function namesOf(item) {
  const bm = [item.brand, item.model].filter(Boolean).join(' ');
  const list = [item.name, item.nameDe, bm && `${item.name ?? ''} ${bm}`, bm && item.nameDe && `${item.nameDe} ${bm}`, bm && `${item.brand ?? ''} ${item.model ?? ''}`];
  return [...new Set(list.filter((s) => s && String(s).trim()))];
}

const sameSizes = (a, b) => !a.length || !b.length || a.join() === b.join();

/**
 * The score of an import item against one app item, 0..1, and why.
 * Same category: the name score. A different (known) category or different sizes: at most "unsure".
 */
export function score(imp, item) {
  const n = normalizeName(imp.name);
  let best = 0;
  let exact = false;
  let sizesDiffer = false;
  for (const name of namesOf(item)) {
    const m = normalizeName(name);
    const s = nameSimilarity(n, m);
    const differ = !sameSizes(n.sizes, m.sizes);
    // The best name wins; on a tie the one with the same size.
    if (s > best || (s === best && sizesDiffer && !differ)) {
      best = s;
      sizesDiffer = differ;
    }
    if (n.text && n.text === m.text && sameSizes(n.sizes, m.sizes)) exact = true;
  }
  const cat = resolveCategory(imp.category);
  const otherCat = !!cat && !!item.category && cat !== item.category;
  let s = best;
  if (otherCat || sizesDiffer) s = Math.min(s, SAME_AT - 0.01);
  return { score: Math.round(s * 1000) / 1000, exact: exact && !otherCat };
}

/* ---------- matching ---------- */

/** The key of an import item: its sourceId, or its place in the file. */
export const keyOf = (imp, i) => (imp?.sourceId ? String(imp.sourceId) : `#${i}`);

const idsOf = (imp) => [imp.sourceId, ...(Array.isArray(imp.mergedIds) ? imp.mergedIds : [])].filter(Boolean).map(String);
const knownIds = (item) => [item.id, item.sourceId, ...(Array.isArray(item.mergedIds) ? item.mergedIds : [])].filter(Boolean).map(String);

/**
 * Sort the import items: [{ key, imp, kind: 'same'|'fresh'|'unsure', item?, via?, score?, candidates? }]
 * and notIn (app items, not gone, not matched and no candidate). Gone (archived) items are only
 * matched by ID, never by name.
 */
export function match(importItems, items, applied = []) {
  const live = items.filter((i) => i.ownership !== 'gone');
  const byKnown = new Map();
  for (const it of items) for (const id of knownIds(it)) if (!byKnown.has(id)) byKnown.set(id, it);
  const rows = importItems.map((imp, i) => {
    const key = keyOf(imp, i);
    if (!String(imp?.name ?? '').trim()) return { key, imp, kind: 'skip' };
    // 1. IDs
    const hit = idsOf(imp).map((id) => byKnown.get(id)).find(Boolean);
    if (hit) return { key, imp, kind: 'same', item: hit, via: 'id', score: 1 };
    // 2. names: an app item that already holds another sourceId of the file is no name match.
    const scored = live
      .filter((it) => !it.sourceId || idsOf(imp).includes(String(it.sourceId)))
      .map((it) => ({ item: it, ...score(imp, it) }))
      .filter((x) => x.score >= UNSURE_AT)
      .sort((a, b) => b.score - a.score || (b.exact ? 1 : 0) - (a.exact ? 1 : 0) || a.item.id.localeCompare(b.item.id));
    const top = scored[0];
    if (top && (top.exact || top.score >= SAME_AT)) return { key, imp, kind: 'same', item: top.item, via: 'name', score: top.score, candidates: scored.slice(0, 3).map(cand) };
    if (top) return { key, imp, kind: 'unsure', reason: 'similar', candidates: scored.slice(0, 3).map(cand) };
    return { key, imp, kind: 'fresh' };
  });
  // 3. one app item at most once: two imports on the same item are both unsure.
  const count = new Map();
  for (const r of rows) if (r.kind === 'same') count.set(r.item.id, (count.get(r.item.id) ?? 0) + 1);
  for (const r of rows) {
    if (r.kind !== 'same' || count.get(r.item.id) < 2) continue;
    const first = { item: r.item, score: r.score };
    const others = (r.candidates ?? []).filter((c) => c.item.id !== r.item.id);
    Object.assign(r, { kind: 'unsure', reason: 'twice', candidates: [cand(first), ...others].slice(0, 3) });
    delete r.item;
    delete r.via;
  }
  // 4. v0.45.1 (G001): the same item twice in ONE file. A row that is (nearly) the same as an earlier
  // row of the file, or as an item an earlier apply of this file made, is never a second new item:
  // it is "unsure" (reason 'file') with that earlier line first, so Noah decides.
  const norm = rows.map((r) => (r.kind === 'skip' ? null : { n: normalizeName(r.imp.name), cat: resolveCategory(r.imp.category) }));
  const took = new Set(applied);
  const earlierApplied = live.filter((it) => took.has(it.id));
  const byWord = new Map(); // word → earlier lines (index) with it
  rows.forEach((r, i) => {
    if (r.kind === 'skip') return;
    if (r.kind !== 'fresh' && r.kind !== 'unsure') {
      for (const w of new Set(norm[i].n.words)) byWord.set(w, [...(byWord.get(w) ?? []), i]);
      return;
    }
    let hit = null;
    // ≥ SAME_AT needs a word in common (the score is the mean of word and letter-pair overlap):
    // only the earlier lines that share a word are compared, so a file of 800 lines stays quick.
    const earlier = [...new Set(norm[i].n.words.flatMap((w) => byWord.get(w) ?? []))].sort((a, b) => a - b);
    for (const j of earlier) {
      const s = alike(norm[i], norm[j]);
      if (s) {
        hit = { item: rows[j].kind === 'same' ? rows[j].item : lineItem(rows[j]), score: s };
        break;
      }
    }
    for (const w of new Set(norm[i].n.words)) byWord.set(w, [...(byWord.get(w) ?? []), i]);
    for (const it of earlierApplied) {
      if (hit) break;
      const s = score(r.imp, it);
      if (s.exact || s.score >= SAME_AT) hit = { item: it, score: s.score };
    }
    if (!hit) return;
    const others = (r.candidates ?? []).filter((c) => c.item.id !== hit.item.id);
    Object.assign(r, { kind: 'unsure', reason: 'file', candidates: [cand(hit), ...others].slice(0, 3) });
  });
  // v0.37.1: the app items an earlier apply of this file already took (the staged rest only holds the
  // unsure lines) are not "Nicht im Import".
  const touched = new Set(applied);
  for (const r of rows) {
    if (r.kind === 'same') touched.add(r.item.id);
    if (r.kind === 'unsure') for (const c of r.candidates) touched.add(c.item.id);
  }
  const notIn = live.filter((it) => !touched.has(it.id));
  return { rows, notIn };
}
const cand = (x) => ({ item: x.item, score: x.score });
/** Two lines of one file: their score when they are the same item (exact or ≥ SAME_AT, same category and size), else 0. */
function alike(a, b) {
  if (a.cat && b.cat && a.cat !== b.cat) return 0;
  if (!sameSizes(a.n.sizes, b.n.sizes)) return 0;
  const s = nameSimilarity(a.n, b.n);
  return s >= SAME_AT ? Math.round(s * 1000) / 1000 : 0;
}
/** An earlier line of the same file as a candidate (G001): its ID is LINE + the line's key. */
export const LINE = 'line:';
const lineItem = (row) => ({ id: `${LINE}${row.key}`, name: row.imp.name, category: resolveCategory(row.imp.category), line: row.key });

/* ---------- what an import item adds ---------- */

const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
const str = (v) => (v == null ? '' : String(v).trim());
const numOrNull = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const ZONES = ['head', 'eyes', 'neck', 'torso', 'arms', 'hands', 'legs', 'feet'];
const LAYERS = ['base', 'mid', 'outer', 'accessory'];
const TEMP = ['warm', 'mittel', 'kalt'];
const pick = (v, list) => (list.includes(str(v).toLowerCase()) ? str(v).toLowerCase() : str(v) || null);

/** The new fields of an import item as the app stores them (null: not given). */
export function importFields(imp) {
  return {
    zone: pick(imp.zone, ZONES),
    layer: pick(imp.layer, LAYERS),
    tempMin: numOrNull(imp.tempMin),
    tempMax: numOrNull(imp.tempMax),
    tempClass: pick(imp.tempClass, TEMP),
    rule: str(imp.rule) || null,
  };
}

/**
 * What an import item adds to an app item that is already there: { changes, adds }.
 * changes: the fields to write (empty: nothing to do). adds: [{ field, value }] to show.
 * Only empty fields are filled; notes are added (not replaced); areas and IDs are joined.
 */
export function enrich(item, imp, now = new Date().toISOString()) {
  const changes = {};
  const adds = [];
  const put = (field, value, show = value) => {
    changes[field] = value;
    adds.push({ field, value: show });
  };
  // The IDs of the file, so the next import finds this item by them.
  const sid = str(imp.sourceId);
  if (sid && empty(item.sourceId)) put('sourceId', sid);
  const ids = [...new Set([...(item.mergedIds ?? []), ...idsOf(imp)])].filter((id) => id !== (changes.sourceId ?? item.sourceId) && id !== item.id);
  if (ids.length !== (item.mergedIds ?? []).length) changes.mergedIds = ids;
  if (empty(item.category)) {
    const cat = resolveCategory(imp.category);
    if (cat) put('category', cat);
  }
  if (item.weightG == null && numOrNull(imp.weightG) != null && numOrNull(imp.weightG) > 0) {
    changes.weightG = Math.round(numOrNull(imp.weightG));
    changes.weightStatus = 'logbook';
    adds.push({ field: 'weightG', value: changes.weightG });
  }
  // Areas: joined; an item without areas counts as bikepacking and keeps it.
  const areas = mapAreas(imp.areas);
  if (areas.length) {
    const have = itemDomains(item);
    const more = areas.filter((a) => !have.includes(a));
    if (more.length) put('domains', [...have, ...more], more);
  }
  for (const [field, value] of Object.entries(importFields(imp))) if (value != null && empty(item[field])) put(field, value);
  // "Optional" (luxury) only on an item that has no say yet about coming along.
  if (imp.optional === true && item.leaveHome == null && !item.role && !(item.sets ?? []).length && !item.always) put('leaveHome', true);
  const note = str(imp.notes);
  if (note && !fold(item.note ?? '').includes(fold(note))) put('note', item.note?.trim() ? `${item.note.trim()}\n${note}` : note, note);
  if (Object.keys(changes).length) changes.updatedAt = now;
  return { changes, adds };
}

/** A new app item from an import item. all: the items so far (for the next free ID). */
export function newItem(imp, all, now = new Date().toISOString()) {
  const category = resolveCategory(imp.category);
  const weightG = numOrNull(imp.weightG) != null && numOrNull(imp.weightG) > 0 ? Math.round(numOrNull(imp.weightG)) : null;
  const areas = mapAreas(imp.areas);
  const sid = str(imp.sourceId);
  const merged = idsOf(imp).filter((id) => id !== sid);
  const item = {
    id: nextId(all, category),
    name: str(imp.name),
    brand: '',
    model: '',
    category,
    weightG,
    qty: Math.max(1, Math.round(Number(imp.qty)) || 1),
    weightStatus: weightG == null ? 'missing' : 'logbook',
    weightNote: '',
    carry: 'luggage',
    defaultBag: null,
    ownership: imp.owned === false ? 'wishlist' : 'owned',
    role: null,
    sets: [],
    kits: [],
    domains: areas.length ? areas : ['bikepacking'],
    note: str(imp.notes),
    ...Object.fromEntries(Object.entries(importFields(imp)).filter(([, v]) => v != null)),
    ...(imp.optional === true ? { leaveHome: true } : {}),
    ...(sid ? { sourceId: sid } : {}),
    ...(merged.length ? { mergedIds: merged } : {}),
    sources: `gear import ${now.slice(0, 10)}`,
    updatedAt: now,
  };
  return item;
}

/* ---------- learnings ---------- */

/** A date of the file as YYYY-MM-DD ("2024-05-03", "3.5.2024", "03.05.24"); '' when there is none. */
export function isoDate(v) {
  const s = str(v);
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

/**
 * The learnings of the file against the store: { add: [records], update: [{ id, changes }], same: n }.
 * A learning with a known sourceId only gets its empty fields filled. New ones get the next number.
 */
export function planLearnings(list, existing, now = new Date().toISOString()) {
  const bySource = new Map(existing.filter((l) => l.sourceId).map((l) => [String(l.sourceId), l]));
  let next = Math.max(0, ...existing.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
  const add = [];
  const update = [];
  let same = 0;
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const text = str(raw?.text);
    if (!text) continue;
    const sid = str(raw.sourceId);
    if (sid && seen.has(sid)) continue;
    if (sid) seen.add(sid);
    const date = isoDate(raw.date);
    const fields = {
      topic: str(raw.topic) || 'Import',
      rule: text,
      action: str(raw.recommendation),
      condition: str(raw.condition),
      exceptions: str(raw.exceptions),
      reason: str(raw.reason),
      date,
    };
    const old = sid ? bySource.get(sid) : null;
    if (old) {
      const changes = {};
      for (const [k, v] of Object.entries(fields)) if (v && empty(old[k])) changes[k] = v;
      if (date && empty(old.createdAt)) changes.createdAt = `${date}T12:00:00.000Z`;
      if (Object.keys(changes).length) update.push({ id: old.id, changes });
      else same++;
      continue;
    }
    add.push({
      id: next++,
      ...fields,
      ...(sid ? { sourceId: sid } : {}),
      ...(str(raw.date) && !date ? { dateText: str(raw.date) } : {}),
      itemIds: [],
      source: 'import',
      appliesTo: ['all'],
      priority: 'medium',
      confirmed: 0,
      // The ORIGINAL date (none: no date), so the 30-day boost in learningsFor does not see it as new.
      createdAt: date ? `${date}T12:00:00.000Z` : null,
      importedAt: now,
    });
  }
  return { add, update, same };
}

/* ---------- the whole plan ---------- */

/**
 * Everything the staging page shows, from the file and the data now:
 * { same: [row + adds], fresh: [row + item], unsure: [row], skipped: [row], notIn: [items], learnings }.
 * same rows with nothing to add carry adds: [].
 */
export function planGearImport(data, items, learnings = [], now = new Date().toISOString()) {
  const { rows, notIn } = match(data.items ?? [], items, data.appliedItemIds ?? []);
  const all = [...items];
  const out = { same: [], fresh: [], unsure: [], skipped: [], notIn };
  for (const r of rows) {
    if (r.kind === 'same') out.same.push({ ...r, adds: enrich(r.item, r.imp, now).adds });
    else if (r.kind === 'fresh') {
      const item = newItem(r.imp, all, now);
      all.push(item);
      out.fresh.push({ ...r, item });
    } else if (r.kind === 'unsure') out.unsure.push(r);
    else out.skipped.push(r);
  }
  out.learnings = planLearnings(data.learnings, learnings, now);
  return out;
}

/**
 * The records to write for "Alle sicheren übernehmen": every same and fresh row, plus the unsure
 * rows Noah decided (decisions: { [key]: 'new' | <app item id> }). Several imports on one app item
 * are applied one after the other (each only fills what is still empty).
 * Returns { items: [records to put], learnings: { add, update }, done: [keys applied], counts }.
 */
export function buildWrites(data, items, learnings = [], decisions = {}, now = new Date().toISOString()) {
  const plan = planGearImport(data, items, learnings, now);
  const byId = new Map(items.map((i) => [i.id, { ...i }]));
  const changed = new Set();
  const all = [...items];
  const added = [];
  const done = [];
  const counts = { enriched: 0, unchanged: 0, added: 0, wishlist: 0, merged: 0, open: 0 };
  const into = (id, imp) => {
    const cur = byId.get(id);
    const { changes } = enrich(cur, imp, now);
    if (Object.keys(changes).length) {
      byId.set(id, { ...cur, ...changes });
      changed.add(id);
      return true;
    }
    return false;
  };
  const fresh = (imp) => {
    const item = newItem(imp, all, now);
    all.push(item);
    added.push(item);
    byId.set(item.id, item);
    counts.added++;
    if (item.ownership === 'wishlist') counts.wishlist++;
    return item.id;
  };
  // G001: the app item each applied line went to, so a later line can be "the same as line …".
  const lineTo = new Map();
  const took = [];
  for (const r of plan.same) {
    took.push(r.item.id);
    lineTo.set(r.key, r.item.id);
    if (into(r.item.id, r.imp)) counts.enriched++;
    else counts.unchanged++;
    done.push(r.key);
  }
  for (const r of plan.fresh) {
    lineTo.set(r.key, fresh(r.imp));
    done.push(r.key);
  }
  for (const r of plan.unsure) {
    let d = decisions[r.key];
    if (typeof d === 'string' && d.startsWith(LINE)) d = lineTo.get(d.slice(LINE.length)) ?? null;
    if (d === 'new') lineTo.set(r.key, fresh(r.imp));
    else if (d && byId.has(d)) {
      lineTo.set(r.key, d);
      took.push(d);
      into(d, r.imp);
      counts.merged++;
    } else {
      counts.open++;
      continue;
    }
    done.push(r.key);
  }
  const addedIds = new Set(added.map((i) => i.id));
  return {
    items: [...[...changed].filter((id) => !addedIds.has(id)).map((id) => byId.get(id)), ...added.map((i) => byId.get(i.id))],
    learnings: plan.learnings,
    done,
    took: [...took, ...added.map((i) => i.id)],
    counts: { ...counts, learningsAdded: plan.learnings.add.length, learningsUpdated: plan.learnings.update.length },
  };
}

/**
 * The file without the items already applied (what stays on the staging page). took: the app item IDs
 * the apply matched or made (v0.37.1), so they do not show under "Nicht im Import" afterwards.
 */
export function remaining(data, done, took = []) {
  const set = new Set(done);
  const applied = [...new Set([...(data.appliedItemIds ?? []), ...took])];
  return { ...data, items: (data.items ?? []).filter((imp, i) => !set.has(keyOf(imp, i))), learnings: [], ...(applied.length ? { appliedItemIds: applied } : {}) };
}

/* ---------- v0.37.1 Zusammenlegen: the counterpart of an item ---------- */

/** Below this a candidate is not proposed. */
export const PROPOSE_AT = 0.35;
const STOP = new Set(['und', 'mit', 'fur', 'oder', 'the', 'and', 'for', 'with', 'von', 'der', 'die', 'das', 'ein', 'eine', 'set']);
const tokens = (name) => normalizeName(name).words.filter((w) => w.length >= 3 && !STOP.has(w));
const wordHit = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));

/** Share of the shorter name's words found in the other one (a prefix counts: "Halter" ~ "Halterung"), 0..1. */
export function tokenOverlap(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.length || !B.length) return 0;
  const [short, long] = A.length <= B.length ? [A, B] : [B, A];
  return short.filter((w) => long.some((x) => wordHit(w, x))).length / short.length;
}

/**
 * How well a candidate fits as the counterpart of an item, 0..1: the name similarity of the import
 * matching, or (lower threshold) the shared words, so a collection item ("Snack (Biber/Banane)")
 * finds each of its pieces ("Biber"). The same category gives a small bonus but is not required.
 */
export function counterpartScore(item, cand) {
  let best = 0;
  for (const a of namesOf(item)) {
    for (const b of namesOf(cand)) {
      const sim = nameSimilarity(a, b);
      best = Math.max(best, sim, (sim + tokenOverlap(a, b)) / 2);
    }
  }
  const bonus = item.category && item.category === cand.category ? 0.1 : 0;
  return Math.round(Math.min(1, best + (best > 0 ? bonus : 0)) * 1000) / 1000;
}

/**
 * Up to `max` proposed counterparts of an item: [{ item, score }], best first. Only items that are
 * not gone and not the item itself; imported: only items that came from an import (sourceId).
 */
export function counterparts(item, items, { max = 3, imported = false, min = PROPOSE_AT } = {}) {
  if (!item) return [];
  return items
    .filter((c) => c.id !== item.id && c.ownership !== 'gone' && (!imported || c.sourceId))
    .map((c) => ({ item: c, score: counterpartScore(item, c) }))
    .filter((x) => x.score >= min)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, max);
}

/** Shown names for the categories and fields (English keys for t()). */
export const FIELD_NAMES = {
  sourceId: 'Source ID',
  category: 'Category',
  weightG: 'Weight',
  domains: 'Areas',
  zone: 'Body zone',
  layer: 'Layer',
  tempMin: 'From °C',
  tempMax: 'To °C',
  tempClass: 'Temperature',
  rule: 'Rule',
  leaveHome: 'Optional',
  note: 'Note',
};
export const categoryName = (key) => CATEGORY[key]?.name ?? key;

/* ---------- v0.45.0 (coordinator fixes): what the import page says after "Apply all safe ones" ---------- */

/**
 * The status under the file name: { text, at } with an English key for t(). After an apply (the
 * undo record is newer than the moment the file was chosen, or step 1 is done) "applied {when}",
 * else "nothing applied yet". staged: the staged file ({ at, step1At? }); undo: lastApplied ({ at } or null).
 */
export function stagedStatus(staged, undo = null) {
  if (staged?.step1At) return { text: 'applied {when}', at: staged.step1At };
  if (undo?.at && staged?.at && undo.at >= staged.at) return { text: 'applied {when}', at: undo.at };
  return { text: 'nothing applied yet', at: null };
}
/** Did an apply change nothing at all (nothing completed, merged or new, no learnings)? */
export const appliedNothing = (counts = {}) => !((counts.enriched ?? 0) + (counts.merged ?? 0) + (counts.added ?? 0) + (counts.learningsAdded ?? 0) + (counts.learningsUpdated ?? 0));
