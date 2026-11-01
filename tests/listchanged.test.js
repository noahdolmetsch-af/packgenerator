import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { saveList, resetToStandard } from '../src/lib/lists.js';
import { OVERRIDES_KEY, overrideOf, changedAt } from '../src/lib/standard.js';

const mk = () => {
  const db = new Dexie('listchanged-' + Math.random());
  db.version(1).stores({ settings: 'key' });
  return db;
};

describe('Last change of a list', () => {
  it('notes the time on every save of a changed list and keeps the rest of the record', async () => {
    const db = mk();
    const now = new Date('2026-10-19T10:00:00Z');
    const next = await saveList(db, 'noteTopics', { names: { a: 'Mein Thema' }, hidden: [], order: [], own: [] }, now);
    expect(changedAt(next.noteTopics)).toBe('2026-10-19T10:00:00.000Z');
    expect((await db.settings.get(OVERRIDES_KEY)).value.noteTopics.names).toEqual({ a: 'Mein Thema' });
    const later = await saveList(db, 'noteTopics', next.noteTopics, new Date('2026-10-20T08:00:00Z'));
    expect(changedAt(later.noteTopics)).toBe('2026-10-20T08:00:00.000Z');
  });
  it('a list that is the Standard again has no date, an old override without date stays valid', async () => {
    const db = mk();
    await saveList(db, 'noteTopics', { names: { a: 'X' } }, new Date('2026-10-19T10:00:00Z'));
    const after = await resetToStandard(db, 'noteTopics');
    expect(after.noteTopics).toBeUndefined();
    expect(changedAt({ names: { a: 'X' } })).toBeNull();
    expect(overrideOf({ names: { a: 'X' }, at: 'kaputt' }).at).toBeUndefined();
  });
});

// Backup copy test (Noah: a change near the data storage is first checked with a copy of a backup): a backup of a list
// changed before this version (no date) still imports and works; one with a date keeps it through export and import.
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';

describe('backup copy with and without the date of a list', () => {
  it('an old backup without date imports; a new one keeps the date through export and import', async () => {
    const old = createDb('lc-old');
    await old.settings.put({ key: OVERRIDES_KEY, value: { noteTopics: { names: { a: 'Mein Thema' }, hidden: [], order: [], own: [] } } });
    const oldFile = JSON.parse(JSON.stringify(await buildBackup(old)));
    expect(validateBackup(oldFile).ok ?? true).toBeTruthy();
    const a = createDb('lc-a');
    await restoreBackup(a, oldFile, 'replace');
    const got = (await a.settings.get(OVERRIDES_KEY)).value.noteTopics;
    expect(changedAt(got)).toBeNull();
    expect(overrideOf(got).names).toEqual({ a: 'Mein Thema' });

    await saveList(a, 'noteTopics', got, new Date('2026-10-19T10:00:00Z'));
    const newFile = JSON.parse(JSON.stringify(await buildBackup(a)));
    const b = createDb('lc-b');
    await restoreBackup(b, newFile, 'replace');
    expect(changedAt((await b.settings.get(OVERRIDES_KEY)).value.noteTopics)).toBe('2026-10-19T10:00:00.000Z');
  });
});
