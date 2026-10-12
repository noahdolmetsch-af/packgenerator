// v0.112.0 «Strava-Verbindung»: the app side of the connection with a fake server and a test database.
// Fictional bikes and rides only («Gravel Blau», «MTB Rot»).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { makeEntry } from '../src/lib/kmbook.js';
import { LAST_KM_IMPORT } from '../src/lib/kmbookdb.js';
import { WALL_KEY } from '../src/lib/home/tiles.js';
import {
  runSync, autoFetch, fetchNow, takeReturn, call, answerChange, checkRide, addTile, disconnect, prefsOf, strava,
  PREFS_KEY, CHANGES_KEY, LAST_KEY, TRY_KEY, KEY_LS, STRAVA_URL,
} from '../src/lib/strava/client.svelte.js';

const gear = [{ id: 'g1', name: 'Gravel Blau', km: 6480, primary: true, retired: false }, { id: 'g2', name: 'MTB Rot', km: 3115, primary: false, retired: false }];
const act = (id, over = {}) => ({ id, name: `Runde ${id}`, type: 'GravelRide', start: '2026-10-09T07:00:00Z', km: 42, gearId: 'g1', device: '', trainer: false, ...over });

/** A fake server: the bikes, the rides in pages of `per`, and a log of every call. */
function fakeServer(activities, { per = 2 } = {}) {
  const log = [];
  const c = async (step, { params = {} } = {}) => {
    log.push({ step, ...params });
    if (step === 'gear') return { ok: true, bikes: gear };
    if (step === 'activities') {
      const page = Number(params.page);
      const after = params.after ? Number(params.after) * 1000 : 0;
      const list = activities.filter((a) => Date.parse(a.start) > after);
      return { ok: true, page, more: list.length > page * per, activities: list.slice((page - 1) * per, page * per) };
    }
    if (step === 'status') return { ok: true, connected: true, athlete: { firstname: 'Beispiel' } };
    return { ok: true };
  };
  return { c, log };
}

/** A tiny localStorage. */
const store = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

let db;
beforeEach(async () => {
  db = createDb(`strava-${Math.random()}`);
  await db.bikes.bulkPut([{ id: 'gb', name: 'Gravel Blau' }, { id: 'mr', name: 'MTB Rot' }]);
  await db.kmBook.bulkPut([
    makeEntry({ id: 's-gb', bikeId: 'gb', date: '2026-01-01', km: 6000, kind: 'start', source: 'hand' }),
    makeEntry({ id: 's-mr', bikeId: 'mr', date: '2026-01-01', km: 3000, kind: 'start', source: 'hand' }),
  ]);
  strava.busy = false;
  strava.error = '';
});

describe('runSync', () => {
  it('the first fetch takes every page, writes the rides with Undo and the summary', async () => {
    const acts = [act('1'), act('2', { gearId: 'g2', km: 20 }), act('3', { start: '2025-05-01T07:00:00Z' }), act('4', { gearId: null })];
    const { c, log } = fakeServer(acts);
    const now = new Date('2026-10-12T06:00:00Z');
    const last = await runSync(db, { call: c, now });
    expect(log.filter((x) => x.step === 'activities').map((x) => [x.page, x.after])).toEqual([['1', undefined], ['2', undefined]]);
    expect(last).toMatchObject({ first: true, n: 3, assigned: 2, check: 1, km: 62, counts: { found: 4, inStart: 1 } });
    expect((await db.bikes.get('gb')).km).toBe(6042);
    expect((await db.bikes.get('mr')).km).toBe(3020);
    expect((await db.meta.get(LAST_KM_IMPORT)).n).toBe(3);
    const prefs = prefsOf((await db.settings.get(PREFS_KEY)).value);
    expect(prefs.lastSync).toBe(now.toISOString());
    expect(prefs.gear.map((g) => g.name)).toEqual(['Gravel Blau', 'MTB Rot']);
    expect((await db.settings.get(LAST_KEY)).value.at).toBe(now.toISOString());

    // the next fetch: only from 30 days before the last one; nothing counted twice
    const later = await runSync(db, { call: c, now: new Date('2026-10-12T08:00:00Z') });
    const after = log.filter((x) => x.step === 'activities').at(-1).after;
    expect(Number(after)).toBe(Math.floor((Date.parse('2026-10-12T06:00:00Z') - 30 * 864e5) / 1000));
    expect(later).toMatchObject({ first: false, n: 0 });
    expect((await db.bikes.get('gb')).km).toBe(6042);
  });

  it('a changed Strava bike becomes a question; «Übernehmen» moves the km, «Behalten» keeps them', async () => {
    const acts = [act('1')];
    await runSync(db, { call: fakeServer(acts).c, now: new Date('2026-10-12T06:00:00Z') });
    const moved = [act('1', { gearId: 'g2' })];
    const last = await runSync(db, { call: fakeServer(moved).c, now: new Date('2026-10-12T07:00:00Z') });
    expect(last.changes).toBe(1);
    const [q] = (await db.settings.get(CHANGES_KEY)).value;
    expect(q).toMatchObject({ fromBike: 'gb', toBike: 'mr', km: 42 });
    await answerChange(db, q, true);
    expect((await db.bikes.get('mr')).km).toBe(3042);
    expect((await db.bikes.get('gb')).km).toBe(6000);
    expect((await db.settings.get(CHANGES_KEY)).value).toEqual([]);
    // asked again after «Behalten»? no: the entry knows the new Strava bike
    await runSync(db, { call: fakeServer([act('1', { gearId: 'g1' })]).c, now: new Date('2026-10-12T08:00:00Z') });
    const [q2] = (await db.settings.get(CHANGES_KEY)).value;
    await answerChange(db, q2, false);
    expect((await db.bikes.get('mr')).km).toBe(3042);
    const again = await runSync(db, { call: fakeServer([act('1', { gearId: 'g1' })]).c, now: new Date('2026-10-12T09:00:00Z') });
    expect(again.changes).toBe(0);
  });

  it('«Zum Prüfen»: Passt, another bike, Zählt nicht', async () => {
    await runSync(db, { call: fakeServer([act('1', { gearId: null }), act('2', { gearId: null, start: '2026-10-10T07:00:00Z' })]).c });
    const open = (await db.kmBook.toArray()).filter((e) => e.state === 'open');
    expect(open).toHaveLength(2);
    await checkRide(db, open[0], 'mr');
    await checkRide(db, open[1], null);
    expect((await db.bikes.get('mr')).km).toBe(3042);
    expect((await db.kmBook.get(open[1].id)).state).toBe('removed');
  });
});

describe('fetching and the device key', () => {
  it('fetchNow keeps an error as a code and never throws; unauthorized drops the key', async () => {
    globalThis.localStorage = store();
    localStorage.setItem(KEY_LS, 'k1');
    const busy = async () => {
      const { StravaError } = await import('../src/lib/strava/client.svelte.js');
      throw new StravaError('strava_busy');
    };
    expect(await fetchNow({ db, c: busy })).toBe(null);
    expect(strava.error).toBe('strava_busy');
    expect(localStorage.getItem(KEY_LS)).toBe('k1');
    const gone = async () => {
      const { StravaError } = await import('../src/lib/strava/client.svelte.js');
      throw new StravaError('unauthorized');
    };
    await fetchNow({ db, c: gone });
    expect(localStorage.getItem(KEY_LS)).toBe(null);
    delete globalThis.localStorage;
  });

  it('autoFetch: only with a key, «auto» on and 15 minutes after the last try', async () => {
    globalThis.localStorage = store();
    const now = new Date('2026-10-12T06:00:00Z');
    expect(await autoFetch({ db, now })).toBe(null); // no key
    localStorage.setItem(KEY_LS, 'k1');
    await db.meta.put({ key: TRY_KEY, at: '2026-10-12T05:50:00Z' });
    expect(await autoFetch({ db, now })).toBe(null); // 10 minutes ago
    await db.settings.put({ key: PREFS_KEY, value: { fetch: 'button' } });
    await db.meta.put({ key: TRY_KEY, at: '2026-10-12T05:00:00Z' });
    expect(await autoFetch({ db, now })).toBe(null); // only with the button
    delete globalThis.localStorage;
  });

  it('call sends the key and turns a server error into its code', async () => {
    const seen = [];
    const doFetch = async (url, init) => {
      seen.push([url, init.headers.Authorization]);
      return { ok: false, status: 429, json: async () => ({ error: 'strava_busy', code: 'strava_busy' }) };
    };
    await expect(call('gear', { key: 'k9', doFetch })).rejects.toMatchObject({ code: 'strava_busy' });
    expect(seen).toEqual([[`${STRAVA_URL}?step=gear`, 'Bearer k9']]);
    await expect(call('gear', { key: 'k9', doFetch: async () => Promise.reject(new Error('offline')) })).rejects.toMatchObject({ code: 'network' });
  });

  it('takeReturn stores the key once and cleans the address', () => {
    const ls = store();
    let replaced = null;
    const hist = { replaceState: (a, b, url) => (replaced = url) };
    const loc = { hash: '#/bikes?tab=care&view=strava&strava=connected&key=abc123', pathname: '/packgenerator/', search: '' };
    expect(takeReturn(loc, hist, ls)).toEqual({ connected: true });
    expect(ls.getItem(KEY_LS)).toBe('abc123');
    expect(replaced).toBe('/packgenerator/#/bikes?tab=care&view=strava');
    expect(strava.justConnected).toBe(true);
    expect(takeReturn({ ...loc, hash: '#/bikes?tab=care&view=strava&strava=error&error=denied' }, hist, store())).toEqual({ error: 'denied' });
    expect(takeReturn({ ...loc, hash: '#/bikes?tab=care' }, hist, store())).toBe(null);
    strava.justConnected = false;
  });

  it('the tile goes on top of Today once', async () => {
    expect(await addTile(db)).toBe(true);
    expect((await db.settings.get(WALL_KEY)).value.tiles[0]).toEqual({ id: 'strava', size: 'w' });
    expect(await addTile(db)).toBe(false);
  });

  it('Trennen: the server is told, the key goes, the rides stay unless chosen', async () => {
    globalThis.localStorage = store();
    localStorage.setItem(KEY_LS, 'k1');
    const { c, log } = fakeServer([act('1')]);
    await runSync(db, { call: c });
    expect(await disconnect({ db, c })).toBe(true);
    expect(log.at(-1).step).toBe('disconnect');
    expect(localStorage.getItem(KEY_LS)).toBe(null);
    expect((await db.kmBook.toArray()).some((e) => e.source === 'strava')).toBe(true);
    expect(prefsOf((await db.settings.get(PREFS_KEY)).value).lastSync).toBe(null);
    localStorage.setItem(KEY_LS, 'k2');
    await disconnect({ db, c, removeRides: true });
    expect((await db.kmBook.toArray()).some((e) => e.source === 'strava')).toBe(false);
    expect((await db.bikes.get('gb')).km).toBe(6000);
    delete globalThis.localStorage;
  });
});
