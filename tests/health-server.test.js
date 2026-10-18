// Paket B «Server», der Wächter: api/health with a fake environment, a fake Upstash and fake outside
// services. Fictional values only (no real key, token or secret).
import { describe, it, expect, vi } from 'vitest';
import { makeHandler } from '../api/health.js';
import { anthropicVerdict, capOf, healthEnv, CACHE_KEY, CREDIT_KEY, MESSAGES_URL, STRAVA_TOKEN_URL, GOOGLE_TOKEN_URL, ENV_NAMES } from '../api/_lib/health.js';

const REDIS = 'https://redis.example.test';
const NOW = Date.parse('2026-10-18T10:00:00Z');
const FULL = { ANTHROPIC_API_KEY: 'sk-test-not-real', HELPER_TOKEN: 'helper-test', HELPER_MONTHLY_CHF: '2', STRAVA_CLIENT_ID: '1', STRAVA_CLIENT_SECRET: 's-test', GOOGLE_CLIENT_ID: 'g-test', GOOGLE_CLIENT_SECRET: 'gs-test', KV_REST_API_URL: REDIS, KV_REST_API_TOKEN: 'redis-test' };

function world({ kv = {}, sets = {}, routes = {}, ping = 'PONG' } = {}) {
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, v] = JSON.parse(init.body);
      const r = (result) => Response.json({ result });
      if (cmd === 'PING') return r(ping);
      if (cmd === 'GET') return r(kv[k] ?? null);
      if (cmd === 'SET') return (kv[k] = v), r('OK');
      if (cmd === 'SCARD') return r(sets[k]?.size ?? 0);
      if (cmd === 'SCAN') return r(['0', Object.keys(kv).filter((x) => /^sync:.*:n$/.test(x))]);
      throw new Error(`redis ${cmd}`);
    }
    calls.push({ url: String(url), init });
    const key = Object.keys(routes).find((p) => String(url).startsWith(p));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    return routes[key](String(url), init);
  });
  return { kv, calls, doFetch };
}
const run = async (w, e = FULL) => {
  const res = await makeHandler({ env: () => healthEnv(e), doFetch: w.doFetch, now: () => NOW })(new Request('https://packgen-three.vercel.app/api/health'));
  const body = await res.json();
  return { status: res.status, body, by: Object.fromEntries(body.checks.map((c) => [c.id, c])) };
};
const claudeOk = () => Response.json({ content: [] });

describe('/api/health', () => {
  it('all fine: 200, every check ok or skipped, never a value in the answer', async () => {
    const w = world({ routes: { [MESSAGES_URL]: claudeOk } });
    const { status, body, by } = await run(w);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Object.keys(by)).toEqual(['env', 'upstash', 'anthropic', 'ki-guthaben', 'strava', 'google', 'sync', 'push']);
    expect(by.env.state).toBe('ok');
    expect(by.upstash.state).toBe('ok');
    expect(by.anthropic.state).toBe('ok');
    expect(by['ki-guthaben']).toMatchObject({ state: 'ok', note: 'CHF 0.00 von 2.00 im 2026-10' });
    expect(by.strava).toMatchObject({ state: 'skip', code: 'not_connected' });
    expect(by.sync).toMatchObject({ state: 'skip', code: 'not_paired' });
    const text = JSON.stringify(body);
    for (const v of Object.values(FULL)) if (v.length > 2) expect(text).not.toContain(v);
  });

  it('names a missing variable (only its name) and fails', async () => {
    const w = world({ routes: { [MESSAGES_URL]: claudeOk } });
    const { status, body, by } = await run(w, { ...FULL, GOOGLE_CLIENT_SECRET: '', HELPER_MONTHLY_CHF: '' });
    expect(status).toBe(503);
    expect(body.ok).toBe(false);
    expect(by.env).toMatchObject({ state: 'fail', code: 'missing', note: 'Es fehlt: HELPER_MONTHLY_CHF, GOOGLE_CLIENT_SECRET' });
    expect(ENV_NAMES).toHaveLength(9);
  });

  it('no storage: upstash fails, the others that need it skip', async () => {
    const w = world({ routes: { [MESSAGES_URL]: claudeOk } });
    const { by } = await run(w, { ...FULL, KV_REST_API_URL: '' });
    expect(by.upstash).toMatchObject({ state: 'fail', code: 'not_set_up' });
    expect(by.sync.state).toBe('skip');
  });

  it('tells an invalid key from used-up credit (a 400 that speaks of the credit balance)', async () => {
    const r = (status, body) => new Response(JSON.stringify(body), { status });
    expect(await anthropicVerdict(r(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }))).toMatchObject({ state: 'fail', code: 'invalid_key' });
    expect(await anthropicVerdict(r(400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } }))).toMatchObject({ state: 'fail', code: 'no_credit', note: 'KI-Guthaben aufgebraucht' });
    expect(await anthropicVerdict(r(400, { type: 'error', error: { type: 'invalid_request_error', message: 'max_tokens: bad' } }))).toMatchObject({ state: 'fail', code: 'error' });
    expect(await anthropicVerdict(r(529, {}))).toMatchObject({ state: 'ok', code: 'busy' });
    const w = world({ routes: { [MESSAGES_URL]: () => r(400, { error: { type: 'invalid_request_error', message: 'Your credit balance is too low' } }) } });
    const { status, by } = await run(w);
    expect(status).toBe(503);
    expect(by.anthropic.code).toBe('no_credit');
    // one token of the cheapest model, with the key only in its header
    const call = w.calls.find((c) => c.url === MESSAGES_URL);
    expect(JSON.parse(call.init.body)).toMatchObject({ max_tokens: 1 });
    expect(call.init.headers['x-api-key']).toBe(FULL.ANTHROPIC_API_KEY);
  });

  it('ki-guthaben fails once the month reaches the cap, and skips without the helper', async () => {
    const w = world({ kv: { 'helper:spend:2026-10': '2.05' }, routes: { [MESSAGES_URL]: claudeOk } });
    const { by } = await run(w);
    expect(by['ki-guthaben']).toMatchObject({ state: 'fail', code: 'cap_reached' });
    const w2 = world({ routes: { [MESSAGES_URL]: claudeOk } });
    expect((await run(w2, { ...FULL, HELPER_TOKEN: '' })).by['ki-guthaben']).toMatchObject({ state: 'skip', code: 'not_set_up' });
    expect(capOf('3')).toBe(3);
    expect(capOf('', 5)).toBe(5);
    expect(capOf('', null)).toBe(null);
  });

  it('ki-guthaben fails while the helper marked the credit empty, and then nobody calls Claude', async () => {
    const w = world({ kv: { [CREDIT_KEY]: 'empty' }, routes: { [MESSAGES_URL]: claudeOk } });
    const { status, by } = await run(w);
    expect(status).toBe(503);
    expect(by['ki-guthaben']).toMatchObject({ state: 'fail', code: 'no_credit', note: 'KI-Guthaben aufgebraucht' });
    expect(by.anthropic).toMatchObject({ state: 'skip', code: 'credit_empty' });
    expect(w.calls.some((c) => c.url === MESSAGES_URL)).toBe(false);
    expect(CREDIT_KEY).toBe('helper:credit');
  });

  it('refreshes connected Strava and Google tokens and keeps the new ones; a refused refresh fails', async () => {
    const kv = { 'strava:tokens': JSON.stringify({ access_token: 'a0', refresh_token: 'r0', expires_at: 1 }), 'google:tokens': JSON.stringify({ access_token: 'g0', refresh_token: 'gr0', expires_at: 1 }) };
    const w = world({ kv, routes: { [MESSAGES_URL]: claudeOk, [STRAVA_TOKEN_URL]: () => Response.json({ access_token: 'a1', refresh_token: 'r1', expires_at: 99 }), [GOOGLE_TOKEN_URL]: () => new Response('{}', { status: 400 }) } });
    const { by } = await run(w);
    expect(by.strava.state).toBe('ok');
    expect(JSON.parse(kv['strava:tokens'])).toMatchObject({ access_token: 'a1', refresh_token: 'r1' });
    expect(by.google).toMatchObject({ state: 'fail', code: 'login_needed' });
    expect(JSON.parse(kv['google:tokens']).access_token).toBe('g0');
  });

  it('sync and push: paired spaces count; a phone without a recent wake-up call fails', async () => {
    const kv = { 'sync:abc:n': '4', 'push:lasttick': String(NOW - 2 * 3600 * 1000) };
    const w = world({ kv, sets: { 'push:devs': new Set(['push:dev:x']) }, routes: { [MESSAGES_URL]: claudeOk } });
    const { by } = await run(w);
    expect(by.sync).toMatchObject({ state: 'ok', note: '1 gekoppelt' });
    expect(by.push).toMatchObject({ state: 'fail', code: 'tick_late' });
  });

  it('keeps the answer 10 minutes: a second call asks nobody', async () => {
    const w = world({ routes: { [MESSAGES_URL]: claudeOk } });
    await run(w);
    expect(w.kv[CACHE_KEY]).toBeTruthy();
    const before = w.calls.length;
    const { body } = await run(w);
    expect(body.cached).toBe(true);
    expect(w.calls.length).toBe(before);
  });

  it('a check that throws is a fail with code error, the others still run', async () => {
    const w = world({ routes: { [MESSAGES_URL]: () => { throw new Error('network sk-test-not-real'); } } });
    const { body, by } = await run(w);
    expect(by.anthropic).toMatchObject({ state: 'fail', code: 'error' });
    expect(by.push.state).toBe('skip');
    expect(JSON.stringify(body)).not.toContain('sk-test');
  });
});
