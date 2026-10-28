// Paket R: the daily cap of the small server (api/_lib/daycap.js, route() in api/_lib/core.js) and the
// watcher's check «tagesgrenze». A tiny fake store; fictional values only.
import { describe, it, expect } from 'vitest';
import { DAY_CAPS, CAP_LUA, UNCAPPED, OWN_CAP_ONLY, countCall, dayUsage, dayOf, capKeys } from '../api/_lib/daycap.js';
import { route, json } from '../api/_lib/core.js';
import { makeChecks } from '../api/_lib/health.js';

function fakeStore() {
  const kv = new Map();
  const incr = (k) => {
    const v = Number(kv.get(k) ?? 0) + 1;
    kv.set(k, String(v));
    return v;
  };
  return {
    kv,
    async cmd(c, ...a) {
      if (c === 'EVAL') {
        expect(a[0]).toBe(CAP_LUA);
        return [incr(a[2]), incr(a[3])];
      }
      if (c === 'MGET') return a.map((k) => kv.get(k) ?? null);
      throw new Error(c);
    },
    get: async (k) => kv.get(k) ?? null,
  };
}

// 23:30 UTC on 18.10. is already 19.10. in Switzerland (summer time)
const LATE = Date.parse('2026-10-18T23:30:00Z');

describe('the daily cap', () => {
  it('counts per Swiss day, for the name and the total', async () => {
    expect(dayOf(LATE)).toBe('2026-10-19');
    const s = fakeStore();
    expect(await countCall(s, 'sync', LATE)).toEqual({ n: 1, total: 1, over: false });
    await countCall(s, 'google', LATE);
    expect(s.kv.get(capKeys('sync', '2026-10-19').one)).toBe('1');
    expect(s.kv.get('cap:2026-10-19:total')).toBe('2');
  });
  it('is over when the name or the total passes its cap; unknown names count only for the total', async () => {
    const s = fakeStore();
    const caps = { total: 3, sync: 1 };
    expect((await countCall(s, 'sync', LATE, caps)).over).toBe(false);
    expect((await countCall(s, 'sync', LATE, caps)).over).toBe(true);
    expect((await countCall(s, 'other', LATE, caps)).over).toBe(false);
    expect((await countCall(s, 'other', LATE, caps)).over).toBe(true);
  });
  it('never blocks without a store, when the store fails, or for the watcher', async () => {
    expect(await countCall(null, 'sync')).toBeNull();
    expect(await countCall({ cmd: async () => { throw new Error('down'); } }, 'sync')).toBeNull();
    expect(UNCAPPED.has('health')).toBe(true);
    expect(await countCall(fakeStore(), 'health')).toBeNull();
  });
  it('the cron-job.org tick is stopped only by its own cap, never by the total (27.10.2026)', async () => {
    const s = fakeStore();
    const caps = { total: 1, tick: 2 };
    expect(OWN_CAP_ONLY.has('tick')).toBe(true);
    s.kv.set('cap:2026-10-19:total', '50');
    expect(await countCall(s, 'tick', LATE, caps)).toEqual({ n: 1, total: 51, over: false });
    expect((await countCall(s, 'tick', LATE, caps)).over).toBe(false);
    expect((await countCall(s, 'tick', LATE, caps)).over).toBe(true);
    expect((await countCall(s, 'push', LATE, caps)).over).toBe(true);
    // a whole 25-hour day of ticks every minute fits
    expect(DAY_CAPS.tick).toBeGreaterThan(25 * 60);
  });
  it('keeps every cap below the free tiers (rule «0 Kosten»)', () => {
    // Vercel Hobby: about 1 000 000 calls a month; Upstash free: about 500 000 commands a month
    expect(DAY_CAPS.total * 31).toBeLessThan(1_000_000);
    expect(DAY_CAPS.total * 31 * 4).toBeLessThan(500_000 * 1.0);
    for (const [k, v] of Object.entries(DAY_CAPS)) if (k !== 'total') expect(v).toBeLessThanOrEqual(DAY_CAPS.total);
  });
});

describe('route() with the cap', () => {
  const ok = route({ GET: async (r) => json(r, 200, { ok: true }) }, 'sync', { capStore: () => s, now: () => LATE });
  let s;
  it('answers 429 daily_cap over the cap, with a clear text; OPTIONS is never counted', async () => {
    s = fakeStore();
    s.kv.set('cap:2026-10-19:sync', String(DAY_CAPS.sync));
    const res = await ok(new Request('https://packgen.test/api/sync'));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('daily_cap');
    const pre = await ok(new Request('https://packgen.test/api/sync', { method: 'OPTIONS', headers: { origin: 'https://noahdolmetsch-af.github.io' } }));
    expect(pre.status).toBe(204);
    expect(s.kv.get('cap:2026-10-19:sync')).toBe(String(DAY_CAPS.sync + 1));
  });
  it('counts the push tick as «tick»: it still goes when the total is reached', async () => {
    const { pushCapName } = await import('../api/push.js');
    const names = [];
    const r = route({ GET: async (q) => json(q, 200, { ok: true }) }, 'push', {
      capStore: () => s,
      now: () => LATE,
      capName: (q) => { const n = pushCapName(q); names.push(n); return n; },
    });
    s = fakeStore();
    s.kv.set('cap:2026-10-19:total', String(DAY_CAPS.total));
    expect((await r(new Request('https://packgen.test/api/push?a=tick&key=x'))).status).toBe(200);
    expect((await r(new Request('https://packgen.test/api/push?a=key'))).status).toBe(429);
    expect(names).toEqual(['tick', 'push']);
    expect(s.kv.get('cap:2026-10-19:tick')).toBe('1');
  });
  it('lets the call through below the cap', async () => {
    s = fakeStore();
    expect((await ok(new Request('https://packgen.test/api/sync'))).status).toBe(200);
  });
});

describe('the watcher check «tagesgrenze»', () => {
  const check = (store, now = LATE) => makeChecks({ cfg: {}, store, doFetch: null, now: () => now }).tagesgrenze();
  it('ok with today\'s number, fail when today or yesterday reached a cap', async () => {
    const s = fakeStore();
    s.kv.set('cap:2026-10-19:total', '12');
    expect(await check(s)).toMatchObject({ state: 'ok', note: `12 von ${DAY_CAPS.total} Aufrufen heute` });
    s.kv.set('cap:2026-10-18:google', String(DAY_CAPS.google));
    const r = await check(s);
    expect(r).toMatchObject({ state: 'fail', code: 'cap_reached' });
    expect(r.note).toContain('2026-10-18');
    expect(r.note).toContain('google');
    expect(await dayUsage(s, '2026-10-17')).toEqual({ day: '2026-10-17', total: 0, limit: DAY_CAPS.total, over: [] });
  });
  it('skips without a store', async () => {
    expect((await check(null)).state).toBe('skip');
  });
});
