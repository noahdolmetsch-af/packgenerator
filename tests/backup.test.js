import 'fake-indexeddb/auto'; // an in-memory IndexedDB, so tests run without a browser
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, DATA_TABLES } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup, countRows } from '../src/lib/backup.js';

let n = 0;
let db;
beforeEach(() => {
  db = createDb(`test-${++n}`);
});

const item = (id, extra = {}) => ({ id, name: id, category: 'elec', weightG: 10, qty: 1, ownership: 'owned', domains: ['bikepacking'], ...extra });

describe('backup', () => {
  it('export → import gives back exactly the same data', async () => {
    await db.items.bulkPut([item('EL01'), item('EL02', { weightG: null })]);
    await db.learnings.put({ id: 1, topic: 'Clothing', rule: 'Fewer layers' });
    await db.settings.put({ key: 'riderWeightG', value: 64000 });
    const file = JSON.parse(JSON.stringify(await buildBackup(db))); // like writing and reading a file

    const other = createDb(`test-${++n}`);
    await restoreBackup(other, file, 'replace');
    expect(await buildBackup(other)).toMatchObject({ tables: file.tables });
  });

  it('replace deletes records that are not in the file', async () => {
    await db.items.bulkPut([item('EL01'), item('OLD1')]);
    const file = { app: 'pack-generator', schemaVersion: 1, tables: { items: [item('EL01')] } };
    await restoreBackup(db, file, 'replace');
    expect((await db.items.toArray()).map((i) => i.id)).toEqual(['EL01']);
  });

  it('merge keeps other records and overwrites the same ID', async () => {
    await db.items.bulkPut([item('EL01', { weightG: 10 }), item('KEEP')]);
    const file = { app: 'pack-generator', schemaVersion: 1, tables: { items: [item('EL01', { weightG: 99 })] } };
    await restoreBackup(db, file, 'merge');
    expect(await db.items.get('EL01')).toMatchObject({ weightG: 99 });
    expect(await db.items.get('KEEP')).toBeTruthy();
  });

  it('a broken file changes nothing', async () => {
    await db.items.put(item('EL01'));
    const bad = { app: 'pack-generator', schemaVersion: 1, tables: { items: [{ name: 'no id' }] } };
    await expect(restoreBackup(db, bad, 'replace')).rejects.toThrow();
    expect(await db.items.count()).toBe(1); // the transaction rolled back the clear()
  });

  it('rejects files that are not ours or too new', () => {
    expect(validateBackup({ app: 'bike-cockpit-backup' })).not.toEqual([]);
    expect(validateBackup({ app: 'pack-generator', schemaVersion: 99, tables: {} })).not.toEqual([]);
    expect(validateBackup({ app: 'pack-generator', schemaVersion: 1, tables: { nope: [] } })).not.toEqual([]);
    expect(validateBackup({ app: 'pack-generator', schemaVersion: 1, tables: { items: [] } })).toEqual([]);
  });

  it('never exports app-internal data', async () => {
    await db.meta.put({ key: 'backupFolder', handle: 'x' });
    const file = await buildBackup(db);
    expect(Object.keys(file.tables)).toEqual(DATA_TABLES);
    expect(countRows(file).items).toBe(0);
  });
});

describe('backup reminder (answer 10a)', () => {
  it('is due when there was never a backup or the last one is 14 days old', async () => {
    const { backupDue } = await import('../src/lib/backup.js');
    const now = new Date('2026-10-20T12:00:00Z');
    expect(backupDue(null, now)).toEqual({ due: true, days: null });
    expect(backupDue('2026-10-10T12:00:00Z', now)).toEqual({ due: false, days: 10 });
    expect(backupDue('2026-10-06T12:00:00Z', now)).toEqual({ due: true, days: 14 });
  });
});
