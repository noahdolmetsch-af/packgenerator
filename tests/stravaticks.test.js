// Package G #156/#191/#202: Strava ticks Aktiv activities by itself; indoor rides count for a chosen bike.
// Fictional activities only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { seedActs } from '../src/lib/flow.js';
import { planTicks, prefsOf, defaultAct, sportKey, seenSports, applyTicks, answer, setSport, TICKS_KEY, OPEN_KEY, HANDLED_KEY } from '../src/lib/stravaticks.js';
import { planSync, toRides } from '../src/lib/stravasync.js';
import { makeEntry } from '../src/lib/kmbook.js';

const acts = [...seedActs(), { id: 'act-w', name: 'Wandern', icon: 'heart', ring: 'move', goals: [{ count: 1, days: 30 }], order: 20 }];
const sa = (id, over = {}) => ({ id, day: '2026-10-15', start: '2026-10-15T06:00:00Z', name: `Akt ${id}`, type: 'Run', movingS: 2400, trainer: false, ...over });
const today = '2026-10-19';

describe('which activity a Strava sport ticks', () => {
  it('finds the default by id, then by name', () => {
    expect(defaultAct('Run', acts)).toBe('run');
    expect(defaultAct('Hike', acts)).toBe('act-w');
    expect(defaultAct('BackcountrySki', acts)).toBe(null);
    expect(sportKey('TrailRun')).toBe('Run');
    expect(sportKey('GravelRide', true)).toBe('VirtualRide');
  });
  it('lists the sports seen, with the user choice', () => {
    const rows = seenSports([sa('1'), sa('2'), sa('3', { type: 'Walk' })], acts, { Hike: '' });
    expect(rows.map((r) => [r.key, r.count, r.actId, r.own])).toEqual([['Run', 2, 'run', false], ['Hike', 1, null, true]]);
  });
});

describe('planTicks', () => {
  it('ticks each activity once, never twice on a day, keeps unmatched ones for later', () => {
    const log = [{ id: 'x', actId: 'tennis', day: '2026-10-16', n: 1 }];
    const p = planTicks({ activities: [sa('1'), sa('2', { start: '2026-10-15T17:00:00Z' }), sa('3', { type: 'Tennis', day: '2026-10-16' }), sa('4', { type: 'BackcountrySki' })], acts, log, prefs: prefsOf(null), today });
    expect(p.add.map((e) => [e.actId, e.day, e.min, e.via, e.stravaId])).toEqual([['run', '2026-10-15', 40, 'strava', '1']]);
    expect(p.handled.sort()).toEqual(['1', '2', '3']);
  });
  it('suggests instead in «suggest», only for recent days; off does nothing', () => {
    const list = [sa('1'), sa('2', { day: '2026-09-01' })];
    const p = planTicks({ activities: list, acts, prefs: prefsOf({ mode: 'suggest' }), today });
    expect(p.add).toEqual([]);
    expect(p.suggest.map((s) => [s.id, s.actId])).toEqual([['1', 'run']]);
    expect(p.handled).toEqual(['1', '2']);
    expect(planTicks({ activities: list, acts, prefs: prefsOf({ mode: 'off' }), today }).add).toEqual([]);
  });
  it('does not tick «Velo draussen» on a trip day, and respects the own table', () => {
    const p = planTicks({ activities: [sa('1', { type: 'Ride' }), sa('2', { type: 'Ride', day: '2026-10-14' })], acts, prefs: prefsOf(null), today, trips: ['2026-10-15'] });
    expect(p.add.map((e) => e.day)).toEqual(['2026-10-14']);
    expect(planTicks({ activities: [sa('1')], acts, prefs: prefsOf({ map: { Run: '' } }), today }).add).toEqual([]);
  });
});

describe('in the database', () => {
  it('ticks, suggests, answers and maps', async () => {
    const db = createDb(`ticks-${Math.random()}`);
    await db.flowActs.bulkPut(acts);
    await db.activities.bulkPut([sa('1'), sa('2', { type: 'BackcountrySki', day: '2026-10-17' })]);
    const now = new Date('2026-10-19T10:00:00Z');
    expect(await applyTicks(db, { now })).toEqual({ add: 1, suggest: 0 });
    expect(await applyTicks(db, { now })).toEqual({ add: 0, suggest: 0 });
    // a deleted tick does not come back
    await db.flowLog.delete('fl-strava-1');
    await applyTicks(db, { now });
    expect(await db.flowLog.count()).toBe(0);
    // a new act for ski touring, chosen in the table: the older activity is ticked now
    await db.flowActs.put({ id: 'act-st', name: 'Skitour', icon: 'heart', ring: 'move', goals: [], order: 30 });
    await db.settings.put({ key: TICKS_KEY, value: { mode: 'suggest' } });
    await setSport('BackcountrySki', 'act-st', db, now); // the fixed day of this test, not today (the activity of 17 Oct fell out of the 14 days on 31 Oct)
    const open = (await db.settings.get(OPEN_KEY)).value;
    expect(open.map((o) => o.id)).toEqual(['2']);
    const e = await answer('2', true, db);
    expect(e.actId).toBe('act-st');
    expect((await db.settings.get(OPEN_KEY)).value).toEqual([]);
    expect((await db.settings.get(HANDLED_KEY)).value).toEqual(['1', '2']);
  });
});

describe('#202 indoor rides', () => {
  const appBikes = [{ id: 'gb', name: 'Gravel Blau' }, { id: 'rolle', name: 'Altes Rennvelo' }];
  const ride = (id, over = {}) => ({ id, name: `Rolle ${id}`, type: 'VirtualRide', start: '2026-10-05T18:00:00Z', km: 25, gearId: null, device: '', trainer: true, ...over });
  const base = [makeEntry({ id: 's-gb', bikeId: 'gb', date: '2026-01-01', km: 0, kind: 'start' }), makeEntry({ id: 's-r', bikeId: 'rolle', date: '2026-01-01', km: 0, kind: 'start' })];
  it('leaves indoor rides out without a chosen bike', () => {
    expect(toRides([ride('1')]).rides).toEqual([]);
    expect(planSync({ activities: [ride('1')], bikes: appBikes, entries: base }).entries).toEqual([]);
  });
  it('counts them for the bike chosen for indoor rides', () => {
    const p = planSync({ activities: [ride('1'), ride('2', { type: 'Ride', start: '2026-10-06T18:00:00Z' })], bikes: appBikes, entries: base, indoorBike: 'rolle' });
    expect(p.entries.map((e) => [e.stravaId, e.bikeId, e.state, e.by])).toEqual([['1', 'rolle', 'counted', 'indoor'], ['2', 'rolle', 'counted', 'indoor']]);
    // an unknown bike id counts nothing
    expect(planSync({ activities: [ride('1')], bikes: appBikes, entries: base, indoorBike: 'weg' }).entries).toEqual([]);
  });
});
