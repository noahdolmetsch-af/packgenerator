/**
 * Fitbit über Google Health (mockups G1–G2, approved by Noah 13.10.2026 17:03 «g1-g2 freigeben»; answers
 * «1-5a»; built on his wish 14.10.2026 «ich möchte fitbit anbindung sofort»): the live state for the
 * page «Fitbit» (G1) and the card «Gesundheitsdaten» on «Daten und Backup» (G2).
 *
 * - Google is connected once on the server (one Google login for Noah). Every device that has a Strava
 *   key can fetch; the Strava key proves it is Noah's device (api/_lib/oauth.js).
 * - Settings (db.settings HEALTH_KEY, in backups): { connected, values, fetch, lastSync, until }.
 * - Automatic: when the app opens or comes back, at most every 15 minutes (as Strava, answer 2a).
 * Observation only. Every value can be switched off («Werte wählen»); nothing is a must.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { readKey, STRAVA_HASH } from '../strava/client.svelte.js';
import { call, syncHealth, HEALTH_KEY, VALUES, EXTRA } from '../health.js';

export const FITBIT_HASH = '#/me/fitbit';
export const DATA_HASH = '#/me/data';
/** db.meta (this device only): when this device last tried to fetch. */
export const TRY_KEY = 'health.try';
export const AUTO_EVERY_MS = 15 * 60 * 1000;
export { STRAVA_HASH };

/** The settings as stored, with the defaults filled in (all five values on). */
export const prefsOf = (v) => ({
  connected: v?.connected === true,
  values: Array.isArray(v?.values) ? VALUES.filter((k) => v.values.includes(k)) : [...VALUES],
  fetch: v?.fetch === 'manual' ? 'manual' : 'auto',
  lastSync: typeof v?.lastSync === 'string' ? v.lastSync : null,
  until: typeof v?.until === 'string' ? v.until : null,
});

export const health = $state({ loaded: false, busy: false, error: '', justConnected: false, prefs: prefsOf(null), first: null, last: null });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => [await appDb.settings.get(HEALTH_KEY), await appDb.healthDays.orderBy('date').first(), await appDb.healthDays.orderBy('date').last()]).subscribe({
    next: ([p, first, last]) => {
      health.prefs = prefsOf(p?.value);
      health.first = first ?? null;
      health.last = last ?? null;
      health.loaded = true;
    },
    error: () => (health.loaded = true),
  });
}

export async function savePrefs(db, patch) {
  const old = (await db.settings.get(HEALTH_KEY))?.value ?? {};
  await db.settings.put({ key: HEALTH_KEY, value: { ...old, ...patch } });
}

/** Only the values Noah chose are kept. */
// the values switched off stay out; calories and the highest pulse (EXTRA) have no switch of their own
const chosen = (values) => (rows) => rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k === 'date' || values.includes(k) || EXTRA.includes(k))));

let running = null;
/** «Jetzt holen»: fetch the missing days. Returns the result or null (error in health.error). */
export function fetchNow({ db = appDb, c = call, now = new Date() } = {}) {
  if (running) return running;
  running = (async () => {
    health.busy = true;
    health.error = '';
    try {
      await db.meta.put({ key: TRY_KEY, at: now.toISOString() });
      const prefs = prefsOf((await db.settings.get(HEALTH_KEY))?.value);
      const keep = chosen(prefs.values);
      const res = await syncHealth(db, {
        now,
        c: async (step, o) => {
          const r = await c(step, o);
          return { ...r, days: keep(r.days ?? []) };
        },
      });
      if (!prefs.connected) await savePrefs(db, { connected: true });
      return res;
    } catch (err) {
      const code = err?.code ?? 'network';
      health.error = code;
      if (code === 'not_connected') await savePrefs(db, { connected: false });
      return null;
    } finally {
      health.busy = false;
    }
  })().finally(() => (running = null));
  return running;
}

/** The automatic fetch: connected, a Strava key on this device, «Automatisch» on, 15 minutes passed. */
export async function autoFetch({ db = appDb, now = new Date() } = {}) {
  if (!readKey() || health.busy) return null;
  const prefs = prefsOf((await db.settings.get(HEALTH_KEY))?.value);
  if (!prefs.connected || prefs.fetch !== 'auto') return null;
  const tried = Date.parse((await db.meta.get(TRY_KEY))?.at ?? '');
  if (Number.isFinite(tried) && now.getTime() - tried < AUTO_EVERY_MS) return null;
  return fetchNow({ db, now });
}

export function watchAutoFetch() {
  if (typeof document === 'undefined') return;
  const go = () => autoFetch().catch(() => {});
  go();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') go();
  });
}

/**
 * The way back from the Google login: «#/me/fitbit?google=connected» (or google=error&error=…).
 * Read once, the address cleaned; after «connected» the first fetch starts.
 */
export function takeReturn(loc = globalThis.location, hist = globalThis.history, db = appDb) {
  const h = loc?.hash ?? '';
  // Dokumente-PDF: back from the Drive login is read by src/lib/docs/client.svelte.js
  if (h.startsWith('#/me/docs') || h.startsWith('#/me/agenda') || h.startsWith('#/me/mail')) return null; // and Kalender/Aufgaben (lib/agenda), Mail (lib/mail)
  const i = h.indexOf('?');
  if (i < 0) return null;
  const q = new URLSearchParams(h.slice(i + 1));
  const g = q.get('google');
  if (!g) return null;
  const error = q.get('error');
  for (const k of ['google', 'error']) q.delete(k);
  const rest = q.toString();
  try {
    hist?.replaceState(null, '', `${loc.pathname}${loc.search}${h.slice(0, i)}${rest ? `?${rest}` : ''}`);
  } catch {
    /* the address stays */
  }
  if (g === 'connected') {
    health.justConnected = true;
    health.error = '';
    savePrefs(db, { connected: true })
      .then(() => fetchNow({ db }))
      .catch(() => {});
    return { connected: true };
  }
  health.error = error || 'denied';
  return { error: health.error };
}

/** «Mit Google verbinden»: the server gives Google's login page; back to the page «Fitbit». */
export async function connect({ c = call, loc = globalThis.location } = {}) {
  health.error = '';
  try {
    const { url } = await c('start', { method: 'POST', body: { returnTo: `${loc.origin}${loc.pathname}${FITBIT_HASH}` } });
    loc.href = url;
    return url;
  } catch (err) {
    health.error = err?.code ?? 'network';
    return null;
  }
}

/** «Trennen»: Google forgets the access; the values already in the app stay (they can be deleted). */
export async function disconnect({ removeDays = false, db = appDb, c = call } = {}) {
  health.error = '';
  try {
    await c('disconnect', { method: 'POST' });
  } catch (err) {
    if (err?.code !== 'unauthorized') {
      health.error = err?.code ?? 'network';
      return false;
    }
  }
  await savePrefs(db, { connected: false });
  if (removeDays) await db.healthDays.clear();
  return true;
}
