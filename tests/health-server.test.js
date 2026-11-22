// Paket B «Server», der Wächter: api/health with a fake environment, a fake Upstash and fake outside
// services. Fictional values only (no real key, token or secret).
import { describe, it, expect, vi } from 'vitest';
import { makeHandler } from '../api/health.js';
import { healthEnv, CACHE_KEY, STRAVA_TOKEN_URL, GOOGLE_TOKEN_URL, ENV_NAMES } from '../api/_lib/health.js';

const REDIS = 'https://redis.example.test';
const NOW = Date.parse('2026-10-18T10:00:00Z');
const FULL = { STRAVA_CLIENT_ID: '1', STRAVA_CLIENT_SECRET: 's-test', GOOGLE_CLIENT_ID: 'g-test', GOOGLE_CLIENT_SECRET: 'gs-test', KV_REST_API_URL: REDIS, KV_REST_API_TOKEN: 'redis-test' };

function world({ kv = {}, sets = {}, routes = {}, ping = 'PONG' } = {}) {
  const calls = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, v, ...more] = JSON.parse(init.body);
      if (cmd === 'MGET') return Response.json({ result: [k, v, ...more].filter((x) => x !== undefined).map((x) => kv[x] ?? null) });
      const r = (result) => Response.json({ result });
      if (cmd === 'PING') return r(ping);
      if (cmd === 'GET') return r(kv[k] ?? null);
      if (cmd === 'SET') return (kv[k] = v), r('OK');
      if (cmd === 'SCARD') return r(sets[k]?.size ?? 0);
      if (cmd === 'SCAN') return r(['0', Object.keys(kv).filter((x) => /^sync:.*:n$/.test(x))]);
      throw new Error(`redis ${cmd}`);
    }
    calls.push({ url: String(url), init });
    const key = Object.keys(routes).sort((a, b) => b.length - a.length).find((p) => String(url).startsWith(p)); // the longest address that fits
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

describe('/api/health', () => {
  it('all fine: 200, every check ok or skipped, never a value in the answer', async () => {
    const w = world();
    const { status, body, by } = await run(w);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Object.keys(by)).toEqual(['env', 'upstash', 'strava', 'google', 'sync', 'push', 'tagesgrenze']);
    expect(by.env.state).toBe('ok');
    expect(by.upstash.state).toBe('ok');
    expect(by.strava).toMatchObject({ state: 'skip', code: 'not_connected' });
    expect(by.sync).toMatchObject({ state: 'skip', code: 'not_paired' });
    const text = JSON.stringify(body);
    for (const v of Object.values(FULL)) if (v.length > 2) expect(text).not.toContain(v);
  });

  it('names a missing variable (only its name) and fails', async () => {
    const w = world();
    const { status, body, by } = await run(w, { ...FULL, GOOGLE_CLIENT_SECRET: '', STRAVA_CLIENT_ID: '' });
    expect(status).toBe(503);
    expect(body.ok).toBe(false);
    expect(by.env).toMatchObject({ state: 'fail', code: 'missing', note: 'Es fehlt: STRAVA_CLIENT_ID, GOOGLE_CLIENT_SECRET' });
    expect(ENV_NAMES).toHaveLength(6);
    expect(JSON.stringify(ENV_NAMES)).not.toMatch(/ANTHROPIC|HELPER|GEMINI/);
  });

  it('no storage: upstash fails, the others that need it skip', async () => {
    const w = world();
    const { by } = await run(w, { ...FULL, KV_REST_API_URL: '' });
    expect(by.upstash).toMatchObject({ state: 'fail', code: 'not_set_up' });
    expect(by.sync.state).toBe('skip');
  });

  it('refreshes connected Strava and Google tokens and keeps the new ones; a refused refresh fails', async () => {
    const kv = { 'strava:tokens': JSON.stringify({ access_token: 'a0', refresh_token: 'r0', expires_at: 1 }), 'google:tokens': JSON.stringify({ access_token: 'g0', refresh_token: 'gr0', expires_at: 1 }) };
    const w = world({ kv, routes: { [STRAVA_TOKEN_URL]: () => Response.json({ access_token: 'a1', refresh_token: 'r1', expires_at: 99 }), [GOOGLE_TOKEN_URL]: () => new Response('{}', { status: 400 }) } });
    const { by } = await run(w);
    expect(by.strava.state).toBe('ok');
    expect(JSON.parse(kv['strava:tokens'])).toMatchObject({ access_token: 'a1', refresh_token: 'r1' });
    expect(by.google).toMatchObject({ state: 'fail', code: 'login_needed' });
    expect(JSON.parse(kv['google:tokens']).access_token).toBe('g0');
  });

  it('sync and push: paired spaces count; a phone without a recent wake-up call fails', async () => {
    const kv = { 'sync:abc:n': '4', 'push:lasttick': String(NOW - 2 * 3600 * 1000) };
    const w = world({ kv, sets: { 'push:devs': new Set(['push:dev:x']) } });
    const { by } = await run(w);
    expect(by.sync).toMatchObject({ state: 'ok', note: '1 gekoppelt' });
    expect(by.push).toMatchObject({ state: 'fail', code: 'tick_late' });
  });

  it('keeps the answer 10 minutes: a second call asks nobody', async () => {
    const w = world();
    await run(w);
    expect(w.kv[CACHE_KEY]).toBeTruthy();
    const before = w.calls.length;
    const { body } = await run(w);
    expect(body.cached).toBe(true);
    expect(w.calls.length).toBe(before);
  });

  it('a check that throws is a fail with code error, the others still run', async () => {
    const w = world({ kv: { 'strava:tokens': JSON.stringify({ refresh_token: 'r0' }) }, routes: { [STRAVA_TOKEN_URL]: () => { throw new Error('network s-test'); } } });
    const { body, by } = await run(w);
    expect(by.strava).toMatchObject({ state: 'fail', code: 'error' });
    expect(by.push.state).toBe('skip');
    expect(JSON.stringify(body)).not.toContain('s-test');
  });

  it('a check that hangs is a fail with code timeout, the answer still comes and names it', async () => {
    const w = world({ kv: { 'strava:tokens': JSON.stringify({ refresh_token: 'r0' }) }, routes: { [STRAVA_TOKEN_URL]: () => new Promise(() => {}) } });
    const res = await makeHandler({ env: () => healthEnv(FULL), doFetch: w.doFetch, now: () => NOW, checkTimeoutMs: 50 })(new Request('https://packgen-three.vercel.app/api/health'));
    const body = await res.json();
    const by = Object.fromEntries(body.checks.map((c) => [c.id, c]));
    expect(res.status).toBe(503);
    expect(by.strava).toMatchObject({ state: 'fail', code: 'timeout' });
    expect(by.upstash.state).toBe('ok');
    expect(body.checks.map((c) => c.id)).toEqual(['env', 'upstash', 'strava', 'google', 'sync', 'push', 'tagesgrenze']);
  });
});
