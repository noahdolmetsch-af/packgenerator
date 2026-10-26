import { backupText } from './backupcrypt.js';
import { buildBackup, backupFileName, DEVICE_SETTINGS } from './backup.js';
import { DATA_TABLES } from './db.js';

/**
 * Automatic backup into a folder on the desktop (decision 9b).
 *
 * Chrome and Edge on the desktop can write files into a folder the user picked
 * once (File System Access API). We keep the folder "handle" in the database,
 * and after every change we write two files into it:
 *   pack-generator-latest.json       always the newest state
 *   pack-generator-YYYY-MM-DD.json   one file per day, as history
 * If the folder is synced (Google Drive, iCloud, OneDrive …), the phone can import
 * the latest file from there.
 *
 * Phones and Firefox/Safari do not support this; there the app uses Export instead.
 */

const HANDLE_KEY = 'backupFolder';
const LATEST = 'pack-generator-latest.json';
const DELAY_MS = 2000; // wait until a burst of changes is over, then write once

export const folderBackupSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/** Ask the user to pick a folder and remember it. */
export async function chooseFolder(db) {
  const handle = await window.showDirectoryPicker({ id: 'pack-generator-backup', mode: 'readwrite' });
  await db.table('meta').put({ key: HANDLE_KEY, handle, lastWrite: null });
  await writeNow(db);
  return handle;
}

export async function forgetFolder(db) {
  await db.table('meta').delete(HANDLE_KEY);
}

/**
 * State of the folder backup:
 *   "off"      no folder chosen
 *   "needs-ok" a folder is chosen, but the browser wants a click to allow writing again
 *              (browsers ask again after a restart; it cannot happen without a click)
 *   "on"       writing works
 */
export async function folderStatus(db) {
  const rec = await db.table('meta').get(HANDLE_KEY);
  if (!rec) return { state: 'off' };
  let perm;
  try {
    perm = await rec.handle.queryPermission({ mode: 'readwrite' });
  } catch (err) {
    return { state: 'error', code: folderErrorOf(err), name: rec.handle?.name ?? '', lastWrite: rec.lastWrite };
  }
  // Einzelidee 29: the last write failed (folder gone, no rights, disk full): its own message with the way out
  if (perm === 'granted' && rec.error?.code) return { state: 'error', code: rec.error.code, at: rec.error.at, name: rec.handle.name, lastWrite: rec.lastWrite };
  return { state: perm === 'granted' ? 'on' : 'needs-ok', name: rec.handle.name, lastWrite: rec.lastWrite };
}

/**
 * Einzelidee 29 «Backup-Ordner verschwunden» (996 Ideen, Noah 25.10.2026): why writing failed, from the
 * browser's error: 'gone' (folder moved or deleted, the disk or stick pulled out), 'rights' (the browser
 * or the system no longer lets the app write there), 'full' (no space left), 'other'. Pure.
 */
export function folderErrorOf(err) {
  const n = String(err?.name ?? '');
  if (n === 'NotFoundError' || n === 'NotReadableError' || n === 'InvalidStateError') return 'gone';
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'NoModificationAllowedError') return 'rights';
  if (n === 'QuotaExceededError' || /quota|space|full/i.test(String(err?.message ?? ''))) return 'full';
  return 'other';
}
/** The way out for each reason: what to do (English keys for t()). */
export const FOLDER_FIX = {
  gone: 'The folder is no longer there: it was moved or deleted, or the disk or stick is not plugged in. Plug it in again and tap «Try again», or choose a new folder.',
  rights: 'The app may no longer write into this folder. Tap «Try again» and allow it, or choose another folder.',
  full: 'The disk of this folder is full. Make some space there, or choose a folder on another disk, then tap «Try again».',
  other: 'Writing into the folder did not work. Tap «Try again»; if it keeps failing, choose a new folder.',
};
/** The headline of each reason. */
export const FOLDER_ERROR = {
  gone: 'Backup folder not found',
  rights: 'No permission for the backup folder',
  full: 'Backup folder is full',
  other: 'Backup folder did not work',
};

/** Must be called from a click: asks the browser for write permission again. */
export async function allowAgain(db) {
  const rec = await db.table('meta').get(HANDLE_KEY);
  if (!rec) return false;
  const ok = (await rec.handle.requestPermission({ mode: 'readwrite' })) === 'granted';
  if (ok) await writeNow(db);
  return ok;
}

/** Einzelidee 29: «Try again» after a failed write (from a click): asks for the permission when needed. */
export async function tryAgain(db) {
  const rec = await db.table('meta').get(HANDLE_KEY);
  if (!rec) return false;
  try {
    if ((await rec.handle.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await rec.handle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
      await db.table('meta').put({ ...rec, error: { code: 'rights', at: new Date().toISOString() } });
      return false;
    }
  } catch (err) {
    await db.table('meta').put({ ...rec, error: { code: folderErrorOf(err), at: new Date().toISOString() } });
    return false;
  }
  return writeNow(db);
}

async function writeFile(dir, name, text) {
  const file = await dir.getFileHandle(name, { create: true });
  const out = await file.createWritable();
  await out.write(text);
  await out.close();
}

/** Write the backup files now (if a folder is chosen and allowed). */
export async function writeNow(db) {
  const rec = await db.table('meta').get(HANDLE_KEY);
  // No backup while a demo runs: the demo data must not end up in your backup files.
  if (await db.table('meta').get('demo')) return false;
  if (!rec || (await rec.handle.queryPermission({ mode: 'readwrite' })) !== 'granted') return false;
  const text = await backupText(db, await buildBackup(db)); // Paket Q #135: locked when switched on
  try {
    await writeFile(rec.handle, LATEST, text);
    await writeFile(rec.handle, backupFileName(), text);
  } catch (err) {
    // Einzelidee 29: keep the reason, so Daten und Backup says what happened and how to fix it
    await db.table('meta').put({ ...rec, error: { code: folderErrorOf(err), at: new Date().toISOString() } });
    for (const fn of listeners) fn();
    return false;
  }
  const { error, ...ok } = rec;
  await db.table('meta').put({ ...ok, lastWrite: new Date().toISOString() });
  return true;
}

/**
 * Watch the data tables and write a backup shortly after any change.
 * Dexie "hooks" are called on every create, update and delete.
 */
// v0.94.0 «Kachel-Wand»: «Data and backup» moved from Today (always open at the start) to Me, so the
// watch starts once at app start (main.js) and lives for the whole session; a panel that shows the
// folder state only listens (onFolderWritten). Before, every mount of the panel added its hooks again.
const listeners = new Set();
let watching = false;
/** Call fn after each folder write; returns the function that stops listening. */
export function onFolderWritten(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function watchForChanges(db, onWritten = () => {}) {
  if (onWritten) listeners.add(onWritten);
  if (watching) return;
  watching = true;
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        if (await writeNow(db)) for (const fn of listeners) fn();
      } catch (err) {
        console.warn('Folder backup failed', err);
      }
    }, DELAY_MS);
  };
  for (const name of DATA_TABLES) {
    const table = db.table(name);
    // v0.45.1 (G015a): the tips shown on Today are not in the backup, so they write none
    const skip = (key) => name === 'settings' && DEVICE_SETTINGS.includes(key);
    table.hook('creating', (key) => {
      if (!skip(key)) schedule();
    });
    table.hook('updating', (mods, key) => {
      if (!skip(key)) schedule();
    });
    table.hook('deleting', (key) => {
      if (!skip(key)) schedule();
    });
  }
}
