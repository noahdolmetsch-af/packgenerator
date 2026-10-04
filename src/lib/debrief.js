/**
 * Debrief (stage 1 of the vision, 4.10.2026): two minutes after a trip.
 *
 * Step 1: three quick answers (weather, how much, bags and bike) and one optional sentence.
 * Step 2: every packed item counts as used; you only tap the exceptions (not used, broken)
 *         and add what you missed.
 * Step 3: the app suggests what to change; nothing changes without a tick.
 *
 * A debrief is stored in the table "debriefs", one per trip (key tripId):
 *   { tripId, status: 'draft' | 'done', weather, amount, bags, note,
 *     items: { [itemId]: 'unused' | 'broken' }, missing: [{ id, name, itemId }], applied: [suggestion ids], doneAt }
 * Pure functions only, so the rules are easy to test.
 */
import { isInventory } from './gear.js';

export const WEATHER = [
  { key: 'colder', name: 'Colder' },
  { key: 'planned', name: 'As planned' },
  { key: 'warmer', name: 'Warmer' },
];
export const AMOUNT = [
  { key: 'little', name: 'Too little' },
  { key: 'right', name: 'Right' },
  { key: 'much', name: 'Too much' },
];
export const BAGS_OK = [
  { key: 'problems', name: 'Problems' },
  { key: 'fine', name: 'All fine' },
];
/** Answers per item. Used is the default and is not stored. */
export const ITEM_STATE = { used: 'Used', unused: 'Not used', broken: 'Broken' };

/** Clothing that can wait at home on a warm trip ("only below 10 °C"). */
const CLOTHING = ['onbike', 'rain', 'offbike'];
export const WARM_LIMIT = 10;

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

/** Last day of a trip (YYYY-MM-DD), or null without a start date. */
export const tripEnd = (trip) => (trip?.startDate ? addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1) : null);

/** Is the trip over (its last day is before today)? Answer 4a: the debrief shows up the day after. */
export const isOver = (trip, today = iso(new Date())) => {
  const end = tripEnd(trip);
  return !!end && end < today;
};

/** Trips that still want a debrief (answer 1a: only trips packed in the app), newest first. */
export function toDebrief(trips, debriefs, today = iso(new Date())) {
  const done = new Set(debriefs.filter((d) => d.status === 'done').map((d) => d.tripId));
  return trips.filter((t) => isOver(t, today) && !done.has(t.id) && t.entries?.length).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/** The next trip: the first one that has not ended yet. */
export function nextTrip(trips, today = iso(new Date())) {
  return [...trips].filter((t) => t.startDate && tripEnd(t) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

/** An empty debrief for a trip. */
export const newDebrief = (trip, now = new Date().toISOString()) => ({
  tripId: trip.id,
  status: 'draft',
  weather: null,
  amount: null,
  bags: null,
  note: '',
  items: {},
  missing: [],
  applied: [],
  createdAt: now,
  updatedAt: now,
});

/** Counts for the summary: items not used, their weight, broken and missing. */
export function debriefCounts(debrief, trip, items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const unused = trip.entries.filter((e) => debrief.items[e.itemId] === 'unused');
  const grams = unused.reduce((t, e) => t + (byId[e.itemId]?.weightG ?? 0) * (e.qty || 1), 0);
  return {
    unused: unused.length,
    unusedG: grams,
    broken: trip.entries.filter((e) => debrief.items[e.itemId] === 'broken').length,
    missing: debrief.missing.length,
    looked: Object.keys(debrief.items).length,
  };
}

/**
 * What the app suggests after a debrief. Each suggestion: { id, group, label, detail }.
 * groups: 'home' (leave at home next time), 'wish' (wishlist), 'learn' (learnings), 'template'.
 * Nothing is applied here; applyDebrief does that for the ticked ones.
 */
export function suggestions(debrief, trip, items, learnings = [], templates = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const out = [];
  const unusedIds = trip.entries.filter((e) => debrief.items[e.itemId] === 'unused').map((e) => e.itemId);
  const brokenIds = trip.entries.filter((e) => debrief.items[e.itemId] === 'broken').map((e) => e.itemId);
  const unused = unusedIds.map((id) => byId[id]).filter(Boolean);

  // Leave at home: warm-weather clothing gets a cold limit, standard items become optional.
  if (debrief.weather === 'warmer') {
    for (const i of unused.filter((x) => CLOTHING.includes(x.category) && typeof x.coldBelow !== 'number' && x.role !== 'worn'))
      out.push({ id: `cold:${i.id}`, group: 'home', label: `${i.name}: only below ${WARM_LIMIT} °C`, detail: 'Added by the layers when it gets cold, otherwise it stays at home.' });
  }
  for (const i of unused.filter((x) => x.role === 'standard' && !out.some((s) => s.id === `cold:${x.id}`)))
    out.push({ id: `optional:${i.id}`, group: 'home', label: `${i.name}: not on every trip`, detail: 'Changes "Standard pack" to "Optional".' });

  // Wishlist: what was missing and is not in the gear yet, and what broke.
  for (const m of debrief.missing.filter((x) => !x.itemId))
    out.push({ id: `wish:${m.id}`, group: 'wish', label: `${m.name} (missing)`, detail: 'New wishlist item.' });
  for (const i of brokenIds.map((id) => byId[id]).filter(Boolean))
    out.push({ id: `broken:${i.id}`, group: 'wish', label: `${i.name} (broken, replace)`, detail: 'New wishlist item; the old one stays in your gear until you mark it gone.' });

  // Learnings: old ones that this trip confirms, and the sentence from step 1 as a new one.
  const touched = new Set([...unusedIds, ...debrief.missing.map((m) => m.itemId).filter(Boolean)]);
  for (const l of learnings.filter((x) => x.itemIds?.some((id) => touched.has(id))))
    out.push({ id: `confirm:${l.id}`, group: 'learn', label: `Confirmed again: "${short(l.rule)}"`, detail: l.confirmed ? `Confirmed ${l.confirmed + 1} times now.` : 'First confirmation.' });
  if (debrief.note.trim()) out.push({ id: 'learn:note', group: 'learn', label: `New: "${short(debrief.note.trim())}"`, detail: `Saved as a learning from ${trip.title}.` });

  // Template: the trip was started from a template that still exists.
  const tpl = templates.find((t) => t.id === trip.templateId);
  const missingOwned = debrief.missing.filter((m) => m.itemId);
  if (tpl && (unusedIds.length || missingOwned.length))
    out.push({ id: `template:${tpl.id}`, group: 'template', label: `Update "${tpl.name}"`, detail: [unusedIds.length && `${unusedIds.length} not used out`, missingOwned.length && `${missingOwned.length} missing in`].filter(Boolean).join(', ') });
  return out;
}

const short = (s, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Apply the ticked suggestions. Returns the records to write: { items, learnings, templates }
 * (items and learnings: changed or new records; templates: the whole new list or null).
 */
export function applyDebrief(debrief, trip, items, learnings, templates, ticked, { now = new Date().toISOString(), newItemId = (n) => `WISH-${n}` } = {}) {
  const on = new Set(ticked);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const changed = {};
  const edit = (id, fields) => (changed[id] = { ...(changed[id] ?? byId[id]), ...fields, updatedAt: now });
  const newItems = [];
  const wish = (name, note, from) =>
    newItems.push({
      id: newItemId(newItems.length + 1), name, brand: from?.brand ?? '', model: from?.model ?? '', category: from?.category ?? 'lux', weightG: from?.weightG ?? null, qty: 1,
      weightStatus: from?.weightG != null ? from.weightStatus : 'missing', carry: from?.carry ?? 'luggage', defaultBag: from?.defaultBag ?? null, ownership: 'wishlist',
      role: null, sets: [], kits: [], domains: ['bikepacking'], note, updatedAt: now,
    });

  for (const id of on) {
    const [kind, key] = id.split(/:(.*)/s);
    if (kind === 'cold' && byId[key]) edit(key, { coldBelow: WARM_LIMIT });
    if (kind === 'optional' && byId[key]) edit(key, { role: 'optional' });
    if (kind === 'wish') {
      const m = debrief.missing.find((x) => x.id === key);
      if (m) wish(m.name, `Missing on ${trip.title} (debrief).`);
    }
    if (kind === 'broken' && byId[key]) wish(byId[key].name, `Broke on ${trip.title} (debrief): replace.`, byId[key]);
  }

  const learnOut = [];
  for (const l of learnings) if (on.has(`confirm:${l.id}`)) learnOut.push({ ...l, confirmed: (l.confirmed ?? 0) + 1, lastConfirmed: trip.title });
  if (on.has('learn:note') && debrief.note.trim()) {
    const next = Math.max(0, ...learnings.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
    learnOut.push({ id: next, topic: 'Debrief', rule: debrief.note.trim(), action: '', itemIds: [], source: trip.title, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now });
  }

  let tplOut = null;
  const tplId = [...on].find((x) => x.startsWith('template:'))?.slice(9);
  if (tplId && templates.some((t) => t.id === tplId)) {
    const drop = new Set(trip.entries.filter((e) => debrief.items[e.itemId] === 'unused').map((e) => e.itemId));
    tplOut = templates.map((t) => {
      if (t.id !== tplId) return t;
      const have = new Set(t.entries.map((e) => e.itemId));
      const add = debrief.missing.filter((m) => m.itemId && !have.has(m.itemId) && byId[m.itemId]).map((m) => ({ itemId: m.itemId, slot: byId[m.itemId].defaultBag ?? 'seat', qty: 1 }));
      return { ...t, entries: [...t.entries.filter((e) => !drop.has(e.itemId)), ...add], updatedAt: now };
    });
  }
  return { items: [...Object.values(changed), ...newItems], learnings: learnOut, templates: tplOut };
}

/* ---------- learnings shown on Home and in Pack ---------- */

const PRIO = { high: 3, medium: 2, low: 1 };
const COLD = /autumn|cold|winter|night|glove|down|warm|buff|dark|light/i;
const HOT = /heat|hot|sun|summer|water|drink/i;

/** The learnings that matter most for a trip (answer 9a: the 3 most important for the season). */
export function learningsFor(trip, learnings, n = 3, today = new Date()) {
  const month = trip?.startDate ? Number(trip.startDate.slice(5, 7)) : today.getMonth() + 1;
  const cold = month >= 10 || month <= 4;
  const on = new Set(trip?.entries?.map((e) => e.itemId) ?? []);
  const score = (l) => {
    const text = `${l.topic} ${l.rule}`;
    return (
      (PRIO[l.priority] ?? 1) * 2 +
      ((cold ? COLD : HOT).test(text) ? 2 : 0) +
      (l.itemIds?.some((id) => on.has(id)) ? 1 : 0) +
      Math.min(2, l.confirmed ?? 0)
    );
  };
  return learnings
    .filter((l) => l.topic !== 'Open question')
    .map((l) => ({ l, s: score(l) }))
    .sort((a, b) => b.s - a.s || String(a.l.id).localeCompare(String(b.l.id), undefined, { numeric: true }))
    .slice(0, n)
    .map((x) => x.l);
}

/** Items that are not owned yet but someone will want soon (for the Home gear card). */
export const wishCount = (items) => items.filter((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy').length;
export const unweighedCount = (items) => items.filter((i) => isInventory(i) && i.weightG == null).length;
