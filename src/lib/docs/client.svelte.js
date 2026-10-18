/**
 * Ich › Dokumente (P3b «Daten sicher», Noah 15.10.2026 «1a», mockups D3/D4): keeping documents in
 * db.docs. Only on this device and in the backup file; nothing goes to a server. The package
 * «Dokumente-PDF» (DP) adds the camera and Google Drive on top of these functions later.
 *
 * Settings (db.settings DOCS_KEY, in backups): { groups: own groups that are still empty }.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { DEFAULT_REMIND } from '../docs.js';

export const DOCS_HASH = '#/me/docs';
export const DOCS_KEY = 'docs';
/** The biggest file the app keeps (a PDF; a photo is made smaller first). */
export const MAX_MB = 15;

export const prefsOf = (v) => ({
  groups: Array.isArray(v?.groups) ? v.groups.filter((g) => typeof g === 'string' && g.trim()) : [],
});

export const docs = $state({ loaded: false, list: [], prefs: prefsOf(null) });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => [await appDb.docs.toArray(), (await appDb.settings.get(DOCS_KEY))?.value]).subscribe({
    next: ([list, p]) => {
      docs.list = list;
      docs.prefs = prefsOf(p);
      docs.loaded = true;
    },
    error: () => (docs.loaded = true),
  });
}

export async function savePrefs(patch, db = appDb) {
  const old = (await db.settings.get(DOCS_KEY))?.value ?? {};
  await db.settings.put({ key: DOCS_KEY, value: { ...old, ...patch } });
}

const newId = () => `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Keep one document. Returns the row. */
export async function addDoc(row, { db = appDb } = {}) {
  const doc = { id: newId(), kind: 'pdf', group: '', createdAt: new Date().toISOString(), docDate: null, source: 'file', pages: 1, bytes: 0, mode: 'color', text: '', drive: null, until: null, remind: DEFAULT_REMIND, note: '', inPack: false, ...row };
  await db.docs.put(doc);
  return doc;
}

/** Change some fields of a document (the details save as you type). */
export async function updateDoc(id, patch, { db = appDb } = {}) {
  await db.docs.update(id, patch);
}

export async function renameDoc(id, name, { db = appDb } = {}) {
  const clean = String(name ?? '').trim().slice(0, 120);
  if (clean) await db.docs.update(id, { name: clean });
}

export async function moveDoc(id, group, { db = appDb } = {}) {
  await db.docs.update(id, { group: String(group ?? '').trim().slice(0, 60) });
}

/** Delete; returns the row so «Undo» can put it back. */
export async function deleteDoc(id, { db = appDb } = {}) {
  const row = await db.docs.get(id);
  await db.docs.delete(id);
  return row ?? null;
}

/** «Undo» after deleting. */
export async function restoreDoc(row, { db = appDb } = {}) {
  if (row?.id) await db.docs.put(row);
}

/** A new own group that has no document yet. */
export async function addGroup(name, { db = appDb } = {}) {
  const g = String(name ?? '').trim().slice(0, 60);
  if (!g) return null;
  const p = prefsOf((await db.settings.get(DOCS_KEY))?.value);
  if (!p.groups.some((x) => x.toLowerCase() === g.toLowerCase())) await savePrefs({ groups: [...p.groups, g] }, db);
  return g;
}

/** A file as a data URL. */
export function readData(file) {
  return new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => no(r.error);
    r.readAsDataURL(file);
  });
}

/** A photo made smaller (longest side max px, JPEG), so the backup file stays small. */
export async function smallPhoto(file, max = 1700, quality = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** How many pages a PDF has (counted in the file; 1 when it cannot tell). */
export function pdfPages(dataUrl) {
  try {
    const s = atob(String(dataUrl).slice(String(dataUrl).indexOf(',') + 1));
    const n = (s.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
    return n || 1;
  } catch {
    return 1;
  }
}

/** The stored file as a Blob (to open, share or download). */
export function blobOf(d) {
  const s = String(d?.data ?? '');
  const bin = atob(s.slice(s.indexOf(',') + 1));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: d.kind === 'photo' ? 'image/jpeg' : 'application/pdf' });
}
