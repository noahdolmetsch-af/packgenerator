/**
 * «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): while a delete of the user runs (deleteWithUndo, ui/ask.js), the rows that go are kept.
 * Dexie tells every table's «deleting» hook the row before it goes; this file listens on all data tables and, only while a window
 * is open, notes the rows in it. Outside a window nothing is noted (a sync, an import or a clean-up deletes quietly as before).
 * No import of the database here (db.js calls watchDeletes while it builds itself).
 */
let current = null; // the open window: { rows: [{ t, key, row }] }

/** Tables the window never notes: the trash itself, the settings (no data of the user), notes (they have their own trash). */
const SKIP = new Set(['trash', 'settings']);
/** A row of a note (its files, versions and trash row live in docs with a noteId): the notes keep their own trash. */
const ownTrash = (t, row) => t === 'notes' || (t === 'docs' && !!row?.noteId);

/** Opens a window; null when one is open already (a nested delete is part of the outer one). */
export function begin() {
  if (current) return null;
  current = { rows: [] };
  return current;
}

/** Closes the window `w` and returns the rows it noted (nothing for a null window). */
export function end(w) {
  if (!w) return [];
  if (current === w) current = null;
  return w.rows;
}

/** Listen on the deleting hook of every data table (db.js, once). */
export function watchDeletes(db, tables) {
  for (const name of tables) {
    if (SKIP.has(name)) continue;
    db.table(name).hook('deleting', (key, row) => {
      if (current && row && !ownTrash(name, row)) current.rows.push({ t: name, key, row });
    });
  }
}
