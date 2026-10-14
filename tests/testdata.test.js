import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { isTestName, findTestData, tidyWrites, undoWrites, tidiedCount, debriefCount } from '../src/lib/testdata.js';
import { testDataState, tidyTestData, undoTestData } from '../src/lib/testdatadb.js';
import { TEMPLATES_KEY } from '../src/lib/templates.js';
import { tripsOverview, endedTooEarly } from '../src/lib/tripsoverview.js';
import { planAgainChanges } from '../src/lib/trip/ending.js';

// v0.88.0 «Aufräumen und Ausprobieren»: fictional data only.
const trips = [
  { id: 't1', title: 'Testtour Regen', startDate: '2026-09-01', days: 1, entries: [{ itemId: 'i1' }] },
  { id: 't2', title: 'Jura loop', startDate: '2026-09-05', days: 1, entries: [{ itemId: 'i1' }] },
  { id: 't3', title: 'test3', startDate: '2026-09-08', days: 1, entries: [] },
];
const debriefs = [
  { tripId: 't1', status: 'done', items: {} },
  { tripId: 't2', status: 'done', items: {} },
];
const items = [
  { id: 'i1', name: 'Test lamp', ownership: 'owned' },
  { id: 'i2', name: 'Contest jersey', ownership: 'owned' },
  { id: 'i3', name: 'Tested tent', ownership: 'unclear' },
  { id: 'i4', name: 'Rain jacket', ownership: 'owned' },
];
const templates = [
  { id: 'p1', name: 'TestVorlage' },
  { id: 'p2', name: 'Weekend' },
];

describe('test data: what counts', () => {
  it('«test» at the start of a word, not inside one, not the fixture mark', () => {
    expect(isTestName('Testtour')).toBe(true);
    expect(isTestName('my test')).toBe(true);
    expect(isTestName('Contest')).toBe(false);
    expect(isTestName('latest')).toBe(false);
    expect(isTestName('test_data_gtp_ Rain jacket')).toBe(false);
  });
  it('finds trips (with their debriefs), gear and templates', () => {
    const f = findTestData({ trips, debriefs, items, templates });
    expect(f.trips.map((x) => x.id)).toEqual(['t1', 't3']);
    expect(f.trips[0].debrief).toBe(true);
    expect(f.items.map((x) => x.id)).toEqual(['i1', 'i3']);
    expect(f.templates.map((x) => x.id)).toEqual(['p1']);
    expect(f.n).toBe(5);
    expect(debriefCount(f, new Set(['t1', 't3']))).toBe(1);
    expect(debriefCount(f, new Set(['t3']))).toBe(0);
  });
});

describe('test data: archive and undo', () => {
  const now = '2026-10-11T10:00:00.000Z';
  it('archives only the chosen ones; the debrief stops counting', () => {
    const w = tidyWrites({ trips, debriefs, items, templates }, new Set(['t1', 'i1', 'p1']), now);
    expect(w.trips).toEqual([{ id: 't1', changes: expect.objectContaining({ archivedAt: now, skipped: true, tidiedAt: now }) }]);
    expect(w.debriefs).toEqual([{ tripId: 't1', changes: expect.objectContaining({ status: 'archived', tidyBefore: { status: 'done' } }) }]);
    expect(w.items[0]).toMatchObject({ id: 'i1', changes: { ownership: 'gone', archivedFrom: 'owned', archivedBy: 'tidy' } });
    expect(w.templates.find((x) => x.id === 'p1').archivedAt).toBe(now);
    expect(w.templates.find((x) => x.id === 'p2').archivedAt).toBeUndefined();
  });
  it('a database round trip: tidy, nothing learns from it, undo brings everything back', async () => {
    const db = createDb('testdata-1');
    await db.trips.bulkPut(trips);
    await db.debriefs.bulkPut(debriefs);
    await db.items.bulkPut(items);
    await db.settings.put({ key: TEMPLATES_KEY, value: templates });
    const before = await testDataState(db);
    expect(before).toMatchObject({ tidied: 0 });
    const all = new Set([...before.found.trips, ...before.found.items, ...before.found.templates].map((x) => x.id));
    expect(await tidyTestData(db, all, now)).toBe(5);
    expect((await db.debriefs.get('t1')).status).toBe('archived');
    expect((await db.debriefs.get('t2')).status).toBe('done');
    expect((await db.trips.get('t1')).skipped).toBe(true);
    expect((await db.items.get('i3')).ownership).toBe('gone');
    const after = await testDataState(db);
    expect(after.found.n).toBe(0);
    expect(after.tidied).toBe(5);
    expect(await undoTestData(db)).toBe(5);
    expect((await db.debriefs.get('t1')).status).toBe('done');
    expect((await db.trips.get('t1'))).toMatchObject({ skipped: false, archivedAt: null, tidiedAt: null });
    expect((await db.items.get('i3')).ownership).toBe('unclear');
    expect((await db.settings.get(TEMPLATES_KEY)).value.find((x) => x.id === 'p1').archivedAt).toBeNull();
    expect(tidiedCount({ trips: await db.trips.toArray(), items: await db.items.toArray(), templates: (await db.settings.get(TEMPLATES_KEY)).value })).toBe(0);
    expect(undoWrites({}).trips).toEqual([]);
  });
});

describe('a trip ended before it began', () => {
  const today = '2026-10-11';
  const early = { id: 'e1', title: 'Jura loop', startDate: '2026-10-20', days: 2, finished: '2026-10-07', status: 'done', entries: [{ itemId: 'i4' }] };
  it('is found and gets «Plan again», not «Ridden»', () => {
    expect(endedTooEarly(early, today)).toBe(true);
    expect(endedTooEarly({ ...early, startDate: '2026-10-01' }, today)).toBe(false);
    expect(endedTooEarly({ ...early, skipped: true }, today)).toBe(false);
    expect(endedTooEarly({ ...early, finished: null, status: 'planned' }, today)).toBe(false);
    const v = tripsOverview([early], [{ tripId: 'e1', status: 'done' }], today);
    // v0.125.0 TZ-1: in the group «Planned», first, with «Plan again»; not completed, not rated
    expect(v.plan.filter((r) => r.kind === 'replan').map((r) => r.id)).toEqual(['e1']);
    expect(v.done).toEqual([]);
    expect(v.rated).toEqual([]);
  });
  it('plan again takes the end back', () => {
    expect(planAgainChanges(early)).toEqual({ finished: null, endReason: null, status: 'planned' });
    expect(planAgainChanges({ ...early, status: 'packed' })).toEqual({ finished: null, endReason: null });
  });
});
