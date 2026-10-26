// Gruppen-Live-Karte (Noah 25.10.2026 «b»): /api/sync?action=group keeps the sealed places of a group ride
// for at most 24 h, and the app's group.js makes, reads, updates, leaves and ends it. Fictional data only.
import { describe, it, expect } from 'vitest';
import { makeDispatch } from '../api/sync.js';
import { makeGroupHandler, makeSpurHandler, GROUP_MEMBERS_MAX } from '../api/_lib/spur.js';
import { DAY_CAPS } from '../api/_lib/daycap.js';
import { fakeRedis } from './fakeredis.js';
import { createGroup, readGroup, sharePlace, leaveGroup, endGroup, setPlan } from '../src/lib/live/group.js';

const T0 = Date.parse('2026-07-03T08:00:00Z');

function setup() {
  const r = fakeRedis();
  let now = T0;
  const env = () => ({ redisUrl: 'https://redis.example.test', redisToken: 'r' });
  const doRedis = async (url, init) => Response.json({ result: r.run(...((a) => [a[0], a.slice(1)])(JSON.parse(init.body))) });
  const handler = makeDispatch({ spur: makeSpurHandler({ env, doFetch: doRedis }), group: makeGroupHandler({ env, doFetch: doRedis, now: () => new Date(now) }) });
  const doFetch = (url, init = {}) => handler(new Request(url, { ...init, headers: { ...(init.headers ?? {}), origin: 'http://localhost:5173', 'x-forwarded-for': '203.0.113.9' } }));
  return { r, doFetch, opts: { doFetch, url: 'https://packgen.example.test/api/sync?action=group' }, later: (ms) => (now += ms), at: () => now };
}

const route = { line: [[47.0, 8.0], [47.01, 8.0], [47.02, 8.0], [47.03, 8.0], [47.04, 8.0], [47.05, 8.0]], km: 5.6 };

describe('/api/sync?action=group', () => {
  it('makes a group, two members share, everyone reads both, the server cannot read them', async () => {
    const { r, opts, at } = setup();
    const g = await createGroup({ title: 'Testrunde', route }, opts);
    expect(g.gid).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(Date.parse(g.end) - at()).toBe(24 * 3600_000);
    const a = await sharePlace(g, null, 'Test-Fahrer A', { lat: 47.02, lon: 8.0, at: at() }, opts);
    const b = await sharePlace(g, null, 'Test-Fahrer B', { lat: 47.04, lon: 8.001, at: at() }, opts);
    expect(b.places.map((p) => p.name).sort()).toEqual(['Test-Fahrer A', 'Test-Fahrer B']);
    const stored = JSON.stringify([...r.kv.get(`grp:${g.gid}`)]);
    expect(stored).not.toMatch(/Test-Fahrer|Testrunde|47\.02/);
    const read = await readGroup(g.gid, g.key, opts);
    expect(read.title).toBe('Testrunde');
    expect(read.route.line.length).toBeGreaterThan(1);
    expect(read.places).toHaveLength(2);
    // a newer place under the same member
    const a2 = await sharePlace(g, a, 'Test-Fahrer A', { lat: 47.03, lon: 8.0, at: at() }, opts);
    expect(a2.mid).toBe(a.mid);
    expect(a2.places).toHaveLength(2);
    expect(a2.places.find((p) => p.m === a.mid).pos).toEqual([47.03, 8]);
    // only the places, without the route
    const small = await readGroup(g.gid, g.key, { ...opts, withRoute: false });
    expect(small.route).toBe(null);
    expect(small.places).toHaveLength(2);
  });
  it('a member who leaves is gone; the maker ends it and everything is deleted', async () => {
    const { r, opts, at } = setup();
    const g = await createGroup({ title: 'Testrunde' }, opts);
    const a = await sharePlace(g, null, 'Test A', { lat: 47, lon: 8, at: at() }, opts);
    const b = await sharePlace(g, null, 'Test B', { lat: 47, lon: 8.01, at: at() }, opts);
    await leaveGroup(g, a, opts);
    expect((await readGroup(g.gid, g.key, opts)).places.map((p) => p.m)).toEqual([b.mid]);
    await endGroup(g, opts);
    expect(r.kv.has(`grp:${g.gid}`)).toBe(false);
    await expect(readGroup(g.gid, g.key, opts)).rejects.toMatchObject({ code: 'not_found' });
    // ending twice is fine
    await endGroup(g, opts);
  });
  it('ends by itself after the time, even when members keep sharing', async () => {
    const { opts, later, at } = setup();
    const g = await createGroup({ hours: 2 }, opts);
    const a = await sharePlace(g, null, 'Test A', { lat: 47, lon: 8, at: at() }, opts);
    later(119 * 60_000);
    await sharePlace(g, a, 'Test A', { lat: 47, lon: 8, at: at() }, opts);
    later(2 * 60_000);
    await expect(sharePlace(g, a, 'Test A', { lat: 47, lon: 8, at: at() }, opts)).rejects.toMatchObject({ code: 'not_found' });
    await expect(readGroup(g.gid, g.key, opts)).rejects.toMatchObject({ code: 'not_found' });
  });
  it('only the right codes change or end it; a wrong key reads nothing', async () => {
    const { opts, doFetch, at } = setup();
    const g = await createGroup({}, opts);
    const a = await sharePlace(g, null, 'Test A', { lat: 47, lon: 8, at: at() }, opts);
    const post = (step, body) => doFetch(`https://packgen.example.test/api/sync?action=group&step=${step}`, { method: 'POST', body: JSON.stringify(body) });
    expect((await post('end', { gid: g.gid, del: 'y'.repeat(32) })).status).toBe(403);
    expect((await post('leave', { gid: g.gid, mid: a.mid, del: 'y'.repeat(32) })).status).toBe(403);
    expect((await post('put', { gid: g.gid, mid: a.mid, del: 'y'.repeat(32), e: 'A'.repeat(40) })).status).toBe(403);
    expect((await post('put', { gid: g.gid, e: 'not sealed !' })).status).toBe(400);
    expect((await doFetch('https://packgen.example.test/api/sync?action=group&gid=short')).status).toBe(400);
    expect((await readGroup(g.gid, 'x'.repeat(43), opts)).places).toEqual([]);
  });
  it('a group has at most GROUP_MEMBERS_MAX members and its own daily cap', async () => {
    const { opts, at } = setup();
    const g = await createGroup({}, opts);
    for (let i = 0; i < GROUP_MEMBERS_MAX; i++) await sharePlace(g, null, `Test ${i}`, { lat: 47, lon: 8, at: at() }, opts);
    await expect(sharePlace(g, null, 'Test zu viel', { lat: 47, lon: 8, at: at() }, opts)).rejects.toMatchObject({ code: 'full' });
    expect(DAY_CAPS.group).toBeLessThanOrEqual(DAY_CAPS.total / 2);
  });
  // Gruppenfahrt für Events (Noah 26.10.2026): up to 7 days, the maker's sealed plan, members' sealed parts
  it('an event group: 7 days, the plan for everyone, a part without a place, only the maker changes the plan', async () => {
    const { r, opts, doFetch, at } = setup();
    const plan = { night: { from: '21:30', to: '06:30' }, race: true, cps: [{ name: 'test_data_gtp_ Col', km: 3 }] };
    const g = await createGroup({ title: 'test_data_gtp_ Event', route, hours: 7 * 24, plan }, opts);
    expect(Date.parse(g.end) - at()).toBe(7 * 24 * 3600_000);
    const tooLong = await createGroup({ hours: 999 }, opts);
    expect(Date.parse(tooLong.end) - at()).toBe(7 * 24 * 3600_000);
    const part = { status: { kind: 'ready', at: new Date(at()).toISOString() }, has: ['test_data_gtp_ Pumpe'], costs: [{ id: 'a1', what: 'test_data_gtp_ Camp', cents: 4800, for: null }] };
    const a = await sharePlace(g, null, 'test_data_gtp_ A', null, { ...opts, part });
    expect(a.plan).toMatchObject({ night: { from: '21:30', to: '06:30' }, race: true });
    expect(a.places[0]).toMatchObject({ pos: null, part: { status: { kind: 'ready' }, has: ['test_data_gtp_ Pumpe'] } });
    const read = await readGroup(g.gid, g.key, opts);
    expect(read.plan.cps).toEqual([{ name: 'test_data_gtp_ Col', km: 3 }]);
    expect(JSON.stringify([...r.kv.get(`grp:${g.gid}`)])).not.toMatch(/Pumpe|Col|21:30/);
    await setPlan(g, { ...plan, night: null }, opts);
    expect((await readGroup(g.gid, g.key, { ...opts, withRoute: false })).plan.night).toBeNull();
    const post = (body) => doFetch('https://packgen.example.test/api/sync?action=group&step=plan', { method: 'POST', body: JSON.stringify(body) });
    expect((await post({ gid: g.gid, del: 'y'.repeat(32), p: 'A'.repeat(40) })).status).toBe(403);
  });
});
