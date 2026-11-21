// Noah 21.11.2026 («Haken vom Computer fehlen am Handy»): the sync checks itself. A server that starts again at
// number 1 no longer leaves the other device blind, and a device that holds fewer or more entries than the server
// finds and fills the gaps (only adding). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode, keysOf as codeKeys } from '../src/lib/sync/code.js';
import { startSync, syncNow, readCfg, CHECK_EVERY_MS } from '../src/lib/sync/engine.js';
import { makeHandler } from '../api/sync.js';
import { spaceOf, keysOf as spaceKeys } from '../api/_lib/sync.js';
import { fakeRedis } from './fakeredis.js';
import { tick } from '../src/lib/flowdb.js';
import { seedActs } from '../src/lib/flow.js';

let n = 0;
const fresh = () => createDb(`heal-${n++}`);

function fakeServer({ withCount = true } = {}) {
  const redis = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://r.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: redis.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  const api = {
    calls: [],
    async call(step, body) {
      api.calls.push(step);
      const res = await handler(new Request(`https://x.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(withCount ? body : { ...body, count: undefined }), headers: { origin: 'http://localhost:5173' } }));
      const d = await res.json();
      if (!res.ok) throw Object.assign(new Error(d.message), { code: d.code });
      return d;
    },
  };
  return { api, redis };
}
const spaceOfCode = async (code) => spaceKeys(spaceOf((await codeKeys(code)).token));

async function pair() {
  const server = fakeServer();
  const phone = fresh();
  const computer = fresh();
  const code = newCode();
  await computer.flowActs.bulkPut(seedActs());
  await startSync(computer, code);
  await syncNow(computer, { api: server.api, dev: 'computer' });
  await startSync(phone, code);
  await syncNow(phone, { api: server.api, dev: 'phone' });
  const go = (db, dev, o = {}) => syncNow(db, { api: server.api, dev, ...o });
  return { ...server, phone, computer, code, go };
}

describe('the ticks of one device reach the other', () => {
  it('a tick and a new activity go from the computer to the phone', async () => {
    const { phone, computer, go } = await pair();
    expect(await phone.flowActs.count()).toBe(12);
    await tick(computer, await computer.flowActs.get('tennis'), { day: '2026-11-21' });
    await computer.flowActs.put({ ...(await computer.flowActs.get('gym')), id: 'act-gym2', name: 'Gym' });
    await go(computer, 'computer');
    await go(phone, 'phone');
    expect(await phone.flowLog.count()).toBe(1);
    expect((await phone.flowActs.get('act-gym2')).name).toBe('Gym');
  });
});

describe('a server that starts again (its numbers are lower than what this device has seen)', () => {
  it('the phone is not blind any more: it takes the new entries and the computer sends what the server lost', async () => {
    const { phone, computer, redis, code, go } = await pair();
    for (let i = 0; i < 5; i++) await computer.notes.put({ id: `n${i}`, text: 'a' });
    await go(computer, 'computer');
    await go(phone, 'phone');
    expect(await phone.notes.count()).toBe(5);
    const sk = await spaceOfCode(code);
    redis.run('DEL', [sk.data, sk.log, sk.seq]); // the server space is gone
    await computer.notes.put({ id: 'neu', text: 'Haken von heute' });
    await go(computer, 'computer'); // the new entry is number 1 on the empty server
    const r = await go(phone, 'phone'); // the phone had seen number ~25: it notices and starts again
    expect(r.reset).toBe(true);
    for (let i = 0; i < 6 && (await readCfg(phone)).pulled === false; i++) await go(phone, 'phone');
    await go(phone, 'phone');
    await go(computer, 'computer');
    expect((await phone.notes.get('neu')).text).toBe('Haken von heute');
    // the server holds everything again, from both devices
    const flat = redis.run('HLEN', [sk.data]);
    expect(flat).toBeGreaterThanOrEqual(5 + 12 + 1);
    expect(await computer.notes.count()).toBe(6);
    expect(await phone.notes.count()).toBe(6);
  });
});

describe('the count check (api status count + engine integrity)', () => {
  it('equal numbers: ok, and a quiet round asks nothing more until the check is old', async () => {
    const { api, phone, computer, go } = await pair();
    await computer.notes.put({ id: 'a', text: 'x' });
    await go(computer, 'computer');
    await go(phone, 'phone');
    const c = (await readCfg(phone)).check;
    expect(c).toMatchObject({ ok: true });
    expect(c.here).toBe(c.server);
    // a quiet round (nothing moved): no new count question
    const before = api.calls.length;
    await go(phone, 'phone', { now: () => new Date(Date.parse(c.at) + 60_000).toISOString() });
    expect(api.calls.slice(before)).not.toContain('status');
    // an old check is repeated
    await go(phone, 'phone', { now: () => new Date(Date.parse(c.at) + CHECK_EVERY_MS + 1000).toISOString() });
    expect(api.calls.slice(before)).toContain('status');
  });

  it('the server lost a record the device still has: it is sent again, nothing is deleted anywhere', async () => {
    const { redis, phone, computer, code, go } = await pair();
    await computer.notes.put({ id: 'weg', text: 'wichtig' });
    await go(computer, 'computer');
    await go(phone, 'phone');
    // the server loses one record (its entry in the log and the data), numbers stay
    const sk = await spaceOfCode(code);
    const k = [...redis.run('ZRANGEBYSCORE', [sk.log, '(0', '+inf', 'WITHSCORES'])].filter((_, i) => i % 2 === 0).pop();
    redis.run('HDEL', [sk.data, k]);
    redis.run('ZADD', [sk.log, 1, k]); // keeps the log row; the pull then finds no data (as a server that lost it)
    redis.run('EXPIRE', [sk.log, 1]);
    // make the check due again
    const at = (await readCfg(computer)).check?.at ?? '2026-01-01T00:00:00.000Z';
    const later = () => new Date(Date.parse(at) + CHECK_EVERY_MS + 5000).toISOString();
    const r = await go(computer, 'computer', { now: later });
    expect(r.healed).toBeTruthy();
    expect(await computer.notes.get('weg')).toBeTruthy();
    await go(phone, 'phone', { now: later });
    expect(await phone.notes.get('weg')).toBeTruthy();
  });

  it('this device never received a record: the check finds it and takes it', async () => {
    const { phone, computer, go } = await pair();
    await computer.notes.put({ id: 'fehlt', text: 'am Handy' });
    await go(computer, 'computer');
    // the phone's cursor jumped over it (a bug of any kind): it believes it has seen everything
    await phone.meta.update('syncCfg', { since: 10_000_000 });
    const phoneCfg = await readCfg(phone);
    expect(phoneCfg.since).toBe(10_000_000);
    await go(phone, 'phone'); // seq < since: the reset starts everything anew
    for (let i = 0; i < 4 && !(await phone.notes.get('fehlt')); i++) await go(phone, 'phone');
    expect((await phone.notes.get('fehlt')).text).toBe('am Handy');
  });

  it('an older server without the count does no harm', async () => {
    const server = fakeServer({ withCount: false });
    const phone = fresh();
    const code = newCode();
    await startSync(phone, code);
    await phone.notes.put({ id: 'a', text: 'x' });
    const r = await syncNow(phone, { api: server.api, dev: 'phone' });
    expect(r.sent).toBe(1);
    expect((await readCfg(phone)).check).toBeUndefined();
  });
});
