/**
 * Quick note (v0.19.3, Noah 4.10.2026, answers 1a-5b): write down a problem or idea from any
 * page in a few seconds, sort it later on the Inbox page.
 *   note = { id, at, text, photo, page, tripId, bikeId, status: 'open' | 'sorted', to, sortedAt }
 *   to   = { kind: 'repair' | 'wish' | 'learning' | 'trip' | 'done', label, ref }
 * Sorted notes stay as a list "All notes" (5b). Pure functions; the page writes the records.
 */

/** Where a note was written, for the Inbox. */
export const PAGE_NAMES = { home: 'Start page', gear: 'Gear', pack: 'Pack', templates: 'Templates', ride: 'Ride day', bikes: 'Bikes', care: 'Bike care', debrief: 'Debrief', inbox: 'Inbox', share: 'Shared list' };

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
export function newNote({ text, photo = null, page = '', tripId = null, bikeId = null }, { id, now = new Date().toISOString() } = {}) {
  return { id, at: now, text: text.trim(), photo, page, tripId, bikeId, status: 'open', to: null, sortedAt: null };
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
