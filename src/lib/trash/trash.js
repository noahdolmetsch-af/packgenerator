/**
 * «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): the trash of everything. A delete of the user (deleteWithUndo, ui/ask.js) keeps the rows that
 * went in one entry of the table `trash` for 30 days; «Zurück» puts them back. The notes keep their own trash (notes/trash.js) and show up
 * in the list as well. Nothing goes by itself after the 30 days: the app asks once whether to empty (the page, trash/…).
 *
 * Entry: { id, at (ISO), kind, name, main (table), counts { table: n }, rows: [{ t, row }] }
 * Functions take the database as `db`, so the tests can give a small one.
 */
import { db as appDb } from '../db.js';
import { begin, end } from './capture.js';
import { mainTable, countsOf, kindOfTable } from './kinds.js';

/** More rows than this in one delete («delete all rides»): too big to keep, the 8 seconds of Undo have to do. */
export const MAX_ROWS = 5000;

const newId = () => globalThis.crypto?.randomUUID?.() ?? `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Runs `run()` (a delete) and keeps the rows that went. → { value (what run returned), id (the entry, or null) }.
 * keep: false when the delete itself is «for good» (emptying the trash). Never throws because of the trash: when it
 * cannot be written the delete stands as before.
 */
export async function trashed(label, run, { db = appDb, keep = true } = {}) {
  const w = keep ? begin() : null;
  let value;
  let rows = [];
  try {
    value = await run();
  } finally {
    rows = end(w);
  }
  let id = null;
  if (rows.length && rows.length <= MAX_ROWS) {
    try {
      id = await putEntry(db, label, rows);
    } catch (err) {
      console.error(err);
    }
  }
  if (id && value && typeof value === 'object') linked.set(value, id);
  return { value, id };
}

/** The entry that belongs to what `run` returned, so a page that does its own Undo can take the entry back (forgetFor). */
const linked = new WeakMap();

/** The delete was taken back (the page's own Undo put `value` back): the entry goes. */
export async function forgetFor(value, db = appDb) {
  const id = value && typeof value === 'object' ? linked.get(value) : null;
  if (id) await dropEntry(db, id).catch(() => {});
}

/** Rows that are not a table row but one item in a list that lives in a settings record (a to-do, an entry of My day): { t: LIST, key: settings key, row: the item }. */
export const LIST = '@list';

/** Writes one entry for the rows [{ t, key, row }] (a row that is twice in it counts once). kind: for entries that sit under no table (a to-do). */
export async function putEntry(db, label, rows, now = new Date(), kind = '') {
  const seen = new Set();
  const list = [];
  for (const r of rows) {
    const k = `${r.t}|${JSON.stringify(r.key)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    list.push({ t: r.t, key: r.key, row: r.row });
  }
  const main = mainTable(list);
  const id = newId();
  await db.trash.put({ id, at: now.toISOString(), kind: kind || kindOfTable(main), name: String(label ?? '').slice(0, 160), main, counts: countsOf(list), rows: list });
  return id;
}

/**
 * One item of a list in a settings record went (a to-do in `merken`, an entry of My day in `week.items`): keeps the item for 30 days.
 * → the entry id, or null (the trash never stops a delete). It is also the one ⌘Z takes back.
 */
export async function trashItem(db, label, { store, row, kind }) {
  try {
    const id = await putEntry(db, label, [{ t: LIST, key: store, row }], new Date(), kind);
    last = { id, name: String(label ?? ''), at: Date.now() };
    return id;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/** The delete of an item was taken back at once: its entry goes, and ⌘Z has nothing to take back. */
export async function forgetItem(db, id) {
  if (!id) return;
  await dropEntry(db, id).catch(() => {});
  if (last?.id === id) last = null;
}

/** The entry is gone because the delete was taken back at once (Undo): it does not belong in the trash. */
export async function dropEntry(db, id) {
  if (id) await db.trash.delete(id);
}

/**
 * Puts the rows of an entry back. A row whose key exists again (the user made a new one) stays as it is, the old one is not
 * written over it. → { back (rows put back), skipped (rows left because they exist), entry } or null when the entry is gone.
 */
export async function restoreEntry(db, id) {
  const e = await db.trash.get(id);
  if (!e) return null;
  const by = {};
  for (const r of e.rows ?? []) (by[r.t] ??= []).push(r);
  const items = by[LIST] ?? [];
  delete by[LIST];
  const names = Object.keys(by);
  let back = 0;
  let skipped = 0;
  await db.transaction('rw', [...names.map((n) => db.table(n)), ...(items.length ? [db.settings] : []), db.trash], async () => {
    // an item of a list in a settings record goes to the end of that list again, unless one with its id is there
    for (const it of items) {
      const cur = (await db.settings.get(it.key))?.value;
      const list = Array.isArray(cur) ? cur : [];
      if (list.some((x) => x && x.id === it.row?.id)) {
        skipped++;
        continue;
      }
      await db.settings.put({ key: it.key, value: [...list, JSON.parse(JSON.stringify(it.row))] });
      back++;
    }
    for (const n of names) {
      const tbl = db.table(n);
      const inbound = !!tbl.schema.primKey.keyPath;
      const have = await tbl.bulkGet(by[n].map((r) => r.key));
      const add = by[n].filter((r, i) => have[i] === undefined);
      skipped += by[n].length - add.length;
      back += add.length;
      if (add.length) await (inbound ? tbl.bulkPut(add.map((r) => r.row)) : tbl.bulkPut(add.map((r) => r.row), add.map((r) => r.key)));
    }
    await db.trash.delete(id);
  });
  return { back, skipped, entry: e };
}

/** Deletes entries for good. */
export const purge = (db, ids) => db.trash.bulkDelete(ids);

/** The newest delete that sits in «Zuletzt gelöscht» (for ⌘Z on a computer): { id, name, at } or null. */
let last = null;
export const lastDeleted = { get: () => last, set: (v) => (last = v) };
