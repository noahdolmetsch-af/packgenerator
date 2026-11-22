/**
 * Paket B «Server», der Wächter (Noah 18.10.2026 20:34 «3a und b»): is the small
 * server still fine? GET /api/health answers one line per check, never a value of a key or token.
 * .github/workflows/waechter.yml asks every day and opens a GitHub issue (a mail to Noah) on a «fail».
 *
 *   { ok, at, cached, checks: [{ id, state: 'ok'|'fail'|'skip', code, note }] }   200 when ok, else 503
 *
 * Checks:
 *   env           the variables of the guide (names only: which are missing)
 *   upstash       PING
 *   strava        a token refresh, only when Strava is connected (the new tokens are kept)
 *   google        a token refresh, only when Google is connected
 *   sync          the automatic sync's storage (sync:<space>:n): how many paired spaces; skip without one
 *   push          the reminders: with a phone signed up, cron-job.org must have woken the server lately
 *   tagesgrenze   Paket R: the daily cap (daycap.js). fail «cap_reached» when today or yesterday reached a cap
 *                 (the server then said «tomorrow again»; nothing cost money), else today's calls of the total
 *
 * The answer is kept 10 minutes (health:last), so calling it often costs nothing and asks nobody.
 * A check that throws counts as fail with code 'error', never with the error's text; one that takes longer
 * than CHECK_TIMEOUT_MS counts as fail with code 'timeout'. The checks run at the same time.
 */
import { pick, redis, redisEnv, REDIS_ENV } from './core.js';
import { dayUsage, dayOf } from './daycap.js';

export const CACHE_KEY = 'health:last';
export const CACHE_S = 10 * 60;
export const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
/** With a phone signed up, a tick older than this means cron-job.org stopped. */
export const TICK_LATE_MS = 30 * 60 * 1000;

/** The variables anleitung.md Teil 2 names (each a list: the first set name counts). */
export const ENV_NAMES = [
  ['STRAVA_CLIENT_ID'],
  ['STRAVA_CLIENT_SECRET'],
  ['GOOGLE_CLIENT_ID'],
  ['GOOGLE_CLIENT_SECRET'],
  REDIS_ENV.url,
  REDIS_ENV.token,
];

export function healthEnv(e = process.env) {
  return {
    present: ENV_NAMES.map((names) => [names[0], !!pick(names, e)]),
    strava: { clientId: pick('STRAVA_CLIENT_ID', e), clientSecret: pick('STRAVA_CLIENT_SECRET', e) },
    google: { clientId: pick('GOOGLE_CLIENT_ID', e), clientSecret: pick('GOOGLE_CLIENT_SECRET', e) },
    ...redisEnv(e),
  };
}

const ok = (id, note = '', code = 'ok') => ({ id, state: 'ok', code, note });
const fail = (id, code, note = '') => ({ id, state: 'fail', code, note });
const skip = (id, code, note = '') => ({ id, state: 'skip', code, note });

export function makeChecks({ cfg, store, doFetch, now }) {
  return {
    env: async () => {
      const missing = cfg.present.filter(([, set]) => !set).map(([n]) => n);
      return missing.length ? fail('env', 'missing', `Es fehlt: ${missing.join(', ')}`) : ok('env', `${cfg.present.length} Variablen da`);
    },
    upstash: async () => {
      if (!store) return fail('upstash', 'not_set_up', 'Kein Speicher verbunden.');
      return (await store.cmd('PING')) === 'PONG' ? ok('upstash') : fail('upstash', 'error', 'Keine Antwort auf PING.');
    },
    strava: async () => {
      if (!cfg.strava.clientId || !cfg.strava.clientSecret) return skip('strava', 'not_set_up');
      if (!store) return skip('strava', 'no_storage');
      const raw = await store.get('strava:tokens');
      if (!raw) return skip('strava', 'not_connected');
      const t = JSON.parse(raw);
      const res = await doFetch(STRAVA_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: cfg.strava.clientId, client_secret: cfg.strava.clientSecret, grant_type: 'refresh_token', refresh_token: t.refresh_token }) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.access_token) return fail('strava', res.status === 400 || res.status === 401 ? 'login_needed' : 'error', 'Strava braucht eine neue Anmeldung.');
      await store.set('strava:tokens', JSON.stringify({ ...t, access_token: body.access_token, refresh_token: body.refresh_token ?? t.refresh_token, expires_at: body.expires_at ?? t.expires_at }));
      return ok('strava');
    },
    google: async () => {
      if (!cfg.google.clientId || !cfg.google.clientSecret) return skip('google', 'not_set_up');
      if (!store) return skip('google', 'no_storage');
      const raw = await store.get('google:tokens');
      if (!raw) return skip('google', 'not_connected');
      const t = JSON.parse(raw);
      if (!t.refresh_token) return fail('google', 'login_needed', 'Google braucht eine neue Anmeldung.');
      const res = await doFetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: cfg.google.clientId, client_secret: cfg.google.clientSecret, grant_type: 'refresh_token', refresh_token: t.refresh_token }).toString() });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.access_token) return fail('google', res.status === 400 || res.status === 401 ? 'login_needed' : 'error', 'Google braucht eine neue Anmeldung.');
      await store.set('google:tokens', JSON.stringify({ ...t, access_token: body.access_token, expires_at: now() + (Number(body.expires_in) || 3600) * 1000 }));
      return ok('google');
    },
    sync: async () => {
      if (!store) return skip('sync', 'no_storage');
      let cursor = '0';
      let n = 0;
      for (let i = 0; i < 20; i++) {
        const [next, keys] = (await store.cmd('SCAN', cursor, 'MATCH', 'sync:*:n', 'COUNT', 500)) ?? ['0', []];
        n += (keys ?? []).length;
        cursor = String(next);
        if (cursor === '0') break;
      }
      return n ? ok('sync', `${n} gekoppelt`) : skip('sync', 'not_paired');
    },
    push: async () => {
      if (!store) return skip('push', 'no_storage');
      const phones = Number(await store.cmd('SCARD', 'push:devs')) || 0;
      if (!phones) return skip('push', 'no_phone');
      const last = Number(await store.get('push:lasttick')) || 0;
      if (!last) return fail('push', 'no_tick', 'cron-job.org hat den Server noch nie geweckt.');
      const ago = now() - last;
      return ago > TICK_LATE_MS ? fail('push', 'tick_late', `Letzter Weckruf vor ${Math.round(ago / 60000)} Minuten.`) : ok('push', `${phones} Handy`);
    },
    tagesgrenze: async () => {
      if (!store) return skip('tagesgrenze', 'no_storage');
      const today = await dayUsage(store, dayOf(now()));
      const before = await dayUsage(store, dayOf(now() - 86_400_000));
      const hit = today.over.length ? today : before.over.length ? before : null;
      if (hit) return fail('tagesgrenze', 'cap_reached', `Tagesgrenze erreicht am ${hit.day}: ${hit.over.join(', ')}. Der Server sagte «morgen wieder», es kostete nichts.`);
      return ok('tagesgrenze', `${today.total} von ${today.limit} Aufrufen heute`);
    },
  };
}

/** One check may take this long. Before 26.10.2026 a hanging outside service held the whole answer until
 * Vercel stopped it after 300 s, so the Wächter saw «no answer» (issues #239, #249) and never which check hung. */
export const CHECK_TIMEOUT_MS = 15_000;
/** Run every check at the same time, each on its own: one failing or hanging never stops the others. */
export async function runHealth({ cfg, store, doFetch, now, checkTimeoutMs = CHECK_TIMEOUT_MS }) {
  const checks = makeChecks({ cfg, store, doFetch, now });
  const out = await Promise.all(Object.entries(checks).map(async ([id, fn]) => {
    let timer;
    const late = new Promise((resolve) => {
      const secs = Math.round(checkTimeoutMs / 1000);
      const slow = fail(id, 'timeout', `Keine Antwort innerhalb ${secs} Sekunden.`);
      timer = setTimeout(() => resolve(slow), checkTimeoutMs);
    });
    try {
      return await Promise.race([fn(), late]);
    } catch {
      return fail(id, 'error', 'Die Prüfung ging nicht.');
    } finally {
      clearTimeout(timer);
    }
  }));
  return { ok: out.every((c) => c.state !== 'fail'), at: new Date(now()).toISOString(), checks: out };
}

export function makeHealth({ env = () => healthEnv(), doFetch = (...a) => fetch(...a), now = () => Date.now(), checkTimeoutMs = CHECK_TIMEOUT_MS } = {}) {
  return async function health() {
    const cfg = env();
    const store = redis(cfg, doFetch);
    if (store) {
      const hit = await store.get(CACHE_KEY).catch(() => null);
      if (hit) {
        try {
          return { ...JSON.parse(hit), cached: true };
        } catch {
          /* a broken cache: run again */
        }
      }
    }
    const result = await runHealth({ cfg, store, doFetch, now, checkTimeoutMs });
    if (store) await store.set(CACHE_KEY, JSON.stringify(result), CACHE_S).catch(() => {});
    return { ...result, cached: false };
  };
}
