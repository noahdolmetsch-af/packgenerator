/**
 * v0.48.0 «Eingang»: the database side of filing an entry (inbox.js has the pure rules).
 * fileTo writes what fileNote / fileReceipt return in one transaction; unfile takes it back
 * (the entry is open again at its place). Both are used by the Eingang page and its sheet.
 */
import { db } from './db.js';
import { fileNote, fileReceipt } from './inbox.js';
import { nextNumber } from './notes.js';
import { nextId } from './gear.js';
import { addRideNote } from './ride.js';
import { addIdea } from './hubs.js';

const stamp = () => Date.now().toString(36);

/**
 * File one entry. kind: one of the 7 targets; opts as fileNote / fileReceipt take them
 * (bike, trip, topic, name, category, grams; for a receipt shop, date, chf, jobs).
 * Returns the stored note.
 */
export async function fileTo(note, kind, opts = {}) {
  const now = new Date().toISOString();
  let stored = null;
  await db.transaction('rw', db.notes, db.maintenance, db.items, db.bikes, db.visits, db.debriefs, db.trips, async () => {
    if (kind === 'receipt') {
      const { visit, note: n } = fileReceipt(note, opts, { id: `visit-${stamp()}`, now });
      await db.visits.put(visit);
      stored = n;
    } else {
      const ids = {
        task: nextNumber(await db.maintenance.toArray()),
        item: nextId(await db.items.toArray(), kind === 'material' ? opts.category ?? 'lux' : 'lux'),
        idea: `idea-${stamp()}`,
      };
      const out = fileNote(note, kind, { ...opts, ids, now });
      if (out.repair) await db.maintenance.put(out.repair);
      if (out.item) await db.items.put(out.item);
      if (out.idea) {
        const b = await db.bikes.get(out.idea.bikeId);
        if (!b) throw new Error('This bike is gone.');
        await db.bikes.update(b.id, { ideas: addIdea(b.ideas ?? [], out.idea.idea.text, { id: out.idea.idea.id, at: now }) });
      }
      if (out.tripNote) {
        const trip = await db.trips.get(out.tripNote.tripId);
        if (!trip) throw new Error('This trip is gone.');
        const debrief = await db.debriefs.get(trip.id);
        await db.debriefs.put(addRideNote(debrief ?? null, trip, note.text, note.day ?? 0, note.at));
      }
      stored = out.note;
    }
    await db.notes.put(stored);
  });
  return stored;
}

/** Take a filed entry back: what it wrote goes, the entry is open again. */
export async function unfile(note) {
  await db.transaction('rw', db.notes, db.maintenance, db.items, db.bikes, db.visits, db.debriefs, async () => {
    for (const m of note.to?.made ?? []) {
      if (m[0] === 'idea') {
        const b = await db.bikes.get(m[1]);
        if (b) await db.bikes.update(b.id, { ideas: (b.ideas ?? []).filter((x) => x.id !== m[2]) });
      } else if (m[0] === 'ride') {
        const d = await db.debriefs.get(m[1]);
        if (d) await db.debriefs.put({ ...d, rideNotes: (d.rideNotes ?? []).filter((r) => !(r.at === m[2] && r.text === note.text.trim())) });
      } else if (['maintenance', 'items', 'visits'].includes(m[0])) {
        await db.table(m[0]).delete(m[1]);
      }
    }
    const { topic: _topic, ...rest } = note;
    await db.notes.put({ ...rest, ...(note.to?.kind === 'keep' ? {} : note.topic ? { topic: note.topic } : {}), status: 'open', to: null, sortedAt: null });
  });
}
