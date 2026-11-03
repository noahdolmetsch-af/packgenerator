/**
 * Paket B «Server», der Wächter (Noah 18.10.2026 20:34 «3a und b», 20:36 «1a» KI-Guthaben): is the small
 * server still fine? GET /api/health answers one line per check, never a value of a key or token.
 * .github/workflows/waechter.yml asks every day and opens a GitHub issue (a mail to Noah) on a «fail».
 *
 *   { ok, at, cached, checks: [{ id, state: 'ok'|'fail'|'skip', code, note }] }   200 when ok, else 503
 *
 * Checks:
 *   env           the variables of the guide (names only: which are missing)
 *   upstash       PING
 *   anthropic     a 1-token answer from the cheapest model: invalid_key, no_credit («credit balance»);
 *                 no call while the helper already knows the credit is empty (helper:credit)
 *   ki-guthaben   fail «KI-Guthaben aufgebraucht» while helper:credit is 'empty' (the helper sets it when
 *                 Anthropic reports no credit and deletes it after the next good answer); else this
 *                 month's estimated spend (helper:spend:YYYY-MM) against the cap (HELPER_MONTHLY_CHF, else
 *                 the helper's own default); skip without a cap or without the helper
 *   strava        a token refresh, only when Strava is connected (the new tokens are kept)
 *   google        a token refresh, only when Google is connected
 *   sync          the automatic sync's storage (sync:<space>:n): how many paired spaces; skip without one
 *   push          the reminders: with a phone signed up, cron-job.org must have woken the server lately
 *   gemini        «Testfrage an die KI» (Noah 20.10.2026 «4a»): one real question to the free Gemini tier, the same
 *                 request the app's «Gemini fragen» sends; ok when an answer comes back. Counts into the day counter.
 *                 skip without GEMINI_API_KEY
 *   abend         «Bereit für morgen?» (Paket 4): the evening request of the helper, built by the helper's own code
 *                 for a fictional tour, checked by Anthropic's free token count (/v1/messages/count_tokens):
 *                 the key, the model and the request's form. Costs nothing (no answer is written).
 *   tagesgrenze   Paket R: the daily cap (daycap.js). fail «cap_reached» when today or yesterday reached a cap
 *                 (the server then said «tomorrow again»; nothing cost money), else today's calls of the total
 *
 * The answer is kept 10 minutes (health:last), so calling it often costs nothing and asks nobody.
 * A check that throws counts as fail with code 'error', never with the error's text; one that takes longer
 * than CHECK_TIMEOUT_MS counts as fail with code 'timeout' (gemini: ok with code 'busy'). The checks run at the same time.
 */
import { pick, redis, redisEnv, REDIS_ENV } from './core.js';
import * as helperLib from './helper.js';
import { dayUsage, dayOf } from './daycap.js';
import { GEMINI_DEFAULT_MODEL, geminiRequest, geminiText, geminiKey, askGeminiModels, geminiFallbacksOf } from '../helper.js';

export const CACHE_KEY = 'health:last';
/** Set by api/helper.js (branch claude/project-thread-sfodh3) to 'empty' while Anthropic reports no credit. */
export const CREDIT_KEY = 'helper:credit';
export const CACHE_S = 10 * 60;
export const MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const COUNT_URL = 'https://api.anthropic.com/v1/messages/count_tokens';
/** The fictional evening before a tour the «abend» check sends (no real data, only invented). */
export const EVENING_SAMPLE = {
  trip: { name: 'Testtour Jura', starts: 'tomorrow', days: 2, tempMin: 5, tempMax: 14, rain: 30 },
  list: [{ name: 'Regenjacke' }, { name: 'Stirnlampe' }],
  parts: [{ name: 'Kette', state: 'due' }],
  learnings: [{ rule: 'Bei 5 °C waren die Handschuhe zu dünn', action: 'Winterhandschuhe einpacken' }],
};
export const CHEAP_MODEL = 'claude-haiku-4-5';
export const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
/** With a phone signed up, a tick older than this means cron-job.org stopped. */
export const TICK_LATE_MS = 30 * 60 * 1000;

/** The variables anleitung.md Teil 2 names (each a list: the first set name counts). */
export const ENV_NAMES = [
  ['ANTHROPIC_API_KEY'],
  ['HELPER_TOKEN'],
  ['HELPER_MONTHLY_CHF'],
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
    apiKey: pick('ANTHROPIC_API_KEY', e),
    helperToken: pick('HELPER_TOKEN', e),
    cap: pick('HELPER_MONTHLY_CHF', e),
    model: pick('HELPER_MODEL', e) || helperLib.DEFAULT_MODEL,
    geminiKey: pick('GEMINI_API_KEY', e),
    geminiModel: pick('GEMINI_MODEL', e) || GEMINI_DEFAULT_MODEL,
    geminiFallbacks: geminiFallbacksOf(pick('GEMINI_FALLBACKS', e)),
    strava: { clientId: pick('STRAVA_CLIENT_ID', e), clientSecret: pick('STRAVA_CLIENT_SECRET', e) },
    google: { clientId: pick('GOOGLE_CLIENT_ID', e), clientSecret: pick('GOOGLE_CLIENT_SECRET', e) },
    ...redisEnv(e),
  };
}

const ok = (id, note = '', code = 'ok') => ({ id, state: 'ok', code, note });
const fail = (id, code, note = '') => ({ id, state: 'fail', code, note });
const skip = (id, code, note = '') => ({ id, state: 'skip', code, note });

/** The month's cap in CHF: HELPER_MONTHLY_CHF, else the helper's default; null when there is none. */
export function capOf(raw, fallback = helperLib.DEFAULT_CAP_CHF) {
  const n = Number(raw);
  if (raw !== '' && raw != null && Number.isFinite(n) && n > 0) return n;
  return Number.isFinite(Number(fallback)) && Number(fallback) > 0 ? Number(fallback) : null;
}
const monthOf = (d) => (typeof helperLib.monthKey === 'function' ? helperLib.monthKey(d) : d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(0, 7));
const spendKeyOf = (m) => (typeof helperLib.spendKey === 'function' ? helperLib.spendKey(m) : `helper:spend:${m}`);

/** Anthropic's answer → the check. A 400 that speaks of the credit balance: no_credit. */
export async function anthropicVerdict(res) {
  if (res.ok) return ok('anthropic');
  const text = await res.text().catch(() => '');
  if (res.status === 401 || res.status === 403) return fail('anthropic', 'invalid_key', 'Der KI-Schlüssel ist ungültig.');
  if (res.status === 400 && /credit balance/i.test(text)) return fail('anthropic', 'no_credit', 'KI-Guthaben aufgebraucht');
  if (res.status === 429 || res.status === 529) return ok('anthropic', 'Claude ist gerade ausgelastet.', 'busy');
  return fail('anthropic', 'error', `Claude antwortete mit ${res.status}.`);
}

export function makeChecks({ cfg, store, doFetch, now }) {
  let credit;
  const creditEmpty = async () => (credit ??= store ? (await store.get(CREDIT_KEY)) === 'empty' : false);
  return {
    env: async () => {
      const missing = cfg.present.filter(([, set]) => !set).map(([n]) => n);
      return missing.length ? fail('env', 'missing', `Es fehlt: ${missing.join(', ')}`) : ok('env', `${cfg.present.length} Variablen da`);
    },
    upstash: async () => {
      if (!store) return fail('upstash', 'not_set_up', 'Kein Speicher verbunden.');
      return (await store.cmd('PING')) === 'PONG' ? ok('upstash') : fail('upstash', 'error', 'Keine Antwort auf PING.');
    },
    anthropic: async () => {
      if (!cfg.apiKey) return skip('anthropic', 'not_set_up');
      if (await creditEmpty()) return skip('anthropic', 'credit_empty', 'Kein Aufruf: das Guthaben ist leer (siehe ki-guthaben).');
      const res = await doFetch(MESSAGES_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: CHEAP_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] }),
      });
      return anthropicVerdict(res);
    },
    'ki-guthaben': async () => {
      if (await creditEmpty()) return fail('ki-guthaben', 'no_credit', 'KI-Guthaben aufgebraucht');
      if (!cfg.helperToken) return skip('ki-guthaben', 'not_set_up');
      const cap = capOf(cfg.cap);
      if (cap == null) return skip('ki-guthaben', 'no_cap');
      if (!store) return skip('ki-guthaben', 'no_storage');
      const month = monthOf(new Date(now()));
      const spent = Number(await store.get(spendKeyOf(month))) || 0;
      const note = `CHF ${spent.toFixed(2)} von ${cap.toFixed(2)} im ${month}`;
      return spent >= cap ? fail('ki-guthaben', 'cap_reached', `Monatsgrenze erreicht: ${note}`) : ok('ki-guthaben', note);
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
    gemini: async () => {
      if (!cfg.geminiKey) return skip('gemini', 'not_set_up');
      const got = await askGeminiModels({
        doFetch,
        key: cfg.geminiKey,
        models: [cfg.geminiModel, ...(cfg.geminiFallbacks ?? [])],
        body: JSON.stringify(geminiRequest({ question: 'Testfrage des Wächters: Antworte nur mit «OK».', lang: 'de' })),
      });
      if (store && got.calls) {
        const key = geminiKey(new Date(now()).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }));
        await store.cmd('INCRBYFLOAT', key, got.calls).catch(() => null);
        await store.cmd('EXPIRE', key, 3 * 24 * 60 * 60).catch(() => null);
      }
      if (got.failure === 'bad_key') return fail('gemini', 'invalid_key', 'Der Gemini-Schlüssel ist ungültig.');
      if (got.failure === 'limit') return ok('gemini', 'Gratis-Grenze von Google gerade erreicht.', 'busy');
      if (got.failure === 'busy') return ok('gemini', 'Gemini ist gerade ausgelastet.', 'busy');
      if (got.failure === 'no_model') return fail('gemini', 'no_model', 'Google bietet das Gemini-Modell nicht mehr an.');
      if (got.failure) return fail('gemini', 'error', 'Gemini antwortete mit einem Fehler.');
      const fallback = got.model !== cfg.geminiModel ? ` (Ersatzmodell ${got.model})` : '';
      return geminiText(got.msg) ? ok('gemini', `Testfrage beantwortet${fallback}`) : fail('gemini', 'no_answer', 'Gemini gab keine Antwort.');
    },
    abend: async () => {
      if (!cfg.apiKey) return skip('abend', 'not_set_up');
      if (typeof helperLib.buildRequest !== 'function' || !helperLib.TASKS?.evening) return fail('abend', 'missing', '«Bereit für morgen?» fehlt im Helfer.');
      const { max_tokens: _m, output_config: _o, ...req } = helperLib.buildRequest('evening', EVENING_SAMPLE, cfg.model);
      const res = await doFetch(COUNT_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(req),
      });
      if (res.status === 401 || res.status === 403) return fail('abend', 'invalid_key', 'Der KI-Schlüssel ist ungültig.');
      if (res.status === 429 || res.status === 529) return ok('abend', 'Claude ist gerade ausgelastet.', 'busy');
      const body = await res.json().catch(() => null);
      if (!res.ok) return fail('abend', 'request_broken', `Claude nimmt die Abend-Frage nicht an (${res.status}${body?.error?.type ? `, ${body.error.type}` : ''}).`);
      return Number(body?.input_tokens) > 0 ? ok('abend', `Abend-Frage passt (${cfg.model})`) : fail('abend', 'error', 'Keine Antwort auf die Abend-Frage.');
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
/** Checks whose slow answer counts as «busy» (ok), not as a fail: the free Gemini tier is often slow. */
export const SLOW_IS_BUSY = new Set(['gemini']);

/** Run every check at the same time, each on its own: one failing or hanging never stops the others. */
export async function runHealth({ cfg, store, doFetch, now, checkTimeoutMs = CHECK_TIMEOUT_MS }) {
  const checks = makeChecks({ cfg, store, doFetch, now });
  const out = await Promise.all(Object.entries(checks).map(async ([id, fn]) => {
    let timer;
    const late = new Promise((resolve) => {
      const secs = Math.round(checkTimeoutMs / 1000);
      // Gemini (free tier) is often slow: like «busy», a slow answer is no alarm (Noah 28.10.2026 «2a»)
      const slow = SLOW_IS_BUSY.has(id)
        ? ok(id, `Gemini ist gerade langsam (keine Antwort innerhalb ${secs} Sekunden).`, 'busy')
        : fail(id, 'timeout', `Keine Antwort innerhalb ${secs} Sekunden.`);
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
