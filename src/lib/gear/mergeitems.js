/**
 * v0.37.1 "Zusammenlegen" (Noah: the app proposes the counterpart, he confirms): two items that are
 * the same thing (a double under another name), or one collection item that became several items
 * ("Snack (Biber/Banane/Nüsse)" → "Biber", "Banane", "Nüsse"), become one.
 *
 * mergePlan (pure) says what changes; mergeItems (database) writes it in one transaction and returns
 * an undo snapshot for bulk.js undoBulk ("Rückgängig" restores the exact records).
 *
 * Rules (docs/decisions.md, 0.37.1):
 *   - Every reference to the old item now points to the target(s): templates, building blocks
 *     (item.sets, also the night and context sets, and the amounts in settings "sets"), the bag link
 *     of a bag (containers.itemId), bike fixtures, other items (altFor, replaces), learnings (the
 *     targets are added) and the entries and ready rows of trips that are NOT over yet.
 *   - Past and finished trips (over, status done, or debriefed) and debriefs stay untouched: history
 *     stays complete.
 *   - Several targets (a collection): each target gets the reference with the same amount.
 *   - The target keeps all its own values; only its EMPTY fields are filled from the old item (note,
 *     favourite note, usual bag, weight); favourite is OR-ed, lists, areas and building blocks are
 *     joined. Nothing is overwritten.
 *   - The old item is archived (ownership 'gone', archivedFrom, archivedAt, archivedBy 'merge',
 *     mergedInto). Nothing is deleted. A second run changes nothing (idempotent).
 */
import { isOver } from '../debrief.js';
import { localDay } from '../localday.js';
import { itemDomains } from '../domains.js';
import { STANDARD, inStandard, leaveHome } from '../blocks2026.js';
import { TEMPLATES_KEY } from '../templates.js';
import { SETS_KEY } from '../sets.js';

const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
const union = (a = [], b = []) => [...new Set([...(a ?? []), ...(b ?? [])])];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Is a trip still open (planned or on the way)? Over, done or debriefed trips are history. */
export function isOpenTrip(trip, doneDebriefs = new Set(), today = localDay()) {
  return !!trip && !isOver(trip, today) && trip.status !== 'done' && !doneDebriefs.has(trip.id);
}

/** The target with the empty fields filled from the old item (nothing overwritten). */
export function mergeFields(target, old, now) {
  const out = { ...target };
  for (const f of ['note', 'favNote', 'defaultBag']) if (empty(out[f]) && !empty(old[f])) out[f] = old[f];
  if (old.favorite && !out.favorite) out.favorite = true;
  if (!empty(old.lists)) out.lists = union(out.lists, old.lists);
  if (!empty(old.domains)) {
    const doms = union(itemDomains(out), itemDomains(old));
    if (!same(doms, itemDomains(out))) out.domains = doms;
  }
  if (out.weightG == null && old.weightG != null) {
    out.weightG = old.weightG;
    if (old.weightStatus) out.weightStatus = old.weightStatus;
    if (empty(out.weightNote) && !empty(old.weightNote)) out.weightNote = old.weightNote;
  }
  // Building blocks (also the night and context sets): joined. Standard only when the target does
  // not "stay at home" (that is the target's own say and is never overwritten).
  const keep = (k) => k !== STANDARD || !leaveHome(out);
  const sets = union(out.sets, (old.sets ?? []).filter(keep));
  if (inStandard(old) && !inStandard(out) && !leaveHome(out)) {
    if (!sets.includes(STANDARD)) sets.push(STANDARD);
    out.always = true;
    if (empty(out.role)) out.role = old.role === 'worn' ? 'worn' : 'standard';
  }
  if (!same(sets, out.sets ?? [])) out.sets = sets;
  out.mergedFrom = union(out.mergedFrom, [old.id]);
  if (!same(out, target)) out.updatedAt = now;
  return same(out, target) ? target : out;
}

/** Entries (of a trip or a template) with the old item replaced by the targets, same place and amount. */
export function swapEntries(entries = [], oldId, targetIds, fresh = (e) => e) {
  if (!entries.some((e) => e.itemId === oldId)) return entries;
  const have = new Set(entries.map((e) => e.itemId));
  const out = [];
  for (const e of entries) {
    if (e.itemId !== oldId) {
      out.push(e);
      continue;
    }
    for (const id of targetIds) {
      if (have.has(id)) continue;
      have.add(id);
      out.push(fresh({ ...e, itemId: id }, targetIds.length));
    }
  }
  return out;
}

const swapReady = (ready, oldId, to) => (Array.isArray(ready) && ready.some((r) => r.itemId === oldId) ? ready.map((r) => (r.itemId === oldId ? { ...r, itemId: to } : r)) : ready);

/**
 * What merging changes, from the data as it is (pure). state: { items, trips, debriefs, templates
 * (the list), sets (the settings value), containers, bikes, learnings }. Returns null when there is
 * nothing to do (old item missing or already merged, no valid target), else the changed records:
 * { items, trips, templates (new list or null), sets (new value or null), containers, bikes, learnings }.
 */
export function mergePlan(state, oldId, targetIds, { now = new Date().toISOString(), today = localDay() } = {}) {
  const items = state.items ?? [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const old = byId.get(oldId);
  if (!old || !empty(old.mergedInto)) return null;
  const ids = [...new Set(targetIds ?? [])].filter((id) => id !== oldId && byId.has(id) && byId.get(id).ownership !== 'gone');
  if (!ids.length) return null;
  const first = ids[0];

  // Items: the targets, the old one, and items that point to the old one (alternative, replaces).
  const changed = new Map();
  for (const id of ids) {
    const next = mergeFields(byId.get(id), old, now);
    if (next !== byId.get(id)) changed.set(id, next);
  }
  for (const i of items) {
    if (i.id === oldId || ids.includes(i.id) || i.ownership === 'gone') continue;
    if (i.altFor === oldId || i.replaces === oldId) {
      changed.set(i.id, { ...i, ...(i.altFor === oldId ? { altFor: first } : {}), ...(i.replaces === oldId ? { replaces: first } : {}), updatedAt: now });
    }
  }
  const gone = old.ownership === 'gone';
  changed.set(oldId, {
    ...old,
    ownership: 'gone',
    archivedFrom: gone ? old.archivedFrom ?? 'owned' : old.ownership ?? 'owned',
    archivedAt: gone && old.archivedAt ? old.archivedAt : now,
    archivedBy: 'merge',
    mergedInto: ids,
    updatedAt: now,
  });

  // Trips that are not over: entries and old ready rows. A collection's pieces start unpacked.
  const done = new Set((state.debriefs ?? []).filter((d) => d.status === 'done').map((d) => d.tripId));
  const freshEntry = (e, n) => (n > 1 ? { ...e, packed: false } : e);
  const trips = [];
  for (const t of state.trips ?? []) {
    if (!isOpenTrip(t, done, today)) continue;
    const entries = swapEntries(t.entries ?? [], oldId, ids, freshEntry);
    const ready = swapReady(t.ready, oldId, first);
    if (entries !== (t.entries ?? []) || ready !== t.ready) trips.push({ ...t, entries, ...(ready !== t.ready ? { ready } : {}), updatedAt: now });
  }

  // Templates: entries, same place and amount.
  const tplList = state.templates ?? [];
  let tplChanged = false;
  const templates = tplList.map((tpl) => {
    const entries = swapEntries(tpl.entries ?? [], oldId, ids);
    if (entries === (tpl.entries ?? [])) return tpl;
    tplChanged = true;
    return { ...tpl, entries, updatedAt: now };
  });

  // Amounts per item in a building block (settings "sets"): the targets take the old amount.
  const setList = Array.isArray(state.sets) ? state.sets : [];
  let setsChanged = false;
  const sets = setList.map((s) => {
    if (!s?.qty || s.qty[oldId] == null) return s;
    setsChanged = true;
    const qty = { ...s.qty };
    for (const id of ids) if (qty[id] == null) qty[id] = qty[oldId];
    delete qty[oldId];
    return { ...s, qty };
  });

  // A bag linked to the old item takes the (first) target; bike fixtures take every target.
  const containers = (state.containers ?? []).filter((c) => c.itemId === oldId).map((c) => ({ ...c, itemId: first }));
  const bikes = (state.bikes ?? [])
    .filter((b) => (b.fixtures ?? []).includes(oldId))
    .map((b) => ({ ...b, fixtures: [...new Set(b.fixtures.flatMap((id) => (id === oldId ? ids : [id])))] }));
  // Learnings keep the old ID (their history) and learn the targets.
  const learnings = (state.learnings ?? [])
    .filter((l) => (l.itemIds ?? []).includes(oldId) && ids.some((id) => !l.itemIds.includes(id)))
    .map((l) => ({ ...l, itemIds: union(l.itemIds, ids) }));

  return { targets: ids, items: [...changed.values()], trips, templates: tplChanged ? templates : null, sets: setsChanged ? sets : null, containers, bikes, learnings };
}

/**
 * Merge in the database (one transaction). Returns the undo snapshot for bulk.js undoBulk, or null
 * when nothing changed (already merged, no valid target).
 */
export async function mergeItems(db, oldId, targetIds, opts = {}) {
  const tables = [db.items, db.trips, db.debriefs, db.settings, db.containers, db.bikes, db.learnings];
  return db.transaction('rw', tables, async () => {
    const tplRec = await db.settings.get(TEMPLATES_KEY);
    const setsRec = await db.settings.get(SETS_KEY);
    const state = {
      items: await db.items.toArray(),
      trips: await db.trips.toArray(),
      debriefs: await db.debriefs.toArray(),
      templates: tplRec?.value ?? [],
      sets: setsRec?.value ?? [],
      containers: await db.containers.toArray(),
      bikes: await db.bikes.toArray(),
      learnings: await db.learnings.toArray(),
    };
    const plan = mergePlan(state, oldId, targetIds, opts);
    if (!plan) return null;
    const before = (table, recs, key = 'id') => {
      const keys = new Set(recs.map((r) => r[key]));
      return state[table].filter((r) => keys.has(r[key]));
    };
    const snap = {
      merge: { oldId, targets: plan.targets },
      items: before('items', plan.items),
      trips: before('trips', plan.trips),
      containers: before('containers', plan.containers),
      bikes: before('bikes', plan.bikes),
      learnings: before('learnings', plan.learnings),
      ...(plan.templates ? { templates: tplRec ?? null } : {}),
      ...(plan.sets ? { sets: setsRec ?? null } : {}),
    };
    await db.items.bulkPut(plan.items);
    if (plan.trips.length) await db.trips.bulkPut(plan.trips);
    if (plan.containers.length) await db.containers.bulkPut(plan.containers);
    if (plan.bikes.length) await db.bikes.bulkPut(plan.bikes);
    if (plan.learnings.length) await db.learnings.bulkPut(plan.learnings);
    if (plan.templates) await db.settings.put({ ...(tplRec ?? {}), key: TEMPLATES_KEY, value: plan.templates });
    if (plan.sets) await db.settings.put({ ...(setsRec ?? {}), key: SETS_KEY, value: plan.sets });
    return snap;
  });
}
