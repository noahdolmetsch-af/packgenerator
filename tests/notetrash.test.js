// Paket NE 1150/1151 (Noah 20.10.2026 «9a 10a»): reminder on a note, trash for 30 days, versions.
// A small fake database (the shape of Dexie the functions use); fictional data only.
import { describe, it, expect } from 'vitest';
import { daysLeft, isExpired, versionOf, withVersion, needsVersion, pruneVersions, versionLine, trashNote, restoreNote, purgeTrash, dropForGood, keepVersion, versionsOf, trashList, VERSION_KEEP, VERSION_GAP_MS, TRASH } from '../src/lib/notes/trash.js';
import { noteRemind, buildList, KINDS } from '../src/lib/push/schedule.js';

function table(rows = []) {
  const m = new Map(rows.map((r) => [r.id, structuredClone(r)]));
  return {
    m,
    get: async (id) => structuredClone(m.get(id)),
    put: async (r) => void m.set(r.id, structuredClone(r)),
    delete: async (id) => void m.delete(id),
    bulkDelete: async (ids) => ids.forEach((id) => m.delete(id)),
    bulkGet: async (ids) => ids.map((id) => structuredClone(m.get(id))),
    bulkPut: async (rs) => rs.forEach((r) => m.set(r.id, structuredClone(r))),
    toArray: async () => [...m.values()].map((r) => structuredClone(r)),
    where: (k) => ({ equals: (v) => ({ toArray: async () => [...m.values()].filter((r) => r[k] === v).map((r) => structuredClone(r)) }) }),
  };
}
const fakeDb = (notes = [], docs = []) => ({ notes: table(notes), docs: table(docs), transaction: async (_m, _a, _b, fn) => fn() });
const day = (s) => new Date(`${s}T12:00:00`);

describe('trash', () => {
  it('a deleted note waits 30 days with its files, comes back as it was, then goes by itself', async () => {
    const note = { id: 'n1', title: 'test_data_gtp_ Jura', text: 'Zelt' };
    const file = { id: 'f1', kind: 'notefile', noteId: 'n1', name: 'plan.pdf' };
    const db = fakeDb([note], [file]);
    const row = await trashNote(db, note, day('2026-10-01'));
    expect(db.notes.m.has('n1')).toBe(false);
    expect(row).toMatchObject({ id: 'trash:n1', kind: TRASH, noteId: 'n1', name: 'test_data_gtp_ Jura' });
    expect(db.docs.m.has('f1')).toBe(true); // the file stays, hidden
    expect((await trashList(db)).map((r) => r.id)).toEqual(['trash:n1']);
    expect(daysLeft(row.trashedAt, day('2026-10-01'))).toBe(30);
    expect(daysLeft(row.trashedAt, day('2026-10-30'))).toBe(1);
    expect(isExpired(row, day('2026-10-30'))).toBe(false);
    expect(isExpired(row, day('2026-10-31'))).toBe(true);

    expect(await restoreNote(db, 'trash:n1')).toEqual(note);
    expect(db.notes.m.get('n1')).toEqual(note);
    expect(db.docs.m.has('trash:n1')).toBe(false);

    await trashNote(db, note, day('2026-10-01'));
    expect(await purgeTrash(db, day('2026-10-20'))).toBe(0);
    expect(await purgeTrash(db, day('2026-11-01'))).toBe(1);
    expect([...db.docs.m.keys()]).toEqual([]); // the trash row and the file
  });
  it('for good: the note came back meanwhile keeps its files', async () => {
    const db = fakeDb([{ id: 'n2', text: 'x' }], [{ id: 'trash:n2', kind: TRASH, noteId: 'n2', note: { id: 'n2' }, trashedAt: '2026-10-01T10:00:00Z' }, { id: 'f2', kind: 'notefile', noteId: 'n2' }]);
    const gone = await dropForGood(db, [db.docs.m.get('trash:n2')]);
    expect(gone.map((d) => d.id)).toEqual(['trash:n2']);
    expect(db.docs.m.has('f2')).toBe(true);
  });
});

describe('versions', () => {
  const a = { id: 'n1', title: 'Liste', text: 'Zelt\nKocher', checklist: [{ text: 'Gas', done: false }], photos: ['data:x'], pinned: true };
  it('keeps the text parts only; putting back leaves photos and the pin', () => {
    expect(versionOf(a)).toEqual({ title: 'Liste', text: 'Zelt\nKocher', checklist: [{ text: 'Gas', done: false }] });
    const now = { ...a, text: 'Zelt', checklist: [], photos: ['data:y'] };
    expect(withVersion(now, versionOf(a))).toEqual({ ...a, photos: ['data:y'] });
    expect(versionLine(versionOf(a), now)).toEqual({ first: 'Zelt', diff: 1 });
  });
  it('a new version only when the text changed, not for an empty note, and not twice in 10 minutes', () => {
    const t0 = new Date('2026-10-20T10:00:00Z');
    expect(needsVersion(a, { ...a, photos: [] }, null, t0)).toBe(false);
    expect(needsVersion(a, { ...a, text: 'Zelt' }, null, t0)).toBe(true);
    expect(needsVersion({ id: 'n', text: ' ' }, { id: 'n', text: 'neu' }, null, t0)).toBe(false);
    const last = { at: new Date(t0.getTime() - VERSION_GAP_MS + 1000).toISOString() };
    expect(needsVersion(a, { ...a, text: 'Zelt' }, last, t0)).toBe(false);
    expect(needsVersion(a, { ...a, text: 'Zelt' }, { at: new Date(t0.getTime() - VERSION_GAP_MS).toISOString() }, t0)).toBe(true);
  });
  it(`at most ${VERSION_KEEP}, newest first; «force» keeps the state before putting one back`, async () => {
    const db = fakeDb();
    let note = { id: 'n1', text: 'v0' };
    for (let i = 1; i <= VERSION_KEEP + 3; i++) {
      const next = { ...note, text: `v${i}` };
      await keepVersion(db, note, next, new Date(Date.UTC(2026, 9, 1, i)));
      note = next;
    }
    const rows = await versionsOf(db, 'n1');
    expect(rows.length).toBe(VERSION_KEEP);
    expect(rows[0].v.text).toBe(`v${VERSION_KEEP + 2}`);
    expect(pruneVersions(rows, 2).drop.length).toBe(VERSION_KEEP - 2);
    const at = new Date(Date.UTC(2026, 9, 1, VERSION_KEEP + 3, 1));
    expect(await keepVersion(db, note, null, at, { force: true })).toMatchObject({ v: { text: note.text } });
    expect(await keepVersion(db, note, null, at, { force: true })).toBe(null); // the newest is the same
  });
});

describe('reminder on a note', () => {
  it('a day and a time, not when done; it goes to the phone only with «Note reminders» on', () => {
    expect(noteRemind({ remind: { at: '2026-10-23T17:00' } })).toEqual({ day: '2026-10-23', hm: '17:00' });
    expect(noteRemind({ remind: { at: '2026-10-23T17:00', done: true } })).toBe(null);
    expect(noteRemind({ remind: { at: '2026-10-23' } })).toBe(null);
    expect(noteRemind({})).toBe(null);
    expect(KINDS.some((k) => k.key === 'note')).toBe(true);
    const notes = [{ id: 'n1', title: 'test_data_gtp_ Schlauch kaufen', remind: { at: '2026-10-23T17:00' } }, { id: 'n2', text: '# Velo\nmehr', remind: { at: '2026-10-24T08:00' } }, { id: 'n3', text: 'x', remind: { at: '2026-10-24T08:00', done: true } }];
    const now = new Date(2026, 9, 21, 9, 0);
    const off = buildList({ notes, settings: { push: { on: true, kinds: {} } }, now });
    expect(off.items.filter((i) => i.key.startsWith('note:'))).toEqual([]);
    const on = buildList({ notes, settings: { push: { on: true, kinds: { note: true } } }, now });
    const items = on.items.filter((i) => i.key.startsWith('note:'));
    expect(items.map((i) => [i.body, i.url])).toEqual([
      ['test_data_gtp_ Schlauch kaufen', '#/notes?open=n1'],
      ['Velo', '#/notes?open=n2'],
    ]);
    expect(items[0].at).toBe(new Date(2026, 9, 23, 17, 0).getTime());
  });
});
