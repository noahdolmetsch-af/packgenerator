/**
 * Paket L «Werkzeugkasten» (#83 Ablage für wichtige Links, #86 Kleine Dateien ablegen; Noah 19.10.2026
 * «4 a und b»): one place for links and small files, shown in Ich › Dokumente and in the Werkzeugkasten.
 *
 * Where it lives (no new table, no schema change; both go into the backup and the sync):
 * - settings 'ablage.links' = [{ id, title, url, note, addedAt, group? }] in the user's order (group: the
 *   group on the page «Werkzeuge und Links», weblinks.js);
 * - settings 'ablage.files' = [{ id, name, type, size, addedAt }] in the user's order, and the file
 *   itself in settings 'ablage.file.<id>' = data URL.
 * Names are the user's own: never through t(). The pure parts are tested in tests/werkzeugkasten.test.js.
 */
import { db as appDb } from '../db.js';

export const LINKS_KEY = 'ablage.links';
export const FILES_KEY = 'ablage.files';
export const fileKey = (id) => `ablage.file.${id}`;
/** «Small» files: at most 5 MB each (the backup and the sync carry them). */
export const FILE_MAX = 5 * 1024 * 1024;

/** A typed address made usable: «example.org» → «https://example.org»; null when it is no web address. */
export function cleanUrl(s) {
  let u = String(s ?? '').trim();
  if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `https://${u}`;
  try {
    const x = new URL(u);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(x.protocol)) return null;
    if ((x.protocol === 'http:' || x.protocol === 'https:') && !x.hostname.includes('.')) return null;
    return x.href;
  } catch {
    return null;
  }
}

/** The title shown when none was typed: the host without «www.». */
export function titleOf(url) {
  try {
    const x = new URL(url);
    return x.hostname ? x.hostname.replace(/^www\./, '') : url;
  } catch {
    return String(url ?? '');
  }
}

/** Moves an entry from one place to another (arrows and drag). */
export function moved(list, from, to) {
  const l = [...(list ?? [])];
  if (from < 0 || from >= l.length || to < 0 || to >= l.length) return l;
  const [x] = l.splice(from, 1);
  l.splice(to, 0, x);
  return l;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function readLinks(db = appDb) {
  const r = await db.settings.get(LINKS_KEY);
  return Array.isArray(r?.value) ? r.value : [];
}
export async function readFiles(db = appDb) {
  const r = await db.settings.get(FILES_KEY);
  return Array.isArray(r?.value) ? r.value : [];
}
export const saveLinks = (list, db = appDb) => db.settings.put({ key: LINKS_KEY, value: JSON.parse(JSON.stringify(list)) });
export const saveFiles = (list, db = appDb) => db.settings.put({ key: FILES_KEY, value: JSON.parse(JSON.stringify(list)) });

/** Adds a link (at the end). → the new entry, or null when the address is not usable. */
export async function addLink({ title = '', url, note = '', group = null }, db = appDb) {
  const href = cleanUrl(url);
  if (!href) return null;
  const e = { id: newId(), title: String(title).trim().slice(0, 80) || titleOf(href), url: href, note: String(note).trim().slice(0, 200), addedAt: new Date().toISOString(), ...(group != null ? { group } : {}) };
  await saveLinks([...(await readLinks(db)), e], db);
  return e;
}

/** Adds a file (data URL). → the entry, or a reason: 'big'. */
export async function addFile({ name, type, size, data }, db = appDb) {
  if (size > FILE_MAX) return 'big';
  const e = { id: newId(), name: String(name || 'Datei').slice(0, 120), type: type || 'application/octet-stream', size, addedAt: new Date().toISOString() };
  await db.transaction('rw', db.settings, async () => {
    await db.settings.put({ key: fileKey(e.id), value: data });
    await saveFiles([...(await readFiles(db)), e], db);
  });
  return e;
}

export async function fileData(id, db = appDb) {
  return (await db.settings.get(fileKey(id)))?.value ?? null;
}

/** Deletes a file and gives back what Undo needs. */
export async function removeFile(id, db = appDb) {
  const list = await readFiles(db);
  const at = list.findIndex((x) => x.id === id);
  const entry = list[at];
  const data = await fileData(id, db);
  await db.transaction('rw', db.settings, async () => {
    await db.settings.delete(fileKey(id));
    await saveFiles(list.filter((x) => x.id !== id), db);
  });
  return { entry, data, at };
}

export async function restoreFile({ entry, data, at }, db = appDb) {
  await db.transaction('rw', db.settings, async () => {
    await db.settings.put({ key: fileKey(entry.id), value: data });
    const l = (await readFiles(db)).filter((x) => x.id !== entry.id);
    l.splice(Math.min(at, l.length), 0, entry);
    await saveFiles(l, db);
  });
}

/** A data URL back to a Blob. */
export function blobOfData(dataUrl) {
  const [head, b64 = ''] = String(dataUrl ?? '').split(',');
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type });
}
