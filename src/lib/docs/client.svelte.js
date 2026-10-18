/**
 * Ich › Dokumente (P3b «Daten sicher», mockups D3/D4) and Dokumente-PDF (Paket B): keeping documents in db.docs and the copy in Google Drive (Noah «1b»: also in his
 * Drive; «2a»: every group its own subfolder). Drive uses the same Google login as Fitbit
 * (api/_lib/google.js, scope drive.file only) and the device key from Strava.
 *
 * Settings (db.settings DOCS_KEY, in backups): { drive: true when Drive is allowed, auto: upload new
 * documents by themselves (default on), groups: own groups that are still empty }.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { GOOGLE_URL, call } from '../health.js';
import { readKey } from '../strava/client.svelte.js';
import { groupOf, DEFAULT_REMIND } from '../docs.js';

export const DOCS_HASH = '#/me/docs';
export const SCAN_HASH = '#/me/docs/scan';
export const DOCS_KEY = 'docs';
/** The biggest file the app keeps (a PDF; a photo is made smaller first). */
export const MAX_MB = 15;

export const prefsOf = (v) => ({
  drive: v?.drive === true,
  auto: v?.auto !== false,
  groups: Array.isArray(v?.groups) ? v.groups.filter((g) => typeof g === 'string' && g.trim()) : [],
});

export const docs = $state({ loaded: false, list: [], prefs: prefsOf(null), busy: '', error: '', uploading: {} });

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

/** Keep one document; uploads it to Drive when Drive is on. Returns the row. */
export async function addDoc(row, { db = appDb, upload = true } = {}) {
  const doc = { id: newId(), kind: 'pdf', group: '', createdAt: new Date().toISOString(), docDate: null, source: 'camera', pages: 1, bytes: 0, mode: 'bw', text: '', drive: null, until: null, remind: DEFAULT_REMIND, note: '', inPack: false, ...row };
  await db.docs.put(doc);
  if (upload) uploadSoon(doc, { db });
  return doc;
}

/** Change some fields of a document (the details save as you type). A new file goes to Drive again. */
export async function updateDoc(id, patch, { db = appDb } = {}) {
  await db.docs.update(id, 'data' in patch ? { ...patch, drive: null } : patch);
  if ('data' in patch) {
    const d = await db.docs.get(id);
    if (d) uploadSoon(d, { db });
  }
}

export async function renameDoc(id, name, { db = appDb } = {}) {
  const clean = String(name ?? '').trim().slice(0, 120);
  if (!clean) return;
  await db.docs.update(id, { name: clean });
  const d = await db.docs.get(id);
  if (d?.drive?.id) driveCall('drive-rename', { fileId: d.drive.id, name: driveName(d) }).catch(() => {});
}

export async function moveDoc(id, group, { db = appDb } = {}) {
  const g = String(group ?? '').trim().slice(0, 60);
  await db.docs.update(id, { group: g });
  const d = await db.docs.get(id);
  if (d?.drive?.id) driveCall('drive-move', { fileId: d.drive.id, root: d.kind === 'photo' ? 'photos' : 'pdf', group: g }).catch(() => {});
}

/** Delete in the app only; the copy in Drive stays (it can be deleted there). Returns the row so «Undo» can put it back. */
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

/** The name in Drive: «Quittung Veloladen Muster 2026-10-15.pdf». */
export function driveName(d) {
  const day = String(d.docDate ?? d.createdAt ?? '').slice(0, 10);
  const name = String(d.name ?? '').replace(/[\\/]+/g, ' ').trim() || 'Dokument';
  return `${name}${day ? ` ${day}` : ''}.${d.kind === 'photo' ? 'jpg' : 'pdf'}`;
}

const driveCall = (step, body) => call(step, { method: 'POST', body });

/** The data URL as bytes. */
export function bytesOf(dataUrl) {
  const s = String(dataUrl);
  const bin = atob(s.slice(s.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Upload one document to Drive now. Returns true when it is there. */
export async function uploadDoc(d, { db = appDb, doFetch = (...a) => fetch(...a), key = readKey() } = {}) {
  if (!key || !d?.data) return false;
  docs.uploading = { ...docs.uploading, [d.id]: true };
  try {
    const params = new URLSearchParams({ step: 'drive-upload', name: driveName(d), root: d.kind === 'photo' ? 'photos' : 'pdf', group: groupOf(d) });
    let res;
    try {
      res = await doFetch(`${GOOGLE_URL}?${params}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': d.kind === 'photo' ? 'image/jpeg' : 'application/pdf' }, body: bytesOf(d.data) });
    } catch {
      docs.error = 'network';
      return false;
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      docs.error = body?.code ?? 'server_error';
      if (body?.code === 'drive_not_allowed' || body?.code === 'not_connected') await savePrefs({ drive: false }, db);
      return false;
    }
    await db.docs.update(d.id, { drive: { id: body.id, link: body.link ?? null, at: new Date().toISOString() } });
    docs.error = '';
    return true;
  } finally {
    const { [d.id]: _, ...rest } = docs.uploading;
    docs.uploading = rest;
  }
}

function uploadSoon(d, { db }) {
  db.settings
    .get(DOCS_KEY)
    .then((s) => {
      const p = prefsOf(s?.value);
      if (p.drive && p.auto) return uploadDoc(d, { db });
      return null;
    })
    .catch(() => {});
}

/** Everything not yet in Drive (after connecting, or «Jetzt hochladen»). Returns how many went up. */
export async function uploadMissing({ db = appDb } = {}) {
  let n = 0;
  for (const d of await db.docs.toArray()) if (!d.drive?.id && (await uploadDoc(d, { db }))) n++;
  return n;
}

/** Ask the server whether Drive is allowed (after the login, or when the page opens). */
export async function checkDrive({ db = appDb, c = call } = {}) {
  if (!readKey()) return false;
  try {
    const st = await c('status');
    await savePrefs({ drive: !!st.drive }, db);
    return !!st.drive;
  } catch {
    return null;
  }
}

/** «Mit Google Drive verbinden»: the same Google login as Fitbit, asking for Drive in addition. */
export async function connectDrive({ c = call, loc = globalThis.location } = {}) {
  docs.error = '';
  try {
    const { url } = await c('start', { method: 'POST', body: { services: ['drive'], returnTo: `${loc.origin}${loc.pathname}${DOCS_HASH}` } });
    loc.href = url;
    return url;
  } catch (err) {
    docs.error = err?.code ?? 'network';
    return null;
  }
}

/** Back from the Google login: «#/me/docs?google=connected». Read once; then upload what is missing. */
export function takeReturn(loc = globalThis.location, hist = globalThis.history, db = appDb) {
  const h = loc?.hash ?? '';
  if (!h.startsWith(DOCS_HASH)) return null;
  const i = h.indexOf('?');
  if (i < 0) return null;
  const q = new URLSearchParams(h.slice(i + 1));
  const g = q.get('google');
  if (!g) return null;
  const error = q.get('error');
  try {
    hist?.replaceState(null, '', `${loc.pathname}${loc.search}${h.slice(0, i)}`);
  } catch {
    /* the address stays */
  }
  if (g === 'connected') {
    docs.error = '';
    savePrefs({ drive: true }, db)
      .then(() => checkDrive({ db }))
      .then((ok) => (ok ? uploadMissing({ db }) : null))
      .catch(() => {});
    return { connected: true };
  }
  docs.error = error || 'denied';
  return { error: docs.error };
}

/* ---------- P3b: a file from the device ---------- */

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
  return new Blob([bytesOf(d?.data ?? 'data:,')], { type: d?.kind === 'photo' ? 'image/jpeg' : 'application/pdf' });
}
