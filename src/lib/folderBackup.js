import { buildBackup, backupFileName } from './backup.js';
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
  const perm = await rec.handle.queryPermission({ mode: 'readwrite' });
  return { state: perm === 'granted' ? 'on' : 'needs-ok', name: rec.handle.name, lastWrite: rec.lastWrite };
}

/** Must be called from a click: asks the browser for write permission again. */
export async function allowAgain(db) {
  const rec = await db.table('meta').get(HANDLE_KEY);
  if (!rec) return false;
  const ok = (await rec.handle.requestPermission({ mode: 'readwrite' })) === 'granted';
  if (ok) await writeNow(db);
  return ok;
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
  const text = JSON.stringify(await buildBackup(db), null, 2);
  await writeFile(rec.handle, LATEST, text);
  await writeFile(rec.handle, backupFileName(), text);
  await db.table('meta').put({ ...rec, lastWrite: new Date().toISOString() });
  return true;
}

/**
 * Watch the data tables and write a backup shortly after any change.
 * Dexie "hooks" are called on every create, update and delete.
 */
export function watchForChanges(db, onWritten = () => {}) {
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        if (await writeNow(db)) onWritten();
      } catch (err) {
        console.warn('Folder backup failed', err);
      }
    }, DELAY_MS);
  };
  for (const name of DATA_TABLES) {
    const table = db.table(name);
    table.hook('creating', schedule);
    table.hook('updating', schedule);
    table.hook('deleting', schedule);
  }
}
