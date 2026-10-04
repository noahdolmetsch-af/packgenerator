import { DATA_TABLES, SCHEMA_VERSION } from './db.js';

/**
 * Backup files: the whole app as one JSON file.
 *
 * The same format is used for
 * - "Export" / "Import" (moving data between desktop and phone),
 * - the automatic folder backup on the desktop,
 * - the one-time Excel import (the converter writes this format).
 */

export const APP_ID = 'pack-generator';

/** Read every data table and build the backup object. */
export async function buildBackup(db) {
  const tables = {};
  for (const name of DATA_TABLES) tables[name] = await db.table(name).toArray();
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables };
}

/**
 * Check that a parsed file is a backup we can read.
 * Returns a list of problems; an empty list means the file is fine.
 */
export function validateBackup(data) {
  const problems = [];
  if (!data || typeof data !== 'object') return ['The file is not a JSON object.'];
  if (data.app !== APP_ID) problems.push('This is not a Pack Generator backup file.');
  if (typeof data.schemaVersion !== 'number') problems.push('The file has no schema version.');
  else if (data.schemaVersion > SCHEMA_VERSION)
    problems.push('The file comes from a newer version of the app. Update the app first.');
  if (!data.tables || typeof data.tables !== 'object') problems.push('The file has no tables.');
  else
    for (const [name, rows] of Object.entries(data.tables)) {
      if (!DATA_TABLES.includes(name)) problems.push(`Unknown table "${name}".`);
      else if (!Array.isArray(rows)) problems.push(`Table "${name}" is not a list.`);
    }
  return problems;
}

/** Count records per table, e.g. to show what a file contains before importing. */
export function countRows(data) {
  return Object.fromEntries(DATA_TABLES.map((t) => [t, data.tables?.[t]?.length ?? 0]));
}

/**
 * Write a backup into the database.
 *
 * mode "replace": the file becomes the only data (everything else is deleted).
 * mode "merge":   records from the file are added; a record with the same ID
 *                 is overwritten by the file, all other records stay.
 *
 * Everything runs in one transaction: if anything fails, nothing changes.
 */
export async function restoreBackup(db, data, mode = 'replace') {
  const problems = validateBackup(data);
  if (problems.length) throw new Error(problems.join(' '));
  const tables = DATA_TABLES.map((t) => db.table(t));
  await db.transaction('rw', tables, async () => {
    for (const name of DATA_TABLES) {
      const table = db.table(name);
      if (mode === 'replace') await table.clear();
      const rows = data.tables[name] ?? [];
      if (rows.length) await table.bulkPut(rows);
    }
  });
}

/** File name for a backup, e.g. "pack-generator-2026-10-04.json". */
export function backupFileName(date = new Date()) {
  return `${APP_ID}-${date.toISOString().slice(0, 10)}.json`;
}
