// «Aktivitäten-Zusammenfassung» (Noah 25.11.2026 «a», thread «App doppelt so schnell machen»): the small table of the activities
// (activitiesLite) follows every save, delete and clear of `activities` in the same step, is made again when it is missing, and a slim
// row can never be saved into `activities`. Fictional data only.
import 'fake-indexeddb/auto';
import fs from 'node:fs';
import Dexie from 'dexie';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, DATA_TABLES } from '../src/lib/db.js';
import { HEAVY_KEYS, LITE_KEY, liteOf, isLite, checkLite, buildLite, startLite, liteTable, resetLite } from '../src/lib/actlite.js';
import { KEEP } from '../src/lib/training.js';
import { restoreBackup } from '../src/lib/backup.js';

const act = (id, extra = {}) => ({
  id: String(id), day: '2026-11-0' + (1 + (id % 9)), kind: id % 2 ? 'bike' : 'run', km: 10 + id, movingS: 3600, name: `Ride ${id}`,
  ser: { t: Array.from({ length: 50 }, (_, i) => i), hr: Array.from({ length: 50 }, () => 120) },
  sprof: [1, 2, 3], prof: { a: 1 }, segs: [{ n: 1 }], dprof: { d: [1] }, splits: [{ km: 1 }], hw: { x: 1 }, curve: [1, 2], hist: [1], laps: [{ i: 1 }],
  line: 'abc', note: 'fine', detail: '2026-11-01T10:00:00Z', dv: 6, ...extra,
});

let db;
beforeEach(async () => {
  db = createDb(`lite-${Math.random()}`);
  await db.open();
});

describe('what is heavy', () => {
  it('every key of the lite list is a detail key the app keeps (training.js KEEP)', () => {
    for (const k of HEAVY_KEYS) expect(KEEP, `«${k}» is not a kept detail`).toContain(k);
  });
  it('a lite row has no raw curve, keeps the line and the small fields, and carries the mark', () => {
    const lite = liteOf(act(1));
    for (const k of HEAVY_KEYS) expect(lite).not.toHaveProperty(k);
    expect(lite).toMatchObject({ id: '1', km: 11, line: 'abc', note: 'fine', detail: '2026-11-01T10:00:00Z', dv: 6, _lite: true });
    expect(isLite(lite)).toBe(true);
    expect(isLite(act(1))).toBe(false);
  });
  it('the table is not in a backup and not in the sync', () => {
    expect(DATA_TABLES).not.toContain('activitiesLite');
  });
});

describe('the middleware keeps the summary in step', () => {
  it('put, bulkPut, update and delete of an activity change the lite row in the same step', async () => {
    await db.activities.put(act(1));
    await db.activities.bulkPut([act(2), act(3)]);
    expect(await db.activitiesLite.count()).toBe(3);
    const row = await db.activitiesLite.get('1');
    expect(row.ser).toBeUndefined();
    expect(row.km).toBe(11);
    // the full row keeps everything
    expect((await db.activities.get('1')).ser.t).toHaveLength(50);
    await db.activities.update('1', { note: 'changed', km: 99 });
    expect(await db.activitiesLite.get('1')).toMatchObject({ note: 'changed', km: 99 });
    expect((await db.activities.get('1')).ser.t).toHaveLength(50); // a change of one field keeps the curves
    await db.activities.delete('2');
    expect(await db.activitiesLite.get('2')).toBeUndefined();
    await db.activities.where('kind').equals('run').delete();
    expect((await db.activitiesLite.toArray()).every((r) => r.kind === 'bike')).toBe(true);
    await db.activities.clear();
    expect(await db.activitiesLite.count()).toBe(0);
  });
  it('an explicit transaction over activities writes the summary too, and a failed one writes neither', async () => {
    await db.transaction('rw', db.activities, async () => {
      await db.activities.put(act(1));
      await db.activities.put(act(2));
    });
    expect(await db.activitiesLite.count()).toBe(2);
    await expect(
      db.transaction('rw', db.activities, async () => {
        await db.activities.put(act(3));
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');
    expect(await db.activities.count()).toBe(2);
    expect(await db.activitiesLite.count()).toBe(2);
  });
  it('a restored backup (replace) leaves the summary the same as the activities', async () => {
    await db.activities.bulkPut([act(1), act(2), act(3)]);
    const tables = Object.fromEntries(DATA_TABLES.map((t) => [t, []]));
    tables.activities = [act(2, { km: 55 }), act(7)];
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 21, tables }, 'replace');
    expect((await db.activitiesLite.toArray()).map((r) => r.id).sort()).toEqual(['2', '7']);
    expect((await db.activitiesLite.get('2')).km).toBe(55);
  });
  it('a slim row can never be saved into activities: it throws and nothing changes', async () => {
    await db.activities.put(act(1));
    const slim = await db.activitiesLite.get('1');
    await expect(db.activities.put(slim)).rejects.toThrow(/slim row/);
    await expect(db.activities.bulkPut([act(2), slim])).rejects.toThrow();
    expect((await db.activities.get('1')).ser.t).toHaveLength(50);
  });
});

describe('the update of a device that has activities and no summary yet', () => {
  it('opens the database of the day before, keeps every activity whole, then builds the summary', async () => {
    const name = `lite-up-${Math.random()}`;
    // the database as it was before: version 21 with the activities (a part of the tables is enough, Dexie adds the others)
    const old = new Dexie(name);
    old.version(21).stores({ activities: 'id, day, kind', meta: 'key', settings: 'key', trips: 'id' });
    await old.open();
    await old.table('activities').bulkPut([act(1), act(2), act(3)]);
    old.close();
    const now = createDb(name);
    await now.open();
    expect(await now.activities.count()).toBe(3);
    expect((await now.activities.get('1')).ser.t).toHaveLength(50);
    expect(await now.activitiesLite.count()).toBe(0); // new and empty
    expect(await liteTable(now)).toBe(now.activities); // not ready: the full table answers
    await buildLite(now, { breath: async () => {} });
    expect(await liteTable(now)).toBe(now.activitiesLite);
    expect(await now.activitiesLite.count()).toBe(3);
    // a save after the update keeps both in step
    await now.activities.update('2', { km: 77 });
    expect((await now.activitiesLite.get('2')).km).toBe(77);
    expect((await now.activities.get('2')).ser.t).toHaveLength(50);
  });
});

describe('building and reading', () => {
  it('buildLite makes the summary from activities written before it existed, and checkLite then says ready', async () => {
    await db.activities.bulkPut(Array.from({ length: 60 }, (_, i) => act(i + 1)));
    await db.activitiesLite.clear(); // as after the update: the table is new and empty
    expect(await checkLite(db)).toBe(false);
    expect(await buildLite(db, { chunk: 25, breath: async () => {} })).toBe(true);
    expect(await db.activitiesLite.count()).toBe(60);
    expect((await db.meta.get(LITE_KEY)).n).toBe(60);
    expect(await checkLite(db)).toBe(true);
  });
  it('a different number of rows makes the summary not ready (and it is built again)', async () => {
    await db.activities.bulkPut([act(1), act(2)]);
    await buildLite(db, { breath: async () => {} });
    expect(await checkLite(db)).toBe(true);
    await db.activitiesLite.delete('1'); // something went wrong on the way
    expect(await checkLite(db)).toBe(false);
  });
  it('liteTable gives the full table until the summary is ready, then the summary', async () => {
    await db.activities.bulkPut([act(1), act(2)]);
    await db.activitiesLite.clear();
    resetLite(db);
    expect(await liteTable(db)).toBe(db.activities);
    await buildLite(db, { breath: async () => {} });
    expect(await liteTable(db)).toBe(db.activitiesLite);
    const rows = await (await liteTable(db)).where('kind').equals('bike').toArray();
    expect(rows.map((r) => r.id)).toEqual(['1']);
    expect(rows[0].ser).toBeUndefined();
  });
  it('a database without the summary (a stub in a test) reads activities', async () => {
    const stub = { activities: { name: 'activities' } };
    expect(await liteTable(stub)).toBe(stub.activities);
  });
  it('startLite on a fresh database is ready at once: nothing to build, nothing written', async () => {
    expect(await startLite(db, { delay: 1e9 })).toBe(true);
    expect(await db.meta.get(LITE_KEY)).toBeUndefined(); // no write that could redraw a page
    // from then on a save keeps both in step
    await db.activities.put(act(1));
    expect(await db.activitiesLite.count()).toBe(1);
    expect(await liteTable(db)).toBe(db.activitiesLite);
  });
  it('startLite with activities and no marker is not ready (it builds later), with the marker it is', async () => {
    await db.activities.bulkPut([act(1), act(2)]);
    await db.activitiesLite.clear();
    expect(await startLite(db, { delay: 1e9 })).toBe(false);
    await buildLite(db, { breath: async () => {} });
    resetLite(db);
    expect(await startLite(db, { delay: 1e9 })).toBe(true);
  });
});

describe('the readers of the summary never need a curve', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(`${d}/${f.name}`) : /\.(js|svelte)$/.test(f.name) ? [`${d}/${f.name}`] : []));
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
  const readers = walk('src').filter((f) => !/src\/(lib\/actlite|lib\/db|start)\.js$/.test(f) && /\b(readLite|liteTable)\b/.test(strip(fs.readFileSync(f, 'utf8'))));
  it('finds the readers (the list grows with every list that moves to the summary)', () => {
    expect(readers.length).toBeGreaterThan(8);
  });
  it('none of them names a raw curve itself (a curve read through them would be undefined)', () => {
    const bad = [];
    for (const f of readers) {
      const text = strip(fs.readFileSync(f, 'utf8'));
      for (const k of HEAVY_KEYS) if (new RegExp(`\\.${k}\\b|['"]${k}['"]\\s*:|\\{[^}]*\\b${k}\\b[^}]*\\}\\s*=\\s*\\w`).test(text)) bad.push(`${f}: ${k}`);
    }
    expect(bad, 'a reader of the summary names a raw curve: it reads db.activities (the full table) instead').toEqual([]);
  });
  it('no reader of the summary writes what it read back into activities (a slim row)', () => {
    const bad = readers.filter((f) => /activities\.(put|bulkPut|add|bulkAdd)\(/.test(strip(fs.readFileSync(f, 'utf8'))));
    expect(bad).toEqual([]);
  });
});
