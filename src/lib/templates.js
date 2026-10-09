/**
 * Templates (Noah, 4.10.2026): a packing setup saved under a name, e.g. "Daily commute",
 * to start new trips from. A template keeps the bags per place, every item with its place
 * and amount, the ready check, the kind of ride, the riding hours and the night sets.
 * It does not keep the weather (answer 3b) or what was ticked (4b).
 * v0.26.1 (AP18, Noah 17b): it also keeps the days, the overnight stay (with cooking) and the bike
 * (bikeId). A new trip from it takes them as defaults in the New trip dialog (templateDefaults),
 * still changeable; items go into the matching bags of the bike chosen there.
 * Templates live in the settings table (key "templates"), so backups include them.
 */
import { slotFor, alwaysEntries, freshReady } from './trips.js';
import { allSets, qtyOf } from './sets.js';
import { isInventory, itemWeight, sumKnown } from './gear.js';
import { DOMAIN, BIKEPACKING, inDomain, packsFor, packSlot, READY_BY_DOMAIN, domainEntries } from './domains.js';
import { STANDARD, inStandard, isWorn, blockOrder } from './blocks2026.js';
import { hasTent } from './context.js';

export const TEMPLATES_KEY = 'templates';

export async function loadTemplates(db) {
  return (await db.settings.get(TEMPLATES_KEY))?.value ?? [];
}
/**
 * v0.39.0 (AP28): every save goes through syncTemplates, so a linked template's `entries` snapshot is
 * always rewritten from its blocks and extras, and an older writer that changed `entries` (debrief,
 * assign, merge, delete) is turned into the linked fields. The transaction (when there is one) must
 * include db.items and db.settings.
 */
export async function saveTemplates(db, list) {
  const prev = await loadTemplates(db);
  const items = await db.items.toArray();
  const sets = (await db.settings.get('sets'))?.value ?? [];
  const rec = await db.settings.get(TEMPLATES_KEY);
  await db.settings.put({ ...(rec ?? {}), key: TEMPLATES_KEY, value: syncTemplates(list, prev, items, sets) });
}

/** A template from a trip (id and name are given, so this stays a pure function). */
export function templateFrom(trip, { id, name, now = new Date().toISOString() }) {
  return {
    id,
    name: name.trim(),
    // v0.39.0 (AP28): the area of the trip (a trip without a bike makes a template without a bike).
    domain: trip.domain && DOMAIN[trip.domain] ? trip.domain : BIKEPACKING,
    setup: { ...(trip.setup ?? {}) },
    entries: (trip.entries ?? []).map(({ itemId, slot, qty }) => ({ itemId, slot, qty: qty || 1 })),
    ready: (trip.ready ?? []).filter((r) => !r.itemId).map(({ id: rid, label }) => ({ id: rid, label })),
    ride: trip.ride ?? null,
    hours: trip.hours ?? null,
    sets: { ...(trip.sets ?? {}) },
    purpose: { ...(trip.purpose ?? {}) },
    // v0.26.1 (Noah 17b): days, overnight stay and bike, as defaults for the next trip.
    days: Math.max(1, Number(trip.days) || 1),
    overnight: trip.overnight ?? null,
    cook: trip.overnight === 'outdoor' && !!trip.cook,
    tent: hasTent(trip), // v0.66.0: Bivouac + tent
    bikeId: trip.bikeId ?? null,
    fromTrip: trip.id,
    createdAt: now,
    updatedAt: now,
  };
}

/** Put a saved template in the list: replace the one with the same id, or add it. */
export const upsert = (list, tpl) => (list.some((t) => t.id === tpl.id) ? list.map((t) => (t.id === tpl.id ? tpl : t)) : [...list, tpl]);

/**
 * Save a trip as a template (TemplateDialog and, v0.24.1 (Noah 4a), the offer after a day trip).
 * id: the template to overwrite, or null for a new one. The trip then points to its template.
 * Returns { id, name }, or { error: 'empty' | 'taken', name } and changes nothing.
 */
export async function saveTripAsTemplate(db, trip, name, id = null) {
  const clean = `${name ?? ''}`.trim();
  if (!clean) return { error: 'empty', name: clean };
  const list = await loadTemplates(db);
  const tplId = id ?? `tpl-${Date.now().toString(36)}`;
  if (list.some((x) => x.id !== tplId && x.name.toLowerCase() === clean.toLowerCase())) return { error: 'taken', name: clean };
  // v0.39.0 (AP28): the app finds the whole building blocks of the trip and keeps the rest as extras.
  // An update keeps what the template had beyond the trip (created, archived, kept, history).
  const items = await db.items.toArray();
  const sets = (await db.settings.get('sets'))?.value ?? [];
  const old = list.find((x) => x.id === tplId);
  const made = templateFrom(trip, { id: tplId, name: clean });
  const keep = old ? { createdAt: old.createdAt ?? old.updatedAt ?? made.createdAt, hintLog: old.hintLog, archivedAt: old.archivedAt ?? null, keptAt: old.keptAt ?? null } : {};
  await saveTemplates(db, upsert(list, linkTemplate({ ...made, ...keep }, items, sets)));
  await db.trips.update(trip.id, { templateId: tplId });
  return { id: tplId, name: clean };
}

/**
 * v0.26.1 (Noah 17b): what the New trip dialog takes from a template as its defaults (only what the
 * template knows; an older template without them changes nothing). The bike only when it still exists.
 * → { days?, hours?, overnight?, cook?, tent?, bikeId? }
 */
export function templateDefaults(tpl, bikes = []) {
  if (!tpl) return {};
  const out = {};
  if (Number(tpl.days) >= 1) out.days = Number(tpl.days);
  if (tpl.hours != null) out.hours = tpl.hours;
  if (tpl.overnight) {
    out.overnight = tpl.overnight;
    out.cook = tpl.overnight === 'outdoor' && !!tpl.cook;
    out.tent = hasTent(tpl);
  }
  if (tpl.bikeId && bikes.some((b) => b.id === tpl.bikeId)) out.bikeId = tpl.bikeId;
  return out;
}

/**
 * A new trip from a template on the chosen bike. The template's bags replace the bike's
 * standard bags only on places this bike has; items whose place has no bag go where
 * slotFor puts them (their usual bag, else the seat pack).
 * v0.39.0 (AP28): the items come from the template's blocks and extras (templateItems; setsValue:
 * the settings 'sets', for the amounts in the blocks). The trip takes the template's area; a template
 * of an area without a bike makes a trip with the area's own bags (packs).
 */
export function tripFromTemplate({ title, startDate, days, bike = null }, tpl, items, now = Date.now(), setsValue = []) {
  const domain = tplDomain(tpl);
  // v0.37.1: an archived item (ownership 'gone', e.g. merged into another) never comes into a new trip.
  const known = new Set(items.filter((i) => i.ownership !== 'gone').map((i) => i.id));
  const list = templateEntries(tpl, items, setsValue).filter((e) => known.has(e.itemId));
  const common = {
    id: `trip-${now.toString(36)}`,
    domain,
    title: title.trim(),
    startDate,
    days: Math.max(1, Number(days) || 1),
    sets: { ...(tpl.sets ?? {}) },
    purpose: { ...(tpl.purpose ?? {}) },
    status: 'planned',
    copiedFrom: null,
    templateId: tpl.id,
    createdAt: new Date(now).toISOString(),
    // v0.26.1 (Noah 17b): the template's overnight stay; the dialog's choice replaces it (buildBikeTrip fields).
    ...(tpl.overnight ? { overnight: tpl.overnight, cook: tpl.overnight === 'outdoor' && !!tpl.cook, tent: hasTent(tpl) } : {}),
  };
  if (!DOMAIN[domain]?.bike) {
    const packs = packsFor(domain);
    const keys = new Set(['body', ...packs.map((p) => p.key)]);
    const byId = new Map(items.map((i) => [i.id, i]));
    const entries = list.map((e) => ({ itemId: e.itemId, slot: keys.has(e.slot) ? e.slot : packSlot(byId.get(e.itemId), packs), qty: e.qty || 1, packed: false }));
    // Standard comes into every new trip (11a), here the area's Standard items.
    const on = new Set(entries.map((e) => e.itemId));
    entries.push(...domainEntries(items, domain, packs).filter((e) => !on.has(e.itemId) && !isWorn(byId.get(e.itemId))));
    return { ...common, bikeId: null, bike: null, setup: {}, packs, entries, ready: freshReady(tpl.ready, READY_BY_DOMAIN[domain] ?? []) };
  }
  bike ??= { id: null, name: null, setup: {}, slots: [] };
  const setup = { ...(bike.setup ?? {}) };
  for (const [slot, bagId] of Object.entries(tpl.setup ?? {})) if (bagId && bike.slots?.includes(slot)) setup[slot] = bagId;
  const entries = list.map((e) => ({ itemId: e.itemId, slot: e.slot === 'body' || e.slot === 'mounted' || setup[e.slot] ? e.slot : slotFor(e.slot, setup), qty: e.qty || 1, packed: false }));
  entries.push(...alwaysEntries(items, entries, setup));
  return { ...common, bikeId: bike.id, bike: bike.name, setup, entries, ready: freshReady(tpl.ready), ride: tpl.ride ?? null, hours: tpl.hours ?? null };
}

/** Change one template in place: fn gets a copy and returns the changed template. */
export async function updateTemplate(db, id, fn) {
  const list = await loadTemplates(db);
  const now = new Date().toISOString();
  await saveTemplates(db, list.map((t) => (t.id === id ? { ...fn(structuredClone(t)), updatedAt: now } : t)));
}

/* ---------- v0.39.0 (AP28): templates linked to building blocks ---------- */
/*
 * A linked template (Noah 3a) holds building blocks, not copies of their items:
 *   domain    the area ('bikepacking', 'hiking', …; older templates: bikepacking)
 *   blocks    block keys ('standard', 'u-regen', 'sleep' …); the items come from the blocks as they are NOW
 *   without   { [blockKey]: [itemId] }  members left out (Noah 1a, "Rain · without 1")
 *   extras    [{ itemId, qty }]  single items
 *   slots     { [itemId]: place }  only where the place differs from the item's usual one
 *   qty       { [itemId]: n }  only where a block item's amount differs from the block's amount
 *   bikeId, setup   optional (Noah 5a); bags only with a bike
 *   archivedAt, keptAt, createdAt   (6a: "long not used", "Keep")
 *   entries   the old list, rewritten on every save (older versions and backups keep working)
 * Pure functions; the database writes go through saveTemplates.
 */

/** Is the template linked to its blocks (v0.39.0)? Older ones only have entries. */
export const isLinked = (tpl) => Array.isArray(tpl?.extras);
/** The area of a template (older ones: bikepacking). */
export const tplDomain = (tpl) => (tpl?.domain && DOMAIN[tpl.domain] ? tpl.domain : BIKEPACKING);
/** Does a template of this area go by bike? */
export const tplByBike = (tpl) => !!DOMAIN[tplDomain(tpl)]?.bike;

/** Is an item a member of a block for templates of this area? Standard counts the items On me too (as the Blocks page shows it). */
export const blockMember = (item, key, domain = BIKEPACKING) =>
  !!item && isInventory(item) && inDomain(item, domain) && (key === STANDARD ? inStandard(item) || isWorn(item) : !!item.sets?.includes(key));
/** The members of one block in this area. */
export const blockMembers = (key, items, domain = BIKEPACKING) => items.filter((i) => blockMember(i, key, domain));

/**
 * Where an item sits in a template when nothing else is said: worn on me; by bike with the template's
 * bags its usual bag (slotFor); a bike template without bags keeps the usual bag itself (tripFromTemplate
 * then puts it into the bike's matching bag); an area without a bike: its first pack (packSlot).
 */
export function templateSlot(item, setup) {
  if (isWorn(item)) return 'body';
  const hasBags = Object.values(setup ?? {}).some(Boolean);
  return hasBags ? slotFor(item?.defaultBag, setup) : item?.defaultBag || 'seat';
}
export const homeSlot = (item, tpl) => (tplByBike(tpl) ? templateSlot(item ?? {}, tpl.setup) : packSlot(item ?? {}, packsFor(tplDomain(tpl))));

/**
 * The items of a template right now: [{ itemId, slot, qty, block }] (block: the key it comes from,
 * or null for an extra). Members of each block in the template's area (inventory only), minus
 * `without`, then the extras; an item in two blocks comes once. An older template: its entries.
 */
export function templateItems(tpl, items, setsValue = []) {
  if (!tpl) return [];
  if (!isLinked(tpl)) return (tpl.entries ?? []).map((e) => ({ itemId: e.itemId, slot: e.slot, qty: e.qty || 1, block: null }));
  const domain = tplDomain(tpl);
  const sets = allSets(setsValue);
  const byId = new Map(items.map((i) => [i.id, i]));
  const out = [];
  const seen = new Set();
  for (const key of tpl.blocks ?? []) {
    const skip = new Set(tpl.without?.[key] ?? []);
    const set = sets.find((s) => s.key === key);
    for (const i of blockMembers(key, items, domain)) {
      if (skip.has(i.id) || seen.has(i.id)) continue;
      seen.add(i.id);
      out.push({ itemId: i.id, slot: tpl.slots?.[i.id] ?? homeSlot(i, tpl), qty: Number(tpl.qty?.[i.id]) || qtyOf(set, i.id), block: key });
    }
  }
  for (const x of tpl.extras ?? []) {
    if (!x?.itemId || seen.has(x.itemId)) continue;
    seen.add(x.itemId);
    out.push({ itemId: x.itemId, slot: tpl.slots?.[x.itemId] ?? homeSlot(byId.get(x.itemId), tpl), qty: Math.max(1, Number(x.qty) || 1), block: null });
  }
  return out;
}
/** The template's items as plain entries ({ itemId, slot, qty }), e.g. the snapshot. */
export const templateEntries = (tpl, items, setsValue = []) => templateItems(tpl, items, setsValue).map(({ itemId, slot, qty }) => ({ itemId, slot, qty }));

/**
 * The linked fields that give exactly these entries (ids, places, amounts) with the template's
 * blocks: members missing from the entries go to `without`, the rest of the entries to `extras`,
 * places and amounts that differ to `slots` and `qty`. entries is rewritten as the snapshot.
 */
export function linkEntries(tpl, entries, items, setsValue = []) {
  const want = new Map();
  for (const e of entries ?? []) if (e?.itemId && !want.has(e.itemId)) want.set(e.itemId, e);
  const domain = tplDomain(tpl);
  const blocks = [...new Set(tpl.blocks ?? [])];
  const without = {};
  for (const key of blocks) {
    const out = blockMembers(key, items, domain).filter((i) => !want.has(i.id)).map((i) => i.id);
    if (out.length) without[key] = out;
  }
  const bare = { ...tpl, domain, blocks, without, extras: [], slots: {}, qty: {} };
  const fromBlocks = templateItems(bare, items, setsValue);
  const inBlocks = new Set(fromBlocks.map((x) => x.itemId));
  const extras = [...want.values()].filter((e) => !inBlocks.has(e.itemId)).map((e) => ({ itemId: e.itemId, qty: Math.max(1, Number(e.qty) || 1) }));
  const byId = new Map(items.map((i) => [i.id, i]));
  const slots = {};
  const qty = {};
  for (const x of fromBlocks) {
    const e = want.get(x.itemId);
    if (e.slot && e.slot !== x.slot) slots[x.itemId] = e.slot;
    if (Math.max(1, Number(e.qty) || 1) !== x.qty) qty[x.itemId] = Math.max(1, Number(e.qty) || 1);
  }
  for (const x of extras) {
    const e = want.get(x.itemId);
    if (e.slot && e.slot !== homeSlot(byId.get(x.itemId), tpl)) slots[x.itemId] = e.slot;
  }
  const linked = { ...bare, without, extras, slots, qty };
  return { ...linked, entries: templateEntries(linked, items, setsValue) };
}

/**
 * The building blocks a list of entries holds completely (every member of the block in this area is
 * on it), in the usual block order. "Save as template" and older templates without tpl.blocks.
 */
export function wholeBlocks(entries, items, setsValue = [], domain = BIKEPACKING) {
  const have = new Set((entries ?? []).map((e) => e.itemId));
  return blockOrder(items, setsValue).filter((key) => {
    const its = blockMembers(key, items, domain);
    return its.length > 0 && its.every((i) => have.has(i.id));
  });
}

/**
 * An older template (entries only) linked once, with exactly the same content (Noah 2a):
 * blocks = its tpl.blocks (v0.33.0) or the blocks it holds completely; domain bikepacking.
 * A linked template comes back unchanged (the same object).
 */
export function linkTemplate(tpl, items, setsValue = []) {
  if (!tpl || isLinked(tpl)) return tpl;
  const blocks = Array.isArray(tpl.blocks) ? tpl.blocks : wholeBlocks(tpl.entries ?? [], items, setsValue, tplDomain(tpl));
  const base = { ...tpl, domain: tplDomain(tpl), blocks, createdAt: tpl.createdAt ?? tpl.updatedAt ?? null, archivedAt: tpl.archivedAt ?? null, keptAt: tpl.keptAt ?? null };
  // entries stays exactly as it was (the same content, also in the same order).
  return { ...linkEntries(base, tpl.entries ?? [], items, setsValue), entries: tpl.entries ?? [] };
}

/** The same items, places and amounts, in any order? */
export function sameEntries(a = [], b = []) {
  const key = (list) => list.map((e) => `${e.itemId}\u0000${e.slot}\u0000${e.qty || 1}`).sort().join('\u0001');
  return a.length === b.length && key(a) === key(b);
}

/**
 * One template as it is saved (saveTemplates). prev: the stored version (or null).
 * - older template: as it is;
 * - its entries were changed by an older writer (debrief, assign, merge, delete): that change
 *   (items out, items in, other place or amount) is applied to the items as they are now and
 *   turned into the linked fields;
 * - else: the snapshot is rewritten from the linked fields.
 */
export function syncTemplate(next, prev, items, setsValue = []) {
  if (!isLinked(next)) return next;
  const now = templateEntries(next, items, setsValue);
  // A snapshot that matches its own linked fields is no older writer's change (a page that saved a fresh one).
  const changed = prev && isLinked(prev) && JSON.stringify(prev.entries ?? []) !== JSON.stringify(next.entries ?? []) && !sameEntries(now, next.entries ?? []);
  if (!changed) return sameEntries(now, next.entries ?? []) ? next : { ...next, entries: now };
  const before = new Map((prev.entries ?? []).map((e) => [e.itemId, e]));
  const after = new Map((next.entries ?? []).map((e) => [e.itemId, e]));
  const desired = now.filter((e) => !before.has(e.itemId) || after.has(e.itemId));
  const at = new Map(desired.map((e, n) => [e.itemId, n]));
  for (const [id, e] of after) {
    const b = before.get(id);
    if (b && b.slot === e.slot && (b.qty || 1) === (e.qty || 1)) continue;
    const row = { itemId: id, slot: e.slot, qty: e.qty || 1 };
    if (at.has(id)) desired[at.get(id)] = row;
    else desired.push(row);
  }
  return linkEntries(next, desired, items, setsValue);
}
export function syncTemplates(list, prevList, items, setsValue = []) {
  const prev = new Map((prevList ?? []).map((x) => [x.id, x]));
  return (list ?? []).map((x) => syncTemplate(x, prev.get(x.id) ?? null, items, setsValue));
}

/** Weight of the template's items (honest like sumKnown): { g, missing, n }. */
export function templateWeight(tpl, items, setsValue = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const list = templateItems(tpl, items, setsValue).filter((e) => byId.has(e.itemId) && byId.get(e.itemId).ownership !== 'gone');
  const { g, missing } = sumKnown(list.map((e) => {
    const w = itemWeight(byId.get(e.itemId));
    return w == null ? null : w * e.qty;
  }));
  return { g, missing, n: list.length };
}

/**
 * The words of a template: { standard, blocks: [set], single } for sets.js blocksLine
 * ("Standard + Rain + 2 extra"), straight from its blocks and extras. An older template: null.
 */
export function templateParts(tpl, setsValue = []) {
  if (!isLinked(tpl)) return null;
  const sets = allSets(setsValue);
  const keys = tpl.blocks ?? [];
  return {
    standard: keys.includes(STANDARD),
    blocks: keys.filter((k) => k !== STANDARD).map((k) => sets.find((s) => s.key === k) ?? { key: k, name: k, builtIn: false }),
    single: (tpl.extras ?? []).length,
  };
}

/* ---------- usage (Noah 7a) and "long not used" (6a) ---------- */

/** How long a template may rest before "long not used" (months). */
export const STALE_MONTHS = 12;
const monthsBack = (today, n) => {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
};

/**
 * Noah 7a: used = trips started or ridden from it (start date today or earlier, or finished),
 * not only planned ones and not skipped ones. Derived, never stored.
 * → { n, last (ISO date or null), trips (newest first) }
 */
export function templateUse(tpl, trips, today) {
  const list = (trips ?? [])
    .filter((x) => x.templateId === tpl?.id && !x.skipped && ((x.startDate && x.startDate <= today) || x.finished || x.status === 'done'))
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  return { n: list.length, last: list[0]?.startDate ?? null, trips: list };
}

/**
 * Noah 6a: "long not used": no use (or, never used, made) for 12 months, not archived, and not
 * kept with "Keep" within the last 12 months (Q6a).
 */
export function isStale(tpl, trips, today) {
  if (!tpl || tpl.archivedAt) return false;
  const cut = monthsBack(today, STALE_MONTHS);
  if (tpl.keptAt && tpl.keptAt.slice(0, 10) > cut) return false;
  const last = templateUse(tpl, trips, today).last ?? (tpl.createdAt ?? tpl.updatedAt ?? '').slice(0, 10);
  return !!last && last < cut;
}

/** The areas that have templates (not archived), in the order of DOMAINS: [{ key, n }] (Noah 5a). */
export function templateAreas(list) {
  const n = {};
  for (const x of list ?? []) if (!x.archivedAt) n[tplDomain(x)] = (n[tplDomain(x)] ?? 0) + 1;
  return Object.keys(DOMAIN).filter((k) => n[k]).map((key) => ({ key, n: n[key] }));
}

/** A new empty linked template (Noah 1a; 4a: Standard is always ticked). */
export function blankTemplate({ id, name = '', domain = BIKEPACKING, now = new Date().toISOString() }) {
  return {
    id, name: name.trim(), domain, blocks: [STANDARD], without: {}, extras: [], slots: {}, qty: {},
    bikeId: null, setup: {}, entries: [], ready: [], ride: null, hours: null, sets: {}, purpose: {},
    days: 1, overnight: null, cook: false, archivedAt: null, keptAt: null, createdAt: now, updatedAt: now,
  };
}

/** A copy under a new name ("Duplicate"); usage and history stay with the original. */
export const duplicateTemplate = (tpl, { id, name, now = new Date().toISOString() }) => ({ ...structuredClone(tpl), id, name, fromTrip: null, hintLog: [], archivedAt: null, keptAt: null, createdAt: now, updatedAt: now });

/** A free name: "Name", else "Name 2", "Name 3" … */
export function freeName(name, list) {
  const taken = new Set((list ?? []).map((x) => `${x.name}`.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  let n = 2;
  while (taken.has(`${name} ${n}`.toLowerCase())) n++;
  return `${name} ${n}`;
}

/**
 * Before a building block is deleted: every template holding it gets the block's items as extras
 * (same places and amounts), so nothing disappears from a template. items: BEFORE the delete.
 * Returns the new list, or null when no template holds the block.
 */
export function dropBlock(list, key, items, setsValue = []) {
  if (!(list ?? []).some((x) => isLinked(x) && x.blocks?.includes(key))) return null;
  return list.map((x) => {
    if (!isLinked(x) || !x.blocks?.includes(key)) return x;
    const keep = templateEntries(x, items, setsValue);
    const { [key]: _, ...without } = x.without ?? {};
    return linkEntries({ ...x, blocks: x.blocks.filter((k) => k !== key), without }, keep, items, setsValue);
  });
}

/** Templates (not archived) holding a block: for "in N templates" on the Blocks page (Noah 3a). */
export const templatesWith = (list, key) => (list ?? []).filter((x) => !x.archivedAt && isLinked(x) && x.blocks?.includes(key));

/**
 * On every start (tidy.js): linked templates whose entries snapshot no longer matches their blocks
 * (a block changed in the item window, an item was archived) get it rewritten. Writes only then.
 */
export async function refreshSnapshots(db) {
  await db.transaction('rw', db.items, db.settings, async () => {
    const rec = await db.settings.get(TEMPLATES_KEY);
    const list = rec?.value ?? [];
    if (!list.some(isLinked)) return;
    const items = await db.items.toArray();
    const sets = (await db.settings.get('sets'))?.value ?? [];
    const out = syncTemplates(list, list, items, sets);
    if (JSON.stringify(out) !== JSON.stringify(list)) await db.settings.put({ ...rec, value: out });
  });
}
