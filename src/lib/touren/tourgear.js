/**
 * Gepäck nachtragen (Noah 20.10.2026 «1a 2b und a möglich 3a und b optional 4a 5a»): gear for a finished
 * ride that was not planned in the app.
 *
 * - 1a: «Gepäck eintragen» makes the ride (or a joined tour) a trip of the Packmodus: trip.fromActs names
 *   its activities, status 'done', a finished Rückblick (debrief status 'done'). So what was not used
 *   comes back the next time you pack (unusedBefore, neverused) like after any trip.
 * - 2b and a: the things are tapped one by one from the Material, or taken over from a template or an
 *   earlier trip and then changed.
 * - 3a, b optional: every thing has its mark: used (the standard), not used, broken
 *   (debrief.items { id: 'unused' | 'broken' }); a short note is optional (debrief.itemText { id: text })
 *   and becomes a learning of that thing, shown when you pack it next time (tipsByItem).
 * - 5a: food and drink (Material category «food») stand on their own, with their own «What was missing?»
 *   (debrief.missing entries with food: true).
 * Names you type never go through t().
 */
import { isInventory, CATEGORIES, itemDraft, itemRecord } from '../gear.js';
import { isWorn } from '../blocks2026.js';
import { newDebrief } from '../debrief.js';
import { DOMAIN, BIKEPACKING } from '../domains.js';
import { TOUR_GROUPS_KEY, dropGroup } from './tour.js';
import { addTripPhotos, tripPhotos } from '../lernen/fotos.js';

export const FOOD = 'food';
export const MARKS = ['used', 'unused', 'broken'];
export const MARK_NAMES = { used: 'Used', unused: 'Not used', broken: 'Broken', open: 'Not looked at yet' };

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/** The packing-list entry of an item: worn things on the body, the rest in its usual bag; packed. */
export const entryOf = (item, qty = 1) => ({ itemId: item.id, slot: isWorn(item) ? 'body' : item.defaultBag || 'top', qty: Math.max(1, Number(qty) || 1), packed: true });

/** The new entries for the chosen ids: chosen entries stay as they were (qty, bag), new ones are added. */
export function entriesFor(ids, entries = [], items = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const old = Object.fromEntries(entries.map((e) => [e.itemId, e]));
  return [...new Set(ids)].map((id) => old[id] ?? (byId[id] ? entryOf(byId[id]) : null)).filter(Boolean);
}

/** The area of the trip made from a ride: bike rides are bikepacking, walking and running hiking. */
export const domainFor = (kind) => (kind === 'run' || kind === 'hike') && DOMAIN.hiking ? 'hiking' : BIKEPACKING;

/**
 * 1a: the trip a ride (or a joined tour) becomes. acts: the activities; name: the tour's name.
 * Nothing about the ride itself changes: the activities stay, the km stay counted on the bike.
 */
export function tripFromActs(acts, { name, bike = null, kind = 'bike', ids = [], items = [], now = Date.now(), weather = null } = {}) {
  const days = acts.map((a) => a.day).filter(Boolean).sort();
  const start = days[0];
  const end = days.at(-1) ?? start;
  return {
    id: `trip-${now.toString(36)}`,
    domain: domainFor(kind),
    title: String(name ?? '').trim(),
    startDate: start,
    days: start ? daysBetween(start, end) + 1 : 1,
    bikeId: bike?.id ?? null,
    bike: bike?.name ?? null,
    setupId: 'std',
    setup: { ...(bike?.setup ?? {}) },
    entries: entriesFor(ids, [], items),
    ready: [],
    status: 'done',
    fromActs: acts.map((a) => String(a.id)),
    copiedFrom: null,
    ...(weather?.days?.length ? { wxReal: weather, forecast: weather } : {}),
    createdAt: new Date(now).toISOString(),
  };
}

/** The finished Rückblick of that trip: every thing counts as used; the km are already on the bike. */
export function debriefFor(trip, { km = null, diary = '', note = '', now = new Date().toISOString() } = {}) {
  const d = newDebrief(trip, now);
  return {
    ...d,
    status: 'done',
    doneAt: now,
    km: typeof km === 'number' ? km : null,
    kmApplied: typeof km === 'number' ? km : 0,
    note: String(note ?? ''),
    itemText: {},
    ...(String(diary ?? '').trim() ? { diary: { text: String(diary), edited: true, at: now } } : {}),
  };
}

/**
 * The gear of a trip in its groups. → { gear: { used, unused, broken, open }, food: { … } } with
 * [{ id, name, qty, mark, text }]. Without a Rückblick nothing was looked at yet (open); with one, a thing
 * without a mark was used (as in the Rückblick: you only tap the exceptions).
 */
export function gearGroups(entries = [], debrief = null, items = [], nameOf = (i) => i.name) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const empty = () => ({ used: [], unused: [], broken: [], open: [] });
  const out = { gear: empty(), food: empty() };
  for (const e of entries) {
    const it = byId[e.itemId];
    const st = debrief?.items?.[e.itemId];
    const mark = st === 'unused' || st === 'broken' ? st : debrief ? 'used' : 'open';
    const side = it?.category === FOOD ? out.food : out.gear;
    side[mark].push({ id: e.itemId, name: it ? nameOf(it) : (e.name ?? e.itemId), qty: e.qty ?? 1, mark, text: debrief?.itemText?.[e.itemId] ?? '' });
  }
  return out;
}

/** The mark of one thing: 'used' takes the exception away. → the new debrief.items. */
export function markItems(items = {}, itemId, mark) {
  const out = { ...items };
  if (mark === 'unused' || mark === 'broken') out[itemId] = mark;
  else delete out[itemId];
  return out;
}

/** The learning a note on a thing becomes (shown when you pack it next time). */
export const noteLearningId = (tripId, itemId) => `tg-${tripId}-${itemId}`;
export function noteLearning(trip, itemId, text, now = new Date().toISOString()) {
  return { id: noteLearningId(trip.id, itemId), topic: 'Debrief', rule: String(text).trim(), action: '', itemIds: [itemId], source: trip.title ?? '', tripId: trip.id, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now, from: 'tour' };
}

/**
 * What to take over from (2 «a möglich»): the templates and the earlier trips with a packing list, the
 * newest first, without the trip itself. → [{ id, name, sub, ids }]
 */
export function sourcesOf({ templates = [], trips = [], self = null } = {}) {
  const tpl = templates.filter((x) => (x.entries ?? []).length).map((x) => ({ id: `tpl:${x.id}`, kind: 'template', name: x.name, day: '', ids: x.entries.map((e) => e.itemId) }));
  const tr = trips
    .filter((x) => x.id !== self && (x.entries ?? []).length && !x.archivedAt)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    .slice(0, 30)
    .map((x) => ({ id: `trip:${x.id}`, kind: 'trip', name: x.title || x.id, day: x.startDate ?? '', ids: x.entries.map((e) => e.itemId) }));
  return [...tpl, ...tr];
}

/** The things to choose from: what you have (and what is on the list already), by category, food last. */
export function pickGroups(items = [], chosen = new Set(), q = '', nameOf = (i) => i.name) {
  const words = String(q).trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (i) => !words.length || words.every((w) => `${nameOf(i)} ${i.name} ${i.brand ?? ''}`.toLowerCase().includes(w));
  const list = items.filter((i) => (isInventory(i) || chosen.has(i.id)) && hit(i));
  const order = [...CATEGORIES.filter((c) => c.key !== FOOD), ...CATEGORIES.filter((c) => c.key === FOOD)];
  const known = new Set(order.map((c) => c.key));
  const groups = order.map((c) => ({ key: c.key, name: c.name, items: list.filter((i) => i.category === c.key) }));
  const rest = list.filter((i) => !known.has(i.category));
  if (rest.length) groups.push({ key: 'other', name: 'Other|kind', items: rest });
  return groups.filter((g) => g.items.length).map((g) => ({ ...g, items: g.items.sort((a, b) => nameOf(a).localeCompare(nameOf(b))) }));
}

/** A thing typed in that is not in the Material yet: a new item of the chosen category. */
export const newMaterialItem = (name, category, items = [], now = new Date().toISOString()) => itemRecord(itemDraft(null, { name: String(name).trim(), category }), { items, now });

/* ---------------- writes ---------------- */

const groupsOf = async (db) => {
  const rec = await db.settings.get(TOUR_GROUPS_KEY);
  return Array.isArray(rec?.value) ? rec.value : [];
};

/**
 * 1a: make the ride (d.kind 'a') or the joined tour ('g') a trip with the chosen things. Its name, diary,
 * rating, «what was good», «next time», the photos and the weather go along; a joined tour becomes the
 * trip (its group goes). → { tripId, undo } (undo: everything as before).
 */
export async function packTour(db, d, ids, { name, bike = null, kind = 'bike', km = null, now = Date.now() } = {}) {
  const items = await db.items.toArray();
  const first = d.acts[0] ?? {};
  const src = d.kind === 'g' ? (d.group ?? {}) : { ...(first.own ?? {}), diary: first.note ?? '' };
  const weather = d.acts.map((a) => a.weather).find((w) => w?.days?.length) ?? null;
  const trip = tripFromActs(d.acts, { name, bike, kind, ids, items, now, weather });
  const own = Object.fromEntries(['rating', 'good', 'next'].filter((k) => src[k] != null && src[k] !== '').map((k) => [k, src[k]]));
  if (Object.keys(own).length) trip.own = own;
  const deb = debriefFor(trip, { km, diary: src.diary ?? '', now: trip.createdAt });
  const groupsBefore = await groupsOf(db);
  await db.trips.put(trip);
  await db.debriefs.put(deb);
  if (d.kind === 'g') await db.settings.put({ key: TOUR_GROUPS_KEY, value: dropGroup(groupsBefore, d.id) });
  // the photos of the tour come along (they stay on this device)
  const photos = await tripPhotos(d.key);
  if (photos.length) await addTripPhotos(trip.id, photos.map(({ day, data }) => ({ day, data })));
  const undo = async () => {
    await db.trips.delete(trip.id);
    await db.debriefs.delete(trip.id);
    if (d.kind === 'g') await db.settings.put({ key: TOUR_GROUPS_KEY, value: groupsBefore });
  };
  return { tripId: trip.id, undo };
}

/** 2: the chosen things of a trip (kept entries stay as they were). → the entries before (for Undo). */
export async function setTripGear(db, tripId, ids) {
  const trip = await db.trips.get(tripId);
  const items = await db.items.toArray();
  const before = trip?.entries ?? [];
  await db.trips.update(tripId, { entries: entriesFor(ids, before, items), updatedAt: new Date().toISOString() });
  return before;
}
export const restoreGear = (db, tripId, entries) => db.trips.update(tripId, { entries, updatedAt: new Date().toISOString() });

/** The Rückblick of a trip to write into: the one there is, else a new draft. */
async function debriefOf(db, trip) {
  return (await db.debriefs.get(trip.id)) ?? newDebrief(trip);
}

/** 3a: the mark of one thing. */
export async function setMark(db, trip, itemId, mark) {
  const deb = await debriefOf(db, trip);
  await db.debriefs.put({ ...deb, items: markItems(deb.items, itemId, mark), updatedAt: new Date().toISOString() });
}

/** 3b optional: the note of one thing; it is also a learning of that thing (empty: both go). */
export async function setItemText(db, trip, itemId, text) {
  const deb = await debriefOf(db, trip);
  const v = String(text ?? '').trim();
  const itemText = { ...(deb.itemText ?? {}) };
  if (v) itemText[itemId] = v;
  else delete itemText[itemId];
  await db.debriefs.put({ ...deb, itemText, updatedAt: new Date().toISOString() });
  if (v) await db.learnings.put(noteLearning(trip, itemId, v));
  else await db.learnings.delete(noteLearningId(trip.id, itemId));
}

/** «What was missing?»: add one (food: true for Essen und Trinken). → its id. */
export async function addMissing(db, trip, name, { food = false, itemId = null } = {}) {
  const v = String(name ?? '').trim();
  if (!v) return null;
  const deb = await debriefOf(db, trip);
  const id = `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await db.debriefs.put({ ...deb, missing: [...(deb.missing ?? []), { id, name: v, itemId, ...(food ? { food: true } : {}) }], updatedAt: new Date().toISOString() });
  return id;
}
/** Take one out again. → the entry (for Undo). */
export async function dropMissing(db, trip, id) {
  const deb = await db.debriefs.get(trip.id);
  if (!deb) return null;
  const gone = (deb.missing ?? []).find((m) => m.id === id) ?? null;
  await db.debriefs.put({ ...deb, missing: (deb.missing ?? []).filter((m) => m.id !== id), updatedAt: new Date().toISOString() });
  return gone;
}
export async function putMissingBack(db, trip, entry) {
  const deb = await db.debriefs.get(trip.id);
  if (!deb || !entry) return;
  await db.debriefs.put({ ...deb, missing: [...(deb.missing ?? []), entry] });
}
