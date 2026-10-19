/**
 * Paket H «Packen leichter», answer 5 «5 a und b» (Noah 19.10.2026 12:09): a lending list for guests.
 * a) Choose the things for a guest and send the list as a link or a PDF, with a reminder on the
 *    return day (push kind 'lend', schedule.js);
 * b) the app remembers who has what: the item shows «with {person}» until it is back.
 *
 * The lends live in the settings table (key 'lends'), so backup and sync carry them. A person's name
 * is what the user typed; it never goes through t().
 *   { id, person, items: [{ itemId, qty, back? }], from, due, note, doneAt? }
 */
import { db as appDb } from './db.js';
import { localDay } from './localday.js';
import { daysUntil } from './supplies.js';

export const LENDS_KEY = 'lends';
/** A new lend comes back after this many days unless you choose another day. */
export const LEND_DAYS = 14;

export function addDaysTo(day, n) {
  const [y, m, d] = String(day).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export const isOpen = (l) => !l.doneAt && (l.items ?? []).some((x) => !x.back);
export const openItems = (l) => (l.items ?? []).filter((x) => !x.back);

/** 'late' | 'today' | 'soon' (within 2 days) | 'ok' | null (no return day). */
export function dueState(l, today = localDay()) {
  const d = daysUntil(l?.due, today);
  if (d == null) return null;
  if (d < 0) return 'late';
  if (d === 0) return 'today';
  if (d <= 2) return 'soon';
  return 'ok';
}

/** Open lends first (soonest return first), then the closed ones (newest first). */
export function sortLends(list = []) {
  const open = list.filter(isOpen).sort((a, b) => String(a.due ?? '9').localeCompare(String(b.due ?? '9')));
  const done = list.filter((l) => !isOpen(l)).sort((a, b) => String(b.doneAt ?? b.from).localeCompare(String(a.doneAt ?? a.from)));
  return [...open, ...done];
}

/** itemId → { person, due, lendId } for everything that is out now. */
export function lentOut(list = []) {
  const out = {};
  for (const l of list) if (isOpen(l)) for (const x of openItems(l)) out[x.itemId] = { person: l.person, due: l.due, lendId: l.id };
  return out;
}

/** A new lend (pure). */
export function newLend({ person, itemIds = [], due = null, note = '' }, today = localDay(), id = crypto.randomUUID()) {
  return { id, person: String(person ?? '').trim(), items: itemIds.map((itemId) => ({ itemId, qty: 1 })), from: today, due: due || addDaysTo(today, LEND_DAYS), note: String(note ?? '').trim() };
}

/** One thing is back (or all of them, itemId null); the lend closes when nothing is out. */
export function markBack(l, itemId = null, today = localDay()) {
  const items = (l.items ?? []).map((x) => (itemId == null || x.itemId === itemId ? { ...x, back: true } : x));
  const next = { ...l, items };
  if (items.every((x) => x.back)) next.doneAt = today;
  return next;
}

/** Undo «back». */
export function markOut(l, itemId = null) {
  const items = (l.items ?? []).map((x) => (itemId == null || x.itemId === itemId ? { ...x, back: false } : x));
  const { doneAt, ...rest } = l;
  return { ...rest, items };
}

/** The share link payload (the format of share.js, read by the page #/share/…): one group of names. */
export function lendPayload(l, itemsById = {}, nameOf = (i) => i.name, title = '') {
  return {
    v: 1,
    t: title || l.person,
    d: l.due ?? null,
    n: 1,
    b: null,
    w: (l.items ?? []).reduce((s, x) => s + (itemsById[x.itemId]?.weightG ?? 0) * (x.qty || 1), 0),
    g: [[l.person, (l.items ?? []).map((x) => [itemsById[x.itemId] ? nameOf(itemsById[x.itemId]) : x.itemId, x.qty || 1, itemsById[x.itemId]?.weightG == null ? null : itemsById[x.itemId].weightG * (x.qty || 1)])]],
  };
}

/** The list as text (for messages and the PDF). texts: { head, back, note } already translated. */
export function lendLines(l, itemsById = {}, nameOf = (i) => i.name, texts = {}) {
  return [texts.head ?? l.person, ...(l.items ?? []).map((x) => `• ${itemsById[x.itemId] ? nameOf(itemsById[x.itemId]) : x.itemId}${x.qty > 1 ? ` × ${x.qty}` : ''}`), ...(texts.back ? ['', texts.back] : []), ...(l.note ? ['', l.note] : [])];
}

/* ---------- storage ---------- */

export async function listLends(db = appDb) {
  const row = await db.settings.get(LENDS_KEY);
  return sortLends(Array.isArray(row?.value) ? row.value : []);
}

export const saveLends = (list, db = appDb) => db.settings.put({ key: LENDS_KEY, value: list });

/** Replace one lend (or add it) and return the list before, for Undo. */
export async function putLend(l, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const before = (await db.settings.get(LENDS_KEY))?.value ?? [];
    const list = Array.isArray(before) ? before : [];
    await saveLends(list.some((x) => x.id === l.id) ? list.map((x) => (x.id === l.id ? l : x)) : [...list, l], db);
    return list;
  });
}

export async function removeLends(ids, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const before = (await db.settings.get(LENDS_KEY))?.value ?? [];
    const list = Array.isArray(before) ? before : [];
    await saveLends(list.filter((x) => !ids.includes(x.id)), db);
    return list;
  });
}
