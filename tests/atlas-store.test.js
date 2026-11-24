// «Rennatlas»: the race list stays in the app; a new file keeps the stars and the saved filters.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/lib/db.js';
import { rowOf, keyOf } from '../src/lib/race/atlas.js';
import { newFilter } from '../src/lib/race/atlas-view.js';
import { ATLAS_KEY, loadAtlas, putAtlas, markRace, saveFilter, renameFilter, deleteFilter, savedIdOf } from '../src/lib/race/atlas-store.js';

const rows = (list) => list.map(rowOf);
const get = async () => (await db.settings.get(ATLAS_KEY))?.value ?? null;

beforeEach(async () => {
  await db.settings.delete(ATLAS_KEY);
});

describe('the stored race list', () => {
  it('stores the rows and gives back the record before (for Undo)', async () => {
    expect(await loadAtlas({ fileName: 'a.json', asOf: '2026-11-24', rows: rows([{ name: 'A', date: '2027-05-01' }]) })).toBeNull();
    const before = await loadAtlas({ fileName: 'b.json', asOf: '2026-11-25', rows: rows([{ name: 'B', date: '2027-06-01' }]) });
    expect(before.fileName).toBe('a.json');
    expect((await get()).rows.map((r) => r.name)).toEqual(['B']);
    await putAtlas(before);
    expect((await get()).fileName).toBe('a.json');
    await putAtlas(null);
    expect(await get()).toBeNull();
  });

  it('keeps the stars, the registered marks and the saved filters when a newer file comes', async () => {
    await loadAtlas({ fileName: 'a.json', asOf: '2026-11-24', rows: rows([{ name: 'A', date: '2027-05-01' }, { name: 'B', date: '2027-06-01' }]) });
    await markRace(keyOf(rowOf({ name: 'A', date: '2027-05-01' })), { fav: true, registered: true });
    await saveFilter('Alpen', { ...newFilter(), land: ['Schweiz'] });
    await loadAtlas({ fileName: 'b.json', asOf: '2026-12-01', rows: rows([{ name: 'A', date: '2027-05-01', km: 300 }, { name: 'C', date: '2027-07-01' }]) });
    const v = await get();
    const a = v.rows.find((r) => r.name === 'A');
    expect([a.fav, a.registered, a.km]).toEqual([true, true, 300]);
    expect(v.rows.find((r) => r.name === 'C').fav).toBe(false);
    expect(v.saved.map((s) => s.name)).toEqual(['Alpen']);
  });

  it('marks one race by its key and leaves the others', async () => {
    await loadAtlas({ fileName: 'a.json', asOf: '2026-11-24', rows: rows([{ name: 'A', date: '2027-05-01' }, { name: 'B', date: '2027-06-01' }]) });
    await markRace(keyOf(rowOf({ name: 'B', date: '2027-06-01' })), { fav: true });
    expect((await get()).rows.map((r) => r.fav)).toEqual([false, true]);
  });
});

describe('saved filters', () => {
  beforeEach(() => loadAtlas({ fileName: 'a.json', asOf: '2026-11-24', rows: rows([{ name: 'A' }]) }));
  it('saves under a name, finds it again, renames and deletes it', async () => {
    const f = { ...newFilter(), land: ['Italien'], dmin: 3, show: 'fav' };
    await saveFilter('  Italien kurz  ', f);
    const [s] = (await get()).saved;
    expect(s.name).toBe('Italien kurz');
    expect(s.filter.show).toBe('all');
    expect(savedIdOf((await get()).saved, { ...f, show: 'registered' })).toBe(s.id);
    expect(savedIdOf((await get()).saved, newFilter())).toBe('');
    await renameFilter(s.id, 'Italien');
    expect((await get()).saved[0].name).toBe('Italien');
    await renameFilter(s.id, '   ');
    expect((await get()).saved[0].name).toBe('Italien');
    await deleteFilter(s.id);
    expect((await get()).saved).toEqual([]);
  });
  it('replaces a filter of the same name and keeps at most 20', async () => {
    await saveFilter('X', { ...newFilter(), land: ['A'] });
    await saveFilter('X', { ...newFilter(), land: ['B'] });
    expect((await get()).saved).toHaveLength(1);
    expect((await get()).saved[0].filter.land).toEqual(['B']);
    for (let i = 0; i < 25; i++) await saveFilter(`F${i}`, { ...newFilter(), land: [`L${i}`] });
    expect((await get()).saved).toHaveLength(20);
    await saveFilter('', newFilter());
    expect((await get()).saved).toHaveLength(20);
  });
});
