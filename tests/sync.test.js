// P8 «Automatischer Abgleich» (Noah 18.10.2026 «1b … 2b 3b»): the change notes, the pairing code, the
// server space and two devices that sync through it. Fictional data only.
// The store is a small fake Redis (the push script runs as its JavaScript twin). When a redis-server is
// installed (not on CI), the same two-device run also goes through a real Redis with the real script.
import 'fake-indexeddb/auto';
import { describe, it, expect, afterAll } from 'vitest';
import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
import { createDb, syncLocal, DATA_TABLES } from '../src/lib/db.js';
import { noteKey } from '../src/lib/sync/track.js';
import { newCode, readCode, keysOf, seal, unseal, recName } from '../src/lib/sync/code.js';
import { startSync, stopSync, syncNow, readCfg, stable, CFG, autoPick, settle, lostVersions, bringBack, ASK, askKey } from '../src/lib/sync/engine.js';
import { makeHandler } from '../api/sync.js';
import { spaceOf, readPush } from '../api/_lib/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`sync-test-${n++}`);
/** When this device changed a record (the note's time), set by hand so the order is certain. */
const stamp = (db, t, id, at) => db.meta.update(noteKey(t, id), { at });
const openAsks = (db) => db.meta.where('key').startsWith(ASK).count();
const REDIS = 'https://redis.example.test';

/** The server (the real handler) and a client api for the engine. */
function server(redisFetch) {
  const handler = makeHandler({ env: () => ({ redisUrl: REDIS, redisToken: 'r' }), doFetch: redisFetch });
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

function fakeServer() {
  const r = fakeRedis();
  const api = server(async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }));
  return { api, redis: r };
}

describe('the change notes (track.js)', () => {
  it('note every save, update and delete in the same step, and leave device rows out', async () => {
    const db = fresh();
    await db.items.put({ id: 'EL01', name: 'test_data_gtp_ Lampe' });
    await db.items.bulkPut([{ id: 'EL02' }, { id: 'EL03' }]);
    await db.items.update('EL02', { name: 'x' });
    await db.items.delete('EL03');
    await db.settings.put({ key: 'tips', value: 1 });
    await db.settings.put({ key: 'update.kitTemplates2026', value: '2026-10-18' }); // each device runs its own updates
    await db.trips.put({ id: 'T1' });
    await db.trips.clear();
    const notes = Object.fromEntries((await db.meta.where('key').startsWith('sync|').toArray()).map((x) => [x.key, x]));
    expect(Object.keys(notes).sort()).toEqual([noteKey('items', 'EL01'), noteKey('items', 'EL02'), noteKey('items', 'EL03'), noteKey('trips', 'T1')].sort());
    expect(notes[noteKey('items', 'EL03')]).toMatchObject({ del: true, dirty: 1, base: 0 });
    expect(notes[noteKey('trips', 'T1')]).toMatchObject({ del: true });
    expect(notes[noteKey('items', 'EL01')].at).toMatch(/^\d{4}-\d\d-\d\dT/);
    // the records stay as they were: no new field
    expect(await db.items.get('EL01')).toEqual({ id: 'EL01', name: 'test_data_gtp_ Lampe' });
  });
  it('a save of exactly what is stored is no change: no note (Noah 24.10.2026, «805 Einträge»)', async () => {
    const db = fresh();
    await db.items.bulkPut([{ id: 'A', name: 'x', tags: ['b', 'a'] }, { id: 'B', name: 'y' }]);
    await db.meta.where('key').startsWith('sync|').modify({ dirty: 0, base: 3 });
    // the same content again (other key order too), and one real change
    await db.items.bulkPut([{ tags: ['b', 'a'], name: 'x', id: 'A' }, { id: 'B', name: 'z' }]);
    await db.items.put({ id: 'A', name: 'x', tags: ['b', 'a'] });
    expect((await db.meta.get(noteKey('items', 'A'))).dirty).toBe(0);
    expect((await db.meta.get(noteKey('items', 'B'))).dirty).toBe(1);
  });
  it('restoring the same backup again marks nothing as changed; only what differs', async () => {
    const { buildBackup, restoreBackup } = await import('../src/lib/backup.js');
    const db = fresh();
    await db.items.bulkPut([{ id: 'A', name: 'x' }, { id: 'B', name: 'y' }, { id: 'C', name: 'weg' }]);
    await db.settings.put({ key: 'riderWeightG', value: 70000 });
    const file = await buildBackup(db);
    file.tables.items = file.tables.items.filter((r) => r.id !== 'C').map((r) => (r.id === 'B' ? { ...r, name: 'neu' } : r));
    await db.meta.where('key').startsWith('sync|').modify({ dirty: 0, base: 3 });
    await restoreBackup(db, file, 'replace');
    const dirty = (await db.meta.where('key').startsWith('sync|').toArray()).filter((x) => x.dirty).map((x) => [x.id, x.del]);
    expect(dirty.sort()).toEqual([['B', false], ['C', true]]);
    expect(await db.items.get('C')).toBeUndefined();
  });
  it('keep the version number the device had of a record', async () => {
    const db = fresh();
    await db.items.put({ id: 'A' });
    await db.meta.update(noteKey('items', 'A'), { base: 7, dirty: 0 });
    await db.items.put({ id: 'A', name: 'neu' });
    expect(await db.meta.get(noteKey('items', 'A'))).toMatchObject({ base: 7, dirty: 1 });
  });
});

describe('the pairing code (code.js)', () => {
  it('is 32 letters in 8 groups and reads back forgiving', () => {
    const c = newCode();
    expect(c).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(readCode(c.toLowerCase().replace(/-/g, ' '))).toBe(c);
    expect(readCode('ABC')).toBeNull();
    expect(readCode(c.replace(/0/g, 'O'))).toBe(c);
  });
  it('gives both devices the same keys; the envelope opens only with the right code', async () => {
    const c = newCode();
    const a = await keysOf(c);
    const b = await keysOf(readCode(c));
    expect(a.token).toBe(b.token);
    expect(a.token).toMatch(/^[0-9a-f]{64}$/);
    expect(await recName(a, 'items', 'EL01')).toBe(await recName(b, 'items', 'EL01'));
    const e = await seal(a, { t: 'items', id: 'EL01', v: { name: 'test_data_gtp_' } });
    expect(e).not.toContain('test_data_gtp_');
    expect(await unseal(b, e)).toEqual({ t: 'items', id: 'EL01', v: { name: 'test_data_gtp_' } });
    expect(await unseal(await keysOf(newCode()), e)).toBeNull();
  });
});

describe('the server space (api/sync.js)', () => {
  it('checks what comes in', () => {
    expect(readPush([{ k: 'a'.repeat(32), base: 0, e: 'QUJD' }])).toHaveLength(1);
    expect(readPush([{ k: 'nope', base: 0, e: 'QUJD' }])).toBeNull();
    expect(readPush([{ k: 'a'.repeat(32), base: -1, e: 'QUJD' }])).toBeNull();
    expect(readPush([])).toBeNull();
    expect(spaceOf('a'.repeat(64))).toMatch(/^[0-9a-f]{32}$/);
  });
  it('refuses a wrong token and answers a conflict when someone wrote in between', async () => {
    const { api, redis } = fakeServer();
    await expect(api.call('status', { token: 'x' })).rejects.toMatchObject({ code: 'bad_request' });
    const token = 'b'.repeat(64);
    const k = 'c'.repeat(32);
    expect(await api.call('push', { token, items: [{ k, base: 0, e: 'QQ==' }] })).toEqual({ done: [{ k, s: 1 }], conflicts: [] });
    expect(await api.call('push', { token, items: [{ k, base: 0, e: 'Qg==' }] })).toEqual({ done: [], conflicts: [{ k, s: 1 }] });
    expect(await api.call('push', { token, items: [{ k, base: 1, e: 'Qg==' }] })).toEqual({ done: [{ k, s: 2 }], conflicts: [] });
    expect(await api.call('pull', { token, since: 0 })).toEqual({ seq: 2, items: [{ k, s: 2, e: 'Qg==' }], next: 2, more: false });
    expect(await api.call('pull', { token, since: 2 })).toMatchObject({ items: [], more: false });
    // nothing readable is stored: only the opaque name and the sealed envelope
    expect([...redis.kv.keys()].every((x) => x.startsWith(`sync:${spaceOf(token)}:`))).toBe(true);
    await api.call('forget', { token });
    expect(await api.call('status', { token })).toEqual({ seq: 0 });
  });
  it('says clearly when the store is not connected', async () => {
    const handler = makeHandler({ env: () => ({ redisUrl: '', redisToken: '' }) });
    const res = await handler(new Request('https://x.test/api/sync?step=status', { method: 'POST', body: JSON.stringify({ token: 'b'.repeat(64) }) }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('storage_not_set_up');
  });
});

/** Two devices, one code: the whole story. */
async function twoDevices(api) {
  const phone = fresh();
  const computer = fresh();
  const code = newCode();
  const run = (db, dev) => syncNow(db, { api, dev });

  // the computer has data and switches the sync on
  await computer.items.bulkPut([
    { id: 'EL01', name: 'test_data_gtp_ Lampe', weightG: 120 },
    { id: 'EL02', name: 'test_data_gtp_ Akku', weightG: 300 },
  ]);
  await computer.settings.put({ key: 'riderKg', value: 70 });
  await computer.settings.put({ key: 'tips', value: 'device only' });
  await startSync(computer, code);
  expect(await run(computer, 'computer')).toMatchObject({ sent: 3, asks: 0 });

  // the phone pairs: it gets everything, the device-only row stays on the computer
  await startSync(phone, code);
  expect(await run(phone, 'phone')).toMatchObject({ taken: 3, sent: 0, asks: 0 });
  expect(await phone.items.get('EL01')).toEqual({ id: 'EL01', name: 'test_data_gtp_ Lampe', weightG: 120 });
  expect(await phone.settings.get('tips')).toBeUndefined();
  // nothing left to send: the taken records are clean
  expect(await run(phone, 'phone')).toMatchObject({ taken: 0, sent: 0 });

  // a change and a delete on the phone arrive on the computer
  await phone.items.update('EL01', { weightG: 118 });
  await phone.items.delete('EL02');
  await phone.trips.put({ id: 'T1', name: 'test_data_gtp_ Tour' });
  expect(await run(phone, 'phone')).toMatchObject({ sent: 3 });
  expect(await run(computer, 'computer')).toMatchObject({ taken: 3, sent: 0 });
  expect((await computer.items.get('EL01')).weightG).toBe(118);
  expect(await computer.items.get('EL02')).toBeUndefined();
  expect((await computer.trips.get('T1')).name).toBe('test_data_gtp_ Tour');

  // both change the same record (Noah 24.10.2026): no question, the newer change wins on both devices
  await phone.items.update('EL01', { weightG: 110 });
  await stamp(phone, 'items', 'EL01', '2026-10-24T08:00:00.000Z');
  await computer.items.update('EL01', { weightG: 125 });
  await stamp(computer, 'items', 'EL01', '2026-10-24T09:00:00.000Z');
  await run(phone, 'phone');
  expect(await run(computer, 'computer')).toMatchObject({ asks: 0, sent: 1 });
  expect((await computer.items.get('EL01')).weightG).toBe(125);
  await run(phone, 'phone');
  expect((await phone.items.get('EL01')).weightG).toBe(125);
  // the version that lost waits quietly on the computer
  const [l] = await lostVersions(computer);
  expect(l).toMatchObject({ t: 'items', id: 'EL01', dev: 'phone', at: '2026-10-24T08:00:00.000Z' });
  expect(l.v.weightG).toBe(110);

  // again, and this time the phone changed later: its version wins on the computer too
  await computer.items.update('EL01', { weightG: 1 });
  await stamp(computer, 'items', 'EL01', '2026-10-24T10:00:00.000Z');
  await phone.items.update('EL01', { name: 'test_data_gtp_ Lampe neu' });
  await stamp(phone, 'items', 'EL01', '2026-10-24T11:00:00.000Z');
  await run(phone, 'phone');
  expect(await run(computer, 'computer')).toMatchObject({ asks: 0, taken: 1 });
  expect(await computer.items.get('EL01')).toEqual({ id: 'EL01', name: 'test_data_gtp_ Lampe neu', weightG: 125 });
  expect(await run(computer, 'computer')).toMatchObject({ sent: 0, asks: 0 });
  // «Bring back» on the computer: the replaced version returns and reaches the phone
  const back = (await lostVersions(computer)).find((x) => x.v?.weightG === 1);
  await bringBack(computer, back.key);
  expect((await computer.items.get('EL01')).weightG).toBe(1);
  expect(await run(computer, 'computer')).toMatchObject({ sent: 1 });
  await run(phone, 'phone');
  expect((await phone.items.get('EL01')).weightG).toBe(1);
  // and bringing back can be undone: the version it replaced is kept in its place
  expect((await lostVersions(computer)).find((x) => x.id === 'EL01').v.name).toBe('test_data_gtp_ Lampe neu');
  await bringBack(computer, (await lostVersions(computer)).find((x) => x.id === 'EL01').key);
  await run(computer, 'computer');
  await run(phone, 'phone');
  expect(await phone.items.get('EL01')).toEqual({ id: 'EL01', name: 'test_data_gtp_ Lampe neu', weightG: 125 });

  // the same change on both is no question
  await phone.items.update('EL01', { qty: 2 });
  await computer.items.update('EL01', { qty: 2 });
  await run(phone, 'phone');
  expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
  return { phone, computer, code };
}

describe('two devices (engine.js)', () => {
  it('sync, delete, and settle a change on both devices by itself: the newer wins, the other can come back', async () => {
    const { api } = fakeServer();
    await twoDevices(api);
  });
  it('a second device with its own data: only where the two really differ, and the newer change counts', async () => {
    const { api } = fakeServer();
    const a = fresh();
    const b = fresh();
    const code = newCode();
    await a.items.bulkPut([{ id: 'X', name: 'gleich' }, { id: 'Y', name: 'A' }]);
    await stamp(a, 'items', 'Y', '2026-10-24T08:00:00.000Z');
    await b.items.bulkPut([{ id: 'X', name: 'gleich' }, { id: 'Y', name: 'B' }, { id: 'Z', name: 'nur B' }]);
    await stamp(b, 'items', 'Y', '2026-10-24T09:00:00.000Z');
    await startSync(a, code);
    await syncNow(a, { api });
    await startSync(b, code);
    expect(await syncNow(b, { api })).toMatchObject({ asks: 0, sent: 2 });
    expect((await lostVersions(b)).map((l) => [l.id, l.v.name])).toEqual([['Y', 'A']]);
    await syncNow(a, { api });
    expect((await a.items.get('Z')).name).toBe('nur B');
    expect((await a.items.get('Y')).name).toBe('B');
  });
  it('pairing: an entry this device never changed counts as the older one, so it never overwrites the other device', async () => {
    const { api } = fakeServer();
    const a = fresh();
    const b = fresh();
    const code = newCode();
    await a.items.bulkPut([{ id: 'X', name: 'A1' }, { id: 'Y', name: 'A2' }]);
    await startSync(a, code);
    await syncNow(a, { api });
    // b holds old records without a change note (written before the notes existed)
    await b.items.bulkPut([{ id: 'X', name: 'alt' }, { id: 'Y', name: 'alt' }]);
    await b.meta.where('key').startsWith('sync|').delete();
    await startSync(b, code);
    expect(await syncNow(b, { api })).toMatchObject({ asks: 0, taken: 2 });
    expect((await b.items.bulkGet(['X', 'Y'])).map((x) => x.name)).toEqual(['A1', 'A2']);
    expect(await lostVersions(b)).toHaveLength(2);
    expect(await syncNow(b, { api })).toMatchObject({ asks: 0, sent: 0 });
  });
  it('questions left from before 24.10.2026 settle at the next round, also hundreds at once (Noah: «805 Einträge»)', async () => {
    const { api } = fakeServer();
    const db = fresh();
    await startSync(db, newCode());
    await syncNow(db, { api });
    const rows = Array.from({ length: 300 }, (_, i) => ({ id: `test_data_gtp_${i}`, name: `mine ${i}` }));
    await db.items.bulkPut(rows);
    for (const r of rows) await stamp(db, 'items', r.id, '2026-10-24T09:00:00.000Z');
    // half the other device changed later, half earlier
    await db.meta.bulkPut(rows.map((r, i) => ({ key: askKey('items', r.id), t: 'items', id: r.id, s: 0, v: { ...r, name: `theirs ${i}` }, del: false, at: i % 2 ? '2026-10-24T10:00:00.000Z' : '2026-10-24T08:00:00.000Z', dev: 'computer' })));
    expect(await openAsks(db)).toBe(300);
    expect(await syncNow(db, { api })).toMatchObject({ asks: 0, settled: 300 });
    expect(await openAsks(db)).toBe(0);
    expect((await db.items.get('test_data_gtp_1')).name).toBe('theirs 1');
    expect((await db.items.get('test_data_gtp_2')).name).toBe('mine 2');
    expect(await lostVersions(db)).toHaveLength(300);
  });
  it('settle: same → nothing; otherwise the newer change wins, a delete counts too; the same time ends the same on both devices', () => {
    expect(settle('items', 'A', { id: 'A', n: 1 }, { n: 1, id: 'A' })).toEqual({ win: 'same', keep: null });
    expect(settle('items', 'A', { id: 'A', n: 1 }, { id: 'A', n: 2 }, { mineAt: '2026-10-24T08:00:00Z', theirsAt: '2026-10-24T09:00:00Z' })).toEqual({ win: 'theirs', keep: 'mine' });
    expect(settle('items', 'A', { id: 'A', n: 1 }, null, { mineAt: '2026-10-24T10:00:00Z', theirsAt: '2026-10-24T09:00:00Z' })).toEqual({ win: 'mine', keep: 'theirs' });
    expect(settle('items', 'A', { id: 'A', n: 1 }, null, { mineAt: '2026-10-24T08:00:00Z', theirsAt: '2026-10-24T09:00:00Z' })).toEqual({ win: 'theirs', keep: 'mine' });
    const x = { id: 'A', n: 1 };
    const y = { id: 'A', n: 2 };
    const one = settle('items', 'A', x, y, { mineAt: 't', theirsAt: 't' });
    const other = settle('items', 'A', y, x, { mineAt: 't', theirsAt: 't' });
    expect(one.win === 'theirs' ? y : x).toEqual(other.win === 'theirs' ? x : y);
  });
  it('does nothing while off or while a demo runs; switching off can empty the server', async () => {
    const { api } = fakeServer();
    const db = fresh();
    expect(await syncNow(db, { api })).toEqual({ skipped: 'off' });
    await startSync(db, newCode());
    await db.meta.put({ key: 'demo', at: 'x' });
    expect(await syncNow(db, { api })).toEqual({ skipped: 'demo' });
    await db.meta.delete('demo');
    await db.items.put({ id: 'A' });
    await syncNow(db, { api });
    expect((await readCfg(db)).lastAt).toBeTruthy();
    await stopSync(db, { forget: true, api });
    expect(await db.meta.get(CFG)).toBeUndefined();
    expect(api.calls.at(-1)).toBe('forget');
  });
  it('keeps the error for the panel, and the next round goes on', async () => {
    const db = fresh();
    await startSync(db, newCode());
    const down = { call: async () => Promise.reject(Object.assign(new Error('offline'), { code: 'offline' })) };
    await expect(syncNow(db, { api: down })).rejects.toMatchObject({ code: 'offline' });
    expect((await readCfg(db)).error).toBe('offline');
    const { api } = fakeServer();
    await syncNow(db, { api });
    expect((await readCfg(db)).error).toBeNull();
  });
  it('compares records in a stable way', () => {
    expect(stable({ b: 1, a: [1, { d: 2, c: 3 }] })).toBe(stable({ a: [1, { c: 3, d: 2 }], b: 1 }));
    expect(stable({ a: 1, b: undefined })).toBe(stable({ a: 1 }));
  });
});

/* ---------- the real script on a real Redis (only where redis-server is installed) ---------- */

const hasRedis = (() => {
  try {
    execSync('command -v redis-server', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

let proc = null;
afterAll(() => proc?.kill());

/** A tiny RESP client: one command, one answer. */
function respCall(port, args) {
  return new Promise((ok, fail) => {
    const sock = net.connect(port, '127.0.0.1');
    let buf = Buffer.alloc(0);
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      try {
        const [v, rest] = parse(buf, 0);
        if (rest === buf.length) {
          sock.end();
          ok(v);
        }
      } catch (e) {
        if (e !== MORE) fail(e);
      }
    });
    sock.on('error', fail);
    sock.write(`*${args.length}\r\n${args.map((a) => `$${Buffer.byteLength(String(a))}\r\n${a}\r\n`).join('')}`);
  });
}
const MORE = Symbol('more');
function parse(buf, i) {
  const end = buf.indexOf('\r\n', i);
  if (end < 0) throw MORE;
  const head = buf.toString('utf8', i + 1, end);
  const type = String.fromCharCode(buf[i]);
  if (type === '+') return [head, end + 2];
  if (type === '-') throw new Error(head);
  if (type === ':') return [Number(head), end + 2];
  if (type === '$') {
    const len = Number(head);
    if (len < 0) return [null, end + 2];
    if (buf.length < end + 2 + len + 2) throw MORE;
    return [buf.toString('utf8', end + 2, end + 2 + len), end + 2 + len + 2];
  }
  if (type === '*') {
    const len = Number(head);
    if (len < 0) return [null, end + 2];
    const out = [];
    let at = end + 2;
    for (let k = 0; k < len; k++) {
      const [v, next] = parse(buf, at);
      out.push(v);
      at = next;
    }
    return [out, at];
  }
  throw new Error(`resp ${type}`);
}

describe.runIf(hasRedis)('two devices through a real Redis (local check of the push script)', () => {
  it('behaves like the fake', async () => {
    const port = 6390 + Math.floor(Math.random() * 50);
    proc = spawn('redis-server', ['--port', String(port), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
    for (let i = 0; i < 50; i++) {
      try {
        await respCall(port, ['PING']);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    const api = server(async (url, init) => {
      try {
        return Response.json({ result: await respCall(port, JSON.parse(init.body)) });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 400 });
      }
    });
    await twoDevices(api);
  }, 30_000);
});

describe('the question shows only what differs (show.js)', () => {
  it('leaves out fields empty on both sides', async () => {
    const { differences } = await import('../src/lib/sync/show.js');
    const rows = differences({ id: 'A', name: 'x', brand: null, weightG: 380 }, { id: 'A', name: 'y', weightG: 405, model: '' });
    expect(rows.map((r) => r.key)).toEqual(['name', 'weightG']);
  });
});

// Paket B (Noah 19.10.2026 «1b», changed on purpose): the Fitbit days and the Fitbit and calendar
// connection sync too; both devices fetch them from Google, so the engine settles them without a question
describe('Fitbit and Google copies sync without a question (Paket B, Noah 19.10 «1b»)', () => {
  it('syncs the Fitbit days and the Fitbit and calendar settings; device rows stay', () => {
    expect(syncLocal('healthDays', '2026-10-01')).toBe(false);
    expect(syncLocal('settings', 'health')).toBe(false);
    expect(syncLocal('settings', 'agenda')).toBe(false);
    expect(DATA_TABLES).toContain('healthDays');
    expect(syncLocal('settings', 'tips')).toBe(true);
    expect(syncLocal('settings', 'update.kitTemplates2026')).toBe(true);
  });
  it('autoPick: only the fetch marks differ → same; values differ → the copy fetched later; anything else → ask', () => {
    const day = (at, steps) => ({ date: '2026-10-18', steps, restingHr: 52, src: 'google', at });
    expect(autoPick('healthDays', '2026-10-18', day('2026-10-19T05:00:00Z', 8000), day('2026-10-19T05:15:00Z', 8000))).toBe('same');
    expect(autoPick('healthDays', '2026-10-18', day('2026-10-19T05:00:00Z', 8000), day('2026-10-19T05:15:00Z', 8400))).toBe('theirs');
    expect(autoPick('healthDays', '2026-10-18', day('2026-10-19T05:30:00Z', 8600), day('2026-10-19T05:15:00Z', 8400))).toBe('mine');
    const health = (lastSync, values) => ({ key: 'health', value: { connected: true, values, lastSync, until: '2026-10-18' } });
    expect(autoPick('settings', 'health', health('2026-10-19T05:00:00Z', ['steps']), health('2026-10-19T05:15:00Z', ['steps']))).toBe('same');
    expect(autoPick('settings', 'health', health('2026-10-19T05:00:00Z', ['steps']), health('2026-10-19T05:15:00Z', ['steps', 'sleep']))).toBe('theirs');
    expect(autoPick('settings', 'agenda', { key: 'agenda', value: { on: true, lastSync: 'b' } }, { key: 'agenda', value: { on: true, lastSync: 'a' } })).toBe('same');
    // not a copy of Google, or a delete: the person decides, as before
    expect(autoPick('items', 'EL01', { id: 'EL01', name: 'a' }, { id: 'EL01', name: 'b' })).toBe(null);
    expect(autoPick('settings', 'docs', { key: 'docs', value: 1 }, { key: 'docs', value: 2 })).toBe(null);
    expect(autoPick('healthDays', '2026-10-18', day('x', 1), null)).toBe(null);
  });
  it('two devices fetch the same day: no question; a later fetch with new values wins on both', async () => {
    const { api } = fakeServer();
    const phone = fresh();
    const computer = fresh();
    const code = newCode();
    const run = (db, dev) => syncNow(db, { api, dev });
    await startSync(computer, code);
    await run(computer, 'computer');
    await startSync(phone, code);
    await run(phone, 'phone');
    // both fetch 18 October from Google at different times: identical values, own fetch marks
    await computer.healthDays.put({ date: '2026-10-18', steps: 8000, src: 'google', at: '2026-10-19T05:00:00Z' });
    await phone.healthDays.put({ date: '2026-10-18', steps: 8000, src: 'google', at: '2026-10-19T05:10:00Z' });
    await computer.settings.put({ key: 'health', value: { connected: true, lastSync: '2026-10-19T05:00:00Z' } });
    await phone.settings.put({ key: 'health', value: { connected: true, lastSync: '2026-10-19T05:10:00Z' } });
    await run(computer, 'computer');
    expect(await run(phone, 'phone')).toMatchObject({ asks: 0 });
    expect(await openAsks(phone)).toBe(0);
    expect(await lostVersions(phone)).toEqual([]);
    // later the phone fetches again and Google has more steps; the computer still has the old copy changed
    await phone.healthDays.put({ date: '2026-10-18', steps: 9100, src: 'google', at: '2026-10-19T09:00:00Z' });
    await computer.healthDays.put({ date: '2026-10-18', steps: 8000, src: 'google', at: '2026-10-19T08:00:00Z' });
    await run(phone, 'phone');
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    expect((await computer.healthDays.get('2026-10-18')).steps).toBe(9100);
    // the other way round: the computer fetched later, so its copy stays and reaches the phone
    await phone.healthDays.put({ date: '2026-10-18', steps: 9100, src: 'google', at: '2026-10-19T10:00:00Z' });
    await computer.healthDays.put({ date: '2026-10-18', steps: 9300, src: 'google', at: '2026-10-19T11:00:00Z' });
    await run(phone, 'phone');
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    expect((await computer.healthDays.get('2026-10-18')).steps).toBe(9300);
    expect(await run(phone, 'phone')).toMatchObject({ asks: 0 });
    expect((await phone.healthDays.get('2026-10-18')).steps).toBe(9300);
    // a change of your own on both devices: no question either (Noah 24.10.2026), the newer one wins
    await phone.items.put({ id: 'EL01', name: 'test_data_gtp_ a' });
    await run(phone, 'phone');
    await run(computer, 'computer');
    await phone.items.update('EL01', { weightG: 1 });
    await stamp(phone, 'items', 'EL01', '2026-10-24T09:00:00.000Z');
    await computer.items.update('EL01', { weightG: 2 });
    await stamp(computer, 'items', 'EL01', '2026-10-24T08:00:00.000Z');
    await run(phone, 'phone');
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    expect((await computer.items.get('EL01')).weightG).toBe(1);
  });
});

describe('Strava activities fetched on both devices make no question (Noah 20.10.2026: after every update)', () => {
  const act = (detail, extra = {}) => ({ id: 'test_data_gtp_a1', day: '2026-10-20', kind: 'Ride', name: 'test_data_gtp_ ride', km: 30, kcal: 600, dv: 3, detail, ...extra });
  it('autoPick: only the fetch time differs → the newer fetch; what the person added differs → ask', () => {
    expect(autoPick('activities', 'test_data_gtp_a1', act('2026-10-20T18:08:00Z'), act('2026-10-20T18:09:00Z'))).toBe('theirs');
    expect(autoPick('activities', 'test_data_gtp_a1', act('2026-10-20T18:10:00Z'), act('2026-10-20T18:09:00Z'))).toBe('mine');
    // a newer kind of detail wins over a later fetch of the older kind
    expect(autoPick('activities', 'test_data_gtp_a1', act('2026-10-20T18:10:00Z', { dv: 2 }), act('2026-10-20T18:09:00Z', { dv: 3 }))).toBe('theirs');
    // an empty note is no note
    expect(autoPick('activities', 'test_data_gtp_a1', act('a', { note: '' }), act('b'))).toBe('theirs');
    // an empty own value or an own value with nothing in it is no own value either
    expect(autoPick('activities', 'test_data_gtp_a1', act('a', { own: {}, hidden: false }), act('b', { own: { bikeId: null } }))).toBe('theirs');
    expect(autoPick('activities', 'test_data_gtp_a1', act('a', { own: { bikeId: 'test_data_gtp_bike' } }), act('b'))).toBe(null);
    expect(autoPick('activities', 'test_data_gtp_a1', act('a', { note: 'test_data_gtp_ mine' }), act('b'))).toBe(null);
    expect(autoPick('activities', 'test_data_gtp_a1', act('a', { feel: 3 }), act('b', { feel: 4 }))).toBe(null);
    expect(autoPick('activities', 'test_data_gtp_a1', act('a'), null)).toBe(null);
  });
  it('two devices fetch the details after an update: no question; an old open question goes by itself', async () => {
    const { api } = fakeServer();
    const phone = fresh();
    const computer = fresh();
    const code = newCode();
    const run = (db, dev) => syncNow(db, { api, dev });
    await startSync(computer, code);
    await run(computer, 'computer');
    await startSync(phone, code);
    await run(phone, 'phone');
    await computer.activities.put(act('2026-10-20T18:00:00Z'));
    await run(computer, 'computer');
    await run(phone, 'phone');
    await computer.activities.put(act('2026-10-20T18:09:00Z', { kcal: 610 }));
    await phone.activities.put(act('2026-10-20T18:08:00Z', { kcal: 605 }));
    await run(computer, 'computer');
    expect(await run(phone, 'phone')).toMatchObject({ asks: 0 });
    expect((await phone.activities.get('test_data_gtp_a1')).kcal).toBe(610);
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    expect((await computer.activities.get('test_data_gtp_a1')).kcal).toBe(610);
    // a question left from before this rule: the next round answers it
    const { base } = await phone.meta.get(`sync|activities|${JSON.stringify('test_data_gtp_a1')}`);
    await phone.meta.put({ key: `synccf|activities|${JSON.stringify('test_data_gtp_a1')}`, t: 'activities', id: 'test_data_gtp_a1', s: base, v: act('2026-10-20T17:00:00Z', { kcal: 610 }), del: false, at: null, dev: 'computer' });
    expect(await openAsks(phone)).toBe(1);
    expect(await run(phone, 'phone')).toMatchObject({ asks: 0, settled: 1 });
    expect(await openAsks(phone)).toBe(0);
    // a note written on both devices: the newer note wins, the other one is kept (Noah 24.10.2026)
    await phone.activities.update('test_data_gtp_a1', { note: 'test_data_gtp_ phone' });
    await stamp(phone, 'activities', 'test_data_gtp_a1', '2026-10-24T08:00:00.000Z');
    await computer.activities.update('test_data_gtp_a1', { note: 'test_data_gtp_ computer' });
    await stamp(computer, 'activities', 'test_data_gtp_a1', '2026-10-24T09:00:00.000Z');
    await run(phone, 'phone');
    expect(await run(computer, 'computer')).toMatchObject({ asks: 0 });
    await run(phone, 'phone');
    expect((await phone.activities.get('test_data_gtp_a1')).note).toBe('test_data_gtp_ computer');
    expect((await lostVersions(computer))[0].v.note).toBe('test_data_gtp_ phone');
  });
});
