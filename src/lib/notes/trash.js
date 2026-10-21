/**
 * Paket NE 1151 (Noah 20.10.2026 «10a»): a deleted note waits 30 days in the trash, and every note
 * keeps its earlier versions. Both live in db.docs (rows with noteId, so Ich › Dokumente leaves them
 * out): no new table and no Dexie change.
 *
 * Trash row:   { id: 'trash:<noteId>', kind: 'notetrash', noteId, name, note, trashedAt }
 *   The note's files (kind 'notefile') stay where they are and go only when the trash row goes.
 * Version row: { id: 'ver:<noteId>:<ms>', kind: 'noteversion', noteId, at, v: { title, text, checklist, … } }
 *   The text parts only: photos, drawings and files stay as they are (they have their own Undo).
 *
 * The functions take the database as `db`, so the tests can give a small fake.
 */
export const TRASH_DAYS = 30;
export const TRASH = 'notetrash';
export const VERSION = 'noteversion';
export const VERSION_KEEP = 20;
/** Writing on and on in one sitting is one version: a new one only after this gap. */
export const VERSION_GAP_MS = 10 * 60 * 1000;
/** The parts of a note a version keeps. */
export const VERSION_FIELDS = ['title', 'text', 'checklist', 'links', 'link', 'place', 'topic'];

const DAY_MS = 864e5;

/* ---------- pure ---------- */

/** Days until a trashed note is gone for good (0 on the last day). */
export function daysLeft(trashedAt, now = new Date()) {
  const at = Date.parse(trashedAt);
  if (!Number.isFinite(at)) return 0;
  return Math.max(0, Math.ceil((at + TRASH_DAYS * DAY_MS - now.getTime()) / DAY_MS));
}
export const isExpired = (row, now = new Date()) => Date.parse(row?.trashedAt) + TRASH_DAYS * DAY_MS <= now.getTime();

/** The text parts of a note (what a version keeps). */
export function versionOf(note) {
  const v = {};
  for (const k of VERSION_FIELDS) if (note?.[k] !== undefined) v[k] = structuredClone(note[k]);
  return v;
}
export const sameVersion = (a, b) => JSON.stringify(versionOf(a)) === JSON.stringify(versionOf(b));

/** A note with an older version put back: the text parts of the version, the rest as it is now. */
export function withVersion(note, v) {
  const out = { ...note };
  for (const k of VERSION_FIELDS) delete out[k];
  return { ...out, ...structuredClone(v ?? {}) };
}

/** Should a change from `before` to `after` keep `before` as a version? last: the newest version row. */
export function needsVersion(before, after, last, now = new Date()) {
  if (!before || sameVersion(before, after)) return false;
  if (!String(before.text ?? '').trim() && !(before.checklist ?? []).length && !before.title) return false;
  if (last && now.getTime() - Date.parse(last.at) < VERSION_GAP_MS) return false;
  return true;
}

/** The newest first; the ones beyond VERSION_KEEP go. → { keep, drop } */
export function pruneVersions(rows, keep = VERSION_KEEP) {
  const sorted = [...rows].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return { keep: sorted.slice(0, keep), drop: sorted.slice(keep) };
}

/** A short line of what changed between a version and the note now (for the list). */
export function versionLine(v, now) {
  const a = String(v?.text ?? '');
  const b = String(now?.text ?? '');
  const words = (s) => s.split(/\s+/).filter(Boolean).length;
  const d = words(a) - words(b);
  const first = (a.split('\n').find((l) => l.trim()) ?? '').replace(/^[#\-*\s[\]x]+/, '').slice(0, 60);
  return { first, diff: d };
}

/* ---------- with the database ---------- */

const ofKind = (db, kind) => db.docs.where('kind').equals(kind).toArray();

/** Into the trash: the note leaves the notes, its files stay hidden until the trash row goes. */
export async function trashNote(db, note, now = new Date()) {
  if (!note?.id) return null;
  const row = { id: `trash:${note.id}`, kind: TRASH, noteId: note.id, name: String(note.title || String(note.text ?? '').split('\n')[0] || '').slice(0, 80), note, trashedAt: now.toISOString(), createdAt: now.toISOString() };
  await db.transaction('rw', db.notes, db.docs, async () => {
    await db.docs.put(row);
    await db.notes.delete(note.id);
  });
  return row;
}
/** Several at once (the table). → the trash rows, for Undo */
export async function trashNotes(db, notes, now = new Date()) {
  const rows = [];
  for (const n of notes) rows.push(await trashNote(db, n, now));
  return rows.filter(Boolean);
}

/** Back from the trash: the note is there again as it was. */
export async function restoreNote(db, id) {
  const row = await db.docs.get(id);
  if (!row?.note) return null;
  await db.transaction('rw', db.notes, db.docs, async () => {
    await db.notes.put(row.note);
    await db.docs.delete(id);
  });
  return row.note;
}
/** Undo of «into the trash»: the same as restoring each one. */
export async function untrash(db, rows) {
  for (const r of rows ?? []) await restoreNote(db, r.id);
}

/** Gone for good: the trash row, its files and its versions (unless the note came back meanwhile). */
export async function dropForGood(db, rows) {
  const noteIds = new Set(rows.map((r) => r.noteId));
  const back = new Set((await db.notes.bulkGet([...noteIds])).filter(Boolean).map((n) => n.id));
  const all = await db.docs.toArray();
  const drop = all.filter((d) => rows.some((r) => r.id === d.id) || (noteIds.has(d.noteId) && !back.has(d.noteId) && (d.kind === 'notefile' || d.kind === VERSION)));
  if (drop.length) await db.docs.bulkDelete(drop.map((d) => d.id));
  return drop;
}

/** The trash, newest first. */
export async function trashList(db) {
  return (await ofKind(db, TRASH)).sort((a, b) => String(b.trashedAt).localeCompare(String(a.trashedAt)));
}
/** What waited longer than 30 days goes (when the notes open). → how many */
export async function purgeTrash(db, now = new Date()) {
  const old = (await ofKind(db, TRASH)).filter((r) => isExpired(r, now));
  if (old.length) await dropForGood(db, old);
  return old.length;
}

/** After saving a note: keep the state before as a version when it changed (see needsVersion); force: always (before putting an older one back), unless the newest is the same. */
export async function keepVersion(db, before, after, now = new Date(), { force = false } = {}) {
  if (!before?.id) return null;
  const rows = (await ofKind(db, VERSION)).filter((r) => r.noteId === before.id);
  const { keep } = pruneVersions(rows);
  if (force ? keep[0] && sameVersion(keep[0].v, before) : !needsVersion(before, after, keep[0], now)) return null;
  const row = { id: `ver:${before.id}:${now.getTime()}`, kind: VERSION, noteId: before.id, at: now.toISOString(), createdAt: now.toISOString(), v: versionOf(before) };
  await db.docs.put(row);
  const { drop } = pruneVersions([row, ...rows]);
  if (drop.length) await db.docs.bulkDelete(drop.map((d) => d.id));
  return row;
}
/** The versions of one note, newest first. */
export async function versionsOf(db, noteId) {
  return pruneVersions((await ofKind(db, VERSION)).filter((r) => r.noteId === noteId)).keep;
}
