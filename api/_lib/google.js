/**
 * Google Health (server package with E3, Noah 12.10.2026 «b server zuerst»): read Noah's daily
 * values (sleep, steps, resting heart rate, HRV) from the Google Health API v4, the successor of
 * the Fitbit Web API. Observation only: no score, no diagnosis. Read only.
 *
 * Functions (thin files that only call makeHandler):
 *   api/google/index.js     POST ?step=start      Bearer <device key>, { returnTo } → { url }
 *                           GET  ?step=status     Bearer → { connected, scopes }
 *                           GET  ?step=data       Bearer, &type=<one of TYPES>&pageToken=… → { points, next }
 *                           GET  ?step=days       Bearer, &from=YYYY-MM-DD&to=YYYY-MM-DD (≤ 90 days)
 *                                                 → { days: [{ date, restingHr, hrvMs, sleep, steps, azm }] }
 *                                                 (googledays.js; the app keeps them, the server keeps none)
 *                           POST ?step=disconnect Bearer → { ok } (Google access withdrawn)
 *   api/google/callback.js  GET  (Google sends the browser back here; the redirect URI configured in
 *                           Google Cloud is https://packgen-three.vercel.app/api/google/callback)
 *
 * The device key comes from the Strava login (api/strava.js): only Noah's devices can connect Google.
 * Environment (values only in the Vercel project «packgen»): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
 * Redis: google:tokens (JSON). While the Google app is in testing mode a refresh token ends after
 * 7 days; then the data step answers 401 google_login_needed and the app asks for a new login.
 */
import { route, json, needStore, redisEnv, pick, ApiError, API_BASE } from './core.js';
import { needDevice, saveState, takeState, backToApp, jsonBody } from './oauth.js';
import { MAX_DAYS, spanDays, rollUpBody, listFilter, daysFrom } from './googledays.js';

export const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
export const API = 'https://health.googleapis.com/v4/users/me';
export const CALLBACK = `${API_BASE}/api/google/callback`;
export const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
];
/** The data types tested with Noah's account on 12.10.2026 (all 200 OK). */
export const TYPES = ['sleep', 'steps', 'daily-resting-heart-rate', 'daily-heart-rate-variability', 'active-zone-minutes'];
/** Pages per list call in the days step (a night or a day is one point; 90 days fit in one page). */
const MAX_PAGES = 5;

export function googleEnv(e = process.env) {
  return { clientId: pick('GOOGLE_CLIENT_ID', e), clientSecret: pick('GOOGLE_CLIENT_SECRET', e), ...redisEnv(e) };
}

export function makeHandler({ env = () => googleEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now() } = {}) {
  const setUp = (cfg) => {
    if (!cfg.clientId || !cfg.clientSecret) throw new ApiError(503, 'not_set_up', 'Google is not set up on the server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).');
  };

  async function tokenCall(cfg, params) {
    let res;
    try {
      res = await doFetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...params }).toString(),
      });
    } catch {
      throw new ApiError(502, 'google_unreachable', 'Google could not be reached.');
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.access_token) {
      if (res.status === 400 || res.status === 401) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
      throw new ApiError(502, 'google_error', 'Google answered with an error.');
    }
    return body;
  }

  async function accessToken(cfg, store) {
    const raw = await store.get('google:tokens');
    if (!raw) throw new ApiError(409, 'not_connected', 'Google is not connected.');
    const t = JSON.parse(raw);
    if ((t.expires_at ?? 0) - 60_000 > now()) return t.access_token;
    if (!t.refresh_token) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
    const fresh = await tokenCall(cfg, { grant_type: 'refresh_token', refresh_token: t.refresh_token });
    await store.set('google:tokens', JSON.stringify({ ...t, access_token: fresh.access_token, expires_at: now() + (Number(fresh.expires_in) || 3600) * 1000 }));
    return fresh.access_token;
  }

  /** One call to the Health API; Google's errors become the app's error codes. */
  async function healthCall(token, path, init = {}) {
    let res;
    try {
      res = await doFetch(`${API}/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) } });
    } catch {
      throw new ApiError(502, 'google_unreachable', 'Google could not be reached.');
    }
    if (res.status === 401) throw new ApiError(401, 'google_login_needed', 'Google needs a new login.');
    if (res.status === 429) throw new ApiError(429, 'google_busy', 'Google allows only a few requests right now. Try again later.');
    if (!res.ok) throw new ApiError(502, 'google_error', 'Google answered with an error.');
    return res.json().catch(() => ({}));
  }

  /** Every data point of one type for the days from..to (a few pages at most). */
  async function listAll(token, type, from, to) {
    const out = [];
    let pageToken = '';
    for (let i = 0; i < MAX_PAGES; i++) {
      const q = new URLSearchParams({ filter: listFilter(type, from, to), pageSize: '200', ...(pageToken ? { pageToken } : {}) });
      const body = await healthCall(token, `dataTypes/${type}/dataPoints?${q}`);
      out.push(...(body.dataPoints ?? []));
      pageToken = body.nextPageToken ?? '';
      if (!pageToken) break;
    }
    return out;
  }

  const rollUp = async (token, type, from, to) =>
    (await healthCall(token, `dataTypes/${type}/dataPoints:dailyRollUp`, { method: 'POST', body: JSON.stringify(rollUpBody(from, to)) })).rollupDataPoints ?? [];

  const callback = async (request) => {
    const url = new URL(request.url);
    const cfg = env();
    const store = needStore(cfg, doFetch);
    setUp(cfg);
    const st = await takeState(store, 'google', url.searchParams.get('state'));
    if (!st) return backToApp(null, { google: 'error', error: 'expired' });
    if (url.searchParams.get('error') || !url.searchParams.get('code')) return backToApp(st.returnTo, { google: 'error', error: 'denied' });
    const tok = await tokenCall(cfg, { grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: CALLBACK });
    const granted = String(tok.scope ?? '').split(' ');
    if (!SCOPES.some((s) => granted.includes(s))) return backToApp(st.returnTo, { google: 'error', error: 'scope' });
    await store.set('google:tokens', JSON.stringify({ access_token: tok.access_token, refresh_token: tok.refresh_token ?? null, expires_at: now() + (Number(tok.expires_in) || 3600) * 1000, scope: granted.join(' ') }));
    return backToApp(st.returnTo, { google: 'connected' });
  };

  const main = route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        await needDevice(request, store);
        setUp(cfg);
        if (step === 'status') {
          const raw = await store.get('google:tokens');
          return json(request, 200, { ok: true, connected: !!raw, scopes: raw ? JSON.parse(raw).scope ?? '' : '' });
        }
        if (step === 'data') {
          const type = url.searchParams.get('type');
          if (!TYPES.includes(type)) throw new ApiError(400, 'bad_request', `type must be one of ${TYPES.join(', ')}.`);
          const pageToken = url.searchParams.get('pageToken');
          if (pageToken && !/^[\w.~-]{1,2000}$/.test(pageToken)) throw new ApiError(400, 'bad_request', 'Bad pageToken.');
          const token = await accessToken(cfg, store);
          const body = await healthCall(token, `dataTypes/${type}/dataPoints${pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ''}`);
          return json(request, 200, { ok: true, type, points: body.dataPoints ?? [], next: body.nextPageToken ?? null });
        }
        if (step === 'days') {
          const from = url.searchParams.get('from');
          const to = url.searchParams.get('to');
          const n = spanDays(from, to);
          if (!n || n > MAX_DAYS) throw new ApiError(400, 'bad_request', `from and to must be days (YYYY-MM-DD), at most ${MAX_DAYS} days apart.`);
          const token = await accessToken(cfg, store);
          // One after the other: Google allows only a few requests at once.
          const steps = await rollUp(token, 'steps', from, to);
          const azm = await rollUp(token, 'active-zone-minutes', from, to);
          const sleep = await listAll(token, 'sleep', from, to);
          const rhr = await listAll(token, 'daily-resting-heart-rate', from, to);
          const hrv = await listAll(token, 'daily-heart-rate-variability', from, to);
          return json(request, 200, { ok: true, from, to, days: daysFrom({ steps, azm, sleep, rhr, hrv }, from, to) });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },

      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        await needDevice(request, store);
        if (step === 'start') {
          setUp(cfg);
          const body = await jsonBody(request);
          const state = await saveState(store, 'google', { returnTo: typeof body.returnTo === 'string' ? body.returnTo.slice(0, 500) : null });
          const q = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: CALLBACK, response_type: 'code', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', scope: SCOPES.join(' '), state });
          return json(request, 200, { ok: true, url: `${AUTHORIZE_URL}?${q}` });
        }
        if (step === 'disconnect') {
          const raw = await store.get('google:tokens');
          if (raw) {
            const t = JSON.parse(raw);
            try {
              await doFetch(REVOKE_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: t.refresh_token || t.access_token }).toString() });
            } catch {
              // Google unreachable: the server forgets the tokens anyway.
            }
          }
          await store.del('google:tokens');
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'google',
  );

  return { main, callback: route({ GET: callback }, 'google-callback') };
}
