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
 *     items: { [itemId]: 'unused' | 'broken' }, missing: [{ id, name, itemId }], applied: [suggestion ids], doneAt,
 *     km, kmApplied }   km of this trip (answer 7a); kmApplied: what was already added to the bike
 * Pure functions only, so the rules are easy to test.
 */
import { isInventory } from './gear.js';
import { t, nameOf } from './i18n.svelte.js';

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
/** Answer 8b (4.10.2026): "leave at home" after an item was not used on 3 trips. */
export const LEAVE_AFTER = 3;

/** How often each item was "not used" in finished debriefs (other trips than tripId). */
export function unusedTimes(debriefs, tripId = null) {
  const out = {};
  for (const d of debriefs)
    if (d.status === 'done' && d.tripId !== tripId)
      for (const [id, state] of Object.entries(d.items ?? {})) if (state === 'unused') out[id] = (out[id] ?? 0) + 1;
  return out;
}

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

/** Last day of a trip (YYYY-MM-DD), or null without a start date. */
export const tripEnd = (trip) => (trip?.startDate ? addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1) : null);

/** Is the trip over (its last day is before today, or it was ended on the ride day)? Answer 4a: the debrief shows up the day after. */
export const isOver = (trip, today = iso(new Date())) => {
  if (trip?.finished) return true; // v0.20.1: "End trip and debrief" on the ride day
  const end = tripEnd(trip);
  return !!end && end < today;
};

/** Trips that still want a debrief (answer 1a: only trips packed in the app), newest first. */
export function toDebrief(trips, debriefs, today = iso(new Date())) {
  const done = new Set(debriefs.filter((d) => d.status === 'done').map((d) => d.tripId));
  return trips.filter((t) => !t.skipped && isOver(t, today) && !done.has(t.id) && t.entries?.length).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/** The next trip: the first one that has not ended yet. A trip marked "Not riding" (skipped) does not count. */
export function nextTrip(trips, today = iso(new Date())) {
  return [...trips].filter((t) => !t.skipped && !t.finished && t.startDate && tripEnd(t) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
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
  km: null,
  kmApplied: 0,
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
export function suggestions(debrief, trip, items, learnings = [], templates = [], history = []) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const out = [];
  const unusedIds = trip.entries.filter((e) => debrief.items[e.itemId] === 'unused').map((e) => e.itemId);
  const brokenIds = trip.entries.filter((e) => debrief.items[e.itemId] === 'broken').map((e) => e.itemId);
  const unused = unusedIds.map((id) => byId[id]).filter(Boolean);

  // Leave at home: warm-weather clothing gets a cold limit, standard items become optional.
  if (debrief.weather === 'warmer') {
    for (const i of unused.filter((x) => CLOTHING.includes(x.category) && typeof x.coldBelow !== 'number' && x.role !== 'worn'))
      out.push({ id: `cold:${i.id}`, group: 'home', label: t('{name}: only below {n} °C', { name: nameOf(i), n: WARM_LIMIT }), detail: t('Added by the layers when it gets cold, otherwise it stays at home.') });
  }
  // Answer 8b: only after the third trip without using it (this one counts).
  const before = unusedTimes(history, trip.id);
  for (const i of unused.filter((x) => x.role === 'standard' && !out.some((s) => s.id === `cold:${x.id}`) && (before[x.id] ?? 0) + 1 >= LEAVE_AFTER))
    out.push({ id: `optional:${i.id}`, group: 'home', label: t('{name}: leave at home', { name: nameOf(i) }), detail: t('Not used on {n} trips. Changes "Standard pack" to "Optional".', { n: (before[i.id] ?? 0) + 1 }) });

  // Wishlist: what was missing and is not in the gear yet, and what broke.
  for (const m of debrief.missing.filter((x) => !x.itemId))
    out.push({ id: `wish:${m.id}`, group: 'wish', label: t('{name} (missing)', { name: m.name }), detail: t('New wishlist item.') });
  for (const i of brokenIds.map((id) => byId[id]).filter(Boolean))
    out.push({ id: `broken:${i.id}`, group: 'wish', label: t('{name} (broken, replace)', { name: nameOf(i) }), detail: t('New wishlist item; the old one stays in your gear until you mark it gone.') });

  // Learnings: old ones that this trip confirms, and the sentence from step 1 as a new one.
  const touched = new Set([...unusedIds, ...debrief.missing.map((m) => m.itemId).filter(Boolean)]);
  for (const l of learnings.filter((x) => x.itemIds?.some((id) => touched.has(id))))
    out.push({ id: `confirm:${l.id}`, group: 'learn', label: t('Confirmed again: "{rule}"', { rule: short(l.rule) }), detail: l.confirmed ? t('Confirmed {n} times now.', { n: l.confirmed + 1 }) : t('First confirmation.') });
  if (debrief.note.trim()) out.push({ id: 'learn:note', group: 'learn', label: t('New: "{rule}"', { rule: short(debrief.note.trim()) }), detail: t('Saved as a learning from {trip}.', { trip: trip.title }) });
  // v0.19.2 (N10): the notes from the ride day can become learnings too.
  (debrief.rideNotes ?? []).forEach((n, i) => {
    if (n.text?.trim()) out.push({ id: `ride:${i}`, group: 'learn', label: t('From the ride: "{rule}"', { rule: short(n.text.trim()) }), detail: t('Saved as a learning from {trip}.', { trip: trip.title }) });
  });

  // Template: the trip was started from a template that still exists.
  const tpl = templates.find((t) => t.id === trip.templateId);
  const missingOwned = debrief.missing.filter((m) => m.itemId);
  if (tpl && (unusedIds.length || missingOwned.length))
    out.push({ id: `template:${tpl.id}`, group: 'template', label: t('Update "{name}"', { name: tpl.name }), detail: [unusedIds.length && t('{n} not used out', { n: unusedIds.length }), missingOwned.length && t('{n} missing in', { n: missingOwned.length })].filter(Boolean).join(', ') });
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
  let next = Math.max(0, ...learnings.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
  const learn = (rule, topic) => learnOut.push({ id: next++, topic, rule, action: '', itemIds: [], source: trip.title, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now });
  if (on.has('learn:note') && debrief.note.trim()) learn(debrief.note.trim(), 'Debrief');
  (debrief.rideNotes ?? []).forEach((n, i) => {
    if (on.has(`ride:${i}`) && n.text?.trim()) learn(n.text.trim(), 'Ride day');
  });

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

/**
 * Answer 7a: the km of the trip go onto the bike. Finishing again after a change only adds the
 * difference. Returns { km, kmApplied } for the bike and the debrief, or null when nothing changes.
 */
export function kmUpdate(bike, debrief) {
  const km = Math.max(0, Math.round(Number(debrief.km) || 0));
  const diff = km - (debrief.kmApplied ?? 0);
  if (!bike || !diff) return null;
  return { km: Math.max(0, (bike.km ?? 0) + diff), kmApplied: km };
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

/**
 * Answer 3a: one learning per item as a small hint while packing. The most important one that
 * names the item (priority, then how often it was confirmed). Returns { [itemId]: learning }.
 */
export function tipsByItem(learnings) {
  const out = {};
  const rank = (l) => (PRIO[l.priority] ?? 1) * 10 + Math.min(9, l.confirmed ?? 0);
  for (const l of learnings) {
    if (l.topic === 'Open question') continue;
    for (const id of l.itemIds ?? []) if (!out[id] || rank(l) > rank(out[id])) out[id] = l;
  }
  return out;
}

/** Items that are not owned yet but someone will want soon (for the Home gear card). */
export const wishCount = (items) => items.filter((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy').length;
export const unweighedCount = (items) => items.filter((i) => isInventory(i) && i.weightG == null).length;

/**
 * Gear that may be what you missed (v0.18.1, from the 303 demo). Items not on the trip whose name
 * (English or German) holds the thing itself, the last word of 4 or more letters ("warm GLOVES");
 * the other words rank them. Returns at most n items, best match first.
 */
export function similarItems(name, items, n = 4) {
  const words = name.toLowerCase().split(/[^a-zäöüéè0-9]+/).filter((w) => w.length >= 4);
  if (!words.length) return [];
  const stem = (w) => w.replace(/(es|s|n)$/, '');
  return items
    .map((i) => {
      const hay = `${i.name} ${i.nameDe ?? ''} ${i.brand ?? ''} ${i.model ?? ''}`.toLowerCase();
      // The last word is the thing itself ("warm GLOVES"), so it counts double.
      return { i, score: words.reduce((t, w, n) => t + (hay.includes(stem(w)) ? (n === words.length - 1 ? 2 : 1) : 0), 0) };
    })
    // Only items that match the thing itself (the last word): "warm gloves" never offers a warm gilet.
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || a.i.name.localeCompare(b.i.name))
    .slice(0, n)
    .map((x) => x.i);
}

/* ---------- templates learn from the debriefs (v0.19.0) ---------- */

/** From this many finished debriefs on, templates get suggestions. */
export const TEMPLATE_AFTER = 3;

/**
 * What your debriefs say about a template, once there are TEMPLATE_AFTER finished debriefs:
 * - out: an item of the template that was not used on its last 3 trips (any trip it went on);
 * - in:  an item you own that was missing on 2 trips or more and is not in the template.
 * Returns [{ id, kind: 'out' | 'in', itemId, name, why }], 'out' first. Nothing changes here.
 */
export function templateHints(tpl, trips, debriefs, items) {
  const done = debriefs.filter((d) => d.status === 'done');
  if (!tpl || done.length < TEMPLATE_AFTER) return [];
  const tripById = Object.fromEntries(trips.map((t) => [t.id, t]));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const rows = done
    .map((d) => ({ d, t: tripById[d.tripId] }))
    .filter((x) => x.t)
    .sort((a, b) => (b.t.startDate ?? '').localeCompare(a.t.startDate ?? ''));
  const out = [];
  const have = new Set(tpl.entries.map((e) => e.itemId));
  for (const itemId of have) {
    const on = rows.filter(({ t }) => t.entries.some((e) => e.itemId === itemId)).slice(0, LEAVE_AFTER);
    if (on.length >= LEAVE_AFTER && on.every(({ d }) => d.items?.[itemId] === 'unused') && byId[itemId])
      out.push({ id: `out:${itemId}`, kind: 'out', itemId, name: nameOf(byId[itemId]), why: t('Not used on {trips}.', { trips: on.map((x) => x.t.title).join(', ') }) });
  }
  const missing = {};
  for (const { d, t: tr } of rows) for (const m of d.missing ?? []) if (m.itemId && !have.has(m.itemId)) (missing[m.itemId] ??= []).push(tr.title);
  for (const [itemId, titles] of Object.entries(missing))
    if (titles.length >= 2 && byId[itemId] && byId[itemId].ownership !== 'gone') out.push({ id: `in:${itemId}`, kind: 'in', itemId, name: nameOf(byId[itemId]), why: t('Missing on {trips}.', { trips: titles.join(', ') }) });
  return out;
}

/** Apply one hint to a template: take the item out, or put it in its usual bag. */
export function applyTemplateHint(tpl, hint, items, now = new Date().toISOString()) {
  if (hint.kind === 'out') return { ...tpl, entries: tpl.entries.filter((e) => e.itemId !== hint.itemId), updatedAt: now };
  const item = items.find((i) => i.id === hint.itemId);
  return { ...tpl, entries: [...tpl.entries, { itemId: hint.itemId, slot: item?.defaultBag ?? 'seat', qty: 1 }], updatedAt: now };
}
