// Noah 21.11.2026 («1-5a», point 4): ticks set on two devices in the same packing list or the same week of the
// weekly plan stay on both. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { noteKey } from '../src/lib/sync/track.js';
import { newCode } from '../src/lib/sync/code.js';
import { startSync, syncNow, settle, lostVersions } from '../src/lib/sync/engine.js';
import { mergeTrip, mergeWeeklog, mergeBoth } from '../src/lib/sync/merge.js';
import { makeHandler } from '../api/sync.js';
import { fakeRedis } from './fakeredis.js';

let n = 0;
const fresh = () => createDb(`merge-${n++}`);
function fakeServer() {
  const redis = fakeRedis();
  const handler = makeHandler({ env: () => ({ redisUrl: 'https://r.test', redisToken: 'r' }), doFetch: async (url, init) => Response.json({ result: redis.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) }) });
  return { async call(step, body) { const res = await handler(new Request(`https://x.test/api/sync?step=${step}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'http://localhost:5173' } })); const d = await res.json(); if (!res.ok) throw Object.assign(new Error(d.message), { code: d.code }); return d; } };
}
const trip = (packed = {}, extra = {}) => ({ id: 'T1', title: 'test_data_gtp_ Tour', entries: ['EL01', 'EL02', 'EL03'].map((id) => ({ itemId: id, slot: 'body', qty: 1, packed: !!packed[id] })), ready: [{ id: 'r1', label: 'Bremsen', done: !!packed.r1 }], ...extra });
const stamp = (db, t, id, at) => db.meta.update(noteKey(t, id), { at });

describe('merge rules (merge.js)', () => {
  it('a trip: the ticks of both stay, the rest comes from the newer record', () => {
    const newer = trip({ EL01: true }, { title: 'neuer Name' });
    const older = trip({ EL02: true, r1: true });
    const m = mergeTrip(newer, older);
    expect(m.title).toBe('neuer Name');
    expect(m.entries.map((e) => e.packed)).toEqual([true, true, false]);
    expect(m.ready[0].done).toBe(true);
  });
  it('an entry only the older record has comes back; nothing is lost', () => {
    const older = { ...trip(), entries: [...trip().entries, { itemId: 'EL09', slot: 'body', qty: 1, packed: true }] };
    expect(mergeTrip(trip({ EL01: true }), older).entries.map((e) => e.itemId)).toEqual(['EL01', 'EL02', 'EL03', 'EL09']);
  });
  it('the week log: ticks, marks and released units of both weeks, a new week of the other device too', () => {
    const row = (weeks) => ({ key: 'training.weeklog', value: { v: 1, weeks } });
    const a = row({ '2026-11-16': { done: { 'tennis@1': '2026-11-17' }, no: ['s1'], released: [], pins: {}, mode: {}, snap: null } });
    const b = row({ '2026-11-16': { done: { 'gym@1': '2026-11-18' }, no: ['s2'], released: ['yoga@1'], pins: {}, mode: {}, snap: null }, '2026-11-23': { done: { 'tennis@1': '2026-11-24' } } });
    const m = mergeWeeklog(a, b);
    expect(m.value.weeks['2026-11-16'].done).toEqual({ 'tennis@1': '2026-11-17', 'gym@1': '2026-11-18' });
    expect(m.value.weeks['2026-11-16'].no.sort()).toEqual(['s1', 's2']);
    expect(m.value.weeks['2026-11-16'].released).toEqual(['yoga@1']);
    expect(m.value.weeks['2026-11-23'].done['tennis@1']).toBe('2026-11-24');
  });
  it('is the same whichever device computes it, and merging twice changes nothing', () => {
    const a = trip({ EL01: true });
    const b = trip({ EL02: true });
    const ab = mergeBoth('trips', 'T1', a, b, { mineAt: '2026-11-21T10:00:00Z', theirsAt: '2026-11-21T10:01:00Z' });
    const ba = mergeBoth('trips', 'T1', b, a, { mineAt: '2026-11-21T10:01:00Z', theirsAt: '2026-11-21T10:00:00Z' });
    expect(ab).toEqual(ba);
    expect(mergeBoth('trips', 'T1', ab, a, { mineAt: '2026-11-21T10:02:00Z', theirsAt: '2026-11-21T10:00:00Z' })).toBeNull();
  });
  it('no rule for other records, none for a delete', () => {
    expect(mergeBoth('items', 'A', { id: 'A', x: 1 }, { id: 'A', x: 2 })).toBeNull();
    expect(mergeBoth('trips', 'T1', trip(), null)).toBeNull();
  });
  it('settle: «merged» with the value; the same as one side is no merge', () => {
    const r = settle('trips', 'T1', trip({ EL01: true }), trip({ EL02: true }), { mineAt: '2026-11-21T10:00:00Z', theirsAt: '2026-11-21T10:01:00Z' });
    expect(r.win).toBe('merged');
    expect(r.keep).toBeNull();
    expect(settle('trips', 'T1', trip({ EL01: true }), trip({ EL01: true }), {}).win).toBe('same');
    // theirs already holds all of mine: take theirs, nothing to write
    expect(settle('trips', 'T1', trip({ EL01: true }), trip({ EL01: true, EL02: true }), { mineAt: '2026-11-21T10:00:00Z', theirsAt: '2026-11-21T10:01:00Z' }).win).toBe('theirs');
  });
});

describe('two devices pack the same trip', () => {
  it('both ticks end on both devices, nothing waits in the history', async () => {
    const api = fakeServer();
    const phone = fresh();
    const computer = fresh();
    const code = newCode();
    await computer.trips.put(trip());
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    await startSync(phone, code);
    await syncNow(phone, { api, dev: 'phone' });
    // both pack a different item, offline from each other
    await phone.trips.put(trip({ EL01: true }));
    await stamp(phone, 'trips', 'T1', '2026-11-21T10:00:00.000Z');
    await computer.trips.put(trip({ EL02: true }));
    await stamp(computer, 'trips', 'T1', '2026-11-21T10:01:00.000Z');
    await syncNow(phone, { api, dev: 'phone' }); // the phone is first at the server
    await syncNow(computer, { api, dev: 'computer' }); // the computer merges and sends
    await syncNow(phone, { api, dev: 'phone' });
    await syncNow(computer, { api, dev: 'computer' });
    for (const db of [phone, computer]) {
      expect((await db.trips.get('T1')).entries.map((e) => e.packed)).toEqual([true, true, false]);
      expect(await lostVersions(db)).toHaveLength(0);
    }
    // quiet afterwards: nothing is sent or taken any more
    expect(await syncNow(phone, { api, dev: 'phone' })).toMatchObject({ sent: 0, taken: 0 });
    expect(await syncNow(computer, { api, dev: 'computer' })).toMatchObject({ sent: 0, taken: 0 });
  });

  it('the weekly plan: a tick on each device in the same week stays on both', async () => {
    const api = fakeServer();
    const phone = fresh();
    const computer = fresh();
    const code = newCode();
    const log = (done) => ({ key: 'training.weeklog', value: { v: 1, weeks: { '2026-11-16': { done, no: [], pins: {}, mode: {}, released: [], snap: null } } } });
    await computer.settings.put(log({}));
    await startSync(computer, code);
    await syncNow(computer, { api, dev: 'computer' });
    await startSync(phone, code);
    await syncNow(phone, { api, dev: 'phone' });
    await phone.settings.put(log({ 'tennis@1': '2026-11-17' }));
    await stamp(phone, 'settings', 'training.weeklog', '2026-11-21T10:00:00.000Z');
    await computer.settings.put(log({ 'gym@1': '2026-11-18' }));
    await stamp(computer, 'settings', 'training.weeklog', '2026-11-21T10:01:00.000Z');
    for (let i = 0; i < 2; i++) {
      await syncNow(phone, { api, dev: 'phone' });
      await syncNow(computer, { api, dev: 'computer' });
    }
    for (const db of [phone, computer]) expect((await db.settings.get('training.weeklog')).value.weeks['2026-11-16'].done).toEqual({ 'gym@1': '2026-11-18', 'tennis@1': '2026-11-17' });
  });
});
