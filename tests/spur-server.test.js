// Paket S «Reise-Spur» (Noah 19.10.2026 «4a»): /api/sync?action=spur keeps a sealed tour behind a read link, and the
// app's link.js makes, updates, opens and deletes it. A small fake Redis, fictional data only.
import { describe, it, expect } from 'vitest';
import { makeDispatch } from '../api/sync.js';
import { makeSpurHandler, WRITES_PER_DAY } from '../api/_lib/spur.js';
import { fakeRedis } from './fakeredis.js';
import { putLink, deleteLink, openLink, LinkError } from '../src/lib/spur/link.js';

function setup() {
  const r = fakeRedis();
  const handler = makeDispatch({ spur: makeSpurHandler({ env: () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) }) });
  // the app's fetch goes straight to the handler
  const doFetch = (url, init = {}) => handler(new Request(url, { ...init, headers: { ...(init.headers ?? {}), origin: 'http://localhost:5173', 'x-forwarded-for': '203.0.113.7' } }));
  return { r, handler, doFetch, opts: { doFetch, url: 'https://packgen.example.test/api/sync?action=spur' } };
}

const tour = (km) => ({ v: 1, t: 'Testtour', d: '2026-07-03', n: 1, km, at: null, days: [{ d: '2026-07-03', km, l: ['_p~iF~ps|U_ulLnnqC'], p: [], x: [] }] });

describe('/api/sync?action=spur', () => {
  it('makes a link, opens it, updates it under the same address and deletes it', async () => {
    const { r, opts } = setup();
    const link = await putLink(tour(10), null, opts);
    expect(link.id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(link.del).toMatch(/^[A-Za-z0-9_-]{32}$/);
    // the server keeps only the sealed tour and the delete code's hash
    const stored = r.kv.get(`spur:${link.id}`);
    expect(stored).not.toMatch(/Testtour/);
    expect(stored).not.toMatch(link.del);
    expect(stored).not.toMatch(link.key);
    expect((await openLink(link.id, link.key, opts)).km).toBe(10);
    const again = await putLink(tour(42), link, opts);
    expect(again.id).toBe(link.id);
    expect(again.key).toBe(link.key);
    expect((await openLink(link.id, link.key, opts)).km).toBe(42);
    await deleteLink(link, opts);
    await expect(openLink(link.id, link.key, opts)).rejects.toMatchObject({ code: 'not_found' });
  });
  it('a wrong key cannot read it; a wrong delete code cannot change or delete it', async () => {
    const { opts, doFetch } = setup();
    const link = await putLink(tour(10), null, opts);
    await expect(openLink(link.id, 'x'.repeat(43), opts)).rejects.toBeInstanceOf(LinkError);
    const res = await doFetch('https://packgen.example.test/api/sync?action=spur&step=delete', { method: 'POST', body: JSON.stringify({ id: link.id, del: 'y'.repeat(32) }) });
    expect(res.status).toBe(403);
    expect((await openLink(link.id, link.key, opts)).km).toBe(10);
  });
  it('a deleted link gets a new address when it is shared again', async () => {
    const { opts } = setup();
    const link = await putLink(tour(10), null, opts);
    await deleteLink(link, opts);
    const fresh = await putLink(tour(11), link, opts);
    expect(fresh.id).not.toBe(link.id);
    expect(fresh.key).not.toBe(link.key);
    expect((await openLink(fresh.id, fresh.key, opts)).km).toBe(11);
  });
  it('checks what comes in and limits the writes per day', async () => {
    const { doFetch } = setup();
    const post = (step, body) => doFetch(`https://packgen.example.test/api/sync?action=spur&step=${step}`, { method: 'POST', body: JSON.stringify(body) });
    expect((await post('put', { e: 'not base64 !' })).status).toBe(400);
    expect((await doFetch('https://packgen.example.test/api/sync?action=spur&id=short')).status).toBe(400);
    for (let i = 0; i < WRITES_PER_DAY; i++) expect((await post('put', { e: 'A'.repeat(40) })).status).toBe(200);
    const res = await post('put', { e: 'A'.repeat(40) });
    expect(res.status).toBe(429);
  });
  it('without the store it says so', async () => {
    const handler = makeDispatch({ spur: makeSpurHandler({ env: () => ({ redisUrl: '', redisToken: '' }) }) });
    const res = await handler(new Request('https://x.test/api/sync?action=spur&id=AAAAAAAAAAAAAAAAAAAAAA'));
    expect(res.status).toBe(503);
  });
  it('without action=spur the sync answers as before (one function for both)', async () => {
    const seen = [];
    const handler = makeDispatch({ sync: async (req) => (seen.push('sync'), new Response('s')), spur: async () => (seen.push('spur'), new Response('p')) });
    await handler(new Request('https://x.test/api/sync?step=status', { method: 'POST' }));
    await handler(new Request('https://x.test/api/sync?action=spur&id=x'));
    expect(seen).toEqual(['sync', 'spur']);
  });
});
