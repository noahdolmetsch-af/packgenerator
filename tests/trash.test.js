// «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): the trash of everything (src/lib/trash/). Real Dexie on a fake IndexedDB, fictional data.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, DATA_TABLES, SCHEMA_VERSION, syncLocal } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';
import { checkBackup } from '../src/lib/backupcheck.js';
import { deleteBike, undoDeleteBike } from '../src/lib/bikedelete.js';
import { trashed, restoreEntry, dropEntry, forgetFor, purge, MAX_ROWS, trashItem, forgetItem, lastDeleted } from '../src/lib/trash/trash.js';
import { addTodo, loadTodos, removeTodo, MERKEN_KEY } from '../src/lib/merkendb.js';
import { mainTable, alongOf, alongLine, kindOfTable, daysLeft, isOld, TRASH_DAYS } from '../src/lib/trash/kinds.js';
import { trashNote } from '../src/lib/notes/trash.js';

let n = 0;
let db;
beforeEach(async () => {
  db = createDb(`trash-${++n}`);
  await db.bikes.bulkPut([{ id: 'b1', name: 'test_data_gtp_ Scale' }, { id: 'b2', name: 'test_data_gtp_ Spark' }]);
  await db.trips.bulkPut([{ id: 't1', title: 'Jura', bikeId: 'b1', bike: 'Scale' }, { id: 't2', title: 'Napf', bikeId: 'b2' }]);
  await db.kmBook.bulkPut([{ id: 'k1', bikeId: 'b1', km: 10 }, { id: 'k2', bikeId: 'b1', km: 20 }]);
  await db.visits.bulkPut([{ id: 'v1', bikeId: 'b1' }]);
  await db.maintenance.bulkPut([{ id: 'm1', bikeId: 'b1' }, { id: 'm2', bikeId: 'b1' }, { id: 'm3', bikeId: 'b1' }]);
});

describe('the table', () => {
  it('is schema 21, a data table (backup) and stays on this device in the sync', () => {
    expect(SCHEMA_VERSION).toBe(22);
    expect(DATA_TABLES).toContain('trash');
    expect(syncLocal('trash', 'x')).toBe(true);
    expect(syncLocal('items', 'x')).toBe(false);
  });
});

describe('trashed: a delete of the user keeps the rows that went', () => {
  it('a bike goes with its km, visits and care entries; the entry says what comes back', async () => {
    const { value, id } = await trashed('Scale', () => deleteBike(db, 'b1', 'b2'), { db });
    expect(value.bike.id).toBe('b1');
    const e = await db.trash.get(id);
    expect(e).toMatchObject({ kind: 'bike', name: 'Scale', main: 'bikes' });
    expect(e.counts).toEqual({ kmBook: 2, visits: 1, maintenance: 3, bikes: 1 });
    expect(alongOf(e.counts, e.main)).toEqual({ kmBook: 2, visits: 1, maintenance: 3 });
    expect(alongLine(alongOf(e.counts, e.main), (k, one, many) => `${k} ${k === 1 ? one : many}`)).toContain('3 {n} care entries|trash');
    expect(await db.bikes.get('b1')).toBeUndefined();
  });

  it('«Back» puts the bike and what belonged to it back and the entry goes', async () => {
    const { id } = await trashed('Scale', () => deleteBike(db, 'b1', null), { db });
    const r = await restoreEntry(db, id);
    expect(r).toMatchObject({ back: 7, skipped: 0 });
    expect((await db.bikes.get('b1')).name).toBe('test_data_gtp_ Scale');
    expect((await db.kmBook.toArray()).filter((x) => x.bikeId === 'b1').length).toBe(2);
    expect((await db.maintenance.toArray()).filter((x) => x.bikeId === 'b1').length).toBe(3);
    expect(await db.trash.get(id)).toBeUndefined();
    expect(await restoreEntry(db, id)).toBeNull();
  });

  it('a row that exists again is not written over', async () => {
    const { id } = await trashed('Scale', () => deleteBike(db, 'b1', null), { db });
    await db.bikes.put({ id: 'b1', name: 'new bike with the same id' });
    const r = await restoreEntry(db, id);
    expect(r.skipped).toBe(1);
    expect((await db.bikes.get('b1')).name).toBe('new bike with the same id');
    expect(await db.kmBook.count()).toBe(2);
  });

  it('outside a window nothing is noted (a sync, an import)', async () => {
    await db.trips.delete('t2');
    expect(await db.trash.count()).toBe(0);
  });

  it('a delete that deletes nothing leaves no entry; a failing delete leaves none either', async () => {
    expect((await trashed('x', async () => 1, { db })).id).toBeNull();
    await expect(trashed('x', async () => { await db.trips.delete('t1'); throw new Error('no'); }, { db })).rejects.toThrow('no');
    expect(await db.trash.count()).toBe(0);
  });

  it('keep: false (a delete «for good») leaves no entry', async () => {
    const r = await trashed('x', () => db.trips.delete('t1'), { db, keep: false });
    expect(r.id).toBeNull();
    expect(await db.trash.count()).toBe(0);
  });

  it('too many rows are not kept (the 8 seconds of Undo do it)', async () => {
    await db.kmBook.bulkPut(Array.from({ length: MAX_ROWS + 1 }, (_, i) => ({ id: `big${i}`, bikeId: 'bx' })));
    const r = await trashed('all', () => db.kmBook.where('bikeId').equals('bx').delete(), { db });
    expect(r.id).toBeNull();
  });

  it('the notes keep their own trash: a trashed note makes no entry here', async () => {
    await db.notes.put({ id: 'n1', text: 'Sattel knarzt', status: 'open' });
    const r = await trashed('note', () => trashNote(db, { id: 'n1', text: 'Sattel knarzt', status: 'open' }), { db });
    expect(r.id).toBeNull();
    expect(await db.docs.where('kind').equals('notetrash').count()).toBe(1);
  });

  it('a page with its own Undo takes the entry back with forgetFor', async () => {
    const { value, id } = await trashed('Scale', () => deleteBike(db, 'b1', null), { db });
    await undoDeleteBike(db, value);
    await forgetFor(value, db);
    expect(await db.trash.get(id)).toBeUndefined();
    await dropEntry(db, null); // no id: nothing happens
  });

  it('purge deletes entries for good', async () => {
    const { id } = await trashed('Scale', () => deleteBike(db, 'b1', null), { db });
    await purge(db, [id]);
    expect(await db.trash.count()).toBe(0);
  });
});

describe('the words', () => {
  it('names an entry by the most important table and sorts the kind', () => {
    expect(mainTable([{ t: 'kmBook' }, { t: 'trips' }, { t: 'bikes' }])).toBe('bikes');
    expect(mainTable([{ t: 'zzz' }])).toBe('zzz');
    expect(kindOfTable('bikes')).toBe('bike');
    expect(kindOfTable('containers')).toBe('gear');
    expect(kindOfTable('zzz')).toBe('other');
  });
  it('30 days: days left and when it is old', () => {
    const now = Date.parse('2026-11-30T12:00:00Z');
    expect(TRASH_DAYS).toBe(30);
    expect(daysLeft('2026-11-23T12:00:00Z', now)).toBe(23);
    expect(isOld('2026-11-23T12:00:00Z', now)).toBe(false);
    expect(isOld('2026-10-30T12:00:00Z', now)).toBe(true);
    expect(daysLeft('2026-09-01T12:00:00Z', now)).toBe(0);
  });
});

describe('the backup carries the trash (a change of the storage is checked with a backup)', () => {
  it('export → import gives the entry back and the check accepts the file', async () => {
    const { id } = await trashed('Scale', () => deleteBike(db, 'b1', null), { db });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.trash).toHaveLength(1);
    expect(validateBackup(file)).toEqual([]);
    expect(checkBackup(file).ok).toBe(true);
    const other = createDb(`trash-other-${n}`);
    await restoreBackup(other, file, 'replace');
    expect((await other.trash.get(id)).rows).toHaveLength(7);
    await restoreEntry(other, id);
    expect((await other.bikes.get('b1')).name).toBe('test_data_gtp_ Scale');
  });
  it('an older backup without the table still imports', async () => {
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    delete file.tables.trash;
    file.schemaVersion = 20;
    const other = createDb(`trash-old-${n}`);
    await restoreBackup(other, file, 'replace');
    expect(await other.trash.count()).toBe(0);
    expect(await other.bikes.count()).toBe(2);
  });
});

describe('items of a list in a settings record (to-dos, entries of My day)', () => {
  it('a deleted to-do waits as a to-do and comes back at the end of the list', async () => {
    const a = await addTodo(db, { text: 'Kettenöl kaufen' });
    await addTodo(db, { text: 'Reifen prüfen' });
    await removeTodo(db, a.todo.id);
    expect((await loadTodos(db)).map((x) => x.text)).toEqual(['Reifen prüfen']);
    const [e] = await db.trash.toArray();
    expect(e).toMatchObject({ kind: 'todo', name: 'Kettenöl kaufen' });
    expect(lastDeleted.get()).toMatchObject({ id: e.id });
    const res = await restoreEntry(db, e.id);
    expect(res).toMatchObject({ back: 1, skipped: 0 });
    expect((await loadTodos(db)).map((x) => x.text)).toEqual(['Reifen prüfen', 'Kettenöl kaufen']);
    expect(await db.trash.count()).toBe(0);
  });
  it('Undo at once takes the entry away again; a reminder that is only taken away is no entry', async () => {
    const a = await addTodo(db, { text: 'Licht laden' });
    const undo = await removeTodo(db, a.todo.id);
    await undo();
    expect(await db.trash.count()).toBe(0);
    expect(lastDeleted.get()).toBeNull();
    expect((await loadTodos(db)).map((x) => x.text)).toEqual(['Licht laden']);
    await removeTodo(db, a.todo.id, { trash: false });
    expect(await db.trash.count()).toBe(0);
  });
  it('an entry of My day comes back into week.items; an item that exists again stays as it is', async () => {
    const row = { id: 'w1', kind: 'todo', title: 'Zahnarzt', day: '2026-11-25' };
    await db.settings.put({ key: 'week.items', value: [{ id: 'w2', kind: 'todo', title: 'Einkaufen', day: '2026-11-25' }] });
    const id = await trashItem(db, 'Zahnarzt', { store: 'week.items', row, kind: 'plan' });
    expect((await db.trash.get(id)).kind).toBe('plan');
    expect((await restoreEntry(db, id)).back).toBe(1);
    expect((await db.settings.get('week.items')).value.map((x) => x.id)).toEqual(['w2', 'w1']);
    const id2 = await trashItem(db, 'Zahnarzt', { store: 'week.items', row, kind: 'plan' });
    const res = await restoreEntry(db, id2);
    expect(res).toMatchObject({ back: 0, skipped: 1 });
    expect((await db.settings.get('week.items')).value).toHaveLength(2);
    await forgetItem(db, await trashItem(db, 'x', { store: 'week.items', row, kind: 'plan' }));
    expect(await db.trash.count()).toBe(0);
  });
  it('a list item never lands in a table of its own (the key MERKEN_KEY is a settings key)', () => {
    expect(MERKEN_KEY).toBe('merken');
    expect(kindOfTable('@list')).toBe('other');
  });
  it('a training session comes back under its name in training.plan, a stay away with the entries it made', async () => {
    await db.settings.put({ key: 'training.plan', value: { sessions: [{ id: 's2', day: '2026-11-26' }] } });
    const s1 = { id: 's1', day: '2026-11-25', kind: 'run' };
    const id = await trashItem(db, 'Lauf', { store: 'training.plan', path: 'sessions', row: s1, kind: 'week' });
    expect((await db.trash.get(id)).kind).toBe('week');
    expect((await restoreEntry(db, id)).back).toBe(1);
    expect((await db.settings.get('training.plan')).value.sessions.map((x) => x.id)).toEqual(['s2', 's1']);
    const away = { id: 'a1', from: '2026-12-24', to: '2026-12-28', type: 'bike' };
    const made = [{ id: 'i1', ref: 'pack:a1', title: 'Velo packen' }, { id: 'i2', ref: 'pack:a1', title: 'Service' }];
    const id2 = await trashItem(db, 'Ferien', { kind: 'week', parts: [{ store: 'week.away', row: away }, ...made.map((row) => ({ store: 'week.items', row }))] });
    const e = await db.trash.get(id2);
    expect(e.rows).toHaveLength(3);
    expect((await restoreEntry(db, id2)).back).toBe(3);
    expect((await db.settings.get('week.away')).value.map((x) => x.id)).toEqual(['a1']);
    expect((await db.settings.get('week.items')).value.map((x) => x.id)).toEqual(['i1', 'i2']);
    // a record that was never there is made, the plan key keeps its shape
    await db.settings.delete('training.plan');
    const id3 = await trashItem(db, 'Lauf', { store: 'training.plan', path: 'sessions', row: s1, kind: 'week' });
    await restoreEntry(db, id3);
    expect((await db.settings.get('training.plan')).value).toEqual({ sessions: [s1] });
  });
});
