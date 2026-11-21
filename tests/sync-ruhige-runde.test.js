// Tempo (Noah 11.11.2026 «1-4 umsetzen», Messung 10.11.): a round where the server sends nothing reads the change notes once, not twice.
// Und nach einer ruhigen Runde fragt die App den Server nichts für Erinnerungen. Erfundene Daten.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow } from '../src/lib/sync/engine.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`sync-quiet-${n++}`);
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
const tickRow = (i) => ({ id: `fl-test-${i}`, actId: 'tennis', day: '2026-11-10', at: '2026-11-10T13:00:00.000Z', n: 1 });
/** Counts how often the notes of the changed records are read. */
function countNoteReads(db) {
  const reads = { n: 0 };
  const where = db.meta.where.bind(db.meta);
  db.meta.where = (k) => {
    const c = where(k);
    const startsWith = c.startsWith.bind(c);
    c.startsWith = (p) => {
      if (p === 'sync|') reads.n++;
      return startsWith(p);
    };
    return c;
  };
  return reads;
}

describe('a quiet round', () => {
  it('reads the notes once when the server sends nothing, twice when it does', async () => {
    const api = server();
    const code = newCode();
    const computer = fresh();
    const phone = fresh();
    await computer.flowLog.put(tickRow(0));
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    await startSync(phone, code);
    await syncNow(phone, { api, dev: 'phone' });
    await syncNow(computer, { api, dev: 'computer' }); // in step

    const reads = countNoteReads(computer);
    const quiet = await syncNow(computer, { api, dev: 'computer' });
    expect(quiet).toMatchObject({ taken: 0, sent: 0 });
    expect(reads.n).toBe(1);

    // the phone changes something: the computer's next round gets it and reads twice (it may have to settle something)
    await phone.flowLog.put(tickRow(1));
    await syncNow(phone, { api, dev: 'phone' });
    reads.n = 0;
    expect(await syncNow(computer, { api, dev: 'computer' })).toMatchObject({ taken: 1 });
    expect(reads.n).toBe(2);
    expect((await computer.flowLog.get('fl-test-1')).actId).toBe('tennis');
  });

  it('a change made on this device is still sent in the same round', async () => {
    const api = server();
    const code = newCode();
    const computer = fresh();
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    await computer.flowLog.put(tickRow(5));
    expect(await syncNow(computer, { api, dev: 'computer' })).toMatchObject({ sent: 1 });
  });
});
