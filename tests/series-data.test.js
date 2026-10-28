import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { readSeries, seriesTables } from '../src/lib/home/series-data.js';
import { REST_KEY } from '../src/lib/home/series.js';

// UI-Test 26.10.2026 T4: one series for the year row, the tile, the milestones page and the milestone check.
// Fictional data; a Monday, so this week has nothing yet and the series counts the weeks before.
const TODAY = '2026-10-26';
let n = 0;
const fresh = () => createDb(`series-data-${++n}`);

describe('readSeries: one series over everything', () => {
  it('counts the Im Flow log, the ride book and Strava bike rides alike', async () => {
    const db = fresh();
    await db.flowLog.add({ id: 'l1', day: '2026-10-21', actId: 'yoga' });
    await db.rides.add({ id: 'r1', date: '2026-10-14', km: 30 });
    await db.activities.add({ id: 501, kind: 'bike', day: '2026-10-07', km: 42, type: 'Ride' });
    const { s } = await readSeries(db, TODAY);
    expect(s.n).toBe(3);
  });

  it('leaves out test trips and archived trips, as Today does', async () => {
    const db = fresh();
    await db.trips.bulkAdd([
      { id: 't1', title: 'Test', startDate: '2026-10-20', days: 1, testTrip: true, finished: true },
      { id: 't2', title: 'Old', startDate: '2026-10-13', days: 1, archivedAt: '2026-10-15', finished: true },
    ]);
    const { s, trips } = await readSeries(db, TODAY);
    expect(s.n).toBe(0);
    expect(trips).toEqual([]);
  });

  it('keeps the series over a rest week', async () => {
    const db = fresh();
    await db.flowLog.bulkAdd([{ id: 'a', day: '2026-10-22', actId: 'gym' }, { id: 'b', day: '2026-10-08', actId: 'gym' }]);
    await db.settings.put({ key: REST_KEY, value: ['2026-10-12'] });
    expect((await readSeries(db, TODAY)).s.n).toBe(2);
  });

  it('names every table it reads, for the transaction on Today', () => {
    const db = fresh();
    expect(seriesTables(db).map((x) => x.name).sort()).toEqual(['activities', 'debriefs', 'flowLog', 'kmBook', 'rides', 'settings', 'trips']);
  });
});
