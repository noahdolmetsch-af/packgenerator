// Noah 03.11.2026: a call to the server that gets no answer ends, and a round reports its progress. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, httpApi, readCfg } from '../src/lib/sync/engine.js';

describe('a call that never answers', () => {
  it('ends with the code «timeout», not for ever', async () => {
    const never = (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    const api = httpApi('https://x.example.test/api/sync', never, { timeoutMs: 20 });
    await expect(api.call('pull', {})).rejects.toMatchObject({ code: 'timeout' });
  });
  it('is still «offline» when the network fails at once', async () => {
    const api = httpApi('https://x.example.test/api/sync', () => Promise.reject(new TypeError('failed')), { timeoutMs: 1000 });
    await expect(api.call('pull', {})).rejects.toMatchObject({ code: 'offline' });
  });
  it('the round keeps the time of the last success and stores the error', async () => {
    const db = createDb('sync-status-1');
    await startSync(db, newCode());
    const ok = { call: async (step) => (step === 'pull' ? { items: [], next: 0, more: false } : { done: [], conflicts: [] }) };
    await syncNow(db, { api: ok, now: () => '2026-11-03T10:00:00.000Z' });
    const bad = { call: async () => { throw Object.assign(new Error('t'), { code: 'timeout' }); } };
    await syncNow(db, { api: bad, now: () => '2026-11-03T11:00:00.000Z' }).catch(() => {});
    expect(await readCfg(db)).toMatchObject({ error: 'timeout', lastAt: '2026-11-03T10:00:00.000Z' });
  });
});
