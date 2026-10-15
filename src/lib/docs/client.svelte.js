/**
 * Dokumente-PDF: keeping documents in db.docs and the copy in Google Drive (Noah «1b»: also in his
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
import { groupOf } from '../docs.js';

export const DOCS_HASH = '#/me/docs';
export const SCAN_HASH = '#/me/docs/scan';
export const DOCS_KEY = 'docs';

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
  const doc = { id: newId(), kind: 'pdf', group: '', createdAt: new Date().toISOString(), docDate: null, source: 'camera', pages: 1, bytes: 0, mode: 'bw', text: '', drive: null, ...row };
  await db.docs.put(doc);
  if (upload) uploadSoon(doc, { db });
  return doc;
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

/** Delete in the app only; the copy in Drive stays (it can be deleted there). */
export async function deleteDoc(id, { db = appDb } = {}) {
  await db.docs.delete(id);
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
