import { DATA_TABLES, SCHEMA_VERSION } from './db.js';
import { t } from './i18n.svelte.js';

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
  if (!data || typeof data !== 'object') return [t('The file is not a JSON object.')];
  if (data.app !== APP_ID) problems.push(t('This is not a Pack Generator backup file.'));
  if (typeof data.schemaVersion !== 'number') problems.push(t('The file has no schema version.'));
  else if (data.schemaVersion > SCHEMA_VERSION)
    problems.push(t('The file comes from a newer version of the app. Update the app first.'));
  if (!data.tables || typeof data.tables !== 'object') problems.push(t('The file has no tables.'));
  else
    for (const [name, rows] of Object.entries(data.tables)) {
      if (!DATA_TABLES.includes(name)) problems.push(t('Unknown table "{name}".', { name }));
      else if (!Array.isArray(rows)) problems.push(t('Table "{name}" is not a list.', { name }));
    }
  return problems;
}

/** Count records per table, e.g. to show what a file contains before importing. */
export function countRows(data) {
  return Object.fromEntries(DATA_TABLES.map((t) => [t, data.tables?.[t]?.length ?? 0]));
}

/** The field that identifies a record in each table (see db.js); "id" when not listed. */
export const KEY_OF = { debriefs: 'tripId', settings: 'key' };

/**
 * v0.27.0 (Noah 1a, AP22): what an import would do, shown BEFORE it runs.
 * existing: { table: [keys of the records on this device] }.
 * Returns {
 *   now:  records on this device, file: records in the file,
 *   lost: records only on this device ("Replace all data" deletes them),
 *   same: records with an ID in both (the file's version wins in both modes),
 *   added: records only in the file,
 *   nowTrips, lostTrips: the same for trips, the records that matter most.
 * }
 */
export function importImpact(data, existing) {
  const out = { now: 0, file: 0, lost: 0, same: 0, added: 0, nowTrips: 0, lostTrips: 0 };
  for (const name of DATA_TABLES) {
    const mine = new Set(existing?.[name] ?? []);
    const key = KEY_OF[name] ?? 'id';
    const theirs = new Set((data?.tables?.[name] ?? []).map((r) => r?.[key]));
    let same = 0;
    for (const k of theirs) if (mine.has(k)) same++;
    out.now += mine.size;
    out.file += theirs.size;
    out.same += same;
    out.added += theirs.size - same;
    out.lost += mine.size - same;
    if (name === 'trips') (out.nowTrips = mine.size), (out.lostTrips = mine.size - same);
  }
  return out;
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
  // v0.21.0 (answer 4a, the phone leads): remember where a full replace came from, so the desktop
  // can say "data from the phone backup of …". Not exported.
  if (mode === 'replace') await db.table('meta').put({ key: LAST_IMPORT, at: new Date().toISOString(), from: data.exportedAt ?? null });
}

/** Key in the "meta" table: the last "Replace all data" import (when, and the backup's date). */
export const LAST_IMPORT = 'lastImport';

/** File name for a backup, e.g. "pack-generator-2026-10-04.json". */
export function backupFileName(date = new Date()) {
  return `${APP_ID}-${date.toISOString().slice(0, 10)}.json`;
}

/* ---------- backup reminder (Noah, 4.10.2026, answer 10a) ---------- */

/** Key in the "meta" table: when the last backup file was downloaded. Never exported. */
export const LAST_BACKUP = 'lastBackup';
/** Home reminds you when the last backup is older than this. */
export const BACKUP_DAYS = 14;

/** Download the whole app as one file and remember when. */
export async function downloadBackup(db) {
  const data = await buildBackup(db);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = backupFileName();
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  await db.table('meta').put({ key: LAST_BACKUP, at: new Date().toISOString() });
}

/**
 * Is a backup due? lastIso: the newest of the downloaded file and the folder backup (or null).
 * Returns { due, days } (days since the last backup, null if never).
 */
export function backupDue(lastIso, now = new Date(), limit = BACKUP_DAYS) {
  if (!lastIso) return { due: true, days: null };
  const days = Math.floor((now - new Date(lastIso)) / 864e5);
  return { due: days >= limit, days };
}
