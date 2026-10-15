import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { isTestName, findTestData, tidyWrites, undoWrites, tidiedCount, debriefCount } from '../src/lib/testdata.js';
import { testDataState, tidyTestData, undoTestData } from '../src/lib/testdatadb.js';
import { TEMPLATES_KEY } from '../src/lib/templates.js';
import { tripsOverview, endedTooEarly } from '../src/lib/tripsoverview.js';
import { learningsFor, tipsByItem } from '../src/lib/debrief.js';
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
    // 0.161.0 B2: glued on with a capital counts (Today and the clean-up use the same rule)
    expect(isTestName('realTest Skitour')).toBe(true);
    expect(isTestName('In7days3hTestLicht')).toBe(true);
    expect(isTestName('ContestJura')).toBe(false);
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

// 0.161.0 (Bugfixes 0.132.2 B3): an old test note turned up in a new trip, also after the tidy-up
describe('test data: learnings', () => {
  const now = '2026-10-15T10:00:00.000Z';
  const learnings = [
    { id: 1, topic: 'Debrief', rule: 'test note for the debrief', source: 'Jura loop', itemIds: [], priority: 'medium', createdAt: '2026-10-05T01:00:00.000Z' },
    { id: 2, topic: 'Debrief', rule: 'Take the lock next time', source: 'Testtour Regen', itemIds: ['i1'], priority: 'medium', createdAt: '2026-10-08T11:00:00.000Z' },
    { id: 3, topic: 'Debrief', rule: 'Lamp too weak', tripId: 't3', source: 'renamed', itemIds: [], priority: 'medium', createdAt: '2026-10-09T11:00:00.000Z' },
    { id: 4, topic: 'Sleep', rule: 'Test sleep setups before a race', source: 'import', itemIds: [], priority: 'low', importedAt: '2026-10-08T23:00:00.000Z' },
    { id: 5, topic: 'Night', rule: 'Night glasses are a must', source: 'Test rides', itemIds: ['i4'], priority: 'high' },
  ];
  const all = { trips, debriefs, items, templates, learnings };
  it('finds the test notes a debrief wrote, not imported or older ones', () => {
    const f = findTestData(all);
    expect(f.learnings.map((x) => x.id)).toEqual(['learning:1', 'learning:2']);
    expect(f.n).toBe(7);
  });
  it('archives the chosen notes and every note of a chosen trip; undo brings them back', () => {
    const w = tidyWrites(all, new Set(['learning:1', 't1', 't3']), now);
    expect(w.learnings.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(w.learnings[0].changes).toEqual({ archivedAt: now, tidiedAt: now });
    expect(tidyWrites(all, new Set(['i1', 'p1']), now).learnings).toEqual([]);
    const done = learnings.map((l) => (l.id <= 3 ? { ...l, archivedAt: now, tidiedAt: now } : l));
    expect(tidiedCount({ learnings: done })).toBe(3);
    expect(undoWrites({ learnings: done }).learnings.map((x) => x.id)).toEqual([1, 2, 3]);
  });
  it('an archived note never shows in a trip again', () => {
    const done = learnings.map((l) => (l.id <= 3 ? { ...l, archivedAt: now } : l));
    const trip = { id: 'n1', title: 'New trip', startDate: '2026-10-20', entries: [{ itemId: 'i1' }] };
    expect(learningsFor(trip, done, 5, new Date(now)).map((l) => l.id)).toEqual([5, 4]);
    expect(Object.keys(tipsByItem(done))).toEqual(['i4']);
  });
  it('the database tidy-up writes the learnings too', async () => {
    const db = createDb('testdata-2');
    await db.trips.bulkPut(trips);
    await db.learnings.bulkPut(learnings);
    expect(await tidyTestData(db, new Set(['t1', 'learning:1']), now)).toBe(3);
    expect((await db.learnings.get(2)).archivedAt).toBe(now);
    expect((await db.learnings.get(5)).archivedAt).toBeUndefined();
    expect(await undoTestData(db)).toBe(3);
    expect((await db.learnings.get(1)).archivedAt).toBeNull();
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
