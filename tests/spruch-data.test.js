import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { readSpruchExtra } from '../src/lib/home/spruch-data.js';
import { QUOTES_KEY } from '../src/lib/flowquotes.js';
import { OWN_KEY, SPRUCH_KEY } from '../src/lib/home/spruch.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';

// «Spruch zum Einstieg» PR 2 and 4 (Noah 07.11.2026 «bau spruch pr2», «bau spruch pr3 und 4»): the numbers beyond the watch days, and
// your own sayings, read in one place.
// Fictional data. A Wednesday, so the week so far has Monday to Wednesday.
const TODAY = '2026-11-04';
let n = 0;
const fresh = () => createDb(`spruch-data-${++n}`);

describe('readSpruchExtra', () => {
  it('an empty database: no series sentences from it, no km, no year ago, the standard quotes', async () => {
    const x = await readSpruchExtra(fresh(), TODAY);
    expect(x.series.n).toBe(0);
    expect(x.km).toEqual({ now: 0, week: 0 });
    expect(x.ago).toBeNull();
    expect(x.quotes.length).toBeGreaterThan(3); // the standard quotes are on by default
    for (const q of x.quotes) expect(typeof q.text).toBe('string');
  });

  it('the weeks in a row come from the one series; the bike km of the year from the ride book, a week ago too', async () => {
    const db = fresh();
    await db.flowLog.bulkAdd([{ id: 'a', day: '2026-10-28', actId: 'yoga' }, { id: 'b', day: '2026-10-21', actId: 'yoga' }]);
    await db.rides.bulkAdd([
      { id: 'r1', date: '2026-03-01', km: 400 },
      { id: 'r2', date: '2026-10-20', km: 80 },
      { id: 'r3', date: '2026-11-02', km: 60 },
    ]);
    const x = await readSpruchExtra(db, TODAY);
    expect(x.series.n).toBeGreaterThanOrEqual(2);
    expect(x.km).toEqual({ now: 540, week: 480 }); // the ride of 2 Nov is newer than a week
  });

  it('the first days of the year: «a week ago» is not last year’s total', async () => {
    const db = fresh();
    await db.rides.bulkAdd([{ id: 'r1', date: '2025-12-20', km: 900 }, { id: 'r2', date: '2026-01-02', km: 30 }]);
    expect((await readSpruchExtra(db, '2026-01-04')).km).toEqual({ now: 30, week: 0 });
  });

  it('a year ago: the trip around this day, by its title; none without one', async () => {
    const db = fresh();
    await db.trips.add({ id: 't1', title: 'Alpenpässe', startDate: '2025-11-02', days: 3, finished: true });
    expect((await readSpruchExtra(db, TODAY)).ago).toEqual({ title: 'Alpenpässe' });
    expect((await readSpruchExtra(fresh(), TODAY)).ago).toBeNull();
  });

  it('own quotes of «Kissenzeit» come along, one taken away does not', async () => {
    const db = fresh();
    await db.settings.put({ key: QUOTES_KEY, value: { off: ['laozi-64'], add: [], own: [{ id: 'own1', text: 'Heute zählt der erste Schritt.', source: '' }] } });
    const ids = (await readSpruchExtra(db, TODAY)).quotes.map((q) => q.id);
    expect(ids).toContain('own1');
    expect(ids).not.toContain('laozi-64');
  });
});

describe('your own sayings (PR 4)', () => {
  it('an empty database: none; written ones come back made safe', async () => {
    const db = fresh();
    expect((await readSpruchExtra(db, TODAY)).own).toEqual([]);
    await db.settings.put({ key: OWN_KEY, value: { items: [{ id: 'a', text: ' Mein   Satz ', ton: 'lustig' }, { id: 'b', text: '' }] } });
    expect((await readSpruchExtra(db, TODAY)).own).toEqual([{ id: 'a', text: 'Mein Satz', ton: 'lustig' }]);
  });

  it('they travel in the backup with the tone and the switches (no schema change), and come back on a restore', async () => {
    const db = fresh();
    await db.settings.put({ key: OWN_KEY, value: { items: [{ id: 'a', text: 'Fiktiver Spruch', ton: 'vision' }] } });
    await db.settings.put({ key: SPRUCH_KEY, value: { recent: [], off: ['o.a'], ton: 'ruhig', offSrc: ['steps'] } });
    const backup = await buildBackup(db);
    expect(validateBackup(backup)).toBeTruthy();
    const keys = backup.tables.settings.map((r) => r.key);
    expect(keys).toContain(OWN_KEY);
    expect(keys).toContain(SPRUCH_KEY);
    const other = fresh();
    await restoreBackup(other, JSON.parse(JSON.stringify(backup)), 'replace');
    expect((await readSpruchExtra(other, TODAY)).own).toEqual([{ id: 'a', text: 'Fiktiver Spruch', ton: 'vision' }]);
    expect((await other.settings.get(SPRUCH_KEY)).value).toMatchObject({ ton: 'ruhig', offSrc: ['steps'], off: ['o.a'] });
  });
});
