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

/**
 * v0.45.1 (G015a): settings records that are the app's own memory on this device, not the user's data
 * ("tip of the day" shown and tapped). They never go into a backup, so two backups without a change
 * are the same; an older backup that still has them imports fine and the device keeps its own.
 * v0.77.0 (KI-Helfer): "helper" (the Helfer-Code, the switch and the monthly limit) stays on this
 * device: the code is a key and never travels in an export, a backup file or the folder backup.
 */
export const DEVICE_SETTINGS = ['tips', 'helper'];
const deviceOnly = (name, row) => name === 'settings' && DEVICE_SETTINGS.includes(row?.key);

/** Read every data table and build the backup object. */
export async function buildBackup(db) {
  const tables = {};
  for (const name of DATA_TABLES) tables[name] = (await db.table(name).toArray()).filter((r) => !deviceOnly(name, r));
  // v0.34.0 (L10): when the data in this file last changed, so the other device can say "newer" or "older".
  const lastChange = await lastChangeOf(db);
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...(lastChange ? { lastChange } : {}), tables };
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
export const KEY_OF = { debriefs: 'tripId', settings: 'key', flowChecks: 'day' };

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
    // G015a: the device's own memory is neither lost nor taken over by an import
    const own = (k) => name === 'settings' && DEVICE_SETTINGS.includes(k);
    const mine = new Set((existing?.[name] ?? []).filter((k) => !own(k)));
    const key = KEY_OF[name] ?? 'id';
    const theirs = new Set((data?.tables?.[name] ?? []).map((r) => r?.[key]).filter((k) => !own(k)));
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
      if (mode === 'replace') {
        // G015a: the device's own memory stays, whatever the file holds
        const keep = name === 'settings' ? (await table.toArray()).filter((r) => deviceOnly(name, r)) : [];
        await table.clear();
        if (keep.length) await table.bulkPut(keep);
      }
      const rows = (data.tables[name] ?? []).filter((r) => !deviceOnly(name, r));
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
  saveFile(JSON.stringify(data, null, 2));
  await db.table('meta').put({ key: LAST_BACKUP, at: new Date().toISOString() });
}

function saveFile(text, name = backupFileName()) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- v0.34.0 (L10, Noah a): computer and phone ---------- */

/**
 * The files a share can carry: the backup as .json, and the same text as .txt, because Android's
 * share sheet does not take every file type (a JSON file is refused on some phones, plain text is
 * not). Import reads both: the content is the same.
 */
export function shareFiles(text, name = backupFileName(), FileClass = globalThis.File) {
  if (typeof FileClass !== 'function') return [];
  return [new FileClass([text], name, { type: 'application/json' }), new FileClass([text], name.replace(/\.json$/, '.txt'), { type: 'text/plain' })];
}

/**
 * "Send to phone": the backup file, offered to the share sheet when the device can share files
 * (Android, also Chrome and Safari on many computers), else downloaded as before. No server, no account.
 * Returns 'shared', 'downloaded' or 'cancelled' (the share sheet was closed: nothing is recorded).
 */
export async function shareBackup(db, nav = globalThis.navigator) {
  const data = await buildBackup(db);
  const text = JSON.stringify(data, null, 2);
  const file = shareFiles(text).find((f) => nav?.canShare?.({ files: [f] }));
  if (file) {
    try {
      await nav.share({ files: [file], title: file.name });
      await db.table('meta').put({ key: LAST_BACKUP, at: new Date().toISOString() });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Sharing failed for another reason: the download still gets the file out.
    }
  }
  saveFile(text);
  await db.table('meta').put({ key: LAST_BACKUP, at: new Date().toISOString() });
  return 'downloaded';
}

/** Key in the "meta" table: when the data on this device last changed ({ at }). Never exported as a record. */
export const LAST_CHANGE = 'lastChange';
const timers = new WeakMap(); // db → { timer, at } of a change not written yet

/** The time of the last change on this device (ISO), with a change still waiting written first. */
export async function lastChangeOf(db) {
  await flushChanges(db);
  return (await db.table('meta').get(LAST_CHANGE))?.at ?? null;
}

/** Write a waiting change mark now. */
export async function flushChanges(db) {
  const w = timers.get(db);
  if (!w) return;
  clearTimeout(w.timer);
  timers.delete(db);
  await db.table('meta').put({ key: LAST_CHANGE, at: w.at });
}

/**
 * Remember the time of every save: Dexie calls the hooks on every create, update and delete in the
 * data tables. The mark is written a moment later (once for a burst of saves), outside the save itself.
 */
export function trackChanges(db, wait = 300) {
  const mark = () => {
    const w = timers.get(db);
    if (w) clearTimeout(w.timer);
    const at = new Date().toISOString();
    timers.set(db, { at, timer: setTimeout(() => flushChanges(db).catch(() => {}), wait) });
  };
  for (const name of DATA_TABLES) {
    const table = db.table(name);
    // G015a: the device's own memory (the tips shown) is no change of the data (hooks return nothing:
    // Dexie takes a creating hook's return value as the key)
    const skip = (key) => name === 'settings' && DEVICE_SETTINGS.includes(key);
    table.hook('creating', (key) => {
      if (!skip(key)) mark();
    });
    table.hook('updating', (mods, key) => {
      if (!skip(key)) mark();
    });
    table.hook('deleting', (key) => {
      if (!skip(key)) mark();
    });
  }
}

/**
 * After an import: "Replace all data" makes this device hold the file's state, so the device takes
 * the file's change time (an older file without one: its export time). A merge is a new state: now.
 * The tidy-up writes right after the import do not count as changes of their own.
 */
export async function markImported(db, data, mode, now = new Date()) {
  const w = timers.get(db);
  if (w) clearTimeout(w.timer);
  timers.delete(db);
  const at = mode === 'replace' ? data?.lastChange ?? data?.exportedAt ?? now.toISOString() : now.toISOString();
  await db.table('meta').put({ key: LAST_CHANGE, at });
}

/**
 * Is a backup file newer or older than the data on this device? fileAt: the file's lastChange
 * (an older backup has none); localAt: this device's last change. Two seconds apart count as the same.
 * Returns { kind: 'newer' | 'older' | 'same' | 'unknown', file, local, exported }.
 */
export function compareStates(fileAt, localAt, exportedAt = null) {
  const out = { file: fileAt ?? null, local: localAt ?? null, exported: exportedAt ?? null };
  const f = fileAt ? Date.parse(fileAt) : NaN;
  const l = localAt ? Date.parse(localAt) : NaN;
  if (Number.isNaN(f) || Number.isNaN(l)) return { kind: 'unknown', ...out };
  if (Math.abs(f - l) < 2000) return { kind: 'same', ...out };
  return { kind: f > l ? 'newer' : 'older', ...out };
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
