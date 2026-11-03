// «Abgleich vergleichen» (Noah 03.11.2026): finds a record the server never got or this device never took. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow } from '../src/lib/sync/engine.js';
import { compareSync, fixMissing } from '../src/lib/sync/compare.js';
import { noteKey } from '../src/lib/sync/track.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`sync-cmp-${n++}`);
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

describe('compare and fix', () => {
  it('finds a bike the server lacks and one this device lacks, then fills both, deleting nothing', async () => {
    const api = server();
    const code = newCode();
    const pc = fresh();
    await pc.bikes.bulkPut([{ id: 'b1', name: 'Gravel' }, { id: 'b2', name: 'Canyon Lux' }]);
    await startSync(pc, code);
    await syncNow(pc, { api, dev: 'computer' });
    const phone = fresh();
    await startSync(phone, code);
    await syncNow(phone, { api, dev: 'phone' });
    expect(await phone.bikes.count()).toBe(2);
    // the phone loses a bike without a trace (as after a browser clean-up of one table); the computer keeps one the server never got
    await phone.bikes.delete('b2');
    await phone.meta.delete(noteKey('bikes', 'b2'));
    await pc.items.put({ id: 'i9', name: 'Lampe' });
    await pc.meta.update(noteKey('items', 'i9'), { dirty: 0, base: 5 }); // the computer believes it was sent

    const f = await compareSync(phone, { api });
    expect(f.missingHere.map((r) => r.v.name)).toEqual(['Canyon Lux']);
    const g = await compareSync(pc, { api });
    expect(g.missingThere.map((r) => r.id)).toEqual(['i9']);

    expect(await fixMissing(phone, f)).toEqual({ got: 1, sent: 0 });
    expect((await phone.bikes.get('b2')).name).toBe('Canyon Lux');
    expect(await fixMissing(pc, g)).toEqual({ got: 0, sent: 1 });
    await syncNow(pc, { api, dev: 'computer' });
    await syncNow(phone, { api, dev: 'phone' });
    const h = await compareSync(phone, { api });
    expect(h).toMatchObject({ missingHere: [], missingThere: [], deletedThere: [] });
  });
  it('is off without a sync', async () => {
    expect(await compareSync(fresh(), { api: server() })).toEqual({ off: true });
  });
});
