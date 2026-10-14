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
 *   GET  ?step=zones        Bearer              → { hr: [{ min, max }], custom } (Training TR, Noah 13.10.2026 «1-5a»)
 *   GET  ?step=detail       Bearer, &id=<activity id> → { kcal, hist, curve, w20 } (the heart rate per second as a
 *                           histogram { bpm: seconds }, a short curve [[minute, bpm]] and the best 20 minutes of
 *                           power from a power meter; never the route)
 *   POST ?step=disconnect   Bearer              → { ok } (Strava access withdrawn; device keys stay for Google)
 *
 * BF8 «Gratis-Grenzen» (Noah 13.10.2026): every answer after a call to Strava carries `rate`, Strava's
 * request numbers from its headers (X-RateLimit-* and X-ReadRateLimit-*, "15 min,day"), also with a 429.
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
import { rateOf } from './_lib/rate.js';

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
    elapsedS: Number(a.elapsed_time) || 0,
    gearId: a.gear_id ?? null,
    device: a.device_name ?? '',
    commute: !!a.commute,
    trainer: !!a.trainer,
    hrAvg: a.has_heartrate === false || !Number(a.average_heartrate) ? null : Math.round(Number(a.average_heartrate)),
    hrMax: a.has_heartrate === false || !Number(a.max_heartrate) ? null : Math.round(Number(a.max_heartrate)),
    // power (Noah 13.10.2026 «a»): Ø and max watts; device false = Strava's estimate (no max then)
    wAvg: Number(a.average_watts) > 0 ? Math.round(Number(a.average_watts)) : null,
    wMax: Number(a.max_watts) > 0 ? Math.round(Number(a.max_watts)) : null,
    wDevice: !!a.device_watts,
    // tour look back (Noah 13.10.2026 «alle, DGS1 bis DGS5», «a und b»): speed in km/h, cadence and
    // temperature only with a sensor, NP and kJ only from a power meter, Relative Effort from heart rate
    spdAvg: Number(a.average_speed) > 0 ? Math.round(Number(a.average_speed) * 36) / 10 : null,
    spdMax: Number(a.max_speed) > 0 ? Math.round(Number(a.max_speed) * 36) / 10 : null,
    cad: Number(a.average_cadence) > 0 ? Math.round(Number(a.average_cadence)) : null,
    tempAvg: a.average_temp == null || !Number.isFinite(Number(a.average_temp)) ? null : Math.round(Number(a.average_temp)),
    wNorm: a.device_watts && Number(a.weighted_average_watts) > 0 ? Math.round(Number(a.weighted_average_watts)) : null,
    kj: a.device_watts && Number(a.kilojoules) > 0 ? Math.round(Number(a.kilojoules)) : null,
    effort: Number(a.suffer_score) > 0 ? Math.round(Number(a.suffer_score)) : null,
  };
}

/** Strava's heart rate zones: the upper bounds in order, the last open (max -1). */
export function trimZones(z) {
  const list = Array.isArray(z?.heart_rate?.zones) ? z.heart_rate.zones : [];
  return { hr: list.map((x) => ({ min: Math.round(Number(x.min) || 0), max: Number.isFinite(Number(x.max)) ? Math.round(Number(x.max)) : -1 })), custom: !!z?.heart_rate?.custom_zones };
}

const CURVE_POINTS = 120;
/**
 * The heart rate of one activity, reduced: seconds per beat (for the zones, so a changed zone needs
 * no new call) and at most CURVE_POINTS averages for the chart. Nothing about the route.
 */
/**
 * The best 20 minutes of power in watts: the highest average over 1200 moving seconds (a gap of more
 * than 30 s is a pause and does not count). null when the ride has no power stream or is shorter.
 */
/** Power per moving second (a gap of more than 30 s is a pause and does not count). */
function powerSeconds(time, watts) {
  if (!Array.isArray(time) || !Array.isArray(watts) || watts.length < 2) return [];
  const sec = [];
  for (let i = 0; i < watts.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (!(dt > 0 && dt <= 30)) continue;
    const w = Math.max(0, Number(watts[i]) || 0);
    for (let k = 0; k < dt; k++) sec.push(w);
  }
  return sec;
}

/** The highest average over `span` seconds, or null when the ride is shorter. */
function bestOver(sec, span) {
  if (sec.length < span) return null;
  let sum = 0;
  for (let i = 0; i < span; i++) sum += sec[i];
  let best = sum;
  for (let i = span; i < sec.length; i++) {
    sum += sec[i] - sec[i - span];
    if (sum > best) best = sum;
  }
  return Math.round(best / span);
}

/**
 * The best 20 minutes of power in watts: the highest average over 1200 moving seconds (a gap of more
 * than 30 s is a pause and does not count). null when the ride has no power stream or is shorter.
 */
export function best20(time, watts, span = 1200) {
  return bestOver(powerSeconds(time, watts), span);
}

/** The power curve: the best average for each of these spans in seconds (null when too short). */
export const POWER_SPANS = [5, 60, 300, 1200, 3600];
export const POWER_BIN = 10;

/** Power, reduced: seconds per 10 W (for the power zones, so a new FTP needs no new call) and the curve. */
export function trimPower(time, watts) {
  const sec = powerSeconds(time, watts);
  if (!sec.length) return { pHist: null, pCurve: null };
  const pHist = {};
  for (const w of sec) {
    const b = Math.floor(w / POWER_BIN) * POWER_BIN;
    pHist[b] = (pHist[b] ?? 0) + 1;
  }
  return { pHist, pCurve: POWER_SPANS.map((span) => [span, bestOver(sec, span)]) };
}

/** Breaks: stops of at least `min` seconds (Strava's moving flag false, or no data for more than 30 s). */
export function pausesOf(time, moving, min = 60) {
  if (!Array.isArray(time) || time.length < 2) return null;
  const stops = [];
  let run = 0;
  for (let i = 0; i < time.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    if (!(dt > 0)) continue;
    const still = dt > 30 || (Array.isArray(moving) && moving[i] === false);
    if (still) run += dt;
    else if (run) (stops.push(run), (run = 0));
  }
  if (run) stops.push(run);
  const long = stops.filter((x) => x >= min);
  return { n: long.length, secs: long.reduce((a, b) => a + b, 0) };
}

const SEG_MAX = 40;
/** Own segment times and best efforts (runs); personal records (rank 1–3) first. No route, no leaderboards. */
export function trimEfforts(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((e) => ({ name: String(e?.name ?? '').slice(0, 120), s: Math.round(Number(e?.moving_time) || Number(e?.elapsed_time) || 0), pr: [1, 2, 3].includes(e?.pr_rank) ? e.pr_rank : null }))
    .filter((e) => e.name && e.s > 0)
    .sort((a, b) => (a.pr ?? 9) - (b.pr ?? 9))
    .slice(0, SEG_MAX);
}

export function trimStreams(streams) {
  const time = streams?.time?.data;
  const hr = streams?.heartrate?.data;
  const w20 = best20(time, streams?.watts?.data);
  const more = { ...trimPower(time, streams?.watts?.data), pauses: pausesOf(time, streams?.moving?.data) };
  if (!Array.isArray(time) || !Array.isArray(hr) || hr.length < 2) return { hist: null, curve: [], w20, ...more };
  const hist = {};
  for (let i = 0; i < hr.length - 1; i++) {
    const dt = Number(time[i + 1]) - Number(time[i]);
    const b = Math.round(Number(hr[i]));
    if (!(dt > 0 && dt <= 30) || !(b > 0)) continue; // a pause: not counted
    hist[b] = (hist[b] ?? 0) + dt;
  }
  const n = Math.min(CURVE_POINTS, hr.length);
  const curve = [];
  for (let k = 0; k < n; k++) {
    const a = Math.floor((k * hr.length) / n);
    const e = Math.max(a + 1, Math.floor(((k + 1) * hr.length) / n));
    let sum = 0;
    let c = 0;
    for (let i = a; i < e; i++) if (Number(hr[i]) > 0) (sum += Number(hr[i])), c++;
    if (c) curve.push([Math.round(Number(time[a]) / 6) / 10, Math.round(sum / c)]);
  }
  return { hist, curve, w20, ...more };
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

  async function stravaGet(cfg, store, path, ctx = {}) {
    const token = await accessToken(cfg, store);
    let res;
    try {
      res = await doFetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      throw new ApiError(502, 'strava_unreachable', 'Strava could not be reached.');
    }
    const rate = rateOf(res.headers);
    if (rate) ctx.rate = rate;
    if (res.status === 429) throw new ApiError(429, 'strava_busy', 'Strava allows only a few requests per 15 minutes. Try again later.', rate ? { rate } : null);
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
        const ctx = {};
        const withRate = (body) => (ctx.rate ? { ...body, rate: ctx.rate } : body);
        if (step === 'status') {
          const raw = await store.get('strava:tokens');
          if (!raw) return json(request, 200, { ok: true, connected: false });
          const me = await stravaGet(cfg, store, '/athlete', ctx);
          return json(request, 200, withRate({ ok: true, connected: true, athlete: { firstname: me.firstname ?? '' }, scope: JSON.parse(raw).scope ?? '' }));
        }
        if (step === 'gear') {
          const me = await stravaGet(cfg, store, '/athlete', ctx);
          return json(request, 200, withRate({ ok: true, bikes: (me.bikes ?? []).map(trimBike) }));
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
          const list = await stravaGet(cfg, store, `/athlete/activities?${q}`, ctx);
          const arr = Array.isArray(list) ? list : [];
          return json(request, 200, withRate({ ok: true, page, more: arr.length === PER_PAGE, activities: arr.map(trimActivity) }));
        }
        if (step === 'zones') {
          return json(request, 200, { ok: true, ...trimZones(await stravaGet(cfg, store, '/athlete/zones')) });
        }
        if (step === 'detail') {
          const id = url.searchParams.get('id') ?? '';
          if (!/^\d{1,20}$/.test(id)) throw new ApiError(400, 'bad_request', 'id must be an activity number.');
          const one = await stravaGet(cfg, store, `/activities/${id}?include_all_efforts=true`);
          // the streams for the breaks too (moving), so every activity; still two calls in all
          const streams = await stravaGet(cfg, store, `/activities/${id}/streams?keys=time,heartrate,watts,moving&key_by_type=true`);
          const s = trimStreams(streams);
          // power only from a power meter (Strava's estimate has no stream worth a best effort)
          const pm = !!one.device_watts;
          return json(request, 200, { ok: true, id, kcal: Number(one.calories) > 0 ? Math.round(Number(one.calories)) : null, desc: typeof one.description === 'string' ? one.description.trim().slice(0, 2000) : '', ...s, w20: pm ? s.w20 : null, pHist: pm ? s.pHist : null, pCurve: pm ? s.pCurve : null, segs: trimEfforts(one.segment_efforts), best: trimEfforts(one.best_efforts) });
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
