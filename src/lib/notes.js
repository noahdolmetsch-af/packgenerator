/**
 * Quick note (v0.19.3, Noah 4.10.2026, answers 1a-5b): write down a problem or idea from any
 * page in a few seconds, sort it later on the Inbox page.
 *   note = { id, at, text, photo, page, tripId, bikeId, status: 'open' | 'sorted', to, sortedAt }
 *   to   = { kind: 'repair' | 'wish' | 'learning' | 'trip' | 'done', label, ref }
 * Sorted notes stay as a list "All notes" (5b). Pure functions; the page writes the records.
 * v0.26.1 (AP20, Noah 19 a+b): a note written while a trip is running (QuickNote, or "Note for the
 * debrief" on the Ride day page) also gets note.day (0-based day of the trip) next to note.tripId.
 * It stays in the Inbox, and the debrief shows it under "Notes on the way" (tripNotes).
 */
import { tripEnd } from './debrief.js';
import { dayIndex } from './ride.js';

/** Where a note was written, for the Inbox. */
export const PAGE_NAMES = { home: 'Start page', gear: 'Gear', pack: 'Pack', templates: 'Templates', ride: 'On the way', bikes: 'Bikes', care: 'Bike care', debrief: 'Debrief', inbox: 'Inbox', share: 'Shared list' };

export const KINDS = [
  { key: 'repair', name: 'Repair on a bike', where: 'Bike care' },
  { key: 'wish', name: 'Wishlist', where: 'Gear' },
  { key: 'learning', name: 'Learning', where: 'Debrief → Learnings' },
  { key: 'trip', name: 'Note for a trip', where: 'its debrief' },
  { key: 'done', name: 'Done, nothing to keep', where: 'All notes' },
];

const REPAIR = /\b(brake|brems|quietsch|squeak|creak|knarz|knack|chain|kette|shift|schalt|tyre|tire|reifen|pneu|puncture|platt|plattfuss|bearing|lager|spoke|speiche|wobble|seize|loose|lose|rattle|klapper|defekt|kaputt|broken|leak|leck|fork|gabel|shock|dämpfer|dropper|sattelstütze|cable|zug|bolt|schraube|rotor|scheibe|pads?|beläge|belag)\w*/i;
const WISH = /\b(buy|kaufen|kauf|bestellen|order|need|brauche|braucht|wishlist|wunsch|fehlt|fehlte|missing|missed|vergessen|forgot|ersetzen|replace|neue?s?n?)\b/i;
const LEARN = /\b(next time|nächstes mal|naechstes mal|immer|always|never|nie|lesson|lektion|lernen|learned|merken|tipp|tip)\b/i;

/** A new note with what the app knows about the moment (answer: date, page, next trip, bike). */
export function newNote({ text, photo = null, page = '', tripId = null, bikeId = null, day = null }, { id, now = new Date().toISOString() } = {}) {
  return { id, at: now, text: text.trim(), photo, page, tripId, bikeId, ...(day != null ? { day } : {}), status: 'open', to: null, sortedAt: null };
}

/** v0.26.1 (Noah 19a): the trip running today (start ≤ today ≤ last day, not ended, not skipped), or null. */
export function runningTrip(trips, today) {
  return [...trips].filter((t) => !t.skipped && !t.finished && t.startDate && t.startDate <= today && tripEnd(t) >= today).sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null;
}

/** v0.26.1 (Noah 19a): trip and day for a note written now: { tripId, day } while a trip runs, else null. */
export function rideContext(trips, today) {
  const trip = runningTrip(trips, today);
  return trip ? { tripId: trip.id, day: dayIndex(trip, today) } : null;
}

/**
 * v0.26.1 (Noah 19b): the notes on the way of one trip, for the Ride day page and the debrief:
 * the older notes stored in the debrief (debrief.rideNotes) and the notes with this trip and a
 * day (notes table). A note sorted from the Inbox onto the trip is in both: shown once.
 * → [{ key, at, day, text, noteId? }] oldest first; key is the suggestion id ("ride:…").
 */
export function tripNotes(debrief, notes, tripId) {
  const old = (debrief?.rideNotes ?? []).map((n, i) => ({ key: `ride:${i}`, at: n.at, day: n.day ?? 0, text: n.text }));
  const seen = new Set(old.map((n) => `${n.at}|${n.text}`));
  const fresh = notes
    .filter((n) => n.tripId === tripId && n.day != null && !seen.has(`${n.at}|${n.text}`))
    .map((n) => ({ key: `ride:${n.id}`, at: n.at, day: n.day, text: n.text, noteId: n.id, ...(n.debrief?.kind ? { kind: n.debrief.kind, itemId: n.debrief.itemId ?? null } : {}) }));
  return [...old, ...fresh].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));
}

/** The bike a note talks about: a bike name or kind in the text, else the note's own bike. */
export function guessBike(text, bikes, fallback = null) {
  const t = text.toLowerCase();
  const words = (b) => [b.name, ...(b.name ?? '').split(/\s+/), b.kind, b.id, ...(b.aliases ?? [])].filter((w) => w && w.length >= 4).map((w) => w.toLowerCase());
  const extra = { 'scott-hardtail': ['hardtail', 'scale'], fully: ['fully', 'spark'], 'factor-ls': ['factor', 'gravel'], 'canyon-world-cup': ['canyon', 'lux'] };
  const hit = bikes.find((b) => [...words(b), ...(extra[b.id] ?? [])].some((w) => t.includes(w)));
  return hit?.id ?? fallback;
}

/** Where a note probably belongs, for the first button on the Inbox page. */
export function guessKind(note) {
  if (REPAIR.test(note.text)) return 'repair';
  if (LEARN.test(note.text)) return 'learning';
  if (WISH.test(note.text)) return 'wish';
  if (note.tripId) return 'trip';
  return 'learning';
}

/**
 * The records to write when a note is sorted. Returns { note, repair?, item?, learning?, tripNote? }.
 * ids: { task, item, learning } the next free ids (the page finds them).
 */
export function sortNote(note, kind, { bikeId = null, tripId = null, ids = {}, now = new Date().toISOString(), bikeName = '' } = {}) {
  const out = {};
  const short = note.text.length > 60 ? `${note.text.slice(0, 59)}…` : note.text;
  if (kind === 'repair') {
    out.repair = { id: ids.task, area: 'Bike', bikeId, subject: bikeName, task: note.text, category: 'Repair', source: 'Quick note', logDate: note.at.slice(0, 10), leadWeeks: null, priority: 'medium', status: 'open', note: '', done: false, photo: note.photo ?? null };
  }
  if (kind === 'wish') {
    out.item = {
      id: ids.item, name: short, brand: '', model: '', category: 'lux', weightG: null, qty: 1, weightStatus: 'missing', carry: 'luggage', defaultBag: null,
      ownership: 'wishlist', role: null, sets: [], kits: [], domains: ['bikepacking'], note: `From a quick note (${note.at.slice(0, 10)}): ${note.text}`, updatedAt: now,
    };
  }
  if (kind === 'learning') {
    out.learning = { id: ids.learning, topic: 'Quick note', rule: note.text, action: '', itemIds: [], source: `Quick note ${note.at.slice(0, 10)}`, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now };
  }
  if (kind === 'trip') out.tripNote = { tripId, text: note.text, at: note.at };
  const label = { repair: `Repair${bikeName ? ` · ${bikeName}` : ''}`, wish: 'Wishlist', learning: 'Learning', trip: 'Trip note', done: 'Done' }[kind];
  const ref = out.repair?.id ?? out.item?.id ?? out.learning?.id ?? (kind === 'trip' ? tripId : null);
  out.note = { ...note, status: 'sorted', to: { kind, label, ref }, sortedAt: now };
  return out;
}

/** Next free number id in a table (maintenance and learnings use numbers). */
export const nextNumber = (rows) => Math.max(0, ...rows.map((r) => (typeof r.id === 'number' ? r.id : 0))) + 1;

/**
 * v0.29.0 (Noah 8a): the quick notes on the way that go straight into the debrief:
 * "Was missing" (debrief.missing), "Not needed" (items[id] = 'unused'), "Broken" (items[id] = 'broken').
 * The note keeps { kind, itemId, name } in note.debrief and stays in the Inbox like every note.
 */
export const DEBRIEF_KINDS = [
  { key: 'missing', name: 'Was missing' },
  { key: 'unused', name: 'Not needed' },
  { key: 'broken', name: 'Broken' },
];

/**
 * The debrief with one quick note in it (a copy). A missing thing is added once (by the note's id);
 * an item's answer is only set when the debrief has none yet (an answer given by hand wins), and the
 * debrief remembers which note set it (itemNotes), so removing the note takes it out again.
 */
export function noteToDebrief(debrief, note) {
  const d = structuredClone(debrief);
  const k = note?.debrief;
  if (!k?.kind) return d;
  d.items ??= {};
  d.missing ??= [];
  if (k.kind === 'missing') {
    if (!d.missing.some((m) => m.noteId === note.id)) d.missing.push({ id: `n-${note.id}`, name: k.name ?? note.text, itemId: k.itemId ?? null, noteId: note.id });
  } else if (k.itemId && !d.items[k.itemId]) {
    d.items[k.itemId] = k.kind;
    d.itemNotes = { ...(d.itemNotes ?? {}), [k.itemId]: note.id };
  }
  return d;
}

/** The debrief without what one quick note put there (a copy); answers changed by hand stay. */
export function dropNoteFromDebrief(debrief, note) {
  const d = structuredClone(debrief);
  d.missing = (d.missing ?? []).filter((m) => m.noteId !== note.id);
  for (const [itemId, noteId] of Object.entries(d.itemNotes ?? {})) {
    if (noteId !== note.id) continue;
    if (d.items?.[itemId] === note.debrief?.kind) delete d.items[itemId];
    delete d.itemNotes[itemId];
  }
  return d;
}
