/**
 * «Verbesserungs-Logbuch»: the database side. One table `logbuch` (db.js version 20): it goes into every backup,
 * never into the automatic sync (db.js syncLocal) because the photos are big and the notes belong to this device.
 * Pure rules are in logbuch.js.
 */
import { db } from '../db.js';
import { makeEntry, changeEntry } from './logbuch.js';

/** Make and keep an entry. Returns the entry, or null when kind or text are missing (nothing is stored). */
export async function addEntry(input, database = db) {
  const entry = makeEntry(input);
  if (!entry) return null;
  await database.logbuch.put(entry);
  return entry;
}

/** Change an entry; returns the new entry (null when it does not exist any more). */
export async function updateEntry(id, patch, database = db) {
  const old = await database.logbuch.get(id);
  if (!old) return null;
  const next = changeEntry(old, patch);
  await database.logbuch.put(next);
  return next;
}

/** Delete; returns the row for Undo. */
export async function removeEntry(id, database = db) {
  const old = await database.logbuch.get(id);
  await database.logbuch.delete(id);
  return old ?? null;
}

/** Undo of a delete. */
export async function restoreEntry(entry, database = db) {
  if (entry) await database.logbuch.put(entry);
}

/**
 * For the silent error reporter of the device (thread «Prüfungen», Noah 21.11.2026): a caught error becomes ONE entry of the kind
 * «Fehler» with source 'auto'. The same error on the same page only counts up (count, time of the last one), so the list never
 * floods; at most `max` automatic entries are kept (the oldest finished ones go first). Returns the entry.
 */
export async function addAutoError({ message, page = '', device, width, now = new Date(), max = 50 }, database = db) {
  const text = String(message ?? '').trim().slice(0, 300);
  if (!text) return null;
  const same = (await database.logbuch.where('art').equals('fehler').toArray()).find((e) => e.source === 'auto' && e.text === text && e.page === page && e.state !== 'done');
  if (same) {
    const next = { ...same, count: (same.count ?? 1) + 1, at: now.toISOString() };
    await database.logbuch.put(next);
    return next;
  }
  const entry = await addEntry({ art: 'fehler', urgent: 'later', text, page, device, width, now, source: 'auto' }, database);
  const autos = (await database.logbuch.where('art').equals('fehler').toArray()).filter((e) => e.source === 'auto').sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const extra = autos.length - max;
  if (extra > 0) await database.logbuch.bulkDelete(autos.slice(0, extra).map((e) => e.id));
  return entry;
}
