/**
 * «Fürs nächste Mal» › «In Packliste übernehmen» (Noah 05.11.2026 «8b»): the notes of the page (proven,
 * just came along, missing) go onto the packing list of the next trip with one tap.
 *   proven / missing, a known item   → on the list (nothing happens when it is already there)
 *   missing, only a name             → a new item (the one with the same name is used when it exists)
 *   «just came along», on the list   → a planning note «Leave X at home next time»: nothing is taken off
 * Everything is a suggestion: the trip keeps its list, the planning notes can be turned into something
 * or deleted, and the toast offers Undo (undoTakeOver).
 */
import { addEntries, touched } from '../trips.js';
import { hasBike } from '../domains.js';
import { tripSlot } from '../sets.js';
import { planItem, addPlanNote, planNotesOf } from '../plannotes.js';
import { markLine } from '../frei.js';

const itemIdOf = (m) => (String(m?.key ?? '').startsWith('item:') ? String(m.key).slice(5) : null);
const lc = (s) => String(s ?? '').trim().toLowerCase();

/** Where a thing goes on this trip: its usual bag with a bike, else the first pack (as the planning notes do). */
const slotOf = (trip, item) => (hasBike(trip) ? tripSlot(item, trip.setup) : (trip.packs?.[0]?.key ?? 'body'));

/** The words of the planning note for a «just came along» mark. tr: t(), reason: the optional reason. */
export const leaveText = (m, tr) => [tr(markLine('unused'), { name: m.name }), m.reason].filter(Boolean).join(' – ');

/**
 * What taking `marks` over to `trip` changes. Pure.
 * → { entries, planNotes, newItems, added: [name], noted: [name], already: [name] }
 */
export function takeOver({ marks = [], trip, items = [], now = new Date().toISOString(), tr = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '') }) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const pool = [...items];
  const newItems = [];
  let entries = trip.entries ?? [];
  let planNotes = planNotesOf(trip);
  const added = [];
  const noted = [];
  const already = [];
  for (const m of marks) {
    const id = itemIdOf(m);
    const known = id ? byId.get(id) : null;
    const onTrip = (itemId) => entries.some((e) => e.itemId === itemId);
    if (m.pile === 'unused') {
      if (!known || !onTrip(known.id)) { already.push(m.name); continue; }
      const text = leaveText(m, tr);
      if (planNotes.some((n) => n.text === text)) { already.push(m.name); continue; }
      planNotes = addPlanNote(planNotes, text, new Date(now));
      noted.push(m.name);
      continue;
    }
    let item = known;
    if (!item) {
      // only a name (or the item was deleted since): the item of that name, else a new one
      item = pool.find((i) => lc(i.name) === lc(m.name) && i.ownership !== 'gone');
      if (!item) {
        item = { ...planItem({ text: m.name, at: now }, trip, pool, now), note: tr('From «For next time» ({day})', { day: now.slice(0, 10) }) };
        pool.push(item);
        newItems.push(item);
      }
    }
    if (onTrip(item.id)) { already.push(m.name); continue; }
    entries = addEntries(entries, [item.id], slotOf(trip, item), { packed: false, src: 'next' });
    added.push(m.name);
  }
  return { entries, planNotes, newItems, added, noted, already };
}

/**
 * Writes it: one transaction over trips, items and the marks. marks: the rows of the table «frei».
 * → { result, undo } (undo puts the trip, the new items and the marks back as they were).
 */
export async function applyTakeOver(db, { tripId, marks, tr, now = new Date().toISOString() }) {
  return db.transaction('rw', db.trips, db.items, db.frei, async () => {
    const trip = await db.trips.get(tripId);
    if (!trip) return null;
    const items = await db.items.toArray();
    const result = takeOver({ marks, trip, items, now, tr });
    const before = { entries: trip.entries ?? [], planNotes: trip.planNotes, updatedAt: trip.updatedAt };
    const touchedAny = result.added.length || result.noted.length;
    if (touchedAny) {
      if (result.newItems.length) await db.items.bulkPut(result.newItems);
      await db.trips.update(tripId, touched({ entries: result.entries, planNotes: result.planNotes }, now));
    }
    // every mark that was looked at now says where it went (also «already there», so the page can show it)
    const oldMarks = marks.map((m) => ({ ...m }));
    await db.frei.bulkPut(marks.map((m) => ({ ...m, takenTo: tripId, takenAt: now })));
    const undo = async () => {
      await db.transaction('rw', db.trips, db.items, db.frei, async () => {
        if (touchedAny) await db.trips.update(tripId, { entries: before.entries, planNotes: before.planNotes ?? [], updatedAt: before.updatedAt });
        if (result.newItems.length) await db.items.bulkDelete(result.newItems.map((i) => i.id));
        await db.frei.bulkPut(oldMarks);
      });
    };
    return { result, undo };
  });
}
