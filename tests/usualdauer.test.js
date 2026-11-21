// «Übliche Dauer» (Noah 21.11.2026 «2b», S1): the setting per sport, standard 60 min, never mixed with minMin.
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { USUAL_KEY, DEFAULT_MIN, cleanMin, usualMap, usualFor, withUsual, readUsual, saveUsual, restoreUsual } from '../src/lib/flow/usualmin.js';
import { normAct } from '../src/lib/flow.js';
import DE from '../src/lib/i18n/de/index.js';

describe('the usual duration of a sport', () => {
  it('without a setting a session counts one hour', () => {
    expect(DEFAULT_MIN).toBe(60);
    expect(usualFor({}, 'run')).toEqual({ min: 60, own: false });
    expect(usualFor(undefined, 'run')).toEqual({ min: 60, own: false });
  });
  it('a set value is used for that sport only', () => {
    const map = { run: 45, yoga: 75 };
    expect(usualFor(map, 'run')).toEqual({ min: 45, own: true });
    expect(usualFor(map, 'yoga').min).toBe(75);
    expect(usualFor(map, 'tennis')).toEqual({ min: 60, own: false });
  });
  it('rubbish in the setting is ignored', () => {
    expect(usualMap({ a: 30, b: 0, c: -5, d: 'x', e: 99999, f: 12.6 })).toEqual({ a: 30, e: 1440, f: 13 });
    expect(usualMap(null)).toEqual({});
    expect(usualMap([30])).toEqual({});
    expect(cleanMin('')).toBe(0);
  });
  it('withUsual sets, resets and leaves the input alone', () => {
    const before = { run: 45 };
    const next = withUsual(before, 'yoga', 30);
    expect(next).toEqual({ run: 45, yoga: 30 });
    expect(before).toEqual({ run: 45 });
    expect(withUsual(next, 'run', 0)).toEqual({ yoga: 30 });
    expect(withUsual(next, 'yoga', '')).toEqual({ run: 45 });
  });
  it('it is not the minimum duration of the timer', () => {
    const act = normAct({ id: 'yoga', name: 'Yoga', minMin: 30 });
    expect(usualFor({}, act.id).min).toBe(60);
    expect(act.minMin).toBe(30);
  });
});

describe('the setting in the database (it goes into the backup with the other settings)', () => {
  it('saves, reads, resets and restores', async () => {
    const db = createDb('usual-1');
    expect(await readUsual(db)).toEqual({});
    const b0 = await saveUsual(db, 'run', 45);
    expect(b0).toEqual({});
    expect(await readUsual(db)).toEqual({ run: 45 });
    expect((await db.settings.get(USUAL_KEY)).value).toEqual({ run: 45 });
    const b1 = await saveUsual(db, 'run', 0);
    expect(b1).toEqual({ run: 45 });
    expect(await db.settings.get(USUAL_KEY)).toBeUndefined();
    await restoreUsual(db, b1);
    expect(await readUsual(db)).toEqual({ run: 45 });
  });
  it('never touches the ticks', async () => {
    const db = createDb('usual-2');
    await db.flowLog.put({ id: 'e1', actId: 'run', day: '2026-11-18', at: '2026-11-18T07:00:00.000Z', n: 1 });
    await saveUsual(db, 'run', 90);
    expect(await db.flowLog.get('e1')).toEqual({ id: 'e1', actId: 'run', day: '2026-11-18', at: '2026-11-18T07:00:00.000Z', n: 1 });
  });
});

describe('the German texts', () => {
  it('«Usual duration» is «Übliche Dauer»', () => {
    expect(DE['Usual duration']).toBe('Übliche Dauer');
  });
});

describe('the backup (check with a copy, Noah rule 3)', () => {
  it('the setting travels in the backup and an older copy without it gives 60 minutes everywhere', async () => {
    const { buildBackup, restoreBackup, validateBackup } = await import('../src/lib/backup.js');
    const a = createDb('usual-backup-a');
    await saveUsual(a, 'run', 45);
    const copy = JSON.parse(JSON.stringify(await buildBackup(a)));
    expect(validateBackup(copy)).toEqual([]);
    expect(copy.tables.settings.some((r) => r.key === USUAL_KEY && r.value.run === 45)).toBe(true);
    const b = createDb('usual-backup-b');
    await restoreBackup(b, copy, 'replace');
    expect(await readUsual(b)).toEqual({ run: 45 });
    // an older copy: the same file without the setting
    const old = JSON.parse(JSON.stringify(copy));
    old.tables.settings = old.tables.settings.filter((r) => r.key !== USUAL_KEY);
    const c = createDb('usual-backup-c');
    await restoreBackup(c, old, 'replace');
    expect(await readUsual(c)).toEqual({});
    expect(usualFor(await readUsual(c), 'run').min).toBe(60);
  });
});
