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

export const SNAP_DB = 'pack-generator-snapshots';
// P3b «Daten sicher» (Noah 15.10.2026, rule 5a): also a copy before every import of a backup file
// («Replace all data» and «Merge»), the last 3 of them.
export const KEEP = { update: 3, restore: 1, import: 3 };
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

/** Keep a copy of the data now. kind: 'update' (before an update), 'restore' (before going back) or 'import' (before an import). */
export async function takeSnapshot(db, sdb, { version, to = null, kind = 'update', now = new Date() }) {
  const data = await buildBackup(db);
  const id = await sdb.snaps.add({ at: now.toISOString(), version: version ?? null, to, kind, rows: rowsOf(data), data });
  const all = await sdb.snaps.toArray();
  const drop = pruneIds(all.map(({ id, at, kind }) => ({ id, at, kind })));
  if (drop.length) await sdb.snaps.bulkDelete(drop);
  return id;
}

/** The copies, newest first, without their data (for the list). */
export async function listSnapshots(sdb) {
  const all = await sdb.snaps.toArray();
  return all.map(({ id, at, version, to, kind, rows }) => ({ id, at, version, to, kind, rows })).sort((a, b) => String(b.at).localeCompare(String(a.at)) || b.id - a.id);
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
  const list = await listSnapshots(sdb);
  return list.find((s) => s.kind === 'update' && s.to === version) ?? null;
}
