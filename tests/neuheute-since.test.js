// «Neu heute» (Tempo, Noah 25.11.2026): the cheap question «anything ridden since yesterday?» gives the same answer as the whole history.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildLite, startLite } from '../src/lib/actlite.js';
import { readRaw, readSince } from '../src/lib/neuland/store.js';
import { rodeSince } from '../src/lib/neuland/neuheute.js';

const LINE = [
  [47.37, 8.54],
  [47.4, 8.6],
];
async function setup(days) {
  const db = createDb(`since-${Math.random()}`);
  await db.open();
  await db.rides.bulkPut(days.rides.map((date, i) => ({ id: `r${i}`, date, line: LINE })));
  await db.activities.bulkPut(days.acts.map((day, i) => ({ id: `a${i}`, day, kind: 'bike', startLatLng: LINE[0], endLatLng: LINE[1] })));
  await db.trips.bulkPut(days.trips.map((startDate, i) => ({ id: `t${i}`, startDate, status: 'done', route: { line: LINE } })));
  await buildLite(db, { breath: async () => {} });
  await startLite(db, { delay: 1e9 });
  return db;
}
const today = '2026-11-25';
const since = '2026-11-24';

describe('readSince', () => {
  it('reads only the rows from the day on, from all four sources', async () => {
    const db = await setup({ rides: ['2026-01-01', '2026-11-24'], acts: ['2026-02-02', '2026-11-25'], trips: ['2026-03-03'] });
    await db.tracks.put({ id: 'x1', kind: 'rec', day: '2026-11-25', parts: [LINE] });
    await db.tracks.put({ id: 'x2', kind: 'rec', day: '2026-05-05', parts: [LINE] });
    const r = await readSince(db, since);
    expect(r.rides.map((x) => x.date)).toEqual(['2026-11-24']);
    expect(r.activities.map((x) => x.day)).toEqual(['2026-11-25']);
    expect(r.trips).toEqual([]);
    expect(r.recordings.map((x) => x.id)).toEqual(['x1']);
  });
  it('answers «ridden since yesterday?» like the whole history does', async () => {
    for (const days of [
      { rides: ['2026-01-01'], acts: ['2026-02-02'], trips: ['2026-03-03'] }, // nothing recent
      { rides: ['2026-01-01'], acts: ['2026-11-24'], trips: [] }, // an activity yesterday
      { rides: ['2026-11-25'], acts: [], trips: [] }, // a ride today
      { rides: [], acts: [], trips: ['2026-11-24'] }, // a trip yesterday
      { rides: [], acts: ['2026-11-26'], trips: [] }, // a day after today does not count
    ]) {
      const db = await setup(days);
      expect(rodeSince(await readSince(db, since), since, today)).toBe(rodeSince(await readRaw(db), since, today));
    }
  });
});
