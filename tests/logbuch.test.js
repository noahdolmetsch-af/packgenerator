import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, DATA_TABLES, SCHEMA_VERSION, syncLocal } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';
import { checkBackup } from '../src/lib/backupcheck.js';
import { GROUPS, ARTS, routeOf, groupOf, makeEntry, changeEntry, filterEntries, counts, isOpen, deviceOf } from '../src/lib/logbuch/logbuch.js';
import { addEntry, updateEntry, removeEntry, restoreEntry, addAutoError } from '../src/lib/logbuch/logbuchdb.js';

let n = 0;
let db;
beforeEach(() => {
  db = createDb(`logbuch-${++n}`);
});
const at = (iso) => new Date(iso);

describe('Verbesserungs-Logbuch: kinds, groups and the rule', () => {
  it('has 13 kinds in four groups, each kind in exactly one group', () => {
    expect(GROUPS.map((g) => g.key)).toEqual(['wrong', 'clear', 'build', 'new']);
    expect(ARTS).toHaveLength(13);
    expect(new Set(ARTS).size).toBe(13);
    for (const a of ARTS) expect(groupOf(a)).toBeTruthy();
  });
  it('small things go straight into a small change, the rest gets a picture first, «Gut so» is only a note (Noah 21.11.2026 «3a»)', () => {
    for (const a of ['fehler', 'zahl', 'langsam', 'text', 'erklaerung', 'hinweis']) expect(routeOf(a)).toBe('direct');
    for (const a of ['anordnung', 'layout', 'bedienung', 'wegdamit', 'finde', 'idee']) expect(routeOf(a)).toBe('draft');
    expect(routeOf('gutso')).toBe('note');
  });
});

describe('an entry', () => {
  const base = { art: 'text', urgent: 'now', text: '  Statt «4 Blöcke à 12 min» soll «4 × 12 min» stehen.  ', page: '#/flow/training', block: 'Woche 47', device: 'phone', width: 390, now: at('2026-11-21T18:34:00+01:00') };
  it('keeps what the window collected, trimmed, with the local day', () => {
    const e = makeEntry(base);
    expect(e).toMatchObject({ art: 'text', urgent: 'now', text: 'Statt «4 Blöcke à 12 min» soll «4 × 12 min» stehen.', page: '#/flow/training', block: 'Woche 47', route: 'direct', device: 'phone', width: 390, state: 'open', photo: null, source: 'user', count: 1 });
    expect(e.day).toBe('2026-11-21');
    expect(e.id).toMatch(/^lb-/);
  });
  it('needs a known kind and a text', () => {
    expect(makeEntry({ ...base, art: 'nope' })).toBe(null);
    expect(makeEntry({ ...base, text: '   ' })).toBe(null);
  });
  it('«Gut so» has no urgency and starts as a note; an unknown urgency is «later»', () => {
    expect(makeEntry({ ...base, art: 'gutso' })).toMatchObject({ urgent: null, state: 'noted', route: 'note' });
    expect(makeEntry({ ...base, urgent: 'whenever' }).urgent).toBe('later');
  });
  it('a change keeps id, time and photo; a note that becomes a kind starts open', () => {
    const e = { ...makeEntry({ ...base, art: 'gutso' }), photo: 'data:x' };
    const c = changeEntry(e, { art: 'layout', text: 'Block nach oben' });
    expect(c).toMatchObject({ id: e.id, at: e.at, photo: 'data:x', route: 'draft', state: 'open', text: 'Block nach oben' });
    expect(changeEntry(c, { art: 'gutso' })).toMatchObject({ state: 'noted', urgent: null });
    expect(changeEntry(c, { state: 'done' }).state).toBe('done');
  });
  it('the device comes from the width', () => {
    expect(deviceOf(390)).toBe('phone');
    expect(deviceOf(1440)).toBe('computer');
  });
});

describe('the list', () => {
  it('sorts open before finished, urgent first, then the newest; filters by group; counts', () => {
    const list = [
      { ...makeEntry({ art: 'text', urgent: 'later', text: 'a', now: at('2026-11-20T10:00:00Z') }) },
      { ...makeEntry({ art: 'fehler', urgent: 'now', text: 'b', now: at('2026-11-19T10:00:00Z') }) },
      { ...makeEntry({ art: 'layout', urgent: 'later', text: 'c', now: at('2026-11-21T10:00:00Z') }) },
      { ...makeEntry({ art: 'idee', urgent: 'later', text: 'd', now: at('2026-11-21T11:00:00Z') }), state: 'done' },
      { ...makeEntry({ art: 'gutso', text: 'e', now: at('2026-11-21T12:00:00Z') }) },
    ];
    const order = filterEntries(list).map((e) => e.text);
    expect(order.slice(0, 3)).toEqual(['b', 'c', 'a']); // open: urgent first, then newest
    expect(order.slice(3).sort()).toEqual(['d', 'e']); // finished and notes after
    expect(filterEntries(list, 'wrong').map((e) => e.text)).toEqual(['b']);
    expect(counts(list)).toMatchObject({ all: 5, open: 3, now: 1, wrong: 1, clear: 1, build: 1, new: 2 });
    expect(isOpen(list[3])).toBe(false);
  });
});

describe('the table: save, change, delete with Undo, automatic errors', () => {
  it('adds, changes, deletes and brings back an entry', async () => {
    const e = await addEntry({ art: 'hinweis', text: 'Hier fehlt ein Hinweis', page: '#/pack', device: 'computer', width: 1440, now: at('2026-11-21T10:00:00Z') }, db);
    expect(await db.logbuch.count()).toBe(1);
    expect(await addEntry({ art: 'hinweis', text: ' ' }, db)).toBe(null);
    const c = await updateEntry(e.id, { state: 'done' }, db);
    expect(c.state).toBe('done');
    const saved = await removeEntry(e.id, db);
    expect(await db.logbuch.count()).toBe(0);
    await restoreEntry(saved, db);
    expect((await db.logbuch.get(e.id)).state).toBe('done');
    expect(await updateEntry('nope', {}, db)).toBe(null);
  });
  it('the same automatic error counts up, a different one is a new entry, the oldest go beyond the limit', async () => {
    const a = await addAutoError({ message: 'TypeError: x is undefined', page: '#/pack', now: at('2026-11-21T10:00:00Z') }, db);
    const b = await addAutoError({ message: 'TypeError: x is undefined', page: '#/pack', now: at('2026-11-21T11:00:00Z') }, db);
    expect(b.id).toBe(a.id);
    expect(b.count).toBe(2);
    expect(await db.logbuch.count()).toBe(1);
    expect(a).toMatchObject({ art: 'fehler', source: 'auto' });
    await addAutoError({ message: 'other', page: '#/pack', now: at('2026-11-21T12:00:00Z') }, db);
    expect(await db.logbuch.count()).toBe(2);
    for (let i = 0; i < 5; i++) await addAutoError({ message: `e${i}`, page: '', now: at(`2026-11-22T0${i}:00:00Z`), max: 3 }, db);
    expect(await db.logbuch.count()).toBe(3);
    expect(await addAutoError({ message: '   ' }, db)).toBe(null);
  });
});

describe('the backup (Noah: a change of the storage is first checked with a copy of a backup)', () => {
  it('logbuch is a data table of version 20 and stays on this device in the sync', () => {
    expect(SCHEMA_VERSION).toBe(20);
    expect(DATA_TABLES).toContain('logbuch');
    expect(syncLocal('logbuch', 'lb-1')).toBe(true);
    expect(syncLocal('items', 'EL01')).toBe(false);
  });
  it('export → import gives back the entries, with their photo', async () => {
    const e = await addEntry({ art: 'layout', text: 'Block nach oben', page: '#/week', photo: 'data:image/jpeg;base64,AAAA', now: at('2026-11-21T10:00:00Z') }, db);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.logbuch).toHaveLength(1);
    expect(validateBackup(file)).toEqual([]);
    expect(checkBackup(file).ok).toBe(true);
    const other = createDb(`logbuch-${++n}`);
    await restoreBackup(other, file, 'replace');
    expect(await other.logbuch.get(e.id)).toMatchObject({ art: 'layout', photo: 'data:image/jpeg;base64,AAAA' });
  });
  it('an old backup without the table still imports and leaves the log empty', async () => {
    const old = { app: 'pack-generator', schemaVersion: 19, tables: { items: [{ id: 'EL01', name: 'Lamp', category: 'elec', weightG: 10, qty: 1, ownership: 'owned', domains: ['bikepacking'] }] } };
    expect(validateBackup(old)).toEqual([]);
    await restoreBackup(db, old, 'replace');
    expect(await db.items.count()).toBe(1);
    expect(await db.logbuch.count()).toBe(0);
  });
  it('a replace import with the table in the file brings the log back, the sync never touches it', async () => {
    await addEntry({ art: 'fehler', text: 'Absturz', now: at('2026-11-21T10:00:00Z') }, db);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    await db.logbuch.clear();
    await restoreBackup(db, file, 'merge');
    expect(await db.logbuch.count()).toBe(1);
    const meta = await db.meta.toArray();
    expect(meta.filter((m) => String(m.key).includes('logbuch'))).toEqual([]); // no sync mark was written for the log
  });
});
