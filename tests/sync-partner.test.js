// Noah 21.11.2026: the app notices when no other device ever wrote into the sync (two devices, two codes). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, readCfg, isOther } from '../src/lib/sync/engine.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`peer-${n++}`);
function fakeServer() {
  const redis = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://r.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: redis.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  return { async call(step, body) { const res = await handler(new Request(`https://x.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'http://localhost:5173' } })); const d = await res.json(); if (!res.ok) throw Object.assign(new Error(d.message), { code: d.code }); return d; } };
}

describe('isOther', () => {
  it('by the writer id; old records name only the kind of device', () => {
    expect(isOther({ from: 'a', dev: 'phone' }, { devId: 'b', dev: 'computer' })).toBe(true);
    expect(isOther({ from: 'a', dev: 'phone' }, { devId: 'a', dev: 'phone' })).toBe(false);
    expect(isOther({ dev: 'phone' }, { devId: 'b', dev: 'computer' })).toBe(true);
    expect(isOther({ dev: 'computer' }, { devId: 'b', dev: 'computer' })).toBe(false);
    expect(isOther(null, {})).toBe(false);
  });
});

describe('peerSeen', () => {
  it('stays false while only this device writes, turns true with the first record of another device, also for two devices of one kind', async () => {
    const api = fakeServer();
    const a = fresh();
    const b = fresh();
    const code = newCode();
    await startSync(a, code);
    await a.notes.put({ id: 'n1', text: 'x' });
    await syncNow(a, { api, dev: 'computer' });
    await syncNow(a, { api, dev: 'computer' });
    expect(await readCfg(a)).toMatchObject({ peerWatch: true, peerSeen: false });
    // a second device of the SAME kind pairs: records carry the writer id
    await startSync(b, code);
    await syncNow(b, { api, dev: 'computer' });
    expect((await readCfg(b)).peerSeen).toBe(true);
    await b.notes.put({ id: 'n2', text: 'y' });
    await syncNow(b, { api, dev: 'computer' });
    await syncNow(a, { api, dev: 'computer' });
    expect((await readCfg(a)).peerSeen).toBe(true);
    expect((await readCfg(a)).devId).not.toBe((await readCfg(b)).devId);
  });
  it('two devices with two different codes never see each other: both stay «alone»', async () => {
    const api = fakeServer();
    const a = fresh();
    const b = fresh();
    await startSync(a, newCode());
    await startSync(b, newCode());
    await a.notes.put({ id: 'n1', text: 'x' });
    await b.notes.put({ id: 'n2', text: 'y' });
    for (let i = 0; i < 2; i++) {
      await syncNow(a, { api, dev: 'computer' });
      await syncNow(b, { api, dev: 'phone' });
    }
    expect((await readCfg(a)).peerSeen).toBe(false);
    expect((await readCfg(b)).peerSeen).toBe(false);
  });
  it('a sync from before this existed gets a writer id but is not watched', async () => {
    const api = fakeServer();
    const a = fresh();
    await startSync(a, newCode());
    await a.meta.update('syncCfg', { devId: undefined, peerWatch: undefined, peerSeen: undefined });
    await syncNow(a, { api, dev: 'computer' });
    const cfg = await readCfg(a);
    expect(cfg.devId).toBeTruthy();
    expect(cfg.peerWatch).toBeFalsy();
  });
});
