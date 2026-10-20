import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { ensureSeed } from '../src/lib/flowdb.js';
import { seedActs } from '../src/lib/flow.js';
import { FIRST_KEY, isFresh, chooseStart, examplesFile, examplesLeft, exampleCount, removeExamples, undoExamples, addExamples, mayAsk } from '../src/lib/firststart.js';
import { isTestName } from '../src/lib/testname.js';

const TODAY = '2026-10-20';
const SEEDS = seedActs().length;

async function fresh(name) {
  const db = createDb(name);
  await ensureSeed(db);
  return db;
}

describe('first start: with examples or empty', () => {
  it('asks only a truly new app', async () => {
    const db = await fresh('fs-1');
    expect(await isFresh(db)).toBe(true);
    // one own thing anywhere: never asked (Noah's data stays untouched)
    await db.notes.put({ id: 'n1', text: 'mine' });
    expect(await isFresh(db)).toBe(false);

    const db2 = await fresh('fs-2');
    await db2.flowActs.put({ id: 'own-act', name: 'Climbing wall' });
    expect(await isFresh(db2)).toBe(false);

    const db3 = await fresh('fs-3');
    await db3.meta.put({ key: 'demo', name: 'Playground' });
    expect(await isFresh(db3)).toBe(false);

    const db4 = await fresh('fs-4');
    await db4.settings.put({ key: FIRST_KEY, value: { choice: 'empty' } });
    expect(await isFresh(db4)).toBe(false);
  });

  it('«Start with examples» brings a made-up trip, bike and gear and remembers their ids', async () => {
    const db = await fresh('fs-5');
    await chooseStart(db, 'examples', TODAY);
    expect(await isFresh(db)).toBe(false);
    const trips = (await db.trips.toArray()).filter((x) => x.id === 'ex-trip');
    expect(await db.trips.count()).toBe(2);
    expect(trips[0]).toMatchObject({ id: 'ex-trip', bikeId: 'ex-bike', startDate: '2026-10-30', days: 2, status: 'planned' });
    expect(isTestName(trips[0].title)).toBe(false);
    expect(await db.bikes.count()).toBe(1);
    expect(await db.containers.count()).toBe(2);
    const items = await db.items.toArray();
    expect(items.length).toBeGreaterThanOrEqual(10);
    // every packed entry points to an example item
    const ids = new Set(items.map((i) => i.id));
    expect(trips[0].entries.every((e) => ids.has(e.itemId))).toBe(true);
    // the finished day ride three weeks ago, with its debrief
    expect(await db.trips.get('ex-past')).toMatchObject({ startDate: '2026-09-29', status: 'done', finished: true });
    expect(await db.debriefs.get('ex-past')).toMatchObject({ status: 'done' });
    expect(await db.flowActs.count()).toBe(SEEDS);
    const rec = (await db.settings.get(FIRST_KEY)).value;
    expect(rec.choice).toBe('examples');
    expect(rec.ids.flowActs).toHaveLength(SEEDS);
  });

  it('«Start empty» also takes the starter activities away and they do not come back', async () => {
    const db = await fresh('fs-6');
    await chooseStart(db, 'empty', TODAY);
    expect(await db.flowActs.count()).toBe(0);
    expect(await db.items.count()).toBe(0);
    await ensureSeed(db);
    expect(await db.flowActs.count()).toBe(0);
    expect(await isFresh(db)).toBe(false);
  });

  it('«Remove the examples» keeps own things and ticked activities, Undo puts them back', async () => {
    const db = await fresh('fs-7');
    await chooseStart(db, 'examples', TODAY);
    await db.items.put({ id: 'mine', name: 'My own lamp' });
    await db.flowLog.put({ id: 'l1', actId: 'meditation', day: TODAY });
    const left = await examplesLeft(db);
    expect(exampleCount(left)).toBeGreaterThan(10);
    expect(left.flowActs.map((a) => a.id)).not.toContain('meditation');

    const saved = await removeExamples(db);
    expect((await db.items.toArray()).map((i) => i.id)).toEqual(['mine']);
    expect(await db.trips.count()).toBe(0);
    expect(await db.debriefs.count()).toBe(0);
    expect(await db.bikes.count()).toBe(0);
    expect((await db.flowActs.toArray()).map((a) => a.id)).toEqual(['meditation']);
    expect(exampleCount(await examplesLeft(db))).toBe(0);

    await undoExamples(db, saved);
    expect(await db.trips.count()).toBe(2);
    expect(await db.debriefs.count()).toBe(1);
    expect(await db.flowActs.count()).toBe(SEEDS);
  });

  it('«Get the examples» later: brings them back after an empty start, own data untouched', async () => {
    const db = await fresh('fs-8');
    await chooseStart(db, 'empty', TODAY);
    await db.items.put({ id: 'mine', name: 'My own lamp' });
    await db.flowActs.put({ id: 'own-act', name: 'Climbing wall' });
    await addExamples(db, TODAY);
    expect(await db.trips.count()).toBe(2);
    expect(await db.items.get('mine')).toMatchObject({ name: 'My own lamp' });
    expect(await db.flowActs.count()).toBe(SEEDS + 1);
    await removeExamples(db);
    expect((await db.items.toArray()).map((i) => i.id)).toEqual(['mine']);
    expect((await db.flowActs.toArray()).map((a) => a.id)).toEqual(['own-act']);
  });

  it('«Get the examples» on a used app: its own unused starter activities stay when the examples go', async () => {
    const db = await fresh('fs-9');
    await db.trips.put({ id: 'own', title: 'My trip' });
    await addExamples(db, TODAY);
    await removeExamples(db);
    expect(await db.flowActs.count()).toBe(SEEDS);
    expect((await db.trips.toArray()).map((x) => x.id)).toEqual(['own']);
  });

  it('the examples file is fictional and well-formed', () => {
    const f = examplesFile(TODAY);
    const all = Object.values(f.tables).flat();
    expect(all.every((r) => /^(ex-|bag-ex-)/.test(r.id ?? r.tripId))).toBe(true);
    expect(f.tables.trips[0].entries.every((e) => ['seat', 'frame', 'body'].includes(e.slot))).toBe(true);
  });

  it('browser tests and shared pages are not asked', () => {
    expect(mayAsk({ webdriver: false }, '#/')).toBe(true);
    expect(mayAsk({ webdriver: true }, '#/')).toBe(false);
    expect(mayAsk({ webdriver: false }, '#/share/abc')).toBe(false);
    expect(mayAsk({ webdriver: false }, '#/spur-link/abc')).toBe(false);
    expect(mayAsk({ webdriver: false }, '#/spur')).toBe(true);
  });
});
