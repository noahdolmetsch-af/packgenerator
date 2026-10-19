/**
 * Planungs-Notizen (IS 246–249, promised for the Touren package on 12.10.2026; Noah «1-3 erarbeiten»
 * 15.10.2026): short notes on a planned trip («Sonnencreme kaufen», «Bremsbeläge prüfen lassen»).
 * Each note can become something («Daraus wird …»): a task in the ready check or in the evening
 * check, an item on the packing list, a workshop job before the start, or a row in the standard
 * ready check of all trips of this kind. After the trip the debrief asks «Hat es geholfen?» and
 * a note can become a learning. Everything stays a suggestion: a note can also stay a note.
 *
 * Stored on the trip: planNotes [{ id, text, at, made: { kind, ref } | null, helped: true | false | null }].
 * Pure functions here; the writes are in PlanNotesCard.svelte and DebriefPlanNotes.svelte.
 */
import { localDay } from './localday.js';
import { nextId } from './gear.js';
import { domainOf } from './domains.js';

/** What a note can become, in the order of the menu. */
export const MADE = [
  { kind: 'ready', label: 'A task in the ready check' },
  { kind: 'eve', label: 'A task for the evening before' },
  { kind: 'item', label: 'An item on the packing list' },
  { kind: 'repair', label: 'A workshop job before the trip' },
  { kind: 'all', label: 'A ready check row for all trips of this kind' },
];
/** The short words shown under a note once it became something. */
export const MADE_WORD = { ready: 'In the ready check', eve: 'In the evening check', item: 'On the packing list', repair: 'In bike care', all: 'In the ready check of all trips of this kind' };

/** Examples to tap while the list is empty (Noah's content round 15.10.2026); English keys for t(). */
export const EXAMPLES = ['Buy sunscreen', 'Have the brake pads checked', 'Confirm the accommodation', 'Train ticket for the way back', 'Load the route onto the Garmin', 'Charge the power bank'];

export const planNotesOf =(trip) => (Array.isArray(trip?.planNotes) ? trip.planNotes : []);

/** Add a note at the end; empty words add nothing. */
export function addPlanNote(list, text, now = new Date()) {
  const words = String(text ?? '').trim();
  if (!words) return list;
  // the time plus a counter: two notes in the same millisecond (or under a fixed clock) stay apart
  let id = `pn-${now.getTime().toString(36)}`;
  for (let n = 1; list.some((x) => x.id === id); n++) id = `pn-${now.getTime().toString(36)}-${n}`;
  return [...list, { id, text: words, at: now.toISOString(), made: null, helped: null }];
}

export const removePlanNote = (list, id) => list.filter((n) => n.id !== id);
export const setMade = (list, id, made) => list.map((n) => (n.id === id ? { ...n, made } : n));
/** «Hat es geholfen?»: a second tap on the same answer takes it back. */
export const setHelped = (list, id, helped) => list.map((n) => (n.id === id ? { ...n, helped: n.helped === helped ? null : helped } : n));

/** The id of the check row a note makes, so a second tap does not add it twice. */
export const rowId = (note) => `plan-${note.id}`;

/** A check list (ready or evening) with the note as its own row at the end, once. */
export function withTask(list, note) {
  if (list.some((r) => r.id === rowId(note) || r.label.toLowerCase() === note.text.toLowerCase())) return list;
  return [...list, { id: rowId(note), label: note.text, done: false }];
}

/** The standard ready check of the area with the note as a row (base = the saved standard or the suggestion). */
export function withStandard(standard, fallback, note, now = Date.now()) {
  const base = (standard?.length ? standard : fallback).map((r) => ({ id: r.id, label: r.label }));
  if (base.some((r) => r.label.toLowerCase() === note.text.toLowerCase())) return base;
  return [...base, { id: `std-plan-${now.toString(36)}`, label: note.text }];
}

/** An item still to be completed (no weight yet), owned, in the trip's area. */
export function planItem(note, trip, items, now = new Date().toISOString()) {
  const name = note.text.length > 60 ? `${note.text.slice(0, 59)}…` : note.text;
  return {
    id: nextId(items, 'lux'), name, brand: '', model: '', category: 'lux', weightG: null, qty: 1, weightStatus: 'missing', carry: 'luggage', defaultBag: null,
    ownership: 'owned', role: null, sets: [], domains: [domainOf(trip)], note: `From a planning note (${note.at.slice(0, 10)}): ${note.text}`, updatedAt: now,
  };
}

/** The day before the start (calendar days), the due date of a workshop job; today when the start is gone or unknown. */
export function dayBefore(startDate, today = localDay()) {
  if (!startDate) return today;
  const [y, m, d] = startDate.split('-').map(Number);
  const out = localDay(new Date(y, m - 1, d - 1, 12));
  return out < today ? today : out;
}

/** A workshop job (an open repair) due the day before the trip, for its bike. */
export function planRepair(note, trip, { id, bike = null, today = localDay() } = {}) {
  return {
    id, area: 'Bike', bikeId: bike?.id ?? trip.bikeId ?? null, subject: bike?.name ?? trip.bike ?? '', task: note.text, category: 'Repair', source: 'Planning note',
    logDate: today, leadWeeks: null, priority: 'medium', status: 'open', note: '', done: false, photo: null, dueDate: dayBefore(trip.startDate, today), beforeRide: false, tripId: trip.id,
  };
}

/** A learning from a note that helped (the debrief.js shape; numbers as ids). */
export function planLearning(note, trip, learnings, now = new Date().toISOString()) {
  const id = Math.max(0, ...learnings.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
  return { id, topic: 'Planning', rule: note.text, action: '', itemIds: note.made?.kind === 'item' && note.made.ref ? [note.made.ref] : [], source: trip.title, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now };
}
