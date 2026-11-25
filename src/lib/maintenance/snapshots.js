/**
 * BF4 «Sicherung vor jedem Update» (Noah 13.10.2026): when the app starts on another version than last
 * time, a copy of all data is kept BEFORE the data updates of the new version run (main.js, before
 * tidyData). The copies live in their own small database (SNAP_DB), so they never go into an export,
 * a backup file or the folder backup, and never make the backup bigger. The last KEEP.update copies
 * stay, plus one copy of the state before a «Back to the state before …» (KEEP.restore).
 * A first install (no data) keeps nothing. Switchable under Ich › App maintenance (settings.js).
 */
import Dexie from 'dexie';
import { buildBackup, restoreBackup, countRows } from '../backup.js';
import { readMaint } from './settings.js';
import { DATA_TABLES, DEVICE_SETTINGS } from '../db.js';

export const SNAP_DB = 'pack-generator-snapshots';
// P3b «Daten sicher» (Noah 15.10.2026, rule 5a): also a copy before every import of a backup file
// («Replace all data» and «Merge»), the last 3 of them.
// P8 «Automatischer Abgleich»: one copy before the first sync with another device.
export const KEEP = { update: 3, restore: 1, import: 3, sync: 1, reset: 1 };
/** The version this device started with last time (in the snapshot database, never exported). */
export const VERSION_KEY = 'version';

export function createSnapDb(name = SNAP_DB) {
  const d = new Dexie(name);
  d.version(1).stores({ snaps: '++id, at, kind', meta: 'key' });
  return d;
}
let shared = null;
/** The one snapshot database of the app (made on first use). */
export const snapDb = () => (shared ??= createSnapDb());

/** A copy is due: switched on, data on the device, a version seen before and now another one. */
export function shouldSnapshot({ last, current, hasData, on = true }) {
  return !!(on && hasData && last && current && last !== current);
}

/** The ids to delete so that the newest KEEP[kind] copies of each kind stay. */
export function pruneIds(list, keep = KEEP) {
  const out = [];
  for (const kind of new Set(list.map((s) => s.kind))) {
    const mine = list.filter((s) => s.kind === kind).sort((a, b) => String(b.at).localeCompare(String(a.at)) || (b.id ?? 0) - (a.id ?? 0));
    out.push(...mine.slice(keep[kind] ?? 1).map((s) => s.id));
  }
  return out;
}

/** How many records a backup object holds. */
export const rowsOf = (data) => Object.values(countRows(data)).reduce((n, x) => n + x, 0);

/**
 * Every copy holds ALL data (with a big phone: some 100 MB). Reading a copy to show one line of the list
 * made the page «Data» wait seconds, so each copy has a small note next to it («head:<id>» in the meta table
 * of the same database): when, which version, how many records. The list reads only these notes.
 */
export const HEAD = 'head:';
const headOf = ({ id, at, version, to, kind, rows }) => ({ id, at, version: version ?? null, to: to ?? null, kind, rows: rows ?? 0 });

/** The id, time and kind of every copy, read from the indexes only: never a copy's data. */
async function lightList(sdb) {
  const [atIds, ats, kindIds, kinds] = await Promise.all([
    sdb.snaps.orderBy('at').primaryKeys(),
    sdb.snaps.orderBy('at').keys(),
    sdb.snaps.orderBy('kind').primaryKeys(),
    sdb.snaps.orderBy('kind').keys(),
  ]);
  const kindOf = new Map(kindIds.map((id, i) => [id, kinds[i]]));
  return atIds.map((id, i) => ({ id, at: ats[i], kind: kindOf.get(id) }));
}

/** Keep a copy of the data now. kind: 'update' (before an update), 'restore' (before going back) or 'import' (before an import). */
export async function takeSnapshot(db, sdb, { version, to = null, kind = 'update', now = new Date() }) {
  const data = await buildBackup(db);
  const entry = { at: now.toISOString(), version: version ?? null, to, kind, rows: rowsOf(data) };
  const id = await sdb.snaps.add({ ...entry, data });
  await sdb.meta.put({ key: HEAD + id, value: headOf({ ...entry, id }) });
  const drop = pruneIds(await lightList(sdb));
  if (drop.length) {
    await sdb.snaps.bulkDelete(drop);
    await sdb.meta.bulkDelete(drop.map((x) => HEAD + x));
  }
  return id;
}

const newestFirst = (a, b) => String(b.at).localeCompare(String(a.at)) || b.id - a.id;

/** The copies, newest first, from their notes only (no data is read). A copy without a note is not in the list until {@link ensureHeads} ran. */
export async function readSnapshotList(sdb) {
  const [ids, notes] = await Promise.all([sdb.snaps.toCollection().primaryKeys(), sdb.meta.where('key').startsWith(HEAD).toArray()]);
  const alive = new Set(ids);
  return notes.map((n) => n.value).filter((h) => alive.has(h.id)).sort(newestFirst);
}

/**
 * Copies made before the notes existed get theirs: each is read ONCE, one at a time (this is the slow part
 * the page used to do on every visit). Notes of copies that are gone are dropped. Returns how many were made.
 */
export async function ensureHeads(sdb) {
  const [ids, notes] = await Promise.all([sdb.snaps.toCollection().primaryKeys(), sdb.meta.where('key').startsWith(HEAD).primaryKeys()]);
  const have = new Set(notes);
  let made = 0;
  for (const id of ids) {
    if (have.has(HEAD + id)) continue;
    const snap = await sdb.snaps.get(id);
    if (!snap) continue;
    await sdb.meta.put({ key: HEAD + id, value: headOf(snap) });
    made++;
  }
  const alive = new Set(ids.map((x) => HEAD + x));
  const gone = notes.filter((k) => !alive.has(k));
  if (gone.length) await sdb.meta.bulkDelete(gone);
  return made;
}

/** The copies, newest first, without their data (for the list). */
export async function listSnapshots(sdb) {
  await ensureHeads(sdb);
  return readSnapshotList(sdb);
}

export const hasDataIn = async (db) => (await db.items.count()) + (await db.trips.count()) + (await db.bikes.count()) > 0;

/**
 * On start, before the data updates: a copy when the version changed. seen: the version «What is new»
 * saw last (localStorage), for a device that never ran this before. Returns true when a copy was made.
 */
export async function snapshotOnStart(db, { sdb = snapDb(), current, seen = null, now = new Date() } = {}) {
  const mark = (await sdb.meta.get(VERSION_KEY))?.value ?? null;
  const last = mark ?? seen;
  let made = false;
  if (last && last !== current) {
    const { snap } = await readMaint(db);
    if (shouldSnapshot({ last, current, hasData: await hasDataIn(db), on: snap })) {
      await takeSnapshot(db, sdb, { version: last, to: current, kind: 'update', now });
      made = true;
    }
  }
  if (mark !== current) await sdb.meta.put({ key: VERSION_KEY, value: current });
  return made;
}

/**
 * «Back to the state before …»: first a copy of now (so this step can be undone), then the copy
 * replaces all data. The caller tidies up afterwards (as after an import).
 */
export async function restoreSnapshot(db, sdb, id, { current, now = new Date() } = {}) {
  const snap = await sdb.snaps.get(id);
  if (!snap?.data) throw new Error('snapshot not found');
  await takeSnapshot(db, sdb, { version: current, kind: 'restore', now });
  await restoreBackup(db, snap.data, 'replace');
  return snap;
}

/** Is there a copy from before the update to this version? (the line in the news banner) */
export async function snapshotFor(sdb, version) {
  const list = await readSnapshotList(sdb); // notes only: this runs on every start, never read a copy for it
  return list.find((s) => s.kind === 'update' && s.to === version) ?? null;
}

/**
 * Paket H (Noah 19.10.2026 «1a aber nutzer kann alle daten jederzeit reseten also auf null setzen und so
 * frisch beginnen mit allem»): «Start fresh». First a copy of now (kind 'reset', it stands under «Before
 * updates» with «Back to the state before starting fresh»), then every data table is emptied. What only
 * belongs to this device (language, tips, helper) stays. Returns the id of the copy, for «Undo».
 */
export async function resetAll(db, sdb, { current = null, now = new Date() } = {}) {
  const id = await takeSnapshot(db, sdb, { version: current, kind: 'reset', now });
  const tables = DATA_TABLES.map((n) => db.table(n));
  await db.transaction('rw', tables, async () => {
    for (const name of DATA_TABLES) {
      const table = db.table(name);
      const keep = name === 'settings' ? (await table.toArray()).filter((r) => DEVICE_SETTINGS.includes(r?.key)) : [];
      await table.clear();
      if (keep.length) await table.bulkPut(keep);
    }
  });
  return id;
}

/** «Undo» right after starting fresh: the copy comes back as it was (no second copy of the empty state). */
export async function undoReset(db, sdb, id) {
  const snap = await sdb.snaps.get(id);
  if (!snap?.data) throw new Error('snapshot not found');
  await restoreBackup(db, snap.data, 'replace');
  return snap;
}
