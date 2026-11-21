// «Dauer nachtragen» (Noah 21.11.2026, S12): ticks without a measured time are listed; a tap writes the minutes; Undo. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { einheiten } from '../src/lib/flow/einheiten.js';
import { dueRows, writeDuration, restoreTick, NACHTRAG_CHIPS } from '../src/lib/flow/nachtragen.js';

const acts = [
  { id: 'yoga', name: 'Yoga', ring: 'move', goals: [] },
  { id: 'pushups', name: 'Push-ups', ring: 'move', perTap: 10, goals: [] },
  { id: 'bike', name: 'Cycling', ring: 'move', goals: [], counts: ['commute'] },
];
const log = [
  { id: 'a', actId: 'yoga', day: '2026-11-10', at: '2026-11-10T18:00:00.000Z', n: 1 },
  { id: 'b', actId: 'yoga', day: '2026-11-12', at: '2026-11-12T18:00:00.000Z', n: 1, min: 45 },
  { id: 'c', actId: 'yoga', day: '2026-11-14', at: '2026-11-14T18:00:00.000Z', n: 1 },
  { id: 'd', actId: 'pushups', day: '2026-11-14', at: '2026-11-14T08:00:00.000Z', n: 20 },
  { id: 'e', actId: 'bike', day: '2026-11-14', at: '2026-11-14T08:00:00.000Z', n: 1, via: 'commute' },
  { id: 'f', actId: 'yoga', day: '2026-11-15', at: '2026-11-15T18:00:00.000Z', n: 1, via: 'strava', stravaId: 9 },
];
const units = () => einheiten({ log, activities: [], acts, usual: {}, map: {} });

describe('the ticks without a measured time', () => {
  it('lists only ticks that count with «ca.» and can take minutes, newest first', () => {
    const rows = dueRows(units(), log);
    expect(rows.map((r) => r.id)).toEqual(['c', 'a']);
    expect(rows[0]).toEqual({ id: 'c', day: '2026-11-14', actId: 'yoga', ca: 60 });
  });
  it('a measured tick, a counted amount, the ride to work and a Strava tick are not offered', () => {
    const ids = dueRows(units(), log).map((r) => r.id);
    for (const x of ['b', 'd', 'e', 'f']) expect(ids).not.toContain(x);
  });
  it('the buttons are 15, 30, 45, 60', () => expect(NACHTRAG_CHIPS).toEqual([15, 30, 45, 60]));
});

describe('writing the duration', () => {
  it('writes the minutes into the tick, the row goes away, and Undo brings it back', async () => {
    const db = createDb('nachtragen-1');
    await db.flowLog.bulkPut(log);
    const before = await writeDuration(db, 'a', 30);
    expect(before.min).toBeUndefined();
    expect((await db.flowLog.get('a')).min).toBe(30);
    const rows = dueRows(einheiten({ log: await db.flowLog.toArray(), activities: [], acts, usual: {}, map: {} }), await db.flowLog.toArray());
    expect(rows.map((r) => r.id)).toEqual(['c']);
    await restoreTick(db, before);
    expect((await db.flowLog.get('a')).min).toBeUndefined();
  });
  it('a typed number works; rubbish, a Strava tick and a missing tick change nothing', async () => {
    const db = createDb('nachtragen-2');
    await db.flowLog.bulkPut(log);
    await writeDuration(db, 'c', '75');
    expect((await db.flowLog.get('c')).min).toBe(75);
    expect(await writeDuration(db, 'a', 'abc')).toBeNull();
    expect(await writeDuration(db, 'a', 0)).toBeNull();
    expect(await writeDuration(db, 'f', 30)).toBeNull();
    expect(await writeDuration(db, 'e', 30)).toBeNull();
    expect(await writeDuration(db, 'nope', 30)).toBeNull();
    expect((await db.flowLog.get('a')).min).toBeUndefined();
  });
  it('overwrites nothing else of the tick', async () => {
    const db = createDb('nachtragen-3');
    await db.flowLog.bulkPut(log);
    await writeDuration(db, 'a', 15);
    expect(await db.flowLog.get('a')).toEqual({ ...log[0], min: 15 });
  });
});
