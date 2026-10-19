/**
 * Paket Q #135 «Sicherung mit Passwort»: a backup file can be locked with a password.
 * The file stays a small JSON object that says it is a locked Pack Generator backup; the data
 * inside is AES-GCM encrypted with a key from the password (PBKDF2, SHA-256). Everything happens
 * in the browser (Web Crypto); the password stays on this device (LOCK_KEY) and is never sent. Without the password
 * nobody can open the file, not even the app.
 */
const APP_ID = 'pack-generator'; // the same as backup.js APP_ID (no import: backup.js imports this file)

export const LOCK = 'aes-gcm-pbkdf2';
export const ITERATIONS = 250000;

const enc = new TextEncoder();
const dec = new TextDecoder();
// in chunks: a backup can be several MB, too many arguments for one fromCharCode call
function b64(bytes) {
  const u = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Is this parsed file a locked backup? */
export const isLocked = (data) => !!data && typeof data === 'object' && data.app === APP_ID && data.locked === LOCK && typeof data.data === 'string';

async function keyOf(password, salt, iterations, crypto) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Lock a backup object with a password; returns the locked file object (to be written as JSON). */
export async function lockBackup(data, password, crypto = globalThis.crypto) {
  if (!password) throw new Error('no password');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyOf(password, salt, ITERATIONS, crypto);
  const box = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  // exportedAt stays readable, so «newer or older» still works before the password is typed
  return { app: APP_ID, locked: LOCK, v: 1, iterations: ITERATIONS, exportedAt: data?.exportedAt ?? null, ...(data?.lastChange ? { lastChange: data.lastChange } : {}), salt: b64(salt), iv: b64(iv), data: b64(box) };
}

/**
 * Open a locked file with the password. Returns the backup object, or null when the password is
 * wrong (or the file was changed).
 */
export async function unlockBackup(file, password, crypto = globalThis.crypto) {
  if (!isLocked(file)) return null;
  try {
    const key = await keyOf(password, unb64(file.salt), file.iterations || ITERATIONS, crypto);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(file.iv) }, key, unb64(file.data));
    return JSON.parse(dec.decode(plain));
  } catch {
    return null;
  }
}

/* ---------- the switch (Noah 19.10.2026 «3»: off at the start, switched on in the app) ---------- */

/**
 * meta key (this device only, never exported or synced): { on, password }. The password stays on
 * this device so the automatic folder backup can lock its files too.
 */
export const LOCK_KEY = 'backupLock';

/** The password to lock with, or null when the switch is off. */
export async function lockPassword(db) {
  const rec = await db.table('meta').get(LOCK_KEY);
  return rec?.on && rec.password ? rec.password : null;
}

/** The text of a backup file: locked when the switch is on. */
export async function backupText(db, data) {
  const pw = await lockPassword(db);
  return JSON.stringify(pw ? await lockBackup(data, pw) : data, null, 2);
}

export const setLock = (db, password) => db.table('meta').put({ key: LOCK_KEY, on: true, password });
export const clearLock = (db) => db.table('meta').delete(LOCK_KEY);
