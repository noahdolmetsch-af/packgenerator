import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { createDb, SCHEMA_VERSION } from '../src/lib/db.js';
import { APP_ID } from '../src/lib/backup.js';
import { isDemoFile, startDemo, endDemo, demoState, applyClock } from '../src/lib/demo.js';

const demoFile = {
  app: APP_ID,
  schemaVersion: SCHEMA_VERSION,
  demo: { name: '303 test run', days: [{ date: '2026-10-14', label: 'Packing day' }] },
  tables: { trips: [{ id: 'demo-303', title: 'Demo · 303', entries: [] }], debriefs: [{ tripId: 'demo-303', status: 'done' }] },
};

describe('demo mode', () => {
  it('keeps your data aside and puts it back exactly', async () => {
    const db = createDb('demo-1');
    await db.trips.put({ id: 'trip-303', title: '303', entries: [] });
    await db.bikes.put({ id: 'fully', name: 'Spark', km: 1460 });
    expect(isDemoFile(demoFile)).toBe(true);
    expect(isDemoFile({ tables: {} })).toBe(false);

    await startDemo(db, demoFile, new Date('2026-10-04T20:00:00Z'));
    expect((await db.trips.toArray()).map((t) => t.id).sort()).toEqual(['demo-303', 'trip-303']);
    const st = await demoState(db);
    expect(st).toMatchObject({ name: '303 test run', startedAt: '2026-10-04T20:00:00.000Z' });
    expect(st.snapshot).toBeUndefined();
    await expect(startDemo(db, demoFile)).rejects.toThrow(/already running/);

    // Things done in the demo: the km change and a new learning.
    await db.bikes.update('fully', { km: 1763 });
    await db.learnings.put({ id: 'L-demo', rule: 'x' });

    expect(await endDemo(db)).toBe(true);
    expect((await db.trips.toArray()).map((t) => t.id)).toEqual(['trip-303']);
    expect((await db.bikes.get('fully')).km).toBe(1460);
    expect(await db.learnings.count()).toBe(0);
    expect(await db.debriefs.count()).toBe(0);
    expect(await demoState(db)).toBe(null);
    expect(await endDemo(db)).toBe(false);
  });
});

describe('demo day', () => {
  const Real = globalThis.Date;
  afterEach(() => (globalThis.Date = Real));
  it('shifts new Date() and Date.now(), not given dates', () => {
    applyClock(10 * 864e5);
    const now = Real.now();
    expect(Math.round((Date.now() - now) / 864e5)).toBe(10);
    expect(Math.round((new Date().getTime() - now) / 864e5)).toBe(10);
    expect(new Date('2026-10-15T00:00:00Z').toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });
});
