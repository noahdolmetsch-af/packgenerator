// Repro for Noah 03.11.2026 (Handy nach dem Koppeln unvollständig): one record that this device cannot
// store (e.g. no space left) must not stop all records behind it. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, readCfg } from '../src/lib/sync/engine.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`sync-bad-${n++}`);
function server() {
  const r = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  return {
    async call(step, body) {
      const res = await handler(new Request(`https://packgen.example.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'http://localhost:5173' } }));
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message), { code: data.code });
      return data;
    },
  };
}

describe('one record the phone cannot store', () => {
  it('does not keep the records behind it from arriving', async () => {
    const api = server();
    const code = newCode();
    const pc = fresh();
    await pc.bikes.bulkPut([{ id: 'b1', name: 'Gravel' }, { id: 'b2', name: 'Canyon Lux' }, { id: 'b3', name: 'Rennrad' }]);
    await pc.items.bulkPut([{ id: 'i1', name: 'Lampe' }, { id: 'i2', name: 'Pumpe' }]);
    await startSync(pc, code);
    await syncNow(pc, { api, dev: 'computer' });

    const phone = fresh();
    phone.bikes.hook('creating', (k, v) => { if (v.id === 'b2') throw Object.assign(new Error('full'), { name: 'QuotaExceededError' }); });
    await startSync(phone, code);
    await syncNow(phone, { api, dev: 'phone' });
    const got = { bikes: (await phone.bikes.toArray()).map((b) => b.id).sort(), items: (await phone.items.toArray()).map((b) => b.id).sort() };
    expect(got.items).toEqual(['i1', 'i2']);
    expect(got.bikes).toEqual(['b1', 'b3']);
  });
});

describe('after the fix', () => {
  it('names the record, keeps the rest, tries again later and then gets it', async () => {
    const api = server();
    const code = newCode();
    const pc = fresh();
    await pc.bikes.bulkPut([{ id: 'b1', name: 'Gravel' }, { id: 'b2', name: 'Canyon Lux' }]);
    await startSync(pc, code);
    await syncNow(pc, { api, dev: 'computer' });
    const phone = fresh();
    let full = true;
    phone.bikes.hook('creating', (k, v) => { if (full && v.id === 'b2') throw Object.assign(new Error('full'), { name: 'QuotaExceededError' }); });
    await startSync(phone, code);
    const t0 = '2026-11-03T10:00:00.000Z';
    const r = await syncNow(phone, { api, dev: 'phone', now: () => t0 });
    expect(r.failed).toMatchObject([{ t: 'bikes', id: 'b2', name: 'QuotaExceededError', label: 'Canyon Lux' }]);
    expect((await readCfg(phone)).failedN).toBe(1);
    // too early: not asked again; space is back
    full = false;
    await syncNow(phone, { api, dev: 'phone', now: () => '2026-11-03T10:05:00.000Z' });
    expect(await phone.bikes.get('b2')).toBeUndefined();
    // after 30 minutes the round pulls from the failed record on
    await syncNow(phone, { api, dev: 'phone', now: () => '2026-11-03T10:31:00.000Z' });
    expect((await phone.bikes.get('b2')).name).toBe('Canyon Lux');
    expect((await readCfg(phone)).failedN).toBe(0);
  });
  it('says «storage full» for a full phone, not «server»', async () => {
    const { errCode } = await import('../src/lib/sync/engine.js');
    expect(errCode(Object.assign(new Error(), { name: 'QuotaExceededError' }))).toBe('storage_full');
    expect(errCode(Object.assign(new Error(), { code: 'offline' }))).toBe('offline');
  });
});
