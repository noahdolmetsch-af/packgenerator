// «Verbesserungs-Logbuch» L5 (Noah 22.11.2026 «1a 2a 3a 4a 5a»), step 1: the kinds and groups as a list the user can rename and order.
// The setting goes into the backup and stays out of the device sync; old entries stay valid (the keys do not change).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, syncLocal } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';
import { checkBackup } from '../src/lib/backupcheck.js';
import { KINDS_KEY, NO_GROUP, DEFAULT_KINDS, normalizeKinds, removeArt, removeGroup, hasArt, groupList, artList, routeOfArt, groupOfArt, artName, groupName, renameArt, renameGroup, moveArt, moveGroup, isStandard, NAME_MAX } from '../src/lib/logbuch/kinds.js';
import { GROUPS, ARTS, makeEntry, changeEntry, filterEntries, counts, reassignEntries } from '../src/lib/logbuch/logbuch.js';
import { addEntry, updateEntry, loadKinds, saveKinds, deleteKind, deleteGroup, restoreKinds, addAutoError } from '../src/lib/logbuch/logbuchdb.js';
import { artLabel, groupLabel } from '../src/lib/logbuch/words.js';

const at = (iso) => new Date(iso);
let n = 0;
let db;
beforeEach(() => {
  db = createDb(`logbuch-kinds-${++n}`);
});

describe('the first version', () => {
  it('is the 13 kinds in 4 groups of today, nothing renamed', () => {
    expect(groupList(DEFAULT_KINDS)).toEqual(GROUPS);
    expect(artList(DEFAULT_KINDS)).toEqual(ARTS);
    expect(isStandard(DEFAULT_KINDS)).toBe(true);
    expect(routeOfArt('gutso')).toBe('note');
    expect(routeOfArt('fehler')).toBe('direct');
    expect(routeOfArt('layout')).toBe('draft');
    expect(groupOfArt('idee')).toBe('new');
  });
  it('the built-in words come from t(), a name the user typed wins and never goes through t()', () => {
    expect(artLabel('fehler')).toBeTruthy();
    const cfg = renameArt(DEFAULT_KINDS, 'fehler', '  Kaputt  ');
    expect(artLabel('fehler', cfg)).toBe('Kaputt');
    expect(artLabel('zahl', cfg)).toBe(artLabel('zahl'));
    expect(groupLabel('wrong', renameGroup(cfg, 'wrong', 'Schlecht'))).toBe('Schlecht');
  });
});

describe('rename and order', () => {
  it('an empty name gives the built-in word back; a long name is cut', () => {
    const named = renameArt(DEFAULT_KINDS, 'text', 'Wort');
    expect(artName(named, 'text')).toBe('Wort');
    expect(artName(renameArt(named, 'text', '   '), 'text')).toBe(null);
    expect(isStandard(renameArt(named, 'text', ''))).toBe(true);
    expect(artName(renameArt(DEFAULT_KINDS, 'text', 'x'.repeat(100)), 'text')).toHaveLength(NAME_MAX);
    expect(groupName(renameGroup(DEFAULT_KINDS, 'new', 'Neues'), 'new')).toBe('Neues');
  });
  it('a kind moves inside its group, a group moves among the groups; nothing is lost', () => {
    const a = moveArt(DEFAULT_KINDS, 'wrong', 0, 2);
    expect(groupList(a)[0].arts).toEqual(['zahl', 'langsam', 'fehler']);
    expect(artList(a).slice().sort()).toEqual(ARTS.slice().sort());
    const g = moveGroup(DEFAULT_KINDS, 3, 0);
    expect(g.groups.map((x) => x.key)).toEqual(['new', 'wrong', 'clear', 'build']);
    expect(moveArt(DEFAULT_KINDS, 'wrong', 5, 0)).toEqual(DEFAULT_KINDS); // out of range: nothing happens
    expect(isStandard(a)).toBe(false);
  });
  it('the way of a kind stays what the kind was: a renamed kind keeps its way and its group', () => {
    const cfg = renameArt(moveArt(DEFAULT_KINDS, 'build', 3, 0), 'wegdamit', 'Raus');
    expect(routeOfArt('wegdamit', cfg)).toBe('draft');
    expect(groupOfArt('wegdamit', cfg)).toBe('build');
  });
});

describe('a stored value is made safe', () => {
  it('nothing or nonsense gives the first version', () => {
    for (const v of [undefined, null, 5, 'x', {}, { groups: 'x' }]) expect(normalizeKinds(v)).toEqual(DEFAULT_KINDS);
  });
  it('doubled keys, odd keys and odd ways are dropped', () => {
    const v = normalizeKinds({ groups: [{ key: 'a', name: 'A', arts: [{ key: 'x', route: 'direct' }, { key: 'x' }, { key: 'BAD KEY' }, { key: 'y', route: 'nonsense', name: '   ' }] }, { key: 'a' }, { key: '' }, null] });
    expect(v.groups).toEqual([{ key: 'a', name: 'A', arts: [{ key: 'x', name: null, route: 'direct' }, { key: 'y', name: null, route: null }] }]);
  });
  it('a kind the user made has the way «draft» when none is chosen (L5 4a)', () => {
    const v = normalizeKinds({ groups: [{ key: 'mine', arts: [{ key: 'neu-1' }, { key: 'neu-2', route: 'note' }] }] });
    expect(routeOfArt('neu-1', v)).toBe('draft');
    expect(routeOfArt('neu-2', v)).toBe('note');
  });
});

describe('the entries follow the list, not the other way round', () => {
  it('an entry of a renamed or moved kind stays valid; the filter and the counts follow the groups', () => {
    const cfg = moveArt(DEFAULT_KINDS, 'wrong', 0, 1);
    const e = makeEntry({ art: 'fehler', text: 'Knopf kaputt', now: new Date('2026-11-22T10:00:00Z'), cfg });
    expect(e.art).toBe('fehler');
    expect(filterEntries([e], 'wrong', cfg)).toHaveLength(1);
    expect(counts([e], cfg).wrong).toBe(1);
    expect(counts([e]).wrong).toBe(1);
  });
  it('a kind that is not in the list is refused; a kind with the way «note» has no urgency', () => {
    const cfg = normalizeKinds({ groups: [{ key: 'g', arts: [{ key: 'merk', route: 'note' }, { key: 'fehler' }] }] });
    expect(makeEntry({ art: 'idee', text: 'x', cfg })).toBe(null);
    const note = makeEntry({ art: 'merk', text: 'x', urgent: 'now', cfg });
    expect(note).toMatchObject({ urgent: null, state: 'noted', route: 'note' });
    const e = makeEntry({ art: 'fehler', text: 'x', cfg });
    expect(changeEntry(e, { art: 'merk' }, cfg)).toMatchObject({ route: 'note', urgent: null, state: 'noted' });
  });
});

describe('storage: the setting', () => {
  it('nothing stored gives the first version; the first version stores nothing', async () => {
    expect(await loadKinds(db)).toEqual(DEFAULT_KINDS);
    await saveKinds(renameArt(DEFAULT_KINDS, 'fehler', 'Kaputt'), db);
    expect(await db.settings.get(KINDS_KEY)).toBeTruthy();
    expect(artName(await loadKinds(db), 'fehler')).toBe('Kaputt');
    await saveKinds(DEFAULT_KINDS, db); // «Back to standard»
    expect(await db.settings.get(KINDS_KEY)).toBeUndefined();
    expect(await loadKinds(db)).toEqual(DEFAULT_KINDS);
  });
  it('addEntry and updateEntry read the list: an entry of a kind that is gone cannot be added', async () => {
    await saveKinds({ groups: [{ key: 'g', name: 'Meine', arts: [{ key: 'fehler', name: 'Kaputt' }] }] }, db);
    expect(await addEntry({ art: 'idee', text: 'x' }, db)).toBe(null);
    const e = await addEntry({ art: 'fehler', text: 'x' }, db);
    expect(e.art).toBe('fehler');
    expect((await updateEntry(e.id, { text: 'y' }, db)).text).toBe('y');
  });
  it('is in the backup, not in the device sync', async () => {
    expect(syncLocal('settings', KINDS_KEY)).toBe(true);
    await saveKinds(renameGroup(moveGroup(DEFAULT_KINDS, 3, 0), 'new', 'Neues'), db);
    const e = await addEntry({ art: 'idee', text: 'mehr Licht', now: new Date('2026-11-22T10:00:00Z') }, db);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.settings.some((r) => r.key === KINDS_KEY)).toBe(true);
    expect(validateBackup(file)).toEqual([]);
    expect(checkBackup(file).ok).toBe(true);
    const other = createDb(`logbuch-kinds-${++n}`);
    await restoreBackup(other, file, 'replace');
    const cfg = await loadKinds(other);
    expect(cfg.groups.map((g) => g.key)).toEqual(['new', 'wrong', 'clear', 'build']);
    expect(groupName(cfg, 'new')).toBe('Neues');
    expect((await other.logbuch.get(e.id)).art).toBe('idee');
  });
});

describe('delete (L5 step 2): nothing is ever deleted but the name', () => {
  it('a kind leaves the list; the others stay', () => {
    const cfg = removeArt(DEFAULT_KINDS, 'zahl');
    expect(hasArt(cfg, 'zahl')).toBe(false);
    expect(artList(cfg)).toHaveLength(12);
    expect(groupList(cfg)[0].arts).toEqual(['fehler', 'langsam']);
  });
  it('a group: its kinds go to the chosen group, or to «No group» that is made at the end', () => {
    const to = removeGroup(DEFAULT_KINDS, 'wrong', 'clear');
    expect(to.groups.map((g) => g.key)).toEqual(['clear', 'build', 'new']);
    expect(groupList(to)[0].arts).toEqual(['text', 'erklaerung', 'hinweis', 'finde', 'fehler', 'zahl', 'langsam']);
    const none = removeGroup(DEFAULT_KINDS, 'wrong', null);
    expect(none.groups.at(-1)).toEqual({ key: NO_GROUP, name: null, arts: [{ key: 'fehler', name: null, route: null }, { key: 'zahl', name: null, route: null }, { key: 'langsam', name: null, route: null }] });
    expect(artList(none).slice().sort()).toEqual(ARTS.slice().sort()); // every kind is still there
    // a second one goes into the same «No group»
    const two = removeGroup(none, 'new', null);
    expect(two.groups.filter((g) => g.key === NO_GROUP)).toHaveLength(1);
    expect(artList(two)).toHaveLength(13);
  });
  it('odd calls change nothing: an unknown group, a group into itself, «No group» into itself', () => {
    expect(removeGroup(DEFAULT_KINDS, 'nope', null)).toBe(DEFAULT_KINDS);
    expect(removeGroup(DEFAULT_KINDS, 'wrong', 'wrong')).toBe(DEFAULT_KINDS);
    const none = removeGroup(DEFAULT_KINDS, 'wrong', null);
    expect(removeGroup(none, NO_GROUP, null)).toBe(none);
    expect(removeGroup(removeGroup(DEFAULT_KINDS, 'wrong', null), 'clear', null).groups.find((g) => g.key === NO_GROUP).arts).toHaveLength(7);
  });
  it('an empty group can go; the entries of a deleted kind move to another kind or stay without one', () => {
    const empty = removeGroup(removeArt(removeArt(removeArt(DEFAULT_KINDS, 'fehler'), 'zahl'), 'langsam'), 'wrong', null);
    expect(empty.groups.map((g) => g.key)).toEqual(['clear', 'build', 'new']);
    const e = makeEntry({ art: 'zahl', text: 'x', urgent: 'now' });
    const after = removeArt(DEFAULT_KINDS, 'zahl');
    expect(reassignEntries([e, makeEntry({ art: 'idee', text: 'y' })], 'zahl', 'idee', after).map((x) => [x.art, x.route])).toEqual([['idee', 'draft']]);
    expect(reassignEntries([e], 'zahl', '', after)[0]).toMatchObject({ art: '', route: 'direct', text: 'x' });
    // into «Gut so» (a note): no urgency, noted
    expect(reassignEntries([e], 'zahl', 'gutso', after)[0]).toMatchObject({ art: 'gutso', urgent: null, state: 'noted' });
  });
});

describe('delete in the database, with Undo, with a backup copy', () => {
  it('deleteKind moves the entries to the chosen kind and Undo brings kind and entries back; photos stay', async () => {
    const a = await addEntry({ art: 'zahl', text: 'a', urgent: 'now', photo: 'data:image/jpeg;base64,AAAA' }, db);
    const b = await addEntry({ art: 'zahl', text: 'b' }, db);
    const c = await addEntry({ art: 'idee', text: 'c' }, db);
    const snap = await deleteKind('zahl', 'idee', db);
    expect(hasArt(await loadKinds(db), 'zahl')).toBe(false);
    expect((await db.logbuch.get(a.id)).art).toBe('idee');
    expect((await db.logbuch.get(a.id)).photo).toBe('data:image/jpeg;base64,AAAA');
    expect((await db.logbuch.get(b.id)).route).toBe('draft');
    expect((await db.logbuch.get(c.id)).art).toBe('idee');
    await restoreKinds(snap, db);
    expect(hasArt(await loadKinds(db), 'zahl')).toBe(true);
    expect(await db.settings.get(KINDS_KEY)).toBeUndefined(); // the first version again: nothing stored
    expect(await db.logbuch.get(a.id)).toMatchObject({ art: 'zahl', route: 'direct', urgent: 'now', photo: 'data:image/jpeg;base64,AAAA' });
    expect((await db.logbuch.get(c.id)).art).toBe('idee');
  });
  it('«Ohne Art»: the entries stay without a kind, can still be changed, and the list counts them in «All»', async () => {
    const a = await addEntry({ art: 'fehler', text: 'a', urgent: 'now' }, db);
    await deleteKind('fehler', '', db);
    const row = await db.logbuch.get(a.id);
    expect(row).toMatchObject({ art: '', route: 'direct', text: 'a' });
    const cfg = await loadKinds(db);
    expect(counts([row], cfg).all).toBe(1);
    expect(filterEntries([row], 'wrong', cfg)).toHaveLength(0);
    const changed = await updateEntry(a.id, { text: 'a2' }, db);
    expect(changed).toMatchObject({ art: '', route: 'direct', text: 'a2' });
    expect(await addEntry({ art: '', text: 'new without kind' }, db)).toBe(null); // a new entry needs a kind
  });
  it('the notes of the app itself still land when «Error» is deleted: without a kind, counted up', async () => {
    await deleteKind('fehler', '', db);
    const one = await addAutoError({ message: 'boom', page: '#/week', now: at('2026-11-22T10:00:00Z') }, db);
    expect(one).toMatchObject({ art: '', source: 'auto', route: 'direct' });
    const two = await addAutoError({ message: 'boom', page: '#/week', now: at('2026-11-22T10:05:00Z') }, db);
    expect(two.id).toBe(one.id);
    expect(two.count).toBe(2);
    expect(await db.logbuch.count()).toBe(1);
  });
  it('deleteGroup keeps every entry and every kind; Undo gives the list back', async () => {
    const e = await addEntry({ art: 'fehler', text: 'x' }, db);
    const snap = await deleteGroup('wrong', null, db);
    const cfg = await loadKinds(db);
    expect(groupOfArt('fehler', cfg)).toBe(NO_GROUP);
    expect((await db.logbuch.get(e.id)).art).toBe('fehler');
    await restoreKinds(snap, db);
    expect(isStandard(await loadKinds(db))).toBe(true);
  });
  it('a backup copy with a deleted kind and entries without a kind loads again and passes «Check the backup»', async () => {
    const a = await addEntry({ art: 'zahl', text: 'a', now: at('2026-11-22T10:00:00Z') }, db);
    await addEntry({ art: 'idee', text: 'c', now: at('2026-11-22T10:01:00Z') }, db);
    await deleteKind('zahl', '', db);
    await deleteGroup('new', null, db);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(validateBackup(file)).toEqual([]);
    expect(checkBackup(file).ok).toBe(true);
    const other = createDb(`logbuch-kinds-${++n}`);
    await restoreBackup(other, file, 'replace');
    const cfg = await loadKinds(other);
    expect(hasArt(cfg, 'zahl')).toBe(false);
    expect(groupOfArt('idee', cfg)).toBe(NO_GROUP);
    expect(await other.logbuch.get(a.id)).toMatchObject({ art: '', text: 'a' });
    const old = await createDb(`logbuch-kinds-${++n}`);
    await restoreBackup(old, { app: 'pack-generator', schemaVersion: 20, tables: { logbuch: [{ id: 'x', art: 'zahl', text: 'old', state: 'open', route: 'direct' }] } }, 'replace'); // a backup without the setting
    expect(await loadKinds(old)).toEqual(DEFAULT_KINDS);
  });
});
