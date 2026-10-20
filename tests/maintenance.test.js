// «App-Wartung» (Noah 13.10.2026, BF4 BF7 BF8): the copies before an update, Strava's free limits and the
// monthly check. Fictional data only; dates by calendar days.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { createSnapDb, shouldSnapshot, pruneIds, snapshotOnStart, listSnapshots, restoreSnapshot, takeSnapshot, snapshotFor, VERSION_KEY, KEEP } from '../src/lib/maintenance/snapshots.js';
import { maintOf, saveMaint, readMaint, DEFAULT_KEYS, MAINT_KEY } from '../src/lib/maintenance/settings.js';
import { rateBars, rateHot, saveRate, RATE_KEY, HOT } from '../src/lib/maintenance/rate.js';
import { pair, rateOf } from '../api/_lib/rate.js';
import { daysBetween, checkDue, keyRows, linkSummary, attention, signature, hintLine, runCheck, EVERY_DAYS } from '../src/lib/maintenance/check.js';
import { LINKS } from '../src/lib/maintenance/links.js';
import { LINK_CHECKS } from '../api/_lib/links.js';
import { makeHandler as linkHandler } from '../api/linkcheck.js';
import { buildBackup } from '../src/lib/backup.js';

let n = 0;
let db;
let sdb;
beforeEach(() => {
  n += 1;
  db = createDb(`maint-${n}`);
  sdb = createSnapDb(`maint-snap-${n}`);
});
const item = (id) => ({ id, name: `Test ${id}`, category: 'elec', weightG: 10, qty: 1, ownership: 'owned', domains: ['bikepacking'] });
const addDays = (day, k) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
};

describe('BF4 copies before an update', () => {
  it('a copy is due only with data, a known older version and the switch on', () => {
    expect(shouldSnapshot({ last: '0.1.0', current: '0.2.0', hasData: true })).toBe(true);
    expect(shouldSnapshot({ last: '0.2.0', current: '0.2.0', hasData: true })).toBe(false);
    expect(shouldSnapshot({ last: null, current: '0.2.0', hasData: true })).toBe(false);
    expect(shouldSnapshot({ last: '0.1.0', current: '0.2.0', hasData: false })).toBe(false);
    expect(shouldSnapshot({ last: '0.1.0', current: '0.2.0', hasData: true, on: false })).toBe(false);
  });

  it('keeps the newest 3 update copies and 1 restore copy', () => {
    const list = [1, 2, 3, 4, 5].map((id) => ({ id, kind: 'update', at: `2026-10-0${id}T10:00:00Z` })).concat([{ id: 6, kind: 'restore', at: '2026-10-01T00:00:00Z' }, { id: 7, kind: 'restore', at: '2026-10-02T00:00:00Z' }]);
    expect(pruneIds(list).sort()).toEqual([1, 2, 6]);
    expect(KEEP).toEqual({ update: 3, restore: 1, import: 3, sync: 1, reset: 1 }); // P3b (rule 5a): also 3 copies before an import; P8: one before the first sync; Paket H: one before «Start fresh»
  });

  it('a first install keeps nothing and notes the version', async () => {
    expect(await snapshotOnStart(db, { sdb, current: '0.2.0', seen: null })).toBe(false);
    expect((await sdb.meta.get(VERSION_KEY)).value).toBe('0.2.0');
    expect(await listSnapshots(sdb)).toEqual([]);
  });

  it('a new version keeps a copy before the updates (from «What is new» on a device that never ran this)', async () => {
    await db.items.bulkPut([item('EL01'), item('EL02')]);
    expect(await snapshotOnStart(db, { sdb, current: '0.2.0', seen: '0.1.0' })).toBe(true);
    const [s] = await listSnapshots(sdb);
    expect(s).toMatchObject({ kind: 'update', version: '0.1.0', to: '0.2.0', rows: 2 });
    expect((await snapshotFor(sdb, '0.2.0'))?.id).toBe(s.id);
    // the same version again: nothing new
    expect(await snapshotOnStart(db, { sdb, current: '0.2.0', seen: '0.1.0' })).toBe(false);
    // the copies never go into a backup
    expect(Object.keys((await buildBackup(db)).tables)).not.toContain('snaps');
  });

  it('the switch off: no copy', async () => {
    await db.items.put(item('EL01'));
    await saveMaint(db, { snap: false });
    expect(await snapshotOnStart(db, { sdb, current: '0.3.0', seen: '0.2.0' })).toBe(false);
  });

  it('going back: a copy of now first, then the old state replaces all data', async () => {
    await db.items.put(item('EL01'));
    await snapshotOnStart(db, { sdb, current: '0.2.0', seen: '0.1.0' });
    await db.items.put(item('NEW1'));
    const [s] = await listSnapshots(sdb);
    await restoreSnapshot(db, sdb, s.id, { current: '0.2.0' });
    expect((await db.items.toArray()).map((i) => i.id)).toEqual(['EL01']);
    const list = await listSnapshots(sdb);
    expect(list.map((x) => x.kind).sort()).toEqual(['restore', 'update']);
    const back = list.find((x) => x.kind === 'restore');
    await restoreSnapshot(db, sdb, back.id, { current: '0.2.0' });
    expect((await db.items.toArray()).map((i) => i.id).sort()).toEqual(['EL01', 'NEW1']);
  });

  it('takeSnapshot prunes to the newest 3 updates', async () => {
    await db.items.put(item('EL01'));
    for (let i = 1; i <= 5; i++) await takeSnapshot(db, sdb, { version: `0.${i}.0`, to: `0.${i + 1}.0`, now: new Date(`2026-10-0${i}T08:00:00Z`) });
    expect((await listSnapshots(sdb)).map((s) => s.version)).toEqual(['0.5.0', '0.4.0', '0.3.0']);
  });
});

describe('settings', () => {
  it('defaults: both switches on, no key with an end date', async () => {
    expect(maintOf(null)).toEqual({ snap: true, hint: true, keys: DEFAULT_KEYS });
    expect(DEFAULT_KEYS).toEqual([]);
    // Noah 20.10.2026: the old assumed «AI helper key» until 10 Nov. goes; a changed one or another key stays
    const old = { id: 'ai-helper', name: 'AI helper key', until: '2026-11-10' };
    expect(maintOf({ keys: [old, { id: 'k', name: 'Test key', until: '2027-01-01' }] }).keys).toEqual([{ id: 'k', name: 'Test key', until: '2027-01-01' }]);
    expect(maintOf({ keys: [{ ...old, until: '2027-03-01' }] }).keys).toEqual([{ ...old, until: '2027-03-01' }]);
    await saveMaint(db, { hint: false, keys: [{ id: 'k', name: 'Test key', until: '2027-01-01' }, { name: '', until: 'x' }] });
    expect(await readMaint(db)).toEqual({ snap: true, hint: false, keys: [{ id: 'k', name: 'Test key', until: '2027-01-01' }] });
    expect((await db.settings.get(MAINT_KEY)).value.keys).toHaveLength(1);
  });
});

describe('BF8 Strava free limits', () => {
  it('reads Strava\'s headers', () => {
    expect(pair('200,2000')).toEqual([200, 2000]);
    expect(pair('x')).toBeNull();
    const h = new Headers({ 'X-RateLimit-Limit': '200,2000', 'X-RateLimit-Usage': '12,340', 'X-ReadRateLimit-Limit': '100,1000', 'X-ReadRateLimit-Usage': '12,340' });
    expect(rateOf(h)).toEqual({ limit: [200, 2000], usage: [12, 340], readLimit: [100, 1000], readUsage: [12, 340] });
    expect(rateOf(new Headers())).toBeNull();
  });

  it('two bars, the fuller limit counts; old values are not fresh', () => {
    const now = new Date('2026-10-13T10:07:00Z');
    const rate = { at: '2026-10-13T10:01:00Z', limit: [200, 2000], usage: [12, 340], readLimit: [100, 1000], readUsage: [85, 340] };
    const [s, d] = rateBars(rate, now);
    expect(s).toMatchObject({ key: 'short', used: 85, limit: 100, pct: 85, fresh: true });
    expect(d).toMatchObject({ key: 'daily', used: 340, limit: 1000, pct: 34, fresh: true });
    expect(rateHot(rate, now)).toMatchObject({ key: 'short', pct: 85 });
    // a quarter of an hour later the 15-minute count starts again
    expect(rateHot(rate, new Date('2026-10-13T10:16:00Z'))).toBeNull();
    expect(HOT).toBe(80);
  });

  it('keeps the latest numbers in meta', async () => {
    await saveRate(db, { limit: [200, 2000], usage: [1, 2] }, new Date('2026-10-13T10:00:00Z'));
    expect(await db.meta.get(RATE_KEY)).toMatchObject({ at: '2026-10-13T10:00:00.000Z', usage: [1, 2] });
    await saveRate(db, null);
  });
});

describe('BF7 monthly check', () => {
  const TODAY = '2026-10-13';
  it('is due after 30 days by the calendar', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // over the change to summer time
    expect(checkDue(null, TODAY)).toBe(true);
    expect(checkDue(addDays(TODAY, -(EVERY_DAYS - 1)), TODAY)).toBe(false);
    expect(checkDue(addDays(TODAY, -EVERY_DAYS), TODAY)).toBe(true);
  });

  it('a key is due from 30 days before its end', () => {
    const rows = keyRows([{ id: 'a', name: 'Test A', until: addDays(TODAY, 30) }, { id: 'b', name: 'Test B', until: addDays(TODAY, 31) }, { id: 'c', name: 'Test C', until: addDays(TODAY, -2) }], TODAY);
    expect(rows.map((r) => [r.days, r.due])).toEqual([[30, true], [31, false], [-2, true]]);
  });

  it('runs quietly: no answer means «not checked»', async () => {
    const res = await runCheck({
      links: LINKS.slice(0, 3),
      today: TODAY,
      status: async () => 'ok',
      probe: async (u) => (u === LINKS[0].url ? { ok: true } : u === LINKS[1].url ? { ok: false } : null),
    });
    expect(res.strava).toBe('ok');
    expect(linkSummary(res.links)).toEqual({ checked: 2, all: 3, ok: 1, broken: [LINKS[1].name] });
    const thrown = await runCheck({ links: LINKS.slice(0, 1), today: TODAY, status: async () => { throw new Error('offline'); }, probe: async () => { throw new Error('offline'); } });
    expect(thrown).toEqual({ day: TODAY, strava: null, links: [{ id: LINKS[0].id, name: LINKS[0].name, ok: null }] });
  });

  it('what needs attention, one line, and a mark that changes when something new is due', () => {
    const now = new Date('2026-10-13T10:05:00Z');
    const list = attention({
      check: { day: TODAY, strava: 'attention', links: [{ name: 'Test link', ok: false }] },
      keys: [{ id: 'k', name: 'Test key', until: addDays(TODAY, 5) }],
      rate: { at: '2026-10-13T10:01:00Z', limit: [100, 1000], usage: [90, 100] },
      today: TODAY,
      now,
    });
    // Noah 20.10.2026: a key that runs out is never a hint on Today (only in Ich › App maintenance)
    expect(list.map((a) => a.kind)).toEqual(['rate', 'links', 'strava']);
    const t = (s, v = {}) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
    const tn = (k, one, many, v = {}) => t(k === 1 ? one : many, { n: k, ...v });
    expect(hintLine(list, { t, tn })).toBe('Strava requests: 90 % of the free limit used · 1 link does not answer · Strava needs a new login');
    expect(signature(list, TODAY)).toBe('rate:2026-10-13;links:Test link;strava');
    expect(attention({ today: TODAY, now })).toEqual([]);
  });
});

describe('the link list and /api/linkcheck', () => {
  it('the app checks exactly the addresses the server allows', () => {
    expect(LINKS.map((l) => l.url)).toEqual(LINK_CHECKS);
    for (const l of LINKS) expect(l.url.startsWith('https://')).toBe(true);
  });

  const req = (u) => new Request(`https://packgen-three.vercel.app/api/linkcheck?u=${encodeURIComponent(u)}`, { headers: { origin: 'http://localhost:5173' } });

  it('HEAD first, GET when HEAD is refused', async () => {
    const doFetch = vi.fn(async (url, init) => new Response(null, { status: init.method === 'HEAD' ? 405 : 200 }));
    const res = await linkHandler({ doFetch })(req(LINK_CHECKS[0]));
    expect(await res.json()).toEqual({ ok: true, status: 200 });
    expect(doFetch.mock.calls.map((c) => c[1].method)).toEqual(['HEAD', 'GET']);
  });

  it('a dead address is not ok; an address outside the list is refused', async () => {
    const dead = await linkHandler({ doFetch: async () => { throw new Error('down'); } })(req(LINK_CHECKS[1]));
    expect(await dead.json()).toEqual({ ok: false, status: 0 });
    const doFetch = vi.fn();
    const other = await linkHandler({ doFetch })(req('https://example.com/'));
    expect(other.status).toBe(400);
    expect(doFetch).not.toHaveBeenCalled();
  });

  it('gives up after the timeout', async () => {
    const doFetch = (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
    const res = await linkHandler({ doFetch, timeout: 20 })(req(LINK_CHECKS[2]));
    expect(await res.json()).toEqual({ ok: false, status: 0 });
  });
});
