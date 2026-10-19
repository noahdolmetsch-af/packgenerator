/**
 * Paket L2 «Bilderkennung»: what the recognition keeps.
 * - db.meta 'vision.known': the things taught with «Was ist das?» (fingerprint + item or name). Only on
 *   this device (Noah «2a … merkt es sich»): db.meta is never in a backup or the sync.
 * - db.settings 'vision': the last choices { engine: 'device'|'helper', mode: 'tick'|'new' }.
 */
import { db } from '../db.js';
import { teach } from './recognize.js';

export const KNOWN_KEY = 'vision.known';
export const PREFS_KEY = 'vision';

export const prefsOf = (v) => ({ engine: v?.engine === 'helper' ? 'helper' : 'device', mode: v?.mode === 'new' ? 'new' : 'tick', video: v?.video === true });

export async function loadPrefs() {
  return prefsOf((await db.settings.get(PREFS_KEY).catch(() => null))?.value);
}
export async function savePrefs(patch) {
  const cur = await loadPrefs();
  await db.settings.put({ key: PREFS_KEY, value: { ...cur, ...patch } }).catch(() => {});
}

export async function loadKnown() {
  const v = (await db.meta.get(KNOWN_KEY).catch(() => null))?.value;
  return Array.isArray(v) ? v : [];
}

/** Remembers one answer and returns the new list. */
export async function remember(answer) {
  const next = teach(await loadKnown(), answer);
  await db.meta.put({ key: KNOWN_KEY, value: next });
  return next;
}

/** Forgets one taught thing (or all with id null). */
export async function forget(id = null) {
  const next = id ? (await loadKnown()).filter((k) => k.id !== id) : [];
  await db.meta.put({ key: KNOWN_KEY, value: next });
  return next;
}
