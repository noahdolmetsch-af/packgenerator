// Paket A (Noah 18.10.2026 «1a»): rename and delete a group on Ich › Dokumente. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { sameGroup, defaultName, renamePatches, deletePatches, groupsAfter } from '../src/lib/docs.js';
import { renameGroup, deleteGroup, undoGroup, prefsOf, DOCS_KEY } from '../src/lib/docs/client.svelte.js';

const doc = (id, group, kind = 'pdf') => ({ id, name: id, kind, group, createdAt: '2026-01-01' });
const list = [doc('a', 'Reisen'), doc('b', 'reisen', 'photo'), doc('c', 'Versicherung'), doc('d', '')];

describe('group helpers', () => {
  it('compares names without case and accents', () => {
    expect(sameGroup('Reisen', ' reisen ')).toBe(true);
    expect(sameGroup('Reisen', 'Reise')).toBe(false);
  });
  it('reads the own name of a default group', () => {
    expect(defaultName('pdf', { pdf: ' Scans ' })).toBe('Scans');
    expect(defaultName('photo', { pdf: 'Scans' })).toBeNull();
    expect(defaultName('pdf', undefined)).toBeNull();
  });
  it('renames every document of the group, none other', () => {
    const p = renamePatches(list, 'Reisen', 'Ferien');
    expect(p.map((x) => x.id)).toEqual(['a', 'b']);
    expect(p.every((x) => x.after === 'Ferien')).toBe(true);
    expect(renamePatches(list, 'Reisen', '  ')).toEqual([]);
  });
  it('a delete moves the documents to the default group', () => {
    expect(deletePatches(list, 'Versicherung')).toEqual([{ id: 'c', before: 'Versicherung', after: '' }]);
    expect(deletePatches(list, '')).toEqual([]);
  });
  it('keeps the empty groups without doubles', () => {
    expect(groupsAfter(['Reisen', 'Leer'], 'Reisen', 'Leer')).toEqual(['Leer']);
    expect(groupsAfter(['Reisen', 'Leer'], 'Leer')).toEqual(['Reisen']);
  });
});

let n = 0;
let db;
beforeEach(async () => {
  db = createDb(`docgroups-${++n}`);
  await db.docs.bulkPut(list);
  await db.settings.put({ key: DOCS_KEY, value: { groups: ['Leer'] } });
});
const groupOfId = async (id) => (await db.docs.get(id)).group;
const prefs = async () => prefsOf((await db.settings.get(DOCS_KEY))?.value);

describe('rename, delete and undo in the database', () => {
  it('renames an own group and undoes it', async () => {
    const u = await renameGroup({ kind: 'own', name: 'Reisen' }, 'Ferien', { db });
    expect([await groupOfId('a'), await groupOfId('b'), await groupOfId('c')]).toEqual(['Ferien', 'Ferien', 'Versicherung']);
    await undoGroup(u, { db });
    expect([await groupOfId('a'), await groupOfId('b')]).toEqual(['Reisen', 'reisen']);
  });
  it('a default group only gets its own name; the key stays', async () => {
    const u = await renameGroup({ kind: 'pdf', name: '' }, 'Scans', { db });
    expect((await prefs()).names).toEqual({ pdf: 'Scans' });
    expect(await groupOfId('d')).toBe('');
    await renameGroup({ kind: 'pdf', name: '' }, '', { db });
    expect((await prefs()).names).toEqual({});
    await undoGroup(u, { db });
    expect((await prefs()).groups).toEqual(['Leer']);
  });
  it('deletes a group, keeps every document, and undoes it', async () => {
    const u = await deleteGroup({ kind: 'own', name: 'Reisen' }, { db });
    expect(await db.docs.count()).toBe(4);
    expect([await groupOfId('a'), await groupOfId('b')]).toEqual(['', '']);
    await undoGroup(u, { db });
    expect([await groupOfId('a'), await groupOfId('b')]).toEqual(['Reisen', 'reisen']);
    expect(await deleteGroup({ kind: 'pdf', name: '' }, { db })).toBeNull();
  });
  it('deletes an empty kept group', async () => {
    const u = await deleteGroup({ kind: 'own', name: 'Leer' }, { db });
    expect((await prefs()).groups).toEqual([]);
    await undoGroup(u, { db });
    expect((await prefs()).groups).toEqual(['Leer']);
  });
});
