/**
 * /api/strava (E3 «Strava-Verbindung», mockups S1–S5 approved by Noah 12.10.2026 13:39 Zurich).
 *
 * The app fetches Noah's rides with their Strava bike, so every ride lands on the right bike
 * (Garmin profile → Strava default bike per sport type → app). Read only: the server never writes
 * to Strava. One owner: the first athlete who connects (or ALLOWED_ATHLETE_ID).
 *
 *   POST ?step=start        { returnTo }        → { url } (the Strava login page)
 *   GET  ?step=callback     (Strava sends the browser back here) → 302 into the app with #…&strava=connected&key=…
 *   GET  ?step=status       Bearer <device key> → { connected, athlete, scope }
 *   GET  ?step=gear         Bearer              → { bikes: [{ id, name, km, primary, retired }] }
 *   GET  ?step=activities   Bearer, &after=<unix s>&before=<unix s>&page=1 → { activities, page, more }
 *   POST ?step=disconnect   Bearer              → { ok } (Strava access withdrawn; device keys stay for Google)
 *
 * Environment (names only; values only in the Vercel project «packgen», never in code or chat):
 *   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, optional ALLOWED_ATHLETE_ID, KV_REST_API_URL / KV_REST_API_TOKEN.
 * In the Strava API settings the «Authorization Callback Domain» must be packgen-three.vercel.app.
 *
 * Redis: strava:tokens (JSON, access + refresh token), strava:athlete (owner id), app:keys (device key hashes).
 * Never logged or answered: tokens, codes, the secret.
 */
import { route, json, needStore, redisEnv, pick, ApiError, API_BASE } from './_lib/core.js';
import { needDevice, newDevice, saveState, takeState, backToApp, jsonBody } from './_lib/oauth.js';

export const AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize';
export const TOKEN_URL = 'https://www.strava.com/oauth/token';
export const DEAUTH_URL = 'https://www.strava.com/oauth/deauthorize';
export const API = 'https://www.strava.com/api/v3';
/** read_all on activities: private rides and commutes count for the bikes too; profile:read_all: the bike list. */
export const SCOPE = 'read,profile:read_all,activity:read_all';
export const CALLBACK = `${API_BASE}/api/strava?step=callback`;
const PER_PAGE = 200; // Strava's maximum; Noah's ~1300 rides are 7 pages

export function stravaEnv(e = process.env) {
  return {
    clientId: pick('STRAVA_CLIENT_ID', e),
    clientSecret: pick('STRAVA_CLIENT_SECRET', e),
    allowedAthlete: pick('ALLOWED_ATHLETE_ID', e),
    ...redisEnv(e),
  };
}

/** A Strava activity as the app's ride needs it (nothing else leaves the server). */
export function trimActivity(a) {
  return {
    id: String(a.id),
    name: a.name ?? '',
    type: a.sport_type || a.type || '',
    start: a.start_date ?? null,
    startLocal: a.start_date_local ?? null,
    km: Math.round((Number(a.distance) || 0) / 100) / 10,
    hm: Math.round(Number(a.total_elevation_gain) || 0),
    movingS: Number(a.moving_time) || 0,
    gearId: a.gear_id ?? null,
    device: a.device_name ?? '',
    commute: !!a.commute,
    trainer: !!a.trainer,
  };
}

export function trimBike(b) {
  return { id: String(b.id), name: b.name ?? '', km: Math.round((Number(b.distance) || 0) / 1000), primary: !!b.primary, retired: !!b.retired };
}

export function makeHandler({ env = () => stravaEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now() } = {}) {
  const setUp = (cfg) => {
    if (!cfg.clientId || !cfg.clientSecret) throw new ApiError(503, 'not_set_up', 'Strava is not set up on the server (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET).');
  };

  async function tokenCall(cfg, params) {
    let res;
    try {
      res = await doFetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...params }) });
    } catch {
      throw new ApiError(502, 'strava_unreachable', 'Strava could not be reached.');
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.access_token) {
      if (res.status === 400 || res.status === 401) throw new ApiError(401, 'strava_login_needed', 'Strava needs a new login.');
      throw new ApiError(502, 'strava_error', 'Strava answered with an error.');
    }
    return body;
  }

  /** A valid access token, refreshed when it ends within a minute. */
  async function accessToken(cfg, store) {
    const raw = await store.get('strava:tokens');
    if (!raw) throw new ApiError(409, 'not_connected', 'Strava is not connected.');
    const t = JSON.parse(raw);
    if ((t.expires_at ?? 0) * 1000 - 60_000 > now()) return t.access_token;
    const fresh = await tokenCall(cfg, { grant_type: 'refresh_token', refresh_token: t.refresh_token });
    await store.set('strava:tokens', JSON.stringify({ access_token: fresh.access_token, refresh_token: fresh.refresh_token ?? t.refresh_token, expires_at: fresh.expires_at, scope: t.scope }));
    return fresh.access_token;
  }

  async function stravaGet(cfg, store, path) {
    const token = await accessToken(cfg, store);
    let res;
    try {
      res = await doFetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new ApiError(502, 'strava_unreachable', 'Strava could not be reached.');
    }
    if (res.status === 429) throw new ApiError(429, 'strava_busy', 'Strava allows only a few requests per 15 minutes. Try again later.');
    if (res.status === 401) throw new ApiError(401, 'strava_login_needed', 'Strava needs a new login.');
    if (!res.ok) throw new ApiError(502, 'strava_error', 'Strava answered with an error.');
    return res.json();
  }

  const int = (v, min, max) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };

  return route(
    {
      GET: async (request) => {
        const url = new URL(request.url);
        const step = url.searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);

        if (step === 'callback') {
          setUp(cfg);
          const st = await takeState(store, 'strava', url.searchParams.get('state'));
          if (!st) return backToApp(null, { strava: 'error', error: 'expired' });
          if (url.searchParams.get('error') || !url.searchParams.get('code')) return backToApp(st.returnTo, { strava: 'error', error: 'denied' });
          const granted = (url.searchParams.get('scope') ?? '').split(',');
          if (!granted.includes('activity:read_all') && !granted.includes('activity:read')) return backToApp(st.returnTo, { strava: 'error', error: 'scope' });
          const tok = await tokenCall(cfg, { grant_type: 'authorization_code', code: url.searchParams.get('code') });
          const athlete = String(tok.athlete?.id ?? '');
          const owner = cfg.allowedAthlete || (await store.get('strava:athlete'));
          if (!athlete || (owner && owner !== athlete)) return backToApp(st.returnTo, { strava: 'error', error: 'other_athlete' });
          if (!owner) await store.set('strava:athlete', athlete);
          await store.set('strava:tokens', JSON.stringify({ access_token: tok.access_token, refresh_token: tok.refresh_token, expires_at: tok.expires_at, scope: granted.join(',') }));
          const key = await newDevice(store);
          return backToApp(st.returnTo, { strava: 'connected', key });
        }

        await needDevice(request, store);
        setUp(cfg);
        if (step === 'status') {
          const raw = await store.get('strava:tokens');
          if (!raw) return json(request, 200, { ok: true, connected: false });
          const me = await stravaGet(cfg, store, '/athlete');
          return json(request, 200, { ok: true, connected: true, athlete: { firstname: me.firstname ?? '' }, scope: JSON.parse(raw).scope ?? '' });
        }
        if (step === 'gear') {
          const me = await stravaGet(cfg, store, '/athlete');
          return json(request, 200, { ok: true, bikes: (me.bikes ?? []).map(trimBike) });
        }
        if (step === 'activities') {
          const p = url.searchParams;
          const page = int(p.get('page') ?? '1', 1, 500);
          const after = p.has('after') ? int(p.get('after'), 0, 4e9) : null;
          const before = p.has('before') ? int(p.get('before'), 0, 4e9) : null;
          if (page == null || (p.has('after') && after == null) || (p.has('before') && before == null)) throw new ApiError(400, 'bad_request', 'page, after and before must be whole numbers (after/before in Unix seconds).');
          const q = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
          if (after != null) q.set('after', String(after));
          if (before != null) q.set('before', String(before));
          const list = await stravaGet(cfg, store, `/athlete/activities?${q}`);
          const arr = Array.isArray(list) ? list : [];
          return json(request, 200, { ok: true, page, more: arr.length === PER_PAGE, activities: arr.map(trimActivity) });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },

      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        if (step === 'start') {
          setUp(cfg);
          const body = await jsonBody(request);
          const state = await saveState(store, 'strava', { returnTo: typeof body.returnTo === 'string' ? body.returnTo.slice(0, 500) : null });
          const q = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: CALLBACK, response_type: 'code', approval_prompt: 'auto', scope: SCOPE, state });
          return json(request, 200, { ok: true, url: `${AUTHORIZE_URL}?${q}` });
        }
        if (step === 'disconnect') {
          await needDevice(request, store);
          const raw = await store.get('strava:tokens');
          if (raw) {
            try {
              const token = await accessToken(cfg, store);
              await doFetch(DEAUTH_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            } catch {
              // Strava unreachable or already withdrawn: the server forgets everything anyway.
            }
          }
          // Device keys stay: they also open Google; a new Strava login reconnects.
          await store.del('strava:tokens');
          return json(request, 200, { ok: true });
        }
        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'strava',
  );
}

const handler = makeHandler();
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
