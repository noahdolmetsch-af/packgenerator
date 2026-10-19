/**
 * E3 «Strava-Verbindung» + Google Health (server package, Noah 12.10.2026 «b server zuerst»):
 * the parts both connections share.
 *
 * - Device keys: after a successful Strava login the server gives this device a random key
 *   (shown to the app once, in the URL fragment). Only its SHA-256 is stored, in the Redis set
 *   app:keys. Every data call sends it as «Authorization: Bearer <key>». A second device (the phone)
 *   gets its own key by logging in once more with the same Strava account.
 * - Login state: a random value per login (10 minutes, used once) against forged callbacks; it
 *   also remembers where in the app to come back to.
 * - The owner lock: the first Strava athlete who connects owns the server (or ALLOWED_ATHLETE_ID).
 *
 * Tokens of Strava and Google live only in Redis on the server, never in the app or the repo.
 */
import { createHash, randomBytes } from 'node:crypto';
import { ApiError, APP_ORIGIN } from './core.js';

export const KEYS = 'app:keys';
export const STATE_TTL = 10 * 60;
/** Where the app lives; a return path must start here (or be a local/preview app for development). */
export const APP_URL = `${APP_ORIGIN}/packgenerator/`;
/** The app page a login returns to when none (or a foreign one) was given: Velo › Pflege › Strava. */
export const APP_RETURN = `${APP_URL}#/bikes?tab=care&view=strava`;

export const hash = (s) => createHash('sha256').update(String(s)).digest('hex');
export const randomKey = (bytes = 32) => randomBytes(bytes).toString('base64url');

export function bearer(request) {
  const m = /^Bearer\s+(\S{1,400})$/.exec(request.headers.get('authorization') ?? '');
  return m ? m[1] : null;
}

/** The device key of this request must be one the server gave out; else 401. */
export async function needDevice(request, store) {
  const key = bearer(request);
  if (!key) throw new ApiError(401, 'unauthorized', 'This device is not connected yet.');
  const ok = Number(await store.cmd('SISMEMBER', KEYS, hash(key))) === 1;
  if (!ok) throw new ApiError(401, 'unauthorized', 'This device is not connected (any more). Connect again.');
  return key;
}

/** A new device key: stored as hash, returned once. */
export async function newDevice(store) {
  const key = randomKey();
  await store.cmd('SADD', KEYS, hash(key));
  return key;
}

/** Only back into the app: GitHub Pages, a packgen preview or localhost. Anything else → the app. */
export function safeReturn(url) {
  try {
    const u = new URL(String(url ?? ''));
    const ok = u.href.startsWith(APP_URL) || /^https:\/\/packgen(?:-[a-z0-9-]+)?\.vercel\.app$/.test(u.origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(u.origin);
    if (!ok) return APP_RETURN;
    const frag = u.hash.replace(/[?&](strava|google|konto|trello|key|error)=.*$/, '');
    return `${u.origin}${u.pathname}${u.search}${frag || '#/bikes?tab=care&view=strava'}`;
  } catch {
    return APP_RETURN;
  }
}

/** Save a login state (10 minutes, once) and return its value. */
export async function saveState(store, kind, data) {
  const state = randomKey(18);
  await store.set(`oauth:state:${hash(state)}`, JSON.stringify({ kind, ...data }), STATE_TTL);
  return state;
}

/** Read and delete a login state; null when unknown, used or of another kind (kind null: any kind). */
export async function takeState(store, kind, state) {
  if (!state || String(state).length > 100) return null;
  const k = `oauth:state:${hash(state)}`;
  const raw = await store.cmd('GETDEL', k);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return kind == null || data.kind === kind ? data : null;
  } catch {
    return null;
  }
}

/** Back to the app after a login: the result goes into the fragment (never sent to any server). */
export function backToApp(returnTo, params) {
  const base = safeReturn(returnTo);
  const frag = new URLSearchParams(params).toString();
  const sep = base.includes('?', base.indexOf('#')) ? '&' : '?';
  return new Response(null, { status: 302, headers: { Location: `${base}${sep}${frag}`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

/** Read a JSON body of at most `max` characters. */
export async function jsonBody(request, max = 20_000) {
  const text = await request.text();
  if (text.length > max) throw new ApiError(413, 'too_large', 'The request is too large.');
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    throw new ApiError(400, 'bad_request', 'The body is not JSON.');
  }
}
