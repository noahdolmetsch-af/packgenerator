import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { makeEntry, rematchOpen } from '../src/lib/kmbook.js';
import { createDb } from '../src/lib/db.js';
import { autoAssign, undoAutoAssign, PREFS_KEY } from '../src/lib/strava/client.svelte.js';
import { RULES_KEY } from '../src/lib/kmbookdb.js';

// Gesamttest 20.10.2026 B1 (Noah «1a»): rides waiting with a Strava bike the app did not know at
// import time are assigned once a bike has that name (or a gear rule). Fictional bikes only.
const GRAVEL = 'test_data_rm_gravel';
const TRAIL = 'test_data_rm_trail';
const BIKES = [
  { id: GRAVEL, name: 'Demo Kies LS' },
  { id: TRAIL, name: 'Demo Trail' },
];
const at = new Date('2026-10-10T08:00:00Z');
let n = 0;
const open = (f) => makeEntry({ source: 'strava', state: 'open', sure: 'unclear', stravaId: `s${++n}`, km: 20, date: '2026-10-01', gear: 'Demo Kies LS', reason: { code: 'none', gear: f.gear ?? 'Demo Kies LS', profile: '' }, ...f }, at);

describe('rematchOpen: which waiting rides fit a bike now', () => {
  it('a Strava bike with the same name (spaces and case aside) → that bike', () => {
    const a = open({ gear: 'demo  kies ls' });
    const b = open({ gear: 'Unbekannt' });
    const c = open({ gear: '' });
    const hits = rematchOpen([a, b, c], { bikes: BIKES });
    expect(hits.map((h) => [h.entry.id, h.bikeId])).toEqual([[a.id, GRAVEL]]);
  });
  it('a gear rule counts too', () => {
    const a = open({ gear: 'Altes Velo' });
    const rules = [{ id: 'r1', kind: 'gear', value: 'Altes Velo', bikeIds: [TRAIL] }];
    expect(rematchOpen([a], { bikes: BIKES, rules }).map((h) => h.bikeId)).toEqual([TRAIL]);
  });
  it('contradictions, other reasons, undone and ignored rides keep waiting', () => {
    const sensor = open({ sensors: ['FP1'] });
    const rules = [{ id: 'r1', kind: 'sensor', value: 'FP1', bikeIds: [TRAIL] }];
    const conflict = open({ reason: { code: 'conflict', by: 'gear', said: GRAVEL, bike: TRAIL } });
    const undone = { ...open({}), noAuto: true };
    const ignored = open({ gear: 'Demo Trail', reason: { code: 'none', gear: 'Demo Trail', profile: '' } });
    const counted = open({ state: 'counted', bikeId: GRAVEL });
    const hits = rematchOpen([sensor, conflict, undone, ignored, counted], { bikes: BIKES, rules, skipGear: ['Demo Trail'] });
    expect(hits).toEqual([]);
  });
  it('never counts a ride twice: not in the start value, not when a twin counts already', () => {
    const start = makeEntry({ bikeId: GRAVEL, kind: 'start', date: '2026-09-01', km: 500, source: 'hand' }, at);
    const old = open({ date: '2026-08-20' });
    const fresh = open({ date: '2026-09-10', km: 31 });
    const twin = makeEntry({ bikeId: GRAVEL, date: '2026-09-10', km: 31, source: 'fit', state: 'counted' }, at);
    const later = open({ date: '2026-09-20' });
    const hits = rematchOpen([start, old, fresh, twin, later], { bikes: BIKES });
    expect(hits.map((h) => h.entry.id)).toEqual([later.id]);
  });
});

describe('autoAssign: one batch, Undo, idempotent', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`rm-db-${Math.random()}`);
    await db.bikes.bulkPut(BIKES.map((b) => ({ ...b, km: null })));
    await db.settings.put({ key: RULES_KEY, value: [] });
    await db.settings.put({ key: PREFS_KEY, value: { gear: [{ id: 'g9', name: 'Demo Trail' }], ignore: ['g9'] } });
  });
  it('assigns, counts the km, then nothing more; Undo puts them back and they stay for you', async () => {
    const list = [open({ km: 10 }), open({ km: 15 }), open({ gear: 'Demo Trail', reason: { code: 'none', gear: 'Demo Trail', profile: '' } })];
    await db.kmBook.bulkPut(list);
    const r = await autoAssign(db);
    expect(r.n).toBe(2);
    expect((await db.bikes.get(GRAVEL)).km).toBe(25);
    const e = await db.kmBook.get(list[0].id);
    expect([e.state, e.bikeId, e.reason]).toEqual(['counted', GRAVEL, null]);
    expect((await db.kmBook.get(list[2].id)).state).toBe('open'); // ignored Strava bike
    expect((await autoAssign(db)).n).toBe(0);
    await undoAutoAssign(db, r.put, r.bikes);
    expect((await db.kmBook.get(list[0].id)).state).toBe('open');
    expect((await db.bikes.get(GRAVEL)).km).toBeNull();
    expect((await autoAssign(db)).n).toBe(0);
  });
});
