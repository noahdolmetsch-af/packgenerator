// Paket R «Mit Google anmelden»: api/_lib/account.js and its way through /api/google/callback, with a
// fake Upstash and a fake Google. Fictional values only (no real key, account or address).
import { describe, it, expect } from 'vitest';
import { makeAccount, accountEnv, sealCode, openCode, claimsOf, accountId, isCode, TOKEN_URL } from '../api/_lib/account.js';
import { makeHandler as makeGoogle } from '../api/_lib/google.js';

const REDIS = 'https://redis.example.test';
const ENV = { ACCOUNT_GOOGLE_CLIENT_ID: 'acct-client', ACCOUNT_GOOGLE_CLIENT_SECRET: 'acct-secret-test', ACCOUNT_SECRET: 'x'.repeat(40), KV_REST_API_URL: REDIS, KV_REST_API_TOKEN: 'r' };
const CODE_A = '0123-4567-89AB-CDEF-GHJK-MNPQ-RSTV-WXYZ';
const CODE_B = 'ZZZZ-YYYY-XXXX-WWWW-VVVV-TTTT-SSSS-RRRR';
const APP = 'https://noahdolmetsch-af.github.io/packgenerator/#/me/data';
const idToken = (claims) => `h.${Buffer.from(JSON.stringify({ iss: 'https://accounts.google.com', aud: 'acct-client', ...claims })).toString('base64url')}.sig`;

function world({ sub = 'google-sub-1', email = 'velo@example.test' } = {}) {
  const kv = new Map();
  const google = [];
  const doFetch = async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, v] = JSON.parse(init.body);
      const r = (result) => Response.json({ result });
      if (cmd === 'GET') return r(kv.get(k) ?? null);
      if (cmd === 'SET') return kv.set(k, v), r('OK');
      if (cmd === 'DEL') return r(kv.delete(k) ? 1 : 0);
      if (cmd === 'GETDEL') {
        const x = kv.get(k) ?? null;
        kv.delete(k);
        return r(x);
      }
      throw new Error(`redis ${cmd}`);
    }
    if (url === TOKEN_URL) {
      google.push(Object.fromEntries(new URLSearchParams(init.body)));
      return Response.json({ access_token: 'at', id_token: idToken({ sub, email, email_verified: true }) });
    }
    throw new Error(`unexpected ${url}`);
  };
  const acct = makeAccount({ env: () => accountEnv(ENV), doFetch });
  const g = makeGoogle({ env: () => ({ clientId: 'g', clientSecret: 'gs', redisUrl: REDIS, redisToken: 'r' }), doFetch, account: acct });
  const call = async (step, body) => {
    const res = await acct.main(new Request(`https://packgen-three.vercel.app/api/sync?area=account&step=${step}`, { method: 'POST', body: JSON.stringify(body) }));
    return { status: res.status, body: await res.json() };
  };
  /** The whole sign-in: start → Google → callback → the ticket in the app address. */
  const signIn = async () => {
    const { body } = await call('start', { returnTo: APP });
    const u = new URL(body.url);
    expect(u.searchParams.get('scope')).toBe('openid email');
    expect(u.searchParams.get('client_id')).toBe('acct-client');
    const res = await g.callback(new Request(`https://packgen-three.vercel.app/api/google/callback?code=c1&state=${u.searchParams.get('state')}`));
    expect(res.status).toBe(302);
    const loc = res.headers.get('location');
    expect(loc.startsWith(APP)).toBe(true);
    return new URLSearchParams(loc.split('?')[1]).get('konto');
  };
  return { kv, google, call, signIn, g };
}

describe('the sealed code', () => {
  it('opens only with the same secret and account', () => {
    const s = 'k'.repeat(40);
    const w = sealCode(s, 'a1', CODE_A);
    expect(w).not.toContain('0123');
    expect(openCode(s, 'a1', w)).toBe(CODE_A);
    expect(openCode(s, 'a2', w)).toBeNull();
    expect(openCode('j'.repeat(40), 'a1', w)).toBeNull();
    expect(isCode(CODE_A)).toBe(true);
    expect(isCode('0123-4567')).toBe(false);
  });
  it('reads Google\'s claims only for this client', () => {
    expect(claimsOf(idToken({ sub: 's', email: 'e@example.test' }), 'acct-client')).toEqual({ sub: 's', email: 'e@example.test' });
    expect(claimsOf(idToken({ sub: 's' }), 'other-client')).toBeNull();
    expect(claimsOf('nonsense', 'acct-client')).toBeNull();
  });
});

describe('/api/sync?area=account', () => {
  it('first device: keeps its code; second device: gets the same code back', async () => {
    const w = world();
    const t1 = await w.signIn();
    expect(w.google[0]).toMatchObject({ client_id: 'acct-client', grant_type: 'authorization_code', code: 'c1' });
    const a = await w.call('redeem', { ticket: t1, code: CODE_A });
    expect(a.status).toBe(200);
    expect(a.body).toMatchObject({ code: CODE_A, email: 'velo@example.test', known: false });
    // the server keeps no e-mail and no readable code
    const stored = [...w.kv.values()].join(' ');
    expect(stored).not.toContain('velo@example.test');
    expect(stored).not.toContain(CODE_A);
    expect(w.kv.has(`acct:${accountId('google-sub-1')}`)).toBe(true);

    const b = await w.call('redeem', { ticket: await w.signIn(), code: CODE_B });
    expect(b.body).toMatchObject({ code: CODE_A, known: true });
    expect(b.body.session).not.toBe(a.body.session);
  });
  it('a ticket works once; a wrong code is refused', async () => {
    const w = world();
    const t = await w.signIn();
    expect((await w.call('redeem', { ticket: t, code: 'short' })).status).toBe(400);
    expect((await w.call('redeem', { ticket: t, code: CODE_A })).body.code).toBe('expired');
  });
  it('forget removes the account\'s code; signout only the session', async () => {
    const w = world();
    const a = await w.call('redeem', { ticket: await w.signIn(), code: CODE_A });
    await w.call('signout', { session: a.body.session });
    expect(w.kv.has(`acct:${accountId('google-sub-1')}`)).toBe(true);
    const b = await w.call('redeem', { ticket: await w.signIn(), code: CODE_B });
    expect((await w.call('forget', { session: b.body.session })).body.ok).toBe(true);
    expect(w.kv.has(`acct:${accountId('google-sub-1')}`)).toBe(false);
    const c = await w.call('redeem', { ticket: await w.signIn(), code: CODE_B });
    expect(c.body).toMatchObject({ code: CODE_B, known: false });
  });
  it('without ACCOUNT_SECRET: not_set_up, and a denied sign-in goes back with konto=error', async () => {
    const acct = makeAccount({ env: () => accountEnv({ ...ENV, ACCOUNT_SECRET: '' }), doFetch: async () => Response.json({ result: null }) });
    const res = await acct.main(new Request('https://packgen-three.vercel.app/api/sync?area=account&step=start', { method: 'POST', body: '{}' }));
    expect((await res.json()).code).toBe('not_set_up');
    const w = world();
    const { body } = await w.call('start', { returnTo: APP });
    const state = new URL(body.url).searchParams.get('state');
    const back = await w.g.callback(new Request(`https://packgen-three.vercel.app/api/google/callback?error=access_denied&state=${state}`));
    expect(back.headers.get('location')).toContain('konto=error');
  });
  it('the owner\'s Google connection still uses its own state kind', async () => {
    const w = world();
    const res = await w.g.callback(new Request('https://packgen-three.vercel.app/api/google/callback?code=c&state=unknown'));
    expect(res.headers.get('location')).toContain('google=error');
  });
});

describe('one function for sync and sign-in (Vercel Hobby: 12 functions)', () => {
  it('api/sync.js hands ?area=account to the sign-in, everything else to the sync', async () => {
    const { withAccount } = await import('../api/sync.js');
    const h = withAccount(async () => new Response('sync'), async () => new Response('account'));
    expect(await (await h(new Request('https://packgen.test/api/sync?area=account&step=start', { method: 'POST' }))).text()).toBe('account');
    expect(await (await h(new Request('https://packgen.test/api/sync?step=pull', { method: 'POST' }))).text()).toBe('sync');
  });
});
