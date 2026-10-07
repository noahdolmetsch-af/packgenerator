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

export const TEMPLATES_KEY = 'templates';

export async function loadTemplates(db) {
  return (await db.settings.get(TEMPLATES_KEY))?.value ?? [];
}
export async function saveTemplates(db, list) {
  await db.settings.put({ key: TEMPLATES_KEY, value: list });
}

/** A template from a trip (id and name are given, so this stays a pure function). */
export function templateFrom(trip, { id, name, now = new Date().toISOString() }) {
  return {
    id,
    name: name.trim(),
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
    bikeId: trip.bikeId ?? null,
    fromTrip: trip.id,
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
  await saveTemplates(db, upsert(list, templateFrom(trip, { id: tplId, name: clean })));
  await db.trips.update(trip.id, { templateId: tplId });
  return { id: tplId, name: clean };
}

/**
 * v0.26.1 (Noah 17b): what the New trip dialog takes from a template as its defaults (only what the
 * template knows; an older template without them changes nothing). The bike only when it still exists.
 * → { days?, hours?, overnight?, cook?, bikeId? }
 */
export function templateDefaults(tpl, bikes = []) {
  if (!tpl) return {};
  const out = {};
  if (Number(tpl.days) >= 1) out.days = Number(tpl.days);
  if (tpl.hours != null) out.hours = tpl.hours;
  if (tpl.overnight) {
    out.overnight = tpl.overnight;
    out.cook = tpl.overnight === 'outdoor' && !!tpl.cook;
  }
  if (tpl.bikeId && bikes.some((b) => b.id === tpl.bikeId)) out.bikeId = tpl.bikeId;
  return out;
}

/**
 * A new trip from a template on the chosen bike. The template's bags replace the bike's
 * standard bags only on places this bike has; items whose place has no bag go where
 * slotFor puts them (their usual bag, else the seat pack).
 */
export function tripFromTemplate({ title, startDate, days, bike }, tpl, items, now = Date.now()) {
  const setup = { ...(bike.setup ?? {}) };
  for (const [slot, bagId] of Object.entries(tpl.setup ?? {})) if (bagId && bike.slots?.includes(slot)) setup[slot] = bagId;
  const known = new Set(items.map((i) => i.id));
  const entries = tpl.entries
    .filter((e) => known.has(e.itemId))
    .map((e) => ({ itemId: e.itemId, slot: e.slot === 'body' || e.slot === 'mounted' || setup[e.slot] ? e.slot : slotFor(e.slot, setup), qty: e.qty || 1, packed: false }));
  entries.push(...alwaysEntries(items, entries, setup));
  return {
    id: `trip-${now.toString(36)}`,
    domain: 'bikepacking',
    title: title.trim(),
    startDate,
    days: Math.max(1, Number(days) || 1),
    bikeId: bike.id,
    bike: bike.name,
    setup,
    entries,
    ready: freshReady(tpl.ready),
    ride: tpl.ride ?? null,
    hours: tpl.hours ?? null,
    sets: { ...(tpl.sets ?? {}) },
    purpose: { ...(tpl.purpose ?? {}) },
    // v0.26.1 (Noah 17b): the template's overnight stay; the dialog's choice replaces it (buildBikeTrip fields).
    ...(tpl.overnight ? { overnight: tpl.overnight, cook: tpl.overnight === 'outdoor' && !!tpl.cook } : {}),
    status: 'planned',
    copiedFrom: null,
    templateId: tpl.id,
    createdAt: new Date(now).toISOString(),
  };
}

/** Change one template in place: fn gets a copy and returns the changed template. */
export async function updateTemplate(db, id, fn) {
  const list = await loadTemplates(db);
  const now = new Date().toISOString();
  await saveTemplates(db, list.map((t) => (t.id === id ? { ...fn(structuredClone(t)), updatedAt: now } : t)));
}
