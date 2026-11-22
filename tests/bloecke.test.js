// «Block-Knöpfe» (Noah 21.11.2026 «a»): the block size per sport, the last choice, the standard blocks. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { BLOCKS_KEY, COUNTS, standardBlock, cleanCount, blocksMap, blockFor, blockChips, countOf, withBlockSize, withLast, readBlocks, saveBlockSize, rememberBlocks, restoreBlocks } from '../src/lib/flow/bloecke.js';
import DE from '../src/lib/i18n/de/index.js';

describe('the standard blocks (Noah 21.11.2026)', () => {
  it('sauna is 12 minutes, running indoors is 10 minutes with two blocks marked', () => {
    expect(standardBlock({ id: 'sauna', name: 'Sauna' })).toEqual({ size: 12, count: 1 });
    for (const name of ['Laufen indoor', 'Rennen indoor', 'Indoor running', 'Laufband', 'Treadmill']) expect(standardBlock({ id: 'x', name })).toEqual({ size: 10, count: 2 });
  });
  it('other sports have no blocks until you set them', () => {
    expect(standardBlock({ id: 'tennis', name: 'Tennis' })).toBeNull();
    expect(blockFor({}, 'tennis')).toEqual({ size: 0, count: 0, own: false });
  });
});

describe('the blocks of a sport', () => {
  const sauna = { id: 'sauna', name: 'Sauna' };
  it('the standard counts without a setting', () => {
    expect(blockFor({}, 'sauna', sauna)).toEqual({ size: 12, count: 1, own: false });
    expect(blockFor(undefined, 'run', { id: 'run', name: 'Laufen indoor' })).toEqual({ size: 10, count: 2, own: false });
  });
  it('your own size wins and any sport can have one', () => {
    const map = { sauna: { size: 15 }, tennis: { size: 30, last: 3 } };
    expect(blockFor(map, 'sauna', sauna)).toEqual({ size: 15, count: 1, own: true });
    expect(blockFor(map, 'tennis', { id: 'tennis', name: 'Tennis' })).toEqual({ size: 30, count: 3, own: true });
  });
  it('the last choice is marked', () => {
    expect(blockFor({ sauna: { last: 3 } }, 'sauna', sauna)).toEqual({ size: 12, count: 3, own: false });
  });
  it('the buttons are one to four blocks', () => {
    expect(blockChips(12)).toEqual([{ n: 1, min: 12 }, { n: 2, min: 24 }, { n: 3, min: 36 }, { n: 4, min: 48 }]);
    expect(blockChips(0)).toEqual([]);
    expect(COUNTS).toEqual([1, 2, 3, 4]);
    expect(countOf(12, 36)).toBe(3);
    expect(countOf(12, 40)).toBe(0);
  });
  it('rubbish in the setting is ignored', () => {
    expect(blocksMap({ a: { size: 12, last: 2 }, b: { size: 0 }, c: { last: 9 }, d: 'x', e: { size: 99999 }, f: null })).toEqual({ a: { size: 12, last: 2 }, e: { size: 1440 } });
    expect(blocksMap(null)).toEqual({});
    expect(blocksMap([1])).toEqual({});
    expect(cleanCount(5)).toBe(0);
    expect(cleanCount('2')).toBe(2);
  });
  it('withBlockSize and withLast leave the input alone and clean up', () => {
    const before = { sauna: { size: 15, last: 2 } };
    expect(withBlockSize(before, 'sauna', 0)).toEqual({ sauna: { last: 2 } });
    expect(withBlockSize(withBlockSize(before, 'sauna', 0), 'sauna', 0)).toEqual({ sauna: { last: 2 } });
    expect(withLast({ sauna: { last: 2 } }, 'sauna', 0)).toEqual({});
    expect(withLast(before, 'tennis', 4)).toEqual({ sauna: { size: 15, last: 2 }, tennis: { last: 4 } });
    expect(before).toEqual({ sauna: { size: 15, last: 2 } });
  });
});

describe('the setting in the database (backup, no schema change)', () => {
  it('saves, remembers, and puts back', async () => {
    const db = createDb(`blocks-${Math.random()}`);
    expect(await readBlocks(db)).toEqual({});
    const before = await saveBlockSize(db, 'sauna', 15);
    expect(before).toEqual({});
    await rememberBlocks(db, 'sauna', 3);
    expect(await readBlocks(db)).toEqual({ sauna: { size: 15, last: 3 } });
    expect((await db.settings.get(BLOCKS_KEY)).value).toEqual({ sauna: { size: 15, last: 3 } });
    await restoreBlocks(db, before);
    expect(await db.settings.get(BLOCKS_KEY)).toBeUndefined();
  });
});

describe('German', () => {
  it('has every text of the buttons', () => {
    for (const k of ['{n} × {size} min', 'Change block', 'In blocks', 'One block lasts', 'No blocks']) expect(DE[k], k).toBeTruthy();
  });
});

describe('the backup (check with a copy, Noah rule 3)', () => {
  it('the setting travels in the backup and an older copy without it gives the standard blocks', async () => {
    const { buildBackup, restoreBackup, validateBackup } = await import('../src/lib/backup.js');
    const a = createDb('blocks-backup-a');
    await saveBlockSize(a, 'sauna', 15);
    await rememberBlocks(a, 'sauna', 3);
    const copy = JSON.parse(JSON.stringify(await buildBackup(a)));
    expect(validateBackup(copy)).toEqual([]);
    expect(copy.tables.settings.some((r) => r.key === BLOCKS_KEY && r.value.sauna.size === 15)).toBe(true);
    const b = createDb('blocks-backup-b');
    await restoreBackup(b, copy, 'replace');
    expect(await readBlocks(b)).toEqual({ sauna: { size: 15, last: 3 } });
    // an older copy: the same file without the setting
    const old = JSON.parse(JSON.stringify(copy));
    old.tables.settings = old.tables.settings.filter((r) => r.key !== BLOCKS_KEY);
    const c = createDb('blocks-backup-c');
    await restoreBackup(c, old, 'replace');
    expect(await readBlocks(c)).toEqual({});
    expect(blockFor(await readBlocks(c), 'sauna', { id: 'sauna', name: 'Sauna' }).size).toBe(12);
  });
});
