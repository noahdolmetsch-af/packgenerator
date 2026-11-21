// Noah 10.11.2026: ein Abgleich am Handy hing 7 Minuten beim Holen und die Haken gingen nie raus.
// Jetzt: zuerst senden, Holen in Paketen mit Zeitlimit (die nächste Runde macht weiter), und eine hängende
// Runde gibt den Weg wieder frei. Erfundene Daten.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, readCfg, applyPackage, APPLY_CHUNK } from '../src/lib/sync/engine.js';
import { noteKey } from '../src/lib/sync/track.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`sync-first-${n++}`);
function server() {
  const r = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  const api = {
    calls: [],
    async call(step, body) {
      api.calls.push(step);
      const res = await handler(new Request(`https://packgen.example.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'http://localhost:5173' } }));
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message), { code: data.code });
      return data;
    },
  };
  return api;
}
const tickRow = (i) => ({ id: `fl-test-${i}`, actId: 'tennis', day: '2026-11-10', at: '2026-11-10T13:00:00.000Z', n: 1 });

/** Two devices already paired and in step. */
async function paired(api) {
  const code = newCode();
  const computer = fresh();
  const phone = fresh();
  await computer.flowLog.put(tickRow(0));
  await startSync(computer, code);
  await syncNow(computer, { api, dev: 'computer' });
  await startSync(phone, code);
  await syncNow(phone, { api, dev: 'phone' });
  return { code, computer, phone };
}

describe('zuerst senden', () => {
  it('a paired device sends its ticks before it reads anything', async () => {
    const api = server();
    const { phone, computer } = await paired(api);
    await phone.flowLog.put(tickRow(1));
    api.calls.length = 0;
    expect(await syncNow(phone, { api, dev: 'phone' })).toMatchObject({ sent: 1 });
    expect(api.calls[0]).toBe('push');
    expect(api.calls).toContain('pull');
    await syncNow(computer, { api, dev: 'computer' });
    expect((await computer.flowLog.get('fl-test-1')).actId).toBe('tennis');
  });

  it('a slow pull cannot hold back a tick: the tick is on the server before the pull is asked', async () => {
    const api = server();
    const { phone } = await paired(api);
    await phone.flowLog.put(tickRow(2));
    const order = [];
    const slow = {
      async call(step, body) {
        order.push(step);
        if (step === 'pull') throw Object.assign(new Error('timeout'), { code: 'timeout' });
        return api.call(step, body);
      },
    };
    await expect(syncNow(phone, { api: slow, dev: 'phone' })).rejects.toMatchObject({ code: 'timeout' });
    expect(order).toEqual(['push', 'pull']);
    expect((await phone.meta.get(noteKey('flowLog', 'fl-test-2'))).dirty).toBe(0); // it went out
  });

  it('a change on both devices still settles: the newer one wins, with or without sending first', async () => {
    const api = server();
    const { phone, computer } = await paired(api);
    await phone.flowLog.update('fl-test-0', { n: 2 });
    await phone.meta.update(noteKey('flowLog', 'fl-test-0'), { at: '2026-11-10T13:10:00.000Z' });
    await computer.flowLog.update('fl-test-0', { n: 3 });
    await computer.meta.update(noteKey('flowLog', 'fl-test-0'), { at: '2026-11-10T13:20:00.000Z' });
    await syncNow(phone, { api, dev: 'phone' });
    expect(await syncNow(computer, { api, dev: 'computer' })).toMatchObject({ asks: 0, sent: 1 });
    await syncNow(phone, { api, dev: 'phone' });
    expect((await phone.flowLog.get('fl-test-0')).n).toBe(3);
  });

  it('a new pairing reads first and does not send its whole database before it has read to the end', async () => {
    const api = server();
    const code = newCode();
    const computer = fresh();
    await computer.flowLog.bulkPut(Array.from({ length: 60 }, (_, i) => tickRow(i)));
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    const phone = fresh();
    await phone.items.put({ id: 'EL01', name: 'test_data_gtp_ Lampe' });
    await startSync(phone, code);
    expect((await readCfg(phone)).pulled).toBe(false);
    api.calls.length = 0;
    const r = await syncNow(phone, { api, dev: 'phone', budgetMs: -1 }); // no time: stops after the first package
    expect(r.more).toBe(true);
    expect(api.calls).toEqual(['pull']); // nothing is sent while the first pull is unfinished
    expect(await phone.flowLog.count()).toBe(APPLY_CHUNK);
    expect((await readCfg(phone)).pulled).toBe(false);
  });
});

describe('Holen in Paketen mit Zeitlimit', () => {
  it('stops when the time is up, saves how far it got, and the next rounds bring the rest', async () => {
    const api = server();
    const code = newCode();
    const computer = fresh();
    await computer.flowLog.bulkPut(Array.from({ length: 80 }, (_, i) => tickRow(i)));
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    const phone = fresh();
    await startSync(phone, code);
    let rounds = 0;
    let last;
    do {
      last = await syncNow(phone, { api, dev: 'phone', budgetMs: -1 });
      rounds++;
    } while (last.more && rounds < 20);
    expect(rounds).toBeGreaterThan(1);
    expect(await phone.flowLog.count()).toBe(80);
    expect((await readCfg(phone)).pulled).toBe(true);
    // everything taken is clean: nothing goes back to the server
    expect(await syncNow(phone, { api, dev: 'phone' })).toMatchObject({ taken: 0, sent: 0 });
  });

  it('shouldStop ends the pull at the next package', async () => {
    const api = server();
    const code = newCode();
    const computer = fresh();
    await computer.flowLog.bulkPut(Array.from({ length: 60 }, (_, i) => tickRow(i)));
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    const phone = fresh();
    await startSync(phone, code);
    const r = await syncNow(phone, { api, dev: 'phone', shouldStop: () => true });
    expect(r.more).toBe(true);
    expect(await phone.flowLog.count()).toBe(APPLY_CHUNK);
  });

  it('one record that cannot be stored stops the round as before, but the ones before it are stored', async () => {
    const db = fresh();
    const code = newCode();
    await startSync(db, code);
    const good = (i) => ({ p: { t: 'flowLog', id: `fl-ok-${i}`, v: tickRow(i), at: '2026-11-10T13:00:00.000Z' }, s: i + 1 });
    const bad = { p: { t: 'items', id: 'x', v: { name: 'ohne id' }, at: '2026-11-10T13:00:00.000Z' }, s: 3 }; // items need an id: the save fails
    await expect(applyPackage(db, [good(0), good(1), bad, good(3)])).rejects.toBeTruthy();
    expect(await db.flowLog.count()).toBe(2);
  });
});

describe('eine hängende Runde gibt den Weg frei (auto.svelte.js)', () => {
  it('asks the round to stop, and when it still hangs the next one starts', async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const started = [];
    vi.doMock('../src/lib/sync/engine.js', () => ({
      syncNow: vi.fn((db, opts) => new Promise(() => started.push(opts))), // never ends
      readCfg: vi.fn(async () => null),
      settleAsks: vi.fn(async () => {}),
    }));
    vi.doMock('../src/lib/push/client.js', () => ({ afterSync: () => {} }));
    const { runSync, sync, ROUND_MAX_MS, FREE_AFTER_MS } = await import('../src/lib/sync/auto.svelte.js');
    runSync({});
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toHaveLength(1);
    expect(sync.running).toBe(true);
    expect(started[0].shouldStop()).toBe(false);
    const next = runSync({}); // waits behind the hanging round
    await vi.advanceTimersByTimeAsync(ROUND_MAX_MS);
    expect(started[0].shouldStop()).toBe(true); // asked to stop at its next step
    expect(started).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(FREE_AFTER_MS + 10);
    expect(started).toHaveLength(2); // the waiting round has started
    expect(started[1].shouldStop()).toBe(false);
    expect(sync.running).toBe(true);
    void next;
    vi.useRealTimers();
    vi.doUnmock('../src/lib/sync/engine.js');
  });

  it('a round whose pull ran out of time is followed by the next one', async () => {
    vi.resetModules();
    vi.useFakeTimers();
    let calls = 0;
    vi.doMock('../src/lib/sync/engine.js', () => ({
      syncNow: vi.fn(async () => (++calls < 3 ? { more: true } : { taken: 1 })),
      readCfg: vi.fn(async () => null),
      settleAsks: vi.fn(async () => {}),
    }));
    vi.doMock('../src/lib/push/client.js', () => ({ afterSync: () => {} }));
    const { runSync, CONTINUE_MS } = await import('../src/lib/sync/auto.svelte.js');
    await runSync({});
    expect(calls).toBe(1);
    await vi.advanceTimersByTimeAsync(CONTINUE_MS + 5);
    expect(calls).toBe(2);
    await vi.advanceTimersByTimeAsync(CONTINUE_MS + 5);
    expect(calls).toBe(3);
    await vi.advanceTimersByTimeAsync(CONTINUE_MS + 5);
    expect(calls).toBe(3); // the last round was complete
    vi.useRealTimers();
    vi.doUnmock('../src/lib/sync/engine.js');
  });
});
