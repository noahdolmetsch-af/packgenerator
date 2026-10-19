// E3 server package: api/strava.js and api/_lib/google.js with a fake environment, a fake Redis,
// a fake Strava and a fake Google. Fictional values only (no real id, key, token or secret).
import { describe, it, expect, vi } from 'vitest';
import { makeHandler as stravaHandler, trimActivity, AUTHORIZE_URL, TOKEN_URL, API, DEAUTH_URL, SCOPE } from '../api/strava.js';
import { makeHandler as googleHandler, TOKEN_URL as G_TOKEN, API as G_API, SCOPES, TYPES, DRIVE_SCOPE, DRIVE_API, DRIVE_UPLOAD, DRIVE_MAX_BYTES, cleanName } from '../api/_lib/google.js';
import { safeReturn, hash, KEYS, APP_RETURN } from '../api/_lib/oauth.js';
import { CALENDAR_SCOPES, TASKS_SCOPE, CALENDAR_API, TASKS_API } from '../api/_lib/googleplan.js';
import { MAIL_SCOPES, GMAIL_API, fromB64url } from '../api/_lib/googlemail.js';

const REDIS = 'https://redis.example.test';
const ORIGIN = 'http://localhost:5173';
const BASE = 'https://packgen-three.vercel.app';
const NOW = Date.parse('2026-10-12T10:00:00Z');
const sEnv = (over = {}) => () => ({ clientId: '12345', clientSecret: 'secret-test-not-real', allowedAthlete: '', redisUrl: REDIS, redisToken: 'redis-test', ...over });
const gEnv = (over = {}) => () => ({ clientId: 'g-client-test', clientSecret: 'g-secret-test-not-real', redisUrl: REDIS, redisToken: 'redis-test', ...over });

/** A tiny Redis (the commands the server uses) plus routes for everything else. */
function world(routes = {}) {
  const kv = {};
  const sets = {};
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, v] = JSON.parse(init.body);
      const r = (result) => Response.json({ result });
      if (cmd === 'GET') return r(kv[k] ?? null);
      if (cmd === 'SET') return (kv[k] = v), r('OK');
      if (cmd === 'GETDEL') {
        const old = kv[k] ?? null;
        delete kv[k];
        return r(old);
      }
      if (cmd === 'DEL') return delete kv[k], delete sets[k], r(1);
      if (cmd === 'SADD') return (sets[k] ??= new Set()).add(v), r(1);
      if (cmd === 'SISMEMBER') return r(sets[k]?.has(v) ? 1 : 0);
      throw new Error(`redis ${cmd}`);
    }
    calls.push({ url: String(url), init });
    const key = Object.keys(routes).find((p) => String(url).startsWith(p));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    return routes[key](String(url), init);
  });
  return { kv, sets, calls, doFetch };
}
const get = (path, { key, origin = ORIGIN } = {}) => new Request(`${BASE}${path}`, { headers: { origin, ...(key ? { authorization: `Bearer ${key}` } : {}) } });
const post = (path, body = {}, { key, origin = ORIGIN } = {}) => new Request(`${BASE}${path}`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify(body) });
const fragment = (res) => new URLSearchParams(res.headers.get('location').split('#')[1].split('?').slice(1).join('?'));

const stravaToken = (over = {}) => () => Response.json({ access_token: 'acc-1', refresh_token: 'ref-1', expires_at: NOW / 1000 + 6 * 3600, athlete: { id: 4242 }, ...over });

/** Log in once: start, then the callback with the state Strava would send back. Returns the device key. */
async function connect(h, w, { scope = 'read,activity:read_all,profile:read_all', returnTo = 'https://noahdolmetsch-af.github.io/packgenerator/#/bikes?tab=care&view=strava' } = {}) {
  const start = await (await h(post('/api/strava?step=start', { returnTo }))).json();
  const state = new URL(start.url).searchParams.get('state');
  const res = await h(get(`/api/strava?step=callback&code=code-1&scope=${scope}&state=${state}`));
  return res;
}

describe('Strava login', () => {
  it('start points to the Strava login with the read scopes and a state', async () => {
    const w = world();
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const body = await (await h(post('/api/strava?step=start', {}))).json();
    const u = new URL(body.url);
    expect(`${u.origin}${u.pathname}`).toBe(AUTHORIZE_URL);
    expect(u.searchParams.get('scope')).toBe(SCOPE);
    expect(u.searchParams.get('redirect_uri')).toBe(`${BASE}/api/strava?step=callback`);
    expect(u.searchParams.get('state')).toMatch(/^[\w-]{20,}$/);
  });

  it('the callback saves the tokens, locks the owner and gives the device a key in the fragment', async () => {
    const w = world({ [TOKEN_URL]: stravaToken() });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const res = await connect(h, w);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/^https:\/\/noahdolmetsch-af\.github\.io\/packgenerator\/#\/bikes\?tab=care&view=strava&strava=connected&key=/);
    const key = fragment(res).get('key');
    expect(w.sets[KEYS].has(hash(key))).toBe(true);
    expect(w.kv['strava:athlete']).toBe('4242');
    expect(JSON.parse(w.kv['strava:tokens']).refresh_token).toBe('ref-1');
    // the code goes to Strava with the secret, never back to the app
    expect(JSON.parse(w.calls[0].init.body)).toMatchObject({ grant_type: 'authorization_code', code: 'code-1', client_secret: 'secret-test-not-real' });
    expect(res.headers.get('location')).not.toMatch(/acc-1|ref-1|secret/);
  });

  it('a state works once only, and an unknown one is refused', async () => {
    const w = world({ [TOKEN_URL]: stravaToken() });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const start = await (await h(post('/api/strava?step=start', {}))).json();
    const state = new URL(start.url).searchParams.get('state');
    await h(get(`/api/strava?step=callback&code=c&scope=activity:read_all&state=${state}`));
    const again = await h(get(`/api/strava?step=callback&code=c&scope=activity:read_all&state=${state}`));
    expect(fragment(again).get('error')).toBe('expired');
    expect(fragment(await h(get('/api/strava?step=callback&code=c&state=forged'))).get('strava')).toBe('error');
  });

  it('another athlete cannot take over the server', async () => {
    const w = world({ [TOKEN_URL]: stravaToken({ athlete: { id: 9999 } }) });
    w.kv['strava:athlete'] = '4242';
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const res = await connect(h, w);
    expect(fragment(res).get('error')).toBe('other_athlete');
    expect(w.sets[KEYS]).toBeUndefined();
  });

  it('without the activity scope or when denied, nothing is saved', async () => {
    const w = world({ [TOKEN_URL]: stravaToken() });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    expect(fragment(await connect(h, w, { scope: 'read' })).get('error')).toBe('scope');
    const start = await (await h(post('/api/strava?step=start', {}))).json();
    const state = new URL(start.url).searchParams.get('state');
    expect(fragment(await h(get(`/api/strava?step=callback&error=access_denied&state=${state}`))).get('error')).toBe('denied');
    expect(w.kv['strava:tokens']).toBeUndefined();
  });

  it('returns only into the app', () => {
    expect(safeReturn('https://evil.example/x')).toBe(APP_RETURN);
    expect(safeReturn('javascript:alert(1)')).toBe(APP_RETURN);
    expect(safeReturn('http://localhost:5173/#/bikes?tab=care&strava=connected&key=old')).toBe('http://localhost:5173/#/bikes?tab=care');
  });
});

describe('Strava data', () => {
  const activity = { id: 111, name: 'Abendrunde', sport_type: 'GravelRide', start_date: '2026-10-11T16:00:00Z', start_date_local: '2026-10-11T18:00:00Z', distance: 42345, total_elevation_gain: 512.4, moving_time: 6000, elapsed_time: 6300, gear_id: 'b100', device_name: 'Garmin Edge 540', commute: false, trainer: false, has_heartrate: true, average_heartrate: 141.6, max_heartrate: 172, map: { polyline: 'secret-route' }, start_latlng: [46.98765, 7.45678], end_latlng: [46.91234, 7.41234] };

  it('needs a device key', async () => {
    const w = world();
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    expect((await h(get('/api/strava?step=activities'))).status).toBe(401);
    expect((await h(get('/api/strava?step=activities', { key: 'made-up' }))).status).toBe(401);
  });

  it('gives the rides trimmed (no route, no map) and pages through', async () => {
    const w = world({ [TOKEN_URL]: stravaToken(), [`${API}/athlete/activities`]: () => Response.json([activity]) });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(h, w)).get('key');
    const body = await (await h(get('/api/strava?step=activities&after=1700000000&page=2', { key }))).json();
    expect(body).toMatchObject({ ok: true, page: 2, more: false });
    expect(body.activities[0]).toEqual({ id: '111', name: 'Abendrunde', type: 'GravelRide', start: '2026-10-11T16:00:00Z', startLocal: '2026-10-11T18:00:00Z', km: 42.3, hm: 512, movingS: 6000, elapsedS: 6300, gearId: 'b100', device: 'Garmin Edge 540', commute: false, trainer: false, hrAvg: 142, hrMax: 172, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: null, tempAvg: null, wNorm: null, kj: null, effort: null, spot: '47.0,7.5' });
    expect(JSON.stringify(body)).not.toMatch(/secret-route/);
    // «Velo-Inspektion» 3a: only the start to about 10 km, never the exact point or the end
    expect(JSON.stringify(body)).not.toMatch(/46\.98|7\.45|46\.91|7\.41/);
    const call = w.calls.find((c) => c.url.startsWith(`${API}/athlete/activities`));
    expect(call.url).toContain('page=2');
    expect(call.url).toContain('after=1700000000');
    expect(call.init.headers.Authorization).toBe('Bearer acc-1');
    expect((await h(get('/api/strava?step=activities&page=x', { key }))).status).toBe(400);
  });

  it('refreshes an ended access token before asking Strava', async () => {
    const w = world({ [TOKEN_URL]: stravaToken({ access_token: 'acc-2', refresh_token: 'ref-2' }), [`${API}/athlete`]: () => Response.json({ firstname: 'Testfahrer', bikes: [{ id: 'b100', name: 'Gravel Blau', distance: 1234567, primary: true, retired: false }] }) });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(h, w)).get('key');
    w.kv['strava:tokens'] = JSON.stringify({ access_token: 'old', refresh_token: 'ref-1', expires_at: NOW / 1000 - 10 });
    const body = await (await h(get('/api/strava?step=gear', { key }))).json();
    expect(body.bikes).toEqual([{ id: 'b100', name: 'Gravel Blau', km: 1235, primary: true, retired: false }]);
    expect(JSON.parse(w.kv['strava:tokens']).access_token).toBe('acc-2');
    expect(w.calls.at(-1).init.headers.Authorization).toBe('Bearer acc-2');
  });

  it('says clearly when Strava is busy (rate limit)', async () => {
    const w = world({ [TOKEN_URL]: stravaToken(), [`${API}/athlete/activities`]: () => new Response('', { status: 429 }) });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(h, w)).get('key');
    const res = await h(get('/api/strava?step=activities', { key }));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('strava_busy');
  });

  it('passes Strava\'s request numbers along (BF8 «Gratis-Grenzen»), also with a 429', async () => {
    const headers = { 'X-RateLimit-Limit': '200,2000', 'X-RateLimit-Usage': '170,400', 'X-ReadRateLimit-Limit': '100,1000', 'X-ReadRateLimit-Usage': '90,400' };
    const w = world({ [TOKEN_URL]: stravaToken(), [`${API}/athlete/activities`]: () => Response.json([], { headers }) });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(h, w)).get('key');
    const body = await (await h(get('/api/strava?step=activities', { key }))).json();
    expect(body.rate).toEqual({ limit: [200, 2000], usage: [170, 400], readLimit: [100, 1000], readUsage: [90, 400] });
    const busy = world({ [TOKEN_URL]: stravaToken(), [`${API}/athlete/activities`]: () => new Response('', { status: 429, headers }) });
    const h2 = stravaHandler({ env: sEnv(), doFetch: busy.doFetch, now: () => NOW });
    const key2 = fragment(await connect(h2, busy)).get('key');
    const res = await (await h2(get('/api/strava?step=activities', { key: key2 }))).json();
    expect(res).toMatchObject({ code: 'strava_busy', rate: { usage: [170, 400] } });
  });

  it('disconnect withdraws access and forgets the tokens, the device key stays', async () => {
    const w = world({ [TOKEN_URL]: stravaToken(), [DEAUTH_URL]: () => Response.json({}) });
    const h = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(h, w)).get('key');
    expect((await h(post('/api/strava?step=disconnect', {}, { key }))).status).toBe(200);
    expect(w.calls.some((c) => c.url === DEAUTH_URL)).toBe(true);
    expect(w.kv['strava:tokens']).toBeUndefined();
    expect((await (await h(get('/api/strava?step=status', { key }))).json()).connected).toBe(false);
  });

  it('trimActivity rounds km to one decimal and falls back to type', () => {
    expect(trimActivity({ id: 1, type: 'Ride', distance: 999 })).toMatchObject({ id: '1', type: 'Ride', km: 1, gearId: null });
  });

  it('answers 503 when Strava is not set up', async () => {
    const w = world();
    const h = stravaHandler({ env: sEnv({ clientId: '' }), doFetch: w.doFetch, now: () => NOW });
    expect((await (await h(post('/api/strava?step=start', {}))).json()).code).toBe('not_set_up');
  });
});

describe('Google Health', () => {
  const gToken = (over = {}) => () => Response.json({ access_token: 'g-acc', refresh_token: 'g-ref', expires_in: 3600, scope: SCOPES.join(' '), ...over });
  async function setup(routes = {}) {
    const w = world({ [TOKEN_URL]: stravaToken(), [G_TOKEN]: gToken(), ...routes });
    const s = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(s, w)).get('key');
    const { main, callback } = googleHandler({ env: gEnv(), doFetch: w.doFetch, now: () => NOW });
    return { w, key, main, callback };
  }
  async function connectGoogle({ main, callback, key }) {
    const start = await (await main(post('/api/google?step=start', { returnTo: 'http://localhost:5173/#/me' }, { key }))).json();
    const state = new URL(start.url).searchParams.get('state');
    return callback(get(`/api/google/callback?code=g-code&state=${state}`));
  }

  it('only a connected device can start the Google login', async () => {
    const t = await setup();
    expect((await t.main(post('/api/google?step=start', {}))).status).toBe(401);
    const body = await (await t.main(post('/api/google?step=start', {}, { key: t.key }))).json();
    const u = new URL(body.url);
    expect(u.searchParams.get('access_type')).toBe('offline');
    expect(u.searchParams.get('redirect_uri')).toBe(`${BASE}/api/google/callback`);
    expect(u.searchParams.get('scope').split(' ')).toEqual(SCOPES);
  });

  it('the callback stores the tokens and returns to the app', async () => {
    const t = await setup();
    const res = await connectGoogle(t);
    expect(res.headers.get('location')).toBe('http://localhost:5173/#/me?google=connected');
    expect(JSON.parse(t.w.kv['google:tokens']).refresh_token).toBe('g-ref');
    const sent = new URLSearchParams(t.w.calls.find((c) => c.url === G_TOKEN).init.body);
    expect(sent.get('redirect_uri')).toBe(`${BASE}/api/google/callback`);
  });

  it('gives the data points of an allowed type with the next page token', async () => {
    const t = await setup({ [`${G_API}/dataTypes/sleep/dataPoints`]: () => Response.json({ dataPoints: [{ sleep: { summary: { minutesAsleep: 420 } } }], nextPageToken: 'p2' }) });
    await connectGoogle(t);
    const body = await (await t.main(get('/api/google?step=data&type=sleep', { key: t.key }))).json();
    expect(body).toMatchObject({ ok: true, type: 'sleep', next: 'p2' });
    expect(body.points[0].sleep.summary.minutesAsleep).toBe(420);
    expect((await t.main(get('/api/google?step=data&type=location', { key: t.key }))).status).toBe(400);
    expect(TYPES).toContain('daily-heart-rate-variability');
  });

  it('a refresh token that ended (testing mode, 7 days) asks for a new login', async () => {
    const t = await setup();
    await connectGoogle(t);
    t.w.kv['google:tokens'] = JSON.stringify({ access_token: 'old', refresh_token: 'g-ref', expires_at: NOW - 1 });
    const { main } = googleHandler({ env: gEnv(), doFetch: vi.fn(async (url, init) => (url === G_TOKEN ? Response.json({ error: 'invalid_grant' }, { status: 400 }) : t.w.doFetch(url, init))), now: () => NOW });
    const res = await main(get('/api/google?step=data&type=steps', { key: t.key }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('google_login_needed');
  });
  it('gives one row per day from the roll-ups and the daily summaries (fictional values)', async () => {
    const d = (day) => ({ year: 2026, month: 10, day });
    const roll = { steps: [{ civilStartTime: { date: d(13) }, steps: { countSum: '8123' } }], azm: [{ civilStartTime: { date: d(13) }, activeZoneMinutes: { sumInFatBurnHeartZone: '10', sumInCardioHeartZone: '12', sumInPeakHeartZone: '2' } }] };
    const t = await setup({
      [`${G_API}/dataTypes/steps/dataPoints:dailyRollUp`]: () => Response.json({ rollupDataPoints: roll.steps }),
      [`${G_API}/dataTypes/active-zone-minutes/dataPoints:dailyRollUp`]: () => Response.json({ rollupDataPoints: roll.azm }),
      [`${G_API}/dataTypes/sleep/dataPoints`]: () => Response.json({ dataPoints: [{ sleep: { metadata: { mainSleep: true }, interval: { civilStartTime: { date: d(12), time: { hours: 22, minutes: 40 } }, civilEndTime: { date: d(13), time: { hours: 6, minutes: 5 } } }, summary: { minutesAsleep: '400', minutesAwake: '45', minutesInSleepPeriod: '445', stagesSummary: [{ type: 'DEEP', minutes: '60' }] } } }] }),
      [`${G_API}/dataTypes/daily-resting-heart-rate/dataPoints`]: () => Response.json({ dataPoints: [{ dailyRestingHeartRate: { date: d(13), beatsPerMinute: '50' } }] }),
      [`${G_API}/dataTypes/daily-heart-rate-variability/dataPoints`]: () => Response.json({ dataPoints: [{ dailyHeartRateVariability: { date: d(13), averageHeartRateVariabilityMilliseconds: 61.24 } }] }),
    });
    await connectGoogle(t);
    const body = await (await t.main(get('/api/google?step=days&from=2026-10-12&to=2026-10-13', { key: t.key }))).json();
    expect(body.days).toEqual([{ date: '2026-10-13', steps: 8123, azm: 24, restingHr: 50, hrvMs: 61.2, sleep: { asleepMin: 400, awakeMin: 45, start: '22:40', end: '06:05', deepMin: 60, remMin: null, lightMin: null, efficiency: 90 } }]);
    const rollCall = t.w.calls.find((c) => c.url.endsWith('steps/dataPoints:dailyRollUp'));
    expect(JSON.parse(rollCall.init.body)).toMatchObject({ windowSizeDays: 1, range: { start: { date: d(12) }, end: { date: d(14) } }, dataSourceFamily: 'users/me/dataSourceFamilies/google-wearables' });
    const rhrCall = t.w.calls.find((c) => c.url.includes('daily-resting-heart-rate'));
    expect(new URL(rhrCall.url).searchParams.get('filter')).toBe('daily_resting_heart_rate.date >= "2026-10-12" AND daily_resting_heart_rate.date < "2026-10-14"');
  });

  it('refuses a days range that is wrong or longer than 90 days', async () => {
    const t = await setup();
    await connectGoogle(t);
    for (const q of ['from=2026-10-13&to=2026-10-12', 'from=2026-01-01&to=2026-10-12', 'from=x&to=2026-10-12']) {
      expect((await t.main(get(`/api/google?step=days&${q}`, { key: t.key }))).status).toBe(400);
    }
  });
});

describe('Google Drive (Dokumente-PDF)', () => {
  const gToken = () => () => Response.json({ access_token: 'g-acc', refresh_token: 'g-ref', expires_in: 3600, scope: [...SCOPES, DRIVE_SCOPE].join(' ') });
  // A tiny fake Drive: folders by name and parent, uploaded files with their parents.
  function fakeDrive() {
    const items = {};
    let n = 0;
    const handle = async (url, init = {}) => {
      const u = new URL(url);
      if (url.startsWith(DRIVE_UPLOAD)) {
        const text = await new Response(init.body).text();
        const meta = JSON.parse(text.split('\r\n\r\n')[1].split('\r\n')[0]);
        const id = `file${++n}xx`;
        items[id] = { ...meta, id };
        return Response.json({ id, webViewLink: `https://drive.example.test/${id}` });
      }
      const id = u.pathname.split('/files/')[1];
      if (!id && init.method === 'POST') {
        const meta = JSON.parse(init.body);
        const fid = `folder${++n}xx`;
        items[fid] = { ...meta, id: fid };
        return Response.json({ id: fid });
      }
      if (!id) {
        const q = u.searchParams.get('q');
        const [, name] = q.match(/name = '([^']+)'/);
        const [, parent] = q.match(/'([^']+)' in parents/);
        return Response.json({ files: Object.values(items).filter((f) => f.name === name && f.parents?.includes(parent) && f.mimeType?.includes('folder')) });
      }
      if (!items[id]) return new Response('{}', { status: 404 });
      if (init.method === 'PATCH') {
        Object.assign(items[id], JSON.parse(init.body || '{}'));
        const add = u.searchParams.get('addParents');
        if (add) items[id].parents = [add];
        return Response.json({ id });
      }
      return Response.json({ parents: items[id].parents });
    };
    return { items, handle };
  }
  async function setup() {
    const d = fakeDrive();
    const w = world({ [TOKEN_URL]: stravaToken(), [G_TOKEN]: gToken(), [DRIVE_UPLOAD]: d.handle, [DRIVE_API]: d.handle });
    const s = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(s, w)).get('key');
    const { main, callback } = googleHandler({ env: gEnv(), doFetch: w.doFetch, now: () => NOW });
    const start = await (await main(post('/api/google?step=start', { services: ['drive'] }, { key }))).json();
    expect(new URL(start.url).searchParams.get('scope')).toBe(DRIVE_SCOPE);
    await callback(get(`/api/google/callback?code=g-code&state=${new URL(start.url).searchParams.get('state')}`));
    return { w, d, key, main };
  }
  const upload = (q, bytes, { key, type = 'application/pdf' } = {}) => new Request(`${BASE}/api/google?step=drive-upload&${q}`, { method: 'POST', headers: { origin: ORIGIN, 'content-type': type, ...(key ? { authorization: `Bearer ${key}` } : {}) }, body: bytes });

  it('asks only for drive.file, and the status says Drive is allowed', async () => {
    const t = await setup();
    const st = await (await t.main(get('/api/google?step=status', { key: t.key }))).json();
    expect(st).toMatchObject({ connected: true, drive: true });
  });

  it('puts a PDF in «Importierte PDF» and a group in its own subfolder, folders made once', async () => {
    const t = await setup();
    const a = await (await t.main(upload('name=Quittung%20Muster&root=pdf&group=', new Uint8Array([37, 80, 68, 70]), { key: t.key }))).json();
    expect(a.ok).toBe(true);
    const top = Object.values(t.d.items).find((f) => f.name === 'Importierte PDF');
    expect(top.parents).toEqual(['root']);
    expect(t.d.items[a.id]).toMatchObject({ name: 'Quittung Muster', parents: [top.id], mimeType: 'application/pdf' });
    const b = await (await t.main(upload('name=Garantie&root=pdf&group=Garantien', new Uint8Array([1]), { key: t.key }))).json();
    const sub = Object.values(t.d.items).find((f) => f.name === 'Garantien');
    expect(sub.parents).toEqual([top.id]);
    expect(t.d.items[b.id].parents).toEqual([sub.id]);
    const c = await (await t.main(upload('name=Foto&root=photos&group=', new Uint8Array([1]), { key: t.key, type: 'image/jpeg' }))).json();
    expect(t.d.items[t.d.items[c.id].parents[0]].name).toBe('Importierte Fotos');
    expect(Object.values(t.d.items).filter((f) => f.name === 'Importierte PDF')).toHaveLength(1);
  });

  it('moves a file to another group and renames it', async () => {
    const t = await setup();
    const a = await (await t.main(upload('name=Brief&root=pdf', new Uint8Array([1]), { key: t.key }))).json();
    expect((await t.main(post('/api/google?step=drive-move', { fileId: a.id, root: 'pdf', group: 'Versicherung' }, { key: t.key }))).status).toBe(200);
    expect(t.d.items[t.d.items[a.id].parents[0]].name).toBe('Versicherung');
    expect((await t.main(post('/api/google?step=drive-rename', { fileId: a.id, name: 'Brief Versicherung' }, { key: t.key }))).status).toBe(200);
    expect(t.d.items[a.id].name).toBe('Brief Versicherung');
    expect((await t.main(post('/api/google?step=drive-move', { fileId: '../x', group: 'a' }, { key: t.key }))).status).toBe(400);
  });

  it('refuses other devices, other types and files over 4 MB', async () => {
    const t = await setup();
    expect((await t.main(upload('name=a', new Uint8Array([1])))).status).toBe(401);
    expect((await t.main(upload('name=a', new Uint8Array([1]), { key: t.key, type: 'text/html' }))).status).toBe(415);
    expect((await t.main(upload('name=a', new Uint8Array(DRIVE_MAX_BYTES + 1), { key: t.key }))).status).toBe(413);
  });

  it('cleanName keeps names Drive accepts', () => {
    expect(cleanName(' Brief/2026\nMuster ')).toBe('Brief 2026 Muster');
    expect(cleanName('', 'Dokument')).toBe('Dokument');
  });
});

describe('Google Kalender und Aufgaben (GA)', () => {
  const gToken = () => () => Response.json({ access_token: 'g-acc', refresh_token: 'g-ref', expires_in: 3600, scope: [...SCOPES, ...CALENDAR_SCOPES, TASKS_SCOPE].join(' ') });
  // A tiny fake Calendar and Tasks: fictional entries only.
  function fakePlan() {
    const events = {
      primary: [
        { id: 'ev1', summary: 'Zahnarzt Muster', start: { dateTime: '2026-10-13T08:30:00+02:00' }, end: { dateTime: '2026-10-13T09:15:00+02:00' }, htmlLink: 'https://calendar.example.test/ev1' },
        { id: 'ev2', summary: 'Jura-Wochenende', start: { date: '2026-10-17' }, end: { date: '2026-10-19' } },
        { id: 'ev3', status: 'cancelled', start: { date: '2026-10-14' } },
      ],
    };
    const lists = { 'list-a': [{ id: 't1', title: 'Kette messen', due: '2026-10-14T00:00:00.000Z', status: 'needsAction' }] };
    const seen = [];
    let n = 0;
    const handle = async (url, init = {}) => {
      const u = new URL(url);
      seen.push({ method: init.method ?? 'GET', path: u.pathname, q: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : null });
      const p = u.pathname;
      if (p.endsWith('/users/me/calendarList')) return Response.json({ items: [{ id: 'primary@example.test', summary: 'Noah Muster', primary: true, accessRole: 'owner', backgroundColor: '#4a90d9' }, { id: 'feiertage@example.test', summary: 'Feiertage', accessRole: 'reader' }] });
      let m = p.match(/\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/);
      if (m) {
        const c = decodeURIComponent(m[1]);
        if (c === 'forbidden') return new Response('{}', { status: 403 });
        if (init.method === 'POST') return Response.json({ id: `new${++n}`, ...JSON.parse(init.body) });
        if (init.method === 'PATCH') return Response.json({ id: m[2], ...JSON.parse(init.body) });
        if (init.method === 'DELETE') return new Response(null, { status: 204 });
        return Response.json({ items: events[c] ?? [] });
      }
      if (p.endsWith('/users/@me/lists')) return Response.json({ items: [{ id: 'list-a', title: 'Meine Aufgaben' }] });
      m = p.match(/\/lists\/([^/]+)\/tasks(?:\/([^/]+))?$/);
      if (m) {
        if (init.method === 'POST') return Response.json({ id: `nt${++n}`, status: 'needsAction', ...JSON.parse(init.body) });
        if (init.method === 'PATCH') return Response.json({ id: m[2], title: 'Kette messen', ...JSON.parse(init.body) });
        if (init.method === 'DELETE') return new Response(null, { status: 204 });
        return Response.json({ items: u.searchParams.get('showCompleted') === 'false' ? lists[decodeURIComponent(m[1])] ?? [] : [] });
      }
      return new Response('{}', { status: 404 });
    };
    return { handle, seen };
  }
  async function setup() {
    const f = fakePlan();
    const w = world({ [TOKEN_URL]: stravaToken(), [G_TOKEN]: gToken(), [CALENDAR_API]: f.handle, [TASKS_API]: f.handle });
    const s = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(s, w)).get('key');
    const { main, callback } = googleHandler({ env: gEnv(), doFetch: w.doFetch, now: () => NOW });
    const start = await (await main(post('/api/google?step=start', { services: ['calendar', 'tasks'] }, { key }))).json();
    expect(new URL(start.url).searchParams.get('scope').split(' ')).toEqual([...CALENDAR_SCOPES, TASKS_SCOPE]);
    await callback(get(`/api/google/callback?code=g-code&state=${new URL(start.url).searchParams.get('state')}`));
    return { f, key, main };
  }

  it('asks for calendar and tasks only, and the status says both are allowed', async () => {
    const t = await setup();
    expect(await (await t.main(get('/api/google?step=status', { key: t.key }))).json()).toMatchObject({ connected: true, calendar: true, tasks: true, drive: false });
  });

  it('lists the calendars and the events of a span, in Zurich days, without cancelled ones', async () => {
    const t = await setup();
    const cals = await (await t.main(get('/api/google?step=cal-list', { key: t.key }))).json();
    expect(cals.calendars).toEqual([
      { id: 'primary@example.test', name: 'Noah Muster', color: '#4a90d9', primary: true, write: true },
      { id: 'feiertage@example.test', name: 'Feiertage', color: null, primary: false, write: false },
    ]);
    const res = await (await t.main(get('/api/google?step=cal-events&from=2026-10-12&to=2026-10-18', { key: t.key }))).json();
    expect(res.events.map((e) => [e.id, e.day, e.lastDay, e.allDay])).toEqual([
      ['primary|ev1', '2026-10-13', '2026-10-13', false],
      ['primary|ev2', '2026-10-17', '2026-10-18', true],
    ]);
    const q = t.f.seen.find((x) => x.path.includes('/events')).q;
    expect(q).toMatchObject({ timeMin: '2026-10-12T00:00:00+02:00', timeMax: '2026-10-19T00:00:00+02:00', singleEvents: 'true' });
    expect((await t.main(get('/api/google?step=cal-events&from=2026-10-12&to=2027-03-01', { key: t.key }))).status).toBe(400);
    expect((await t.main(get('/api/google?step=cal-events&from=2026-10-12&to=2026-10-13&cal=../x', { key: t.key }))).status).toBe(400);
    const no = await t.main(get('/api/google?step=cal-events&from=2026-10-12&to=2026-10-13&cal=forbidden', { key: t.key }));
    expect([no.status, (await no.json()).code]).toEqual([403, 'calendar_not_allowed']);
  });

  it('makes, changes and deletes an event', async () => {
    const t = await setup();
    const made = await (await t.main(post('/api/google?step=cal-save', { title: 'Tennis-Lektion', day: '2026-10-20', allDay: false, from: '18:00', to: '19:00', where: 'Halle Muster' }, { key: t.key }))).json();
    expect(made.event).toMatchObject({ cal: 'primary', title: 'Tennis-Lektion', allDay: false, where: 'Halle Muster' });
    expect(t.f.seen.at(-1)).toMatchObject({ method: 'POST', body: { start: { dateTime: '2026-10-20T18:00:00', timeZone: 'Europe/Zurich' }, end: { dateTime: '2026-10-20T19:00:00', timeZone: 'Europe/Zurich' } } });
    await t.main(post('/api/google?step=cal-save', { gid: made.event.gid, title: 'Ferien', day: '2026-12-24', lastDay: '2026-12-31' }, { key: t.key }));
    expect(t.f.seen.at(-1)).toMatchObject({ method: 'PATCH', body: { start: { date: '2026-12-24' }, end: { date: '2027-01-01' } } });
    expect((await t.main(post('/api/google?step=cal-delete', { gid: made.event.gid }, { key: t.key }))).status).toBe(200);
    expect((await t.main(post('/api/google?step=cal-save', { title: '', day: '2026-10-20' }, { key: t.key }))).status).toBe(400);
    expect((await t.main(post('/api/google?step=cal-delete', {}, { key: t.key }))).status).toBe(400);
  });

  it('lists task lists and tasks, adds, ticks and deletes a task', async () => {
    const t = await setup();
    expect((await (await t.main(get('/api/google?step=task-lists', { key: t.key }))).json()).lists).toEqual([{ id: 'list-a', title: 'Meine Aufgaben' }]);
    const all = await (await t.main(get('/api/google?step=tasks', { key: t.key }))).json();
    expect(all.tasks).toEqual([expect.objectContaining({ id: 't1', list: 'list-a', title: 'Kette messen', due: '2026-10-14', done: false })]);
    const add = await (await t.main(post('/api/google?step=task-save', { list: 'list-a', title: 'Druck erfassen', due: '2026-10-16' }, { key: t.key }))).json();
    expect(add.task).toMatchObject({ title: 'Druck erfassen', due: '2026-10-16', done: false });
    expect(t.f.seen.at(-1).body).toEqual({ title: 'Druck erfassen', due: '2026-10-16T00:00:00.000Z' });
    const tick = await (await t.main(post('/api/google?step=task-save', { list: 'list-a', id: 't1', done: true }, { key: t.key }))).json();
    expect(tick.task.done).toBe(true);
    expect(t.f.seen.at(-1)).toMatchObject({ method: 'PATCH', body: { status: 'completed' } });
    expect((await t.main(post('/api/google?step=task-delete', { list: 'list-a', id: 't1' }, { key: t.key }))).status).toBe(200);
    expect((await t.main(post('/api/google?step=task-save', { list: 'list-a' }, { key: t.key }))).status).toBe(400);
    expect((await t.main(post('/api/google?step=task-save', { list: 'list-a', title: 'x', due: '16.10.2026' }, { key: t.key }))).status).toBe(400);
  });

  it('refuses other devices', async () => {
    const t = await setup();
    expect((await t.main(get('/api/google?step=tasks'))).status).toBe(401);
    expect((await t.main(post('/api/google?step=cal-save', { title: 'x', day: '2026-10-20' }))).status).toBe(401);
  });
});

describe('Google Mail (GM)', () => {
  const gToken = () => () => Response.json({ access_token: 'g-acc', refresh_token: 'g-ref', expires_in: 3600, scope: MAIL_SCOPES.join(' ') });
  const b64 = (s) => Buffer.from(s, 'utf8').toString('base64url');
  const msgs = {
    m1: { id: 'm1', threadId: 'th1', labelIds: ['INBOX', 'UNREAD'], snippet: 'Dein Velo ist bereit', internalDate: String(Date.parse('2026-10-12T08:00:00Z')), payload: { headers: [{ name: 'From', value: 'Veloladen Muster <info@veloladen.example.test>' }, { name: 'Subject', value: 'Velo-Service fertig' }, { name: 'Message-ID', value: '<abc@example.test>' }], mimeType: 'multipart/mixed', parts: [{ mimeType: 'text/plain', body: { data: b64('Grüezi\nDein Velo ist bereit.') } }, { filename: 'Rechnung.pdf', mimeType: 'application/pdf', body: { size: 12000 } }] } },
    m2: { id: 'm2', threadId: 'th2', labelIds: ['INBOX'], snippet: 'Lektion morgen', internalDate: String(Date.parse('2026-10-11T08:00:00Z')), payload: { headers: [{ name: 'From', value: 'tennis@example.test' }, { name: 'Subject', value: 'Tennis' }], mimeType: 'text/html', body: { data: b64('<p>Lektion&nbsp;morgen</p><style>x{}</style>') } } },
  };
  function fakeGmail() {
    const seen = [];
    const handle = async (url, init = {}) => {
      const u = new URL(url);
      seen.push({ method: init.method ?? 'GET', path: u.pathname, q: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : null });
      if (u.pathname.endsWith('/messages/send')) return Response.json({ id: 'sent1' });
      if (u.pathname.endsWith('/messages')) return Response.json({ messages: [{ id: 'm1' }, { id: 'm2' }], nextPageToken: '12345' });
      const id = u.pathname.split('/').pop();
      return msgs[id] ? Response.json(msgs[id]) : new Response('{}', { status: 404 });
    };
    return { seen, handle };
  }
  async function setup() {
    const f = fakeGmail();
    const w = world({ [TOKEN_URL]: stravaToken(), [G_TOKEN]: gToken(), [GMAIL_API]: f.handle });
    const s = stravaHandler({ env: sEnv(), doFetch: w.doFetch, now: () => NOW });
    const key = fragment(await connect(s, w)).get('key');
    const { main, callback } = googleHandler({ env: gEnv(), doFetch: w.doFetch, now: () => NOW });
    const start = await (await main(post('/api/google?step=start', { services: ['mail'] }, { key }))).json();
    expect(new URL(start.url).searchParams.get('scope').split(' ')).toEqual(MAIL_SCOPES);
    await callback(get(`/api/google/callback?code=g-code&state=${new URL(start.url).searchParams.get('state')}`));
    return { f, key, main };
  }

  it('the status says mail is allowed; the inbox lists mails with sender, subject and unread', async () => {
    const t = await setup();
    expect(await (await t.main(get('/api/google?step=status', { key: t.key }))).json()).toMatchObject({ mail: true, calendar: false });
    const res = await (await t.main(get('/api/google?step=mail-list', { key: t.key }))).json();
    expect(res.next).toBe('12345');
    expect(res.mails.map((m) => [m.id, m.fromName, m.from, m.subject, m.unread])).toEqual([
      ['m1', 'Veloladen Muster', 'info@veloladen.example.test', 'Velo-Service fertig', true],
      ['m2', 'tennis@example.test', 'tennis@example.test', 'Tennis', false],
    ]);
    expect(t.f.seen[0].q).toMatchObject({ q: 'in:inbox', maxResults: '20' });
    await t.main(get('/api/google?step=mail-list&q=Velo-Service&page=12345', { key: t.key }));
    expect(t.f.seen.filter((x) => x.path.endsWith('/messages')).at(-1).q).toMatchObject({ q: 'Velo-Service', pageToken: '12345' });
    expect((await t.main(get('/api/google?step=mail-list&page=x%20y', { key: t.key }))).status).toBe(400);
  });

  it('reads one mail as text, with its attachments by name', async () => {
    const t = await setup();
    const a = (await (await t.main(get('/api/google?step=mail-get&id=m1', { key: t.key }))).json()).mail;
    expect(a).toMatchObject({ subject: 'Velo-Service fertig', text: 'Grüezi\nDein Velo ist bereit.', files: [{ name: 'Rechnung.pdf', size: 12000 }] });
    expect((await (await t.main(get('/api/google?step=mail-get&id=m2', { key: t.key }))).json()).mail.text).toBe('Lektion morgen');
    expect((await t.main(get('/api/google?step=mail-get&id=../x', { key: t.key }))).status).toBe(400);
  });

  it('sends a new mail and an answer in its thread', async () => {
    const t = await setup();
    const res = await (await t.main(post('/api/google?step=mail-send', { to: 'Velo Muster <info@veloladen.example.test>', subject: 'Termin Grüezi', text: 'Passt Donnerstag?' }, { key: t.key }))).json();
    expect(res.id).toBe('sent1');
    const raw = fromB64url(t.f.seen.at(-1).body.raw);
    expect(raw).toContain('To: Velo Muster <info@veloladen.example.test>');
    expect(raw).toContain(`Subject: =?UTF-8?B?${Buffer.from('Termin Grüezi').toString('base64')}?=`);
    await t.main(post('/api/google?step=mail-send', { to: 'info@veloladen.example.test', subject: 'Re: Velo-Service fertig', text: 'Danke!', replyTo: 'm1' }, { key: t.key }));
    const last = t.f.seen.at(-1);
    expect(last.body.threadId).toBe('th1');
    expect(fromB64url(last.body.raw)).toContain('In-Reply-To: <abc@example.test>');
  });

  it('refuses wrong addresses, an empty text, header tricks and other devices', async () => {
    const t = await setup();
    const send = (b, key = t.key) => t.main(post('/api/google?step=mail-send', b, { key }));
    expect((await send({ to: 'kein-mail', text: 'x' })).status).toBe(400);
    expect((await send({ to: 'a@example.test', text: '  ' })).status).toBe(400);
    expect((await send({ to: '', text: 'x' })).status).toBe(400);
    await send({ to: 'a@example.test', subject: 'Hallo\r\nBcc: b@example.test', text: 'x' });
    expect(fromB64url(t.f.seen.at(-1).body.raw)).not.toMatch(/\r\nBcc:/);
    expect((await t.main(post('/api/google?step=mail-send', { to: 'a@example.test', text: 'x' }))).status).toBe(401);
  });
});
