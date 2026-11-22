// «Dauer nachtragen» for tour days (Noah 21.11.2026 22:47, S12): fictional trips only.
import { describe, it, expect } from 'vitest';
import { tourRows, idOf, writeTourDay, removeTourDay } from '../src/lib/flow/tourtage.js';

const TODAY = '2026-10-09';
const act = (id, name, extra = {}) => ({ id, name, ring: 'move', icon: 'heart', order: 0, goals: [], ...extra });
const ACTS = [act('skitour', 'Ski tour'), act('hike', 'Hike'), act('bike', 'Cycling outdoors', { counts: ['commute', 'trip'] })];
const trip = (id, domain, startDate, days, extra = {}) => ({ id, domain, title: `Tour ${id}`, startDate, days, ...extra });
const run = (over = {}) => tourRows({ trips: [], acts: ACTS, log: [], activities: [], map: {}, today: TODAY, ...over });

describe('tourRows', () => {
  it('every past day of a ski trip without time is a row, newest first', () => {
    const r = run({ trips: [trip('t1', 'ski', '2026-10-05', 3)] });
    expect(r.map((x) => x.day)).toEqual(['2026-10-07', '2026-10-06', '2026-10-05']);
    expect(r[0]).toMatchObject({ actId: 'skitour', tripId: 't1', title: 'Tour t1', id: idOf('t1', '2026-10-07') });
  });
  it('today and the future are not asked', () => {
    expect(run({ trips: [trip('t1', 'hiking', '2026-10-08', 4)] }).map((x) => x.day)).toEqual(['2026-10-08']);
  });
  it('a day with a Strava activity or a tick with minutes is not a row', () => {
    const r = run({
      trips: [trip('t1', 'ski', '2026-10-05', 3)],
      activities: [{ id: 's1', day: '2026-10-06' }],
      log: [{ id: 'x', actId: 'skitour', day: '2026-10-07', min: 240 }],
    });
    expect(r.map((x) => x.day)).toEqual(['2026-10-05']);
  });
  it('cycling trips are not asked (the activity counts trip days itself); weekend and travel are no sport', () => {
    expect(run({ trips: [trip('t1', 'bikepacking', '2026-10-05', 2), trip('t2', 'weekend', '2026-10-05', 2), trip('t3', 'travel', '2026-10-05', 2)] })).toEqual([]);
  });
  it('without an activity for the sport, or paused, nothing is asked', () => {
    expect(run({ acts: [], trips: [trip('t1', 'ski', '2026-10-05', 2)] })).toEqual([]);
    expect(run({ acts: [act('skitour', 'Ski tour', { paused: true })], trips: [trip('t1', 'ski', '2026-10-05', 2)] })).toEqual([]);
  });
  it('skipped, idea and archived trips are left out; a written day is not asked again', () => {
    const trips = [trip('t1', 'ski', '2026-10-05', 1, { skipped: true }), trip('t2', 'ski', '2026-10-05', 1, { idea: true }), trip('t3', 'ski', '2026-10-05', 1, { archivedAt: 'x' })];
    expect(run({ trips })).toEqual([]);
    expect(run({ trips: [trip('t4', 'ski', '2026-10-05', 1)], log: [{ id: idOf('t4', '2026-10-05'), actId: 'skitour', day: '2026-10-05' }] })).toEqual([]);
  });
});

describe('writeTourDay', () => {
  const fake = () => {
    const rows = new Map();
    return {
      rows,
      flowActs: { get: async (id) => ACTS.find((a) => a.id === id) },
      flowLog: { put: async (e) => rows.set(e.id, e), delete: async (id) => rows.delete(id) },
    };
  };
  it('writes a tick of that sport and day with the minutes, source «tour»; Undo removes it', async () => {
    const db = fake();
    const row = { id: idOf('t1', '2026-10-05'), tripId: 't1', day: '2026-10-05', actId: 'skitour' };
    const e = await writeTourDay(db, row, 240);
    expect(e).toMatchObject({ id: row.id, actId: 'skitour', day: '2026-10-05', min: 240, via: 'tour', n: 1 });
    expect(db.rows.get(row.id)).toBeTruthy();
    await removeTourDay(db, row.id);
    expect(db.rows.size).toBe(0);
  });
  it('invalid minutes write nothing', async () => {
    const db = fake();
    expect(await writeTourDay(db, { id: 'a', day: '2026-10-05', actId: 'skitour' }, 0)).toBeNull();
    expect(await writeTourDay(db, { id: 'a', day: '2026-10-05', actId: 'skitour' }, 'x')).toBeNull();
    expect(db.rows.size).toBe(0);
  });
});
