import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { MIN_CHIPS, FEELS, feelId, canSetMinutes, withMinutes, withFeel } from '../src/lib/flow/feel.js';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';

const e = { id: 'fl-1', actId: 'run', day: '2026-11-19', at: '2026-11-19T07:00:00.000Z', n: 1 };

describe('«Haken zuerst»: Dauer und Gefühl auf dem Haken', () => {
  it('the chips are 30, 45, 60, 90 and light, good, hard', () => {
    expect(MIN_CHIPS).toEqual([30, 45, 60, 90]);
    expect(FEELS).toEqual(['light', 'good', 'hard']);
    expect(feelId('good')).toBe('good');
    expect(feelId('7')).toBeNull();
    expect(feelId(7)).toBeNull();
  });
  it('a duration chip sets the minutes, the same one again takes them back, another one replaces them', () => {
    const a = withMinutes(e, 45);
    expect(a).toEqual({ ...e, min: 45 });
    expect(withMinutes(a, 45)).toEqual(e);
    expect(withMinutes(a, 60)).toEqual({ ...e, min: 60 });
    expect(e.min).toBeUndefined(); // never changes the entry given
  });
  it('nonsense minutes change nothing but take the old ones away', () => {
    expect(withMinutes({ ...e, min: 30 }, 0)).toEqual(e);
    expect(withMinutes(e, 'x')).toEqual(e);
  });
  it('a feeling chip sets the word, the same one again takes it back, an unknown word changes nothing', () => {
    const a = withFeel(e, 'hard');
    expect(a).toEqual({ ...e, feel: 'hard' });
    expect(withFeel(a, 'hard')).toEqual(e);
    expect(withFeel(a, 'light')).toEqual({ ...e, feel: 'light' });
    expect(withFeel(a, 'tired')).toEqual(a);
  });
  it('minutes and feeling together stay independent', () => {
    expect(withFeel(withMinutes(e, 90), 'good')).toEqual({ ...e, min: 90, feel: 'good' });
    expect(withMinutes(withFeel(e, 'good'), 90)).toEqual({ ...e, min: 90, feel: 'good' });
  });
  it('Strava ticks and the ride to work take no duration chip', () => {
    expect(canSetMinutes(e)).toBe(true);
    expect(canSetMinutes({ ...e, via: 'timer' })).toBe(true);
    expect(canSetMinutes({ ...e, via: 'strava', stravaId: '1' })).toBe(false);
    expect(canSetMinutes({ ...e, via: 'commute' })).toBe(false);
    expect(canSetMinutes(null)).toBe(false);
  });
});

describe('the new field «feel» and the backup', () => {
  it('entries with and without feel survive export → import unchanged, the file stays valid', async () => {
    const db = createDb('feel-a');
    const rows = [{ ...e, id: 'fl-old' }, { ...e, id: 'fl-new', min: 45, feel: 'good' }];
    await db.flowLog.bulkPut(rows);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(validateBackup(file)).toEqual([]);
    const other = createDb('feel-b');
    await restoreBackup(other, file, 'replace');
    expect((await other.flowLog.orderBy('id').toArray()).map((r) => r)).toEqual([...rows].sort((a, b) => a.id.localeCompare(b.id)));
    expect((await other.flowLog.get('fl-old')).feel).toBeUndefined();
    expect((await other.flowLog.get('fl-new')).feel).toBe('good');
  });
  it('an old backup without any feel restores as it was', async () => {
    const db = createDb('feel-c');
    const file = { app: 'pack-generator', schemaVersion: 1, tables: { flowLog: [{ ...e, id: 'fl-x', min: 20 }] } };
    await restoreBackup(db, file, 'replace');
    expect(await db.flowLog.get('fl-x')).toEqual({ ...e, id: 'fl-x', min: 20 });
  });
});
