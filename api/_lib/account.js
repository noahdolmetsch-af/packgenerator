/**
 * Paket R «Andere Menschen und Geld» (Noah 19.10.2026 13:44 «1b 2a oder b»): the app is open to
 * everyone, and each person chooses how phone and computer keep the same data:
 *   a) «Mit Google anmelden»: the Google account remembers the pairing code, so on the next device a
 *      Google sign-in is enough;
 *   b) without an account: the pairing code or the invite link, as before (api/sync.js).
 * Without either, everything stays on the device, as today.
 *
 * Only the sign-in itself (scopes «openid email»): no calendar, no mail, no Fitbit. Those stay the
 * owner's server connections (google.js, behind the device key).
 *
 *   POST ?step=start   { returnTo }          → { url } (Google's sign-in page)
 *   (Google sends the browser to /api/google/callback; google.js hands a state of kind 'account' here)
 *                                            → back to the app with #…?konto=<ticket> (5 minutes, once)
 *   POST ?step=redeem  { ticket, code }      → { code, email, known, session }
 *        known: the account already had a code (this device takes it); else `code` (this device's) is kept
 *   POST ?step=signout { session }           → { ok } (only this device's session ends)
 *   POST ?step=forget  { session }           → { ok } (the account's code is removed from the server)
 *
 * What the server keeps, and nothing else (no e-mail, no name):
 *   acct:<id>            JSON { w, at }  id = sha256 of Google's account number; w = the pairing code,
 *                        sealed with AES-GCM under a key from ACCOUNT_SECRET (Vercel env only); 400 days
 *   acct:sess:<hash>     id, per signed-in device (400 days)
 *   acct:ticket:<hash>   { id, email } for 5 minutes, between Google's answer and the app
 * The sync data itself stays sealed with the pairing code (api/_lib/sync.js); with a Google account the
 * server could open the code with ACCOUNT_SECRET, without one it cannot (the privacy page says so).
 *
 * Environment (names only): ACCOUNT_GOOGLE_CLIENT_ID / ACCOUNT_GOOGLE_CLIENT_SECRET (a Google project
 * only for signing in, which needs no Google review), else GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 * (while that Google project is in «Testing», only its test users can sign in); ACCOUNT_SECRET.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { route, json, needStore, redisEnv, pick, ApiError, API_BASE } from './core.js';
import { saveState, backToApp, jsonBody, hash, randomKey } from './oauth.js';

export const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
/** The redirect URI already registered in Google Cloud (google.js passes kind 'account' on to here). */
export const CALLBACK = `${API_BASE}/api/google/callback`;
export const SIGNIN_SCOPES = 'openid email';
export const ACCOUNT_TTL_S = 400 * 86_400;
export const TICKET_TTL_S = 5 * 60;
/** The pairing code of the sync (src/lib/sync/code.js): 8 groups of 4 Crockford letters and digits. */
export const isCode = (c) => typeof c === 'string' && /^([0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/.test(c);
const isTicket = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{20,60}$/.test(t);

export function accountEnv(e = process.env) {
  return {
    clientId: pick(['ACCOUNT_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID'], e),
    clientSecret: pick(['ACCOUNT_GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'], e),
    secret: pick('ACCOUNT_SECRET', e),
    ...redisEnv(e),
  };
}

export const accountId = (sub) => hash(`pg-account:${sub}`).slice(0, 32);
const keyFor = (secret, id) => Buffer.from(hkdfSync('sha256', secret, 'pg-account', `code:${id}`, 32));

/** The pairing code sealed for this account: base64url(iv | tag | text). */
export function sealCode(secret, id, code) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', keyFor(secret, id), iv);
  const text = Buffer.concat([c.update(code, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), text]).toString('base64url');
}
export function openCode(secret, id, sealed) {
  try {
    const b = Buffer.from(String(sealed), 'base64url');
    const d = createDecipheriv('aes-256-gcm', keyFor(secret, id), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    const code = Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
    return isCode(code) ? code : null;
  } catch {
    return null;
  }
}

/** The claims of Google's id_token. It came straight from Google's token endpoint over TLS, so the
 *  signature need not be checked again (OpenID Connect Core 3.1.3.7); audience and issuer are. */
export function claimsOf(idToken, clientId) {
  try {
    const c = JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'));
    if (!c?.sub || c.aud !== clientId || !['accounts.google.com', 'https://accounts.google.com'].includes(c.iss)) return null;
    return { sub: String(c.sub), email: c.email_verified === false ? '' : String(c.email ?? '') };
  } catch {
    return null;
  }
}

export function makeAccount({ env = () => accountEnv(), doFetch = (...a) => fetch(...a) } = {}) {
  const ready = (cfg) => {
    if (!cfg.clientId || !cfg.clientSecret) throw new ApiError(503, 'not_set_up', 'Google sign-in is not set up on the server.');
    if (!cfg.secret || cfg.secret.length < 32) throw new ApiError(503, 'not_set_up', 'ACCOUNT_SECRET is missing on the server.');
  };

  /** google.js calls this for a state of kind 'account': Google's answer → back to the app with a ticket. */
  async function callback(st, url) {
    const cfg = env();
    const store = needStore(cfg, doFetch);
    const back = (params) => backToApp(st.returnTo, params);
    if (url.searchParams.get('error') || !url.searchParams.get('code')) return back({ konto: 'error', error: 'denied' });
    ready(cfg);
    let res;
    try {
      res = await doFetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: CALLBACK }).toString(),
      });
    } catch {
      return back({ konto: 'error', error: 'unreachable' });
    }
    const tok = await res.json().catch(() => null);
    const claims = res.ok ? claimsOf(tok?.id_token, cfg.clientId) : null;
    if (!claims) return back({ konto: 'error', error: 'google' });
    const ticket = randomKey(24);
    await store.set(`acct:ticket:${hash(ticket)}`, JSON.stringify({ id: accountId(claims.sub), email: claims.email }), TICKET_TTL_S);
    return back({ konto: ticket });
  }

  const sessionId = async (store, session) => {
    if (typeof session !== 'string' || session.length > 100) return null;
    return store.get(`acct:sess:${hash(session)}`);
  };

  const main = route(
    {
      POST: async (request) => {
        const step = new URL(request.url).searchParams.get('step');
        const cfg = env();
        const store = needStore(cfg, doFetch);
        const body = await jsonBody(request);

        if (step === 'start') {
          ready(cfg);
          const state = await saveState(store, 'account', { returnTo: typeof body.returnTo === 'string' ? body.returnTo.slice(0, 500) : null });
          const q = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: CALLBACK, response_type: 'code', scope: SIGNIN_SCOPES, prompt: 'select_account', state });
          return json(request, 200, { url: `${AUTHORIZE_URL}?${q}` });
        }

        if (step === 'redeem') {
          ready(cfg);
          if (!isTicket(body.ticket)) throw new ApiError(400, 'bad_request', 'The sign-in is missing.');
          const raw = await store.cmd('GETDEL', `acct:ticket:${hash(body.ticket)}`);
          if (!raw) throw new ApiError(410, 'expired', 'The sign-in has expired. Sign in again.');
          const { id, email } = JSON.parse(raw);
          const rec = JSON.parse((await store.get(`acct:${id}`)) ?? 'null');
          let code = rec ? openCode(cfg.secret, id, rec.w) : null;
          const known = !!code;
          if (!code) {
            if (!isCode(body.code)) throw new ApiError(400, 'bad_request', 'The code of this device is missing.');
            code = body.code;
          }
          await store.set(`acct:${id}`, JSON.stringify({ w: known ? rec.w : sealCode(cfg.secret, id, code), at: rec?.at ?? new Date().toISOString().slice(0, 10) }), ACCOUNT_TTL_S);
          const session = randomKey(24);
          await store.set(`acct:sess:${hash(session)}`, id, ACCOUNT_TTL_S);
          return json(request, 200, { code, email, known, session });
        }

        if (step === 'signout' || step === 'forget') {
          const id = await sessionId(store, body.session);
          if (id && step === 'forget') await store.del(`acct:${id}`);
          if (typeof body.session === 'string' && body.session.length <= 100) await store.del(`acct:sess:${hash(body.session)}`);
          return json(request, 200, { ok: true });
        }

        throw new ApiError(400, 'bad_request', 'Unknown step.');
      },
    },
    'account',
  );

  return { main, callback };
}
